import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/app_state.dart';
import '../services/auth_service.dart';
import '../services/dashboard_service.dart';

enum _LoadState { loading, loaded, error, empty }

class DashboardScreen extends StatefulWidget {
  final VoidCallback onAksiCepat;
  final VoidCallback onPOS;
  const DashboardScreen({super.key, required this.onAksiCepat, required this.onPOS});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Timer? _countdownTimer;
  Duration? _shiftRemaining;
  _LoadState _loadState = _LoadState.loading;

  @override
  void initState() {
    super.initState();
    _startCountdown();
    _fetchData();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  // ── Countdown shift real-time ──
  void _startCountdown() {
    _tick();
    _countdownTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) _tick();
    });
  }

  void _tick() {
    final shift = context.read<AppState>().activeShift;
    if (shift?.jamAkhir == null) {
      if (mounted) setState(() => _shiftRemaining = null);
      return;
    }
    try {
      final parts = shift!.jamAkhir!.split(':');
      final now = DateTime.now();
      var end = DateTime(now.year, now.month, now.day,
          int.parse(parts[0]), int.parse(parts[1]));
      if (end.isBefore(now)) end = end.add(const Duration(days: 1));
      if (mounted) setState(() => _shiftRemaining = end.difference(now));
    } catch (_) {
      if (mounted) setState(() => _shiftRemaining = null);
    }
  }

  Future<void> _fetchData() async {
    final appState = context.read<AppState>();
    if (!appState.isLoggedIn) return;
    if (mounted) setState(() => _loadState = _LoadState.loading);
    try {
      await appState.fetchDashboardData();
      if (!mounted) return;
      final hasData = appState.dashboardStats != null;
      setState(() => _loadState = hasData ? _LoadState.loaded : _LoadState.empty);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadState = _LoadState.error);
    }
  }

  // ═══════════════════════════════════════
  //  BUILD
  // ═══════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final authUser = appState.authUser;
    final user = appState.selectedUser;
    final shift = appState.activeShift;
    final stats = appState.dashboardStats;

    return Container(
      color: const Color(0xFFF8FAFF),
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: RefreshIndicator(
                color: const Color(0xFF2563EB),
                onRefresh: _fetchData,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 32),
                      // ── Header ──
                      _Header(authUser: authUser, user: user, shift: shift),
                      const SizedBox(height: 16),
                      // ── Countdown shift ──
                      if (_shiftRemaining != null) _ShiftBanner(remaining: _shiftRemaining!),
                      if (_shiftRemaining != null) const SizedBox(height: 16),
                      // ── Sales card ──
                      if (_loadState == _LoadState.loading)
                        _SalesCardSkeleton()
                      else if (_loadState == _LoadState.error)
                        _ErrorCard(onRetry: _fetchData)
                      else
                        _SalesCard(stats: stats),
                      const SizedBox(height: 20),
                    // ── Quick actions ──
                    _QuickActionsRow(onPOS: widget.onPOS, onAksiCepat: widget.onAksiCepat),
                    const SizedBox(height: 20),
                    // ── Ringkasan operasional ──
                    _OperationalSummary(stats: stats),
                    const SizedBox(height: 20),
                    // ── Transaksi terakhir ──
                    _RecentTransactions(
                      loadState: _loadState,
                      transactions: appState.recentTransactions,
                      onSeeAll: widget.onAksiCepat,
                      formatRupiah: _formatRupiah,
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
            // ── Bottom nav ──
            _BottomNav(
              activeIndex: 0,
              onTap: (i) => _onNavTap(context, i),
            ),
          ],
        ),
      ),
    );
  }

  void _onNavTap(BuildContext context, int i) {
    if (i == 0) return;
    if (i == 1) {
      widget.onPOS();
      return;
    }
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
  }

  String _formatRupiah(double amount) {
    final parts = amount.toStringAsFixed(0).split('');
    final buf = StringBuffer('Rp');
    for (int i = 0; i < parts.length; i++) {
      if (i > 0 && (parts.length - i) % 3 == 0) buf.write('.');
      buf.write(parts[i]);
    }
    return buf.toString();
  }
}

// ── Helper widgets ──

// ═══════════════════════════════════════════════
//  HEADER
// ═══════════════════════════════════════════════
class _Header extends StatelessWidget {
  final UserAuthData? authUser;
  final PilotUser user;
  final ShiftData? shift;
  const _Header({required this.authUser, required this.user, required this.shift});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'Selamat Pagi,';
    if (hour < 15) return 'Selamat Siang,';
    if (hour < 18) return 'Selamat Sore,';
    return 'Selamat Malam,';
  }

  Color _roleColor(String rc) {
    switch (rc) {
      case 'purple': return const Color(0xFF9333EA);
      case 'orange': return const Color(0xFFEA580C);
      case 'amber': return const Color(0xFFD97706);
      default: return const Color(0xFF2563EB);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_greeting(), style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
                const SizedBox(height: 4),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: authUser?.nama ?? (user.name.contains(' ') ? user.name.split(' ').first : user.name),
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                      ),
                      const TextSpan(text: ' \u{1F44B}'),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _roleColor(user.roleColor).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        authUser?.role ?? user.role,
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _roleColor(user.roleColor)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '• ${shift?.displayTime ?? user.shift}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Semantics(
            label: 'Foto profil',
            child: ClipOval(
              child: Image.network(
                user.avatarUrl,
                width: 48, height: 48,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 48, height: 48,
                  color: const Color(0xFFE2E8F0),
                  child: const Icon(Icons.person, color: Color(0xFF94A3B8), size: 24),
                ),
                loadingBuilder: (_, child, event) {
                  if (event == null) return child;
                  return Container(
                    width: 48, height: 48,
                    color: const Color(0xFFF1F5F9),
                    child: const Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  SHIFT BANNER (real countdown)
// ═══════════════════════════════════════════════
class _ShiftBanner extends StatelessWidget {
  final Duration remaining;
  const _ShiftBanner({required this.remaining});

  String _format(Duration d) {
    if (d.inHours > 0) return 'Berakhir ${d.inHours}j ${d.inMinutes % 60}m lagi';
    if (d.inMinutes > 0) return 'Berakhir ${d.inMinutes}m lagi';
    return 'Kurang dari 1 menit';
  }

  @override
  Widget build(BuildContext context) {
    final isUrgent = remaining.inMinutes < 60;
    return Semantics(
      label: 'Shift aktif, ${_format(remaining)}',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isUrgent ? const Color(0xFFFFF7ED) : const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isUrgent ? const Color(0xFFFFEDD5) : const Color(0xFFDCFCE7)),
        ),
        child: Row(
          children: [
            Icon(Icons.circle, size: 10, color: isUrgent ? const Color(0xFFF97316) : const Color(0xFF22C55E)),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Shift aktif',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isUrgent ? const Color(0xFFC2410C) : const Color(0xFF15803D)),
                ),
                Text(
                  'Anda sedang bertugas',
                  style: TextStyle(fontSize: 12, color: isUrgent ? const Color(0xFFF97316) : const Color(0xFF22C55E)),
                ),
              ],
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: (isUrgent ? const Color(0xFFF97316) : const Color(0xFF16A34A)).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.access_time, size: 14, color: isUrgent ? const Color(0xFFF97316) : const Color(0xFF16A34A)),
                  const SizedBox(width: 4),
                  Text(
                    _format(remaining),
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isUrgent ? const Color(0xFFF97316) : const Color(0xFF16A34A)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  SALES CARD SKELETON (loading)
// ═══════════════════════════════════════════════
class _SalesCardSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _shimmer(120, 14),
          const SizedBox(height: 12),
          _shimmer(200, 30),
          const SizedBox(height: 8),
          _shimmer(140, 12),
          const SizedBox(height: 16),
          const Divider(color: Colors.white24),
          const SizedBox(height: 12),
          Row(children: List.generate(3, (_) => Expanded(child: Padding(padding: const EdgeInsets.only(right: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_shimmer(60, 11), const SizedBox(height: 4), _shimmer(40, 14)]))))),
        ],
      ),
    );
  }

  Widget _shimmer(double width, double height) {
    return Container(width: width, height: height, decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(6)));
  }
}

// ═══════════════════════════════════════════════
//  ERROR CARD
// ═══════════════════════════════════════════════
class _ErrorCard extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorCard({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        children: [
          const Icon(Icons.cloud_off, color: Color(0xFFEF4444), size: 32),
          const SizedBox(height: 8),
          const Text('Gagal memuat data', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF991B1B))),
          const SizedBox(height: 4),
          const Text('Periksa koneksi internet kamu', style: TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
          const SizedBox(height: 12),
          Semantics(
            button: true,
            label: 'Coba lagi',
            child: GestureDetector(
              onTap: onRetry,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(color: const Color(0xFFEF4444), borderRadius: BorderRadius.circular(10)),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.refresh, color: Colors.white, size: 16),
                    SizedBox(width: 6),
                    Text('Coba Lagi', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                  ],
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
//  SALES CARD
// ═══════════════════════════════════════════════
class _SalesCard extends StatelessWidget {
  final DashboardStats? stats;
  const _SalesCard({required this.stats});

  String _fmt(double v) {
    final p = v.toStringAsFixed(0).split('');
    final b = StringBuffer('Rp');
    for (int i = 0; i < p.length; i++) {
      if (i > 0 && (p.length - i) % 3 == 0) b.write('.');
      b.write(p[i]);
    }
    return b.toString();
  }

  @override
  Widget build(BuildContext context) {
    final sales = stats?.totalSalesByDay ?? 0;
    final tx = stats?.totalTransactionsByDay ?? 0;
    final items = stats?.totalItemsSoldByDay ?? 0;
    final avg = tx > 0 ? _fmt(sales / tx) : _fmt(0);

    return Semantics(
      label: 'Penjualan hari ini ${_fmt(sales)}, $tx transaksi',
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.25), blurRadius: 20, offset: const Offset(0, 8))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.wallet, color: Color(0xFFBFDBFE), size: 16),
                    SizedBox(width: 6),
                    Text('Penjualan Hari Ini', style: TextStyle(color: Color(0xFFBFDBFE), fontSize: 14)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                  child: const Row(
                    children: [
                      Text('Hari Ini', style: TextStyle(color: Colors.white, fontSize: 12)),
                      SizedBox(width: 2),
                      Icon(Icons.calendar_today, color: Colors.white, size: 12),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(_fmt(sales), style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 16),
            const Divider(color: Color(0x33FFFFFF)),
            const SizedBox(height: 12),
            Row(
              children: [
                _MiniStat(label: 'Transaksi', value: '$tx'),
                _MiniStat(label: 'Avg Order', value: avg),
                _MiniStat(label: 'Item Terjual', value: '$items'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  const _MiniStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFFBFDBFE), fontSize: 11)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 13)),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  QUICK ACTIONS ROW
// ═══════════════════════════════════════════════
class _QuickActionsRow extends StatelessWidget {
  final VoidCallback onPOS;
  final VoidCallback onAksiCepat;
  const _QuickActionsRow({required this.onPOS, required this.onAksiCepat});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Aksi Cepat', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
            GestureDetector(
              onTap: onAksiCepat,
              child: const Row(
                children: [
                  Text('Lihat Semua', style: TextStyle(color: Color(0xFF2563EB), fontSize: 14, fontWeight: FontWeight.w500)),
                  SizedBox(width: 2),
                  Icon(Icons.chevron_right, color: Color(0xFF2563EB), size: 16),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _QAButton(icon: Icons.shopping_cart, label: 'Mulai\nPenjualan', color: const Color(0xFF2563EB), bg: const Color(0xFFEFF6FF), onTap: onPOS),
            _QAButton(icon: Icons.inventory_2_outlined, label: 'Inventory', color: const Color(0xFF16A34A), bg: const Color(0xFFF0FDF4), onTap: onAksiCepat),
            _QAButton(icon: Icons.assignment_return_outlined, label: 'Retur', color: const Color(0xFFEA580C), bg: const Color(0xFFFFF7ED), onTap: onAksiCepat),
            _QAButton(icon: Icons.history, label: 'Riwayat', color: const Color(0xFF9333EA), bg: const Color(0xFFF3E8FF), onTap: onAksiCepat),
          ],
        ),
      ],
    );
  }
}

class _QAButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bg;
  final VoidCallback onTap;
  const _QAButton({required this.icon, required this.label, required this.color, required this.bg, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Semantics(
        button: true,
        label: label.replaceAll('\n', ' '),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFE2E8F0)),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(height: 8),
                Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF334155)), textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  OPERATIONAL SUMMARY
// ═══════════════════════════════════════════════
class _OperationalSummary extends StatelessWidget {
  final DashboardStats? stats;
  const _OperationalSummary({required this.stats});

  String _fmt(double v) {
    final p = v.toStringAsFixed(0).split('');
    final b = StringBuffer('Rp');
    for (int i = 0; i < p.length; i++) {
      if (i > 0 && (p.length - i) % 3 == 0) b.write('.');
      b.write(p[i]);
    }
    return b.toString();
  }

  @override
  Widget build(BuildContext context) {
    final criticalCount = stats?.criticalStockItems.count ?? 0;
    final expense = stats?.dailyExpense ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Ringkasan Operasional', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
        const SizedBox(height: 12),
        Row(
          children: [
            _SummaryItem(icon: Icons.inventory_2_outlined, label: 'Stok Hampir Habis', value: '$criticalCount item', color: const Color(0xFFEA580C), bg: const Color(0xFFFFF7ED)),
            const SizedBox(width: 8),
            _SummaryItem(icon: Icons.local_offer_outlined, label: 'Voucher Aktif', value: '5 voucher', color: const Color(0xFF16A34A), bg: const Color(0xFFF0FDF4)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _SummaryItem(icon: Icons.shopping_bag_outlined, label: 'Pesanan Tertunda', value: '3 pesanan', color: const Color(0xFF2563EB), bg: const Color(0xFFEFF6FF)),
            const SizedBox(width: 8),
            _SummaryItem(icon: Icons.receipt_long_outlined, label: 'Pengeluaran', value: _fmt(expense), color: const Color(0xFF9333EA), bg: const Color(0xFFF3E8FF)),
          ],
        ),
      ],
    );
  }
}

class _SummaryItem extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color color, bg;
  const _SummaryItem({required this.icon, required this.label, required this.value, required this.color, required this.bg});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE2E8F0)), borderRadius: BorderRadius.circular(14)),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  const SizedBox(height: 2),
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

// ═══════════════════════════════════════════════
//  RECENT TRANSACTIONS
// ═══════════════════════════════════════════════
class _RecentTransactions extends StatelessWidget {
  final _LoadState loadState;
  final List<TransactionItem> transactions;
  final VoidCallback onSeeAll;
  final String Function(double) formatRupiah;
  const _RecentTransactions({required this.loadState, required this.transactions, required this.onSeeAll, required this.formatRupiah});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Transaksi Terakhir', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
            GestureDetector(
              onTap: onSeeAll,
              child: const Row(
                children: [
                  Text('Lihat Semua', style: TextStyle(color: Color(0xFF2563EB), fontSize: 14, fontWeight: FontWeight.w500)),
                  SizedBox(width: 2),
                  Icon(Icons.chevron_right, color: Color(0xFF2563EB), size: 16),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (loadState == _LoadState.loading)
          ...List.generate(3, (_) => _TxSkeleton())
        else if (loadState == _LoadState.empty || transactions.isEmpty)
          _EmptyTx()
        else
          ...transactions.take(5).map((tx) => _TxCard(tx: tx, fmt: formatRupiah)),
      ],
    );
  }
}

class _TxCard extends StatelessWidget {
  final TransactionItem tx;
  final String Function(double) fmt;
  const _TxCard({required this.tx, required this.fmt});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE2E8F0)), borderRadius: BorderRadius.circular(14)),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFF16A34A), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tx.invoiceId, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                const SizedBox(height: 2),
                Text('${tx.time} • ${tx.type}', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(fmt(tx.amount), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(6)),
                child: Text(tx.status, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF16A34A))),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TxSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(border: Border.all(color: const Color(0xFFF1F5F9)), borderRadius: BorderRadius.circular(14)),
      child: Row(
        children: [
          Container(width: 44, height: 44, decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12))),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(width: 120, height: 14, decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(4))),
                const SizedBox(height: 6),
                Container(width: 80, height: 10, decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(4))),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(width: 60, height: 14, decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 6),
              Container(width: 44, height: 16, decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(4))),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyTx extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Column(
        children: [
          const Icon(Icons.receipt_long, color: Color(0xFFCBD5E1), size: 40),
          const SizedBox(height: 8),
          const Text('Belum ada transaksi', style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8))),
          const SizedBox(height: 4),
          const Text('Mulai penjualan dari menu POS', style: TextStyle(fontSize: 12, color: Color(0xFFCBD5E1))),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  BOTTOM NAV
// ═══════════════════════════════════════════════
class _BottomNav extends StatelessWidget {
  final int activeIndex;
  final ValueChanged<int> onTap;
  const _BottomNav({required this.activeIndex, required this.onTap});

  static const _items = [
    ('Home', Icons.home, true),
    ('POS', Icons.shopping_cart_outlined, true),
    ('Inventory', Icons.inventory_2_outlined, false),
    ('Laporan', Icons.bar_chart, false),
    ('Lainnya', Icons.more_horiz, false),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        boxShadow: [BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, -2))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_items.length, (i) {
          final isActive = i == activeIndex;
          final (label, icon, enabled) = _items[i];
          return Semantics(
            button: true,
            label: label,
            enabled: enabled,
            child: GestureDetector(
              onTap: () => onTap(i),
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, size: 22, color: isActive ? const Color(0xFF2563EB) : const Color(0xFF94A3B8)),
                    const SizedBox(height: 4),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                        color: isActive ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
