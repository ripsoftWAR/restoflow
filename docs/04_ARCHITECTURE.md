# 🏗️ 04 — Architecture — Arsitektur PilotPOS

> **Status:** Dokumentasi arsitektur lengkap — dari Design Token sampai Database.
> **Tujuan:** Memahami alur dependency dan tanggung jawab setiap layer.

---

## 🧱 Layer Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                   🎨 DESIGN TOKENS                  │
│              src/index.css (Single Source)          │
│         Warna, Radius, Shadow, Font, Motion         │
└───────────────────────┬─────────────────────────────┘
                        │ digunakan oleh
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🧩 SHARED UI │ │ 📐 LAYOUT    │ │ 🎬 MOTION    │
│  COMPONENTS  │ │  COMPONENTS  │ │  PRESETS     │
│              │ │              │ │              │
│ Button       │ │ DesktopLayout│ │ pp-animate-in│
│ Input        │ │ TabletLayout │ │ pp-fade-in   │
│ BrandMark    │ │ MobileLayout │ │ pp-scale-in  │
│ PinInput     │ │              │ │ pp-slide-up  │
│ Modal        │ │              │ │ pp-skeleton  │
│ Field        │ │              │ │ ...          │
│ CatSelect    │ │              │ │              │
│ FormActions  │ │              │ │              │
└──────┬───────┘ └──────┬───────┘ └──────────────┘
       │                │
       └────────┬───────┘
                │ digunakan oleh
                ▼
┌─────────────────────────────────────────────────────┐
│                📦 FEATURE MODULES                    │
│                                                     │
│  Auth          Dashboard      Inventory    Recipes  │
│  ─────────     ──────────     ─────────    ───────  │
│  AuthFlow      Dashboard      Inventory    Recipe   │
│  LandingView   MetricCards     MidRow       System   │
│  LoginView     SalesChart      TableSection Recipe   │
│  RegisterView  MenuTerlaris    StatCards    Builder  │
│  UserPicker    QuickActions    AddModal     Recipe   │
│  PinVerif      TabTren         EditModal    Card     │
│                TabAlerts       AdjustModal           │
│                TabBreakdown    DeleteModal           │
│                ShoppingList                          │
│                InventoryInsight                      │
│                                                     │
│  Sales         Kasir          OCR           AI      │
│  ──────        ─────          ───           ──      │
│  SalesPage     KasirMode      Receipt       AIChat  │
│  KasirCart     KasirMenu      Scanner       Asst.   │
│  KasirStats    Grid                                  │
│  VoucherGen                                          │
│                                                     │
│  Users         Logs           PWA                   │
│  ─────         ────           ───                   │
│  UsersPage     MovementLogs   InstallPWA            │
└───────────────────────┬─────────────────────────────┘
                        │ menggunakan
                        ▼
┌─────────────────────────────────────────────────────┐
│                   🪝 CUSTOM HOOKS                    │
│                                                     │
│  useAppData()    useFeatures()   useCart()          │
│  ────────────    ─────────────   ────────           │
│  • State global  • Feature gate  • Cart logic       │
│  • Auth session  • can() guard   • Checkout         │
│  • CRUD handlers • Role check                       │
│  • Data fetching                                    │
└───────────────────────┬─────────────────────────────┘
                        │ memanggil
                        ▼
┌─────────────────────────────────────────────────────┐
│                  🌐 API LAYER (Utils)                │
│                                                     │
│  src/utils/api.ts                                   │
│  ─────────────────                                  │
│  • makeApiFetch()  — authenticated fetch wrapper    │
│  • resolveApiUrl() — resolve endpoint URL           │
│  • formatIDR()     — format mata uang Rupiah        │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP request
                        ▼
┌─────────────────────────────────────────────────────┐
│              🖥️  BACKEND (Express.js)                │
│                                                     │
│  server/index.ts — entry point                      │
│  ─────────────────                                  │
│  • CORS, Rate Limiter, JWT middleware               │
│  • Static files (APK download)                      │
│  • Health check endpoints                           │
│                                                     │
│  server/routes/                                     │
│  ──────────────                                     │
│  auth.ts        — Login, Register, PIN, Refresh     │
│  dashboard.ts   — Statistik dashboard               │
│  ingredients.ts — CRUD bahan baku                   │
│  movements.ts   — Log pergerakan stok               │
│  recipes.ts     — CRUD resep                        │
│  sales.ts       — Transaksi penjualan               │
│  ocr.ts         — Scan & konfirmasi struk           │
│  chat.ts        — AI Chat (Gemini)                  │
│  users.ts       — Manajemen pengguna                │
│  vouchers.ts    — Generate & validasi voucher       │
│  app.ts         — APK version check                 │
│                                                     │
│  server/utils/                                      │
│  ─────────────                                      │
│  authMiddleware.ts — requireAuth, requireRole       │
│  jwt.ts            — Token generation & validation  │
│  conversion.ts     — Konversi unit bahan            │
│  costHelper.ts     — Kalkulasi biaya resep          │
│  dbHelpers.ts      — Query helper functions         │
└───────────────────────┬─────────────────────────────┘
                        │ query
                        ▼
┌─────────────────────────────────────────────────────┐
│              🗄️  DATABASE (PostgreSQL)               │
│                                                     │
│  server/db/database.ts                              │
│  ────────────────────                               │
│  • Connection pool (pg)                             │
│  • runMigrations() — auto-migrate saat start        │
│  • testConnection() — health check                  │
│                                                     │
│  server/db/migrations/                              │
│  ─────────────────────                              │
│  000_create_all_tables.sql                          │
│  001_create_shifts.sql                              │
│  002_add_refresh_token.sql                          │
└─────────────────────────────────────────────────────┘
```

---

## 📂 Struktur Folder Lengkap

```
restoflow/
├── src/                          # Frontend (React 19 + Vite)
│   ├── components/
│   │   ├── ui/                   # 🧩 UI Primitif
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── BrandMark.tsx
│   │   │   ├── PinInput.tsx
│   │   │   ├── LandingNavbar.tsx
│   │   │   ├── LandingFooter.tsx
│   │   │   ├── CounterAnimation.tsx
│   │   │   ├── DashboardMockup.tsx
│   │   │   ├── FeatureShowcase.tsx
│   │   │   └── TestimonialCard.tsx
│   │   ├── auth/                 # 🔐 Authentication
│   │   │   ├── AuthFlow.tsx
│   │   │   ├── LandingView.tsx
│   │   │   ├── LoginView.tsx
│   │   │   ├── RegisterView.tsx
│   │   │   ├── UserPickerView.tsx
│   │   │   └── PinVerificationView.tsx
│   │   ├── layout/               # 📐 Layout (3 breakpoint)
│   │   │   ├── DesktopLayout.tsx
│   │   │   ├── TabletLayout.tsx
│   │   │   ├── MobileLayout.tsx
│   │   │   └── StatChips.tsx
│   │   ├── dashboard/            # 📊 Dashboard
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MetricCards.tsx
│   │   │   ├── SalesChart.tsx
│   │   │   ├── MenuTerlaris.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── TabTren.tsx
│   │   │   ├── TabAlerts.tsx
│   │   │   ├── TabBreakdown.tsx
│   │   │   ├── TabLaporan.tsx
│   │   │   ├── ShoppingList.tsx
│   │   │   ├── InventoryInsight.tsx
│   │   │   └── shared/
│   │   │       ├── StatCard.tsx
│   │   │       └── utils.ts
│   │   ├── inventory/            # 📦 Inventory
│   │   │   ├── Inventory.tsx
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── MidRow.tsx
│   │   │   │   ├── RightSidebar.tsx
│   │   │   │   ├── StatCards.tsx
│   │   │   │   └── TableSection.tsx
│   │   │   ├── modals/
│   │   │   │   ├── AddModal.tsx
│   │   │   │   ├── EditModal.tsx
│   │   │   │   ├── AdjustModal.tsx
│   │   │   │   └── DeleteModal.tsx
│   │   │   ├── shared/
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── CatSelect.tsx
│   │   │   │   ├── Field.tsx
│   │   │   │   └── FormActions.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useInventoryState.ts
│   │   │   └── utils/
│   │   │       ├── constants.ts
│   │   │       ├── format.ts
│   │   │       └── styles.ts
│   │   ├── recipes/              # 🍳 Recipe System
│   │   │   ├── RecipeSystem.tsx
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── RecipeBuilder.tsx
│   │   │   │   ├── RecipeCard.tsx
│   │   │   │   ├── RecipeRightPanel.tsx
│   │   │   │   └── RecipeStatsBar.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useRecipeState.ts
│   │   │   └── utils/
│   │   │       └── recipeHelpers.ts
│   │   ├── sales/                # 🛒 Sales / POS
│   │   │   ├── SalesPage.tsx
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── KasirCartPanel.tsx
│   │   │   │   ├── KasirMenuGrid.tsx
│   │   │   │   ├── KasirStatsBar.tsx
│   │   │   │   └── VoucherGenerator.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCart.ts
│   │   │   │   └── useCheckout.ts
│   │   │   └── utils/
│   │   │       ├── cartHelpers.ts
│   │   │       └── salesHelpers.ts
│   │   ├── kasir/                # 💰 Kasir Mode
│   │   │   └── KasirMode.tsx
│   │   ├── AIChatAssistant.tsx   # 🤖 AI Business Operator
│   │   ├── ReceiptScanner.tsx    # 📸 OCR Scanner
│   │   ├── MovementLogs.tsx      # 📋 Log Pergerakan
│   │   ├── InstallPWA.tsx        # 📲 PWA Install
│   │   └── userspage.tsx         # 👥 User Management
│   ├── hooks/                    # 🪝 Custom Hooks
│   │   ├── useAppData.ts
│   │   └── useFeatures.tsx
│   ├── theme/                    # 🎨 Theme Barrel
│   │   └── index.ts
│   ├── utils/                    # 🔧 Utilities
│   │   ├── api.ts
│   │   └── mathHelper.ts
│   ├── App.tsx                   # 🚪 Entry Point
│   ├── main.tsx                  # ⚡ React DOM render
│   ├── index.css                 # 🎨 Design Tokens (Single Source)
│   ├── theme.css                 # 📄 Deprecated (kosong)
│   ├── theme.ts                  # 📘 JS Theme object
│   └── types.ts                  # 📋 TypeScript types
├── server/                       # 🖥️ Backend
│   ├── index.ts                  # Entry point Express
│   ├── routes/                   # API Routes
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── ingredients.ts
│   │   ├── movements.ts
│   │   ├── recipes.ts
│   │   ├── sales.ts
│   │   ├── ocr.ts
│   │   ├── chat.ts
│   │   ├── users.ts
│   │   ├── vouchers.ts
│   │   └── app.ts
│   ├── db/                       # Database
│   │   ├── database.ts
│   │   └── migrations/
│   ├── utils/                    # Backend utilities
│   │   ├── authMiddleware.ts
│   │   ├── jwt.ts
│   │   ├── conversion.ts
│   │   ├── costHelper.ts
│   │   └── dbHelpers.ts
│   ├── types/
│   │   └── multer.d.ts
│   └── apk/
│       └── version.json
├── flutter_kasir/                # 📱 Flutter App (Android)
├── public/                       # 📂 Static assets
├── docs/                         # 📚 Dokumentasi (INI!)
│   ├── 01_DESIGN_RULES.md
│   ├── 02_AI_RULES.md
│   ├── 03_COMPONENT_GUIDE.md
│   └── 04_ARCHITECTURE.md
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

---

## 🔗 Dependency Flow

### Build-time

```
vite.config.ts
  ├── @tailwindcss/vite  → memproses index.css → generate utility class
  ├── @vitejs/plugin-react → transform JSX/TSX
  └── esbuild             → bundle server (build:server)

tsconfig.json
  └── strict: true, ESM, path alias
```

### Runtime — Frontend

```
main.tsx
  └── App.tsx
        ├── AuthFlow (jika belum login)
        │     ├── LandingView
        │     ├── LoginView → UserPickerView → PinVerificationView
        │     └── RegisterView
        └── FeaturesProvider (jika sudah login)
              └── Pemilik → AppContent
              │     ├── DesktopLayout / TabletLayout / MobileLayout
              │     └── Content (berdasarkan activeTab)
              │           ├── Dashboard
              │           ├── Inventory
              │           ├── RecipeSystem
              │           ├── SalesPage / KasirMode
              │           ├── ReceiptScanner
              │           ├── AIChatAssistant
              │           ├── MovementLogs
              │           └── UsersPage
              └── Kasir → KasirMode
```

### Runtime — Backend

```
server/index.ts (Express)
  ├── CORS + Rate Limiter
  ├── JWT Middleware (requireAuth, requireRole)
  ├── Routes
  │     ├── /api/auth/*
  │     ├── /api/dashboard/*
  │     ├── /api/ingredients/*
  │     ├── /api/movements/*
  │     ├── /api/recipes/*
  │     ├── /api/sales/*
  │     ├── /api/ocr/*
  │     ├── /api/gemini/chat/*
  │     ├── /api/users/*
  │     ├── /api/vouchers/*
  │     └── /api/app/*
  └── Error Handler
```

---

## 🔐 Auth Flow

```
1. User buka aplikasi → cek localStorage (restoflow_session_id)
2. Tidak ada token → LandingView / LoginView
3. Login → /api/auth/verify-pin → dapat AuthSession { token, user, shift, features }
4. Token disimpan di localStorage
5. Setiap API call → Authorization: Bearer <token>
6. Middleware requireAuth → verifikasi JWT
7. Middleware requireRole → cek role + feature flag
8. Refresh token → /api/auth/refresh (jika access token expired)
```

---

## 🎯 Feature Flag System

```typescript
// src/hooks/useFeatures.tsx
const { can } = useFeatures();

// Guard di App.tsx
{activeTab === 'inventory' && can('inventory.view') && <Inventory />}
{activeTab === 'ocr' && can('ocr.scan') && <ReceiptScanner />}
{activeTab === 'ai' && can('ai.chat') && <AIChatAssistant />}
```

Feature flags disimpan di `AuthSession.features[]` dari backend.

---

## 📦 Technology Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Frontend Framework | React | 19 |
| Build Tool | Vite | 6 |
| Styling | Tailwind CSS | 4 |
| Animasi | Framer Motion | 12 |
| Chart | Recharts | 3 |
| Icon | Lucide React | 0.546 |
| Font | Inter | 5.2 |
| Backend | Express.js | 4 |
| Database | PostgreSQL | (via pg 8) |
| AI | Google Gemini | 2.4 |
| Auth | JWT + bcryptjs | 9 + 3 |
| Language | TypeScript | 5.8 |

---

## 🚀 Deployment

| Target | Platform | Build Command |
|--------|----------|---------------|
| Frontend | Vercel | `npm run build` |
| Backend | Railway | `node dist/server.js` |
| Android | Flutter | `flutter build apk` |

---

## 🔮 AI Business Operator

```
Google Gemini API
  └── server/routes/chat.ts
        └── @google/genai
              └── gemini-2.0-flash
                    └── Context: ingredients + recipes + sales
```

---

## 📝 Konvensi Naming

| Hal | Convention | Contoh |
|-----|-----------|--------|
| File Komponen | PascalCase | `Button.tsx`, `DesktopLayout.tsx` |
| File Non-Komponen | camelCase | `useAppData.ts`, `api.ts` |
| Folder | kebab-case | `inventory`, `sales-page` |
| Komponen Default | export default | `export default function Modal` |
| Komponen Bernama | export named | `export function Button` |
| Props Interface | `{Nama}Props` | `interface ModalProps` |
| Custom Hook | `use{Nama}` | `useAppData`, `useFeatures` |

---

## 🔄 Data Flow (Unidirectional)

```
User Action → Event Handler → API Request → Backend Route → Database
                   ↑                                            │
                   └──── Response ← JSON ← Route Handler ←──────┘
                   │
                   ▼
            setState() → Re-render → UI Update
```
