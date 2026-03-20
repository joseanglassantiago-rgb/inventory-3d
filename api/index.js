const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = '/tmp/inventory.db';
let db = null;
let dbReady = null;

function ensureDb() {
  if (!dbReady) {
    dbReady = initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    }).then(SQL => {
      if (fs.existsSync(DB_PATH)) {
        db = new SQL.Database(fs.readFileSync(DB_PATH));
      } else {
        db = new SQL.Database();
      }
      db.run(`CREATE TABLE IF NOT EXISTS filaments (id INTEGER PRIMARY KEY AUTOINCREMENT, brand TEXT NOT NULL, material TEXT NOT NULL, color TEXT NOT NULL, diameter REAL DEFAULT 1.75, total_weight_g REAL NOT NULL, remaining_weight_g REAL NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'PEN', supplier TEXT, purchase_date TEXT, low_stock_threshold_g REAL DEFAULT 100, notes TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`);
      db.run(`CREATE TABLE IF NOT EXISTS resins (id INTEGER PRIMARY KEY AUTOINCREMENT, brand TEXT NOT NULL, type TEXT NOT NULL, color TEXT NOT NULL, total_volume_ml REAL NOT NULL, remaining_volume_ml REAL NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'PEN', supplier TEXT, purchase_date TEXT, low_stock_threshold_ml REAL DEFAULT 50, notes TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`);
      db.run(`CREATE TABLE IF NOT EXISTS paints (id INTEGER PRIMARY KEY AUTOINCREMENT, brand TEXT NOT NULL, type TEXT NOT NULL, color TEXT NOT NULL, total_volume_ml REAL NOT NULL, remaining_volume_ml REAL NOT NULL, price REAL NOT NULL, currency TEXT DEFAULT 'PEN', supplier TEXT, purchase_date TEXT, low_stock_threshold_ml REAL DEFAULT 10, notes TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`);
      db.run(`CREATE TABLE IF NOT EXISTS usage_log (id INTEGER PRIMARY KEY AUTOINCREMENT, material_type TEXT NOT NULL, material_id INTEGER NOT NULL, amount_used REAL NOT NULL, unit TEXT NOT NULL, project_name TEXT, notes TEXT, used_at TEXT DEFAULT (datetime('now')))`);
      db.run(`CREATE TABLE IF NOT EXISTS purchase_history (id INTEGER PRIMARY KEY AUTOINCREMENT, material_type TEXT NOT NULL, material_id INTEGER NOT NULL, quantity INTEGER DEFAULT 1, unit_price REAL NOT NULL, total_price REAL NOT NULL, currency TEXT DEFAULT 'PEN', supplier TEXT, purchased_at TEXT DEFAULT (datetime('now')), notes TEXT)`);
      saveDb();
    });
  }
  return dbReady;
}

function saveDb() {
  if (!db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb();
  const result = db.exec("SELECT last_insert_rowid() as id");
  return {
    lastInsertRowid: result.length ? result[0].values[0][0] : 0,
    changes: db.getRowsModified()
  };
}

// Middleware: ensure DB is ready before handling any request
app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(500).json({ error: 'Database initialization failed', details: err.message });
  }
});

// FILAMENTS
app.get('/api/filaments', (req, res) => res.json(queryAll('SELECT * FROM filaments ORDER BY updated_at DESC')));
app.get('/api/filaments/:id', (req, res) => {
  const row = queryOne('SELECT * FROM filaments WHERE id = ?', [Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: 'Filamento no encontrado' });
  res.json(row);
});
app.post('/api/filaments', (req, res) => {
  const { brand, material, color, diameter, total_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes } = req.body;
  const result = runSql('INSERT INTO filaments (brand,material,color,diameter,total_weight_g,remaining_weight_g,price,currency,supplier,purchase_date,low_stock_threshold_g,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [brand, material, color, diameter||1.75, total_weight_g, total_weight_g, price, currency||'PEN', supplier||null, purchase_date||null, low_stock_threshold_g||100, notes||null]);
  runSql('INSERT INTO purchase_history (material_type,material_id,unit_price,total_price,currency,supplier,purchased_at) VALUES (?,?,?,?,?,?,?)',
    ['filament', result.lastInsertRowid, price, price, currency||'PEN', supplier||null, purchase_date||new Date().toISOString()]);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Filamento creado' });
});
app.put('/api/filaments/:id', (req, res) => {
  const { brand, material, color, diameter, total_weight_g, remaining_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes } = req.body;
  const result = runSql("UPDATE filaments SET brand=?,material=?,color=?,diameter=?,total_weight_g=?,remaining_weight_g=?,price=?,currency=?,supplier=?,purchase_date=?,low_stock_threshold_g=?,notes=?,updated_at=datetime('now') WHERE id=?",
    [brand, material, color, diameter, total_weight_g, remaining_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes, Number(req.params.id)]);
  if (result.changes===0) return res.status(404).json({ error: 'No encontrado' });
  res.json({ message: 'Actualizado' });
});
app.delete('/api/filaments/:id', (req, res) => {
  const result = runSql('DELETE FROM filaments WHERE id=?', [Number(req.params.id)]);
  if (result.changes===0) return res.status(404).json({ error: 'No encontrado' });
  res.json({ message: 'Eliminado' });
});

// RESINS
app.get('/api/resins', (req, res) => res.json(queryAll('SELECT * FROM resins ORDER BY updated_at DESC')));
app.get('/api/resins/:id', (req, res) => {
  const row = queryOne('SELECT * FROM resins WHERE id = ?', [Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: 'No encontrada' });
  res.json(row);
});
app.post('/api/resins', (req, res) => {
  const { brand, type, color, total_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const result = runSql('INSERT INTO resins (brand,type,color,total_volume_ml,remaining_volume_ml,price,currency,supplier,purchase_date,low_stock_threshold_ml,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [brand, type, color, total_volume_ml, total_volume_ml, price, currency||'PEN', supplier||null, purchase_date||null, low_stock_threshold_ml||50, notes||null]);
  runSql('INSERT INTO purchase_history (material_type,material_id,unit_price,total_price,currency,supplier,purchased_at) VALUES (?,?,?,?,?,?,?)',
    ['resin', result.lastInsertRowid, price, price, currency||'PEN', supplier||null, purchase_date||new Date().toISOString()]);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Resina creada' });
});
app.put('/api/resins/:id', (req, res) => {
  const { brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const result = runSql("UPDATE resins SET brand=?,type=?,color=?,total_volume_ml=?,remaining_volume_ml=?,price=?,currency=?,supplier=?,purchase_date=?,low_stock_threshold_ml=?,notes=?,updated_at=datetime('now') WHERE id=?",
    [brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes, Number(req.params.id)]);
  if (result.changes===0) return res.status(404).json({ error: 'No encontrada' });
  res.json({ message: 'Actualizada' });
});
app.delete('/api/resins/:id', (req, res) => {
  const result = runSql('DELETE FROM resins WHERE id=?', [Number(req.params.id)]);
  if (result.changes===0) return res.status(404).json({ error: 'No encontrada' });
  res.json({ message: 'Eliminada' });
});

// PAINTS
app.get('/api/paints', (req, res) => res.json(queryAll('SELECT * FROM paints ORDER BY updated_at DESC')));
app.get('/api/paints/:id', (req, res) => {
  const row = queryOne('SELECT * FROM paints WHERE id = ?', [Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: 'No encontrada' });
  res.json(row);
});
app.post('/api/paints', (req, res) => {
  const { brand, type, color, total_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const result = runSql('INSERT INTO paints (brand,type,color,total_volume_ml,remaining_volume_ml,price,currency,supplier,purchase_date,low_stock_threshold_ml,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [brand, type, color, total_volume_ml, total_volume_ml, price, currency||'PEN', supplier||null, purchase_date||null, low_stock_threshold_ml||10, notes||null]);
  runSql('INSERT INTO purchase_history (material_type,material_id,unit_price,total_price,currency,supplier,purchased_at) VALUES (?,?,?,?,?,?,?)',
    ['paint', result.lastInsertRowid, price, price, currency||'PEN', supplier||null, purchase_date||new Date().toISOString()]);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Pintura creada' });
});
app.put('/api/paints/:id', (req, res) => {
  const { brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const result = runSql("UPDATE paints SET brand=?,type=?,color=?,total_volume_ml=?,remaining_volume_ml=?,price=?,currency=?,supplier=?,purchase_date=?,low_stock_threshold_ml=?,notes=?,updated_at=datetime('now') WHERE id=?",
    [brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes, Number(req.params.id)]);
  if (result.changes===0) return res.status(404).json({ error: 'No encontrada' });
  res.json({ message: 'Actualizada' });
});
app.delete('/api/paints/:id', (req, res) => {
  const result = runSql('DELETE FROM paints WHERE id=?', [Number(req.params.id)]);
  if (result.changes===0) return res.status(404).json({ error: 'No encontrada' });
  res.json({ message: 'Eliminada' });
});

// USAGE
app.get('/api/usage', (req, res) => {
  const { material_type, material_id } = req.query;
  let query = 'SELECT * FROM usage_log';
  const params = [];
  const conditions = [];
  if (material_type) { conditions.push('material_type = ?'); params.push(material_type); }
  if (material_id) { conditions.push('material_id = ?'); params.push(Number(material_id)); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY used_at DESC';
  res.json(queryAll(query, params));
});
app.post('/api/usage', (req, res) => {
  const { material_type, material_id, amount_used, project_name, notes } = req.body;
  const unit = material_type === 'filament' ? 'g' : 'ml';
  if (material_type === 'filament') {
    const f = queryOne('SELECT remaining_weight_g FROM filaments WHERE id=?', [Number(material_id)]);
    if (!f) return res.status(404).json({ error: 'Filamento no encontrado' });
    if (f.remaining_weight_g - amount_used < 0) return res.status(400).json({ error: 'No hay suficiente material' });
    runSql("UPDATE filaments SET remaining_weight_g=?, updated_at=datetime('now') WHERE id=?", [f.remaining_weight_g - amount_used, Number(material_id)]);
  } else if (material_type === 'resin') {
    const r = queryOne('SELECT remaining_volume_ml FROM resins WHERE id=?', [Number(material_id)]);
    if (!r) return res.status(404).json({ error: 'Resina no encontrada' });
    if (r.remaining_volume_ml - amount_used < 0) return res.status(400).json({ error: 'No hay suficiente material' });
    runSql("UPDATE resins SET remaining_volume_ml=?, updated_at=datetime('now') WHERE id=?", [r.remaining_volume_ml - amount_used, Number(material_id)]);
  } else if (material_type === 'paint') {
    const p = queryOne('SELECT remaining_volume_ml FROM paints WHERE id=?', [Number(material_id)]);
    if (!p) return res.status(404).json({ error: 'Pintura no encontrada' });
    if (p.remaining_volume_ml - amount_used < 0) return res.status(400).json({ error: 'No hay suficiente material' });
    runSql("UPDATE paints SET remaining_volume_ml=?, updated_at=datetime('now') WHERE id=?", [p.remaining_volume_ml - amount_used, Number(material_id)]);
  }
  const result = runSql('INSERT INTO usage_log (material_type,material_id,amount_used,unit,project_name,notes) VALUES (?,?,?,?,?,?)',
    [material_type, Number(material_id), amount_used, unit, project_name||null, notes||null]);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Uso registrado' });
});

// ALERTS
app.get('/api/alerts', (req, res) => {
  const lowF = queryAll("SELECT id,brand,material,color,remaining_weight_g as remaining,low_stock_threshold_g as threshold,'filament' as type FROM filaments WHERE remaining_weight_g<=low_stock_threshold_g");
  const lowR = queryAll("SELECT id,brand,type as material,color,remaining_volume_ml as remaining,low_stock_threshold_ml as threshold,'resin' as type FROM resins WHERE remaining_volume_ml<=low_stock_threshold_ml");
  const lowP = queryAll("SELECT id,brand,type as material,color,remaining_volume_ml as remaining,low_stock_threshold_ml as threshold,'paint' as type FROM paints WHERE remaining_volume_ml<=low_stock_threshold_ml");
  const all = [...lowF, ...lowR, ...lowP];
  res.json({ low_stock: all, count: all.length });
});

// PURCHASES
app.get('/api/purchases', (req, res) => res.json(queryAll('SELECT * FROM purchase_history ORDER BY purchased_at DESC')));

// STATS
app.get('/api/stats', (req, res) => {
  const totalFilaments = queryOne('SELECT COUNT(*) as count FROM filaments').count;
  const totalResins = queryOne('SELECT COUNT(*) as count FROM resins').count;
  const totalPaints = queryOne('SELECT COUNT(*) as count FROM paints').count;
  const totalFV = queryOne('SELECT COALESCE(SUM(price),0) as total FROM filaments').total;
  const totalRV = queryOne('SELECT COALESCE(SUM(price),0) as total FROM resins').total;
  const totalPV = queryOne('SELECT COALESCE(SUM(price),0) as total FROM paints').total;
  const lowCount = queryOne('SELECT (SELECT COUNT(*) FROM filaments WHERE remaining_weight_g<=low_stock_threshold_g)+(SELECT COUNT(*) FROM resins WHERE remaining_volume_ml<=low_stock_threshold_ml)+(SELECT COUNT(*) FROM paints WHERE remaining_volume_ml<=low_stock_threshold_ml) as count').count;
  const recentUsage = queryAll('SELECT * FROM usage_log ORDER BY used_at DESC LIMIT 10');
  res.json({ total_filaments: totalFilaments, total_resins: totalResins, total_paints: totalPaints, total_inventory_value: totalFV+totalRV+totalPV, low_stock_alerts: lowCount, recent_usage: recentUsage });
});

module.exports = app;
