const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'inventory.db'));

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS filaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    material TEXT NOT NULL,
    color TEXT NOT NULL,
    diameter REAL DEFAULT 1.75,
    total_weight_g REAL NOT NULL,
    remaining_weight_g REAL NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'PEN',
    supplier TEXT,
    purchase_date TEXT,
    low_stock_threshold_g REAL DEFAULT 100,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    total_volume_ml REAL NOT NULL,
    remaining_volume_ml REAL NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'PEN',
    supplier TEXT,
    purchase_date TEXT,
    low_stock_threshold_ml REAL DEFAULT 50,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS paints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    total_volume_ml REAL NOT NULL,
    remaining_volume_ml REAL NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'PEN',
    supplier TEXT,
    purchase_date TEXT,
    low_stock_threshold_ml REAL DEFAULT 10,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_type TEXT NOT NULL CHECK(material_type IN ('filament', 'resin', 'paint')),
    material_id INTEGER NOT NULL,
    amount_used REAL NOT NULL,
    unit TEXT NOT NULL CHECK(unit IN ('g', 'ml')),
    project_name TEXT,
    notes TEXT,
    used_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS purchase_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_type TEXT NOT NULL CHECK(material_type IN ('filament', 'resin', 'paint')),
    material_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    currency TEXT DEFAULT 'PEN',
    supplier TEXT,
    purchased_at TEXT DEFAULT (datetime('now')),
    notes TEXT
  );
`);

module.exports = db;
