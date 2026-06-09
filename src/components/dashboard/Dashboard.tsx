import { useMemo } from 'react';
import { DashboardStats, Ingredient, MovementLog, RecipeWithDetails } from '../../types';
import AiHero           from './AiHero';
import MetricCards      from './MetricCards';
import QuickActions     from './QuickActions';
import SalesChart       from './SalesChart';
import ShoppingList     from './ShoppingList';
import InventoryInsight from './InventoryInsight';

interface DashboardProps {
  stats: DashboardStats;
  onNavigate: (tab: string) => void;
  movements: MovementLog[];
  ingredients: Ingredient[];
  recipes: RecipeWithDetails[];
}

export default function Dashboard({ stats, onNavigate, ingredients, recipes }: DashboardProps) {
  const chartData = useMemo(() => {
    if (stats.salesTrend?.length) {
      return stats.salesTrend.map(item => ({
        time: item.date.split('-').slice(1).join('/'),
        val: item.amount || 0,
      }));
    }
    return [{ time: '00:00', val: 0 }];
  }, [stats.salesTrend]);

  const criticalItemsPreview = useMemo(
    () => stats.criticalStockItems?.items?.slice(0, 5) || [],
    [stats.criticalStockItems],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">

      <AiHero
        ingredients={ingredients}
        recipes={recipes}
        onOpenChat={() => onNavigate('ai')}
      />

      <MetricCards stats={stats} />

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4">
          <QuickActions onNavigate={onNavigate} />
        </div>
        <div className="lg:col-span-8">
          <SalesChart chartData={chartData} />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4">
          <ShoppingList
            items={criticalItemsPreview}
            totalCount={stats.criticalStockItems?.count || 0}
            onNavigate={onNavigate}
          />
        </div>
        <div className="lg:col-span-8">
          <InventoryInsight />
        </div>
      </div>

    </div>
  );
}