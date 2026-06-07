import { Router } from 'express';
import db from '../db/database';
import { findMappedIngredient, convertToBaseUnit } from '../utils/conversion';
import { requireAuth, requireRole } from '../utils/authMiddleware';

const router = Router();
// Tambahkan requireAuth agar bisa mengambil restaurant_id
router.use(requireAuth); 
router.use(requireRole('Kasir', 'Pemilik'));

// POST scan receipt image via Claude Haiku OCR
router.post('/scan', async (req, res) => {
  const restaurantId = req.user!.restaurant_id; // Ambil ID Restoran
  const { base64, mimeType } = req.body;
  
  if (!base64 || !mimeType) {
    return res.status(400).json({ error: 'Request body must include base64 string and mimeType format' });
  }

  try {
    const isMockRequest = base64.startsWith('Simulated') || !process.env.ANTHROPIC_API_KEY;
    
    // --- LOGIKA SIMULASI (TIDAK DIUBAH) ---
    if (isMockRequest) {
      let simulatedScan = [
        { rawName: 'Cabai Merah Segar 2 kg', quantity: 2, unit: 'kg', pricePerUnit: 55000, totalPrice: 110000 },
        { rawName: 'Wortel Kebun 3000 gr', quantity: 3000, unit: 'gr', pricePerUnit: 20, totalPrice: 60000 },
        { rawName: 'Minyak Goreng Sunco 2 Liter', quantity: 2, unit: 'liter', pricePerUnit: 18000, totalPrice: 36000 },
        { rawName: 'Telur Ayam Broiler 10 pcs', quantity: 10, unit: 'pcs', pricePerUnit: 2000, totalPrice: 20000 }
      ];

      if (base64 === 'SimulatedPasar') {
        simulatedScan = [
          { rawName: 'Cabai Merah Merbabu 2.5 kg', quantity: 2.5, unit: 'kg', pricePerUnit: 60000, totalPrice: 150000 },
          { rawName: 'Bawang Merah Lembang 3 kg', quantity: 3, unit: 'kg', pricePerUnit: 40000, totalPrice: 120000 }
        ];
      }
      // ... (simulasi lainnya tetap sama)

      // UPDATE: Ambil ingredients milik restoran ini saja
      const ingRes = await db.query('SELECT id, name FROM ingredients WHERE restaurant_id = $1', [restaurantId]);
      const ingredients = ingRes.rows;

      const processed = simulatedScan.map((item) => {
        const mappedId = findMappedIngredient(item.rawName, ingredients);
        const { amount: convertedAmount, baseUnit } = convertToBaseUnit(item.quantity, item.unit);
        return {
          ...item,
          mappedIngredientId: mappedId || undefined,
          convertedQuantity: convertedAmount,
          convertedUnit: baseUnit
        };
      });

      return res.json({ items: processed, simulated: true });
    }

    // --- LOGIKA CLAUDE API (TIDAK DIUBAH) ---
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
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: `Analyze receipt...` } // Prompt disingkat untuk ringkasan
          ]
        }]
      })
    });

    const data = await response.json() as any;
    if (!response.ok) throw new Error(data?.error?.message || 'Claude API error');

    const textOutput = data.content?.[0]?.text;
    const cleaned = textOutput.replace(/```json|```/g, '').trim();
    const parsedItems = JSON.parse(cleaned);

    // UPDATE: Filter per restaurant_id
    const ingRes = await db.query('SELECT id, name FROM ingredients WHERE restaurant_id = $1', [restaurantId]);
    const ingredients = ingRes.rows;

    const processed = parsedItems.map((item: any) => {
      const mappedId = findMappedIngredient(item.rawName, ingredients);
      const { amount: convertedAmount, baseUnit } = convertToBaseUnit(item.quantity, item.unit);
      return {
        ...item,
        mappedIngredientId: mappedId || undefined,
        convertedQuantity: convertedAmount,
        convertedUnit: baseUnit
      };
    });

    res.json({ items: processed, simulated: false });

  } catch (err: any) {
    console.error('Claude OCR API error:', err);
    res.status(500).json({ error: `Scanning failed: ${err.message}` });
  }
});

// POST confirm scanned items & adjust stock
router.post('/confirm', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const { confirmedItems } = req.body;

  try {
    // Jalankan transaksi manual di PostgreSQL
    await db.query('BEGIN');

    for (const item of confirmedItems) {
      let { mappedIngredientId, convertedQuantity, rawName, pricePerUnit, quantity, totalPrice } = item;
      if (!mappedIngredientId) continue;

      // Jika user memilih untuk membuat bahan baru dari struk
      if (mappedIngredientId === 'new') {
        const newName = item.newIngName || rawName;
        const newCategory = item.isCustomCategory ? (item.customCategoryName || 'Bumbu') : (item.newIngCategory || 'Bumbu');
        const newBaseUnit = item.newIngBaseUnit || 'gram';
        const newSupplier = item.newIngSupplier || 'Struk Scanner';

        const insertRes = await db.query(`
          INSERT INTO ingredients (restaurant_id, name, category, base_unit, supplier, stock, min_stock, unit_price)
          VALUES ($1, $2, $3, $4, $5, 0, 0) RETURNING id
        `, [restaurantId, newName, newCategory, newBaseUnit, newSupplier]);
        
        mappedIngredientId = insertRes.rows[0].id;
      }

      // Ambil stok sekarang
      const ingRes = await db.query('SELECT stock, name FROM ingredients WHERE id = $1 AND restaurant_id = $2', [mappedIngredientId, restaurantId]);
      const ing = ingRes.rows[0];

      if (ing) {
        const nextStock = Number(ing.stock) + Number(convertedQuantity);
        const finalTotalPrice = totalPrice || ((pricePerUnit || 0) * (quantity || 1));
        const finalBaseUnitPrice = convertedQuantity > 0 ? (finalTotalPrice / convertedQuantity) : 0;

        // Update Stok
        await db.query('UPDATE ingredients SET stock = $1, unit_price = $2 WHERE id = $3 AND restaurant_id = $4', 
          [nextStock, finalBaseUnitPrice, mappedIngredientId, restaurantId]);

        // Catat Log
        await db.query(`
          INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes, unit_price, total_price)
          VALUES ($1, $2, 'IN', $3, $4, $5, $6, $7)
        `, [
          restaurantId, 
          mappedIngredientId, 
          convertedQuantity, 
          nextStock, 
          `Scan Struk Belanja: Membeli "${rawName}"`, 
          finalBaseUnitPrice, 
          finalTotalPrice
        ]);
      }
    }

    await db.query('COMMIT');
    res.json({ success: true, message: 'Stock successfully increased from receipt scanner' });
  } catch (err: any) {
    await db.query('ROLLBACK');
    console.error('Confirm OCR Error:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;