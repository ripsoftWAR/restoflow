/// PilotPOS — Data Models

class PilotUser {
  final String name;
  final String role;
  final String shift;
  final String seed;
  final String roleColor; // blue, purple, orange, amber

  const PilotUser({
    required this.name,
    required this.role,
    required this.shift,
    required this.seed,
    this.roleColor = 'blue',
  });

  String get avatarUrl => 'https://api.dicebear.com/7.x/avataaars/svg?seed=$seed';
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
