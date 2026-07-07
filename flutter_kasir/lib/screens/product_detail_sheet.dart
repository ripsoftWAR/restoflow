import 'package:flutter/material.dart';
import 'pos_screen.dart';

// ── Add-on model ──
class _Addon {
  final String name;
  final int price;
  bool selected;

  _Addon({required this.name, required this.price, this.selected = false});
}

// ── Size option model ──
class _SizeOption {
  final String name;
  final int extraPrice;

  const _SizeOption({required this.name, required this.extraPrice});
}

const _sizes = [
  _SizeOption(name: 'Reguler', extraPrice: 0),
  _SizeOption(name: 'Large', extraPrice: 4000),
  _SizeOption(name: 'Extra Large', extraPrice: 8000),
];

// ═══════════════════════════════════════════════
//  PRODUCT DETAIL SHEET
// ═══════════════════════════════════════════════
class ProductDetailSheet extends StatefulWidget {
  final ProductItem product;

  const ProductDetailSheet({super.key, required this.product});

  @override
  State<ProductDetailSheet> createState() => _ProductDetailSheetState();
}

class _ProductDetailSheetState extends State<ProductDetailSheet> {
  int _qty = 1;
  int _selectedSizeIdx = 0;
  final _noteCtrl = TextEditingController();

  final List<_Addon> _addons = [
    _Addon(name: 'Extra Shot Espresso', price: 5000),
    _Addon(name: 'Susu Oat', price: 6000),
    _Addon(name: 'Syrup Caramel', price: 4000),
    _Addon(name: 'Whipped Cream', price: 5000),
  ];

  int get _basePrice => widget.product.price;
  int get _sizeExtra => _sizes[_selectedSizeIdx].extraPrice;
  int get _addonTotal =>
      _addons.where((a) => a.selected).fold(0, (s, a) => s + a.price);
  int get _unitPrice => _basePrice + _sizeExtra + _addonTotal;
  int get _totalPrice => _unitPrice * _qty;

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }

  void _addToCart() {
    final item = CartItem(
      name: widget.product.name,
      price: _unitPrice,
      emoji: widget.product.emoji,
      qty: _qty,
      variant: _sizes[_selectedSizeIdx].name,
      note: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
      addons: _addons.where((a) => a.selected).map((a) => a.name).toList(),
    );
    Navigator.of(context).pop(item);
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle + close
          _SheetHeader(onClose: () => Navigator.of(context).pop()),

          // Scrollable content
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // Product top section
                  _ProductTop(
                    emoji: product.emoji,
                    name: product.name,
                    desc: product.desc,
                    unitPrice: _unitPrice,
                  ),
                  // Section: Ukuran
                  _SizeSection(
                    sizes: _sizes,
                    basePrice: _basePrice,
                    selectedIdx: _selectedSizeIdx,
                    onSelect: (idx) => setState(() => _selectedSizeIdx = idx),
                  ),
                  // Section: Catatan
                  _NoteSection(controller: _noteCtrl),
                  // Section: Tambahan
                  _AddonSection(
                    addons: _addons,
                    onToggle: (idx) => setState(() => _addons[idx].selected = !_addons[idx].selected),
                  ),
                ],
              ),
            ),
          ),

          // Footer
          _SheetFooter(
            qty: _qty,
            totalPrice: _totalPrice,
            onQtyChange: (delta) => setState(() => _qty = (_qty + delta).clamp(1, 99)),
            onAdd: _addToCart,
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  SHEET HEADER (drag handle + close)
// ═══════════════════════════════════════════════
class _SheetHeader extends StatelessWidget {
  final VoidCallback onClose;
  const _SheetHeader({required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Column(
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          const SizedBox(height: 16),
          // Close button (aligned right)
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              GestureDetector(
                onTap: onClose,
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: const Icon(Icons.close, color: Color(0xFF475569), size: 18),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  PRODUCT TOP (image + name + desc + price + badge)
// ═══════════════════════════════════════════════
class _ProductTop extends StatelessWidget {
  final String emoji;
  final String name;
  final String desc;
  final int unitPrice;

  const _ProductTop({
    required this.emoji,
    required this.name,
    required this.desc,
    required this.unitPrice,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product image
              Container(
                width: 110,
                height: 110,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(emoji, style: const TextStyle(fontSize: 52)),
                ),
              ),
              const SizedBox(width: 16),
              // Meta
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    if (desc.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        desc,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF64748B),
                          height: 1.5,
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Text(
                      _fmt(unitPrice),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('⭐', style: TextStyle(fontSize: 12)),
                          SizedBox(width: 4),
                          Text(
                            'Minuman Favorit',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF92400E),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(height: 1, color: const Color(0xFFE2E8F0)),
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
//  SIZE SECTION
// ═══════════════════════════════════════════════
class _SizeSection extends StatelessWidget {
  final List<_SizeOption> sizes;
  final int basePrice;
  final int selectedIdx;
  final ValueChanged<int> onSelect;

  const _SizeSection({
    required this.sizes,
    required this.basePrice,
    required this.selectedIdx,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ukuran',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: List.generate(sizes.length, (idx) {
              final size = sizes[idx];
              final price = basePrice + size.extraPrice;
              final isSelected = idx == selectedIdx;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    left: idx == 0 ? 0 : 4,
                    right: idx == sizes.length - 1 ? 0 : 4,
                  ),
                  child: GestureDetector(
                    onTap: () => onSelect(idx),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFFEFF6FF)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF2563EB)
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Column(
                        children: [
                          Text(
                            size.name,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? const Color(0xFF2563EB)
                                  : const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _fmt(price),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? const Color(0xFF2563EB)
                                  : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 16),
          Container(height: 1, color: const Color(0xFFE2E8F0)),
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
//  NOTE SECTION
// ═══════════════════════════════════════════════
class _NoteSection extends StatefulWidget {
  final TextEditingController controller;
  const _NoteSection({required this.controller});

  @override
  State<_NoteSection> createState() => _NoteSectionState();
}

class _NoteSectionState extends State<_NoteSection> {
  int _charCount = 0;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(() {
      setState(() => _charCount = widget.controller.text.length);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text(
                'Catatan',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              SizedBox(width: 6),
              Text(
                '(opsional)',
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFFCBD5E1),
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
              ),
            ),
            padding: const EdgeInsets.fromLTRB(14, 2, 14, 2),
            child: TextField(
              controller: widget.controller,
              maxLength: 50,
              maxLines: 2,
              minLines: 1,
              onChanged: (_) => setState(() {}),
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF0F172A),
              ),
              decoration: const InputDecoration(
                hintText: 'Contoh: Kurangi gula, tanpa es, dll',
                hintStyle: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.symmetric(vertical: 12),
                counterText: '',
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(height: 1, color: const Color(0xFFE2E8F0)),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════
//  ADDON SECTION
// ═══════════════════════════════════════════════
class _AddonSection extends StatelessWidget {
  final List<_Addon> addons;
  final ValueChanged<int> onToggle;

  const _AddonSection({required this.addons, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text(
                'Tambahan',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              SizedBox(width: 6),
              Text(
                '(opsional)',
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFFCBD5E1),
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...List.generate(addons.length, (idx) {
            final addon = addons[idx];
            final isLast = idx == addons.length - 1;
            return Column(
              children: [
                GestureDetector(
                  onTap: () => onToggle(idx),
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Row(
                      children: [
                        // Checkbox
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: addon.selected
                                ? const Color(0xFF2563EB)
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: addon.selected
                                  ? const Color(0xFF2563EB)
                                  : const Color(0xFFE2E8F0),
                              width: 2,
                            ),
                          ),
                          child: addon.selected
                              ? const Icon(Icons.check, color: Colors.white, size: 13)
                              : null,
                        ),
                        const SizedBox(width: 12),
                        // Name
                        Expanded(
                          child: Text(
                            addon.name,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        // Price
                        Text(
                          '+${_fmt(addon.price)}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (!isLast)
                  Container(height: 1, color: const Color(0xFFF1F5F9)),
              ],
            );
          }),
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
//  SHEET FOOTER (qty + add to cart button)
// ═══════════════════════════════════════════════
class _SheetFooter extends StatelessWidget {
  final int qty;
  final int totalPrice;
  final ValueChanged<int> onQtyChange;
  final VoidCallback onAdd;

  const _SheetFooter({
    required this.qty,
    required this.totalPrice,
    required this.onQtyChange,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          // Qty control
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFE2E8F0)),
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: () => onQtyChange(-1),
                  child: const SizedBox(
                    width: 28,
                    height: 28,
                    child: Icon(Icons.remove, color: Color(0xFF2563EB), size: 20),
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 24,
                  child: Text(
                    '$qty',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: () => onQtyChange(1),
                  child: const SizedBox(
                    width: 28,
                    height: 28,
                    child: Icon(Icons.add, color: Color(0xFF2563EB), size: 20),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Add to cart button
          Expanded(
            child: GestureDetector(
              onTap: onAdd,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SizedBox(width: 16),
                    const Row(
                      children: [
                        Icon(Icons.shopping_cart_outlined, color: Colors.white, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Tambah ke Keranjang',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    Padding(
                      padding: const EdgeInsets.only(right: 16),
                      child: Text(
                        _fmt(totalPrice),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
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
