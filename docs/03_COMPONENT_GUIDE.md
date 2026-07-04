# 🧩 03 — Component Guide — Shared Components PilotPOS

> **Status:** Dokumentasi seluruh Shared Component yang tersedia.
> **Tujuan:** Hindari duplikasi — selalu cek sini sebelum bikin komponen baru.

---

## 📍 Lokasi Komponen

| Lokasi | Jenis | Contoh |
|--------|-------|--------|
| `src/components/ui/` | UI Primitif (general-purpose) | Button, Input, BrandMark |
| `src/components/inventory/shared/` | Shared spesifik fitur | Modal, CatSelect, Field, FormActions |
| `src/components/layout/` | Layout | DesktopLayout, MobileLayout, TabletLayout |
| `src/components/dashboard/shared/` | Shared dashboard | StatCard |

---

## 🔘 Button

**Lokasi:** `src/components/ui/Button.tsx`

### Fungsi

Tombol serbaguna dengan 4 variant, 2 ukuran, dan loading state.

### Props

| Props | Tipe | Default | Deskripsi |
|-------|------|---------|-----------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'outline'` | `'primary'` | Gaya visual tombol |
| `size` | `'md' \| 'lg'` | `'md'` | Ukuran tombol |
| `loading` | `boolean` | `false` | Tampilkan spinner + teks "Memproses..." |
| `icon` | `ReactNode` | — | Icon di kiri teks |
| `children` | `ReactNode` | — | Teks tombol |
| `className` | `string` | — | Class tambahan (hati-hati) |
| `disabled` | `boolean` | — | Nonaktifkan tombol |

### Kapan Digunakan

- **Primary:** Aksi utama di halaman (Simpan, Buat, Kirim)
- **Secondary:** Aksi pendukung (Filter, Refresh)
- **Outline:** Aksi alternatif (Batal, Kembali)
- **Ghost:** Navigasi rendah prioritas, toolbar

### Contoh

```tsx
// Primary — aksi utama
<Button variant="primary" size="md">Simpan Perubahan</Button>

// Primary dengan icon
<Button variant="primary" icon={<Plus size={16} />}>Tambah Bahan</Button>

// Loading state
<Button variant="primary" loading={isSaving}>Simpan</Button>

// Outline — batal
<Button variant="outline" onClick={onCancel}>Batal</Button>

// Ghost — di toolbar
<Button variant="ghost" icon={<Filter size={16} />}>Filter</Button>

// Danger — hapus (pakai outline + class tambahan)
<Button variant="outline" className="text-pp-danger border-pp-danger hover:bg-pp-danger-soft">
  Hapus
</Button>
```

### Larangan

- ❌ JANGAN pakai `<button>` langsung jika ada `<Button>`
- ❌ JANGAN tambah variant baru tanpa update dokumentasi
- ❌ JANGAN pakai className untuk ganti warna background (pakai variant)

---

## 📝 Input

**Lokasi:** `src/components/ui/Input.tsx`

### Fungsi

Input teks dengan label, error, icon, password toggle.

### Props

| Props | Tipe | Default | Deskripsi |
|-------|------|---------|-----------|
| `label` | `string` | — | Label di atas input |
| `error` | `string \| null` | — | Pesan error (merah) |
| `icon` | `ReactNode` | — | Icon kiri dalam input |
| `showPasswordToggle` | `boolean` | — | Tombol show/hide password |
| `hint` | `string` | — | Teks kecil di kanan label |
| `type` | `string` | `'text'` | Tipe HTML input |
| `className` | `string` | — | Class tambahan |

### Contoh

```tsx
// Input dasar
<Input placeholder="Nama bahan..." />

// Input dengan label
<Input label="Nama Bahan" placeholder="Masukkan nama bahan" />

// Input dengan error
<Input label="Email" error="Format email tidak valid" />

// Input dengan icon
<Input icon={<Search size={16} />} placeholder="Cari..." />

// Input password
<Input label="Password" type="password" showPasswordToggle />

// Input dengan hint
<Input label="Stok" hint="gram" type="number" />
```

### Larangan

- ❌ JANGAN bikin wrapper Input sendiri
- ❌ JANGAN styling input langsung (pakai Input component)

---

## 🏷️ BrandMark

**Lokasi:** `src/components/ui/BrandMark.tsx`

### Fungsi

Logo PilotPOS: kotak biru + teks "PilotPOS" + tagline opsional.

### Props

| Props | Tipe | Default | Deskripsi |
|-------|------|---------|-----------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Ukuran logo |
| `showTagline` | `boolean` | `true` | Tampilkan subtitle |

### Contoh

```tsx
// Default (sidebar)
<BrandMark size="md" showTagline={true} />

// Compact (mobile header)
<BrandMark size="sm" showTagline={false} />

// Besar (landing hero)
<BrandMark size="lg" showTagline={true} />
```

### Larangan

- ❌ JANGAN membuat logo manual dengan div kotak biru + teks
- ❌ JANGAN ganti warna kotak (harus `#2563EB`)

---

## 🔢 PinInput

**Lokasi:** `src/components/ui/PinInput.tsx`

### Fungsi

Input 6-digit PIN untuk verifikasi. Hanya angka, auto-fokus, autocomplete="off".

### Kapan Digunakan

Hanya di `PinVerificationView` — untuk verifikasi identitas setelah pilih user.

---

## 🪟 Modal

**Lokasi:** `src/components/inventory/shared/Modal.tsx`

### Fungsi

Overlay modal dengan backdrop blur, judul, subtitle, dan tombol close.

### Props

| Props | Tipe | Deskripsi |
|-------|------|-----------|
| `title` | `string` | Judul modal |
| `subtitle` | `string` | Subtitle / penjelasan |
| `onClose` | `() => void` | Callback saat close |
| `children` | `ReactNode` | Konten modal |

### Contoh

```tsx
import Modal from '../inventory/shared/Modal';

<Modal 
  title="Tambah Bahan" 
  subtitle="Isi data bahan baku baru" 
  onClose={handleClose}
>
  <form>
    <Input label="Nama Bahan" placeholder="Contoh: Tepung Terigu" />
    <Button variant="primary" className="mt-4 w-full">Simpan</Button>
  </form>
</Modal>
```

### Larangan

- ❌ JANGAN membuat modal inline di komponen fitur
- ❌ JANGAN pakai dialog HTML native

---

## 🏷️ CatSelect (Category Select)

**Lokasi:** `src/components/inventory/shared/CatSelect.tsx`

### Fungsi

Dropdown pilihan kategori inventory dengan warna ikon per kategori.

### Kapan Digunakan

Di form Add/Edit bahan inventory — untuk memilih kategori bahan.

---

## 📋 Field

**Lokasi:** `src/components/inventory/shared/Field.tsx`

### Fungsi

Wrapper form field dengan label + error yang konsisten.

### Kapan Digunakan

Di semua form inventory (AddModal, EditModal, AdjustModal).

---

## 🔘 FormActions

**Lokasi:** `src/components/inventory/shared/FormActions.tsx`

### Fungsi

Container tombol Batal + Simpan di bagian bawah form/modal.

### Kapan Digunakan

Di semua form inventory — konsisten posisi tombol.

---

## 📊 StatCard

**Lokasi:** `src/components/dashboard/shared/StatCard.tsx`

### Fungsi

Card statistik kecil dengan label, nilai, dan indikator tren.

### Kapan Digunakan

Di dashboard — untuk menampilkan metric cards.

---

## 📱 Layout Components

### DesktopLayout

**Lokasi:** `src/components/layout/DesktopLayout.tsx`

**Digunakan:** ≥1024px. Sidebar kiri 240px + header + konten.

**Props:**
- `activeTab`, `setActiveTab` — navigasi
- `stats` — data statistik harian
- `rolePrimaryTabs`, `roleSecondaryTabs` — menu berdasarkan role
- `onLogout` — handler logout
- `children` — konten halaman

### TabletLayout

**Lokasi:** `src/components/layout/TabletLayout.tsx`

**Digunakan:** 768px–1023px. Sidebar icon-only 64px + header + konten.

### MobileLayout

**Lokasi:** `src/components/layout/MobileLayout.tsx`

**Digunakan:** <768px. Header + konten + bottom nav 4 kolom.

---

## 🚀 Komponen yang BELUM Ada (Rekomendasi)

Komponen ini sering dibutuhkan tapi belum jadi shared component:

| Komponen | Prioritas | Catatan |
|----------|-----------|---------|
| **Badge** | 🔴 Tinggi | Sering dibuat inline di banyak tempat |
| **EmptyState** | 🔴 Tinggi | Setiap halaman butuh empty state |
| **Table** | 🟡 Medium | TableSection di inventory bisa di-ekstrak |
| **Tabs** | 🟡 Medium | Dipakai di dashboard (TabTren, TabAlerts) |
| **Tooltip** | 🟢 Rendah | Sudah pakai recharts Tooltip |
| **Toast** | 🟢 Rendah | Notifikasi sukses/gagal |
| **ConfirmDialog** | 🟡 Medium | Konfirmasi hapus (pakai pattern yang sama) |

Jika membuat komponen di atas:
1. Buat di `src/components/ui/`.
2. Tambahkan dokumentasi di file ini.
3. Update daftar di atas.

---

## 📐 Pola Komposisi Komponen

### Form Pattern (Inventory)

```
Modal
  └── Input (Field + label)
  └── CatSelect
  └── Input (Field)
  └── FormActions
        └── Button (Batal)
        └── Button (Simpan)
```

### Dashboard Pattern

```
DesktopLayout
  └── MetricCards
  │     └── StatCard
  └── SalesChart
  └── TabTren / TabAlerts
  └── QuickActions
        └── Button (outline)
```
