import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/app_state.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/sync_screen.dart';
import 'screens/pilih_user_screen.dart';
import 'screens/pin_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/aksi_cepat_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));
  runApp(const PilotPOSApp());
}

class PilotPOSApp extends StatelessWidget {
  const PilotPOSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState()..init(),
      child: MaterialApp(
        title: 'PilotPOS',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorSchemeSeed: const Color(0xFF2563EB),
          brightness: Brightness.light,
          fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
          scaffoldBackgroundColor: const Color(0xFFF8FAFF),
          appBarTheme: const AppBarTheme(
            scrolledUnderElevation: 0,
            backgroundColor: Colors.transparent,
            elevation: 0,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              textStyle: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ),
        home: const MainNavigator(),
      ),
    );
  }
}

/// Manages screen transitions matching the HTML prototype flow
class MainNavigator extends StatefulWidget {
  const MainNavigator({super.key});

  @override
  State<MainNavigator> createState() => _MainNavigatorState();
}

class _MainNavigatorState extends State<MainNavigator> {
  late final PageController _pageController;
  int _currentPage = 0;
  bool _initialized = false;

  // Screen indices
  static const int SPLASH = 0;
  static const int LOGIN = 1;
  static const int SYNC = 2;
  static const int PILIH_USER = 3;
  static const int PIN = 4;
  static const int DASHBOARD = 5;
  static const int AKSI_CEPAT = 6;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: SPLASH);

    // Auto-advance splash after 1.8s
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (!mounted) return;
      _checkSessionAndNavigate();
    });
  }

  /// Cek apakah ada session tersimpan.
  /// Kalau ada → langsung ke dashboard. Kalau tidak → ke login.
  Future<void> _checkSessionAndNavigate() async {
    final appState = context.read<AppState>();

    // Tunggu sebentar biar init() selesai
    await Future.delayed(const Duration(milliseconds: 300));

    if (!mounted) return;

    if (appState.isLoggedIn) {
      // Sudah login → langsung ke dashboard
      appState.resetSync();
      appState.updateSyncProgress(1.0);
      _navigateTo(DASHBOARD);
    } else {
      _navigateTo(LOGIN);
    }

    setState(() => _initialized = true);
  }

  void _navigateTo(int page) {
    if (!mounted) return;
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOut,
    );
    setState(() => _currentPage = page);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          // 0 - Splash
          SplashScreen(onDone: () {
            // Already handled in initState delayed
          }),

          // 1 - Login
          LoginScreen(onLogin: () => _navigateTo(SYNC)),

          // 2 - Sync
          SyncScreen(onDone: () => _navigateTo(PILIH_USER)),

          // 3 - Pilih User
          PilihUserScreen(onSelectUser: () => _navigateTo(PIN)),

          // 4 - PIN
          PinScreen(onSuccess: () => _navigateTo(DASHBOARD)),

          // 5 - Dashboard
          DashboardScreen(
            onAksiCepat: () => _navigateTo(AKSI_CEPAT),
            onPOS: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Mode POS akan tersedia di versi berikutnya'),
                  backgroundColor: const Color(0xFF2563EB),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              );
            },
          ),

          // 6 - Aksi Cepat
          AksiCepatScreen(onBack: () => _navigateTo(DASHBOARD)),
        ],
      ),
    );
  }
}
