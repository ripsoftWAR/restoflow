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

// POST /api/gemini/chat
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurant_id;
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message payload is required' });
  }

  let ingredientsList: any[] = [];
  let recipesList: any[] = [];
  let salesSummary: any[] = [];
  let salesList: any[] = [];
  let paymentSummary: any[] = [];
  let movementsList: any[] = [];

  try {
    // Tambahkan WHERE restaurant_id = $1 di setiap query
    const ingRes = await selectIngredientsForRestaurant(restaurantId);
    ingredientsList = ingRes.rows;

    const recRes = await db.query(`
      SELECT r.menu_name, r.category, i.name as ingredient_name, r.amount, i.base_unit
      FROM recipes r
      JOIN ingredients i ON r.ingredient_id = i.id
      WHERE r.restaurant_id = $1
    `, [restaurantId]);
    recipesList = recRes.rows;

    const salesRes = await db.query('SELECT id, menu_name, quantity, total_price, selected_options, payment_method, cash_paid, cash_change, created_at FROM sales WHERE restaurant_id = $1 ORDER BY created_at DESC', [restaurantId]);
    salesList = salesRes.rows;

    const summaryRes = await db.query('SELECT menu_name, SUM(quantity) as total_qty, SUM(total_price) as revenue FROM sales WHERE restaurant_id = $1 GROUP BY menu_name', [restaurantId]);
    salesSummary = summaryRes.rows;

    const payRes = await db.query('SELECT payment_method, COUNT(*) as count, SUM(total_price) as revenue FROM sales WHERE restaurant_id = $1 GROUP BY payment_method', [restaurantId]);
    paymentSummary = payRes.rows;

    const movRes = await db.query('SELECT id, ingredient_id, type, amount, balance, notes, created_at FROM movement_log WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 30', [restaurantId]);
    movementsList = movRes.rows;
  } catch (err: any) {
    console.error('Database pre-fetch failed:', err);
  }

  const snapshot = {
    ingredients: ingredientsList.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      stock: `${i.stock} ${i.base_unit}`,
      min_stock: `${i.min_stock} ${i.base_unit}`,
      supplier: i.supplier,
      unit_price: i.unit_price,
      status: i.stock <= i.min_stock ? 'LEMAH (Hampir Habis!)' : 'Aman'
    })),
    recipes: recipesList.reduce((acc: any, r: any) => {
      if (!acc[r.menu_name]) acc[r.menu_name] = { category: r.category, items: [] };
      acc[r.menu_name].items.push(`${r.ingredient_name}: ${r.amount} ${r.base_unit}`);
      return acc;
    }, {}),
    sales: salesList.map(s => ({
      id: s.id,
      menu_name: s.menu_name,
      quantity: s.quantity,
      total_price: s.total_price,
      selected_options: s.selected_options || '',
      payment_method: s.payment_method,
      cash_paid: s.cash_paid,
      cash_change: s.cash_change,
      created_at: s.created_at,
    })),
    payment_summary: paymentSummary.map(p => ({
      payment_method: p.payment_method,
      transaction_count: p.count,
      revenue: p.revenue,
    })),
    movements: movementsList,
    top_sales: salesSummary.map(s => `${s.menu_name}: terjual ${s.total_qty} porsi (Omset: Rp ${s.revenue.toLocaleString()})`),
  };

  // -----------------------------------------------------------
  // Offline simulation fallback
  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // Offline simulation fallback (Updated for PostgreSQL & SaaS)
  // -----------------------------------------------------------
  const runSimulation = async (extraNotice: string = "") => {
    const msgLow = message.toLowerCase();
    let replyText = "";
    const clientActionsToTrigger: any[] = [];

    // Logika RESTOCK / TAMBAH STOK
    if (msgLow.includes('tambah stock') || msgLow.includes('restock') || msgLow.includes('tambahkan stock') || msgLow.includes('tambah stok') || msgLow.includes('tambahkan stok') || msgLow.includes('isi stock') || msgLow.includes('isi stok')) {
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

          // UPDATE: PostgreSQL dengan filter restaurant_id
          await db.query(
            'UPDATE ingredients SET stock = $1 WHERE id = $2 AND restaurant_id = $3', 
            [nextStock, mappedId, restaurantId]
          );

          // INSERT: Log pergerakan stok dengan restaurant_id
          await db.query(
            `INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes) 
             VALUES ($1, $2, 'IN', $3, $4, $5)`,
            [restaurantId, mappedId, converted, nextStock, `Restock via AI Chat (Offline): ${amount} ${unit}`]
          );

          replyText = `Stok **${ing.name}** berhasil ditambahkan:\n- Jumlah: +${amount} ${unit} (${converted} ${ing.base_unit})\n- Stok baru: **${nextStock} ${ing.base_unit}**`;
          clientActionsToTrigger.push({ type: 'REFRESH_DATA' });
        } else {
          replyText = `Bahan "${ingNameRaw}" tidak ditemukan di master. Cek nama bahan di tab Master Stock.`;
        }
      } else {
        replyText = `Format tidak dikenali. Coba: *"tambah stock Cabai Merah sebanyak 2 kg"*`;
      }

    // Logika CEK PEMBAYARAN (CASH vs QRIS)
    } else if (msgLow.includes('cash') || msgLow.includes('qris') || msgLow.includes('pembayaran') || msgLow.includes('metode bayar') || msgLow.includes('payment')) {
      const cashSales = salesList.filter(s => (s.payment_method || '').toUpperCase() === 'CASH');
      const qrisSales = salesList.filter(s => (s.payment_method || '').toUpperCase() === 'QRIS');
      const cashTotal = cashSales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
      const qrisTotal = qrisSales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
      const formatIDR = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
      
      replyText = `Status pembayaran:\n- CASH: ${cashSales.length} transaksi, total omset ${formatIDR(cashTotal)}\n- QRIS: ${qrisSales.length} transaksi, total omset ${formatIDR(qrisTotal)}\n`;
      
      if (cashSales.length > 0) {
        replyText += `\nTransaksi CASH terakhir:\n${cashSales.slice(0, 3).map(s => `• ${s.menu_name} (${s.quantity} porsi) - ${formatIDR(s.total_price)}`).join('\n')}`;
      }

    // Logika CEK STOK LEMAH
    } else if (msgLow.includes('rekomendasi') || msgLow.includes('saran') || msgLow.includes('stok lemah') || msgLow.includes('hampir habis') || msgLow.includes('menipis')) {
      const lowStocks = ingredientsList.filter(i => Number(i.stock) <= Number(i.min_stock));
      if (lowStocks.length > 0) {
        const listStr = lowStocks.map(i => `- **${i.name}**: Sisa ${i.stock} ${i.base_unit} (min ${i.min_stock} ${i.base_unit})`).join('\n');
        replyText = `Bahan yang hampir habis:\n\n${listStr}\n\nSegera lakukan restock!`;
      } else {
        replyText = `Semua stok dalam kondisi **Aman** (${ingredientsList.length} bahan dipantau).`;
      }

    // Default Reply
    } else {
      replyText = `Halo! Saya AI Asisten **RestoFlow**.\n\nData saat ini:\n- Total bahan: ${ingredientsList.length} jenis\n- Bahan kritis: ${ingredientsList.filter(i => Number(i.stock) <= Number(i.min_stock)).length} bahan\n- Menu aktif: ${Object.keys(snapshot.recipes).length} resep\n\nContoh perintah:\n1. *"tambah stock Cabai Merah sebanyak 2 kg"*\n2. *"bahan apa yang hampir habis?"*`;
    }

    if (extraNotice) replyText = `${extraNotice}\n\n${replyText}`;
    return res.json({ text: replyText, actions: clientActionsToTrigger });
  };

  // PEMANGGILAN: Gunakan await karena fungsi di atas sekarang async
  if (!process.env.ANTHROPIC_API_KEY) {
    return await runSimulation();
  }

  // -----------------------------------------------------------
  // Real Claude API path
  // -----------------------------------------------------------
  try {
    const systemPrompt = `Kamu adalah AI Asisten Manajer Restoran untuk aplikasi RestoFlow.
Kamu punya akses langsung ke database restoran dan WAJIB mengeksekusi perintah operasional secara nyata.

Data restoran saat ini:
${JSON.stringify(snapshot, null, 2)}

CATATAN TAMBAHAN:
- AI boleh membaca seluruh data Inventory, Resep, Penjualan, dan Movement Log.
- AI WAJIB memperhatikan payment_method di penjualan: CASH atau QRIS.
- Untuk pertanyaan tentang pembayaran, jelaskan jumlah transaksi dan omset CASH vs QRIS jika tersedia.

ATURAN WAJIB - SANGAT PENTING:
1. Kalau user minta tambah/restock/isi stok bahan → WAJIB sertakan <action> RESTOCK untuk SETIAP bahan
2. Kalau user minta buat resep/menu baru → WAJIB sertakan <action> CREATE_RECIPE
3. Kalau kedua-duanya diminta → sertakan SEMUA action sekaligus
4. JANGAN hanya ngobrol tanpa action tag — itu tidak akan mengubah database
5. Selalu jawab dalam Bahasa Indonesia

FORMAT ACTION (wajib ditulis persis seperti ini, jangan ada spasi ekstra):
Restock 1 bahan: <action>{"type":"RESTOCK","ingredient_name":"Nama Bahan","amount":1000,"unit":"gram","unit_price":50}</action>
Buat resep: <action>{"type":"CREATE_RECIPE","menu_name":"Nama Menu","category":"Minuman","items":[{"ingredient_name":"Nama Bahan","amount":20}]}</action>

ATURAN HARGA (unit_price):
- unit_price = TOTAL harga pembelian dalam Rupiah (bukan per gram!)
- Contoh: user bilang "1kg harga 50rb" → unit_price: 50000, amount: 1000, unit: "gram"
- Contoh: user bilang "2 liter harga 36rb" → unit_price: 36000, amount: 2, unit: "liter"
- Kalau user tidak sebut harga → unit_price: 0

CONTOH BENAR:
User: "tambah stock kopi bubuk 1kg harga 50rb"
Response: Menambahkan stok Kopi Bubuk... <action>{"type":"RESTOCK","ingredient_name":"Kopi Bubuk","amount":1000,"unit":"gram","unit_price":50000}</action>

User: "tambah stock kopi 1kg harga 50rb dan gula aren 1kg harga 40rb"
Response: Menambahkan kedua bahan... <action>{"type":"RESTOCK","ingredient_name":"Kopi Bubuk","amount":1000,"unit":"gram","unit_price":50000}</action> <action>{"type":"RESTOCK","ingredient_name":"Gula Aren","amount":1000,"unit":"gram","unit_price":40000}</action>

INGAT: Tanpa action tag = tidak ada yang terjadi di database!`;

    const messages = [
      ...(history || []).map((h: any) => ({
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
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json() as any;

    if (!response.ok) {
      const errMsg = data?.error?.message || 'Claude API error';
      console.warn('Claude API error, falling back to offline:', errMsg);
      return runSimulation('*(Mode cadangan offline aktif)*');
    }

    const fullText = data.content?.[0]?.text || '';
    const clientActionsToTrigger: any[] = [];

    // Parse <action> tags and execute them
    // Parse <action> tags and execute them (Updated for PostgreSQL)
    const actionMatches = fullText.matchAll(/<action>(.*?)<\/action>/gs);
    for (const match of actionMatches) {
      try {
        const action = JSON.parse(match[1]);

        // --- ACTION 1: RESTOCK ---
        if (action.type === 'RESTOCK') {
          const { ingredient_name, amount, unit, unit_price, total_price } = action;
          const mappedId = findMappedIngredient(ingredient_name, ingredientsList);

          if (mappedId) {
            const ing = ingredientsList.find(i => i.id === mappedId);
            const converted = convertToUnit(amount, unit, ing.base_unit);
            const nextStock = ing.stock + converted;
            const pricePerBaseUnit = unit_price ? (unit_price / converted) : (ing.unit_price || 0);
            const totalPriceValue = total_price || (unit_price || 0);

            // GANTI db.prepare().run() dengan await db.query()
            await db.query(
              'UPDATE ingredients SET stock = $1, unit_price = $2 WHERE id = $3 AND restaurant_id = $4',
              [nextStock, pricePerBaseUnit, mappedId, restaurantId]
            );

            await db.query(
              `INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes, unit_price, total_price) 
               VALUES ($1, $2, 'IN', $3, $4, $5, $6, $7)`,
              [
                restaurantId, mappedId, converted, nextStock, 
                `Restock via AI Chat: ${amount} ${unit} @Rp ${(unit_price || 0).toLocaleString()}`,
                pricePerBaseUnit, totalPriceValue
              ]
            );
          } else {
            // Auto-provision bahan baru jika tidak ditemukan
            const lowUnit = (unit || '').toLowerCase();
            const baseUnit = (lowUnit === 'liter' || lowUnit === 'l' || lowUnit === 'ml') ? 'ml' : 'gram';
            const converted = convertToUnit(amount, unit, baseUnit);
            const pricePerBaseUnit = unit_price ? (unit_price / converted) : 0;

            const insertQuery = await buildIngredientInsertQuery(
              restaurantId,
              ingredient_name,
              'Bahan Pokok',
              'AI Chat Auto-Provision',
              0,
              baseUnit,
              0,
              pricePerBaseUnit
            );
            const insertRes = await db.query(insertQuery.text, insertQuery.values);
            const newId = insertRes.rows[0].id;
            await db.query('UPDATE ingredients SET stock = $1 WHERE id = $2', [converted, newId]);
            
            await db.query(
              `INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes, unit_price, total_price) 
               VALUES ($1, $2, 'IN', $3, $4, $5, $6, $7)`,
              [
                restaurantId, newId, converted, converted, 
                `Bahan baru + restock via AI Chat: ${amount} ${unit}`,
                pricePerBaseUnit, unit_price || 0
              ]
            );
          }
          clientActionsToTrigger.push({ type: 'REFRESH_DATA' });
        }

        // --- ACTION 2: CREATE_RECIPE ---
        if (action.type === 'CREATE_RECIPE') {
          const { menu_name, category, items } = action;
          
          // Hapus resep lama milik restoran ini
          await db.query('DELETE FROM recipes WHERE menu_name = $1 AND restaurant_id = $2', [menu_name, restaurantId]);
          
          for (const item of items) {
            let mappedId = findMappedIngredient(item.ingredient_name, ingredientsList);
            if (!mappedId) {
              const insertQuery = await buildIngredientInsertQuery(
                restaurantId,
                item.ingredient_name,
                'Bahan Pokok',
                'AI Chat',
                0,
                'gram',
                0,
                0
              );
              const insertIng = await db.query(insertQuery.text, insertQuery.values);
              mappedId = insertIng.rows[0].id;
            }
            await db.query(
              `INSERT INTO recipes (restaurant_id, menu_name, category, ingredient_id, amount) 
               VALUES ($1, $2, $3, $4, $5)`,
              [restaurantId, menu_name, category || 'Makanan', mappedId, item.amount]
            );
          }
          clientActionsToTrigger.push({ type: 'REFRESH_DATA' });
        }
      } catch (e) {
        console.error('Action parse/execution error:', e);
      }
    }

    // Remove <action> tags from displayed text
    const cleanText = fullText.replace(/<action>.*?<\/action>/gs, '').trim();

    return res.json({ text: cleanText, actions: clientActionsToTrigger });

  } catch (err: any) {
    console.error('Claude Chat error:', err);
    return runSimulation('*(Terjadi kendala koneksi, mode offline aktif)*');
  }
});

export default router;
