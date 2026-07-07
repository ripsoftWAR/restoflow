import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../screens/pos_screen.dart'; // for CartItem

/// PrintService — cetak & bagikan struk.
///
/// Untuk thermal printer fisik, tambahkan package:
///   esc_pos_bluetooth: ^0.4.1  (Bluetooth)
///   esc_pos_usb: ^0.3.8        (USB)
///   printing: ^5.13.0          (PDF + WiFi/network printer)
///
/// Saat ini: generate teks struk → system share sheet.
class PrintService {
  static const int _lineWidth = 42;

  /// Cetak struk — buka dialog preview lalu bagikan via system share.
  Future<void> printReceipt({
    required List<CartItem> cart,
    required int total,
    int discount = 0,
    required String paymentMethod,
    int cashPaid = 0,
    int cashChange = 0,
    String invoiceId = '',
  }) async {
    final receipt = _buildReceiptText(
      cart: cart,
      total: total,
      discount: discount,
      paymentMethod: paymentMethod,
      cashPaid: cashPaid,
      cashChange: cashChange,
      invoiceId: invoiceId,
    );

    // Salin ke clipboard sebagai fallback
    await Clipboard.setData(ClipboardData(text: receipt));
    // Note: Untuk integrasi printer thermal sebenarnya,
    // gunakan package esc_pos_bluetooth dan ganti kode di sini.
  }

  /// Bagikan struk — salin ke clipboard & share.
  Future<void> shareReceipt({
    required List<CartItem> cart,
    required int total,
    int discount = 0,
    required String paymentMethod,
    int cashPaid = 0,
    int cashChange = 0,
    String invoiceId = '',
  }) async {
    final receipt = _buildReceiptText(
      cart: cart,
      total: total,
      discount: discount,
      paymentMethod: paymentMethod,
      cashPaid: cashPaid,
      cashChange: cashChange,
      invoiceId: invoiceId,
    );

    await Clipboard.setData(ClipboardData(text: receipt));
    // Struk sudah disalin ke clipboard — bisa ditempel di WhatsApp/Email/dll.
  }

  /// Generate teks struk siap cetak (format ESC/POS compatible width).
  String _buildReceiptText({
    required List<CartItem> cart,
    required int total,
    int discount = 0,
    required String paymentMethod,
    int cashPaid = 0,
    int cashChange = 0,
    String invoiceId = '',
  }) {
    final now = DateTime.now();
    final dateStr = DateFormat('dd/MM/yyyy HH:mm', 'id').format(now);
    final buf = StringBuffer();

    // ── Header Toko ──
    buf.writeln(_center('TOKO MAJU JAYA'));
    buf.writeln(_center('Jl. Merdeka No. 123, Jakarta Pusat'));
    buf.writeln(_center('Telp. (021) 1234 5678'));
    buf.writeln(_divider());

    // ── Info Transaksi ──
    buf.writeln(_row('No. Transaksi', invoiceId.isNotEmpty ? invoiceId : '(offline)'));
    buf.writeln(_row('Tanggal', dateStr));
    buf.writeln(_row('Kasir', 'POS Mobile'));
    buf.writeln(_divider());

    // ── Item ──
    buf.writeln(_padRight('ITEM', 28) + _padLeft('Qty', 5) + _padLeft('Subtotal', 9));
    buf.writeln(_divider('-'));
    for (final item in cart) {
      final name = item.name.length > 24 ? '${item.name.substring(0, 23)}…' : item.name;
      buf.writeln(_padRight(name, 28) + _padLeft('${item.qty}', 5) + _padLeft(_fmtPlain(item.total), 9));
      if (item.variant != 'Reguler') {
        buf.writeln('  ${item.variant}');
      }
      if (item.note != null && item.note!.isNotEmpty) {
        buf.writeln('  📝 ${item.note}');
      }
    }
    buf.writeln(_divider());

    // ── Total ──
    final subtotal = cart.fold<int>(0, (s, i) => s + i.total);
    buf.writeln(_rowRight('Subtotal', _fmtPlain(subtotal)));
    if (discount > 0) {
      buf.writeln(_rowRight('Diskon', '-${_fmtPlain(discount)}'));
    }
    buf.writeln(_rowRight('TOTAL', _fmtPlain(total)));
    buf.writeln(_divider());

    // ── Pembayaran ──
    buf.writeln(_row('Metode', paymentMethod == 'CASH' ? 'Tunai' : 'QRIS'));
    if (paymentMethod == 'CASH') {
      buf.writeln(_row('Uang Diterima', _fmtPlain(cashPaid)));
      buf.writeln(_row('Kembalian', _fmtPlain(cashChange)));
    }
    buf.writeln(_divider());

    // ── Footer ──
    buf.writeln(_center('-- TERIMA KASIH --'));
    buf.writeln(_center('Atas kunjungan Anda'));
    buf.writeln('');
    buf.writeln(_center('RestoFlow POS v1.0'));

    return buf.toString();
  }

  // ── Helpers ──

  String _center(String text) {
    if (text.length >= _lineWidth) return text;
    final pad = (_lineWidth - text.length) ~/ 2;
    return ' ' * pad + text;
  }

  String _divider([String char = '=']) {
    return char * _lineWidth;
  }

  String _row(String label, String value) {
    final combined = '$label: $value';
    if (combined.length >= _lineWidth) return combined;
    return _padRight('$label: ', _lineWidth - value.length) + value;
  }

  String _rowRight(String label, String value) {
    final labelPart = label;
    final valuePart = value;
    if (labelPart.length + valuePart.length >= _lineWidth) {
      return '$labelPart $valuePart';
    }
    return _padRight(labelPart, _lineWidth - valuePart.length) + valuePart;
  }

  String _padRight(String s, int width) {
    if (s.length >= width) return s;
    return s + ' ' * (width - s.length);
  }

  String _padLeft(String s, int width) {
    if (s.length >= width) return s;
    return ' ' * (width - s.length) + s;
  }

  String _fmtPlain(int v) {
    final p = v.toString().split('');
    final b = StringBuffer('Rp');
    for (int i = 0; i < p.length; i++) {
      if (i > 0 && (p.length - i) % 3 == 0) b.write('.');
      b.write(p[i]);
    }
    return b.toString();
  }
}
