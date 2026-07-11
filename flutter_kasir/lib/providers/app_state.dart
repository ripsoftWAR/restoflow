import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/dashboard_service.dart';

/// Central app state for PilotPOS
class AppState extends ChangeNotifier {
  final ApiService _api = ApiService();
  final AuthService _auth = AuthService();
  final DashboardService _dashboard = DashboardService();

  // ── Auth state ──
  bool _isLoggedIn = false;
  bool get isLoggedIn => _isLoggedIn;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  // ── Selected user (local) ──
  PilotUser _selectedUser = const PilotUser(
    name: 'Kasir Utama',
    role: 'Kasir',
    shift: '09:00 - 23:00',
    seed: 'Kasir1',
    roleColor: 'blue',
  );
  PilotUser get selectedUser => _selectedUser;

  // ── User list dari backend (untuk PilihUserScreen) ──
  List<PilotUser> _users = [];
  List<PilotUser> get users => _users;

  bool _usersLoading = false;
  bool get usersLoading => _usersLoading;

  // ── Auth data dari backend ──
  UserAuthData? _authUser;
  UserAuthData? get authUser => _authUser;

  ShiftData? _activeShift;
  ShiftData? get activeShift => _activeShift;

  List<ShiftData> _availableShifts = [];
  List<ShiftData> get availableShifts => _availableShifts;

  int? _sessionId;
  int? get sessionId => _sessionId;

  // ── PIN state ──
  String _pin = '';
  String get pin => _pin;
  int get pinLength => _pin.length;

  // ── Login form state ──
  String _loginUsername = '';
  String get loginUsername => _loginUsername;

  String _loginPassword = '';
  String get loginPassword => _loginPassword;

  // ── Sync progress ──
  double _syncProgress = 0.0;
  double get syncProgress => _syncProgress;
  bool _syncComplete = false;
  bool get syncComplete => _syncComplete;

  // ── Dashboard data ──
  DashboardStats? _dashboardStats;
  DashboardStats? get dashboardStats => _dashboardStats;

  String _dashboardPeriod = 'today';
  String get dashboardPeriod => _dashboardPeriod;

  void setDashboardPeriod(String period) {
    _dashboardPeriod = period;
    notifyListeners();
    fetchDashboardData();
  }

  final List<TransactionItem> _recentTransactions = [];
  List<TransactionItem> get recentTransactions => _recentTransactions;

  // ── Active screen ──
  int _activeScreen = 0;
  int get activeScreen => _activeScreen;

  // ── Daftar user demo untuk pilih user screen ──
  static const demoUsers = [
    PilotUser(name: 'Kasir Utama', role: 'Kasir', shift: '09:00 - 23:00', seed: 'Kasir1', roleColor: 'blue'),
    PilotUser(name: 'Sarah', role: 'Supervisor', shift: '10:00 - 22:00', seed: 'Sarah', roleColor: 'purple'),
    PilotUser(name: 'Andi', role: 'Manager', shift: '08:00 - 17:00', seed: 'Andi', roleColor: 'orange'),
    PilotUser(name: 'Dewi', role: 'Kasir', shift: '12:00 - 21:00', seed: 'Dewi', roleColor: 'amber'),
  ];

  // ═══════════════════════════════════════
  //  INIT — Cek session tersimpan
  // ═══════════════════════════════════════

  Future<void> init() async {
    await _api.loadTokens();
    if (_api.token != null) {
      final result = await _auth.checkSession();
      if (result.isSuccess) {
        _authUser = result.user;
        _activeShift = result.shift;
        _isLoggedIn = true;
        notifyListeners();
      }
    }
  }

  // ═══════════════════════════════════════
  //  LOGIN FLOW (2-Step)
  // ═══════════════════════════════════════
  //
  // Step 1: verifyCredentials(username, password)
  //   - Memverifikasi username + password
  //   - TIDAK membuat session / token
  //   - Mengembalikan daftar user restoran + shift
  //   - Navigasi ke PilihUserScreen
  //
  // Step 2: doPinLogin() → verifyPin(username, pin, shiftId)
  //   - Verifikasi PIN 6 digit
  //   - Membuat session + JWT token
  //   - Navigasi ke Sync → Dashboard
  // ═══════════════════════════════════════

  void setLoginUsername(String val) {
    _loginUsername = val;
    notifyListeners();
  }

  void setLoginPassword(String val) {
    _loginPassword = val;
    notifyListeners();
  }

  /// Fetch shifts berdasarkan username (public endpoint)
  Future<bool> fetchShifts(String username) async {
    _availableShifts = await _auth.getShiftsByUsername(username);
    notifyListeners();
    return _availableShifts.isNotEmpty;
  }

  /// STEP 1: Verifikasi username + password (NO session created).
  /// Mengembalikan daftar user restoran untuk PilihUserScreen.
  Future<bool> doLogin() async {
    if (_loginUsername.isEmpty || _loginPassword.isEmpty) {
      _errorMessage = 'Username dan password wajib diisi';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    // Step 1: Verify credentials — hanya cek username+password, TIDAK bikin session
    final response = await _auth.verifyCredentials(_loginUsername, _loginPassword);

    _isLoading = false;

    if (response == null) {
      _errorMessage = 'Username atau password salah';
      notifyListeners();
      return false;
    }

    // Simpan data user yang login (untuk referensi)
    _authUser = UserAuthData(
      id: response['user_id'] ?? 0,
      username: response['username'] ?? _loginUsername,
      role: response['role'] ?? 'Kasir',
      nama: response['nama'] ?? _loginUsername,
      restaurantId: response['restaurant_id'] ?? 0,
    );

    // Simpan daftar shift dari response
    _availableShifts = (response['shifts'] as List? ?? [])
        .map((s) => ShiftData.fromJson(s as Map<String, dynamic>))
        .toList();

    // Simpan daftar user restoran untuk PilihUserScreen
    final rawUsers = response['users'] as List? ?? [];
    _users = rawUsers.map<PilotUser>((u) {
      final m = u as Map<String, dynamic>;
      final role = m['role']?.toString() ?? 'Kasir';
      return PilotUser(
        id: m['id'] ?? 0,
        name: m['nama']?.toString() ?? m['username']?.toString() ?? '-',
        role: role,
        shift: '',
        seed: m['username']?.toString() ?? role,
        roleColor: _roleColorFromString(role),
      );
    }).toList();

    _errorMessage = _users.isEmpty ? 'Tidak ada pengguna aktif di restoran ini' : null;
    notifyListeners();
    return _users.isNotEmpty;
  }

  String _roleColorFromString(String role) {
    switch (role.toLowerCase()) {
      case 'manager':
      case 'pemilik':
      case 'owner':
        return 'orange';
      case 'supervisor':
        return 'purple';
      case 'kasir':
      case 'cashier':
        return 'blue';
      default:
        return 'blue';
    }
  }

  /// STEP 2: Verifikasi PIN + buat session + dapatkan JWT.
  /// Dipanggil dari PinScreen setelah user memasukkan 6 digit PIN.
  Future<bool> doPinLogin() async {
    if (_pin.length < 6) return false;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _auth.verifyPin(
      _loginUsername,
      _pin,
      _availableShifts.isNotEmpty ? _availableShifts.first.id : 1,
    );

    _isLoading = false;

    if (result.isSuccess) {
      _authUser = result.user;
      _activeShift = result.shift;
      _sessionId = result.sessionId;
      _isLoggedIn = true;

      // Set selectedUser untuk dashboard
      if (result.user != null) {
        _selectedUser = PilotUser(
          name: result.user!.nama,
          role: result.user!.role,
          shift: result.shift?.displayTime ?? '',
          seed: result.user!.username,
          roleColor: _roleColorFromString(result.user!.role),
        );
      }

      clearPin();
      notifyListeners();

      // Fetch dashboard data di background
      fetchDashboardData();
      return true;
    } else {
      _errorMessage = result.error;
      clearPin();
      notifyListeners();
      return false;
    }
  }

  // ═══════════════════════════════════════
  //  SYNC
  // ═══════════════════════════════════════

  void resetSync() {
    _syncProgress = 0.0;
    _syncComplete = false;
    notifyListeners();
  }

  void updateSyncProgress(double progress) {
    _syncProgress = progress;
    if (progress >= 1.0) _syncComplete = true;
    notifyListeners();
  }

  /// Fetch dashboard data dari backend
  Future<void> fetchDashboardData() async {
    if (!_isLoggedIn) return;

    try {
      // Fetch stats + recent transactions in parallel
      final results = await Future.wait([
        _dashboard.getStats(period: _dashboardPeriod),
        _dashboard.getRecentTransactions(limit: 5),
      ]);

      _dashboardStats = results[0] as DashboardStats?;
      final transactions = results[1] as List<TransactionItem>;

      if (transactions.isNotEmpty) {
        _recentTransactions.clear();
        _recentTransactions.addAll(transactions);
      }

      notifyListeners();
    } catch (e) {
      debugPrint('[Dashboard] fetchDashboardData error: $e');
    }
  }

  /// Fetch daftar user aktif dari backend untuk PilihUserScreen
  /// Endpoint: GET /api/auth/restaurant-users (bisa diakses role apapun)
  Future<void> fetchUsers() async {
    if (!_isLoggedIn) return;

    _usersLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final rawUsers = await _auth.getActiveUsers();

      _users = rawUsers.map<PilotUser>((u) {
        final role = u['role']?.toString() ?? 'Kasir';
        return PilotUser(
          id: u['id'] ?? 0,
          name: u['nama']?.toString() ?? u['username']?.toString() ?? '-',
          role: role,
          shift: '', // shift dikelola terpisah via login
          seed: u['username']?.toString() ?? role,
          roleColor: _roleColorFromString(role),
        );
      }).toList();

      if (_users.isEmpty) {
        _errorMessage = 'Tidak ada pengguna aktif di restoran ini';
      }
    } catch (e) {
      _errorMessage = 'Gagal memuat data pengguna. Periksa koneksi internet.';
      _users = [];
      debugPrint('[fetchUsers] Error: $e');
    }

    _usersLoading = false;
    notifyListeners();
  }

  // ═══════════════════════════════════════
  //  LOGOUT
  // ═══════════════════════════════════════

  Future<void> logout() async {
    await _auth.logout(sessionId: _sessionId);
    _isLoggedIn = false;
    _authUser = null;
    _activeShift = null;
    _sessionId = null;
    _loginUsername = '';
    _loginPassword = '';
    _availableShifts = [];
    _pin = '';
    _syncProgress = 0.0;
    _syncComplete = false;
    _dashboardStats = null;
    _recentTransactions.clear();
    notifyListeners();
  }

  // ═══════════════════════════════════════
  //  NAVIGATION & HELPERS
  // ═══════════════════════════════════════

  void selectUser(PilotUser user) {
    _selectedUser = user;
    _loginUsername = user.seed; // seed = username dari backend
    notifyListeners();
  }

  /// Pilih user lalu fetch shifts — dipanggil dari PilihUserScreen sebelum ke PinScreen
  Future<bool> selectUserAndPrepare(PilotUser user) async {
    _selectedUser = user;
    _loginUsername = user.seed; // seed = username dari backend
    _errorMessage = null;
    notifyListeners();

    // Fetch shifts (non-blocking — doPinLogin sudah ada fallback shift_id=1)
    await fetchShifts(user.seed);
    // Tetap return true meskipun shift kosong — doPinLogin() sudah ada fallback shift_id = 1
    return true;
  }

  void navigateTo(int screen) {
    _activeScreen = screen;
    notifyListeners();
  }

  void addPinDigit(String digit) {
    if (_pin.length < 6) {
      _pin += digit;
      notifyListeners();
    }
  }

  void removePinDigit() {
    if (_pin.isNotEmpty) {
      _pin = _pin.substring(0, _pin.length - 1);
      notifyListeners();
    }
  }

  void clearPin() {
    _pin = '';
    notifyListeners();
  }

  void fillPinDemo() {
    _pin = '123456';
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void restart() {
    _pin = '';
    _syncProgress = 0.0;
    _syncComplete = false;
    _activeScreen = 0;
    _errorMessage = null;
    notifyListeners();
  }
}
