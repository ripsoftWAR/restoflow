import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// ═══════════════════════════════════════════════
//  PAYMENT RESULT — data yang dikembalikan ke CartScreen
// ═══════════════════════════════════════════════
class PaymentResult {
  final String method;   // 'CASH' or 'QRIS'
  final int nominal;     // uang yang dibayarkan (CASH) atau 0 (QRIS)
  final int change;      // kembalian (CASH) atau 0 (QRIS)
  final bool success;

  const PaymentResult({
    required this.method,
    this.nominal = 0,
    this.change = 0,
    this.success = true,
  });
}

// ═══════════════════════════════════════════════
//  PAYMENT SCREEN
// ═══════════════════════════════════════════════
class PaymentScreen extends StatefulWidget {
  final int total;
  const PaymentScreen({super.key, required this.total});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

enum _PayMethod { cash, qris }

class _PaymentScreenState extends State<PaymentScreen> {
  _PayMethod _method = _PayMethod.cash;
  final TextEditingController _nominalCtrl = TextEditingController();
  final FocusNode _nominalFocus = FocusNode();
  bool _paid = false;

  // Quick amount chips — generate based on total
  List<int> get _quickAmounts {
    final t = widget.total;
    // Round total up to nearest 50k/100k
    final options = <int>[];
    // Nearest 50k above
    final rounded50 = ((t / 50000).ceil()) * 50000;
    if (rounded50 > t) options.add(rounded50);
    // Nearest 100k above
    final rounded100 = ((t / 100000).ceil()) * 100000;
    if (rounded100 > t && rounded100 != rounded50) options.add(rounded100);
    // Nearest 200k above
    final rounded200 = ((t / 200000).ceil()) * 200000;
    if (rounded200 > t && rounded200 != rounded100) options.add(rounded200);
    // Exact total
    options.add(t);
    return options.toSet().toList()..sort();
  }

  @override
  void dispose() {
    _nominalCtrl.dispose();
    _nominalFocus.dispose();
    super.dispose();
  }

  int? get _nominalValue {
    final text = _nominalCtrl.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (text.isEmpty) return null;
    return int.tryParse(text);
  }

  bool get _canPay {
    final n = _nominalValue;
    return n != null && n >= widget.total;
  }

  int get _change {
    final n = _nominalValue;
    if (n == null) return 0;
    return (n - widget.total).clamp(0, 999999999);
  }

  void _onQuickAmount(int amt) {
    setState(() {
      _nominalCtrl.text = _fmtNumber(amt);
    });
  }

  void _onKeyPress(String key) {
    if (_paid) return;
    setState(() {
      final current = _nominalCtrl.text.replaceAll(RegExp(r'[^0-9]'), '');
      if (key == '⌫') {
        if (current.isNotEmpty) {
          final newVal = current.substring(0, current.length - 1);
          _nominalCtrl.text = newVal.isNotEmpty ? _fmtNumber(int.parse(newVal)) : '';
        }
      } else if (key == 'C') {
        _nominalCtrl.clear();
      } else {
        // Max 9 digit
        if (current.length >= 9) return;
        final newVal = current + key;
        _nominalCtrl.text = _fmtNumber(int.parse(newVal));
      }
    });
  }

  Future<void> _confirmCashPayment() async {
    if (!_canPay || _paid) return;
    setState(() => _paid = true);
    HapticFeedback.mediumImpact();

    final result = PaymentResult(
      method: 'CASH',
      nominal: _nominalValue ?? widget.total,
      change: _change,
      success: true,
    );

    if (mounted) {
      // Brief haptic delay for UX feel
      await Future.delayed(const Duration(milliseconds: 300));
      if (mounted) Navigator.of(context).pop(result);
    }
  }

  Future<void> _confirmQrisPayment() async {
    if (_paid) return;
    setState(() => _paid = true);
    HapticFeedback.mediumImpact();

    final result = const PaymentResult(
      method: 'QRIS',
      nominal: 0,
      change: 0,
      success: true,
    );

    if (mounted) {
      await Future.delayed(const Duration(milliseconds: 300));
      if (mounted) Navigator.of(context).pop(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(total: widget.total),
            _MethodTabs(selected: _method, onSelect: (m) => setState(() => _method = m)),
            Expanded(
              child: _method == _PayMethod.cash ? _buildCash() : _buildQris(),
            ),
          ],
        ),
      ),
    );
  }

  // ── CASH TAB ──
  Widget _buildCash() {
    return Column(
      children: [
        // Total + change preview
        Container(
          width: double.infinity,
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              // Total
              const Text(
                'Total Pembayaran',
                style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 6),
              Text(
                _fmt(widget.total),
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 16),
              Container(height: 1, color: const Color(0xFFE2E8F0)),
              const SizedBox(height: 16),

              // Nominal input
              const Text(
                'Uang Diterima',
                style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _nominalCtrl,
                focusNode: _nominalFocus,
                readOnly: true,
                showCursor: false,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: _canPay ? const Color(0xFF16A34A) : const Color(0xFF0F172A),
                  letterSpacing: -0.3,
                ),
                decoration: InputDecoration(
                  hintText: 'Rp 0',
                  hintStyle: const TextStyle(
                    color: Color(0xFFCBD5E1),
                    fontSize: 28,
                    fontWeight: FontWeight.w400,
                  ),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const SizedBox(height: 12),

              // Quick amounts
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: _quickAmounts.map((amt) {
                  final isActive = _nominalValue == amt;
                  return GestureDetector(
                    onTap: () => _onQuickAmount(amt),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isActive ? const Color(0xFF2563EB) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isActive ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Text(
                        _fmt(amt),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isActive ? Colors.white : const Color(0xFF475569),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              // Change preview
              if (_nominalValue != null && _nominalValue! >= widget.total) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDF4),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF86EFAC)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.sync_alt, color: Color(0xFF16A34A), size: 18),
                      const SizedBox(width: 8),
                      const Text(
                        'Kembalian: ',
                        style: TextStyle(fontSize: 15, color: Color(0xFF16A34A)),
                      ),
                      Text(
                        _fmt(_change),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        const Spacer(),

        // Numpad
        _Numpad(onKey: _onKeyPress),

        // Pay button
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: GestureDetector(
            onTap: _canPay && !_paid ? _confirmCashPayment : null,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: _canPay && !_paid
                    ? const Color(0xFF16A34A)
                    : const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: _paid
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Bayar Sekarang',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── QRIS TAB ──
  Widget _buildQris() {
    return Column(
      children: [
        Expanded(
          child: Center(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // QR placeholder
                  Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.qr_code_2,
                            color: Color(0xFF2563EB),
                            size: 40,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'QRIS Code',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Total
                  const Text(
                    'Total Pembayaran',
                    style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _fmt(widget.total),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Instructions
                  const Text(
                    'Silakan scan QR code di atas\nmenggunakan aplikasi pembayaran',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8), height: 1.5),
                  ),
                ],
              ),
            ),
          ),
        ),

        // Confirm button
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: GestureDetector(
            onTap: _paid ? null : _confirmQrisPayment,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: _paid ? const Color(0xFFCBD5E1) : const Color(0xFF2563EB),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: _paid
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Konfirmasi Pembayaran',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── Formatters ──
  String _fmt(int v) {
    final p = v.toString().split('');
    final b = StringBuffer('Rp');
    for (int i = 0; i < p.length; i++) {
      if (i > 0 && (p.length - i) % 3 == 0) b.write('.');
      b.write(p[i]);
    }
    return b.toString();
  }

  String _fmtNumber(int v) {
    final p = v.toString().split('');
    final b = StringBuffer();
    for (int i = 0; i < p.length; i++) {
      if (i > 0 && (p.length - i) % 3 == 0) b.write('.');
      b.write(p[i]);
    }
    return b.toString();
  }
}

// ═══════════════════════════════════════════════
//  TOP BAR
// ═══════════════════════════════════════════════
class _TopBar extends StatelessWidget {
  final int total;
  const _TopBar({required this.total});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () => Navigator.of(context).pop(null),
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: const Icon(Icons.arrow_back, color: Color(0xFF475569), size: 18),
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Pembayaran',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              // Total badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  _fmt(total),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2563EB),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _fmt(int v) {
    final p = v.toString().split('');
    final b = StringBuffer('Rp');
    for (int i = 0; i < p.length; i++) {
      if (i > 0 && (p.length - i) % 3 == 0) b.write('.');
      b.write(p[i]);
    }
    return b.toString();
  }
}

// ═══════════════════════════════════════════════
//  METHOD TABS
// ═══════════════════════════════════════════════
class _MethodTabs extends StatelessWidget {
  final _PayMethod selected;
  final ValueChanged<_PayMethod> onSelect;
  const _MethodTabs({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Row(
        children: [
          Expanded(child: _Tab(
            icon: Icons.money_outlined,
            label: 'Tunai',
            active: selected == _PayMethod.cash,
            onTap: () => onSelect(_PayMethod.cash),
          )),
          const SizedBox(width: 8),
          Expanded(child: _Tab(
            icon: Icons.qr_code_2,
            label: 'QRIS',
            active: selected == _PayMethod.qris,
            onTap: () => onSelect(_PayMethod.qris),
          )),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _Tab({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF2563EB) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: active ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: active ? Colors.white : const Color(0xFF64748B),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: active ? Colors.white : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  NUMPAD
// ═══════════════════════════════════════════════
class _Numpad extends StatelessWidget {
  final ValueChanged<String> onKey;
  const _Numpad({required this.onKey});

  static const _keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '⌫'],
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: _keys.map((row) {
          return Row(
            children: row.map((key) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: GestureDetector(
                    onTap: () => onKey(key),
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        color: key == 'C' || key == '⌫'
                            ? const Color(0xFFF1F5F9)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Center(
                        child: key == '⌫'
                            ? const Icon(Icons.backspace_outlined,
                                color: Color(0xFF475569), size: 22)
                            : Text(
                                key,
                                style: TextStyle(
                                  fontSize: key == 'C' ? 15 : 22,
                                  fontWeight: key == 'C'
                                      ? FontWeight.w600
                                      : FontWeight.w700,
                                  color: key == 'C'
                                      ? const Color(0xFFEF4444)
                                      : const Color(0xFF0F172A),
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          );
        }).toList(),
      ),
    );
  }
}
