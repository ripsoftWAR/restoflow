import 'api_service.dart';

/// Auth Service — handles login, register, PIN login, logout.
class AuthService {
  final ApiService _api = ApiService();

  /// Login dengan username + password + shift_id
  Future<AuthResult> login(String username, String password, int shiftId) async {
    // 1. Sanitasi: trim whitespace saja (backend sudah handle case-insensitive)
    username = username.trim();

    final response = await _api.post('/api/auth/login', body: {
      'username': username,
      'password': password,
      'shift_id': shiftId,
    });

    if (!response.success) {
      return AuthResult(error: response.error ?? 'Login gagal');
    }

    final data = response.data!;
    // Simpan token
    await _api.setTokens(data['token'], data['refresh_token']);

    return AuthResult(
      token: data['token'],
      refreshToken: data['refresh_token'],
      sessionId: data['session_id'],
      user: UserAuthData.fromJson(data['user']),
      shift: ShiftData.fromJson(data['shift']),
      features: (data['features'] as List?)
          ?.map((f) => FeatureFlag.fromJson(f))
          .toList() ?? [],
    );
  }

  /// Login dengan PIN (untuk staff, bukan pemilik)
  Future<AuthResult> loginWithPin(String username, String pin, int shiftId) async {
    username = username.trim();

    final response = await _api.post('/api/auth/login-pin', body: {
      'username': username,
      'pin': pin,
      'shift_id': shiftId,
    });

    if (!response.success) {
      return AuthResult(error: response.error ?? 'PIN login gagal');
    }

    final data = response.data!;
    await _api.setTokens(data['token'], data['refresh_token']);

    return AuthResult(
      token: data['token'],
      refreshToken: data['refresh_token'],
      sessionId: data['session_id'],
      user: UserAuthData.fromJson(data['user']),
      shift: ShiftData.fromJson(data['shift']),
      features: (data['features'] as List?)
          ?.map((f) => FeatureFlag.fromJson(f))
          .toList() ?? [],
    );
  }

  /// Register restoran baru
  Future<AuthResult> register(
    String restaurantName,
    String username,
    String password,
    String role,
  ) async {
    final response = await _api.post('/api/auth/register', body: {
      'restaurant_name': restaurantName,
      'username': username.trim().toLowerCase(),
      'password': password,
      'role': role,
    });

    if (!response.success) {
      return AuthResult(error: response.error ?? 'Registrasi gagal');
    }

    return AuthResult(message: response.data?['message'] ?? 'Registrasi berhasil');
  }

  /// Cek session via token — return user data
  Future<AuthResult> checkSession() async {
    await _api.loadTokens();
    if (_api.token == null) return AuthResult(error: 'Belum login');

    final response = await _api.get('/api/auth/me');

    if (!response.success) {
      await _api.clearTokens();
      return AuthResult(error: response.error ?? 'Sesi tidak valid');
    }

    final data = response.data!;
    return AuthResult(
      user: UserAuthData.fromJson(data['user']),
      shift: ShiftData.fromJson(data['shift']),
    );
  }

  /// Ambil daftar shift berdasarkan username (public endpoint)
  Future<List<ShiftData>> getShiftsByUsername(String username) async {
    username = username.trim();
    final response = await _api.get('/api/auth/shifts-by-username/$username');

    if (!response.success || response.data == null) return [];

    // Response bisa berupa List langsung
    if (response.data is List) {
      return (response.data as List)
          .map((s) => ShiftData.fromJson(s))
          .toList();
    }

    // Atau dibungkus dalam key 'data'?
    return [];
  }

  /// Logout — tutup sesi
  Future<void> logout({int? sessionId}) async {
    await _api.post('/api/auth/logout', body: {
      if (sessionId != null) 'session_id': sessionId,
    });
    await _api.clearTokens();
  }
}

// ── Data Classes ──

class AuthResult {
  final String? token;
  final String? refreshToken;
  final int? sessionId;
  final UserAuthData? user;
  final ShiftData? shift;
  final List<FeatureFlag> features;
  final String? error;
  final String? message;

  AuthResult({
    this.token,
    this.refreshToken,
    this.sessionId,
    this.user,
    this.shift,
    this.features = const [],
    this.error,
    this.message,
  });

  bool get isSuccess => error == null;
}

class UserAuthData {
  final int id;
  final String username;
  final String role;
  final String nama;
  final int restaurantId;

  UserAuthData({
    required this.id,
    required this.username,
    required this.role,
    required this.nama,
    required this.restaurantId,
  });

  factory UserAuthData.fromJson(Map<String, dynamic> json) {
    return UserAuthData(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      role: json['role'] ?? '',
      nama: json['nama'] ?? json['username'] ?? '',
      restaurantId: json['restaurant_id'] ?? 0,
    );
  }
}

class ShiftData {
  final int id;
  final String nama;
  final String? jamMulai;
  final String? jamAkhir;

  ShiftData({
    required this.id,
    required this.nama,
    this.jamMulai,
    this.jamAkhir,
  });

  String get displayTime {
    if (jamMulai != null && jamAkhir != null) {
      return '$jamMulai - $jamAkhir';
    }
    return nama;
  }

  factory ShiftData.fromJson(Map<String, dynamic> json) {
    return ShiftData(
      id: json['id'] ?? 0,
      nama: json['nama'] ?? '',
      jamMulai: json['jam_mulai']?.toString().substring(0, 5),
      jamAkhir: json['jam_akhir']?.toString().substring(0, 5),
    );
  }
}

class FeatureFlag {
  final String featureKey;
  final bool enabled;

  FeatureFlag({required this.featureKey, required this.enabled});

  factory FeatureFlag.fromJson(Map<String, dynamic> json) {
    return FeatureFlag(
      featureKey: json['feature_key'] ?? '',
      enabled: json['enabled'] ?? false,
    );
  }
}
