import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../services/sales_service.dart';
import '../services/print_service.dart';
import 'pos_screen.dart'; // for CartItem

/// KonfirmasiScreen — Struk / Receipt setelah pembayaran sukses.
///
/// Menerima data cart, total, diskon, dan info pembayaran.
/// Menampilkan struk digital lengkap, lalu:
/// - POST ke API /api/sales
/// - Opsi cetak struk (thermal printer)
/// - Opsi bagikan struk (share PDF)
/// - Tombol Transaksi Baru / Selesai
class KonfirmasiScreen extends StatefulWidget {
  final List<CartItem> cart;
  final int total;
  final int discount;
  final String paymentMethod; // 'CASH' or 'QRIS'
  final int cashPaid;
  final int cashChange;

  const KonfirmasiScreen({
    super.key,
    required this.cart,
    required this.total,
    this.discount = 0,
    required this.paymentMethod,
    this.cashPaid = 0,
    this.cashChange = 0,
  });

  @override
  State<KonfirmasiScreen> createState() => _KonfirmasiScreenState();
}

class _KonfirmasiScreenState extends State<KonfirmasiScreen> {
  final SalesService _salesService = SalesService();
  final PrintService _printService = PrintService();

  bool _saving = true;
  String _invoiceId = '';
  String? _saveError;
  bool _printing = false;

  int get _totalFinal => (widget.total - widget.discount).clamp(0, 999999999);

  @override
  void initState() {
    super.initState();
    _saveTransaction();
  }

  Future<void> _saveTransaction() async {
    // Build items array from cart
    final items = widget.cart.map((item) => {
      'menu_name': item.name,
      'quantity': item.qty,
      'price': item.price,
      'subtotal': item.total,
      'selected_options': _buildOptions(item),
    }).toList();

    final result = await _salesService.createSale(
      items: items,
      paymentMethod: widget.paymentMethod,
      cashPaid: widget.cashPaid,
      cashChange: widget.cashChange,
      discountAmount: widget.discount,
    );

    if (mounted) {
      setState(() {
        _saving = false;
        if (result.isSuccess) {
          _invoiceId = result.invoiceId;
        } else {
          _saveError = result.error;
        }
      });
    }
  }

  String _buildOptions(CartItem item) {
    final parts = <String>[];
    if (item.variant != 'Reguler') parts.add(item.variant);
    if (item.note != null && item.note!.isNotEmpty) parts.add('Catatan: ${item.note}');
    if (item.addons.isNotEmpty) parts.add('Add-on: ${item.addons.join(", ")}');
    return parts.join(' | ');
  }

  Future<void> _printReceipt() async {
    if (_printing) return;
    setState(() => _printing = true);

    try {
      await _printService.printReceipt(
        cart: widget.cart,
        total: _totalFinal,
        discount: widget.discount,
        paymentMethod: widget.paymentMethod,
        cashPaid: widget.cashPaid,
        cashChange: widget.cashChange,
        invoiceId: _invoiceId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Struk berhasil dicetak'),
            backgroundColor: const Color(0xFF16A34A),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            duration: const Duration(seconds: 2),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mencetak: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            duration: const Duration(seconds: 3),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _printing = false);
    }
  }

  Future<void> _shareReceipt() async {
    try {
      await _printService.shareReceipt(
        cart: widget.cart,
        total: _totalFinal,
        discount: widget.discount,
        paymentMethod: widget.paymentMethod,
        cashPaid: widget.cashPaid,
        cashChange: widget.cashChange,
        invoiceId: _invoiceId,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal membagikan: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            duration: const Duration(seconds: 3),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    }
  }

  void _done() {
    // Pop back → CartScreen will clear & go to POS
    Navigator.of(context).pop(true);
  }

  void _newTransaction() {
    // Pop back → CartScreen will clear & go to POS
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateStr = DateFormat('dd MMM yyyy, HH:mm', 'id').format(now);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _Header(onBack: _done),

            // Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Success banner
                  _SuccessBanner(saving: _saving, saveError: _saveError),

                  const SizedBox(height: 12),

                  // Receipt card
                  _ReceiptCard(
                    cart: widget.cart,
                    total: _totalFinal,
                    discount: widget.discount,
                    subtotal: widget.total,
                    paymentMethod: widget.paymentMethod,
                    cashPaid: widget.cashPaid,
                    cashChange: widget.cashChange,
                    invoiceId: _invoiceId,
                    dateStr: dateStr,
                    saving: _saving,
                  ),

                  const SizedBox(height: 12),

                  // Summary chips
                  _SummaryChips(
                    total: _totalFinal,
                    method: widget.paymentMethod,
                    change: widget.cashChange,
                  ),

                  const SizedBox(height: 12),

                  // Action list
                  _ActionList(
                    onPrint: _printing ? null : _printReceipt,
                    onShare: _shareReceipt,
                    printing: _printing,
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),

            // Bottom buttons
            _BottomButtons(
              onNewTransaction: _newTransaction,
              onDone: _done,
            ),

            // Bottom nav
            const _BottomNav(),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  HEADER
// ═══════════════════════════════════════════════
class _Header extends StatelessWidget {
  final VoidCallback onBack;
  const _Header({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE5E7EB))),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: onBack,
                child: Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: const Icon(Icons.arrow_back, color: Color(0xFF475569), size: 20),
                ),
              ),
              const SizedBox(width: 10),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Konfirmasi Pembayaran',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF111827),
                    ),
                  ),
                  Text(
                    'Transaksi berhasil diselesaikan',
                    style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  SUCCESS BANNER
// ═══════════════════════════════════════════════
class _SuccessBanner extends StatelessWidget {
  final bool saving;
  final String? saveError;
  const _SuccessBanner({required this.saving, this.saveError});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(color: Color(0x12000000), blurRadius: 4, offset: Offset(0, 1)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: saveError != null
                  ? const Color(0xFFFEE2E2)
                  : const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Icon(
              saveError != null ? Icons.error_outline : Icons.check,
              color: saveError != null ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  saving
                      ? 'Menyimpan transaksi...'
                      : saveError != null
                          ? 'Gagal menyimpan'
                          : 'Pembayaran Berhasil',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: saveError != null
                        ? const Color(0xFFDC2626)
                        : const Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  saving
                      ? 'Mohon tunggu sebentar'
                      : saveError != null
                          ? saveError!
                          : 'Transaksi telah berhasil diselesaikan',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ),
          if (saving)
            const SizedBox(
              width: 20, height: 20,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  RECEIPT CARD
// ═══════════════════════════════════════════════
class _ReceiptCard extends StatelessWidget {
  final List<CartItem> cart;
  final int total;
  final int discount;
  final int subtotal;
  final String paymentMethod;
  final int cashPaid;
  final int cashChange;
  final String invoiceId;
  final String dateStr;
  final bool saving;

  const _ReceiptCard({
    required this.cart,
    required this.total,
    required this.discount,
    required this.subtotal,
    required this.paymentMethod,
    required this.cashPaid,
    required this.cashChange,
    required this.invoiceId,
    required this.dateStr,
    required this.saving,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(color: Color(0x0A000000), blurRadius: 4, offset: Offset(0, 1)),
        ],
      ),
      child: Column(
        children: [
          // Store header
          _StoreHeader(),
          _receiptDivider(),

          // Receipt label
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: const Center(
              child: Text(
                'STRUK PEMBAYARAN',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF6B7280),
                  letterSpacing: 2,
                ),
              ),
            ),
          ),
          _receiptDivider(),

          // Transaction meta
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                _MetaRow(
                  label: 'No. Transaksi',
                  value: saving ? '...' : (invoiceId.isNotEmpty ? invoiceId : '(offline)'),
                ),
                const SizedBox(height: 6),
                _MetaRow(label: 'Tanggal', value: dateStr),
                const SizedBox(height: 6),
                _MetaRow(label: 'Kasir', value: 'POS Mobile'),
              ],
            ),
          ),
          _receiptDivider(),

          // Items
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Header
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text(
                        'ITEM (${cart.length})',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF6B7280),
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(
                      width: 40,
                      child: Text(
                        'Qty',
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF6B7280),
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    SizedBox(
                      width: 80,
                      child: Text(
                        'Subtotal',
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF6B7280),
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Item rows — replace ITEM count in header
                ...cart.asMap().entries.map((e) {
                  final item = e.value;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.name,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF111827),
                                ),
                              ),
                              if (item.variant != 'Reguler')
                                Text(
                                  item.variant,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFF9CA3AF),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        SizedBox(
                          width: 40,
                          child: Text(
                            '${item.qty}',
                            textAlign: TextAlign.right,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        SizedBox(
                          width: 80,
                          child: Text(
                            _fmt(item.total),
                            textAlign: TextAlign.right,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF111827),
                              fontFeatures: [FontFeature.tabularFigures()],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          _receiptDivider(),

          // Totals
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                _TotalsRow(label: 'Subtotal', value: _fmt(subtotal)),
                if (discount > 0) ...[
                  const SizedBox(height: 6),
                  _TotalsRow(
                    label: 'Diskon',
                    value: '-${_fmt(discount)}',
                    color: const Color(0xFF16A34A),
                  ),
                ],
                const SizedBox(height: 2),
                const Divider(color: Color(0xFFE5E7EB)),
                const SizedBox(height: 2),
                _TotalsRow(
                  label: 'Total Pembayaran',
                  value: _fmt(total),
                  bold: true,
                ),
              ],
            ),
          ),
          _receiptDivider(),

          // Payment details
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                _MetaRow(
                  label: 'Metode Pembayaran',
                  value: paymentMethod == 'CASH' ? 'Tunai' : 'QRIS',
                ),
                if (paymentMethod == 'CASH') ...[
                  const SizedBox(height: 6),
                  _MetaRow(label: 'Uang Diterima', value: _fmt(cashPaid)),
                  const SizedBox(height: 6),
                  _MetaRow(
                    label: 'Kembalian',
                    value: _fmt(cashChange),
                    bold: true,
                  ),
                ],
              ],
            ),
          ),

          // Thank you
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: const Column(
              children: [
                Text(
                  '-- TERIMA KASIH --',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9CA3AF),
                    letterSpacing: 2,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Atas kunjungan Anda',
                  style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _receiptDivider() {
    return const Divider(
      height: 1,
      thickness: 1,
      color: Color(0xFFD1D5DB),
      // dashed-like effect via custom painter not needed; solid divider is fine
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

class _StoreHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFE8EDFF),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.store,
              color: Color(0xFF1A3FCB),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'TOKO MAJU JAYA',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                    letterSpacing: 0.5,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Jl. Merdeka No. 123, Jakarta Pusat\nTelp. (021) 1234 5678',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  META ROW
// ═══════════════════════════════════════════════
class _MetaRow extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;

  const _MetaRow({
    required this.label,
    required this.value,
    this.bold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: const Color(0xFF6B7280),
            fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
            color: const Color(0xFF111827),
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════
//  TOTALS ROW
// ═══════════════════════════════════════════════
class _TotalsRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;
  final bool bold;

  const _TotalsRow({
    required this.label,
    required this.value,
    this.color,
    this.bold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: color ?? const Color(0xFF6B7280),
            fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: bold ? 15 : 13,
            fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
            color: color ?? const Color(0xFF111827),
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════
//  SUMMARY CHIPS
// ═══════════════════════════════════════════════
class _SummaryChips extends StatelessWidget {
  final int total;
  final String method;
  final int change;

  const _SummaryChips({
    required this.total,
    required this.method,
    required this.change,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _ChipBox(icon: Icons.receipt_long, label: 'Total Bayar', value: _fmt(total))),
        const SizedBox(width: 8),
        Expanded(child: _ChipBox(icon: Icons.payment, label: 'Metode', value: method == 'CASH' ? 'Tunai' : 'QRIS')),
        const SizedBox(width: 8),
        Expanded(child: _ChipBox(icon: Icons.sync_alt, label: 'Kembalian', value: _fmt(change))),
      ],
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

class _ChipBox extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _ChipBox({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: const [
          BoxShadow(color: Color(0x0A000000), blurRadius: 2, offset: Offset(0, 1)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: const Color(0xFFE8EDFF),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, size: 15, color: const Color(0xFF1A3FCB)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 10, color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 1),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  ACTION LIST
// ═══════════════════════════════════════════════
class _ActionList extends StatelessWidget {
  final VoidCallback? onPrint;
  final VoidCallback? onShare;
  final bool printing;

  const _ActionList({
    this.onPrint,
    this.onShare,
    this.printing = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(color: Color(0x0A000000), blurRadius: 2, offset: Offset(0, 1)),
        ],
      ),
      child: Column(
        children: [
          _ActionItem(
            icon: Icons.print,
            title: 'Cetak Struk',
            subtitle: 'Cetak struk untuk pelanggan',
            onTap: onPrint,
            trailing: printing
                ? const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.chevron_right, color: Color(0xFF9CA3AF), size: 18),
          ),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
          _ActionItem(
            icon: Icons.share,
            title: 'Bagikan Struk',
            subtitle: 'Kirim struk ke pelanggan (WhatsApp, Email, dll)',
            onTap: onShare,
          ),
        ],
      ),
    );
  }
}

class _ActionItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;

  const _ActionItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFFE8EDFF),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 18, color: const Color(0xFF1A3FCB)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                ],
              ),
            ),
            trailing ?? const Icon(Icons.chevron_right, color: Color(0xFF9CA3AF), size: 18),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  BOTTOM BUTTONS
// ═══════════════════════════════════════════════
class _BottomButtons extends StatelessWidget {
  final VoidCallback onNewTransaction;
  final VoidCallback onDone;

  const _BottomButtons({
    required this.onNewTransaction,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: const BoxDecoration(
        color: Color(0xFFF5F6FA),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: onNewTransaction,
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE5E7EB), width: 1.5),
                ),
                child: const Center(
                  child: Text(
                    'Transaksi Baru',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF111827),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: GestureDetector(
              onTap: onDone,
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFF1A3FCB),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Center(
                  child: Text(
                    'Selesai',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
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
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
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
              color: active ? const Color(0xFF1A3FCB) : const Color(0xFF9CA3AF),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                color: active ? const Color(0xFF1A3FCB) : const Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
