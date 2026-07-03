import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class DashboardScreen extends StatelessWidget {
  final VoidCallback onAksiCepat;
  final VoidCallback onPOS;
  const DashboardScreen({super.key, required this.onAksiCepat, required this.onPOS});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final user = appState.selectedUser;
    final authUser = appState.authUser;
    final shift = appState.activeShift;
    final stats = appState.dashboardStats;

    return Container(
      color: const Color(0xFFF8FAFF),
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 48),
                    // Header
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_greeting(), style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
                              const SizedBox(height: 2),
                              Text.rich(
                                TextSpan(
                                  children: [
                                    TextSpan(
                                      text: authUser?.nama ?? user.name.split(' ').first,
                                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                                    ),
                                    const TextSpan(text: ' \u{1F44B}'),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  _RoleBadge(
                                    role: authUser?.role ?? user.role,
                                    color: _roleColor(user.roleColor),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '• Shift ${shift?.displayTime ?? user.shift}',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        ClipOval(
                          child: Image.network(user.avatarUrl, width: 56, height: 56),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Outlet selector
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.store, color: Color(0xFF2563EB), size: 16),
                          const SizedBox(width: 6),
                          const Text('Outlet Jakarta', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF334155))),
                          const Icon(Icons.expand_more, color: Color(0xFF94A3B8), size: 14),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Active shift banner
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFDCFCE7)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.circle, size: 8, color: Color(0xFF22C55E)),
                              SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Shift aktif', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF15803D))),
                                  Text('Anda sedang bertugas', style: TextStyle(fontSize: 12, color: Color(0xFF22C55E))),
                                ],
                              ),
                            ],
                          ),
                          const Row(
                            children: [
                              Icon(Icons.access_time, size: 12, color: Color(0xFF16A34A)),
                              SizedBox(width: 4),
                              Text('Berakhir 8j 30m lagi', style: TextStyle(fontSize: 12, color: Color(0xFF16A34A))),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Sales card — REAL DATA kalau tersedia
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.wallet, color: Color(0xFFBFDBFE), size: 15),
                                  SizedBox(width: 6),
                                  Text('Penjualan Hari Ini', style: TextStyle(color: Color(0xFFBFDBFE), fontSize: 14)),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                                child: const Row(
                                  children: [
                                    Text('Hari Ini', style: TextStyle(color: Colors.white, fontSize: 12)),
                                    Icon(Icons.expand_more, color: Colors.white, size: 12),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _formatRupiah(stats?.totalSalesByDay ?? 2350000),
                            style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: Colors.white),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(99)),
                            child: const Text('\u2191 18.6% dibanding kemarin', style: TextStyle(color: Colors.white, fontSize: 12)),
                          ),
                          const SizedBox(height: 16),
                          const Divider(color: Colors.white24),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              _SalesMiniStat(
                                label: 'Transaksi',
                                value: '${stats?.totalTransactionsByDay ?? 42}',
                              ),
                              _SalesMiniStat(
                                label: 'Average Order',
                                value: _formatRupiah(stats != null && stats.totalTransactionsByDay > 0
                                    ? stats.totalSalesByDay / stats.totalTransactionsByDay
                                    : 55952),
                              ),
                              _SalesMiniStat(
                                label: 'Item Terjual',
                                value: '${stats?.totalItemsSoldByDay ?? 128}',
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Quick actions
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Aksi Cepat', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                        GestureDetector(
                          onTap: onAksiCepat,
                          child: const Row(
                            children: [
                              Text('Lihat Semua', style: TextStyle(color: Color(0xFF2563EB), fontSize: 14, fontWeight: FontWeight.w500)),
                              SizedBox(width: 2),
                              Icon(Icons.chevron_right, color: Color(0xFF2563EB), size: 14),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _QuickAction(icon: Icons.shopping_cart, label: 'Mulai Penjualan', color: const Color(0xFF2563EB), bgColor: const Color(0xFFEFF6FF), onTap: onPOS),
                        _QuickAction(icon: Icons.inventory_2_outlined, label: 'Inventory', color: const Color(0xFF16A34A), bgColor: const Color(0xFFF0FDF4), onTap: onAksiCepat),
                        _QuickAction(icon: Icons.assignment_return_outlined, label: 'Retur', color: const Color(0xFFEA580C), bgColor: const Color(0xFFFFF7ED), onTap: onAksiCepat),
                        _QuickAction(icon: Icons.history, label: 'Riwayat', color: const Color(0xFF9333EA), bgColor: const Color(0xFFF3E8FF), onTap: onAksiCepat),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Text('Ringkasan Operasional', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _SummaryCard(
                          icon: Icons.inventory_2_outlined,
                          label: 'Stok Hampir Habis',
                          value: '${stats?.criticalStockItems.count ?? 12} item',
                          color: const Color(0xFFEA580C),
                          bgColor: const Color(0xFFFFF7ED),
                        ),
                        const SizedBox(width: 8),
                        _SummaryCard(
                          icon: Icons.shopping_bag_outlined,
                          label: 'Pesanan Tertunda',
                          value: '3 pesanan',
                          color: const Color(0xFF2563EB),
                          bgColor: const Color(0xFFEFF6FF),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _SummaryCard(
                          icon: Icons.local_offer_outlined,
                          label: 'Voucher Aktif',
                          value: '5 voucher',
                          color: const Color(0xFF16A34A),
                          bgColor: const Color(0xFFF0FDF4),
                        ),
                        const SizedBox(width: 8),
                        _SummaryCard(
                          icon: Icons.receipt_long_outlined,
                          label: 'Pengeluaran Hari Ini',
                          value: _formatRupiah(stats?.dailyExpense ?? 0),
                          color: const Color(0xFF9333EA),
                          bgColor: const Color(0xFFF3E8FF),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Recent transactions
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Transaksi Terakhir', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                        GestureDetector(
                          onTap: onAksiCepat,
                          child: const Row(
                            children: [
                              Text('Lihat Semua', style: TextStyle(color: Color(0xFF2563EB), fontSize: 14, fontWeight: FontWeight.w500)),
                              SizedBox(width: 2),
                              Icon(Icons.chevron_right, color: Color(0xFF2563EB), size: 14),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    if (appState.recentTransactions.isNotEmpty)
                      ...appState.recentTransactions.map((tx) => _TransactionCard(transaction: tx))
                    else ...[
                      // Demo transactions fallback
                      _TransactionCard(transaction: appState.recentTransactions.isNotEmpty
                          ? appState.recentTransactions.first
                          : null),
                    ],
                    // Always show at least the demo ones if empty
                    if (appState.recentTransactions.isEmpty) ...[
                      _DemoTransactionCard(invoiceId: 'INV/2505/00124', time: '10:15 WIB', type: 'Dine In', amount: 125000),
                      _DemoTransactionCard(invoiceId: 'INV/2505/00123', time: '10:02 WIB', type: 'Take Away', amount: 85000),
                    ],
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
            // Bottom nav
            _BottomNav(
              activeIndex: 0,
              onTap: (i) {
                if (i == 0) return; // already home
                if (i == 1) {
                  onPOS();
                  return;
                }
                // Beri feedback jelas bahwa fitur belum tersedia
                final labels = ['', 'POS', 'Inventory', 'Laporan', 'Lainnya'];
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Fitur "${labels[i]}" akan hadir di update berikutnya'),
                    backgroundColor: const Color(0xFF2563EB),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    duration: const Duration(seconds: 2),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Color _roleColor(String roleColor) {
    switch (roleColor) {
      case 'purple': return const Color(0xFF9333EA);
      case 'orange': return const Color(0xFFEA580C);
      case 'amber': return const Color(0xFFD97706);
      default: return const Color(0xFF2563EB);
    }
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'Selamat Pagi,';
    if (hour < 15) return 'Selamat Siang,';
    if (hour < 18) return 'Selamat Sore,';
    return 'Selamat Malam,';
  }

  String _formatRupiah(double amount) {
    // Format: Rp1.234.567 atau Rp12.345
    final parts = amount.toStringAsFixed(0).split('');
    final buffer = StringBuffer('Rp');
    for (int i = 0; i < parts.length; i++) {
      if (i > 0 && (parts.length - i) % 3 == 0) buffer.write('.');
      buffer.write(parts[i]);
    }
    return buffer.toString();
  }
}

// ── Helper widgets ──

class _RoleBadge extends StatelessWidget {
  final String role;
  final Color color;
  const _RoleBadge({required this.role, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
      child: Text(role, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: color)),
    );
  }
}

class _SalesMiniStat extends StatelessWidget {
  final String label;
  final String value;
  const _SalesMiniStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFFBFDBFE), fontSize: 11)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bgColor;
  final VoidCallback onTap;

  const _QuickAction({required this.icon, required this.label, required this.color, required this.bgColor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 3),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFF1F5F9)),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF334155)), textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final Color bgColor;

  const _SummaryCard({required this.icon, required this.label, required this.value, required this.color, required this.bgColor});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 15),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final dynamic transaction;
  const _TransactionCard({required this.transaction});

  @override
  Widget build(BuildContext context) {
    if (transaction == null) return const SizedBox.shrink();
    return _DemoTransactionCard(
      invoiceId: transaction.invoiceId,
      time: transaction.time,
      type: transaction.type,
      amount: transaction.amount,
    );
  }
}

class _DemoTransactionCard extends StatelessWidget {
  final String invoiceId;
  final String time;
  final String type;
  final double amount;

  const _DemoTransactionCard({
    required this.invoiceId,
    required this.time,
    required this.type,
    required this.amount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFF1F5F9)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(99)),
            child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFF16A34A), size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(invoiceId, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                Text('$time • $type', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Rp${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(4)),
                child: const Text('Selesai', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: Color(0xFF16A34A))),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final int activeIndex;
  final ValueChanged<int> onTap;

  const _BottomNav({required this.activeIndex, required this.onTap});

  static const _items = [
    ('Home', Icons.home),
    ('POS', Icons.shopping_cart_outlined),
    ('Inventory', Icons.inventory_2_outlined),
    ('Laporan', Icons.bar_chart),
    ('Lainnya', Icons.more_horiz),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_items.length, (i) {
          final isActive = i == activeIndex;
          return GestureDetector(
            onTap: () => onTap(i),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _items[i].$2,
                  size: 20,
                  color: isActive ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
                ),
                const SizedBox(height: 2),
                Text(
                  _items[i].$1,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: isActive ? FontWeight.w500 : FontWeight.normal,
                    color: isActive ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
