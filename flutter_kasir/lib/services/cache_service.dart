import 'package:hive_flutter/hive_flutter.dart';
import 'recipe_service.dart';

/// Layanan cache lokal menggunakan Hive.
///
/// Flow:
///   1. API sukses → simpan ke Hive (auto-update)
///   2. API gagal  → baca dari Hive (offline fallback)
///   3. Hive kosong → fallback ke dummy hardcoded
class CacheService {
  static const String _boxName = 'recipe_cache';
  static const String _recipesKey = 'recipes';
  static const String _lastSyncKey = 'last_sync';

  Box? _box;

  /// Inisialisasi box Hive. Panggil sekali di main.dart.
  Future<void> init() async {
    _box = await Hive.openBox(_boxName);
  }

  /// Simpan hasil fetch API ke cache lokal.
  Future<void> saveRecipes(List<RecipeItem> recipes) async {
    if (_box == null) return;
    final jsonList = recipes.map((r) => r.toJson()).toList();
    await _box!.put(_recipesKey, jsonList);
    await _box!.put(_lastSyncKey, DateTime.now().toIso8601String());
  }

  /// Baca resep dari cache lokal. Return null kalau belum pernah disimpan.
  List<RecipeItem>? loadRecipes() {
    if (_box == null) return null;
    final raw = _box!.get(_recipesKey);
    if (raw == null || raw is! List || raw.isEmpty) return null;

    try {
      return raw
          .map((item) => RecipeItem.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (_) {
      return null; // corrupted cache → fallback
    }
  }

  /// Timestamp sinkronisasi terakhir (ISO 8601 string), atau null.
  String? getLastSync() {
    return _box?.get(_lastSyncKey);
  }

  /// Format timestamp jadi string singkat untuk UI (contoh: "12 Mar, 14:30").
  String? getLastSyncFormatted() {
    final ts = getLastSync();
    if (ts == null) return null;
    try {
      final dt = DateTime.parse(ts);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '${dt.day} ${months[dt.month - 1]}, $h:$m';
    } catch (_) {
      return null;
    }
  }

  /// Apakah cache tersedia?
  bool get hasCache => _box != null && _box!.get(_recipesKey) != null;

  /// Hapus semua cache (untuk force-refresh atau logout).
  Future<void> clear() async {
    await _box?.clear();
  }
}
