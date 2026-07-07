import 'api_service.dart';

/// Sales Service — mencatat transaksi penjualan ke backend.
class SalesService {
  final ApiService _api = ApiService();

  /// POST /api/sales — record a new sale transaction.
  ///
  /// [items] — array of { menu_name, quantity, price, subtotal, selected_options }
  /// [paymentMethod] — 'CASH' or 'QRIS'
  /// [cashPaid] — required for CASH
  /// [cashChange] — required for CASH
  /// [voucherCode] — optional
  /// [voucherId] — optional
  /// [discountAmount] — optional
  Future<SalesResult> createSale({
    required List<Map<String, dynamic>> items,
    required String paymentMethod,
    int? cashPaid,
    int? cashChange,
    String? voucherCode,
    int? voucherId,
    int discountAmount = 0,
    String? notes,
  }) async {
    // Calculate grand total from items
    final grandTotal = items.fold<int>(
      0,
      (sum, item) => sum + ((item['subtotal'] as int?) ?? 0),
    );
    final finalTotal = (grandTotal - discountAmount).clamp(0, 999999999);

    final body = <String, dynamic>{
      'items': items.map((it) => {
        'menu_name': it['menu_name'] ?? '',
        'quantity': it['quantity'] ?? 1,
        'price': it['price'] ?? 0,
        'subtotal': it['subtotal'] ?? 0,
        'selected_options': it['selected_options'] ?? '',
      }).toList(),
      'payment_method': paymentMethod,
      'total_price': finalTotal,
      'discount_amount': discountAmount,
      if (notes != null && notes.isNotEmpty) 'selected_options': notes,
    };

    // Cash-specific fields
    if (paymentMethod == 'CASH') {
      body['cash_paid'] = cashPaid ?? finalTotal;
      body['cash_change'] = cashChange ?? 0;
    }

    // Voucher fields
    if (voucherCode != null && voucherCode.isNotEmpty) {
      body['voucher_code'] = voucherCode;
    }
    if (voucherId != null) {
      body['voucher_id'] = voucherId;
    }

    final response = await _api.post('/api/sales', body: body);

    if (!response.success) {
      return SalesResult(error: response.error ?? 'Gagal mencatat transaksi');
    }

    final data = response.data;
    final salesData = data?['data'] as Map<String, dynamic>? ?? {};

    return SalesResult(
      invoiceId: salesData['invoice_id']?.toString() ?? '',
      saleId: salesData['id'] ?? 0,
      message: data?['message']?.toString() ?? 'Transaksi berhasil',
    );
  }
}

/// Result from sales creation
class SalesResult {
  final String invoiceId;
  final int saleId;
  final String? message;
  final String? error;

  SalesResult({
    this.invoiceId = '',
    this.saleId = 0,
    this.message,
    this.error,
  });

  bool get isSuccess => error == null;
}
