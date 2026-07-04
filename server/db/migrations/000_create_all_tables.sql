-- =====================================================
-- MIGRASI UTAMA: Buat semua tabel yang dibutuhkan RestoFlow
-- Dijalankan otomatis saat server start
-- Idempotent: bisa dijalankan berkali-kali tanpa error
-- =====================================================

-- ── 1. restaurants ──────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  address     TEXT,
  phone       VARCHAR(30),
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. users ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  username        VARCHAR(100) NOT NULL,
  password        VARCHAR(255) NOT NULL,
  role            VARCHAR(50) NOT NULL DEFAULT 'Kasir',
  nama            VARCHAR(200),
  phone           VARCHAR(30),
  pin             VARCHAR(255),
  is_active       BOOLEAN DEFAULT true,
  last_login      TIMESTAMPTZ,
  invited_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(username, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ── 3. shifts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  nama            VARCHAR(100) NOT NULL,
  jam_mulai       TIME NOT NULL DEFAULT '08:00',
  jam_akhir       TIME NOT NULL DEFAULT '16:00',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_restaurant_id ON shifts(restaurant_id);

-- ── 4. shift_sessions ───────────────────────────────
CREATE TABLE IF NOT EXISTS shift_sessions (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_id        INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  login_at        TIMESTAMPTZ DEFAULT NOW(),
  logout_at       TIMESTAMPTZ,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  token_family    VARCHAR(128),
  refresh_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_sessions_user_id ON shift_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_sessions_logout ON shift_sessions(logout_at);
CREATE INDEX IF NOT EXISTS idx_shift_sessions_token_family ON shift_sessions(token_family);
CREATE INDEX IF NOT EXISTS idx_shift_sessions_date ON shift_sessions(date);

-- ── 5. user_features ────────────────────────────────
CREATE TABLE IF NOT EXISTS user_features (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  feature_key     VARCHAR(100) NOT NULL,
  enabled         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_user_features_user_id ON user_features(user_id);

-- ── 6. activity_logs ────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  action          VARCHAR(100) NOT NULL,
  target_type     VARCHAR(50),
  target_id       VARCHAR(50),
  detail          JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_restaurant_id ON activity_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ── 7. ingredients ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  unit            VARCHAR(50) NOT NULL DEFAULT 'kg',
  stock           NUMERIC(12,3) DEFAULT 0,
  min_stock       NUMERIC(12,3) DEFAULT 0,
  cost_per_unit   NUMERIC(15,2) DEFAULT 0,
  category        VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant_id ON ingredients(restaurant_id);

-- ── 8. recipes ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  price           NUMERIC(15,2) DEFAULT 0,
  category        VARCHAR(100),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_restaurant_id ON recipes(restaurant_id);

-- ── 9. recipe_ingredients ───────────────────────────
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id              SERIAL PRIMARY KEY,
  recipe_id       INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id   INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity        NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit            VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- ── 10. stock_movements ─────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  ingredient_id   INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES users(id),
  type            VARCHAR(50) NOT NULL DEFAULT 'in',
  quantity        NUMERIC(12,3) NOT NULL,
  unit            VARCHAR(50),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_restaurant_id ON stock_movements(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient_id ON stock_movements(ingredient_id);

-- ── 11. sales ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES users(id),
  shift_session_id INTEGER REFERENCES shift_sessions(id),
  total           NUMERIC(15,2) DEFAULT 0,
  discount        NUMERIC(15,2) DEFAULT 0,
  payment_method  VARCHAR(50),
  notes           TEXT,
  sale_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_restaurant_id ON sales(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);

-- ── 12. sale_items ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id              SERIAL PRIMARY KEY,
  sale_id         INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  recipe_id       INTEGER REFERENCES recipes(id),
  name            VARCHAR(200) NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  price           NUMERIC(15,2) NOT NULL,
  subtotal        NUMERIC(15,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- ── 13. vouchers ────────────────────────────────────
CREATE TABLE IF NOT EXISTS vouchers (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code            VARCHAR(50) NOT NULL,
  type            VARCHAR(50) NOT NULL DEFAULT 'percentage',
  value           NUMERIC(15,2) NOT NULL,
  min_purchase    NUMERIC(15,2) DEFAULT 0,
  max_discount    NUMERIC(15,2),
  is_active       BOOLEAN DEFAULT true,
  valid_from      DATE,
  valid_until     DATE,
  max_usage       INTEGER,
  usage_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_restaurant_id ON vouchers(restaurant_id);

-- =====================================================
-- VERIFIKASI: Tampilkan semua tabel yang sudah dibuat
-- =====================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
