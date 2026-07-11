import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLogin;
  const LoginScreen({super.key, required this.onLogin});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final username = _usernameCtrl.text.trim();
    final password = _passwordCtrl.text;

    if (username.isEmpty || password.isEmpty) {
      _showError('Username dan password wajib diisi');
      return;
    }

    setState(() => _isSubmitting = true);

    final appState = context.read<AppState>();
    appState.setLoginUsername(username);
    appState.setLoginPassword(password);

    // Login Step 1: verify-credentials (mengembalikan shifts + users langsung)
    final success = await appState.doLogin();

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (success) {
      widget.onLogin();
    } else {
      _showError(appState.errorMessage ?? 'Login gagal. Cek username dan password.');
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Container(
      color: Colors.white,
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const SizedBox(height: 48),
              // Logo kecil
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 64, height: 64,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF2563EB).withOpacity(0.25),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.restaurant, color: Colors.white, size: 28),
                    ),
                    const SizedBox(height: 12),
                    const Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(text: 'Pilot', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                          TextSpan(text: 'POS', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF2563EB))),
                        ],
                      ),
                    ),
                    const Text('Restaurant POS System', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              // Welcome text
              const Align(
                alignment: Alignment.centerLeft,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Selamat Datang!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                    SizedBox(height: 4),
                    Text('Masuk ke akun Anda untuk mengakses sistem PilotPOS', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Error message
              if (appState.errorMessage != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(appState.errorMessage!, style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13)),
                      ),
                      GestureDetector(
                        onTap: () => appState.clearError(),
                        child: const Icon(Icons.close, color: Color(0xFF991B1B), size: 16),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              // Username field
              const _Label('Username'),
              const SizedBox(height: 6),
              _RealInputBox(
                controller: _usernameCtrl,
                icon: Icons.person_outline,
                hint: 'Masukkan username',
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),
              // Password field
              const _Label('Password'),
              const SizedBox(height: 6),
              _RealInputBox(
                controller: _passwordCtrl,
                icon: Icons.lock_outline,
                hint: 'Masukkan password',
                isPassword: true,
                obscureText: _obscurePassword,
                onToggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _handleLogin(),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: GestureDetector(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Hubungi admin restoran untuk reset password'),
                        backgroundColor: const Color(0xFF2563EB),
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        margin: const EdgeInsets.all(16),
                      ),
                    );
                  },
                  child: const Text('Lupa password?', style: TextStyle(color: Color(0xFF2563EB), fontSize: 14, fontWeight: FontWeight.w500)),
                ),
              ),
              const SizedBox(height: 20),
              // Login button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFF93C5FD),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 22, height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                        )
                      : const Text('Masuk', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(height: 20),
              // Divider
              Row(
                children: [
                  const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('atau masuk dengan', style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                  ),
                  const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                ],
              ),
              const SizedBox(height: 20),
              // Google button (coming soon)
              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Login dengan Google akan tersedia di update berikutnya'),
                        backgroundColor: const Color(0xFF2563EB),
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        margin: const EdgeInsets.all(16),
                      ),
                    );
                  },
                  icon: _googleIcon(),
                  label: const Text('Lanjutkan dengan Google', style: TextStyle(color: Color(0xFF334155), fontWeight: FontWeight.w500)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text.rich(
                TextSpan(
                  children: [
                    const TextSpan(text: 'Belum punya akun? ', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
                    WidgetSpan(
                      child: GestureDetector(
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Text('Hubungi admin restoran untuk membuat akun baru'),
                              backgroundColor: const Color(0xFF2563EB),
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              margin: const EdgeInsets.all(16),
                            ),
                          );
                        },
                        child: const Text('Daftar Sekarang', style: TextStyle(color: Color(0xFF2563EB), fontSize: 14, fontWeight: FontWeight.w500)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _googleIcon() {
    return SizedBox(
      width: 18, height: 18,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(text, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF334155))),
    );
  }
}

/// Real input box with TextEditingController
class _RealInputBox extends StatelessWidget {
  final TextEditingController controller;
  final IconData icon;
  final String hint;
  final bool isPassword;
  final bool obscureText;
  final VoidCallback? onToggleObscure;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final ValueChanged<String>? onSubmitted;

  const _RealInputBox({
    required this.controller,
    required this.icon,
    required this.hint,
    this.isPassword = false,
    this.obscureText = true,
    this.onToggleObscure,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.done,
    this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 14),
            child: Icon(icon, size: 18, color: const Color(0xFF94A3B8)),
          ),
          Expanded(
            child: TextField(
              controller: controller,
              obscureText: isPassword && obscureText,
              keyboardType: keyboardType,
              textInputAction: textInputAction,
              onSubmitted: onSubmitted,
              style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 14),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
              ),
            ),
          ),
          if (isPassword)
            GestureDetector(
              onTap: onToggleObscure,
              child: Padding(
                padding: const EdgeInsets.only(right: 14),
                child: Icon(
                  obscureText ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  size: 18,
                  color: const Color(0xFF94A3B8),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final blue = Paint()..color = const Color(0xFF4285F4);
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.5), size.width * 0.5, blue);
    final white = Paint()..color = Colors.white;
    canvas.drawRect(Rect.fromLTWH(size.width * 0.25, size.height * 0.25, size.width * 0.5, size.height * 0.15), white);
    canvas.drawRect(Rect.fromLTWH(size.width * 0.25, size.height * 0.45, size.width * 0.5, size.height * 0.3), white);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
