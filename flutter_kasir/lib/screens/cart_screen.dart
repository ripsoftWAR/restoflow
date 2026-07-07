import 'package:flutter/material.dart';

// Reuse CartItem from pos_screen.dart
import 'pos_screen.dart';
import 'payment_screen.dart';
import 'konfirmasi_screen.dart';

class CartScreen extends StatefulWidget {
  final List<CartItem> cart;
  const CartScreen({super.key, required this.cart});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  late List<CartItem> _cart;

  static const int _discountFixed = 5000;
  static const double _taxRate = 0.1;

  @override
  void initState() {
    super.initState();
    _cart = widget.cart.map((i) => CartItem(
      name: i.name,
      price: i.price,
      emoji: i.emoji,
      qty: i.qty,
      note: i.note,
      variant: i.variant,
      addons: List<String>.from(i.addons),
    )).toList();
  }

  int get _subtotal => _cart.fold(0, (s, i) => s + i.total);
  int get _tax => ((_subtotal - _discountFixed) * _taxRate).round();
  int get _total => _subtotal - _discountFixed + _tax;
  int get _itemCount => _cart.fold(0, (s, i) => s + i.qty);

  void _changeQty(int idx, int delta) {
    setState(() {
      _cart[idx].qty = (_cart[idx].qty + delta).clamp(1, 99);
    });
  }

  void _removeItem(int idx) {
    setState(() => _cart.removeAt(idx));
  }

  void _clearCart() {
    setState(() => _cart.clear());
  }

  void _popWithResult() {
    Navigator.of(context).pop(_cart);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(
              onBack: _popWithResult,
              onClear: _cart.isEmpty ? null : _clearCart,
            ),
            Expanded(
              child: _cart.isEmpty ? _buildEmpty() : _buildContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.shopping_cart_outlined, color: Color(0xFFCBD5E1), size: 36),
          ),
          const SizedBox(height: 16),
          const Text(
            'Keranjang kosong',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 4),
          const Text(
            'Tambahkan produk dari menu POS',
            style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 24),
          GestureDetector(
            onTap: _popWithResult,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Kembali ke Produk',
                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Customer selector
              _CustomerRow(),
              const SizedBox(height: 12),

              // Cart items
              ...List.generate(_cart.length, (idx) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _CartItemCard(
                    item: _cart[idx],
                    onIncrease: () => _changeQty(idx, 1),
                    onDecrease: () => _changeQty(idx, -1),
                    onRemove: () => _removeItem(idx),
                  ),
                );
              }),

              // Price summary
              const SizedBox(height: 4),
              _PriceSummary(
                subtotal: _subtotal,
                discount: _discountFixed,
                tax: _tax,
                total: _total,
              ),
              const SizedBox(height: 12),

              // Note
              const _NoteRow(),
              const SizedBox(height: 12),

              // Footer
              _CartFooter(
                total: _total,
                onCheckout: () => _goToPayment(),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),

        // Bottom nav
        const _BottomNav(),
      ],
    );
  }

  Future<void> _goToPayment() async {
    final result = await Navigator.of(context).push<PaymentResult>(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => PaymentScreen(total: _total),
        transitionsBuilder: (_, anim, __, child) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(1, 0),
              end: Offset.zero,
            ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOut)),
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );

    if (result != null && result.success && mounted) {
      // Navigate to confirmation/receipt screen
      final done = await Navigator.of(context).push<bool>(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => KonfirmasiScreen(
            cart: List<CartItem>.from(_cart),
            total: _total,
            discount: _discountFixed,
            paymentMethod: result.method,
            cashPaid: result.nominal,
            cashChange: result.change,
          ),
          transitionsBuilder: (_, anim, __, child) {
            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1, 0),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOut)),
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
        ),
      );

      // After confirmation screen, clear cart and go back to POS
      if (mounted) {
        setState(() => _cart.clear());
        // Small delay so user sees empty cart, then pop
        await Future.delayed(const Duration(milliseconds: 100));
        if (mounted) _popWithResult();
      }
    }
  }
}

// ═══════════════════════════════════════════════
//  TOP BAR
// ═══════════════════════════════════════════════
class _TopBar extends StatelessWidget {
  final VoidCallback onBack;
  final VoidCallback? onClear;
  const _TopBar({required this.onBack, this.onClear});

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
                onTap: onBack,
                child: Container(
                  width: 32, height: 32,
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
                  'Keranjang',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              if (onClear != null)
                GestureDetector(
                  onTap: onClear,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.delete_outline, color: Color(0xFF94A3B8), size: 15),
                        SizedBox(width: 6),
                        Text(
                          'Kosongkan',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          const Padding(
            padding: EdgeInsets.only(left: 44),
            child: Text(
              'Periksa pesanan sebelum bayar',
              style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  CUSTOMER ROW
// ═══════════════════════════════════════════════
class _CustomerRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 38, height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(99),
            ),
            child: const Icon(Icons.person_outline, color: Color(0xFF2563EB), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Pelanggan',
                  style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
                SizedBox(height: 2),
                Text(
                  'Pilih pelanggan (opsional)',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Color(0xFF94A3B8), size: 20),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  CART ITEM CARD
// ═══════════════════════════════════════════════
class _CartItemCard extends StatelessWidget {
  final CartItem item;
  final VoidCallback onIncrease;
  final VoidCallback onDecrease;
  final VoidCallback onRemove;

  const _CartItemCard({
    required this.item,
    required this.onIncrease,
    required this.onDecrease,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product image
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(item.emoji, style: const TextStyle(fontSize: 28)),
            ),
          ),
          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.variant,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
                if (item.note != null && item.note!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    '📝 ${item.note}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                ],
                if (item.addons.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    '➕ ${item.addons.join(", ")}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  _fmt(item.price),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2563EB),
                  ),
                ),
                const SizedBox(height: 8),

                // Qty controls
                Row(
                  children: [
                    GestureDetector(
                      onTap: onDecrease,
                      child: Container(
                        width: 28, height: 28,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: const Icon(Icons.remove, color: Color(0xFF2563EB), size: 16),
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 24,
                      child: Text(
                        '${item.qty}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    GestureDetector(
                      onTap: onIncrease,
                      child: Container(
                        width: 28, height: 28,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: const Icon(Icons.add, color: Color(0xFF2563EB), size: 16),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Right column: delete + total
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              GestureDetector(
                onTap: onRemove,
                child: const Padding(
                  padding: EdgeInsets.all(4),
                  child: Icon(Icons.delete_outline, color: Color(0xFFCBD5E1), size: 18),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _fmt(item.total),
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
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
//  PRICE SUMMARY
// ═══════════════════════════════════════════════
class _PriceSummary extends StatelessWidget {
  final int subtotal;
  final int discount;
  final int tax;
  final int total;

  const _PriceSummary({
    required this.subtotal,
    required this.discount,
    required this.tax,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          _PriceRow(label: 'Subtotal', value: _fmt(subtotal)),
          const SizedBox(height: 10),
          _PriceRow(
            label: 'Diskon',
            value: '-${_fmt(discount)}',
            valueColor: const Color(0xFF16A34A),
          ),
          const SizedBox(height: 10),
          _PriceRow(label: 'Pajak (10%)', value: _fmt(tax)),
          const SizedBox(height: 12),
          Container(height: 1, color: const Color(0xFFE2E8F0)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              Text(
                _fmt(total),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF2563EB),
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

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _PriceRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, color: Color(0xFF64748B))),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: valueColor ?? const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════
//  NOTE ROW
// ═══════════════════════════════════════════════
class _NoteRow extends StatefulWidget {
  const _NoteRow();

  @override
  State<_NoteRow> createState() => _NoteRowState();
}

class _NoteRowState extends State<_NoteRow> {
  final _ctrl = TextEditingController();
  int _charCount = 0;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0), strokeAlign: BorderSide.strokeAlignInside),
      ),
      child: Row(
        children: [
          const Icon(Icons.notes_rounded, color: Color(0xFF94A3B8), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: _ctrl,
              maxLength: 100,
              onChanged: (v) => setState(() => _charCount = v.length),
              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
              decoration: const InputDecoration(
                hintText: 'Catatan untuk pesanan (opsional)',
                hintStyle: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.symmetric(vertical: 12),
                counterText: '',
              ),
            ),
          ),
          Text(
            '$_charCount/100',
            style: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  CART FOOTER
// ═══════════════════════════════════════════════
class _CartFooter extends StatelessWidget {
  final int total;
  final VoidCallback onCheckout;
  const _CartFooter({required this.total, required this.onCheckout});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Fitur voucher akan hadir di update berikutnya'),
                  backgroundColor: const Color(0xFF2563EB),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF2563EB)),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.discount_outlined, color: Color(0xFF2563EB), size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Voucher / Diskon',
                    style: TextStyle(
                      color: Color(0xFF2563EB),
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          flex: 2,
          child: GestureDetector(
            onTap: onCheckout,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.payment_outlined, color: Colors.white, size: 18),
                  const SizedBox(width: 8),
                  const Text(
                    'Lanjut ke Pembayaran',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(Icons.chevron_right, color: Colors.white, size: 16),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════
//  BOTTOM NAV
// ═══════════════════════════════════════════════
class _BottomNav extends StatelessWidget {
  const _BottomNav();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        boxShadow: [
          BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, -2)),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _NavItem(Icons.home, 'Dashboard', false, () {}),
          _NavItem(Icons.shopping_cart_outlined, 'POS', true, () {}),
          _NavItem(Icons.inventory_2_outlined, 'Inventory', false, () {}),
          _NavItem(Icons.bar_chart, 'Laporan', false, () {}),
          _NavItem(Icons.more_horiz, 'Lainnya', false, () {}),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _NavItem(this.icon, this.label, this.active, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: active ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                color: active ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
