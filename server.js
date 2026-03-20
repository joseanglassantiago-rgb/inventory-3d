const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// FILAMENTS CRUD
// ============================================================

app.get('/api/filaments', (req, res) => {
  const rows = db.prepare('SELECT * FROM filaments ORDER BY updated_at DESC').all();
  res.json(rows);
});

app.get('/api/filaments/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Filamento no encontrado' });
  res.json(row);
});

app.post('/api/filaments', (req, res) => {
  const { brand, material, color, diameter, total_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes } = req.body;
  const remaining_weight_g = total_weight_g;
  const stmt = db.prepare(`
    INSERT INTO filaments (brand, material, color, diameter, total_weight_g, remaining_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(brand, material, color, diameter || 1.75, total_weight_g, remaining_weight_g, price, currency || 'PEN', supplier, purchase_date, low_stock_threshold_g || 100, notes);

  // Auto-register purchase
  db.prepare(`INSERT INTO purchase_history (material_type, material_id, unit_price, total_price, currency, supplier, purchased_at)
    VALUES ('filament', ?, ?, ?, ?, ?, ?)`).run(result.lastInsertRowid, price, price, currency || 'PEN', supplier, purchase_date || new Date().toISOString());

  res.status(201).json({ id: result.lastInsertRowid, message: 'Filamento creado' });
});

app.put('/api/filaments/:id', (req, res) => {
  const { brand, material, color, diameter, total_weight_g, remaining_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes } = req.body;
  const stmt = db.prepare(`
    UPDATE filaments SET brand=?, material=?, color=?, diameter=?, total_weight_g=?, remaining_weight_g=?, price=?, currency=?, supplier=?, purchase_date=?, low_stock_threshold_g=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `);
  const result = stmt.run(brand, material, color, diameter, total_weight_g, remaining_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Filamento no encontrado' });
  res.json({ message: 'Filamento actualizado' });
});

app.delete('/api/filaments/:id', (req, res) => {
  const result = db.prepare('DELETE FROM filaments WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Filamento no encontrado' });
  res.json({ message: 'Filamento eliminado' });
});

// ============================================================
// RESINS CRUD
// ============================================================

app.get('/api/resins', (req, res) => {
  const rows = db.prepare('SELECT * FROM resins ORDER BY updated_at DESC').all();
  res.json(rows);
});

app.get('/api/resins/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM resins WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Resina no encontrada' });
  res.json(row);
});

app.post('/api/resins', (req, res) => {
  const { brand, type, color, total_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const remaining_volume_ml = total_volume_ml;
  const stmt = db.prepare(`
    INSERT INTO resins (brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(brand, type, color, total_volume_ml, remaining_volume_ml, price, currency || 'PEN', supplier, purchase_date, low_stock_threshold_ml || 50, notes);

  db.prepare(`INSERT INTO purchase_history (material_type, material_id, unit_price, total_price, currency, supplier, purchased_at)
    VALUES ('resin', ?, ?, ?, ?, ?, ?)`).run(result.lastInsertRowid, price, price, currency || 'PEN', supplier, purchase_date || new Date().toISOString());

  res.status(201).json({ id: result.lastInsertRowid, message: 'Resina creada' });
});

app.put('/api/resins/:id', (req, res) => {
  const { brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const stmt = db.prepare(`
    UPDATE resins SET brand=?, type=?, color=?, total_volume_ml=?, remaining_volume_ml=?, price=?, currency=?, supplier=?, purchase_date=?, low_stock_threshold_ml=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `);
  const result = stmt.run(brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Resina no encontrada' });
  res.json({ message: 'Resina actualizada' });
});

app.delete('/api/resins/:id', (req, res) => {
  const result = db.prepare('DELETE FROM resins WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Resina no encontrada' });
  res.json({ message: 'Resina eliminada' });
});

// ============================================================
// PAINTS CRUD
// ============================================================

app.get('/api/paints', (req, res) => {
  const rows = db.prepare('SELECT * FROM paints ORDER BY updated_at DESC').all();
  res.json(rows);
});

app.get('/api/paints/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM paints WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Pintura no encontrada' });
  res.json(row);
});

app.post('/api/paints', (req, res) => {
  const { brand, type, color, total_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const remaining_volume_ml = total_volume_ml;
  const stmt = db.prepare(`
    INSERT INTO paints (brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(brand, type, color, total_volume_ml, remaining_volume_ml, price, currency || 'PEN', supplier, purchase_date, low_stock_threshold_ml || 10, notes);

  db.prepare(`INSERT INTO purchase_history (material_type, material_id, unit_price, total_price, currency, supplier, purchased_at)
    VALUES ('paint', ?, ?, ?, ?, ?, ?)`).run(result.lastInsertRowid, price, price, currency || 'PEN', supplier, purchase_date || new Date().toISOString());

  res.status(201).json({ id: result.lastInsertRowid, message: 'Pintura creada' });
});

app.put('/api/paints/:id', (req, res) => {
  const { brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const stmt = db.prepare(`
    UPDATE paints SET brand=?, type=?, color=?, total_volume_ml=?, remaining_volume_ml=?, price=?, currency=?, supplier=?, purchase_date=?, low_stock_threshold_ml=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `);
  const result = stmt.run(brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Pintura no encontrada' });
  res.json({ message: 'Pintura actualizada' });
});

app.delete('/api/paints/:id', (req, res) => {
  const result = db.prepare('DELETE FROM paints WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Pintura no encontrada' });
  res.json({ message: 'Pintura eliminada' });
});

// ============================================================
// USAGE LOG
// ============================================================

app.get('/api/usage', (req, res) => {
  const { material_type, material_id } = req.query;
  let query = 'SELECT * FROM usage_log';
  const params = [];
  const conditions = [];
  if (material_type) { conditions.push('material_type = ?'); params.push(material_type); }
  if (material_id) { conditions.push('material_id = ?'); params.push(material_id); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY used_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/usage', (req, res) => {
  const { material_type, material_id, amount_used, project_name, notes } = req.body;
  const unit = material_type === 'filament' ? 'g' : 'ml';

  // Update remaining stock
  if (material_type === 'filament') {
    const filament = db.prepare('SELECT remaining_weight_g FROM filaments WHERE id = ?').get(material_id);
    if (!filament) return res.status(404).json({ error: 'Filamento no encontrado' });
    const newRemaining = filament.remaining_weight_g - amount_used;
    if (newRemaining < 0) return res.status(400).json({ error: 'No hay suficiente material' });
    db.prepare('UPDATE filaments SET remaining_weight_g = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newRemaining, material_id);
  } else if (material_type === 'resin') {
    const resin = db.prepare('SELECT remaining_volume_ml FROM resins WHERE id = ?').get(material_id);
    if (!resin) return res.status(404).json({ error: 'Resina no encontrada' });
    const newRemaining = resin.remaining_volume_ml - amount_used;
    if (newRemaining < 0) return res.status(400).json({ error: 'No hay suficiente material' });
    db.prepare('UPDATE resins SET remaining_volume_ml = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newRemaining, material_id);
  } else if (material_type === 'paint') {
    const paint = db.prepare('SELECT remaining_volume_ml FROM paints WHERE id = ?').get(material_id);
    if (!paint) return res.status(404).json({ error: 'Pintura no encontrada' });
    const newRemaining = paint.remaining_volume_ml - amount_used;
    if (newRemaining < 0) return res.status(400).json({ error: 'No hay suficiente material' });
    db.prepare('UPDATE paints SET remaining_volume_ml = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newRemaining, material_id);
  }

  const result = db.prepare(`INSERT INTO usage_log (material_type, material_id, amount_used, unit, project_name, notes) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(material_type, material_id, amount_used, unit, project_name, notes);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Uso registrado' });
});

// ============================================================
// ALERTS - Low stock
// ============================================================

app.get('/api/alerts', (req, res) => {
  const lowFilaments = db.prepare(`
    SELECT id, brand, material, color, remaining_weight_g as remaining, low_stock_threshold_g as threshold, 'filament' as type
    FROM filaments WHERE remaining_weight_g <= low_stock_threshold_g
  `).all();

  const lowResins = db.prepare(`
    SELECT id, brand, type as material, color, remaining_volume_ml as remaining, low_stock_threshold_ml as threshold, 'resin' as type
    FROM resins WHERE remaining_volume_ml <= low_stock_threshold_ml
  `).all();

  const lowPaints = db.prepare(`
    SELECT id, brand, type as material, color, remaining_volume_ml as remaining, low_stock_threshold_ml as threshold, 'paint' as type
    FROM paints WHERE remaining_volume_ml <= low_stock_threshold_ml
  `).all();

  const all = [...lowFilaments, ...lowResins, ...lowPaints];
  res.json({ low_stock: all, count: all.length });
});

// ============================================================
// PURCHASE HISTORY
// ============================================================

app.get('/api/purchases', (req, res) => {
  const rows = db.prepare('SELECT * FROM purchase_history ORDER BY purchased_at DESC').all();
  res.json(rows);
});

// ============================================================
// DASHBOARD / STATS (useful for N8N)
// ============================================================

app.get('/api/stats', (req, res) => {
  const totalFilaments = db.prepare('SELECT COUNT(*) as count FROM filaments').get().count;
  const totalResins = db.prepare('SELECT COUNT(*) as count FROM resins').get().count;
  const totalPaints = db.prepare('SELECT COUNT(*) as count FROM paints').get().count;
  const totalFilamentValue = db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM filaments').get().total;
  const totalResinValue = db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM resins').get().total;
  const totalPaintValue = db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM paints').get().total;
  const lowStockCount = db.prepare(`
    SELECT (SELECT COUNT(*) FROM filaments WHERE remaining_weight_g <= low_stock_threshold_g)
         + (SELECT COUNT(*) FROM resins WHERE remaining_volume_ml <= low_stock_threshold_ml)
         + (SELECT COUNT(*) FROM paints WHERE remaining_volume_ml <= low_stock_threshold_ml) as count
  `).get().count;
  const recentUsage = db.prepare('SELECT * FROM usage_log ORDER BY used_at DESC LIMIT 10').all();

  res.json({
    total_filaments: totalFilaments,
    total_resins: totalResins,
    total_paints: totalPaints,
    total_inventory_value: totalFilamentValue + totalResinValue + totalPaintValue,
    low_stock_alerts: lowStockCount,
    recent_usage: recentUsage
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor de inventario corriendo en http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
});
