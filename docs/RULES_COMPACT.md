# 📋 RULES_COMPACT — PilotPOS Design System (Ringkasan)

> Versi ringkas dari 01_DESIGN_RULES + 02_AI_RULES + 03_COMPONENT_GUIDE + 04_ARCHITECTURE.
> Untuk detail lengkap & contoh, lihat file asli di folder `docs/`.

---

## 🎨 Design Tokens (src/index.css)

### Warna — PAKAI TOKEN, JANGAN HARDCODE
| Token | Nilai | Pakai untuk |
|-------|-------|-------------|
| `pp-primary` | `#2563EB` | Brand, tombol utama, link |
| `pp-primary-hover` | `#1D4ED8` | Hover primary |
| `pp-primary-light` | `#EFF6FF` | Background ringan |
| `pp-secondary` | `#64748B` | Teks sekunder |
| `pp-bg` | `#F8FAFC` | Background halaman |
| `pp-bg-card` | `#FFFFFF` | Background card |
| `pp-border` | `#E2E8F0` | Border umum |
| `pp-text` | `#0F172A` | Teks utama |
| `pp-success` | `#16A34A` | Sukses, profit |
| `pp-danger` | `#DC2626` | Error, hapus |

### Radius
| Token | Nilai | Pakai untuk |
|-------|-------|-------------|
| `pp-radius-sm` | `6px` | Input, button kecil |
| `pp-radius-md` | `8px` | Card, modal, button default |
| `pp-radius-lg` | `12px` | Card besar, panel |

### Shadow
| Token | Deskripsi |
|-------|-----------|
| `pp-shadow-sm` | Ringan (card default) |
| `pp-shadow-md` | Sedang (dropdown, modal) |
| `pp-shadow-lg` | Berat (modal besar) |

### Spacing
- Gunakan Tailwind spacing: `gap-4`, `p-6`, `space-y-3`
- Card: `p-6`, Section: `py-12 px-4`, Button: `px-4 py-2`

### Font
- **Inter** — seluruh aplikasi
- Body min `13px`, heading `text-xl` / `text-2xl`

---

## 🧩 Shared Components — WAJIB PAKAI

| Kebutuhan | Komponen | Lokasi |
|-----------|----------|--------|
| Tombol | `Button` | `src/components/ui/Button.tsx` |
| Input teks | `Input` | `src/components/ui/Input.tsx` |
| Input PIN | `PinInput` | `src/components/ui/PinInput.tsx` |
| Logo/Brand | `BrandMark` | `src/components/ui/BrandMark.tsx` |
| Modal | `Modal` | `src/components/inventory/shared/Modal.tsx` |
| Kategori Select | `CatSelect` | `src/components/inventory/shared/CatSelect.tsx` |
| Form Field | `Field` | `src/components/inventory/shared/Field.tsx` |
| Form Actions | `FormActions` | `src/components/inventory/shared/FormActions.tsx` |
| Stat Card | `StatCard` | `src/components/dashboard/shared/StatCard.tsx` |
| Layout | `DesktopLayout` / `MobileLayout` | `src/components/layout/` |

---

## 🔁 Pattern Wajib

### Hover
- **Border-only**: tambah border, JANGAN translate/scale/shrink/grow
- Contoh: `hover:border-pp-primary` (bukan `hover:scale-105`)

### Dropdown
- `duration-200` untuk buka/tutup
- **Pembanding HARUS TERPISAH dari data** — jangan inline comparison di render
- Tutup saat klik luar + tombol Escape

### Popover / Tooltip
- `flip` + `shift` middleware (Floating UI)
- `z-50` minimum
- Tutup saat scroll atau resize

### Animasi
- **Subtle**: `duration-200`, `ease-out` untuk enter, `ease-in` untuk exit
- Pakai class animasi dari `src/index.css`: `pp-animate-in`, `pp-fade-in`, `pp-slide-up`

---

## 🏗️ Arsitektur Layer

```
Design Tokens (src/index.css)
        ↓
Shared UI (src/components/ui/)
        ↓
Layout (src/components/layout/)
        ↓
Feature Modules (src/components/dashboard/, inventory/, auth/, dll)
        ↓
Pages → Router
```

---

## 🚫 Larangan Keras

- ❌ Hardcode warna — pakai token `pp-*`
- ❌ Ungu/purple/indigo/violet sebagai warna utama — hanya BLUE `#2563EB`
- ❌ Buat komponen duplikat — cek `src/components/ui/` dulu
- ❌ `useEffect` untuk data fetching — pakai server component atau React Query
- ❌ `<a>` untuk link internal — pakai `<Link>` dari React Router
- ❌ Animasi berlebihan — tidak bounce, tidak spin kecuali spinner
- ❌ Font selain Inter
- ❌ `className` > 10 utility class — ekstrak komponen

---

## ✅ Checklist Sebelum Commit

1. ✅ Semua warna dari token `pp-*` (bukan hardcode)
2. ✅ Shared component dipakai (bukan bikin baru)
3. ✅ Hover = border-only, tidak ada scale/translate
4. ✅ Mobile-first: bottom nav di HP, sidebar di desktop
5. ✅ TypeScript strict — tidak ada `any`
