import { Router, Request, Response } from 'express';
import db from '../db/database';
import { findMappedIngredient, convertToUnit } from '../utils/conversion';
import { requireAuth } from '../utils/authMiddleware';
import { hasColumn } from '../utils/dbHelpers';

const router = Router();

// ── Helper: build ingredient insert query ──────────────────────
const buildIngredientInsertQuery = async (restaurantId: number, name: string, category: string | null, supplier: string, stock: number, baseUnit: string, minStock: number, unitPrice: number) => {
  const hasCategory = await hasColumn('ingredients', 'category');
  const columns = ['restaurant_id', 'name', 'supplier', 'stock', 'base_unit', 'min_stock', 'unit_price'];
  const values: any[] = [restaurantId, name, supplier, stock, baseUnit, minStock, unitPrice];
  if (hasCategory) {
    columns.splice(2, 0, 'category');
    values.splice(2, 0, category || 'Bahan Pokok');
  }
  const placeholders = values.map((_, i) => `$${i + 1}`);
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

// ── Tool definitions untuk Claude ─────────────────────────────
const TOOLS = [
  {
    name: 'get_ingredients',
    description: 'Ambil daftar semua bahan baku restoran beserta stok saat ini',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_sales_summary',
    description: 'Ambil ringkasan penjualan berdasarkan rentang waktu',
    input_schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', '7days', '30days', 'all'],
          description: 'Periode data: today=hari ini, 7days=7 hari terakhir, 30days=30 hari terakhir, all=semua'
        }
      },
      required: ['period']
    }
  },
  {
    name: 'get_payment_summary',
    description: 'Ambil ringkasan pembayaran CASH vs QRIS vs Transfer',
    input_schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', '7days', '30days', 'all'],
          description: 'Periode data'
        }
      },
      required: ['period']
    }
  },
  {
    name: 'get_low_stock',
    description: 'Ambil daftar bahan yang stoknya di bawah minimum (kritis)',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_recipes',
    description: 'Ambil daftar resep dan menu aktif restoran',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'restock_ingredient',
    description: 'Tambah stok bahan baku ke database',
    input_schema: {
      type: 'object',
      properties: {
        ingredient_name: { type: 'string', description: 'Nama bahan' },
        amount: { type: 'number', description: 'Jumlah yang ditambah' },
        unit: { type: 'string', description: 'Satuan: kg, g, gram, liter, l, ml, pcs' },
        unit_price: { type: 'number', description: 'Total harga beli dalam Rupiah (opsional)' }
      },
      required: ['ingredient_name', 'amount', 'unit']
    }
  },
  {
    name: 'create_recipe',
    description: 'Buat resep menu baru di database',
    input_schema: {
      type: 'object',
      properties: {
        menu_name: { type: 'string', description: 'Nama menu' },
        category: { type: 'string', description: 'Kategori: Makanan atau Minuman' },
        items: {
          type: 'array',
          description: 'Daftar bahan resep',
          items: {
            type: 'object',
            properties: {
              ingredient_name: { type: 'string' },
              amount: { type: 'number' }
            }
          }
        }
      },
      required: ['menu_name', 'category', 'items']
    }
  }
];

// ── Tool executor ──────────────────────────────────────────────
const executeTool = async (toolName: string, toolInput: any, restaurantId: number): Promise<{ result: string; actions: any[] }> => {
  const actions: any[] = [];

  try {
    if (toolName === 'get_ingredients') {
      const res = await selectIngredientsForRestaurant(restaurantId);
      const rows = res.rows;
      if (!rows.length) return { result: 'Belum ada bahan baku terdaftar.', actions };
      const list = rows.map(i =>
        `- ${i.name}: stok ${i.stock} ${i.base_unit}, min ${i.min_stock} ${i.base_unit}, status ${Number(i.stock) <= Number(i.min_stock) ? 'KRITIS' : 'Aman'}`
      ).join('\n');
      return { result: `${rows.length} bahan baku:\n${list}`, actions };
    }

    if (toolName === 'get_sales_summary') {
      const period = toolInput.period || '7days';
      const intervalMap: Record<string, string> = {
        today: "created_at::date = CURRENT_DATE",
        '7days': "created_at >= NOW() - INTERVAL '7 days'",
        '30days': "created_at >= NOW() - INTERVAL '30 days'",
        all: '1=1'
      };
      const where = intervalMap[period] || intervalMap['7days'];
      const res = await db.query(
        `SELECT menu_name, SUM(quantity) as total_qty, SUM(total_price) as revenue
         FROM sales WHERE restaurant_id = $1 AND ${where}
         GROUP BY menu_name ORDER BY revenue DESC LIMIT 15`,
        [restaurantId]
      );
      if (!res.rows.length) return { result: `Tidak ada data penjualan untuk periode ${period}.`, actions };
      const totalOmset = res.rows.reduce((s: number, r: any) => s + Number(r.revenue), 0);
      const totalQty = res.rows.reduce((s: number, r: any) => s + Number(r.total_qty), 0);
      const list = res.rows.map((r: any) => `- ${r.menu_name}: ${r.total_qty} porsi, Rp ${Number(r.revenue).toLocaleString()}`).join('\n');
      return {
        result: `Penjualan (${period}):\nTotal omset: Rp ${totalOmset.toLocaleString()}\nTotal porsi: ${totalQty}\n\nPer menu:\n${list}`,
        actions
      };
    }

    if (toolName === 'get_payment_summary') {
      const period = toolInput.period || '7days';
      const intervalMap: Record<string, string> = {
        today: "created_at::date = CURRENT_DATE",
        '7days': "created_at >= NOW() - INTERVAL '7 days'",
        '30days': "created_at >= NOW() - INTERVAL '30 days'",
        all: '1=1'
      };
      const where = intervalMap[period] || intervalMap['7days'];
      const res = await db.query(
        `SELECT payment_method, COUNT(*) as count, SUM(total_price) as revenue
         FROM sales WHERE restaurant_id = $1 AND ${where}
         GROUP BY payment_method ORDER BY revenue DESC`,
        [restaurantId]
      );
      if (!res.rows.length) return { result: `Tidak ada data pembayaran untuk periode ${period}.`, actions };
      const list = res.rows.map((r: any) => `- ${r.payment_method}: ${r.count} transaksi, Rp ${Number(r.revenue).toLocaleString()}`).join('\n');
      return { result: `Pembayaran (${period}):\n${list}`, actions };
    }

    if (toolName === 'get_low_stock') {
      const res = await selectIngredientsForRestaurant(restaurantId);
      const low = res.rows.filter(i => Number(i.stock) <= Number(i.min_stock));
      if (!low.length) return { result: 'Semua stok aman, tidak ada yang kritis.', actions };
      const list = low.map(i => `- ${i.name}: sisa ${i.stock} ${i.base_unit} (min ${i.min_stock} ${i.base_unit})`).join('\n');
      return { result: `${low.length} bahan kritis:\n${list}`, actions };
    }

    if (toolName === 'get_recipes') {
      const res = await db.query(
        `SELECT r.menu_name, r.category, i.name as ingredient_name, r.amount, i.base_unit
         FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
         WHERE r.restaurant_id = $1 ORDER BY r.menu_name`,
        [restaurantId]
      );
      if (!res.rows.length) return { result: 'Belum ada resep terdaftar.', actions };
      const grouped: Record<string, string[]> = {};
      res.rows.forEach((r: any) => {
        if (!grouped[r.menu_name]) grouped[r.menu_name] = [];
        grouped[r.menu_name].push(`${r.ingredient_name} ${r.amount} ${r.base_unit}`);
      });
      const list = Object.entries(grouped).map(([menu, items]) => `- ${menu}: ${items.join(', ')}`).join('\n');
      return { result: `${Object.keys(grouped).length} resep aktif:\n${list}`, actions };
    }

    if (toolName === 'restock_ingredient') {
      const { ingredient_name, amount, unit, unit_price = 0 } = toolInput;
      const ingRes = await selectIngredientsForRestaurant(restaurantId);
      const ingredientsList = ingRes.rows;
      const mappedId = findMappedIngredient(ingredient_name, ingredientsList);

      if (mappedId) {
        const ing = ingredientsList.find(i => i.id === mappedId);
        const converted = convertToUnit(amount, unit, ing.base_unit);
        const nextStock = Number(ing.stock) + converted;
        const pricePerBaseUnit = unit_price ? (unit_price / converted) : (ing.unit_price || 0);

        await db.query(
          'UPDATE ingredients SET stock = $1, unit_price = $2 WHERE id = $3 AND restaurant_id = $4',
          [nextStock, pricePerBaseUnit, mappedId, restaurantId]
        );
        await db.query(
          `INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes, unit_price, total_price)
           VALUES ($1, $2, 'IN', $3, $4, $5, $6, $7)`,
          [restaurantId, mappedId, converted, nextStock, `Restock via AI: ${amount} ${unit}`, pricePerBaseUnit, unit_price]
        );
        actions.push({ type: 'REFRESH_DATA' });
        return { result: `Stok ${ing.name} berhasil ditambah ${amount} ${unit}. Stok baru: ${nextStock} ${ing.base_unit}.`, actions };
      } else {
        // Auto-provision bahan baru
        const lowUnit = (unit || '').toLowerCase();
        const baseUnit = ['liter', 'l', 'ml'].includes(lowUnit) ? 'ml' : 'gram';
        const converted = convertToUnit(amount, unit, baseUnit);
        const pricePerBaseUnit = unit_price ? (unit_price / converted) : 0;
        const insertQuery = await buildIngredientInsertQuery(restaurantId, ingredient_name, 'Bahan Pokok', 'AI Auto', converted, baseUnit, 0, pricePerBaseUnit);
        const insertRes = await db.query(insertQuery.text, insertQuery.values);
        const newId = insertRes.rows[0].id;
        await db.query(
          `INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes, unit_price, total_price)
           VALUES ($1, $2, 'IN', $3, $4, $5, $6, $7)`,
          [restaurantId, newId, converted, converted, `Bahan baru + restock via AI: ${amount} ${unit}`, pricePerBaseUnit, unit_price]
        );
        actions.push({ type: 'REFRESH_DATA' });
        return { result: `Bahan baru "${ingredient_name}" ditambahkan ke database dengan stok ${amount} ${unit}.`, actions };
      }
    }

    if (toolName === 'create_recipe') {
      const { menu_name, category, items } = toolInput;
      const ingRes = await selectIngredientsForRestaurant(restaurantId);
      const ingredientsList = ingRes.rows;

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
      actions.push({ type: 'REFRESH_DATA' });
      return { result: `Resep "${menu_name}" (${category}) berhasil disimpan dengan ${items.length} bahan.`, actions };
    }

    return { result: `Tool "${toolName}" tidak dikenali.`, actions };
  } catch (err: any) {
    console.error(`Tool ${toolName} error:`, err);
    return { result: `Gagal eksekusi ${toolName}: ${err.message}`, actions };
  }
};

// ── Main route ─────────────────────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurant_id;
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message payload is required' });

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];

  const SYSTEM_PROMPT = `Kamu adalah AI Asisten Manajer Restoran untuk aplikasi RestoFlow. Jawab dalam Bahasa Indonesia yang ramah dan profesional.

Hari ini: ${today} (${todayISO})

Kamu punya akses ke database restoran melalui tools. SELALU gunakan tools untuk mendapatkan data terbaru sebelum menjawab — jangan mengarang data.

Panduan penggunaan tools:
- Pertanyaan stok/bahan → get_ingredients atau get_low_stock
- Pertanyaan penjualan/omset → get_sales_summary (pilih period yang sesuai)
- Pertanyaan pembayaran → get_payment_summary
- Pertanyaan resep/menu → get_recipes
- Perintah tambah stok → restock_ingredient
- Perintah buat resep → create_recipe

Untuk pertanyaan "hari ini" gunakan period: "today", "minggu ini" gunakan "7days", dst.`;

  // ── Offline fallback (tanpa API key) ──────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    try {
      const ingRes = await selectIngredientsForRestaurant(restaurantId);
      const ingredientsList = ingRes.rows;
      const msgLow = message.toLowerCase();
      let replyText = '';
      const clientActionsToTrigger: any[] = [];

      if (msgLow.includes('tambah') || msgLow.includes('restock') || msgLow.includes('isi stok')) {
        const match = message.match(/(?:tambah|tambahkan|isi|restock)\s+stoc?k?\s+([a-zA-Z\s]+?)\s+(?:sebanyak\s+)?(\d+(?:\.\d+)?)\s*(kg|g|gram|liter|l|ml|pcs|butir)/i);
        if (match) {
          const { result, actions } = await executeTool('restock_ingredient', {
            ingredient_name: match[1].trim(),
            amount: parseFloat(match[2]),
            unit: match[3].trim(),
            unit_price: 0
          }, restaurantId);
          replyText = result;
          clientActionsToTrigger.push(...actions);
        } else {
          replyText = 'Format tidak dikenali. Coba: *"tambah stock Cabai Merah sebanyak 2 kg"*';
        }
      } else if (msgLow.includes('kritis') || msgLow.includes('hampir habis') || msgLow.includes('stok lemah')) {
        const { result } = await executeTool('get_low_stock', {}, restaurantId);
        replyText = result;
      } else if (msgLow.includes('pembayaran') || msgLow.includes('cash') || msgLow.includes('qris')) {
        const { result } = await executeTool('get_payment_summary', { period: '7days' }, restaurantId);
        replyText = result;
      } else if (msgLow.includes('penjualan') || msgLow.includes('omset')) {
        const period = msgLow.includes('hari ini') ? 'today' : msgLow.includes('30') ? '30days' : '7days';
        const { result } = await executeTool('get_sales_summary', { period }, restaurantId);
        replyText = result;
      } else {
        const { result } = await executeTool('get_ingredients', {}, restaurantId);
        replyText = `Halo! Saya AI Asisten RestoFlow.\n\n${result}\n\nContoh perintah:\n- *"tambah stock Beras 5kg"*\n- *"bahan apa yang kritis?"*\n- *"penjualan hari ini"*`;
      }

      return res.json({ text: replyText, actions: clientActionsToTrigger });
    } catch (err: any) {
      return res.json({ text: `Error offline mode: ${err.message}`, actions: [] });
    }
  }

  // ── Claude Tool Calling ────────────────────────────────────────
  try {
    const trimmedHistory = (history || []).slice(-6);
    let messages: any[] = [
      ...trimmedHistory.map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.text
      })),
      { role: 'user', content: message }
    ];

    const allClientActions: any[] = [];
    let finalText = '';

    // Agentic loop — max 5 iterasi
    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages
        })
      });

      const data = await response.json() as any;

      if (!response.ok) {
        console.warn('Claude API error:', data?.error?.message);
        return res.json({ text: '*(Mode offline aktif)* Maaf, terjadi kendala koneksi ke AI.', actions: [] });
      }

      // Kalau stop_reason = end_turn → Claude selesai jawab
      if (data.stop_reason === 'end_turn') {
        finalText = data.content
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('\n')
          .trim();
        break;
      }

      // Kalau stop_reason = tool_use → eksekusi tools
      if (data.stop_reason === 'tool_use') {
        const toolUseBlocks = data.content.filter((b: any) => b.type === 'tool_use');
        const toolResultContents: any[] = [];

        for (const toolUse of toolUseBlocks) {
          console.log(`🔧 Tool call: ${toolUse.name}`, toolUse.input);
          const { result, actions } = await executeTool(toolUse.name, toolUse.input, restaurantId);
          allClientActions.push(...actions);
          toolResultContents.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result
          });
        }

        // Tambah assistant response + tool results ke messages
        messages = [
          ...messages,
          { role: 'assistant', content: data.content },
          { role: 'user', content: toolResultContents }
        ];

        continue; // lanjut iterasi berikutnya
      }

      // Fallback kalau stop reason lain
      finalText = data.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n')
        .trim();
      break;
    }

    return res.json({
      text: finalText || 'Maaf, tidak ada respons dari AI.',
      actions: allClientActions
    });

  } catch (err: any) {
    console.error('Claude Chat error:', err);
    return res.json({ text: '*(Terjadi kendala koneksi)* Silakan coba lagi.', actions: [] });
  }
});

export default router;