import 'package:flutter/material.dart';

class AksiCepatScreen extends StatelessWidget {
  final VoidCallback onBack;
  const AksiCepatScreen({super.key, required this.onBack});

  @override
  Widget build(BuildContext context) {
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
                    // Back button
                    GestureDetector(
                      onTap: onBack,
                      child: Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: const Icon(Icons.arrow_back, color: Color(0xFF475569), size: 18),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('Aksi Cepat', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                    const SizedBox(height: 4),
                    const Text('Akses cepat ke fitur yang sering digunakan', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
                    const SizedBox(height: 28),

                    // Penjualan
                    const _SectionHeader('Penjualan'),
                    const SizedBox(height: 10),
                    Row(
                      children: const [
                        _ActionItem(icon: Icons.shopping_cart, label: 'Mulai Penjualan', sub: 'POS', color: Color(0xFF2563EB), bgColor: Color(0xFFEFF6FF)),
                        _ActionItem(icon: Icons.history, label: 'Riwayat Transaksi', sub: 'Lihat Semua', color: Color(0xFF9333EA), bgColor: Color(0xFFF3E8FF)),
                        _ActionItem(icon: Icons.assignment_return_outlined, label: 'Retur', sub: 'Retur Penjualan', color: Color(0xFFEA580C), bgColor: Color(0xFFFFF7ED)),
                        _ActionItem(icon: Icons.local_offer_outlined, label: 'Voucher', sub: 'Kelola Voucher', color: Color(0xFFEF4444), bgColor: Color(0xFFFEF2F2)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Inventory
                    const _SectionHeader('Inventory'),
                    const SizedBox(height: 10),
                    Row(
                      children: const [
                        _ActionItem(icon: Icons.inventory_2_outlined, label: 'Inventory', sub: 'Kelola Stok', color: Color(0xFF16A34A), bgColor: Color(0xFFF0FDF4)),
                        _ActionItem(icon: Icons.restaurant_menu, label: 'Recipes', sub: 'Resep Produk', color: Color(0xFFEA580C), bgColor: Color(0xFFFFF7ED)),
                        _ActionItem(icon: Icons.swap_horiz, label: 'Movement', sub: 'Mutasi Stok', color: Color(0xFF0D9488), bgColor: Color(0xFFF0FDFA)),
                        _ActionItem(icon: Icons.checklist, label: 'Stock Opname', sub: 'Hitung Stok', color: Color(0xFF2563EB), bgColor: Color(0xFFEFF6FF)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Operasional
                    const _SectionHeader('Operasional'),
                    const SizedBox(height: 10),
                    Row(
                      children: const [
                        _ActionItem(icon: Icons.group_outlined, label: 'Pengguna', sub: 'Kelola Akun', color: Color(0xFF2563EB), bgColor: Color(0xFFEFF6FF)),
                        _ActionItem(icon: Icons.shopping_bag_outlined, label: 'Pesanan Tertunda', sub: 'Lihat Pesanan', color: Color(0xFF16A34A), bgColor: Color(0xFFF0FDF4)),
                        _ActionItem(icon: Icons.print_outlined, label: 'Cetak Ulang Struk', sub: 'Riwayat Struk', color: Color(0xFF9333EA), bgColor: Color(0xFFF3E8FF)),
                        _ActionItem(icon: Icons.notifications_outlined, label: 'Notifikasi', sub: 'Semua', color: Color(0xFFEA580C), bgColor: Color(0xFFFFF7ED)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Laporan
                    const _SectionHeader('Laporan'),
                    const SizedBox(height: 10),
                    Row(
                      children: const [
                        _ActionItem(icon: Icons.trending_up, label: 'Penjualan', sub: 'Laporan', color: Color(0xFF2563EB), bgColor: Color(0xFFEFF6FF)),
                        _ActionItem(icon: Icons.pie_chart_outlined, label: 'Produk Terlaris', sub: 'Laporan', color: Color(0xFF3B82F6), bgColor: Color(0xFFEFF6FF)),
                        _ActionItem(icon: Icons.bar_chart, label: 'Laba Rugi', sub: 'Keuangan', color: Color(0xFF16A34A), bgColor: Color(0xFFF0FDF4)),
                        _ActionItem(icon: Icons.storefront_outlined, label: 'Performa Outlet', sub: 'Semua', color: Color(0xFF9333EA), bgColor: Color(0xFFF3E8FF)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Custom report banner
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(14)),
                      child: Row(
                        children: [
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Butuh laporan khusus?', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1D4ED8), fontSize: 14)),
                                SizedBox(height: 4),
                                Text('Buat laporan kustom sesuai kebutuhan bisnis Anda.', style: TextStyle(color: Color(0xFF60A5FA), fontSize: 12)),
                                SizedBox(height: 10),
                                _CustomReportBtn(),
                              ],
                            ),
                          ),
                          const Icon(Icons.description_outlined, color: Color(0xFF93C5FD), size: 48),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
            // Bottom nav
            _BottomNav(onBack: onBack),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String text;
  const _SectionHeader(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)));
  }
}

class _ActionItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sub;
  final Color color;
  final Color bgColor;

  const _ActionItem({required this.icon, required this.label, required this.sub, required this.color, required this.bgColor});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 3),
        child: Column(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF334155)), textAlign: TextAlign.center),
            const SizedBox(height: 2),
            Text(sub, style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8)), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _CustomReportBtn extends StatelessWidget {
  const _CustomReportBtn();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Buat Laporan', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF2563EB))),
          SizedBox(width: 4),
          Icon(Icons.chevron_right, color: Color(0xFF2563EB), size: 14),
        ],
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final VoidCallback onBack;
  const _BottomNav({required this.onBack});

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
        children: [
          _navItem(Icons.home, 'Dashboard', false, onBack),
          _navItem(Icons.shopping_cart_outlined, 'POS', false, () {}),
          _navItem(Icons.inventory_2_outlined, 'Inventory', false, () {}),
          _navItem(Icons.bar_chart, 'Laporan', false, () {}),
          _navItem(Icons.more_horiz, 'Lainnya', true, () {}),
        ],
      ),
    );
  }

  Widget _navItem(IconData icon, String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: active ? const Color(0xFF2563EB) : const Color(0xFF94A3B8)),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: active ? FontWeight.w500 : FontWeight.normal,
              color: active ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }
}
