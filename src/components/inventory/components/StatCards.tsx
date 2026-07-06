import React from 'react';
import { Box, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import { Ingredient, totalStockValue } from '../../../types';
import { formatIDR } from '../utils/format';

interface StatCardsProps {
  ingredients: Ingredient[];
}

export default function StatCards({ ingredients }: StatCardsProps) {
  const totalItem = ingredients.length;
  const totalNilai = ingredients.reduce((acc, i) => acc + totalStockValue(i), 0);
  const kritisCount = ingredients.filter(i => i.stock <= i.min_stock).length;
  const akanHabis = ingredients.filter(
    i => i.stock <= i.min_stock * 1.5 && i.stock > i.min_stock
  ).length;

  const cards = [
    {
      icon: <Box size={16} />,
      iconBg: 'bg-purple-50 text-purple-600',
      label: 'Total Item',
      value: <span className="text-xl font-extrabold text-slate-800 leading-tight">{totalItem}</span>,
      sub: <span className="text-[10px] text-slate-400">Semua bahan aktif</span>,
    },
    {
      icon: <DollarSign size={16} />,
      iconBg: 'bg-green-50 text-green-600',
      label: 'Total Nilai Stok',
      value: <span className="text-base font-extrabold text-green-600 leading-tight">Rp {formatIDR(totalNilai)}</span>,
      sub: <span className="text-[10px] text-green-600 font-medium">▲ 12% dari bulan lalu</span>,
    },
    {
      icon: <AlertTriangle size={16} />,
      iconBg: 'bg-red-50 text-red-500',
      label: 'Stok Kritis',
      value: <span className="text-xl font-extrabold text-red-500 leading-tight">{kritisCount} Item</span>,
      sub: <span className="text-[10px] text-red-500 font-medium">▲ 2 item baru</span>,
    },
    {
      icon: <Clock size={16} />,
      iconBg: 'bg-blue-50 text-blue-600',
      label: 'Akan Habis (7 hari)',
      value: <span className="text-xl font-extrabold text-blue-600 leading-tight">{akanHabis} Item</span>,
      sub: <span className="text-[10px] text-blue-600 font-medium">Perlu perhatian</span>,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm">
          <div className="flex items-start gap-2.5 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
              {card.icon}
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">{card.label}</div>
              {card.value}
            </div>
          </div>
          {card.sub}
        </div>
      ))}
    </div>
  );
}
