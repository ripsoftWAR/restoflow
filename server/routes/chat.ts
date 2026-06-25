import { Router, Request, Response } from 'express';
import db from '../db/database';
import { findMappedIngredient, convertToUnit } from '../utils/conversion';
import { requireAuth } from '../utils/authMiddleware';
import { hasColumn } from '../utils/dbHelpers';

const router = Router();

const buildIngredientInsertQuery = async (restaurantId: number, name: string, category: string | null, supplier: string, stock: number, baseUnit: string, minStock: number, unitPrice: number) => {
  const hasCategory = await hasColumn('ingredients', 'category');
  const columns = ['restaurant_id', 'name', 'supplier', 'stock', 'base_unit', 'min_stock', 'unit_price'];
  const values: any[] = [restaurantId, name, supplier, stock, baseUnit, minStock, unitPrice];
  if (hasCategory) {
    columns.splice(2, 0, 'category');
    values.splice(2, 0, category || 'Bahan Pokok');
  }
  const placeholders = values.map((_, index) => `$${index + 1}`);
  return {
    text: `INSERT INTO ingredients (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
    values,
  };
};

const selectIngredientsForRestaurant = async (restaurantId: number) => {
  const hasCategory = await hasColumn('ingredients', 'category');
  const columns = ['id', 'name', 'stock', 'base_unit', 'min_stock', 'supplier', 'unit_price'];
  if (hasCategory) columns.splice(1, 0, 'category');
  return db.query(`SELECT ${columns.join(', ')} FROM ingredients WHERE restaurant_id = $1`, [restaurantId]);
};

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurant_id;
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message payload is required" });
  console.log("MSG SIZE:", JSON.stringify(message).length, "HISTORY SIZE:", JSON.stringify(history||[]).length, "HISTORY LEN:", (history||[]).length);

  let ingredientsList: any[] = [];
  let recipesList: any[] = [];
  let salesSummary: any[] = [];
  let salesList: any[] = [];
  let paymentSummary: any[] = [];

  try {
    const ingRes = await selectIngredientsForRestaurant(restaurantId);
    ingredientsList = ingRes.rows;

    const recRes = await db.query(`
      SELECT r.menu_name, r.category, i.name as ingredient_name, r.amount, i.base_unit
      FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
      WHERE r.restaurant_id = $1
    `, [restaurantId]);
    recipesList = recRes.rows;

    const salesRes = await db.query(
      'SELECT menu_name, quantity, total_price, payment_method, created_at FROM sales WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 100',
      [restaurantId]
    );
    salesList = salesRes.rows;

    const summaryRes = await db.query(
      `SELECT menu_name, SUM(quantity) as total_qty, SUM(total_price) as revenue 
       FROM sales WHERE restaurant_id = $1 
       AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY menu_name ORDER BY revenue DESC LIMIT 10`,
      [restaurantId]
    );
    salesSummary = summaryRes.rows;

    const payRes = await db.query(
      `SELECT payment_method, COUNT(*) as count, SUM(total_price) as revenue 
       FROM sales WHERE restaurant_id = $1 
       AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY payment_method`,
      [restaurantId]
    );
    paymentSummary = payRes.rows;
  } catch (err: any) {
    console.error('Database pre-fetch failed:', err);
  }

  const snapshot = {
    ingredients: ingredientsList.map(i => ({
      id: i.id,
      name: i.name,
      stock: i.stock,
      base_unit: i.base_unit,
      min_stock: i.min_stock,
      unit_price: i.unit_price,
      status: i.stock <= i.min_stock ? 'KRITIS' : 'Aman'
    })),
    recipes: recipesList.reduce((acc: any, r: any) => {
      if (!acc[r.menu_name]) acc[r.menu_name] = { category: r.category, items: [] };
      acc[r.menu_name].items.push(`${r.ingredient_name}: ${r.amount} ${r.base_unit}`);
      return acc;
    }, {}),
    top_sales: salesSummary.map(s => `${s.menu_name}: ${s.total_qty} porsi, Rp ${Number(s.revenue).toLocaleString()}`),
    payment_summary: paymentSummary.map(p => `${p.payment_method}: ${p.count} tx, Rp ${Number(p.revenue).toLocaleString()}`),
  };

  const runSimulation = async (extraNotice: string = "") => {
    const msgLow = message.toLowerCase();
    let replyText = "";
    const clientActionsToTrigger: any[] = [];

    if (msgLow.includes('tambah stock') || msgLow.includes('restock') || msgLow.includes('tambahkan stock') || msgLow.includes('tambah stok') || msgLow.includes('isi stok')) {
      const match = message.match(/(?:tambah|tambahkan|isi|restock)\s+stoc?k?\s+([a-zA-Z\s]+?)\s+(?:sebanyak\s+)?(\d+(?:\.\d+)?)\s*(kg|g|gram|liter|l|ml|pcs|butir)/i);
      if (match) {
        const ingNameRaw = match[1].trim();
        const amount = parseFloat(match[2]);
        const unit = match[3].trim();
        const mappedId = findMappedIngredient(ingNameRaw, ingredientsList);
        if (mappedId) {
          const ing = ingredientsList.find(i => i.id === mappedId);
          const converted = convertToUnit(amount, unit, ing.base_unit);
          const nextStock = ing.stock + converted;
          await db.query('UPDATE ingredients SET stock = $1 WHERE id = $2 AND restaurant_id = $3', [nextStock, mappedId, restaurantId]);
          await db.query(
            `INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes) VALUES ($1, $2, 'IN', $3, $4, $5)`,
            [restaurantId, mappedId, converted, nextStock, `Restock via AI Chat (Offline): ${amount} ${unit}`]
          );
          replyText = `Stok **${ing.name}** berhasil ditambahkan:\n- Jumlah: +${amount} ${unit}\n- Stok baru: **${nextStock} ${ing.base_unit}**`;
          clientActionsToTrigger.push({ type: 'REFRESH_DATA' });
        } else {
          replyText = `Bahan "${ingNameRaw}" tidak ditemukan.`;
        }
      } else {
        replyText = `Format tidak dikenali. Coba: *"tambah stock Cabai Merah sebanyak 2 kg"*`;
      }
    } else if (msgLow.includes('cash') || msgLow.includes('qris') || msgLow.includes('pembayaran')) {
      const cashSales = salesList.filter(s => (s.payment_method || '').toUpperCase() === 'CASH');
      const qrisSales = salesList.filter(s => (s.payment_method || '').toUpperCase() === 'QRIS');
      const cashTotal = cashSales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
      const qrisTotal = qrisSales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
      replyText = `Status pembayaran:\n- CASH: ${cashSales.length} transaksi, Rp ${cashTotal.toLocaleString()}\n- QRIS: ${qrisSales.length} transaksi, Rp ${qrisTotal.toLocaleString()}`;
    } else if (msgLow.includes('hampir habis') || msgLow.includes('kritis') || msgLow.includes('stok lemah')) {
      const lowStocks = ingredientsList.filter(i => Number(i.stock) <= Number(i.min_stock));
      if (lowStocks.length > 0) {
        replyText = `Bahan kritis:\n${lowStocks.map(i => `- **${i.name}**: Sisa ${i.stock} ${i.base_unit}`).join('\n')}`;
      } else {
        replyText = `Semua stok aman (${ingredientsList.length} bahan dipantau).`;
      }
    } else {
      replyText = `Halo! Data saat ini:\n- Total bahan: ${ingredientsList.length} jenis\n- Bahan kritis: ${ingredientsList.filter(i => Number(i.stock) <= Number(i.min_stock)).length}\n- Menu aktif: ${Object.keys(snapshot.recipes).length} resep`;
    }

    if (extraNotice) replyText = `${extraNotice}\n\n${replyText}`;
    return res.json({ text: replyText, actions: clientActionsToTrigger });
  };

  if (!process.env.ANTHROPIC_API_KEY) return await runSimulation();

  try {
    const ingList = snapshot.ingredients.map(i => `- ${i.name}: ${i.stock} ${i.base_unit} (min ${i.min_stock}) [${i.status}]`).join('\n');
    const menuList = Object.keys(snapshot.recipes).join(', ');
    const topSales = snapshot.top_sales.join('\n');
    const payList = snapshot.payment_summary.join('\n');
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const todayISO = new Date().toISOString().split('T')[0];

    const systemPrompt = `Kamu adalah AI Asisten Manajer Restoran RestoFlow. Jawab dalam Bahasa Indonesia.

TANGGAL HARI INI: ${today} (${todayISO})
Data penjualan = 7 hari terakhir (bukan akumulatif).

INGREDIENTS (${snapshot.ingredients.length} bahan):
${ingList}

MENU AKTIF: ${menuList}

TOP PENJUALAN:
${topSales}

PAYMENT:
${payList}

ATURAN:
1. Restock → sertakan <action>{"type":"RESTOCK","ingredient_name":"...","amount":1000,"unit":"gram","unit_price":0}</action>
2. Buat resep → sertakan <action>{"type":"CREATE_RECIPE","menu_name":"...","category":"Makanan","items":[{"ingredient_name":"...","amount":20}]}</action>
3. Tanpa action tag = tidak ada yang berubah di database
4. unit_price = total harga beli dalam Rupiah`;

    const trimmedHistory = (history || []).slice(-4);
    const messages = [
      ...trimmedHistory.map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.text
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, system: systemPrompt, messages })
    });

    const data = await response.json() as any;
    if (!response.ok) {
      console.warn('Claude API error, falling back to offline:', data?.error?.message);
      return runSimulation('*(Mode cadangan aktif)*');
    }

    const fullText = data.content?.[0]?.text || '';
    const clientActionsToTrigger: any[] = [];
    const actionMatches = fullText.matchAll(/<action>(.*?)<\/action>/gs);

    for (const match of actionMatches) {
      try {
        const action = JSON.parse(match[1]);

        if (action.type === 'RESTOCK') {
          const { ingredient_name, amount, unit, unit_price } = action;
          const mappedId = findMappedIngredient(ingredient_name, ingredientsList);
          if (mappedId) {
            const ing = ingredientsList.find(i => i.id === mappedId);
            const converted = convertToUnit(amount, unit, ing.base_unit);
            const nextStock = ing.stock + converted;
            const pricePerBaseUnit = unit_price ? (unit_price / converted) : (ing.unit_price || 0);
            await db.query('UPDATE ingredients SET stock = $1, unit_price = $2 WHERE id = $3 AND restaurant_id = $4', [nextStock, pricePerBaseUnit, mappedId, restaurantId]);
            await db.query(
              `INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes, unit_price, total_price) VALUES ($1, $2, 'IN', $3, $4, $5, $6, $7)`,
              [restaurantId, mappedId, converted, nextStock, `Restock via AI: ${amount} ${unit}`, pricePerBaseUnit, unit_price || 0]
            );
          } else {
            const lowUnit = (unit || '').toLowerCase();
            const baseUnit = (lowUnit === 'liter' || lowUnit === 'l' || lowUnit === 'ml') ? 'ml' : 'gram';
            const converted = convertToUnit(amount, unit, baseUnit);
            const pricePerBaseUnit = unit_price ? (unit_price / converted) : 0;
            const insertQuery = await buildIngredientInsertQuery(restaurantId, ingredient_name, 'Bahan Pokok', 'AI Auto', 0, baseUnit, 0, pricePerBaseUnit);
            const insertRes = await db.query(insertQuery.text, insertQuery.values);
            const newId = insertRes.rows[0].id;
            await db.query('UPDATE ingredients SET stock = $1 WHERE id = $2', [converted, newId]);
            await db.query(
              `INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes, unit_price, total_price) VALUES ($1, $2, 'IN', $3, $4, $5, $6, $7)`,
              [restaurantId, newId, converted, converted, `Bahan baru + restock via AI: ${amount} ${unit}`, pricePerBaseUnit, unit_price || 0]
            );
          }
          clientActionsToTrigger.push({ type: 'REFRESH_DATA' });
        }

        if (action.type === 'CREATE_RECIPE') {
          const { menu_name, category, items } = action;
          await db.query('DELETE FROM recipes WHERE menu_name = $1 AND restaurant_id = $2', [menu_name, restaurantId]);
          for (const item of items) {
            let mappedId = findMappedIngredient(item.ingredient_name, ingredientsList);
            if (!mappedId) {
              const insertQuery = await buildIngredientInsertQuery(restaurantId, item.ingredient_name, 'Bahan Pokok', 'AI Chat', 0, 'gram', 0, 0);
              const insertIng = await db.query(insertQuery.text, insertQuery.values);
              mappedId = insertIng.rows[0].id;
            }
            await db.query(
              `INSERT INTO recipes (restaurant_id, menu_name, category, ingredient_id, amount) VALUES ($1, $2, $3, $4, $5)`,
              [restaurantId, menu_name, category || 'Makanan', mappedId, item.amount]
            );
          }
          clientActionsToTrigger.push({ type: 'REFRESH_DATA' });
        }
      } catch (e) {
        console.error('Action parse error:', e);
      }
    }

    const cleanText = fullText.replace(/<action>.*?<\/action>/gs, '').trim();
    return res.json({ text: cleanText, actions: clientActionsToTrigger });

  } catch (err: any) {
    console.error('Claude Chat error:', err);
    return runSimulation('*(Terjadi kendala koneksi)*');
  }
});

export default router;