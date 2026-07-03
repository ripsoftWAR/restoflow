import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class PinScreen extends StatefulWidget {
  final VoidCallback onSuccess;
  const PinScreen({super.key, required this.onSuccess});

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> with SingleTickerProviderStateMixin {
  late AnimationController _shakeCtrl;
  late Animation<double> _shakeAnim;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _shakeAnim = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0, end: -8), weight: 0.15),
      TweenSequenceItem(tween: Tween(begin: -8, end: 8), weight: 0.3),
      TweenSequenceItem(tween: Tween(begin: 8, end: -4), weight: 0.3),
      TweenSequenceItem(tween: Tween(begin: -4, end: 0), weight: 0.25),
    ]).animate(_shakeCtrl);
  }

  @override
  void dispose() {
    _shakeCtrl.dispose();
    super.dispose();
  }

  void _triggerError() {
    _shakeCtrl.forward(from: 0);
    HapticFeedback.heavyImpact();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final user = appState.selectedUser;
    final pinLength = appState.pinLength;

    // Auto-navigate when PIN is complete
    if (pinLength == 6) {
      Future.microtask(() {
        appState.clearPin();
        widget.onSuccess();
      });
    }

    // Trigger shake if there was a previous error
    if (appState.errorMessage != null && appState.errorMessage!.contains('PIN')) {
      Future.microtask(() {
        _triggerError();
        appState.clearError();
      });
    }

    return Container(
      color: Colors.white,
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const SizedBox(height: 48),
              // Logo
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
                          BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.25), blurRadius: 16, offset: const Offset(0, 4)),
                        ],
                      ),
                      child: const Icon(Icons.restaurant, color: Colors.white, size: 28),
                    ),
                    const SizedBox(height: 8),
                    const Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(text: 'Pilot', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                          TextSpan(text: 'POS', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF2563EB))),
                        ],
                      ),
                    ),
                    const Text('Restaurant POS System', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              // Welcome + shield
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Selamat Datang Kembali', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                        SizedBox(height: 4),
                        Text('Masukkan PIN Anda', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                        SizedBox(height: 4),
                        Text('Gunakan PIN 6 digit untuk masuk', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                      ],
                    ),
                  ),
                  const Icon(Icons.shield_outlined, color: Color(0xFFBFDBFE), size: 48),
                ],
              ),
              const SizedBox(height: 24),
              // PIN dots with shake animation
              AnimatedBuilder(
                animation: _shakeAnim,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(_shakeAnim.value, 0),
                    child: child,
                  );
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(6, (i) {
                    final filled = i < pinLength;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 5),
                      width: 14, height: 14,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: filled ? const Color(0xFF2563EB) : const Color(0xFFCBD5E1), width: 2),
                        color: filled ? const Color(0xFF2563EB) : Colors.transparent,
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 32),
              // Keypad
              _Keypad(
                onDigit: (d) {
                  HapticFeedback.lightImpact();
                  appState.addPinDigit(d);
                },
                onDelete: () {
                  HapticFeedback.selectionClick();
                  appState.removePinDigit();
                },
                onBio: () {
                  HapticFeedback.mediumImpact();
                  appState.fillPinDemo();
                },
              ),
              const SizedBox(height: 20),
              GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('Hubungi admin untuk reset PIN'),
                      backgroundColor: const Color(0xFF2563EB),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      margin: const EdgeInsets.all(16),
                    ),
                  );
                },
                child: const Text('Lupa PIN?', style: TextStyle(color: Color(0xFF2563EB), fontSize: 14, fontWeight: FontWeight.w500)),
              ),
              const SizedBox(height: 20),
              // User card
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14)),
                child: Row(
                  children: [
                    ClipOval(
                      child: Image.network(user.avatarUrl, width: 44, height: 44),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                          Text('Shift: ${user.shift}', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                          const Row(
                            children: [
                              Icon(Icons.store, size: 11, color: Color(0xFF94A3B8)),
                              SizedBox(width: 4),
                              Text('Outlet Jakarta', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                            ],
                          ),
                        ],
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
}

class _Keypad extends StatelessWidget {
  final ValueChanged<String> onDigit;
  final VoidCallback onDelete;
  final VoidCallback onBio;

  const _Keypad({
    required this.onDigit,
    required this.onDelete,
    required this.onBio,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            _KeyBtn(digit: '1', label: '', onTap: () => onDigit('1')),
            _KeyBtn(digit: '2', label: 'ABC', onTap: () => onDigit('2')),
            _KeyBtn(digit: '3', label: 'DEF', onTap: () => onDigit('3')),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _KeyBtn(digit: '4', label: 'GHI', onTap: () => onDigit('4')),
            _KeyBtn(digit: '5', label: 'JKL', onTap: () => onDigit('5')),
            _KeyBtn(digit: '6', label: 'MNO', onTap: () => onDigit('6')),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _KeyBtn(digit: '7', label: 'PQRS', onTap: () => onDigit('7')),
            _KeyBtn(digit: '8', label: 'TUV', onTap: () => onDigit('8')),
            _KeyBtn(digit: '9', label: 'WXYZ', onTap: () => onDigit('9')),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _SpecialKeyBtn(
              child: const Icon(Icons.fingerprint, color: Color(0xFF2563EB), size: 22),
              onTap: onBio,
              bgColor: const Color(0xFFEFF6FF),
            ),
            _KeyBtn(digit: '0', label: '', onTap: () => onDigit('0')),
            _SpecialKeyBtn(
              child: const Icon(Icons.backspace_outlined, color: Color(0xFF2563EB), size: 20),
              onTap: onDelete,
              bgColor: const Color(0xFFEFF6FF),
              onLongPress: () {
                // Haptic feedback
                HapticFeedback.mediumImpact();
              },
            ),
          ],
        ),
      ],
    );
  }
}

class _KeyBtn extends StatelessWidget {
  final String digit;
  final String label;
  final VoidCallback onTap;

  const _KeyBtn({required this.digit, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFF1F5F9)),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 4)],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(digit, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Color(0xFF0F172A))),
                if (label.isNotEmpty)
                  Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SpecialKeyBtn extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final Color bgColor;

  const _SpecialKeyBtn({
    required this.child,
    required this.onTap,
    required this.bgColor,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: GestureDetector(
          onTap: onTap,
          onLongPress: onLongPress,
          child: Container(
            height: 60,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Center(child: child),
          ),
        ),
      ),
    );
  }
}
