import 'package:flutter/material.dart';
import '../services/recipe_service.dart';
import '../services/cache_service.dart';
import '../main.dart' show cacheService;
import 'cart_screen.dart';
import 'product_detail_sheet.dart';

// ── Simple model ──
class CartItem {
  final String name;
  final int price;
  final String emoji;
  int qty;
  String? note;
  String variant;
  List<String> addons;

  CartItem({
    required this.name,
    required this.price,
    required this.emoji,
    this.qty = 1,
    this.note,
    this.variant = 'Reguler',
    this.addons = const [],
  });

  int get total => price * qty;
}

// ── Product data ──
class ProductItem {
  final String name;
  final int price;
  final String emoji;
  final String category;
  final String id;
  final String desc;

  const ProductItem({
    required this.id,
    required this.name,
    required this.price,
    required this.emoji,
    required this.category,
    this.desc = '',
  });

  factory ProductItem.fromRecipe(RecipeItem r) {
    return ProductItem(
      id: r.id.toString(),
      name: r.name,
      price: r.price,
      emoji: r.emoji,
      category: r.category,
      desc: r.desc,
    );
  }
}

/// Data dummy sebagai fallback — sinkron dengan database (seeder: seed.cjs)
const _dummyProducts = [
  // ── Makanan ──
  ProductItem(id: 'nasi-goreng-spesial', name: 'Nasi Goreng Spesial', price: 28000, emoji: '🍳', category: 'Makanan', desc: 'Nasi goreng spesial dengan 7 bahan pilihan.'),
  ProductItem(id: 'ayam-goreng-crispy', name: 'Ayam Goreng Crispy', price: 25000, emoji: '🍗', category: 'Makanan', desc: 'Ayam goreng crispy dengan bumbu racikan spesial.'),
  ProductItem(id: 'steak-sapi',          name: 'Steak Sapi',           price: 65000, emoji: '🥩', category: 'Makanan', desc: 'Steak daging sapi premium, empuk dan juicy.'),
  ProductItem(id: 'salmon-grill',        name: 'Salmon Grill',         price: 85000, emoji: '🐟', category: 'Makanan', desc: 'Ikan salmon panggang dengan bumbu herb.'),
  ProductItem(id: 'udang-saus-tiram',    name: 'Udang Saus Tiram',     price: 45000, emoji: '🦐', category: 'Makanan', desc: 'Udang segar dimasak dengan saus tiram gurih.'),
  ProductItem(id: 'cah-kangkung',        name: 'Cah Kangkung',         price: 18000, emoji: '🥬', category: 'Makanan', desc: 'Tumis kangkung segar dengan bumbu bawang.'),
  ProductItem(id: 'sup-wortel-kol',      name: 'Sup Wortel Kol',       price: 15000, emoji: '🍲', category: 'Makanan', desc: 'Sup hangat wortel dan kol yang menyegarkan.'),
  // ── Minuman ──
  ProductItem(id: 'es-teh-manis',        name: 'Es Teh Manis',         price: 8000,  emoji: '🍹', category: 'Minuman', desc: 'Teh segar dengan gula pilihan, pas manisnya.'),
  ProductItem(id: 'es-sirup',            name: 'Es Sirup',             price: 10000, emoji: '🧊', category: 'Minuman', desc: 'Sirup rasa buah segar dengan es batu.'),
];

const _categories = ['Semua', 'Makanan', 'Minuman'];

// ═══════════════════════════════════════════════
//  POS SCREEN
// ═══════════════════════════════════════════════
class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  final List<CartItem> _cart = [];
  String _selectedCategory = 'Semua';
  final TextEditingController _searchCtrl = TextEditingController();
  final RecipeService _recipeService = RecipeService();

  List<ProductItem> _products = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchRecipes();
  }

  Future<void> _fetchRecipes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1️⃣ Coba API dulu
      final recipes = await _recipeService.getRecipes();
      if (!mounted) return;

      // Simpan ke cache lokal (auto-update setiap sukses)
      await cacheService.saveRecipes(recipes);

      setState(() {
        _products = recipes.map((r) => ProductItem.fromRecipe(r)).toList();
        _isLoading = false;
      });
    } catch (e) {
      // 2️⃣ API gagal → coba cache Hive
      if (!mounted) return;

      final cached = cacheService.loadRecipes();
      if (cached != null && cached.isNotEmpty) {
        final lastSync = cacheService.getLastSyncFormatted();
        setState(() {
          _products = cached.map((r) => ProductItem.fromRecipe(r)).toList();
          _isLoading = false;
          _errorMessage = '⚠️ Offline — data terakhir: $lastSync. '
              'Transaksi tetap bisa dilanjutkan.';
        });
        return;
      }

      // 3️⃣ Cache juga kosong → fallback dummy (last resort)
      if (!mounted) return;
      setState(() {
        _products = _dummyProducts;
        _isLoading = false;
        _errorMessage = 'Gagal memuat menu dari server. Menampilkan data offline bawaan.';
      });
    }
  }

  void _updateCategories() {
    final cats = <String>{'Semua'};
    for (final p in _products) {
      cats.add(p.category);
    }
    // Update _categories secara dinamis (tidak bisa karena const, tapi dipakai
    // di _CategoryChips — akan kita ganti nanti)
  }

  List<ProductItem> get _filtered {
    var list = _products;
    if (_selectedCategory != 'Semua') {
      list = list.where((p) => p.category == _selectedCategory).toList();
    }
    final q = _searchCtrl.text.toLowerCase();
    if (q.isNotEmpty) {
      list = list.where((p) => p.name.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  int get _cartCount => _cart.fold(0, (s, i) => s + i.qty);
  int get _cartTotal => _cart.fold(0, (s, i) => s + i.total);

  void _addToCart(ProductItem product) {
    setState(() {
      final idx = _cart.indexWhere(
        (i) => i.name == product.name && i.variant == 'Reguler',
      );
      if (idx >= 0) {
        _cart[idx].qty++;
      } else {
        _cart.add(CartItem(
          name: product.name,
          price: product.price,
          emoji: product.emoji,
        ));
      }
    });
  }

  void _addFromDetail(CartItem item) {
    setState(() {
      final idx = _cart.indexWhere(
        (i) => i.name == item.name && i.variant == item.variant,
      );
      if (idx >= 0) {
        _cart[idx].qty += item.qty;
      } else {
        _cart.add(item);
      }
    });
  }

  Future<void> _openDetail(ProductItem product) async {
    final result = await showModalBottomSheet<CartItem>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ProductDetailSheet(product: product),
    );
    if (result != null && mounted) {
      _addFromDetail(result);
    }
  }

  void _removeFromCart(int index) {
    setState(() {
      if (_cart[index].qty > 1) {
        _cart[index].qty--;
      } else {
        _cart.removeAt(index);
      }
    });
  }

  Future<void> _goToCart() async {
    if (_cart.isEmpty) return;
    final result = await Navigator.of(context).push<List<CartItem>>(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => CartScreen(cart: _cart),
        transitionsBuilder: (_, anim, __, child) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(1, 0),
              end: Offset.zero,
            ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOut)),
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );
    if (result != null) {
      setState(() {
        _cart
          ..clear()
          ..addAll(result);
      });
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  // ═══════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    final cats = _getCategories();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(onBack: () => Navigator.of(context).pop()),
            _SearchRow(controller: _searchCtrl, onChanged: (_) => setState(() {})),
            _CategoryChips(
              selected: _selectedCategory,
              categories: cats,
              onSelect: (c) => setState(() => _selectedCategory = c),
            ),
            // Error banner
            if (_errorMessage != null)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3CD),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFFC107)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.wifi_off, size: 14, color: Color(0xFF856404)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF856404)),
                      ),
                    ),
                    GestureDetector(
                      onTap: _fetchRecipes,
                      child: const Text('Coba Lagi',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF856404))),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: _isLoading ? _buildLoading() : _buildProductList(),
            ),
            if (_cart.isNotEmpty)
              _CartBar(
                count: _cartCount,
                total: _cartTotal,
                onTap: _goToCart,
              ),
            const _BottomNav(),
          ],
        ),
      ),
    );
  }

  List<String> _getCategories() {
    final cats = <String>{'Semua'};
    for (final p in _products) {
      cats.add(p.category);
    }
    return cats.toList();
  }

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(color: Color(0xFF2563EB), strokeWidth: 2),
          SizedBox(height: 12),
          Text('Memuat menu...',
              style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
        ],
      ),
    );
  }

  Widget _buildProductList() {
    final filtered = _filtered;
    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off, color: Color(0xFFCBD5E1), size: 48),
            const SizedBox(height: 12),
            const Text('Produk tidak ditemukan',
                style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8))),
          ],
        ),
      );
    }

    // Group by category
    final Map<String, List<ProductItem>> grouped = {};
    for (final p in filtered) {
      grouped.putIfAbsent(p.category, () => []).add(p);
    }

    return ListView(
      padding: const EdgeInsets.only(bottom: 16),
      children: [
        for (final cat in grouped.entries) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
            child: Text(
              cat.key,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: cat.value.map((p) => _ProductCard(
                product: p,
                onAdd: () => _addToCart(p),
                onTap: () => _openDetail(p),
              )).toList(),
            ),
          ),
        ],
      ],
    );
  }
}

// ═══════════════════════════════════════════════
//  TOP BAR
// ═══════════════════════════════════════════════
class _TopBar extends StatelessWidget {
  final VoidCallback onBack;
  const _TopBar({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: onBack,
                child: Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: const Icon(Icons.arrow_back, color: Color(0xFF475569), size: 18),
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'POS / Mulai Penjualan',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Padding(
            padding: EdgeInsets.only(left: 44),
            child: Text(
              'Pilih produk untuk dijual',
              style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  SEARCH ROW
// ═══════════════════════════════════════════════
class _SearchRow extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  const _SearchRow({required this.controller, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFF5F6FA),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: [
                  const Icon(Icons.search, color: Color(0xFF94A3B8), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: controller,
                      onChanged: onChanged,
                      style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
                      decoration: const InputDecoration(
                        hintText: 'Cari produk atau scan barcode',
                        hintStyle: TextStyle(color: Color(0xFFCBD5E1), fontSize: 14),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  const Icon(Icons.qr_code_scanner, color: Color(0xFF94A3B8), size: 18),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFF5F6FA),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: const Row(
              children: [
                Icon(Icons.tune, color: Color(0xFF475569), size: 16),
                SizedBox(width: 6),
                Text('Filter',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF334155))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  CATEGORY CHIPS
// ═══════════════════════════════════════════════
class _CategoryChips extends StatelessWidget {
  final String selected;
  final List<String> categories;
  final ValueChanged<String> onSelect;
  const _CategoryChips({required this.selected, required this.categories, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(bottom: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Row(
          children: categories.map((cat) {
            final isActive = cat == selected;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: GestureDetector(
                onTap: () => onSelect(cat),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isActive ? const Color(0xFF2563EB) : Colors.white,
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(
                      color: isActive ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Text(
                    cat,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isActive ? Colors.white : const Color(0xFF334155),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  PRODUCT CARD (3 per row via Wrap)
// ═══════════════════════════════════════════════
class _ProductCard extends StatelessWidget {
  final ProductItem product;
  final VoidCallback onAdd;
  final VoidCallback onTap;
  const _ProductCard({required this.product, required this.onAdd, required this.onTap});

  @override
  Widget build(BuildContext context) {
    // 3 columns: (screenWidth - 32 padding - 20 gaps) / 3
    final width = (MediaQuery.of(context).size.width - 32 - 20) / 3;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: const [
            BoxShadow(color: Color(0x0A000000), blurRadius: 4, offset: Offset(0, 1)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product image area
            Container(
              width: double.infinity,
              height: width,
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(10),
                  topRight: Radius.circular(10),
                ),
              ),
              child: Center(
                child: Text(product.emoji, style: const TextStyle(fontSize: 36)),
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _fmt(product.price),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                      GestureDetector(
                        onTap: onAdd,
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFDBEAFE)),
                          ),
                          child: const Icon(Icons.add, color: Color(0xFF2563EB), size: 16),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(int v) {
    final p = v.toString().split('');
    final b = StringBuffer('Rp');
    for (int i = 0; i < p.length; i++) {
      if (i > 0 && (p.length - i) % 3 == 0) b.write('.');
      b.write(p[i]);
    }
    return b.toString();
  }
}

// ═══════════════════════════════════════════════
//  CART BAR (sticky bottom)
// ═══════════════════════════════════════════════
class _CartBar extends StatelessWidget {
  final int count;
  final int total;
  final VoidCallback onTap;
  const _CartBar({required this.count, required this.total, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        children: [
          // Cart icon with badge
          GestureDetector(
            onTap: onTap,
            child: Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Center(child: Icon(Icons.shopping_cart, color: Colors.white, size: 22)),
                  Positioned(
                    top: -6, right: -6,
                    child: Container(
                      width: 18, height: 18,
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '$count',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Cart info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '$count Item',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _fmt(total),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2563EB),
                  ),
                ),
              ],
            ),
          ),
          // View cart button
          GestureDetector(
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.shopping_cart_outlined, color: Colors.white, size: 16),
                  SizedBox(width: 6),
                  Text(
                    'Lihat Keranjang',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(width: 4),
                  Icon(Icons.chevron_right, color: Colors.white, size: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _fmt(int v) {
    final p = v.toString().split('');
    final b = StringBuffer('Rp');
    for (int i = 0; i < p.length; i++) {
      if (i > 0 && (p.length - i) % 3 == 0) b.write('.');
      b.write(p[i]);
    }
    return b.toString();
  }
}

// ═══════════════════════════════════════════════
//  BOTTOM NAV
// ═══════════════════════════════════════════════
class _BottomNav extends StatelessWidget {
  const _BottomNav();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        boxShadow: [
          BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, -2)),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _NavItem(Icons.home, 'Dashboard', false, () {}),
          _NavItem(Icons.shopping_cart_outlined, 'POS', true, () {}),
          _NavItem(Icons.inventory_2_outlined, 'Inventory', false, () {}),
          _NavItem(Icons.bar_chart, 'Laporan', false, () {}),
          _NavItem(Icons.more_horiz, 'Lainnya', false, () {}),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _NavItem(this.icon, this.label, this.active, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: active ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                color: active ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
