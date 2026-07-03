/// PilotPOS — Data Models
library;

class PilotUser {
  final int id;
  final String name;
  final String role;
  final String shift;
  final String seed;
  final String roleColor; // blue, purple, orange, amber

  const PilotUser({
    this.id = 0,
    required this.name,
    required this.role,
    required this.shift,
    required this.seed,
    this.roleColor = 'blue',
  });

  String get avatarUrl =>
      'https://api.dicebear.com/7.x/avataaars/svg?seed=$seed';
}

class SyncItem {
  final String label;
  final String iconName;
  bool done;

  SyncItem({required this.label, required this.iconName, this.done = false});
}

class TransactionItem {
  final String invoiceId;
  final String time;
  final String type;
  final double amount;
  final String status;

  const TransactionItem({
    required this.invoiceId,
    required this.time,
    required this.type,
    required this.amount,
    this.status = 'Selesai',
  });
}

/// Data shift dari backend
class Shift {
  final int id;
  final String nama;
  final String? jamMulai;
  final String? jamAkhir;

  const Shift({
    required this.id,
    required this.nama,
    this.jamMulai,
    this.jamAkhir,
  });

  String get displayTime {
    if (jamMulai != null && jamAkhir != null) {
      return '$jamMulai - $jamAkhir';
    }
    return nama;
  }
}

/// Ringkasan inventory item
class InventorySummary {
  final String name;
  final double stock;
  final double minStock;
  final String unit;
  final String? category;

  const InventorySummary({
    required this.name,
    required this.stock,
    required this.minStock,
    required this.unit,
    this.category,
  });

  bool get isLow => stock <= minStock;
}
