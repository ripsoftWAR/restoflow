import { 
  TrendingUp, 
  ShoppingCart, 
  Receipt, 
  AlertTriangle,
  Activity 
} from 'lucide-react';
import { DashboardStats } from '../../types';

const formatIDR = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

const formatIDRCompact = (num: number) => {
  if (num >= 1_000_000) return `Rp${(num / 1_000_000).toFixed(1)} jt`;
  if (num >= 1_000)     return `Rp${(num / 1_000).toFixed(0)} rb`;
  return formatIDR(num);
};

export default function MetricCards({ stats }: { stats: DashboardStats }) {
  const metrics = [
    { 
      label: 'Total Omset',  
      value: formatIDRCompact(stats.totalSalesByDay || 0),  
      icon: TrendingUp,    
      color: 'text-blue-600',    
      bg: 'bg-blue-50',
      trend: '+12%' 
    },
    { 
      label: 'Transaksi',    
      value: `${stats.totalTransactionsByDay || 0}`,         
      icon: ShoppingCart,  
      color: 'text-violet-600',  
      bg: 'bg-violet-50',
      trend: '+8%' 
    },
    { 
      label: 'Profit',       
      value: formatIDRCompact((stats.totalSalesByDay || 0) - (stats.dailyExpense || 0)), 
      icon: Receipt, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      trend: '+5%' 
    },
    { 
      label: 'Stok Kritis',  
      value: `${stats.criticalStockItems?.count || 0}`,      
      icon: AlertTriangle, 
      color: 'text-amber-600',     
      bg: 'bg-amber-50',
      trend: null 
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map(({ label, value, icon: Icon, color, bg, trend }) => (
        <div 
          key={label}
          className="group relative bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-xl ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            {trend && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                {trend}
              </span>
            )}
          </div>

          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5 truncate">{label}</p>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{value}</h3>
          </div>

          {/* Mini Chart Placeholder (Decorative) */}
          <div className="absolute bottom-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
            <Activity size={32} className={color} />
          </div>
        </div>
      ))}
    </div>
  );
}