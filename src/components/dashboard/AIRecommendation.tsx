import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, ShoppingBag, ArrowRight } from 'lucide-react';
import type { Ingredient } from '../../types';

interface Props {
  ingredients: Ingredient[];
  onNavigate: (tab: string) => void;
}

export default function AIRecommendation({ ingredients, onNavigate }: Props) {
  const recommendations = useMemo(() => {
    return ingredients
      .filter(i => i.min_stock > 0 && i.stock <= i.min_stock)
      .map(i => ({
        id: i.id,
        name: i.name,
        current: i.stock,
        min: i.min_stock,
        need: Math.max(1, i.min_stock - i.stock),
        unit: i.base_unit,
      }))
      .sort((a, b) => (b.need / b.min) - (a.need / a.min))
      .slice(0, 5);
  }, [ingredients]);

  if (recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <Brain size={13} className="text-pp-chart-purple" />
        <p className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-[0.06em]">
          AI Recommendation
        </p>
      </div>

      <div className="bg-pp-surface border border-pp-border rounded-pp-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-pp-border-light">
          <div className="w-7 h-7 rounded-pp-xs bg-pp-primary-soft flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={14} className="text-pp-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-pp-text">Disarankan Restock</h3>
            <p className="text-[10px] text-pp-text-muted mt-0.5">Bahan di bawah stok minimum</p>
          </div>
        </div>

        {/* Item list — compact */}
        <div className="px-4 py-2">
          {recommendations.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ x: 2 }}
              className="flex items-center justify-between py-2.5 border-b border-pp-border-light last:border-b-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-pp-danger flex-shrink-0" />
                <span className="text-[12px] font-medium text-pp-text truncate">{item.name}</span>
              </div>
              <span className="text-[11px] text-pp-text-muted tabular-nums flex-shrink-0 ml-2">
                <strong className="text-pp-danger">{item.current}</strong>/{item.min}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-4 pb-4 pt-2">
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-2 w-full justify-center text-[12px] font-semibold text-white bg-pp-primary hover:bg-pp-primary-hover rounded-pp-sm py-2 transition-colors duration-150 cursor-pointer"
          >
            Buat Purchase Order
            <ArrowRight size={13} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
