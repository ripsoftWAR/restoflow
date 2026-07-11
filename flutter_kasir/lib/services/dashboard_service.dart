import 'api_service.dart';
import '../models/models.dart';

/// Service untuk fetch data dashboard, transaksi, dll.
class DashboardService {
  final ApiService _api = ApiService();

  /// Ambil statistik dashboard (requires Pemilik role)
  Future<DashboardStats?> getStats({String period = 'today'}) async {
    final response = await _api.get('/api/dashboard/stats?period=$period');

    if (!response.success || response.data == null) return null;

    return DashboardStats.fromJson(response.data!);
  }

  /// Ambil transaksi terbaru (dari /api/sales)
  Future<List<TransactionItem>> getRecentTransactions({int limit = 10}) async {
    final response = await _api.get('/api/sales?limit=$limit');

    if (!response.success || response.data == null) return [];

    // Response mungkin punya key data atau items
    final list = response.data?['data'] ?? response.data?['sales'] ?? [];
    if (list is! List) return [];

    return list.map<TransactionItem>((s) {
      return TransactionItem(
        invoiceId: s['invoice_id'] ?? s['id']?.toString() ?? '-',
        time: _formatTime(s['created_at']),
        type: s['type'] ?? s['menu_name'] ?? 'Dine In',
        amount: _toDouble(s['total_price'] ?? s['amount'] ?? 0),
        status: s['status'] ?? 'Selesai',
      );
    }).toList();
  }
}

String _formatTime(dynamic dateStr) {
  if (dateStr == null) return '-';
  try {
    final dt = DateTime.parse(dateStr.toString());
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m WIB';
  } catch (_) {
    return dateStr.toString();
  }
}

class DashboardStats {
  final double totalValue;
  final int totalItems;
  final double totalSalesByDay;
  final double qrisSalesByDay;
  final double cashSalesByDay;
  final int totalItemsSoldByDay;
  final int totalTransactionsByDay;
  final CriticalStockItems criticalStockItems;
  final double dailyExpense;

  DashboardStats({
    required this.totalValue,
    required this.totalItems,
    required this.totalSalesByDay,
    required this.qrisSalesByDay,
    required this.cashSalesByDay,
    required this.totalItemsSoldByDay,
    required this.totalTransactionsByDay,
    required this.criticalStockItems,
    required this.dailyExpense,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalValue: _toDouble(json['totalValue']),
      totalItems: (json['totalItems'] ?? 0) is int ? json['totalItems'] ?? 0 : int.tryParse(json['totalItems'].toString()) ?? 0,
      totalSalesByDay: _toDouble(json['totalSalesByDay']),
      qrisSalesByDay: _toDouble(json['qrisSalesByDay']),
      cashSalesByDay: _toDouble(json['cashSalesByDay']),
      totalItemsSoldByDay: (json['totalItemsSoldByDay'] ?? 0) is int ? json['totalItemsSoldByDay'] ?? 0 : int.tryParse(json['totalItemsSoldByDay'].toString()) ?? 0,
      totalTransactionsByDay: (json['totalTransactionsByDay'] ?? 0) is int ? json['totalTransactionsByDay'] ?? 0 : int.tryParse(json['totalTransactionsByDay'].toString()) ?? 0,
      criticalStockItems: CriticalStockItems.fromJson(
        json['criticalStockItems'] ?? {},
      ),
      dailyExpense: _toDouble(json['dailyExpense']),
    );
  }
}

class CriticalStockItems {
  final int count;
  final List<dynamic> items;

  CriticalStockItems({required this.count, required this.items});

  factory CriticalStockItems.fromJson(Map<String, dynamic> json) {
    return CriticalStockItems(
      count: (json['count'] ?? 0) is int ? json['count'] ?? 0 : int.tryParse(json['count'].toString()) ?? 0,
      items: json['items'] ?? [],
    );
  }
}

double _toDouble(dynamic val) {
  if (val == null) return 0;
  if (val is int) return val.toDouble();
  if (val is double) return val;
  if (val is String) return double.tryParse(val) ?? 0;
  return 0;
}
