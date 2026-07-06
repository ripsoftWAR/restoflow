/**
 * Seeder: Generate 20 bahan + 7 hari movement log + recipes
 * Run: node server/db/seed.js
 */
const { Pool } = require('pg');

const DB_URL = process.env.DATABASE_URL
  || 'postgresql://postgres.fsqmlxukwpscsnxqapsw:@dg2wC3NzskXWX&@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const db = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000,
});

const RESTAURANT_ID = 2;

const INGREDIENTS = [
  { name: 'Daging Sapi',          category: 'Daging',          stock: 5000,  base_unit: 'gram',  min_stock: 1000, unit_price: 120000, supplier: 'Pasar Induk',   buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Daging Ayam',          category: 'Daging',          stock: 8000,  base_unit: 'gram',  min_stock: 2000, unit_price: 45000,  supplier: 'PT Unggas Jaya', buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Ikan Salmon',          category: 'Daging',          stock: 2000,  base_unit: 'gram',  min_stock: 500,  unit_price: 180000, supplier: 'Fish Market',  buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Udang Segar',          category: 'Daging',          stock: 1500,  base_unit: 'gram',  min_stock: 400,  unit_price: 95000,  supplier: 'Fish Market',  buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Bawang Merah',         category: 'Sayuran',         stock: 2000,  base_unit: 'gram',  min_stock: 500,  unit_price: 35000,  supplier: 'Pasar Induk',   buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Bawang Putih',         category: 'Sayuran',         stock: 1000,  base_unit: 'gram',  min_stock: 300,  unit_price: 40000,  supplier: 'Pasar Induk',   buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Cabai Merah',          category: 'Sayuran',         stock: 800,   base_unit: 'gram',  min_stock: 200,  unit_price: 60000,  supplier: 'Pasar Induk',   buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Tomat Segar',          category: 'Sayuran',         stock: 1200,  base_unit: 'gram',  min_stock: 300,  unit_price: 15000,  supplier: 'Pasar Induk',   buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Wortel',               category: 'Sayuran',         stock: 1500,  base_unit: 'gram',  min_stock: 300,  unit_price: 12000,  supplier: 'Pasar Induk',   buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Kol / Kubis',          category: 'Sayuran',         stock: 2000,  base_unit: 'gram',  min_stock: 500,  unit_price: 10000,  supplier: 'Pasar Induk',   buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Kecap Manis',          category: 'Bumbu & Rempah',  stock: 3000,  base_unit: 'ml',    min_stock: 500,  unit_price: 25000,  supplier: 'Toko ABC',     buy_unit: 'botol', conversion_factor: 600 },
  { name: 'Garam',                category: 'Bumbu & Rempah',  stock: 5000,  base_unit: 'gram',  min_stock: 500,  unit_price: 8000,   supplier: 'Toko ABC',     buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Gula Pasir',           category: 'Bumbu & Rempah',  stock: 4000,  base_unit: 'gram',  min_stock: 500,  unit_price: 15000,  supplier: 'Toko ABC',     buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Lada Bubuk',           category: 'Bumbu & Rempah',  stock: 500,   base_unit: 'gram',  min_stock: 100,  unit_price: 80000,  supplier: 'Toko ABC',     buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Sirup Rasa',           category: 'Minuman',         stock: 5000,  base_unit: 'ml',    min_stock: 1000, unit_price: 35000,  supplier: 'Distributor XYZ', buy_unit: 'botol', conversion_factor: 1000 },
  { name: 'Es Batu',              category: 'Minuman',         stock: 10000, base_unit: 'gram',  min_stock: 2000, unit_price: 5000,   supplier: 'Pabrik Es',   buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Beras Premium',        category: 'Bahan Pokok',     stock: 25000, base_unit: 'gram',  min_stock: 5000, unit_price: 15000,  supplier: 'Toko Beras Jaya', buy_unit: 'kg', conversion_factor: 1000 },
  { name: 'Minyak Goreng',        category: 'Bahan Pokok',     stock: 4000,  base_unit: 'ml',    min_stock: 1000, unit_price: 20000,  supplier: 'Distributor XYZ', buy_unit: 'liter', conversion_factor: 1000 },
];

const RECIPES = [
  { menu_name: 'Nasi Goreng Spesial', category: 'Makanan', price: 28000,
    ingredients: [
      { name: 'Beras Premium',    amount: 100 }, { name: 'Bawang Merah',     amount: 20 },
      { name: 'Bawang Putih',     amount: 10 },  { name: 'Cabai Merah',      amount: 10 },
      { name: 'Kecap Manis',      amount: 15 },  { name: 'Garam',            amount: 5 },
      { name: 'Minyak Goreng',    amount: 20 },
    ]},
  { menu_name: 'Ayam Goreng Crispy', category: 'Makanan', price: 25000,
    ingredients: [
      { name: 'Daging Ayam',      amount: 200 }, { name: 'Bawang Putih',     amount: 15 },
      { name: 'Garam',            amount: 5 },   { name: 'Lada Bubuk',       amount: 3 },
      { name: 'Minyak Goreng',    amount: 30 },
    ]},
  { menu_name: 'Steak Sapi', category: 'Makanan', price: 65000,
    ingredients: [
      { name: 'Daging Sapi',      amount: 250 }, { name: 'Bawang Putih',     amount: 10 },
      { name: 'Garam',            amount: 3 },   { name: 'Lada Bubuk',       amount: 2 },
      { name: 'Minyak Goreng',    amount: 15 },
    ]},
  { menu_name: 'Salmon Grill', category: 'Makanan', price: 85000,
    ingredients: [
      { name: 'Ikan Salmon',      amount: 200 }, { name: 'Garam',            amount: 3 },
      { name: 'Lada Bubuk',       amount: 2 },   { name: 'Minyak Goreng',    amount: 10 },
    ]},
  { menu_name: 'Udang Saus Tiram', category: 'Makanan', price: 45000,
    ingredients: [
      { name: 'Udang Segar',      amount: 150 }, { name: 'Bawang Merah',     amount: 15 },
      { name: 'Bawang Putih',     amount: 10 },  { name: 'Cabai Merah',      amount: 5 },
      { name: 'Kecap Manis',      amount: 10 },  { name: 'Minyak Goreng',    amount: 15 },
    ]},
  { menu_name: 'Es Teh Manis', category: 'Minuman', price: 8000,
    ingredients: [{ name: 'Gula Pasir', amount: 20 }]},
  { menu_name: 'Es Sirup', category: 'Minuman', price: 10000,
    ingredients: [{ name: 'Sirup Rasa', amount: 40 }, { name: 'Es Batu', amount: 100 }]},
  { menu_name: 'Cah Kangkung', category: 'Makanan', price: 18000,
    ingredients: [
      { name: 'Bawang Merah',     amount: 10 }, { name: 'Bawang Putih',     amount: 10 },
      { name: 'Cabai Merah',      amount: 5 },  { name: 'Garam',            amount: 3 },
      { name: 'Minyak Goreng',    amount: 15 },
    ]},
  { menu_name: 'Sup Wortel Kol', category: 'Makanan', price: 15000,
    ingredients: [
      { name: 'Wortel',           amount: 100 }, { name: 'Kol / Kubis',      amount: 100 },
      { name: 'Bawang Putih',     amount: 10 },  { name: 'Garam',            amount: 5 },
      { name: 'Lada Bubuk',       amount: 2 },
    ]},
];

const DAILY_SALES = [
  { menu: 'Nasi Goreng Spesial', weekday: 8, weekend: 12 },
  { menu: 'Ayam Goreng Crispy',  weekday: 10, weekend: 15 },
  { menu: 'Steak Sapi',          weekday: 3, weekend: 8 },
  { menu: 'Salmon Grill',        weekday: 2, weekend: 5 },
  { menu: 'Udang Saus Tiram',    weekday: 4, weekend: 7 },
  { menu: 'Es Teh Manis',        weekday: 12, weekend: 20 },
  { menu: 'Es Sirup',            weekday: 8, weekend: 14 },
  { menu: 'Cah Kangkung',        weekday: 5, weekend: 8 },
  { menu: 'Sup Wortel Kol',      weekday: 6, weekend: 9 },
];

const RESTOKS = [
  { day: -6, items: [
    { name: 'Daging Sapi',    amount: 3000, supplier: 'Pasar Induk' },
    { name: 'Beras Premium',  amount: 15000, supplier: 'Toko Beras Jaya' },
  ]},
  { day: -3, items: [
    { name: 'Daging Ayam',    amount: 5000, supplier: 'PT Unggas Jaya' },
    { name: 'Bawang Merah',   amount: 2000, supplier: 'Pasar Induk' },
    { name: 'Bawang Putih',   amount: 1000, supplier: 'Pasar Induk' },
    { name: 'Cabai Merah',    amount: 1000, supplier: 'Pasar Induk' },
  ]},
  { day: -1, items: [
    { name: 'Kecap Manis',    amount: 2000, supplier: 'Toko ABC' },
    { name: 'Minyak Goreng',  amount: 3000, supplier: 'Distributor XYZ' },
    { name: 'Es Batu',        amount: 5000, supplier: 'Pabrik Es' },
  ]},
];

function isWeekend(date) { const d = date.getDay(); return d === 0 || d === 6; }
function randomVariation(base, pct = 0.2) { return Math.round(base * (1 - pct + Math.random() * pct * 2)); }
function getDateDaysAgo(days) {
  const d = new Date(); d.setDate(d.getDate() - days);
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function seed() {
  console.log('🌱 RestoFlow Seeder\n');

  const existing = await db.query('SELECT COUNT(*) AS cnt FROM ingredients WHERE restaurant_id = $1', [RESTAURANT_ID]);
  console.log('📦 Bahan existing:', existing.rows[0].cnt);
  if (existing.rows[0].cnt >= 18) {
    console.log('⚠️  Data sudah cukup. Hapus dulu: DELETE FROM ingredients WHERE id > 37;');
    await db.end(); return;
  }

  // 1. Load existing ingredient map
  const ingredientMap = new Map();
  const existingAll = await db.query('SELECT id, name FROM ingredients WHERE restaurant_id = $1', [RESTAURANT_ID]);
  existingAll.rows.forEach(r => ingredientMap.set(r.name.toLowerCase(), r.id));

  // 2. Insert new ingredients
  console.log('\n📦 Menambah bahan...');
  let added = 0;
  for (const ing of INGREDIENTS) {
    if (ingredientMap.has(ing.name.toLowerCase())) continue;
    const res = await db.query(
      'INSERT INTO ingredients (restaurant_id,name,stock,base_unit,category,supplier,min_stock,unit_price,buy_unit,conversion_factor,updated_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING id',
      [RESTAURANT_ID, ing.name, ing.stock, ing.base_unit, ing.category, ing.supplier, ing.min_stock, ing.unit_price, ing.buy_unit, ing.conversion_factor]
    );
    ingredientMap.set(ing.name.toLowerCase(), res.rows[0].id);
    added++;
    console.log('   OK #'+res.rows[0].id, ing.name);
  }
  console.log('   Total:', added, 'bahan baru');

  // 3. Recipes
  console.log('\n🍳 Menambah recipes...');
  const er = await db.query('SELECT COUNT(*) AS cnt FROM recipes WHERE restaurant_id = $1', [RESTAURANT_ID]);
  if (er.rows[0].cnt <= 1) {
    for (const recipe of RECIPES) {
      for (const ri of recipe.ingredients) {
        const ingId = ingredientMap.get(ri.name.toLowerCase());
        if (!ingId) continue;
        await db.query('INSERT INTO recipes (restaurant_id,menu_name,ingredient_id,amount,category,price) VALUES ($1,$2,$3,$4,$5,$6)',
          [RESTAURANT_ID, recipe.menu_name, ingId, ri.amount, recipe.category, recipe.price]);
      }
      console.log('   OK', recipe.menu_name);
    }
  }

  // 4. Load all
  const allIngs = await db.query('SELECT id,name,stock FROM ingredients WHERE restaurant_id=$1', [RESTAURANT_ID]);
  const ingById = {}; allIngs.rows.forEach(r => ingById[r.id] = r);

  const recipeRows = await db.query('SELECT id,menu_name,ingredient_id,amount FROM recipes WHERE restaurant_id=$1', [RESTAURANT_ID]);
  const recipeByMenu = {};
  recipeRows.rows.forEach(r => { if (!recipeByMenu[r.menu_name]) recipeByMenu[r.menu_name] = []; recipeByMenu[r.menu_name].push(r); });

  // 5. Clear old stock movements
  await db.query("DELETE FROM stock_movements WHERE restaurant_id=$1 AND created_at >= CURRENT_DATE - INTERVAL '8 days'", [RESTAURANT_ID]);

  console.log('\n📊 Generate stock movements 7 hari...');
  let totalMov = 0;
  for (let dayAgo = 7; dayAgo >= 1; dayAgo--) {
    const date = getDateDaysAgo(dayAgo);
    const weekend = isWeekend(date);
    for (const sale of DAILY_SALES) {
      const qty = weekend ? sale.weekend : sale.weekday;
      const actualQty = randomVariation(qty, 0.3);
      if (actualQty <= 0) continue;
      const recipeIngs = recipeByMenu[sale.menu];
      if (!recipeIngs) continue;
      for (const ri of recipeIngs) {
        const ing = ingById[ri.ingredient_id];
        if (!ing) continue;
        const amountOut = -(ri.amount * actualQty);
        const newStock = Number(ing.stock) + amountOut;
        await db.query(
          'INSERT INTO stock_movements (restaurant_id,ingredient_id,type,quantity,unit,notes,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [RESTAURANT_ID, ri.ingredient_id, 'out', Math.abs(amountOut), ing.base_unit, 'Penjualan: '+actualQty+'x '+sale.menu, date]
        );
        ingById[ri.ingredient_id].stock = newStock;
        totalMov++;
      }
    }
  }
  console.log('   Total OUT:', totalMov, 'entries');

  // 6. Restok
  console.log('\n📥 Generate restok...');
  let totalIn = 0;
  for (const restok of RESTOKS) {
    const date = getDateDaysAgo(Math.abs(restok.day));
    for (const item of restok.items) {
      const ingId = ingredientMap.get(item.name.toLowerCase());
      if (!ingId) continue;
      const ing = ingById[ingId];
      const newStock = Number(ing.stock) + item.amount;
      await db.query(
        'INSERT INTO stock_movements (restaurant_id,ingredient_id,type,quantity,unit,notes,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [RESTAURANT_ID, ingId, 'in', item.amount, ing.base_unit, 'Restok: '+item.supplier, date]
      );
      ingById[ingId].stock = newStock;
      totalIn++;
    }
  }
  console.log('   Total IN:', totalIn, 'entries');

  // 7. Update final stock
  for (const [id, ing] of Object.entries(ingById)) {
    await db.query('UPDATE ingredients SET stock=$1, updated_at=NOW() WHERE id=$2', [ing.stock, id]);
  }

  // Summary
  const cnt = await db.query('SELECT COUNT(*) FROM ingredients WHERE restaurant_id=$1', [RESTAURANT_ID]);
  const mov = await db.query('SELECT COUNT(*) FROM stock_movements WHERE restaurant_id=$1', [RESTAURANT_ID]);
  const rec = await db.query('SELECT COUNT(DISTINCT menu_name) FROM recipes WHERE restaurant_id=$1', [RESTAURANT_ID]);
  console.log('\n============================================');
  console.log('  ✅ SEED SELESAI');
  console.log('  📦 Bahan   :', cnt.rows[0].count, 'item');
  console.log('  📋 Recipe  :', rec.rows[0].count, 'menu');
  console.log('  📊 Movement:', mov.rows[0].count, 'log');
  console.log('============================================\n');
  await db.end();
}

seed().catch(async (err) => { console.error('❌', err.message); await db.end(); process.exit(1); });
