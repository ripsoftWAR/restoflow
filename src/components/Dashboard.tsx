import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Camera, Download, Sparkles, Clock,
  ChevronRight, ShoppingCart, TrendingUp,
  Package, AlertTriangle, Receipt, CreditCard, Wallet
} from 'lucide-react';
import { DashboardStats, Ingredient, MovementLog } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  onNavigate: (tab: string) => void;
  movements: MovementLog[];
  ingredients: Ingredient[];
}

const formatIDR = (num: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num);

const formatIDRCompact = (num: number) => {
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} jt`;
  if (num >= 1_000)     return `Rp ${(num / 1_000).toFixed(0)} rb`;
  return formatIDR(num);
};

const AI_LOGS = [
  { msg: 'Penjualan QRIS mendominasi 65% transaksi hari ini. Pastikan koneksi internet stabil.', time: '10:30', alert: false },
  { msg: 'Stok kritis terdeteksi pada bahan utama. Segera cek daftar belanja.', time: '09:15', alert: true },
  { msg: 'Trend pesanan meningkat pada jam makan siang. Siapkan tim shift pagi.', time: '08:45', alert: false },
];

export default function Dashboard({ stats, onNavigate }: DashboardProps) {

  // Binding data chart dari salesTrend API
  const chartData = useMemo(() => {
    if (stats.salesTrend && stats.salesTrend.length > 0) {
      return stats.salesTrend.map(item => ({
        time: item.date.split('-').slice(1).join('/'), // format MM/DD
        val: item.amount || 0
      }));
    }
    return [{ time: '00:00', val: 0 }];
  }, [stats.salesTrend]);

  // Preview daftar belanja dari data stok kritis asli
  const criticalItemsPreview = useMemo(() => 
    stats.criticalStockItems?.items?.slice(0, 5) || [], 
    [stats.criticalStockItems]
  );

  // ─── Sub-Komponen ────────────────────────────────────────────

  /** Grid 2x3 untuk Business KPIs utama */
  const MetricCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {[
        { 
          label: 'Total Omset', 
          value: formatIDRCompact(stats.totalSalesByDay || 0), 
          sub: 'Total hari ini', 
          icon: TrendingUp, 
          color: 'text-blue-600', 
          bg: 'bg-blue-50' 
        },
        { 
          label: 'Omset QRIS', 
          value: formatIDRCompact(stats.qrisSalesByDay || 0), 
          sub: 'Non-tunai', 
          icon: CreditCard, 
          color: 'text-purple-600', 
          bg: 'bg-purple-50' 
        },
        { 
          label: 'Omset Cash', 
          value: formatIDRCompact(stats.cashSalesByDay || 0), 
          sub: 'Uang fisik', 
          icon: Wallet, 
          color: 'text-amber-600', 
          bg: 'bg-amber-50' 
        },
        { 
          label: 'Item Terjual', 
          value: `${stats.totalItemsSoldByDay || 0} pcs`, 
          sub: `${stats.totalTransactionsByDay || 0} transaksi hari ini`, 
          icon: Package, 
          color: 'text-indigo-600', 
          bg: 'bg-indigo-50' 
        },
        { 
          label: 'HPP Hari Ini', 
          value: formatIDRCompact(stats.dailyExpense || 0), 
          sub: 'Belanja stok', 
          icon: Receipt, 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-50' 
        },
        { 
          label: 'Stok Kritis', 
          value: `${stats.criticalStockItems?.count || 0} Item`, 
          sub: 'Perlu restock', 
          icon: AlertTriangle, 
          color: 'text-red-600', 
          bg: 'bg-red-50' 
        },
      ].map(({ label, value, sub, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
            <div className={`w-6 h-6 ${bg} rounded-lg flex items-center justify-center`}>
              <Icon size={12} className={color} />
            </div>
          </div>
          <p className={`text-[15px] sm:text-[17px] font-bold ${color} leading-none`}>{value}</p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1.5 font-medium truncate">{sub}</p>
        </div>
      ))}
    </div>
  );

  const ShiftCards = () => (
    <div className="space-y-2">
      <div
        onClick={() => onNavigate('sales')}
        className="bg-white border border-slate-100 rounded-2xl p-3.5 cursor-pointer hover:border-blue-100 transition-all flex items-center gap-3 group"
      >
        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 flex-shrink-0">
          <Clock size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[13px] font-semibold text-slate-800">Shift Pagi</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md uppercase tracking-tight">Open</span>
          </div>
          <div className="flex gap-3 text-[10px] text-slate-400 font-medium">
            <span>Sejak 07:00</span>
            <span>Kas <span className="text-slate-600 font-bold">{formatIDRCompact(stats.cashSalesByDay || 0)}</span></span>
          </div>
        </div>
        <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </div>
  );

  const OcrCard = () => (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg shadow-blue-200">
      <div className="flex items-start justify-between mb-3">
        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
          <Camera size={20} />
        </div>
        <span className="text-[9px] font-bold bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest">Smart Scan</span>
      </div>
      <p className="text-[13px] font-bold mb-1">Input Belanja via Nota</p>
      <p className="text-[10px] text-blue-100 mb-4 leading-relaxed">Gunakan AI Vision untuk membaca harga bahan baku secara otomatis.</p>
      <button
        onClick={() => onNavigate('ocr')}
        className="w-full bg-white text-blue-600 rounded-xl py-2.5 text-[11px] font-bold shadow-sm active:scale-95 transition-transform"
      >
        Buka Kamera
      </button>
    </div>
  );

  const SalesChart = () => (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Trend Penjualan</p>
          <p className="text-[10px] text-slate-400">Statistik 7 hari terakhir</p>
        </div>
        <TrendingUp size={16} className="text-blue-500" />
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.12)', fontSize: '11px', fontWeight: 'bold' }}
              formatter={(v) => [formatIDR(Number(v)), 'Omset']}
            />
            <Area
              type="monotone"
              dataKey="val"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const ShoppingList = () => (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" />
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Bahan Perlu Belanja</p>
        </div>
        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
          {stats.criticalStockItems?.count || 0}
        </span>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {criticalItemsPreview.length > 0
          ? criticalItemsPreview.map((item: Ingredient, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                <ShoppingCart size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-700 truncate">{item.name}</p>
                <p className="text-[10px] text-red-400 font-medium">Sisa {item.stock} {item.base_unit}</p>
              </div>
              <button 
                onClick={() => onNavigate('inventory')}
                className="text-slate-300 hover:text-blue-500 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ))
          : <div className="py-8 text-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <Package size={18} className="text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Semua stok aman!</p>
            </div>
        }
      </div>
    </div>
  );

  const AiLog = () => (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-500" />
          <p className="text-[12px] font-bold text-slate-800 tracking-tight">AI Insights</p>
        </div>
      </div>
      <div>
        {AI_LOGS.map((log, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors cursor-default"
          >
            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.alert ? 'bg-red-400' : 'bg-indigo-400'}`} />
            <div className="flex-1">
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{log.msg}</p>
              <p className="text-[9px] text-slate-300 mt-1 font-mono uppercase">{log.time} • Restoflow Intelligence</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">

      {/* Tampilan Mobile */}
      <div className="md:hidden space-y-4">
        <MetricCards />
        <ShiftCards />
        <SalesChart />
        <OcrCard />
        <ShoppingList />
        <AiLog />
      </div>

      {/* Tampilan Tablet */}
      <div className="hidden md:grid lg:hidden grid-cols-[260px_1fr] gap-4">
        <div className="space-y-4">
          <OcrCard />
          <ShiftCards />
          <ShoppingList />
        </div>
        <div className="space-y-4">
          <MetricCards />
          <SalesChart />
          <AiLog />
        </div>
      </div>

      {/* Tampilan Desktop */}
      <div className="hidden lg:grid grid-cols-12 gap-5">
        <div className="col-span-4 space-y-5">
          <OcrCard />
          <ShiftCards />
          <ShoppingList />
          <AiLog />
        </div>
        <div className="col-span-8 space-y-5">
          <MetricCards />
          <SalesChart />
          <div className="grid grid-cols-2 gap-5">
            {/* Widget Distribusi Stok */}
            <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
               <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-3">Distribusi Stok</h4>
               <div className="space-y-2">
                  {stats.categoryDistribution?.slice(0, 4).map((cat, i) => (
                    <div key={i}>
                       <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>{cat.category}</span>
                          <span>{cat.count} item</span>
                       </div>
                       <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full" 
                            style={{ width: `${(cat.count / (stats.totalItems || 1)) * 100}%` }}
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            {/* Widget Inventory Value */}
            <div className="bg-indigo-900 p-4 rounded-2xl text-white">
               <h4 className="text-[11px] font-bold text-indigo-300 uppercase mb-2">Inventory Value</h4>
               <p className="text-2xl font-bold">{formatIDRCompact(stats.totalValue || 0)}</p>
               <p className="text-[10px] text-indigo-300 mt-1">Estimasi nilai aset stok saat ini.</p>
               <button 
                onClick={() => onNavigate('inventory')}
                className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold transition-colors"
               >
                 Detail Inventaris
               </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}