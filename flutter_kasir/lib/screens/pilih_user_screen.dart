import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/app_state.dart';

class PilihUserScreen extends StatelessWidget {
  final VoidCallback onSelectUser;
  const PilihUserScreen({super.key, required this.onSelectUser});

  static const _users = [
    PilotUser(name: 'Kasir Utama', role: 'Kasir', shift: '09:00 - 23:00', seed: 'Kasir1', roleColor: 'blue'),
    PilotUser(name: 'Sarah', role: 'Supervisor', shift: '10:00 - 22:00', seed: 'Sarah', roleColor: 'purple'),
    PilotUser(name: 'Andi', role: 'Manager', shift: '08:00 - 17:00', seed: 'Andi', roleColor: 'orange'),
    PilotUser(name: 'Dewi', role: 'Kasir', shift: '12:00 - 21:00', seed: 'Dewi', roleColor: 'amber'),
  ];

  Color _roleBgColor(String roleColor) {
    switch (roleColor) {
      case 'purple': return const Color(0xFFF3E8FF);
      case 'orange': return const Color(0xFFFFF7ED);
      case 'amber': return const Color(0xFFFEF3C7);
      default: return const Color(0xFFDBEAFE);
    }
  }

  Color _roleTextColor(String roleColor) {
    switch (roleColor) {
      case 'purple': return const Color(0xFF9333EA);
      case 'orange': return const Color(0xFFEA580C);
      case 'amber': return const Color(0xFFD97706);
      default: return const Color(0xFF2563EB);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Container(
      color: const Color(0xFFF8FAFF),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header
              Stack(
                children: [
                  Positioned(
                    top: -48, right: -56,
                    child: Container(width: 176, height: 176, decoration: const BoxDecoration(color: Color(0xFFEFF6FF), shape: BoxShape.circle)),
                  ),
                  Positioned(
                    top: 80, right: -24,
                    child: Container(width: 80, height: 80, decoration: BoxDecoration(color: const Color(0xFFEFF6FF).withOpacity(0.7), shape: BoxShape.circle)),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(28, 48, 28, 0),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48, height: 48,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(18),
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                boxShadow: [
                                  BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.25), blurRadius: 12, offset: const Offset(0, 4)),
                                ],
                              ),
                              child: const Icon(Icons.restaurant, color: Colors.white, size: 22),
                            ),
                            const SizedBox(width: 12),
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text.rich(
                                  TextSpan(
                                    children: [
                                      TextSpan(text: 'Pilot', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                                      TextSpan(text: 'POS', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF2563EB))),
                                    ],
                                  ),
                                ),
                                Text('Restaurant POS System', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Selamat Datang!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                                  SizedBox(height: 6),
                                  Text('Pilih pengguna untuk masuk ke sistem sesuai dengan hak akses Anda.',
                                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, height: 1.5)),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Mini store illustration
                            SizedBox(
                              width: 128, height: 112,
                              child: Stack(
                                children: [
                                  const Positioned(
                                    top: 0, right: 8,
                                    child: Icon(Icons.cloud_outlined, color: Color(0xFFDBE6FE), size: 22),
                                  ),
                                  Positioned(
                                    bottom: 0, left: 16,
                                    child: Container(
                                      width: 96, height: 88,
                                      decoration: BoxDecoration(
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                                        gradient: const LinearGradient(
                                          colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                        ),
                                        boxShadow: [
                                          BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.25), blurRadius: 12, offset: const Offset(0, 4)),
                                        ],
                                      ),
                                      child: Stack(
                                        children: [
                                          Positioned(
                                            top: -12, left: 12, right: 12,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6)),
                                              child: const Text('PILOTPOS', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: Color(0xFF2563EB), letterSpacing: 1)),
                                            ),
                                          ),
                                          const Center(child: Icon(Icons.store, color: Colors.white, size: 30)),
                                        ],
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    bottom: 0, left: 4,
                                    child: Container(width: 12, height: 32, decoration: BoxDecoration(color: const Color(0xFFBFDBFE), borderRadius: BorderRadius.circular(99))),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Content below header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  children: [
                    // Outlet + Sync info card
                    Container(
                      padding: const EdgeInsets.all(14),
                      margin: const EdgeInsets.only(top: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 4)],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Container(
                                  width: 36, height: 36,
                                  decoration: const BoxDecoration(color: Color(0xFFEFF6FF), shape: BoxShape.circle),
                                  child: const Icon(Icons.location_on, color: Color(0xFF2563EB), size: 16),
                                ),
                                const SizedBox(width: 8),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Outlet Aktif', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                                      Row(
                                        children: [
                                          Flexible(child: Text('Outlet Jakarta', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)))),
                                          Icon(Icons.expand_more, color: Color(0xFF94A3B8), size: 14),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(width: 1, height: 36, color: const Color(0xFFF1F5F9)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Row(
                              children: [
                                Container(
                                  width: 36, height: 36,
                                  decoration: const BoxDecoration(color: Color(0xFFEFF6FF), shape: BoxShape.circle),
                                  child: const Icon(Icons.sync, color: Color(0xFF2563EB), size: 16),
                                ),
                                const SizedBox(width: 8),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Terakhir sinkronisasi', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                                      Row(
                                        children: [
                                          Text('Hari ini, 09:15', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155))),
                                          SizedBox(width: 4),
                                          _ConnectedBadge(),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // User section header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Pengguna di Outlet Jakarta', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF334155))),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(99)),
                          child: const Text('4 Pengguna', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF2563EB))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // User cards
                    ...List.generate(_users.length, (i) {
                      final user = _users[i];
                      final isSelected = appState.selectedUser.name == user.name;
                      return Padding(
                        padding: EdgeInsets.only(bottom: i < _users.length - 1 ? 12 : 0),
                        child: _UserCard(
                          user: user,
                          isSelected: isSelected,
                          roleBgColor: _roleBgColor(user.roleColor),
                          roleTextColor: _roleTextColor(user.roleColor),
                          onTap: () {
                            appState.selectUser(user);
                            Future.delayed(const Duration(milliseconds: 350), onSelectUser);
                          },
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                    // Login akun lain
                    _OtherLoginCard(onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('Gunakan halaman login untuk masuk dengan akun lain'),
                          backgroundColor: const Color(0xFF2563EB),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    }),
                    const SizedBox(height: 20),
                    // Security notice
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(14)),
                      child: Row(
                        children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(99), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4)]),
                            child: const Icon(Icons.verified_user, color: Color(0xFF2563EB), size: 18),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Akun Anda aman', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1D4ED8))),
                                SizedBox(height: 2),
                                Text('Semua aktivitas akan tercatat dan sesuai dengan peran serta hak akses pengguna.',
                                  style: TextStyle(fontSize: 12, color: Color(0xFF60A5FA))),
                              ],
                            ),
                          ),
                          const Icon(Icons.lock_outline, color: Color(0xFF93C5FD), size: 22),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConnectedBadge extends StatelessWidget {
  const _ConnectedBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(99)),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.circle, size: 6, color: Color(0xFF22C55E)),
          SizedBox(width: 4),
          Text('Terhubung', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w500, color: Color(0xFF16A34A))),
        ],
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final PilotUser user;
  final bool isSelected;
  final Color roleBgColor;
  final Color roleTextColor;
  final VoidCallback onTap;

  const _UserCard({
    required this.user, required this.isSelected,
    required this.roleBgColor, required this.roleTextColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Stack(
              children: [
                ClipOval(
                  child: Image.network(user.avatarUrl, width: 48, height: 48),
                ),
                Positioned(
                  bottom: 0, right: 0,
                  child: Container(
                    width: 12, height: 12,
                    decoration: const BoxDecoration(color: Color(0xFF22C55E), shape: BoxShape.circle),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user.name, style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: roleBgColor, borderRadius: BorderRadius.circular(6)),
                    child: Text(user.role, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: roleTextColor)),
                  ),
                  const SizedBox(height: 6),
                  _InfoRow(icon: Icons.access_time, text: 'Shift ${user.shift}'),
                  const SizedBox(height: 2),
                  const _InfoRow(icon: Icons.store, text: 'Outlet Jakarta'),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFCBD5E1)),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 12, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
      ],
    );
  }
}

class _OtherLoginCard extends StatelessWidget {
  final VoidCallback onTap;
  const _OtherLoginCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(14)),
              child: const Icon(Icons.person_add, color: Color(0xFF2563EB), size: 20),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Login akun lain', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                  Text('Gunakan akun email dan password', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFFCBD5E1)),
          ],
        ),
      ),
    );
  }
}
