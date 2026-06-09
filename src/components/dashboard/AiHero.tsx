import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle, 
  Zap, 
  BrainCircuit, 
  Loader2,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ingredient, RecipeWithDetails } from '../../types';

interface AiHeroProps {
  ingredients: Ingredient[];
  recipes: RecipeWithDetails[];
  onOpenChat: () => void;
}

export default function AiHero({ ingredients, recipes, onOpenChat }: AiHeroProps) {
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<{
    headline: string;
    points: { text: string; type: 'up' | 'warning' | 'info' }[];
  } | null>(null);

  useEffect(() => {
    // Logic tetap dipertahankan seperti requested
    const fetchData = async () => {
      setLoading(true);
      setTimeout(() => {
        const lowStockItems = ingredients.filter(i => i.stock <= i.min_stock).length;
        
        setInsight({
          headline: "Ringkasan Kecerdasan Operasional",
          points: [
            { text: `${lowStockItems} bahan perlu restock segera`, type: 'warning' },
            { text: "Menu baru memiliki potensi profit 15%", type: 'up' },
            { text: "Stok bahan segar cukup untuk 3 hari", type: 'info' }
          ]
        });
        setLoading(false);
      }, 2000);
    };

    fetchData();
  }, [ingredients.length]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#06214a] border border-white/5 shadow-2xl">
      
      {/* BACKGROUND GRID & GLOW EFFECTS */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      
      {/* GRID LINES */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* KOLOM KIRI: KONTEN */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* AI BADGE */}
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-indigo-500 rounded-lg blur-md"
                />
                <div className="relative h-8 w-8 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg border border-white/10 flex items-center justify-center shadow-lg">
                  <BrainCircuit size={16} className="text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">Neural Engine V3</p>
                <p className="text-[10px] text-slate-500 font-medium">Connected to PostgreSQL</p>
              </div>
              <div className="ml-auto flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-400 font-medium">Live</span>
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-32 flex flex-col justify-center"
                  >
                     <div className="flex items-center gap-3 text-indigo-300 mb-4">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-sm font-medium animate-pulse">Mengoptimalkan Neural Network...</span>
                    </div>
                    <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      {insight?.headline}
                    </h2>
                    
                    {/* INSIGHTS COMPACT GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                      {insight?.points.map((point, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all cursor-default"
                        >
                          <div className={`p-2 rounded-lg ${
                            point.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                            point.type === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {point.type === 'warning' && <AlertCircle size={14} />}
                            {point.type === 'up' && <TrendingUp size={14} />}
                            {point.type === 'info' && <Zap size={14} />}
                          </div>
                          <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                            {point.text}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* KOLOM KANAN: VISUAL 3D & ACTION */}
          <div className="lg:col-span-5 relative h-full min-h-[240px] flex items-center justify-center lg:justify-end">
            
            {/* ANIMASI 3D LAYERS (DECORATION) */}
            <div className="relative w-48 h-48 hidden lg:block">
              {/* Layer Belakang */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full" 
              />
              {/* Layer Tengah */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border border-blue-500/20 rounded-full border-dotted" 
              />
              {/* Floating Card 1 */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 left-0 w-24 h-32 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl rotate-6 flex flex-col justify-between p-3"
              >
                 <div className="w-8 h-8 rounded-full bg-indigo-500/20" />
                 <div className="space-y-2">
                   <div className="w-full h-2 bg-slate-700 rounded-full" />
                   <div className="w-2/3 h-2 bg-slate-700 rounded-full" />
                 </div>
              </motion.div>
              {/* Floating Card 2 (Active) */}
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-4 right-0 w-24 h-32 bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-xl shadow-2xl -rotate-3 flex flex-col justify-between p-3 z-20"
              >
                 <div className="flex items-center gap-2">
                    <BrainCircuit size={12} className="text-indigo-400" />
                    <div className="w-12 h-1.5 bg-indigo-500/50 rounded-full" />
                 </div>
                 <div className="w-full space-y-1.5">
                    <div className="w-full h-2 bg-slate-700/50 rounded-full" />
                    <div className="w-full h-2 bg-slate-700/50 rounded-full" />
                    <div className="w-1/2 h-2 bg-indigo-500/50 rounded-full" />
                 </div>
              </motion.div>
            </div>

            {/* TOMBOL ACTION (Overlay/Centered) */}
            <div className="absolute lg:relative z-30 w-full flex justify-center lg:justify-end px-4">
              <button 
                onClick={onOpenChat}
                className="group relative flex items-center gap-4 bg-white hover:bg-slate-100 text-slate-900 px-7 py-4 rounded-2xl font-bold transition-all active:scale-95 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine" />
                
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 group-hover:text-indigo-700 transition-colors">AI Assistant</span>
                  <span className="text-base flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-500" />
                    Mulai Obrolan
                  </span>
                </div>
                <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={16} />
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes shine {
          100% { transform: translateX(100%); }
        }
        .group-hover\\:animate-shine {
          animation: shine 0.75s;
        }
      `}</style>
    </div>
  );
}