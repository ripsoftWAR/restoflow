import 'api_service.dart';

/// Recipe Service — fetch menu produk dari backend.
class RecipeService {
  final ApiService _api = ApiService();

  /// GET /api/recipes — ambil semua menu aktif untuk POS.
  /// Returns list of [RecipeItem] siap pakai.
  Future<List<RecipeItem>> getRecipes() async {
    final response = await _api.get('/api/recipes');

    if (!response.success || response.data == null) {
      throw Exception(response.error ?? 'Gagal memuat menu');
    }

    // Response adalah array langsung (bukan dibungkus {data: [...]})
    final list = response.data;
    if (list is! List) {
      // Coba fallback: cari key 'data' di dalam map
      if (list is Map && list['data'] is List) {
        return (list['data'] as List)
            .map((r) => RecipeItem.fromJson(r as Map<String, dynamic>))
            .toList();
      }
      return [];
    }

    return list
        .map((r) => RecipeItem.fromJson(r as Map<String, dynamic>))
        .toList();
  }
}

/// Model ringan untuk tampilan di POS.
class RecipeItem {
  final int id;
  final String name;
  final int price;
  final String category;
  final String emoji;
  final String desc;
  final List<RecipeIngredientItem> ingredients;
  final bool hasSpiceOption;
  final bool hasSugarOption;
  final String customOptions;

  const RecipeItem({
    required this.id,
    required this.name,
    required this.price,
    required this.category,
    required this.emoji,
    this.desc = '',
    this.ingredients = const [],
    this.hasSpiceOption = false,
    this.hasSugarOption = false,
    this.customOptions = '',
  });

  factory RecipeItem.fromJson(Map<String, dynamic> json) {
    final name = json['menu_name']?.toString() ?? '';
    final category = json['category']?.toString() ?? 'Makanan';
    final items = (json['items'] as List?)
            ?.map((i) => RecipeIngredientItem.fromJson(i as Map<String, dynamic>))
            .toList() ??
        const [];

    return RecipeItem(
      id: json['recipe_id'] ?? 0,
      name: name,
      price: (json['price'] is num ? (json['price'] as num).toInt() : 0),
      category: category,
      emoji: _emojiFor(name, category),
      desc: json['description']?.toString() ?? '',
      ingredients: items,
      hasSpiceOption: json['spice_level_option'] == 1 || json['spice_level_option'] == true,
      hasSugarOption: json['sugar_level_option'] == 1 || json['sugar_level_option'] == true,
      customOptions: json['custom_options']?.toString() ?? '',
    );
  }

  /// Emoji mapping berdasarkan kategori + nama
  static String _emojiFor(String name, String category) {
    final lower = name.toLowerCase();

    // By name
    if (lower.contains('nasi') || lower.contains('goreng')) return '🍳';
    if (lower.contains('ayam') || lower.contains('geprek')) return '🍗';
    if (lower.contains('steak') || lower.contains('sapi')) return '🥩';
    if (lower.contains('salmon') || lower.contains('ikan')) return '🐟';
    if (lower.contains('udang')) return '🦐';
    if (lower.contains('mie')) return '🍜';
    if (lower.contains('burger')) return '🍔';
    if (lower.contains('kentang')) return '🍟';
    if (lower.contains('sandwich')) return '🥪';
    if (lower.contains('sup') || lower.contains('sop')) return '🍲';
    if (lower.contains('cah') || lower.contains('kangkung')) return '🥬';

    // By category
    switch (category.toLowerCase()) {
      case 'minuman':
        if (lower.contains('kopi') || lower.contains('latte') || lower.contains('cappuccino')) return '☕';
        if (lower.contains('matcha') || lower.contains('teh')) return '🍵';
        if (lower.contains('sirup')) return '🥤';
        return '🥤';
      case 'makanan':
        return '🍽️';
      case 'snack':
        return '🍿';
      case 'dessert':
        return '🍰';
      default:
        return '📦';
    }
  }
}

/// Bahan dalam sebuah resep.
class RecipeIngredientItem {
  final int id;
  final int ingredientId;
  final double amount;
  final String ingredientName;
  final String baseUnit;

  const RecipeIngredientItem({
    required this.id,
    required this.ingredientId,
    required this.amount,
    required this.ingredientName,
    required this.baseUnit,
  });

  factory RecipeIngredientItem.fromJson(Map<String, dynamic> json) {
    return RecipeIngredientItem(
      id: json['id'] ?? 0,
      ingredientId: json['ingredient_id'] ?? 0,
      amount: (json['amount'] is num ? (json['amount'] as num).toDouble() : 0.0),
      ingredientName: json['ingredient_name']?.toString() ?? '',
      baseUnit: json['base_unit']?.toString() ?? 'gram',
    );
  }
}
