import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Base API Service — handles HTTP calls with JWT token management.
///
/// Usage: `ApiService.instance.get('/api/dashboard/stats')`
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  /// Change this to your backend URL.
  /// Railway: https://restoflow-production-fee9.up.railway.app
  /// Lokal:    http://10.0.2.2:3000 (Android emulator)
  ///           http://localhost:3000  (iOS simulator / web)
  static const String baseUrl = 'https://restoflow-production-fee9.up.railway.app';

  String? _token;
  String? _refreshToken;
  bool _isRefreshing = false;

  String? get token => _token;
  bool get isLoggedIn => _token != null;

  // ── Token Management ──

  Future<void> setTokens(String token, String refreshToken) async {
    _token = token;
    _refreshToken = refreshToken;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('refresh_token', refreshToken);
  }

  Future<void> loadTokens() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _refreshToken = prefs.getString('refresh_token');
  }

  Future<void> clearTokens() async {
    _token = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
  }

  // ── HTTP Methods ──

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  /// GET request
  Future<ApiResponse> get(String path) async {
    return _request('GET', path);
  }

  /// POST request with optional body
  Future<ApiResponse> post(String path, {Map<String, dynamic>? body}) async {
    return _request('POST', path, body: body);
  }

  /// PUT request
  Future<ApiResponse> put(String path, {Map<String, dynamic>? body}) async {
    return _request('PUT', path, body: body);
  }

  /// DELETE request
  Future<ApiResponse> delete(String path) async {
    return _request('DELETE', path);
  }

  // ── Core Request Handler ──

  Future<ApiResponse> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool isRetry = false,
  }) async {
    final uri = Uri.parse('$baseUrl$path');

    try {
      http.Response response;

      switch (method) {
        case 'GET':
          response = await http.get(uri, headers: _headers).timeout(
            const Duration(seconds: 15),
          );
          break;
        case 'POST':
          response = await http
              .post(uri, headers: _headers, body: body != null ? jsonEncode(body) : null)
              .timeout(const Duration(seconds: 15));
          break;
        case 'PUT':
          response = await http
              .put(uri, headers: _headers, body: body != null ? jsonEncode(body) : null)
              .timeout(const Duration(seconds: 15));
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: _headers).timeout(
            const Duration(seconds: 15),
          );
          break;
        default:
          return ApiResponse(error: 'Method tidak didukung');
      }

      // Token expired? Try refresh once
      if (response.statusCode == 401 && !isRetry && _refreshToken != null) {
        final refreshed = await _tryRefreshToken();
        if (refreshed) {
          return _request(method, path, body: body, isRetry: true);
        } else {
          await clearTokens();
          return ApiResponse(error: 'Sesi berakhir, silakan login ulang', statusCode: 401);
        }
      }

      return ApiResponse.fromHttpResponse(response);
    } on SocketException {
      return ApiResponse(error: 'Tidak dapat terhubung ke server. Cek koneksi internet.');
    } on http.ClientException {
      return ApiResponse(error: 'Gagal menghubungi server.');
    } catch (e) {
      return ApiResponse(error: 'Terjadi kesalahan: ${e.toString()}');
    }
  }

  /// Try to refresh the access token using refresh token
  Future<bool> _tryRefreshToken() async {
    if (_isRefreshing) return false;
    _isRefreshing = true;

    try {
      final uri = Uri.parse('$baseUrl/api/auth/refresh');
      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'refresh_token': _refreshToken}),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await setTokens(data['token'], data['refresh_token']);
        _isRefreshing = false;
        return true;
      }
    } catch (_) {}

    _isRefreshing = false;
    return false;
  }
}

/// Wrapper untuk response API
class ApiResponse {
  final bool success;
  final Map<String, dynamic>? data;
  final String? error;
  final int? statusCode;

  ApiResponse({this.data, this.error, this.statusCode})
      : success = error == null;

  factory ApiResponse.fromHttpResponse(http.Response response) {
    try {
      final body = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(
          data: body is Map<String, dynamic> ? body : {'data': body},
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse(
          error: body['error'] ?? 'Request gagal (${response.statusCode})',
          statusCode: response.statusCode,
        );
      }
    } catch (_) {
      return ApiResponse(
        error: 'Gagal membaca response (${response.statusCode})',
        statusCode: response.statusCode,
      );
    }
  }
}
