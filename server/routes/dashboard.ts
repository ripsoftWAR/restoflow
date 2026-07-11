import { Router } from 'express';
import db from '../db/database';
import { getIngredientEstimatedCost } from '../utils/costHelper';
import { requireAuth } from '../utils/authMiddleware';

const router = Router();

// GET /stats — dashboard statistics untuk semua role terautentikasi
// Data sudah di-scope otomatis berdasarkan restaurant_id dari JWT
router.get('/stats', requireAuth, async (req, res) => {
  const restaurantId = req.user!.restaurant_id;

  // ── DATE FILTER (query param) ──
  const period = req.query.period as string | undefined;
  const startDateRaw = req.query.start_date as string | undefined;
  const endDateRaw   = req.query.end_date   as string | undefined;

  let salesDateCondition: string;
  let movementDateCondition: string;
  let trendCondition: string;
  const dateParams: any[] = [];

  if (startDateRaw && endDateRaw) {
    salesDateCondition    = 'AND created_at::date BETWEEN $2::date AND $3::date';
    movementDateCondition = 'AND m.created_at::date BETWEEN $2::date AND $3::date';
    trendCondition        = 'AND created_at >= $2::date AND created_at <= $3::date';
    dateParams.push(startDateRaw, endDateRaw);
  } else if (period === '7days') {
    salesDateCondition    = "AND created_at::date BETWEEN CURRENT_DATE - INTERVAL '6 days' AND CURRENT_DATE";
    movementDateCondition = "AND m.created_at::date BETWEEN CURRENT_DATE - INTERVAL '6 days' AND CURRENT_DATE";
    trendCondition        = "AND created_at >= CURRENT_DATE - INTERVAL '6 days'";
  } else if (period === '30days') {
    salesDateCondition    = "AND created_at::date BETWEEN CURRENT_DATE - INTERVAL '29 days' AND CURRENT_DATE";
    movementDateCondition = "AND m.created_at::date BETWEEN CURRENT_DATE - INTERVAL '29 days' AND CURRENT_DATE";
    trendCondition        = "AND created_at >= CURRENT_DATE - INTERVAL '29 days'";
  } else {
    // default: hari ini
    salesDateCondition    = 'AND created_at::date = CURRENT_DATE';
    movementDateCondition = 'AND m.created_at::date = CURRENT_DATE';
    trendCondition        = "AND created_at >= CURRENT_DATE - INTERVAL '6 days'";
  }

  try {
    // Fetch ingredients untuk perhitungan stok + kategori
    const ingRes = await db.query(
      'SELECT * FROM ingredients WHERE restaurant_id = $1', [restaurantId]
    );
    const ingredients = ingRes.rows;

    // ── 1. STOCK METRICS ──
    let totalValue = 0;
    const criticalStockList: any[] = [];

    ingredients.forEach(ing => {
      totalValue += getIngredientEstimatedCost(ing);
      if (Number(ing.stock) <= (Number(ing.min_stock) || 0)) {
        criticalStockList.push(ing);
      }
    });

    const criticalStockItems = {
      count: criticalStockList.length,
      items: criticalStockList
    };
    const totalItems = ingredients.length;

    // ── 2. DAILY SALES (TODAY — pakai SQL untuk akurasi timezone) ──
    const todayResult = await db.query(
      `SELECT 
         COALESCE(SUM(total_price), 0)::float as total_sales,
         COALESCE(SUM(CASE WHEN payment_method = 'QRIS' THEN total_price ELSE 0 END), 0)::float as qris_sales,
         COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total_price ELSE 0 END), 0)::float as cash_sales,
         COALESCE(SUM(quantity), 0)::int as total_items_sold,
         COUNT(*)::int as total_transactions
       FROM sales 
       WHERE restaurant_id = $1 
         ${salesDateCondition}`,
      [restaurantId, ...dateParams]
    );

    const today = todayResult.rows[0];
    const totalSalesByDay = today.total_sales || 0;
    const qrisSalesByDay = today.qris_sales || 0;
    const cashSalesByDay = today.cash_sales || 0;
    const totalItemsSoldByDay = today.total_items_sold || 0;
    const totalTransactionsByDay = today.total_transactions || 0;

    // ── 3. DAILY EXPENSES (movement IN hari ini) ──
    const expenseResult = await db.query(
      `SELECT COALESCE(SUM(
        CASE 
          WHEN m.total_price IS NOT NULL AND m.total_price > 0 THEN m.total_price
          ELSE COALESCE(i.unit_price, 0) / NULLIF(i.conversion_factor, 0) * m.amount
        END
      ), 0)::float as daily_expense
       FROM movement_log m
       LEFT JOIN ingredients i ON i.id = m.ingredient_id AND i.restaurant_id = m.restaurant_id
       WHERE m.restaurant_id = $1 
         AND m.type = 'IN' 
         ${movementDateCondition}`,
      [restaurantId, ...dateParams]
    );
    const dailyExpense = expenseResult.rows[0].daily_expense || 0;

    // ── 4. CATEGORY DISTRIBUTION ──
    const categoryMap: Record<string, number> = {};
    ingredients.forEach(i => {
      const cat = i.category || 'Lainnya';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

    // ── 5. SALES TREND (last 7 days via SQL) ──
    const trendResult = await db.query(
      `SELECT created_at::date as date, 
              COALESCE(SUM(total_price), 0)::float as amount
       FROM sales 
       WHERE restaurant_id = $1 
         ${trendCondition}
       GROUP BY created_at::date
       ORDER BY date`,
      [restaurantId, ...dateParams]
    );
    const salesTrend = trendResult.rows;

    // ── 6. USAGE TREND (by menu, last 7 days) ──
    const usageResult = await db.query(
      `SELECT created_at::date as date, menu_name as menu, 
              COALESCE(SUM(quantity), 0)::int as quantity
       FROM sales 
       WHERE restaurant_id = $1 
         ${trendCondition}
       GROUP BY created_at::date, menu_name
       ORDER BY date`,
      [restaurantId, ...dateParams]
    );
    const usageTrend = usageResult.rows;

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
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;