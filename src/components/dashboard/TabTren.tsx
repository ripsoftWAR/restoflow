import { Fragment, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AreaChart, Area, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import type { Sale } from '../../types';
import { formatIDRCompact, parseDashboardDate } from './shared/utils';

type Granularity = 'daily' | 'weekly' | 'monthly';
type MetricKey = 'omset' | 'transaksi' | 'profit';
type CompareMode = 'none' | 'prevPeriod' | 'lastMonth' | 'lastYear';

interface MetricConfig {
  key: MetricKey; label: string; color: string;
  format: (v: number) => string;
}

const METRICS: MetricConfig[] = [
  { key: 'omset', label: 'Omset', color: '#2E4FE0', format: (v) => `Rp ${formatIDRCompact(v)}` },
  { key: 'transaksi', label: 'Transaksi', color: '#6366F1', format: (v) => `${v.toLocaleString('id-ID')} tx` },
  { key: 'profit', label: 'Keuntungan', color: '#10B981', format: (v) => `Rp ${formatIDRCompact(v)}` },
];

const G_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'daily', label: 'Harian' }, { value: 'weekly', label: 'Mingguan' }, { value: 'monthly', label: 'Bulanan' },
];

const C_OPTIONS: { value: CompareMode; label: string }[] = [
  { value: 'none', label: 'Tanpa pembanding' }, { value: 'prevPeriod', label: 'vs periode lalu' },
  { value: 'lastMonth', label: 'vs bulan lalu' }, { value: 'lastYear', label: 'vs tahun lalu' },
];

const D_NAMES = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const H_LABELS = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];

/* ── HELPERS ──────────────────────────────────── */
function aggregateByGranularity(sales: Sale[], g: Granularity, sd: Date, ed: Date) {
  const res: Record<string, { omset: number; transaksi: number; profit: number; label: string }> = {};
  const buckets: { key: string; label: string }[] = [];
  const cur = new Date(sd);
  if (g === 'daily') {
    while (cur <= ed) { const k = cur.toISOString().split('T')[0]; buckets.push({ key: k, label: `${cur.getDate()}/${cur.getMonth()+1} ${D_NAMES[cur.getDay()]}` }); cur.setDate(cur.getDate()+1); }
  } else if (g === 'weekly') {
    while (cur <= ed) { const we = new Date(cur); we.setDate(we.getDate()+6); const ae = we > ed ? new Date(ed) : we; buckets.push({ key: `${cur.getDate()}/${cur.getMonth()+1}-${ae.getDate()}/${ae.getMonth()+1}`, label: `${cur.getDate()}/${cur.getMonth()+1}-${ae.getDate()}/${ae.getMonth()+1}` }); cur.setDate(cur.getDate()+7); }
  } else {
    const mn = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    while (cur <= ed) { buckets.push({ key: `${mn[cur.getMonth()]} ${cur.getFullYear()}`, label: `${mn[cur.getMonth()]} ${cur.getFullYear()}` }); cur.setMonth(cur.getMonth()+1); }
  }
  buckets.forEach(b => { res[b.key] = { omset:0, transaksi:0, profit:0, label:b.label }; });
  sales.forEach(s => { const d = parseDashboardDate(s.created_at); if(!d) return; let bk = ''; if(g==='daily') bk = d.toISOString().split('T')[0]; else if(g==='weekly') { const f = buckets.find(b => { const [ss,es] = b.key.split('-'); const [d1,m1]=ss.split('/').map(Number); const [d2,m2]=es.split('/').map(Number); return d >= new Date(d.getFullYear(),m1-1,d1) && d <= new Date(d.getFullYear(),m2-1,d2,23,59,59); }); bk = f?.key||''; } else { const mn=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']; bk = `${mn[d.getMonth()]} ${d.getFullYear()}`; } if(res[bk]) { const v = Number(s.total_price)||0; res[bk].omset+=v; res[bk].transaksi+=1; res[bk].profit+=Math.round(v*0.42); } });
  return Object.entries(res).map(([date,data]) => ({ date, ...data }));
}

function computeHeatmap(sales: Sale[]) {
  const m: number[][] = Array.from({length:7},()=>Array(24).fill(0));
  sales.forEach(s=>{const d=parseDashboardDate(s.created_at); if(!d)return; m[d.getDay()][d.getHours()]+=1;});
  return m;
}

function computeTrendingMenus(cs: Sale[], ps: Sale[]) {
  const cm: Record<string,{r:number;q:number}> = {};
  const pm: Record<string,number> = {};
  cs.forEach(s=>{if(!cm[s.menu_name]) cm[s.menu_name]={r:0,q:0}; cm[s.menu_name].r+=Number(s.total_price)||0; cm[s.menu_name].q+=Number(s.quantity)||0;});
  ps.forEach(s=>{pm[s.menu_name]=(pm[s.menu_name]||0)+(Number(s.total_price)||0);});
  return Object.entries(cm).map(([n,d])=>{const p=pm[n]||0; const cp=p>0?Math.round(((d.r-p)/p)*100):(d.r>0?100:0); return {name:n,currentRevenue:d.r,previousRevenue:p,changePct:cp,qty:d.q};}).sort((a,b)=>Math.abs(b.changePct)-Math.abs(a.changePct)).slice(0,7);
}

/* ── PROPS ────────────────────────────────────── */
interface Props {
  sales: Sale[];
  filteredSales: Sale[];
  dateRangeLabel: string;
  dateRange: string;
  startDate: Date;
  endDate: Date;
}

/* ═══════════════════════════════════════════════
   GranularityDropdown
   Style: SalesChart "Daily ⌄" dropdown
   ═══════════════════════════════════════════════ */
function GranularityDropdown({ value, onChange }: { value: Granularity; onChange: (g: Granularity) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if(!open) return; const h = (e: MouseEvent) => { if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h); }, [open]);
  const label = G_OPTIONS.find(o=>o.value===value)?.label || 'Harian';
  return (
    <div className="relative inline-flex" ref={ref}>
      <button type="button" onClick={(e)=>{e.stopPropagation(); setOpen(!open);}} className="flex items-center gap-[6px] text-[12.5px] font-medium text-pp-text border border-pp-border px-[10px] py-[6px] rounded-pp-xs hover:bg-pp-surface-alt transition-colors cursor-pointer whitespace-nowrap">
        <span>{label}</span>
        <ChevronDown size={12} strokeWidth={2} className={`transition-transform duration-150 ${open?'rotate-180':''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:0.12}} className="absolute top-full right-0 mt-1 z-[60] bg-pp-surface border border-pp-border rounded-pp-md shadow-pp-lg py-1 min-w-[120px]">
            {G_OPTIONS.map(o=>(
              <button key={o.value} type="button" onClick={(e)=>{e.stopPropagation(); onChange(o.value); setOpen(false);}} className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors cursor-pointer whitespace-nowrap ${o.value===value?'bg-pp-primary/10 text-pp-primary font-semibold':'text-pp-text-secondary hover:bg-pp-surface-alt'}`}>{o.label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CompareDropdown
   Style: PremiumKPICard CompareDropdown
   ═══════════════════════════════════════════════ */
function CompareDropdown({ value, onChange }: { value: CompareMode; onChange: (c: CompareMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if(!open) return; const h = (e: MouseEvent) => { if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h); }, [open]);
  const label = C_OPTIONS.find(o=>o.value===value)?.label || 'Tanpa pembanding';
  const isActive = value !== 'none';
  return (
    <div className="relative inline-flex" ref={ref}>
      <button type="button" onClick={(e)=>{e.stopPropagation(); setOpen(!open);}} className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-pp-xs transition-colors cursor-pointer whitespace-nowrap ${isActive?'text-pp-primary bg-pp-primary-soft':'text-pp-text-muted hover:bg-pp-surface-alt'}`}>
        <span className="max-w-[100px] truncate">{label}</span>
        <ChevronDown size={10} strokeWidth={2} className={`transition-transform duration-150 flex-shrink-0 ${open?'rotate-180':''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:0.12}} className="absolute top-full left-0 mt-1 z-[60] bg-pp-surface border border-pp-border rounded-pp-md shadow-pp-lg py-1 min-w-[160px]">
            {C_OPTIONS.map(o=>(
              <button key={o.value} type="button" onClick={(e)=>{e.stopPropagation(); onChange(o.value); setOpen(false);}} className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors cursor-pointer whitespace-nowrap ${o.value===value?'bg-pp-primary/10 text-pp-primary font-semibold':'text-pp-text-secondary hover:bg-pp-surface-alt'}`}>{o.label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function TabTren({ sales, filteredSales, dateRangeLabel, dateRange, startDate, endDate }: Props) {
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>(['omset','transaksi','profit']);
  const [compareMode, setCompareMode] = useState<CompareMode>('none');
  const [hoverData, setHoverData] = useState<{x:number; y:number; date:string; values:{key:MetricKey;val:number;label:string}[]}|null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const toggleMetric = useCallback((key: MetricKey) => {
    setActiveMetrics(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key]);
  }, []);

  /* ── Chart Data ─────────────────────────────── */
  const chartData = useMemo(() => aggregateByGranularity(filteredSales, granularity, startDate, endDate), [filteredSales, granularity, startDate, endDate]);

  /* ── Comparison Data ────────────────────────── */
  const compareData = useMemo(() => {
    if (compareMode === 'none') return null;
    const dur = endDate.getTime() - startDate.getTime();
    let shift = dur;
    if (compareMode === 'lastMonth') shift = 30*24*60*60*1000;
    else if (compareMode === 'lastYear') shift = 365*24*60*60*1000;
    const ps = new Date(startDate.getTime() - shift);
    const pe = new Date(endDate.getTime() - shift);
    const prevSales = sales.filter(s => { const d = parseDashboardDate(s.created_at); return d && d >= ps && d <= pe; });
    return aggregateByGranularity(prevSales, granularity, ps, pe);
  }, [sales, compareMode, granularity, startDate, endDate]);

  /* ── Merged chart data (current + comparison) ─ */
  const mergedChartData = useMemo(() => {
    if (!compareData) return chartData;
    const compMap = new Map(compareData.map(c => [c.date, c]));
    return chartData.map(d => {
      const comp = compMap.get(d.date);
      return {
        ...d,
        comp_omset: comp?.omset ?? null,
        comp_transaksi: comp?.transaksi ?? null,
        comp_profit: comp?.profit ?? null,
      };
    });
  }, [chartData, compareData]);

  /* ── Hover handler ──────────────────────────── */
  const handleChartMouseMove = useCallback((e: any) => {
    if (!e?.activeTooltipIndex && e?.activeTooltipIndex !== 0) { setHoverData(null); return; }
    const idx = Number(e.activeTooltipIndex);
    if (Number.isNaN(idx) || idx < 0 || idx >= mergedChartData.length) { setHoverData(null); return; }
    const point = mergedChartData[idx];
    if (!point) { setHoverData(null); return; }
    const vals = activeMetrics.map(k => ({ key: k, val: Number(point[k as keyof typeof point]) || 0, label: METRICS.find(m=>m.key===k)?.label||k }));
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const cx = (e as any)?.clientX;
      setHoverData({ x: typeof cx==='number'?Math.max(0,Math.min(cx-rect.left,rect.width)):(idx/Math.max(mergedChartData.length-1,1))*rect.width, y: 0, date: point.label, values: vals });
    }
  }, [mergedChartData, activeMetrics]);

  const handleChartMouseLeave = useCallback(() => setHoverData(null), []);

  /* ── Heatmap ─────────────────────────────────── */
  const heatmap = useMemo(() => computeHeatmap(filteredSales), [filteredSales]);
  const maxHeat = useMemo(() => Math.max(1, ...heatmap.flat()), [heatmap]);

  /* ── Trending Menus ──────────────────────────── */
  const prevSalesForTrend = useMemo(() => {
    const dur = endDate.getTime() - startDate.getTime();
    const ps = new Date(startDate.getTime() - dur);
    const pe = new Date(endDate.getTime() - dur);
    return sales.filter(s => { const d = parseDashboardDate(s.created_at); return d && d >= ps && d <= pe; });
  }, [sales, startDate, endDate]);
  const trendingMenus = useMemo(() => computeTrendingMenus(filteredSales, prevSalesForTrend), [filteredSales, prevSalesForTrend]);

  const isEmpty = chartData.length === 0;

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div className="space-y-5">
      {/* ═══════════════════════════════════════════
          SECTION 1: MAIN TREND CHART
          ═══════════════════════════════════════════ */}
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
        {/* ── Header row ────────────────────────── */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="text-[15.5px] font-bold text-pp-text">Tren Performa</div>
            <div className="text-[12px] text-pp-text-muted mt-0.5">{dateRangeLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <GranularityDropdown value={granularity} onChange={setGranularity} />
            <CompareDropdown value={compareMode} onChange={setCompareMode} />
          </div>
        </div>

        {/* ── Metric toggle pills ───────────────── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {METRICS.map(m => {
            const isActive = activeMetrics.includes(m.key);
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => toggleMetric(m.key)}
                className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer border ${
                  isActive
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-pp-border text-pp-text-muted hover:text-pp-text-secondary hover:border-pp-text-muted'
                }`}
                style={isActive ? { backgroundColor: m.color } : undefined}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : ''}`} style={!isActive ? { backgroundColor: m.color } : undefined} />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* ── Chart ─────────────────────────────── */}
        <div ref={chartRef} className="relative h-[300px] -mx-1">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <span className="text-[32px]">📈</span>
              <p className="text-[13px] text-pp-text-muted">Belum ada data tren</p>
              <p className="text-[11px] text-pp-text-muted">Data akan muncul setelah ada transaksi</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mergedChartData} onMouseMove={handleChartMouseMove} onMouseLeave={handleChartMouseLeave} margin={{top:5,right:0,left:-10,bottom:0}}>
                  <defs>
                    {METRICS.map(m => (
                      <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={m.color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={m.color} stopOpacity={0.0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0F7" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#9CA3AF'}} interval="preserveStartEnd" minTickGap={50} dy={8} />
                  <YAxis yAxisId="trend" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#9CA3AF'}} tickFormatter={v => { if(v>=1_000_000) return `${(v/1_000_000).toFixed(1).replace('.',',')}jt`; if(v>=1_000) return `${Math.round(v/1_000)}rb`; return '0'; }} domain={[0,'auto']} width={45} />
                  <Tooltip content={()=>null} cursor={{stroke:'#D7DCEC',strokeWidth:1,strokeDasharray:'4 4'}} />
                  {/* Current period — Area dengan gradient fill */}
                  {activeMetrics.map(key => {
                    const m = METRICS.find(metric => metric.key === key);
                    if (!m) return null;
                    return (
                      <Area key={m.key} yAxisId="trend" type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2.5} fillOpacity={1} fill={`url(#grad-${m.key})`} dot={false} activeDot={{r:5,fill:'white',stroke:m.color,strokeWidth:2.5}} isAnimationActive={false} />
                    );
                  })}
                  {/* Comparison period — dashed Line, pakai data dari mergedChartData (parent) */}
                  {compareData && activeMetrics.map(key => {
                    const m = METRICS.find(metric => metric.key === key);
                    if (!m) return null;
                    return (
                      <Line key={`comp_${m.key}`} yAxisId="trend" type="monotone" dataKey={`comp_${m.key}`} stroke={m.color} strokeWidth={1.5} strokeDasharray="5 5" dot={false} activeDot={false} isAnimationActive={false} opacity={0.5} connectNulls={false} />
                    );
                  })}
                </ComposedChart>
              </ResponsiveContainer>

              {/* ── Hover Tooltip ──────────────────── */}
              {hoverData && (
                <div className="absolute bg-[#1B2436] text-white px-[13px] py-[10px] rounded-[10px] text-[12px] pointer-events-none z-10 transform -translate-x-1/2 -translate-y-[115%]" style={{left:hoverData.x, top:hoverData.y||10}}>
                  <div className="text-[#B9C1D9] text-[11px] mb-[6px]">{hoverData.date}</div>
                  {hoverData.values.map(v => {
                    const cfg = METRICS.find(m=>m.key===v.key);
                    return (
                      <div key={v.key} className="font-semibold flex items-center gap-[6px] text-[13px]">
                        <span className="w-[6px] h-[6px] rounded-full inline-block flex-shrink-0" style={{backgroundColor:cfg?.color}} />
                        {cfg?.format(v.val)}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 2: HEATMAP + TRENDING MENUS
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-[1fr_1fr] gap-5 max-[860px]:grid-cols-1">
        {/* ── HEATMAP ────────────────────────────── */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[15.5px] font-bold text-pp-text">Heatmap Jam × Hari</div>
              <div className="text-[12px] text-pp-text-muted mt-0.5">Distribusi transaksi</div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-pp-text-muted">
              <span className="w-3 h-3 rounded-sm" style={{backgroundColor:'#EFF6FF'}} />
              <span>Sepi</span>
              <span className="w-3 h-3 rounded-sm" style={{backgroundColor:'#2563EB'}} />
              <span>Ramai</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-[2px]" style={{gridTemplateColumns:`40px repeat(24,minmax(18px,1fr))`}}>
              {/* Day labels column + hour headers */}
              <div className="text-[9px] text-pp-text-muted font-medium" />
              {H_LABELS.map(h => <div key={h} className="text-[9px] text-pp-text-muted font-medium text-center">{h}</div>)}
              {/* Rows */}
              {D_NAMES.map((day, di) => (
                <Fragment key={di}>
                  <div key={`dl${di}`} className="text-[10px] font-medium text-pp-text-muted flex items-center justify-end pr-1.5">{day}</div>
                  {heatmap[di].map((val, hi) => {
                    const intensity = val / maxHeat;
                    const r = 37, g = 99, b = 235; // pp-primary #2563EB
                    const alpha = Math.max(0.04, intensity * 0.9);
                    const bg = intensity > 0.05 ? `rgba(${r},${g},${b},${alpha.toFixed(2)})` : '#FAFBFC';
                    return (
                      <div key={`h${di}-${hi}`} className="aspect-square rounded-[2px] relative group cursor-default" style={{backgroundColor:bg}} title={`${day} ${H_LABELS[hi]}:00 — ${val} transaksi`}>
                        {/* Tiny tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[#1B2436] text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
                          {day} {H_LABELS[hi]}:00 · {val} tx
                        </div>
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ── TRENDING MENUS ─────────────────────── */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-[15.5px] font-bold text-pp-text">Menu Naik/Turun</div>
              <div className="text-[12px] text-pp-text-muted mt-0.5">vs periode sebelumnya</div>
            </div>
          </div>

          {trendingMenus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-[32px]">🍽️</span>
              <p className="text-[13px] text-pp-text-muted">Belum cukup data</p>
              <p className="text-[11px] text-pp-text-muted">Butuh minimal 2 periode untuk perbandingan</p>
            </div>
          ) : (
            <div className="flex flex-col mt-[14px]">
              {trendingMenus.map((menu, i) => (
                <div key={menu.name} className="flex items-center gap-3 py-[11px] border-b border-pp-border last:border-b-0 last:pb-0">
                  <span className="text-[13px] font-bold text-pp-text-muted w-[14px] tabular-nums">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-pp-text truncate">{menu.name}</div>
                    <div className="text-[12px] text-pp-text-muted mt-0.5">{formatIDRCompact(menu.currentRevenue)} · {menu.qty} porsi</div>
                  </div>
                  <div className={`flex items-center gap-1 text-[13px] font-bold whitespace-nowrap ${
                    menu.changePct > 0 ? 'text-pp-success' : menu.changePct < 0 ? 'text-pp-danger' : 'text-pp-text-muted'
                  }`}>
                    {menu.changePct > 0 ? <TrendingUp size={14} strokeWidth={2.5} /> : menu.changePct < 0 ? <TrendingDown size={14} strokeWidth={2.5} /> : null}
                    {menu.changePct > 0 ? '+' : ''}{menu.changePct}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}