import React from 'react';
import OriginalSalesSimulator from '../SalesSimulator';
import { Ingredient, RecipeWithDetails, Sale } from '../../types';
import { useSalesState } from './hooks/useSalesState';

interface SalesSimulatorProps {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  sales: Sale[];
  onTriggerSale: (saleData: {
    menu_name: string;
    quantity: number;
    total_price: number;
    selected_options?: string;
    payment_method: 'CASH' | 'QRIS';
    cash_paid: number | null;
    cash_change: number | null;
  }) => Promise<void>;
  onRefreshStats: () => void;
}

export default function SalesSimulator(props: SalesSimulatorProps) {
  const { summary } = useSalesState(props.recipes, props.sales);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Feature module</p>
        <h2 className="text-base font-semibold text-slate-800">Sales feature</h2>
        <p className="text-sm text-slate-500">
          {summary.totalSales} transaksi • Rp {summary.totalRevenue.toLocaleString('id-ID')} total pendapatan
        </p>
      </div>
      <OriginalSalesSimulator {...props} />
    </section>
  );
}
