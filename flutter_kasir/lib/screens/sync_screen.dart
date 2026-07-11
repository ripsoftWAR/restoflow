import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class SyncScreen extends StatefulWidget {
  final VoidCallback onDone;
  const SyncScreen({super.key, required this.onDone});

  @override
  State<SyncScreen> createState() => _SyncScreenState();
}

class _SyncScreenState extends State<SyncScreen> {
  final List<_SyncRowData> _rows = [
    _SyncRowData('Outlet', Icons.store, 0),
    _SyncRowData('Produk', Icons.inventory_2_outlined, 1),
    _SyncRowData('Menu & Harga', Icons.description_outlined, 2),
    _SyncRowData('Pengguna', Icons.people_outline, 3),
    _SyncRowData('Riwayat Transaksi', Icons.receipt_long_outlined, 4),
  ];

  final List<_FloatingCardData> _floating = [
    _FloatingCardData('Outlet', Icons.store, 0),
    _FloatingCardData('Produk', Icons.inventory_2_outlined, 1),
    _FloatingCardData('Menu & Harga', Icons.description_outlined, 2),
    _FloatingCardData('Pengguna', Icons.people_outline, 3),
  ];

  double _progress = 0.0;
  int _currentStep = 0;
  bool _navigated = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().resetSync();
    });
    _startSync();
  }

  void _startSync() {
    const total = 5;

    // 1. Jalankan animasi sync
    _timer = Timer.periodic(const Duration(milliseconds: 750), (timer) {
      if (_currentStep >= total) {
        timer.cancel();
        _onSyncComplete();
        return;
      }
      setState(() {
        _rows[_currentStep].done = true;
        if (_currentStep < 4) _floating[_currentStep].done = true;
        _currentStep++;
        _progress = _currentStep / total;
        context.read<AppState>().updateSyncProgress(_progress);
      });
    });

    // 2. Di background: fetch dashboard data real
    _fetchRealData();

    // Safety net: max 8 detik
    Future.delayed(const Duration(seconds: 8), () {
      if (!_navigated) {
        _navigated = true;
        widget.onDone();
      }
    });
  }

  /// Fetch dashboard + transactions dari backend secara async
  Future<void> _fetchRealData() async {
    try {
      await context.read<AppState>().fetchDashboardData();
    } catch (_) {
      // Data real gagal → fallback ke demo data di AppState
    }
  }

  void _onSyncComplete() {
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!_navigated && mounted) {
        _navigated = true;
        widget.onDone();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Container(
      color: Colors.white,
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const SizedBox(height: 56),
              // Header info
              if (appState.authUser != null) ...[
                Text(
                  'Login sebagai ${appState.authUser!.nama}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF2563EB)),
                ),
                const SizedBox(height: 4),
                Text(
                  'Shift: ${appState.activeShift?.displayTime ?? "-"}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 16),
              ],
              // Floating cards
              SizedBox(
                height: 224,
                child: Stack(
                  children: [
                    Positioned(
                      top: 8, left: 0,
                      child: _FloatingCard(data: _floating[0]),
                    ),
                    Positioned(
                      top: 8, right: 0,
                      child: _FloatingCard(data: _floating[3]),
                    ),
                    Positioned(
                      bottom: 24, left: 0,
                      child: _FloatingCard(data: _floating[1]),
                    ),
                    Positioned(
                      bottom: 24, right: 0,
                      child: _FloatingCard(data: _floating[2]),
                    ),
                    Center(
                      child: Container(
                        width: 80, height: 96,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          gradient: const LinearGradient(
                            colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF2563EB).withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.dns_outlined, color: Colors.white, size: 36),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Title
              const Text('Sinkronisasi Data', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
              const SizedBox(height: 4),
              const Text(
                'Mohon tunggu, kami sedang menyiapkan\ndata terbaik untuk Anda.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 24),
              // Progress bar
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Progres sinkronisasi', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF334155))),
                        Text('${(_progress * 100).round()}%', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF2563EB))),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(99),
                      child: LinearProgressIndicator(
                        value: _progress,
                        minHeight: 8,
                        backgroundColor: const Color(0xFFF1F5F9),
                        valueColor: const AlwaysStoppedAnimation(Color(0xFF2563EB)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Sync list
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: _rows.map((r) => _SyncRow(data: r)).toList(),
                ),
              ),
              const SizedBox(height: 16),
              // Warning
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.verified_user, color: Color(0xFF2563EB), size: 18),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Jangan tutup aplikasi', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1D4ED8))),
                          const SizedBox(height: 2),
                          Text(
                            'Proses sinkronisasi berjalan di latar belakang. Pastikan koneksi internet stabil.',
                            style: TextStyle(fontSize: 12, color: Colors.blue.shade400),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Data classes (sama seperti sebelumnya) ──

class _SyncRowData {
  final String label;
  final IconData icon;
  final int index;
  bool done;
  _SyncRowData(this.label, this.icon, this.index, {this.done = false});
}

class _FloatingCardData {
  final String label;
  final IconData icon;
  final int index;
  bool done;
  _FloatingCardData(this.label, this.icon, this.index, {this.done = false});
}

class _SyncRow extends StatelessWidget {
  final _SyncRowData data;
  const _SyncRow({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        border: Border(top: data.index > 0 ? const BorderSide(color: Color(0xFFF1F5F9)) : BorderSide.none),
      ),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(data.icon, color: const Color(0xFF2563EB), size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data.label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                Text(
                  data.done ? 'Data ${data.label.toLowerCase()} berhasil disinkronkan' : 'Menunggu giliran...',
                  style: TextStyle(fontSize: 12, color: data.done ? const Color(0xFF2563EB) : const Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),
          Icon(
            data.done ? Icons.check_circle : Icons.access_time,
            color: data.done ? const Color(0xFF2563EB) : const Color(0xFFCBD5E1),
            size: 18,
          ),
        ],
      ),
    );
  }
}

class _FloatingCard extends StatelessWidget {
  final _FloatingCardData data;
  const _FloatingCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 144,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: const Color(0xFF2563EB),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(data.icon, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data.label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                Text(
                  data.done ? 'Tersinkron' : 'Menunggu',
                  style: TextStyle(fontSize: 10, color: data.done ? const Color(0xFF2563EB) : const Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),
          Icon(
            data.done ? Icons.check_circle : Icons.access_time,
            color: data.done ? const Color(0xFF2563EB) : const Color(0xFFCBD5E1),
            size: 16,
          ),
        ],
      ),
    );
  }
}
