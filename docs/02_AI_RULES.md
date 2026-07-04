# 🤖 02 — AI Rules — Aturan untuk AI Agent

> **Status:** WAJIB dibaca sebelum AI mengubah satu baris kode pun.
> **Target:** Semua AI Agent (Claude, Copilot, Cursor, ChatGPT, dll)

---

## 🚦 Prinsip Utama

```
KONSISTENSI  >  KREATIVITAS
```

Jika ada dua pilihan desain, **pilih yang paling konsisten dengan Design System PilotPOS**, bukan yang paling kreatif.

---

## 📖 SEBELUM MENGUBAH FILE

### Langkah Wajib

1. **Analisis terlebih dahulu.**  
   Baca file terkait, pahami konteks, cek komponen yang sudah ada.

2. **Cari Shared Component.**  
   Sebelum membuat komponen baru, cek dulu apakah sudah ada di `src/components/ui/` atau `src/components/inventory/shared/`.

3. **Cek Design Token.**  
   Warna, radius, shadow — semua harus dari token.

4. **Jangan langsung mengedit.**  
   Pahami dulu dampak perubahan terhadap file lain.

```
❌ SALAH:
   User: "Tambah tombol di dashboard"
   AI  : [LANGSUNG edit Dashboard.tsx — tambah <button className="bg-purple-600...">]

✅ BENAR:
   User: "Tambah tombol di dashboard"
   AI  : [Baca Dashboard.tsx, cek Button.tsx, baru edit pakai <Button variant="primary">]
```

---

## 🧩 SAAT MEMBUAT KOMPONEN

### Gunakan Shared Component

| Kebutuhan | Gunakan | Lokasi |
|-----------|---------|--------|
| Tombol | `Button` | `src/components/ui/Button.tsx` |
| Input teks | `Input` | `src/components/ui/Input.tsx` |
| Input PIN | `PinInput` | `src/components/ui/PinInput.tsx` |
| Brand/Logo | `BrandMark` | `src/components/ui/BrandMark.tsx` |
| Modal | `Modal` | `src/components/inventory/shared/Modal.tsx` |
| Kategori Select | `CatSelect` | `src/components/inventory/shared/CatSelect.tsx` |
| Form Field | `Field` | `src/components/inventory/shared/Field.tsx` |
| Form Actions | `FormActions` | `src/components/inventory/shared/FormActions.tsx` |

### JANGAN Membuat Duplicate Component

```tsx
// ❌ SALAH — bikin button custom padahal sudah ada <Button>
<button className="bg-blue-600 text-white px-5 py-2.5 rounded-pp-md font-semibold">
  Simpan
</button>

// ✅ BENAR — pakai shared component
<Button variant="primary" size="md">Simpan</Button>
```

### Jika Shared Component Tidak Cukup

Kalau memang perlu komponen baru:
1. Buat di `src/components/ui/` jika general-purpose.
2. Buat di `src/components/[fitur]/shared/` jika spesifik fitur.
3. Dokumentasikan di `docs/03_COMPONENT_GUIDE.md`.

---

## 🎨 SAAT MENGGUNAKAN WARNA

### Wajib Design Token

```tsx
// ❌ SALAH
<div className="bg-blue-600 text-white">
<div className="bg-[#2563EB]">
<div style={{ color: 'blue' }}>

// ✅ BENAR
<div className="bg-pp-primary text-white">
<div className="text-pp-text bg-pp-surface">
<div style={{ color: 'var(--pp-primary)' }}>
```

### Warna yang DILARANG

| Warna | Alasan |
|-------|--------|
| Purple / Violet / Indigo | Bukan brand color PilotPOS |
| Pink / Rose | Tidak sesuai tone enterprise |
| Gradien pelangi | Tidak profesional |

---

## 🔘 SAAT MEMBUAT BUTTON

### Gunakan `<Button>` Bawaan

```tsx
// Props yang tersedia:
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}
```

### Aturan Button

- **Primary** (`variant="primary"`) → 1 aksi utama per halaman.
- **Secondary** (`variant="secondary"`) → aksi pendukung.
- **Outline** (`variant="outline"`) → aksi alternatif, "batal".
- **Ghost** (`variant="ghost"`) → navigasi, aksi rendah prioritas.
- Tombol destructive (hapus) → `variant="outline"` + teks merah (pakai class `text-pp-danger`).

```tsx
// ✅ BENAR — hapus pakai outline + danger
<Button variant="outline" className="text-pp-danger border-pp-danger hover:bg-pp-danger-soft">
  Hapus
</Button>
```

---

## 🪟 SAAT MEMBUAT MODAL

### Gunakan `<Modal>` dari inventory/shared

```tsx
import Modal from '../inventory/shared/Modal';

// Props:
interface ModalProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}
```

### Aturan Modal

- **Title:** singkat (max 5 kata).
- **Subtitle:** penjelasan konteks (1 baris).
- **Children:** isi modal (form, list, konfirmasi).
- JANGAN membuat modal inline di komponen fitur. Selalu pakai shared Modal.

---

## 🏷️ SAAT MEMBUAT BADGE / CHIP

Belum ada shared Badge component. Jika perlu badge:

- Gunakan utility class Tailwind + Design Token.
- Konsisten: `text-[10px] font-medium px-2 py-0.5 rounded-full`.
- Warna: gunakan `pp-success-soft` + `pp-success` (hijau), `pp-warning-soft` + `pp-warning` (kuning), `pp-danger-soft` + `pp-danger` (merah).

```tsx
// ✅ BENAR — badge konsisten
<span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pp-success-soft text-pp-success">
  Aktif
</span>
```

---

## 📄 SAAT MEMBUAT HALAMAN BARU

### Ikuti Layout yang Ada

| Role | Layout |
|------|--------|
| Pemilik | `DesktopLayout` / `TabletLayout` / `MobileLayout` (auto-detect) |
| Kasir | `KasirMode` |

```tsx
// ✅ BENAR — halaman baru mengikuti App.tsx pattern
{activeTab === 'fitur_baru' && can('fitur.view') && (
  <FiturBaruComponent {...props} />
)}
```

### Registrasi di App.tsx

1. Tambahkan di `NAV_ITEMS` atau `NAV_SECONDARY` (sesuai prioritas).
2. Tambahkan routing di `AppContent()`.
3. Jangan lupa `can(...)` guard untuk feature-based access.

---

## 🔒 YANG TIDAK BOLEH DIUBAH

**JANGAN MENGUBAH hal-hal berikut KECUALI diminta eksplisit:**

| Area | File | Alasan |
|------|------|--------|
| Business Logic | `src/hooks/useAppData.ts` | Core data flow |
| API | `server/routes/*` | Backend contract |
| Database | `server/db/*` | Schema & migrasi |
| Routing | `src/App.tsx` | Struktur navigasi |
| Auth Flow | `src/components/auth/*` | Keamanan |
| Design Tokens | `src/index.css` (:root) | Single source of truth |

---

## 📐 ARSITEKTUR IMPORT

### Order Import (Konvensi)

```tsx
// 1. React & library eksternal
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 2. UI Components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// 3. Shared Components
import Modal from '@/components/inventory/shared/Modal';

// 4. Hooks
import { useAppData } from '@/hooks/useAppData';

// 5. Utils
import { formatIDR } from '@/utils/api';

// 6. Types
import type { Ingredient } from '@/types';
```

---

## 📋 Checklist — Sebelum Push

Setiap AI Agent wajib verifikasi:

- [ ] Tidak ada warna hardcode (`blue-600`, `#XXXXXX`, dll)
- [ ] Tidak ada radius custom (`rounded-[13px]`)
- [ ] Tidak duplicate komponen yang sudah ada
- [ ] Button menggunakan `<Button>`, bukan `<button>`
- [ ] Modal menggunakan `Modal` dari shared
- [ ] Spacing sesuai skala (2, 4, 8, 12, 16, 24, 32, 48, 64)
- [ ] Mobile-first: sudah dicek di viewport kecil
- [ ] Tidak mengubah business logic / API / DB
- [ ] TypeScript tidak error (`npm run lint`)

---

## 💡 Contoh Kasus

### Kasus 1: User minta tambah tombol "Export"

```
❌ SALAH: AI langsung tambah <button className="bg-green-600...">Export</button>

✅ BENAR:
   1. Baca Button.tsx — ada props variant
   2. Cek apakah ada variant "success"? Tidak ada.
   3. Gunakan variant yang paling cocok: "outline" atau "secondary"
   4. <Button variant="outline" icon={<Download size={16} />}>Export</Button>
```

### Kasus 2: User minta ganti warna tema ke ungu

```
❌ SALAH: AI langsung edit index.css — ganti semua #2563EB ke #7C3AED

✅ BENAR:
   1. Ingat aturan: Ungu DILARANG sebagai warna utama.
   2. Jelaskan ke user bahwa brand color PilotPOS adalah blue #2563EB.
   3. Jika user tetap ingin, arahkan untuk update SEMUA token — bukan cuma primary.
```

### Kasus 3: User minta form tambah data di halaman baru

```
❌ SALAH: AI bikin <form> dengan input custom styling

✅ BENAR:
   1. Gunakan <Input> untuk field.
   2. Gunakan <Button> untuk submit.
   3. Gunakan Modal untuk konfirmasi.
   4. Gunakan layout yang sama dengan halaman lain.
```
