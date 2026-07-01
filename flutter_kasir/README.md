# 📱 RestoFlow Kasir — Flutter Native APK

Aplikasi kasir native Android untuk **RestoFlow** — dibangun dengan **Flutter/Dart**, 
terhubung langsung ke backend Express.js + PostgreSQL yang sudah ada.

> **Mirror dari:** `src/components/kasir/KasirMode.tsx` (React Web)
> **Backend:** `server/` (Express + PostgreSQL) — **tanpa perubahan backend**

---

## 🎯 Mengapa Flutter?

| Fitur | PWA (sebelumnya) | Flutter APK (sekarang) |
|-------|------------------|------------------------|
| Bluetooth Thermal Print | ❌ Web Bluetooth terbatas | ✅ `flutter_blue_plus` — akses penuh |
| Kamera OCR | ❌ Browser terbatas | ✅ Native camera |
| Offline Mode | ⚠️ Service Worker (terbatas) | ✅ SQLite lokal |
| Play Store | ❌ Tidak bisa publish | ✅ Upload APK/AAB |
| Performa | ⚠️ Browser overhead | ✅ Native ARM |
| Install | Tambah ke Home Screen | Download & install APK |

---

## 📁 Struktur Project

```
flutter_kasir/
├── lib/
│   ├── main.dart                    # Entry point + splash gate + theme
│   ├── models/
│   │   └── models.dart              # Semua data models (mirror src/types.ts)
│   ├── services/
│   │   ├── api_client.dart          # HTTP client + JWT auto-refresh
│   │   └── auth_service.dart        # Login, PIN login, shift, logout
│   ├── providers/
│   │   ├── auth_provider.dart       # State auth (ChangeNotifier)
│   │   └── cart_provider.dart       # State cart + checkout (mirror useCart.ts)
│   ├── screens/
│   │   ├── login_screen.dart        # Login dengan password / PIN
│   │   └── kasir_screen.dart        # Main screen dengan tab POS/Riwayat/Voucher
│   └── widgets/
│       ├── menu_grid.dart           # Grid menu (mirror KasirMenuGrid.tsx)
│       ├── cart_panel.dart          # Panel keranjang kanan (mirror KasirCartPanel.tsx)
│       ├── option_sheet.dart        # Modal kustomisasi pesanan
│       ├── receipt_modal.dart       # Modal struk sukses (mirror receipt modal)
│       ├── history_tab.dart         # Tab riwayat transaksi + filter payment
│       └── voucher_tab.dart         # Tab voucher + generator kode diskon
├── android/                         # Konfigurasi Android (APK build)
├── assets/                          # Icon & images
├── pubspec.yaml                     # Dependencies Flutter
└── README.md                        # File ini
```

---

## 🚀 Setup & Build

### Prasyarat
- **Flutter SDK** 3.2+
- **Android Studio** / Android SDK
- **Backend RestoFlow** running (via `npm run dev:server`)

### 1. Clone & Install

```bash
cd flutter_kasir
flutter pub get
```

### 2. Konfigurasi Server URL

Edit `lib/services/api_client.dart` line 7:

```dart
static String _baseUrl = 'http://192.168.1.5:3000'; // Ganti IP server kamu
```

Atau set lewat UI login → "Konfigurasi Server".

### 3. Build APK

```bash
# Debug build (untuk testing)
flutter build apk --debug

# Release build (untuk distribusi)
flutter build apk --release
```

APK akan muncul di: `build/app/outputs/flutter-apk/app-release.apk`

### 4. Install ke Device

```bash
# Via USB
flutter install

# Atau copy APK langsung ke HP
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## 🔗 API Endpoints yang Dipakai

Semua endpoint **sama persis dengan web app** — backend tidak perlu diubah:

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/auth/login` | POST | Login password (Pemilik) |
| `/api/auth/login-pin` | POST | Login PIN (Staff/Kasir) |
| `/api/auth/shifts-by-username/:username` | GET | Ambil daftar shift |
| `/api/auth/logout` | POST | Akhiri shift |
| `/api/auth/refresh` | POST | Refresh JWT token |
| `/api/recipes` | GET | Daftar resep + harga |
| `/api/ingredients` | GET | Daftar bahan + stok |
| `/api/sales` | GET + POST | Riwayat & catat transaksi |
| `/api/vouchers` | GET + POST | List & buat voucher |
| `/api/vouchers/validate?code=X` | GET | Validasi kode voucher |

---

## 🎨 Design Parity

Desain Flutter **sengaja dimiripkan** dengan React web:

- 🟣 **Warna aksen:** `#7C3AED` (purple) dengan gradient `#A855F7`
- 📊 **Tab bar:** POS / Riwayat / Voucher — dengan badge counter
- 🧩 **Menu grid:** 3 kolom, kartu dengan gradient per kategori
- 🛒 **Cart panel:** Sisi kanan, item + qty + subtotal + voucher
- 💳 **Payment:** CASH / QRIS — input uang + kembalian
- 🎫 **Voucher:** Static codes (RESTFLOW10, HEMAT20) + DB vouchers
- 📋 **History:** Tabel dengan payment breakdown cards
- ✅ **Receipt:** Modal sukses hijau dengan animasi checkmark

---

## 📦 Dependencies Utama

| Package | Versi | Kegunaan |
|---------|-------|----------|
| `provider` | ^6.1.2 | State management |
| `http` | ^1.2.1 | REST API client |
| `shared_preferences` | ^2.2.3 | Token & config storage |
| `intl` | ^0.19.0 | Format mata uang IDR |
| `flutter_blue_plus` | ^1.32.4 | Bluetooth thermal printer |
| `google_fonts` | ^6.1.0 | Typography Plus Jakarta Sans |
| `pdf` + `printing` | latest | Export struk PDF |

---

## 🛠️ TODO / Roadmap

- [ ] Bluetooth thermal print implementation
- [ ] Camera OCR receipt scanning
- [ ] Offline mode dengan SQLite cache
- [ ] Background sync saat online kembali
- [ ] iOS build
- [ ] Push notification (order ready)
- [ ] Upload ke Google Play Store

---

*Dibangun dengan ❤️ untuk RestoFlow v1.0*
