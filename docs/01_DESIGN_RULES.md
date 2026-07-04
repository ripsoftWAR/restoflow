# 📐 01 — Design Constitution PilotPOS

> **Status:** Konstitusi Tertinggi — semua keputusan desain WAJIB merujuk dokumen ini.
> **Versi:** 5.0
> **Terakhir diperbarui:** Juni 2025

---

## 🧭 Filosofi Desain

PilotPOS adalah aplikasi **SaaS modern untuk operasional restoran**. Dari halaman pertama sampai terakhir, pengguna harus merasakan **satu produk yang utuh** — bukan kumpulan fitur yang disambung paksa.

```
Landing Page  →  Login  →  Dashboard  →  Kasir  →  Inventory  →  OCR  →  Resep  →  Penjualan  →  AI Asisten
     └─────────────────────── Semuanya SATU identitas visual ──────────────────────────┘
```

### Prinsip Desain

| Prinsip | Arti | Implementasi |
|---------|------|--------------|
| **Clean** | Tidak ada elemen yang tidak perlu | Setiap elemen punya alasan keberadaan |
| **Modern** | Terasa kekinian, bukan jadul | Blue #2563EB + Inter font + sudut rounded |
| **Enterprise** | Scale-ready, profesional | Konsisten di 100+ layar, bukan hanya beberapa |
| **Premium** | Berkelas, bukan murahan | Shadow halus, spacing lega, animasi subtle |
| **Professional** | Dapat dipercaya | Tidak playful, tidak childish |
| **Calm** | Tidak membingungkan | Warna netral dominan, brand color sebagai aksen |
| **High Readability** | Nyaman dibaca | Font size minimal 13px untuk body, kontras cukup |
| **Mobile First** | Didahulukan desain mobile | Bottom nav di mobile, sidebar di desktop |
| **Accessibility Friendly** | Ramah semua pengguna | Focus ring, ARIA label, reduced motion |

---

## 🎨 Color Rules — HUKUM WARNA

### Aturan Mutlak

> **DILARANG KERAS hardcode warna di komponen.**  
> Seluruh warna WAJIB menggunakan Design Token `pp-*`.

> **Ungu (Purple), Indigo, Violet DILARANG sebagai warna utama.**  
> Warna utama PilotPOS adalah **BLUE (#2563EB)** .

### Design Token Warna

Token-token ini didefinisikan di `src/index.css` sebagai **Single Source of Truth**.

#### Brand / Primary

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `pp-primary` | `#2563EB` | Tombol utama, link, aksen brand |
| `pp-primary-hover` | `#1D4ED8` | Hover state tombol utama |
| `pp-primary-soft` | `#EFF6FF` | Background hover ringan, selected state |
| `pp-primary-muted` | `#DBEAFE` | Background hover sekunder |
| `pp-primary-dark` | `#1E40AF` | Teks pada background primary-soft |

#### Status / Semantik

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `pp-success` | `#059669` | Sukses, completed, active |
| `pp-success-soft` | `#ECFDF5` | Background badge sukses |
| `pp-success-border` | `#A7F3D0` | Border status sukses |
| `pp-warning` | `#D97706` | Perhatian, pending |
| `pp-warning-soft` | `#FFFBEB` | Background badge warning |
| `pp-warning-border` | `#FDE68A` | Border status warning |
| `pp-danger` | `#DC2626` | Error, hapus, kritis |
| `pp-danger-soft` | `#FEF2F2` | Background badge danger |
| `pp-danger-border` | `#FECACA` | Border status danger |
| `pp-info` | `#2563EB` | Informasi (sama dengan primary) |
| `pp-info-soft` | `#EFF6FF` | Background badge info |
| `pp-info-border` | `#BFDBFE` | Border status info |

#### Teks

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `pp-text` | `#0F172A` | Heading, teks utama |
| `pp-text-secondary` | `#475569` | Body text |
| `pp-text-muted` | `#64748B` | Teks pendukung, caption |
| `pp-text-placeholder` | `#94A3B8` | Placeholder input |

#### Background & Surface

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `pp-bg` | `#F8FAFC` | Background halaman |
| `pp-surface` | `#FFFFFF` | Card, modal, dropdown |
| `pp-surface-alt` | `#FAFBFC` | Background stripe table, hover row |

#### Border

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `pp-border` | `#E2E8F0` | Border utama |
| `pp-border-light` | `#F1F5F9` | Border halus, divider |
| `pp-border-focus` | `#2563EB` | Border saat fokus |

#### Chart

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `pp-chart-blue` | `#378ADD` | Grafik batang/garis biru |
| `pp-chart-green` | `#1D9E75` | Grafik batang/garis hijau |
| `pp-chart-purple` | `#7C3AED` | Grafik variasi ungu |
| `pp-chart-orange` | `#EF9F27` | Grafik variasi oranye |

### Cara Pakai

```tsx
// ✅ BENAR — pakai Tailwind utility class
<button className="bg-pp-primary text-white">Simpan</button>
<div className="text-pp-text-secondary bg-pp-surface border border-pp-border">Card</div>

// ✅ BENAR — pakai CSS custom property
<div style={{ backgroundColor: 'var(--pp-primary-soft)' }}>...</div>

// ❌ SALAH — hardcode
<button className="bg-blue-600 text-white">Simpan</button>
<button style={{ backgroundColor: '#2563EB' }}>Simpan</button>
```

---

## 🔤 Typography Rules

### Font

| Penggunaan | Font | Weight |
|-----------|------|--------|
| **Heading (h1–h3)** | Inter | 600 (Semibold) |
| **Subtitle / h4–h6** | Inter | 600 |
| **Body** | Inter | 400 |
| **Caption / Label** | Inter | 500 (Medium) |
| **Button** | Inter | 600 (Semibold) |
| **Table Header** | Inter | 600 |
| **Table Body** | Inter | 400 |
| **Mono / Kode** | JetBrains Mono | 400 |

### Hierarchy Ukuran (Desktop)

| Level | Ukuran | Class | Penggunaan |
|-------|--------|-------|------------|
| H1 | 24px | `text-[24px]` | Judul halaman |
| H2 | 20px | `text-[20px]` | Judul section |
| H3 | 18px | `text-[18px]` | Judul card |
| H4 | 16px | `text-[16px]` | Sub-judul |
| Body | 14px | `text-[14px]` | Teks paragraf |
| Body Small | 13px | `text-[13px]` | Teks sekunder, nav item |
| Caption | 12px | `text-[12px]` | Caption, timestamp |
| Label | 11px | `text-[11px]` | Label form, badge kecil |
| Micro | 10px | `text-[10px]` | Overline, section header |

### Aturan

- **Minimal font size 13px** untuk teks yang harus dibaca (body, label, button).
- 10px hanya untuk overline/caption non-esensial.
- `letter-spacing: -0.02em` untuk heading, `-0.01em` untuk body.
- `line-height: 1.2` untuk heading, `1.6` untuk body.
- `font-feature-settings: "tnum"` untuk angka (tabular numbers).

---

## 🔲 Radius Rules

### Token Radius

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `rounded-pp-xs` | `6px` | Badge kecil, chip, tag |
| `rounded-pp-sm` | `10px` | Card kecil, input group |
| `rounded-pp-md` | `14px` | **Default** — card, modal, button, input |
| `rounded-pp-lg` | `20px` | Card besar, panel |
| `rounded-pp-xl` | `24px` | Container utama |

### Aturan

> **DILARANG membuat radius custom.**  
> Tidak boleh `rounded-[7px]`, `rounded-[13px]`, dll.

```tsx
// ✅ BENAR
<div className="rounded-pp-md">Card</div>
<button className="rounded-pp-md">Button</button>

// ❌ SALAH
<div className="rounded-[12px]">Card</div>
```

---

## 🌑 Shadow Rules

### Token Shadow

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `shadow-pp-xs` | `0 1px 2px rgba(0,0,0,0.03)` | Hover halus |
| `shadow-pp-sm` | `0 2px 8px rgba(0,0,0,0.04)` | Dropdown kecil |
| `shadow-pp-md` | `0 8px 30px rgba(0,0,0,0.05)` | **Default** card |
| `shadow-pp-lg` | `0 20px 60px rgba(0,0,0,0.07)` | Card hover lift |
| `shadow-pp-xl` | `0 30px 80px rgba(0,0,0,0.09)` | Modal |
| `shadow-pp-brand` | `0 8px 25px rgba(37,99,235,0.25)` | Tombol primary |
| `shadow-pp-brand-lg` | `0 16px 40px rgba(37,99,235,0.30)` | Tombol primary hover |

### Aturan

> **DILARANG shadow custom.**  
> Hanya gunakan token yang sudah didefinisikan.

---

## 🎬 Motion Rules

### Preset Animasi

Animasi didefinisikan di `src/index.css`. Gunakan class animasi, bukan inline Framer Motion custom.

| Class | Durasi | Easing | Penggunaan |
|-------|--------|--------|------------|
| `pp-animate-in` | `350ms` | `ease` | Konten masuk pertama kali |
| `pp-fade-in` | `200ms` | `ease` | Elemen muncul |
| `pp-scale-in` | `200ms` | `ease` | Modal, popover muncul |
| `pp-slide-right` | `350ms` | `ease` | Panel slide dari kanan |
| `pp-slide-up` | `350ms` | `ease` | Toast, notifikasi |
| `pp-shake` | `400ms` | `ease` | Error state |
| `pp-pulse-glow` | `2000ms` | `ease-in-out` | Loading/processing |
| `pp-skeleton` | `1500ms` | `ease-in-out` | Skeleton loading |
| `pp-bubble-in` | `350ms` | `ease` | Chat bubble |
| `pp-spin` | `800ms` | `linear` | Spinner/loader |

### Durasi Transition Utility

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `--pp-duration-instant` | `100ms` | Checkbox, toggle |
| `--pp-duration-fast` | `150ms` | Hover color change |
| `--pp-duration-normal` | `200ms` | **Default** transition |
| `--pp-duration-slow` | `350ms` | Page enter, modal |

### Aturan

> **Animasi harus subtle — tidak boleh berlebihan.**
> 
> - Maksimal **1 animasi per elemen** (kecuali loading state).
> - Gunakan `ease-out` untuk enter, `ease-in` untuk exit.
> - Hormati `prefers-reduced-motion` — sudah di-handle otomatis di `index.css`.
> - JANGAN animasi `layout` di Framer Motion kecuali betul-betul perlu.

---

## 📏 Spacing Rules

### Skala Spacing (`theme.ts`)

```
2px  → 4px  → 8px  → 12px  → 16px  → 24px  → 32px  → 48px  → 64px
```

### Aturan

> **DILARANG menggunakan angka acak.**  
> Spacing harus berasal dari skala di atas.

```tsx
// ✅ BENAR
<div className="p-6 gap-4">Card</div>
<section className="py-12 px-6">Section</section>

// ❌ SALAH  
<div className="p-7 gap-5">Card</div>  // 7 dan 5 bukan di skala
```

### Rekomendasi Spacing

| Konteks | Padding | Gap |
|---------|---------|-----|
| Card default | `p-6` (24px) | `gap-4` (16px) |
| Card compact | `p-4` (16px) | `gap-3` (12px) |
| Section | `py-12 px-6` | `gap-8` (32px) |
| Button md | `px-5 py-2.5` | `gap-2` (8px) |
| Button lg | `px-6 py-3.5` | `gap-2` (8px) |
| Input | `px-4 py-3.5` | — |
| Sidebar nav | `px-3 py-2` | `gap-0.5` (2px) |

---

## 📱 Layout Rules

### Tiga Breakpoint

| Breakpoint | Layout | Sidebar | Navigasi |
|-----------|--------|---------|----------|
| **Mobile** (`<768px`) | `MobileLayout` | Tidak ada | Bottom nav 4 kolom |
| **Tablet** (`768px–1023px`) | `TabletLayout` | Icon-only 64px | Sidebar kiri |
| **Desktop** (`≥1024px`) | `DesktopLayout` | Full sidebar 240px | Sidebar kiri + header |

### Prinsip Layout

1. **Landing Page dan Dashboard harus terasa satu aplikasi.**  
   Font, warna, radius, dan spacing harus identik.

2. **Sidebar di kiri, konten di kanan.**  
   Tidak boleh ada layout alternatif.

3. **Header sticky dengan glass effect** (`bg-white/75 backdrop-blur-xl`).

4. **Konten overflow-y-auto**, sidebar fixed height `h-screen`.

5. **Responsive-first:** desain mobile dulu, baru desktop.

---

## 🧩 Utility Classes Kustom

| Class | Fungsi |
|-------|--------|
| `pp-glass` | Glass morphism surface (`backdrop-filter: blur(20px)`) |
| `pp-card-lift` | Card hover lift (`translateY(-4px)` + shadow-lg) |
| `pp-gradient-text` | Gradien biru pada teks (brand mark) |
| `pp-focus-ring` | Focus ring custom (`focus-visible:ring`) |

---

## 🤖 AI Quick Popover — Design Pattern (v5.1)

> **Status:** PATEN — Pola desain standar untuk interaksi AI inline di seluruh aplikasi.
> **Didefinisikan:** Juni 2025
> **Ref Implementasi:** `src/components/dashboard/AIQuickPopover.tsx`

### Filosofi

Alih-alih memaksa pengguna pindah ke halaman terpisah, AI harus **hadir di konteks** tempat pengguna berada. Popover muncul dari tombol trigger dan memberikan jawaban langsung — hanya jika pengguna ingin eksplorasi lebih lanjut, barulah halaman chat penuh dibuka.

```
┌─────────────────────────────────────┐
│  Pilot AI Card                      │
│  ┌─────────────────────────────┐    │
│  │ Status Agent  ● Aktif       │    │
│  │ Monitoring outlet...        │    │
│  │ ✅ Analisis penjualan       │    │
│  │ 🔄 Prediksi stok            │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ✨ Tanya Pilot AI      [→]  │ ◄── Trigger button
│  └─────────────────────────────┘    │
│              ▲                      │
│         ╔════╧══════╗               │
│         ║  🧠 Pilot ║ ◄── Popover  │
│         ║  • Omset  ║     anchored │
│         ║  • Stok   ║     to button│
│         ║  • Menu   ║              │
│         ║ [Chat→]   ║              │
│         ╚═══════════╝               │
└─────────────────────────────────────┘
```

### Struktur Komponen

```
AIQuickPopover
├── Trigger Button           ← Full-width CTA di dalam card
│   ├── Ikon + Label
│   └── onClick → toggle popover + fetch AI
│
└── Popover (AnimatePresence)
    ├── Arrow (▲)            ← Koneksi visual ke trigger
    ├── Header               ← Judul + status + close (✕)
    ├── Content              ← Scrollable, max-h-[300px]
    │   ├── Loading State    ← Spinner + teks
    │   ├── Error State      ← Ikon + pesan + retry
    │   ├── Result State     ← AI text dengan **bold**
    │   └── Empty State      ← Ikon + instruksi
    └── Footer               ← Hint + "Chat Lengkap →"
```

### States

> **Dua fase render:** (1) Local insights INSTAN → (2) AI response ENHANCE

| State | Trigger | Visual | Perilaku |
|-------|---------|--------|----------|
| **Idle** | Default | Tombol normal | Popover tersembunyi |
| **Local Insights** | Klik tombol (instant) | Insight card dengan ikon | Render data pre-computed dari RightSidebar — langsung muncul 0ms |
| **AI Loading** | Paralel dgn local insights | Banner tipis "Menganalisis..." | Fetch `/api/gemini/chat/quick-summary` di background |
| **AI Enhanced** | AI response OK | Teks insight AI (8-10 baris) | Otomatis replace local insights saat response tiba |
| **Error** | Network/API gagal | Ikon merah + pesan | Tombol retry — local insights tetap terlihat |
| **Empty** | No data at all | Ikon abu + teks | Instruksi klik ulang |

### Positioning Rules

> **Popover SELALU anchored ke tombol trigger dengan arrow (▲).**

| Posisi Sidebar | Anchor | Expand Direction |
|---------------|--------|-----------------|
| **Right sidebar** (default) | `right-0` | Expand ke kiri (overlap dashboard) |
| **Center/Dialog** | `left-1/2 -translate-x-1/2` | Centered below button |
| **Left panel** | `left-0` | Expand ke kanan |

```
Container: relative
  Button: w-full (trigger)
  Popover: absolute, top-[calc(100%+10px)]
  Arrow: absolute, -top-[7px], rotated 45°
```

### Props API

```typescript
interface AIQuickPopoverProps {
  // Data bisnis untuk dikirim ke AI
  sales: Sale[];
  ingredients: Ingredient[];
  criticalCount: number;
  stockValue: number;
  totalOmset: number;
  totalTx: number;
  
  // Pre-computed local insights — tampil INSTAN saat popover terbuka
  quickInsights?: { icon: string; bold: string; detail: string }[];
  
  // Navigation
  onNavigate: (tab: string) => void;
  
  // Callback opsional saat AI selesai
  onResult?: (text: string) => void;
}
```

### Integrasi dengan Backend

```
POST /api/gemini/chat/quick-summary
  Body: { context: string }
  Auth: Bearer <session_token>
  Response: { text: string }
  
  AI Provider: Claude Haiku (via Anthropic API)
  System Prompt: Ringkasan bisnis 8-10 baris, Bahasa Indonesia
  Fallback: Pesan offline jika ANTHROPIC_API_KEY tidak ada
```

### Aturan Penggunaan

> **Pattern ini WAJIB digunakan untuk SEMUA shortcut AI di dashboard, sidebar, dan panel.**

1. **Trigger button** selalu di dalam card dengan `relative` container.
2. **Popover muncul inline** — jangan navigasi ke halaman lain.
3. **Data dikirim sebagai context string** — backend yang memanggil AI.
4. **Loading state HARUS ada** — jangan sampai user bingung.
5. **"Chat Lengkap →" selalu tersedia** sebagai escape hatch ke halaman AI penuh.
6. **Close via:** tombol ✕, Escape key, atau click outside.

### Checklist Implementasi

- [ ] Container `relative` pada parent trigger
- [ ] Arrow ▲ koneksi visual ke button
- [ ] Local insights pre-computed & dipassing via `quickInsights` prop
- [ ] Popover langsung render local insights saat `isOpen` (0ms delay)
- [ ] AI fetch paralel di background (tidak blocking UI)
- [ ] Transisi mulus: local insights → AI enhanced
- [ ] `onResult` callback untuk parent notification
- [ ] Keyboard: Escape untuk close
- [ ] Click outside untuk close
- [ ] Animasi: `duration: 0.15s`, `ease: [0.22, 0.61, 0.36, 1]`
- [ ] Scrollable content (max-h-[300px])
- [ ] Teks bold dengan `**...**` rendering

---

| Aturan | Implementasi |
|--------|--------------|
| **Focus ring** | Semua elemen interaktif wajib punya `focus-visible:ring` |
| **ARIA label** | Tombol tanpa teks wajib punya `aria-label` |
| **Reduced motion** | Otomatis: animasi jadi `0.01ms` jika user prefer |
| **Color contrast** | Teks minimal AA (4.5:1 untuk body, 3:1 untuk heading) |
| **Keyboard nav** | Semua interaksi bisa via keyboard |

---

## 📋 Checklist — Sebelum Merge

Setiap PR yang mengandung perubahan UI wajib lulus checklist ini:

- [ ] Tidak ada warna hardcode (`blue-600`, `#2563EB`, dll)
- [ ] Tidak ada radius custom (`rounded-[13px]`)
- [ ] Tidak ada shadow custom
- [ ] Menggunakan font Inter
- [ ] Mobile: sudah dicek di `<768px`
- [ ] Tablet: sudah dicek di `768px–1023px`
- [ ] Desktop: sudah dicek di `≥1024px`
- [ ] Focus ring berfungsi (tab-test)
- [ ] Animasi tidak berlebihan
- [ ] Spacing sesuai skala
