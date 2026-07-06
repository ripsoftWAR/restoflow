import { useMemo, useState } from "react";
import {
  LayoutDashboard, BarChart3, ScanLine, Boxes, FileText, Users, Settings,
  Search, Filter, Bell, ChevronDown, ChevronRight, ChevronLeft, MoreHorizontal,
  Sparkles, Star, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wheat, Beef, Carrot, Flame, Coffee, Package, MapPin, Barcode, Clock,
  AlertTriangle, CheckCircle2, ShoppingCart, Truck, Edit2, X, MessageCircle,
  ChevronsUpDown, Image as ImageIcon,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ----------------------------- Design tokens ----------------------------- */
// Primary: indigo-600 (#4F46E5) — matches the real Dashboard's brand color.
// AI surfaces: violet-600 -> indigo-600 gradient (Pilot AI card).
// Neutral canvas: slate-50, cards: white / slate-200 borders, rounded-2xl.

const CATEGORY_META = {
  "Bahan Pokok": { icon: Wheat, bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
  Protein: { icon: Beef, bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100" },
  Sayuran: { icon: Carrot, bg: "bg-green-50", text: "text-green-600", ring: "ring-green-100" },
  "Bumbu & Rempah": { icon: Flame, bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-100" },
  Minuman: { icon: Coffee, bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-100" },
  Kemasan: { icon: Package, bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-200" },
};

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BASE_DATE = new Date(2026, 6, 5); // 5 Jul 2026, matches "6 Jun - 5 Jul 2026" range shown in header

/* --------------------------------- Data ---------------------------------- */
// [id, nama, kategori, satuan, stok, min, hargaBeli, hargaTerakhir, supplier, lokasi, avgUsage]
const RAW_BAHAN = [
  ["beras-premium", "Beras Premium", "Bahan Pokok", "kg", 85, 50, 13500, 13800, "CV Sumber Padi", "Gudang Kering A1", 6],
  ["minyak-goreng", "Minyak Goreng", "Bahan Pokok", "liter", 42, 30, 16800, 17200, "PT Minyak Nusantara", "Gudang Kering A1", 4],
  ["tepung-terigu", "Tepung Terigu", "Bahan Pokok", "kg", 28, 25, 11200, 11000, "Toko Tani Makmur", "Gudang Kering A2", 3],
  ["gula-pasir", "Gula Pasir", "Bahan Pokok", "kg", 35, 20, 14500, 14700, "Distributor Sembako Jaya", "Gudang Kering A2", 2.5],
  ["garam-dapur", "Garam Dapur", "Bumbu & Rempah", "kg", 18, 10, 8000, 8000, "Distributor Sembako Jaya", "Rak Bumbu D1", 0.8],
  ["ayam-potong", "Ayam Potong", "Protein", "kg", 22, 25, 34000, 35500, "CV Ternak Jaya", "Chiller B1", 5],
  ["daging-sapi", "Daging Sapi", "Protein", "kg", 15, 15, 128000, 131000, "CV Ternak Jaya", "Freezer C1", 2],
  ["telur-ayam", "Telur Ayam", "Protein", "kg", 40, 20, 27000, 26500, "Pasar Induk Kramat Jati", "Gudang Kering A2", 3],
  ["udang-segar", "Udang Segar", "Protein", "kg", 8, 10, 95000, 98000, "PT Sumber Laut", "Freezer C1", 1.5],
  ["ikan-kembung", "Ikan Kembung", "Protein", "kg", 12, 8, 42000, 41000, "PT Sumber Laut", "Freezer C1", 1.8],
  ["bawang-merah", "Bawang Merah", "Bumbu & Rempah", "kg", 14, 10, 32000, 33500, "Pasar Induk Kramat Jati", "Rak Bumbu D1", 1.6],
  ["bawang-putih", "Bawang Putih", "Bumbu & Rempah", "kg", 11, 8, 38000, 42500, "Pasar Induk Kramat Jati", "Rak Bumbu D1", 1.3],
  ["cabai-merah", "Cabai Merah Keriting", "Bumbu & Rempah", "kg", 9, 12, 52000, 58000, "Pasar Induk Kramat Jati", "Rak Bumbu D1", 2.2],
  ["cabai-rawit", "Cabai Rawit", "Bumbu & Rempah", "kg", 6, 8, 68000, 76000, "Pasar Induk Kramat Jati", "Rak Bumbu D1", 1.4],
  ["tomat", "Tomat", "Sayuran", "kg", 20, 15, 12000, 11500, "Pasar Induk Kramat Jati", "Chiller B1", 2.5],
  ["kentang", "Kentang", "Sayuran", "kg", 30, 20, 15000, 14800, "Toko Tani Makmur", "Gudang Basah B2", 2.8],
  ["wortel", "Wortel", "Sayuran", "kg", 18, 12, 11000, 10800, "Toko Tani Makmur", "Chiller B1", 1.6],
  ["kol-kubis", "Kol / Kubis", "Sayuran", "kg", 16, 10, 8500, 8300, "Toko Tani Makmur", "Chiller B1", 1.4],
  ["kemangi", "Kemangi", "Sayuran", "ikat", 25, 15, 2000, 2000, "Pasar Induk Kramat Jati", "Chiller B1", 3],
  ["santan-kelapa", "Santan Kelapa", "Bumbu & Rempah", "liter", 24, 20, 18000, 18200, "UD Rempah Jaya", "Gudang Basah B2", 3],
  ["kecap-manis", "Kecap Manis", "Bumbu & Rempah", "liter", 19, 15, 22000, 22000, "PT Boga Rasa", "Gudang Kering A2", 1.8],
  ["saus-sambal", "Saus Sambal", "Bumbu & Rempah", "liter", 13, 10, 26000, 26500, "PT Boga Rasa", "Gudang Kering A2", 1.2],
  ["kaldu-ayam", "Kaldu Ayam Bubuk", "Bumbu & Rempah", "kg", 7, 5, 45000, 45000, "PT Boga Rasa", "Rak Bumbu D1", 0.6],
  ["merica-bubuk", "Merica Bubuk", "Bumbu & Rempah", "kg", 4, 5, 85000, 89000, "UD Rempah Jaya", "Rak Bumbu D1", 0.4],
  ["jahe", "Jahe", "Bumbu & Rempah", "kg", 9, 6, 28000, 27500, "UD Rempah Jaya", "Rak Bumbu D1", 0.7],
  ["kunyit", "Kunyit", "Bumbu & Rempah", "kg", 8, 5, 24000, 24000, "UD Rempah Jaya", "Rak Bumbu D1", 0.6],
  ["lengkuas", "Lengkuas", "Bumbu & Rempah", "kg", 10, 6, 15000, 14500, "UD Rempah Jaya", "Rak Bumbu D1", 0.5],
  ["air-mineral", "Air Mineral Galon", "Minuman", "pcs", 55, 30, 20000, 20000, "Distributor Sembako Jaya", "Gudang Kering A1", 6],
  ["es-batu", "Es Batu Kristal", "Minuman", "kg", 60, 40, 5000, 5000, "CV Aneka Segar", "Freezer C1", 8],
  ["teh-celup", "Teh Celup", "Minuman", "box", 45, 30, 18000, 18500, "Distributor Sembako Jaya", "Gudang Kering A2", 4],
  ["kopi-bubuk", "Kopi Bubuk", "Minuman", "kg", 12, 8, 95000, 97000, "PT Boga Rasa", "Gudang Kering A2", 1.1],
  ["kemasan-takeaway", "Kemasan Take Away", "Kemasan", "pcs", 320, 200, 850, 850, "PT Kemasan Prima", "Gudang Kering A1", 45],
];

const BAHAN_LIST = RAW_BAHAN.map(
  ([id, nama, kategori, satuan, stok, min, hargaBeli, hargaTerakhir, supplier, lokasi, avgUsage], idx) => ({
    id, nama, kategori, satuan, stok, min, hargaBeli, hargaTerakhir, supplier, lokasi, avgUsage,
    no: idx + 1,
    barcode: `899${String((idx + 1) * 137).padStart(6, "0")}${(idx % 9) + 1}`,
  })
);

const CATEGORIES = Array.from(new Set(BAHAN_LIST.map((b) => b.kategori)));
const USERS = ["Budi", "Siti", "Rina", "Adam"];

/* ------------------------------- Utilities -------------------------------- */
function rupiah(n) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}
function numFmt(n) {
  return Number(n).toLocaleString("id-ID", { maximumFractionDigits: 1 });
}
function seedFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function rand01(seed) {
  let x = seed || 1;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return ((x >>> 0) % 1000) / 1000;
}
function addDaysFormatted(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}
function dateLabel(offsetFromBase) {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + offsetFromBase);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`;
}
function dateLabelFull(offsetFromBase) {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + offsetFromBase);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function generateUsageSeries(bahan, days = 7) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const s = seedFromString(bahan.id + "u" + i);
    const value = Math.max(0, Math.round(bahan.avgUsage * (0.7 + 0.6 * rand01(s)) * 10) / 10);
    out.push({ label: dateLabel(-i), pemakaian: value });
  }
  return out;
}

function generateLedger(bahan) {
  const jenisPattern = ["keluar", "keluar", "masuk", "keluar", "keluar"];
  const rows = [];
  let runningSisa = bahan.stok;
  for (let i = 0; i < 5; i++) {
    const jenis = jenisPattern[i];
    const s = seedFromString(bahan.id + "l" + i);
    const amount =
      jenis === "keluar"
        ? Math.max(0.1, Math.round(bahan.avgUsage * (0.8 + 0.5 * rand01(s)) * 10) / 10)
        : Math.max(1, Math.round(bahan.avgUsage * 5 * (0.85 + 0.3 * rand01(s))));
    const sisaSetelah = runningSisa;
    rows.push({
      tanggal: dateLabelFull(-i),
      jenis,
      referensi: jenis === "masuk" ? `PO-${1000 + Math.floor(rand01(s + 7) * 8999)}` : `ORD-${1000 + Math.floor(rand01(s + 9) * 8999)}`,
      masuk: jenis === "masuk" ? amount : 0,
      keluar: jenis === "keluar" ? amount : 0,
      sisaStok: Math.max(0, Math.round(sisaSetelah * 10) / 10),
      user: USERS[(seedFromString(bahan.id) + i) % USERS.length],
    });
    runningSisa = jenis === "keluar" ? runningSisa + amount : runningSisa - amount;
  }
  return rows;
}

function trendPct(bahan, key) {
  const s = seedFromString(bahan.id + key);
  const val = Math.round((rand01(s) - 0.35) * 40);
  return val;
}

/* ------------------------------- Small UI --------------------------------- */
function TrendBadge({ value, suffix = "%" }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${
        positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
      }`}
    >
      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

function StockPill({ bahan }) {
  const low = bahan.stok < bahan.min;
  return low ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">
      <AlertTriangle className="w-3 h-3" /> Stok Kritis
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
      <CheckCircle2 className="w-3 h-3" /> Stok Aman
    </span>
  );
}

function CategoryIcon({ kategori, size = "w-9 h-9" }) {
  const meta = CATEGORY_META[kategori];
  const Icon = meta.icon;
  return (
    <div className={`${size} shrink-0 rounded-lg ${meta.bg} ${meta.text} flex items-center justify-center`}>
      <Icon className="w-4.5 h-4.5" strokeWidth={2} />
    </div>
  );
}

/* --------------------------------- Sidebar -------------------------------- */
function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: BarChart3, label: "Penjualan" },
    { icon: ScanLine, label: "Scan OCR" },
    { icon: Boxes, label: "Inventori", active: true },
  ];
  const subItems = [
    { label: "Bahan", active: true },
    { label: "Produk" },
    { label: "Stok Opname" },
    { label: "Mutasi" },
  ];
  const rest = [
    { icon: Users, label: "Pengguna" },
    { icon: Settings, label: "Pengaturan" },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Boxes className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">PilotPOS</div>
          <div className="text-[11px] text-slate-400">Restaurant POS System</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <div key={item.label}>
            <button
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.active ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
            {item.active && (
              <div className="mt-1 ml-4 pl-4 border-l border-slate-200 space-y-0.5">
                {subItems.map((s) => (
                  <button
                    key={s.label}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                      s.active ? "text-indigo-600 font-medium" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.active ? "bg-indigo-600" : "bg-slate-300"}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="pt-3 mt-3 border-t border-slate-100 space-y-0.5">
          {[{ icon: FileText, label: "Laporan" }, ...rest].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="px-3 pb-4 space-y-3">
        <button className="w-full rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 hover:bg-slate-50 transition-colors">
          <div className="text-left flex-1">
            <div className="text-[11px] text-slate-400">Outlet Aktif</div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> PilotPOS Jakarta
            </div>
            <div className="text-[11px] text-slate-400 ml-3">Pusat</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <div className="rounded-xl p-4 bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-2.5">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="text-sm font-semibold mb-1">Pilot AI</div>
          <p className="text-[12px] text-white/80 leading-snug mb-3">
            AI membantu membaca data penjualan, inventori, dan insight dasar.
          </p>
          <button className="w-full bg-white text-indigo-600 text-[13px] font-medium rounded-lg py-2 flex items-center justify-center gap-1.5 hover:bg-white/90 transition-colors">
            Pelajari AI <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-500 hover:text-slate-700">
          <span className="flex items-center gap-2.5">
            <ArrowUpRight className="w-4 h-4 rotate-45" /> Pasang App
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

/* -------------------------------- Header --------------------------------- */
function TopHeader({ tab, setTab }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur border-b border-slate-200">
      <div className="px-8 pt-6 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inventori</h1>
          <div className="text-[13px] text-slate-400 mt-0.5">
            Inventori <span className="mx-1">›</span> <span className="text-slate-500">Bahan</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50">
            <span>📅</span> 6 Jun – 5 Jul 2026 <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>

          <div className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              className="relative w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">3</span>
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30">
                {[
                  ["Cabai Rawit hampir habis", "6 kg tersisa, di bawah minimum"],
                  ["Pembelian baru dikonfirmasi", "PO-4821 dari CV Ternak Jaya"],
                  ["Stok opname terjadwal", "Besok, 07:00 WIB"],
                ].map(([t, d]) => (
                  <div key={t} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                    <div className="text-[13px] font-medium text-slate-800">{t}</div>
                    <div className="text-[12px] text-slate-400">{d}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-[13px] font-semibold flex items-center justify-center">AD</div>
              <div className="text-left leading-tight">
                <div className="text-[13px] font-medium text-slate-800">Adam</div>
                <div className="text-[11px] text-slate-400">Pemilik</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30">
                <button className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">Profil</button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">Pengaturan</button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50">Keluar</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 flex items-center gap-6 border-t border-slate-100">
        {[
          ["bahan", "Bahan"],
          ["ocr", "OCR Struk"],
          ["rekomendasi", "Rekomendasi Belanja"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-3 text-[13.5px] font-medium border-b-2 transition-colors ${
              tab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Daftar Bahan ------------------------------- */
function DaftarBahan({ selectedId, onSelect, search, setSearch, page, setPage, categoryFilter, setCategoryFilter }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const perPage = 8;

  const filtered = useMemo(() => {
    return BAHAN_LIST.filter((b) => {
      const matchesSearch = b.nama.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || b.kategori === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const clampedPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((clampedPage - 1) * perPage, clampedPage * perPage);
  const start = filtered.length === 0 ? 0 : (clampedPage - 1) * perPage + 1;
  const end = Math.min(clampedPage * perPage, filtered.length);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-[15px] font-semibold text-slate-900 mb-3">Daftar Bahan</h2>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari bahan..."
              className="w-full pl-8 pr-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                categoryFilter ? "border-indigo-300 bg-indigo-50 text-indigo-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30">
                <button
                  onClick={() => { setCategoryFilter(null); setFilterOpen(false); setPage(1); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] ${!categoryFilter ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Semua Kategori
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategoryFilter(c); setFilterOpen(false); setPage(1); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] ${categoryFilter === c ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {pageItems.length === 0 && (
          <div className="p-8 text-center text-[13px] text-slate-400">Bahan tidak ditemukan.</div>
        )}
        {pageItems.map((b) => {
          const active = b.id === selectedId;
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`w-full flex items-center gap-3 p-3.5 text-left transition-colors border-l-2 ${
                active ? "border-l-indigo-600 bg-indigo-50/60" : "border-l-transparent hover:bg-slate-50"
              }`}
            >
              <CategoryIcon kategori={b.kategori} />
              <div className="flex-1 min-w-0">
                <div className={`text-[13.5px] font-medium truncate ${active ? "text-indigo-700" : "text-slate-800"}`}>{b.nama}</div>
                <div className="text-[12px] text-slate-400 flex items-center gap-1.5">
                  Stok: {numFmt(b.stok)} {b.satuan}
                  {b.stok < b.min && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          );
        })}
      </div>

      <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-[12.5px] text-slate-400">
        <span>{start} – {end} dari {filtered.length} bahan</span>
        <div className="flex items-center gap-1">
          <button
            disabled={clampedPage <= 1}
            onClick={() => setPage(clampedPage - 1)}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={clampedPage >= totalPages}
            onClick={() => setPage(clampedPage + 1)}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Detail Bahan ------------------------------ */
function KpiCard({ label, value, sub, icon: Icon, tint }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className={`w-8 h-8 rounded-lg ${tint} flex items-center justify-center mb-2.5`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-[11.5px] text-slate-400 mb-0.5">{label}</div>
      <div className="text-[16px] font-semibold text-slate-900 leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function DetailBahan({ bahan, tab, setTab }) {
  const [chartRange, setChartRange] = useState(7);
  const [rangeOpen, setRangeOpen] = useState(false);
  const usage = useMemo(() => generateUsageSeries(bahan, chartRange), [bahan, chartRange]);
  const ledger = useMemo(() => generateLedger(bahan), [bahan]);

  const totalKeluar = useMemo(() => Math.round(usage.reduce((a, b) => a + b.pemakaian, 0) * 10) / 10, [usage]);
  const totalMasuk = Math.round(totalKeluar * 1.08 * 10) / 10;
  const daysLeft = Math.max(1, Math.ceil(bahan.stok / bahan.avgUsage));
  const prediksiHabis = addDaysFormatted(BASE_DATE, daysLeft);
  const low = bahan.stok < bahan.min;

  const detailTabs = [
    ["overview", "Overview"],
    ["pergerakan", "Riwayat Pergerakan"],
    ["pembelian", "Riwayat Pembelian"],
    ["supplier", "Supplier"],
    ["mutasi", "Mutasi Stok"],
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl h-full flex flex-col">
      <div className="p-5 flex items-center justify-between border-b border-slate-100">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">Detail Bahan</h2>
          <div className="text-[12.5px] text-slate-400 mt-0.5">{bahan.nama}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] text-slate-600 hover:bg-slate-50">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 overflow-y-auto">
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <KpiCard label="Stok Saat Ini" value={`${numFmt(bahan.stok)} ${bahan.satuan}`} sub={low ? "Di bawah minimum" : "Stok mencukupi"} icon={Boxes} tint={low ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"} />
          <KpiCard label="Nilai Persediaan" value={rupiah(bahan.stok * bahan.hargaTerakhir)} sub="Berdasarkan harga terakhir" icon={Package} tint="bg-violet-50 text-violet-600" />
          <KpiCard label="Minimum Stok" value={`${numFmt(bahan.min)} ${bahan.satuan}`} sub="Batas aman gudang" icon={AlertTriangle} tint="bg-amber-50 text-amber-600" />
          <KpiCard label="Harga Rata-rata" value={rupiah(bahan.hargaBeli)} sub={`Terakhir ${rupiah(bahan.hargaTerakhir)}`} icon={TrendingUp} tint="bg-sky-50 text-sky-600" />
        </div>

        {/* Header detail */}
        <div className="rounded-xl border border-slate-200 p-4 mb-5 flex gap-4">
          <div className="w-28 h-28 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-slate-300 shrink-0">
            <ImageIcon className="w-6 h-6 mb-1" />
            <span className="text-[11px]">Gambar Bahan</span>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
            <Row label="Kategori" value={bahan.kategori} />
            <Row label="Stok Saat Ini" value={`${numFmt(bahan.stok)} ${bahan.satuan}`} />
            <Row label="Satuan" value={bahan.satuan} />
            <Row label="Minimum Stok" value={`${numFmt(bahan.min)} ${bahan.satuan}`} />
            <Row label="Supplier Utama" value={bahan.supplier} />
            <Row label="Harga Beli Rata-rata" value={rupiah(bahan.hargaBeli)} />
            <Row label="Lokasi Penyimpanan" value={bahan.lokasi} />
            <Row label="Harga Terakhir" value={rupiah(bahan.hargaTerakhir)} />
            <Row label="Barcode" value={bahan.barcode} mono />
            <Row label="Terakhir Diperbarui" value="5 Jul 2026, 14:32" />
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-5 border-b border-slate-100 mb-4">
          {detailTabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                tab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="col-span-2 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13.5px] font-semibold text-slate-800">Grafik Penggunaan ({chartRange} Hari Terakhir)</h3>
                  <div className="relative">
                    <button onClick={() => setRangeOpen((v) => !v)} className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-600 hover:bg-slate-50">
                      {chartRange} Hari Terakhir <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    {rangeOpen && (
                      <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-20">
                        {[7, 30].map((d) => (
                          <button key={d} onClick={() => { setChartRange(d); setRangeOpen(false); }} className="w-full text-left px-2.5 py-1.5 rounded-md text-[12.5px] text-slate-600 hover:bg-slate-50">
                            {d} Hari Terakhir
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usage} margin={{ left: -20, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={chartRange > 10 ? Math.floor(chartRange / 6) : 0} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip
                        formatter={(v) => [`${numFmt(v)} ${bahan.satuan}`, "Pemakaian"]}
                        contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="pemakaian" stroke="#4F46E5" strokeWidth={2} fill="url(#usageFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-[13.5px] font-semibold text-slate-800 mb-3">Ringkasan</h3>
                <div className="space-y-2.5 text-[13px]">
                  <Row label="Total Masuk" value={`${numFmt(totalMasuk)} ${bahan.satuan}`} />
                  <Row label="Total Keluar" value={`${numFmt(totalKeluar)} ${bahan.satuan}`} />
                  <Row label="Pemakaian Rata-rata / Hari" value={`${numFmt(bahan.avgUsage)} ${bahan.satuan}`} />
                  <Row label="Prediksi Habis" value={prediksiHabis} valueClass={low ? "text-red-600 font-medium" : "text-slate-800"} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-[13.5px] font-semibold text-slate-800">Transaksi Terakhir</h3>
              </div>
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="font-medium px-4 py-2">Tanggal</th>
                    <th className="font-medium px-4 py-2">Jenis</th>
                    <th className="font-medium px-4 py-2">Referensi</th>
                    <th className="font-medium px-4 py-2 text-right">Masuk</th>
                    <th className="font-medium px-4 py-2 text-right">Keluar</th>
                    <th className="font-medium px-4 py-2 text-right">Sisa Stok</th>
                    <th className="font-medium px-4 py-2">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.map((r, i) => (
                    <tr key={i} className="text-slate-700">
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.tanggal}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium ${r.jenis === "masuk" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
                          {r.jenis === "masuk" ? "Masuk" : "Keluar"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">{r.referensi}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.masuk ? `+${numFmt(r.masuk)}` : "-"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.keluar ? `-${numFmt(r.keluar)}` : "-"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium">{numFmt(r.sisaStok)} {bahan.satuan}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "pergerakan" && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[13.5px] font-semibold text-slate-800">Riwayat Pergerakan Stok</h3>
              <span className="text-[12px] text-slate-400">30 hari terakhir</span>
            </div>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th className="font-medium px-4 py-2">Tanggal</th>
                  <th className="font-medium px-4 py-2">Jenis</th>
                  <th className="font-medium px-4 py-2">Referensi</th>
                  <th className="font-medium px-4 py-2 text-right">Jumlah</th>
                  <th className="font-medium px-4 py-2">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((r, i) => (
                  <tr key={i} className="text-slate-700">
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.tanggal}</td>
                    <td className="px-4 py-2.5">{r.jenis === "masuk" ? "Penerimaan Barang" : "Pemakaian Dapur"}</td>
                    <td className="px-4 py-2.5 text-slate-400">{r.referensi}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{numFmt(r.masuk || r.keluar)} {bahan.satuan}</td>
                    <td className="px-4 py-2.5 text-slate-500">{r.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "pembelian" && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[13.5px] font-semibold text-slate-800">Riwayat Pembelian</h3>
            </div>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th className="font-medium px-4 py-2">No. PO</th>
                  <th className="font-medium px-4 py-2">Tanggal</th>
                  <th className="font-medium px-4 py-2">Supplier</th>
                  <th className="font-medium px-4 py-2 text-right">Qty</th>
                  <th className="font-medium px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.filter((r) => r.jenis === "masuk").concat(ledger.slice(0, 2)).slice(0, 3).map((r, i) => (
                  <tr key={i} className="text-slate-700">
                    <td className="px-4 py-2.5">{r.referensi.startsWith("PO") ? r.referensi : `PO-${3000 + i * 7}`}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.tanggal}</td>
                    <td className="px-4 py-2.5">{bahan.supplier}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{numFmt(r.masuk || bahan.avgUsage * 4)} {bahan.satuan}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{rupiah((r.masuk || bahan.avgUsage * 4) * bahan.hargaBeli)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "supplier" && (
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-[13.5px] font-semibold text-slate-800 mb-3">Supplier Utama</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[14px] font-medium text-slate-800">{bahan.supplier}</div>
                <div className="text-[12px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Jakarta</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
              <Row label="Harga Beli Terakhir" value={rupiah(bahan.hargaTerakhir)} />
              <Row label="Rata-rata Waktu Kirim" value="1–2 hari" />
              <Row label="Total Transaksi (30 hari)" value="6 kali" />
              <Row label="Status Kontrak" value="Aktif" valueClass="text-green-600 font-medium" />
            </div>
          </div>
        )}

        {tab === "mutasi" && (
          <div className="rounded-xl border border-slate-200 p-8 text-center">
            <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-[13.5px] font-medium text-slate-600">Belum ada mutasi stok</div>
            <div className="text-[12.5px] text-slate-400 mt-1">Mutasi antar outlet untuk {bahan.nama} akan muncul di sini.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = "text-slate-800", mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className={`${valueClass} font-medium text-right ${mono ? "font-mono text-[12px]" : ""}`}>{value}</span>
    </div>
  );
}

/* -------------------------------- Insight AI ------------------------------ */
function InsightAI({ bahan, onOpenChat }) {
  const [expanded, setExpanded] = useState(false);
  const low = bahan.stok < bahan.min;
  const daysLeft = Math.max(1, Math.ceil(bahan.stok / bahan.avgUsage));
  const pctAboveMin = Math.round(((bahan.stok - bahan.min) / bahan.min) * 100);

  const summary = low
    ? `${bahan.nama} tersisa ${numFmt(bahan.stok)} ${bahan.satuan}, di bawah batas minimum ${numFmt(bahan.min)} ${bahan.satuan}. Berdasarkan rata-rata pemakaian ${numFmt(bahan.avgUsage)} ${bahan.satuan}/hari, stok diperkirakan habis dalam ${daysLeft} hari. Segera lakukan pemesanan ke ${bahan.supplier}.`
    : `${bahan.nama} dalam kondisi stok aman, ${pctAboveMin}% di atas minimum. Pemakaian stabil di ${numFmt(bahan.avgUsage)} ${bahan.satuan}/hari selama 7 hari terakhir, belum perlu restock mendesak.`;

  const lowStockItems = useMemo(
    () =>
      BAHAN_LIST.filter((b) => b.stok < b.min)
        .map((b) => ({ ...b, daysLeft: Math.max(1, Math.ceil(b.stok / b.avgUsage)) }))
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 3),
    []
  );

  const recIcons = [ShoppingCart, TrendingDown, Truck];
  const recommendations =
    lowStockItems.length > 0
      ? lowStockItems.map((b) => `${b.nama} tersisa ${numFmt(b.stok)} ${b.satuan}, diperkirakan habis dalam ~${b.daysLeft} hari. Segera pesan ke ${b.supplier}.`)
      : ["Semua bahan dalam kondisi stok aman minggu ini."];

  const pemakaianPct = trendPct(bahan, "pem");
  const pengeluaranPct = trendPct(bahan, "pen");
  const sisaStokPct = low ? -Math.abs(trendPct(bahan, "sisa")) - 5 : Math.abs(trendPct(bahan, "sisa2"));

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-slate-900 flex items-center gap-1.5">
            Insight <span className="text-indigo-600">AI</span>
          </h2>
          <span className="text-[10.5px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Beta</span>
        </div>

        <div className={`rounded-xl border p-4 ${low ? "border-red-100 bg-red-50/40" : "border-indigo-100 bg-indigo-50/40"}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${low ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"}`}>
            <Star className="w-4 h-4" />
          </div>
          <div className="text-[13px] font-semibold text-slate-800 mb-1">Insight Utama</div>
          <p className={`text-[12.5px] text-slate-600 leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>{summary}</p>
          <button onClick={() => setExpanded((v) => !v)} className="text-[12.5px] font-medium text-indigo-600 mt-2 hover:underline">
            {expanded ? "Sembunyikan" : "Lihat Detail"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <h3 className="text-[13.5px] font-semibold text-slate-800 mb-3">Rekomendasi</h3>
        <div className="space-y-3">
          {recommendations.map((text, i) => {
            const Icon = recIcons[i % recIcons.length];
            return (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[12.5px] font-medium text-slate-700">Rekomendasi {i + 1}</div>
                  <p className="text-[12px] text-slate-500 leading-snug">{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <h3 className="text-[13.5px] font-semibold text-slate-800 mb-1">Perbandingan 7 Hari</h3>
        <p className="text-[11.5px] text-slate-400 mb-3">vs 7 hari sebelumnya</p>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Pemakaian</span>
            <TrendBadge value={pemakaianPct} />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Pengeluaran</span>
            <TrendBadge value={pengeluaranPct} />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500">Sisa Stok</span>
            <TrendBadge value={sisaStokPct} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
        <p className="text-[13px] leading-snug mb-3">Butuh analisis lebih dalam? Tanyakan ke Pilot AI sekarang.</p>
        <button onClick={onOpenChat} className="w-full bg-white text-indigo-600 text-[13px] font-medium rounded-lg py-2 flex items-center justify-center gap-1.5 hover:bg-white/90 transition-colors">
          <Sparkles className="w-3.5 h-3.5" /> Buka Pilot AI Chat <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- OCR tab -------------------------------- */
function OcrStrukTab() {
  const rows = [
    ["5 Jul 2026, 09:12", "Pasar Induk Kramat Jati", "Rp 1.245.000", "Terverifikasi"],
    ["3 Jul 2026, 16:40", "Toko Tani Makmur", "Rp 640.000", "Terverifikasi"],
    ["1 Jul 2026, 11:05", "CV Ternak Jaya", "Rp 2.180.000", "Perlu Review"],
  ];
  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-5">
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <ScanLine className="w-6 h-6" />
          </div>
          <div className="text-[14px] font-semibold text-slate-800 mb-1">Upload struk untuk ekstraksi otomatis</div>
          <p className="text-[12.5px] text-slate-400 mb-4">Pilot AI akan membaca item, harga, dan supplier dari struk secara otomatis.</p>
          <button className="bg-indigo-600 text-white text-[13px] font-medium rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors">
            Pilih File Struk
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-[13.5px] font-semibold text-slate-800">Riwayat Scan</h3>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-slate-400 text-left">
                <th className="font-medium px-4 py-2">Waktu</th>
                <th className="font-medium px-4 py-2">Sumber</th>
                <th className="font-medium px-4 py-2 text-right">Total</th>
                <th className="font-medium px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={i} className="text-slate-700">
                  <td className="px-4 py-2.5 whitespace-nowrap">{r[0]}</td>
                  <td className="px-4 py-2.5">{r[1]}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r[2]}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${r[3] === "Terverifikasi" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                      {r[3]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 h-fit">
        <h3 className="text-[13.5px] font-semibold text-slate-800 mb-2">Cara Kerja</h3>
        <ol className="space-y-2.5 text-[12.5px] text-slate-500">
          <li>1. Upload foto atau PDF struk pembelian.</li>
          <li>2. Pilot AI mengekstrak nama bahan, qty, dan harga.</li>
          <li>3. Konfirmasi data sebelum masuk ke stok.</li>
        </ol>
      </div>
    </div>
  );
}

/* ---------------------------- Rekomendasi Belanja -------------------------- */
function RekomendasiBelanjaTab() {
  const items = useMemo(
    () =>
      BAHAN_LIST.filter((b) => b.stok < b.min * 1.3)
        .map((b) => {
          const targetQty = Math.round((b.min * 1.5 - b.stok) * 10) / 10;
          return { ...b, targetQty: Math.max(targetQty, Math.round(b.min * 0.5 * 10) / 10) };
        })
        .sort((a, b) => a.stok / a.min - b.stok / b.min),
    []
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">Rekomendasi Belanja</h2>
          <p className="text-[12.5px] text-slate-400 mt-0.5">Disusun otomatis berdasarkan stok kritis dan pola pemakaian.</p>
        </div>
        <button className="bg-indigo-600 text-white text-[13px] font-medium rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors">
          Buat Daftar Belanja
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {items.map((b) => (
          <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <CategoryIcon kategori={b.kategori} />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-slate-800 truncate">{b.nama}</div>
                <StockPill bahan={b} />
              </div>
            </div>
            <div className="space-y-1.5 text-[12.5px] mb-3">
              <Row label="Stok Saat Ini" value={`${numFmt(b.stok)} ${b.satuan}`} />
              <Row label="Rekomendasi Beli" value={`${numFmt(b.targetQty)} ${b.satuan}`} valueClass="text-indigo-600 font-semibold" />
              <Row label="Estimasi Biaya" value={rupiah(b.targetQty * b.hargaTerakhir)} />
              <Row label="Supplier" value={b.supplier} />
            </div>
            <button className="w-full border border-indigo-200 text-indigo-600 text-[12.5px] font-medium rounded-lg py-1.5 hover:bg-indigo-50 transition-colors">
              Tambah ke Daftar Belanja
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Chat modal ------------------------------ */
function PilotAiChatModal({ onClose, context }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-slate-900">Pilot AI Chat</div>
              <div className="text-[11.5px] text-slate-400">Konteks: {context}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-[12.5px] text-slate-500 mb-4">
          Fitur chat interaktif segera hadir. Untuk saat ini, gunakan panel Insight AI untuk rekomendasi otomatis seputar {context}.
        </div>
        <div className="flex items-center gap-2">
          <input disabled placeholder="Tanyakan sesuatu ke Pilot AI..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] bg-slate-50 text-slate-400" />
          <button disabled className="bg-indigo-200 text-white rounded-lg px-3 py-2">
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------- App ----------------------------------- */
export default function InventoriPrototype() {
  const [topTab, setTopTab] = useState("bahan");
  const [selectedId, setSelectedId] = useState(BAHAN_LIST[0].id);
  const [detailTab, setDetailTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const selectedBahan = BAHAN_LIST.find((b) => b.id === selectedId) ?? BAHAN_LIST[0];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopHeader tab={topTab} setTab={setTopTab} />

        <div className="p-8 pt-6">
          {topTab === "bahan" && (
            <div className="grid grid-cols-12 gap-5" style={{ minHeight: "calc(100vh - 180px)" }}>
              <div className="col-span-3">
                <DaftarBahan
                  selectedId={selectedId}
                  onSelect={(id) => { setSelectedId(id); setDetailTab("overview"); }}
                  search={search}
                  setSearch={setSearch}
                  page={page}
                  setPage={setPage}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                />
              </div>
              <div className="col-span-6">
                <DetailBahan bahan={selectedBahan} tab={detailTab} setTab={setDetailTab} />
              </div>
              <div className="col-span-3">
                <InsightAI bahan={selectedBahan} onOpenChat={() => setChatOpen(true)} />
              </div>
            </div>
          )}

          {topTab === "ocr" && <OcrStrukTab />}
          {topTab === "rekomendasi" && <RekomendasiBelanjaTab />}
        </div>
      </div>

      {chatOpen && <PilotAiChatModal onClose={() => setChatOpen(false)} context={selectedBahan.nama} />}
    </div>
  );
}
