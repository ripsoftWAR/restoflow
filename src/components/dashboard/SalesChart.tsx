import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';

const formatIDR = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

export default function SalesChart({ chartData }: { chartData: { time: string; val: number }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
      {/* HEADER WITH DROPDOWN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 pb-0 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Penjualan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Analisis omset per hari</p>
        </div>
        
        {/* Calendar Dropdown Mock */}
        <button className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left w-fit">
          <Calendar size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-600 uppercase">Rentang</span>
            <span className="text-xs font-bold text-slate-700 leading-none">7 Hari Terakhir</span>
          </div>
          <ChevronDown size={14} className="text-slate-400 ml-1" />
        </button>
      </div>

      {/* CHART CONTAINER */}
      <div className="flex-1 p-5 pb-4 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              {/* Beautiful Gradient Fill */}
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            {/* Grid Lines - Subtle */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#f1f5f9" 
              strokeOpacity={1} 
            />
            
            {/* X Axis - Minimal */}
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} 
              interval={0}
              minTickGap={30}
              dy={10}
            />
            
            {/* Y Axis - Hidden (Clean Look) */}
            <YAxis hide domain={['dataMin', 'dataMax']} />
            
            {/* Custom Tooltip */}
            <Tooltip 
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={({ payload, active }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-800">
                      <p className="text-[10px] text-slate-400 mb-0.5">{payload[0].payload.time}</p>
                      <p className="text-sm font-bold">{formatIDR(Number(payload[0].value))}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Area Line - Smooth & Thick */}
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke="#6366f1" 
              strokeWidth={3} 
              strokeLinecap="round"
              strokeLinejoin="round"
              fillOpacity={1} 
              fill="url(#colorVal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}