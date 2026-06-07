import { Router } from 'express';
import db from '../db/database';
import { getIngredientEstimatedCost, ESTIMATED_UNIT_COSTS } from '../utils/costHelper';
import { requireAuth, requireRole } from '../utils/authMiddleware';

const router = Router();

// 1. Tambahkan requireAuth agar kita tahu restaurant_id si pemilik
// 2. Gunakan async pada (req, res)
router.get('/stats', requireAuth, requireRole('Pemilik'), async (req, res) => {
  const restaurantId = req.user!.restaurant_id;

  try {
    // Jalankan query secara paralel untuk kecepatan
    const [ingRes, salesRes, movRes] = await Promise.all([
      db.query('SELECT * FROM ingredients WHERE restaurant_id = $1', [restaurantId]),
      db.query('SELECT * FROM sales WHERE restaurant_id = $1', [restaurantId]),
      db.query('SELECT * FROM movement_log WHERE restaurant_id = $1', [restaurantId])
    ]);

    const ingredients = ingRes.rows;
    const salesList = salesRes.rows;
    const movements = movRes.rows;

    // 1. STOCK METRICS
    let totalValue = 0;
    const criticalStockList: any[] = [];

    ingredients.forEach(ing => {
      totalValue += getIngredientEstimatedCost(ing);
      // Pastikan konversi ke angka karena Postgres mengembalikan string untuk DECIMAL/REAL
      if (Number(ing.stock) <= (Number(ing.min_stock) || 0)) {
        criticalStockList.push(ing);
      }
    });

    const criticalStockItems = {
      count: criticalStockList.length,
      items: criticalStockList
    };

    const totalItems = ingredients.length;

    // 2. DAILY SALES METRICS (TODAY)
    // Gunakan zona waktu lokal atau UTC sesuai kebutuhan
    const todayStr = new Date().toISOString().split('T')[0];
    
    const todaySalesData = salesList.filter(s => {
      if (!s.created_at) return false;
      // Konversi ke string jika s.created_at adalah objek Date dari Postgres
      const createdAtStr = s.created_at instanceof Date ? s.created_at.toISOString() : String(s.created_at);
      return createdAtStr.startsWith(todayStr);
    });

    const totalSalesByDay = todaySalesData.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
    const qrisSalesByDay = todaySalesData
      .filter(s => s.payment_method === 'QRIS')
      .reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
    const cashSalesByDay = todaySalesData
      .filter(s => s.payment_method === 'CASH')
      .reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
    const totalItemsSoldByDay = todaySalesData.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const totalTransactionsByDay = todaySalesData.length;

    // 3. DAILY EXPENSES
    const dailyExpense = movements
      .filter(m => {
        const createdAtStr = m.created_at instanceof Date ? m.created_at.toISOString() : String(m.created_at);
        return m.type === 'IN' && createdAtStr.startsWith(todayStr);
      })
      .reduce((sum, m) => {
        if (m.total_price && Number(m.total_price) > 0) {
          return sum + Number(m.total_price);
        }
        const ing = ingredients.find(i => i.id === m.ingredient_id);
        if (ing) {
          const costPerUnit = Number(ing.unit_price) || ESTIMATED_UNIT_COSTS[ing.name.toLowerCase()] || 30;
          return sum + (Number(m.amount) * costPerUnit);
        }
        return sum;
      }, 0);

    // 4. CATEGORY DISTRIBUTION
    const categoryMap: Record<string, number> = {};
    ingredients.forEach(i => {
      const cat = i.category || 'Lainnya';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

    // 5. SALES TREND (LAST 7 DAYS)
    const salesTrendMap: Record<string, number> = {};
    salesList.forEach(s => {
      if (!s.created_at) return;
      const createdAtStr = s.created_at instanceof Date ? s.created_at.toISOString() : String(s.created_at);
      const d = createdAtStr.split('T')[0];
      salesTrendMap[d] = (salesTrendMap[d] || 0) + (Number(s.total_price) || 0);
    });
    const sortedDates = Object.keys(salesTrendMap).sort().slice(-7);
    const salesTrend = sortedDates.map(date => ({ date, amount: salesTrendMap[date] }));

    // 6. USAGE TREND (BY MENU)
    const usageTrendMap: Record<string, Record<string, number>> = {};
    salesList.forEach(s => {
      if (!s.created_at) return;
      const createdAtStr = s.created_at instanceof Date ? s.created_at.toISOString() : String(s.created_at);
      const d = createdAtStr.split('T')[0];
      if (!usageTrendMap[d]) usageTrendMap[d] = {};
      usageTrendMap[d][s.menu_name] = (usageTrendMap[d][s.menu_name] || 0) + (Number(s.quantity) || 0);
    });
    const usageTrend: any[] = [];
    Object.entries(usageTrendMap).forEach(([date, menus]) => {
      Object.entries(menus).forEach(([menu, quantity]) => {
        usageTrend.push({ date, menu, quantity });
      });
    });

    res.json({
      totalValue,
      totalItems,
      totalSalesByDay,
      qrisSalesByDay,
      cashSalesByDay,
      totalItemsSoldByDay,
      totalTransactionsByDay,
      criticalStockItems,
      categoryDistribution,
      salesTrend,
      usageTrend,
      dailyExpense
    });

  } catch (err: any) {
    console.error('Stats Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;