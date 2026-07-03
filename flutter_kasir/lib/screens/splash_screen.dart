import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  final VoidCallback onDone;
  const SplashScreen({super.key, required this.onDone});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _fade = CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _animCtrl.forward();
    Future.delayed(const Duration(milliseconds: 1800), widget.onDone);
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF4F7FF), Colors.white],
          ),
        ),
        child: Stack(
          children: [
            // Blobs
            Positioned(
              top: -40, left: -60,
              child: _Blob(size: 220, color: const Color(0xFFDBE6FE)),
            ),
            Positioned(
              top: 280, right: -80,
              child: _Blob(size: 250, color: const Color(0xFFDBE6FE).withOpacity(0.7)),
            ),
            // Wave bottom
            Positioned(
              bottom: 0, left: 0, right: 0,
              child: CustomPaint(
                size: const Size(double.infinity, 220),
                painter: _WavePainter(),
              ),
            ),
            // Center content
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Logo
                  Container(
                    width: 96, height: 96,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF2563EB).withOpacity(0.3),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.restaurant, color: Colors.white, size: 44),
                  ),
                  const SizedBox(height: 20),
                  const Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(text: 'Pilot', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                        TextSpan(text: 'POS', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Color(0xFF2563EB))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text('Restaurant POS System', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
                  const SizedBox(height: 48),
                  const SizedBox(
                    width: 32, height: 32,
                    child: CircularProgressIndicator(strokeWidth: 3, color: Color(0xFF2563EB)),
                  ),
                  const SizedBox(height: 16),
                  const Text('Memuat data...', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Blob extends StatelessWidget {
  final double size;
  final Color color;
  const _Blob({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 1.0, end: 1.05),
      duration: const Duration(seconds: 6),
      builder: (_, val, __) => Transform.scale(
        scale: val,
        child: Container(width: size, height: size, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      ),
    );
  }
}

class _WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint1 = Paint()..color = const Color(0xFFDBE6FE);
    final paint2 = Paint()..color = const Color(0xFFEEF3FF);

    final path1 = Path()
      ..moveTo(0, size.height * 0.55)
      ..quadraticBezierTo(size.width * 0.3, size.height * 0.2, size.width * 0.5, size.height * 0.45)
      ..quadraticBezierTo(size.width * 0.7, size.height * 0.7, size.width, size.height * 0.3)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path1, paint1);

    final path2 = Path()
      ..moveTo(0, size.height * 0.7)
      ..quadraticBezierTo(size.width * 0.35, size.height * 0.5, size.width * 0.55, size.height * 0.65)
      ..quadraticBezierTo(size.width * 0.75, size.height * 0.8, size.width, size.height * 0.55)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path2, paint2);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
