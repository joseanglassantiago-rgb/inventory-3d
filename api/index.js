const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// JSON FILE STORAGE (works on Vercel serverless)
// ============================================================

const DB_PATH = '/tmp/inventory-data.json';

function loadData() {
  if (fs.existsSync(DB_PATH)) {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  }
  return { filaments: [], resins: [], paints: [], usage_log: [], purchase_history: [], nextId: 1 };
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data), 'utf8');
}

function now() {
  return new Date().toISOString();
}

// ============================================================
// FILAMENTS CRUD
// ============================================================

app.get('/api/filaments', (req, res) => {
  const data = loadData();
  res.json(data.filaments.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
});

app.get('/api/filaments/:id', (req, res) => {
  const data = loadData();
  const item = data.filaments.find(f => f.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Filamento no encontrado' });
  res.json(item);
});

app.post('/api/filaments', (req, res) => {
  const data = loadData();
  const { brand, material, color, diameter, total_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes } = req.body;
  const id = data.nextId++;
  const item = {
    id, brand, material, color, diameter: diameter || 1.75, total_weight_g, remaining_weight_g: total_weight_g,
    price, currency: currency || 'PEN', supplier: supplier || null, purchase_date: purchase_date || null,
    low_stock_threshold_g: low_stock_threshold_g || 100, notes: notes || null, created_at: now(), updated_at: now()
  };
  data.filaments.push(item);
  data.purchase_history.push({
    id: data.nextId++, material_type: 'filament', material_id: id, quantity: 1,
    unit_price: price, total_price: price, currency: currency || 'PEN',
    supplier: supplier || null, purchased_at: purchase_date || now(), notes: null
  });
  saveData(data);
  res.status(201).json({ id, message: 'Filamento creado' });
});

app.put('/api/filaments/:id', (req, res) => {
  const data = loadData();
  const idx = data.filaments.findIndex(f => f.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  const { brand, material, color, diameter, total_weight_g, remaining_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes } = req.body;
  Object.assign(data.filaments[idx], { brand, material, color, diameter, total_weight_g, remaining_weight_g, price, currency, supplier, purchase_date, low_stock_threshold_g, notes, updated_at: now() });
  saveData(data);
  res.json({ message: 'Actualizado' });
});

app.delete('/api/filaments/:id', (req, res) => {
  const data = loadData();
  const idx = data.filaments.findIndex(f => f.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  data.filaments.splice(idx, 1);
  saveData(data);
  res.json({ message: 'Eliminado' });
});

// ============================================================
// RESINS CRUD
// ============================================================

app.get('/api/resins', (req, res) => {
  const data = loadData();
  res.json(data.resins.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
});

app.get('/api/resins/:id', (req, res) => {
  const data = loadData();
  const item = data.resins.find(r => r.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Resina no encontrada' });
  res.json(item);
});

app.post('/api/resins', (req, res) => {
  const data = loadData();
  const { brand, type, color, total_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const id = data.nextId++;
  const item = {
    id, brand, type, color, total_volume_ml, remaining_volume_ml: total_volume_ml,
    price, currency: currency || 'PEN', supplier: supplier || null, purchase_date: purchase_date || null,
    low_stock_threshold_ml: low_stock_threshold_ml || 50, notes: notes || null, created_at: now(), updated_at: now()
  };
  data.resins.push(item);
  data.purchase_history.push({
    id: data.nextId++, material_type: 'resin', material_id: id, quantity: 1,
    unit_price: price, total_price: price, currency: currency || 'PEN',
    supplier: supplier || null, purchased_at: purchase_date || now(), notes: null
  });
  saveData(data);
  res.status(201).json({ id, message: 'Resina creada' });
});

app.put('/api/resins/:id', (req, res) => {
  const data = loadData();
  const idx = data.resins.findIndex(r => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
  const { brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  Object.assign(data.resins[idx], { brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes, updated_at: now() });
  saveData(data);
  res.json({ message: 'Actualizada' });
});

app.delete('/api/resins/:id', (req, res) => {
  const data = loadData();
  const idx = data.resins.findIndex(r => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
  data.resins.splice(idx, 1);
  saveData(data);
  res.json({ message: 'Eliminada' });
});

// ============================================================
// PAINTS CRUD
// ============================================================

app.get('/api/paints', (req, res) => {
  const data = loadData();
  res.json(data.paints.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
});

app.get('/api/paints/:id', (req, res) => {
  const data = loadData();
  const item = data.paints.find(p => p.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Pintura no encontrada' });
  res.json(item);
});

app.post('/api/paints', (req, res) => {
  const data = loadData();
  const { brand, type, color, total_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  const id = data.nextId++;
  const item = {
    id, brand, type, color, total_volume_ml, remaining_volume_ml: total_volume_ml,
    price, currency: currency || 'PEN', supplier: supplier || null, purchase_date: purchase_date || null,
    low_stock_threshold_ml: low_stock_threshold_ml || 10, notes: notes || null, created_at: now(), updated_at: now()
  };
  data.paints.push(item);
  data.purchase_history.push({
    id: data.nextId++, material_type: 'paint', material_id: id, quantity: 1,
    unit_price: price, total_price: price, currency: currency || 'PEN',
    supplier: supplier || null, purchased_at: purchase_date || now(), notes: null
  });
  saveData(data);
  res.status(201).json({ id, message: 'Pintura creada' });
});

app.put('/api/paints/:id', (req, res) => {
  const data = loadData();
  const idx = data.paints.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
  const { brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes } = req.body;
  Object.assign(data.paints[idx], { brand, type, color, total_volume_ml, remaining_volume_ml, price, currency, supplier, purchase_date, low_stock_threshold_ml, notes, updated_at: now() });
  saveData(data);
  res.json({ message: 'Actualizada' });
});

app.delete('/api/paints/:id', (req, res) => {
  const data = loadData();
  const idx = data.paints.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
  data.paints.splice(idx, 1);
  saveData(data);
  res.json({ message: 'Eliminada' });
});

// ============================================================
// USAGE LOG
// ============================================================

app.get('/api/usage', (req, res) => {
  const data = loadData();
  let logs = data.usage_log;
  if (req.query.material_type) logs = logs.filter(u => u.material_type === req.query.material_type);
  if (req.query.material_id) logs = logs.filter(u => u.material_id === Number(req.query.material_id));
  res.json(logs.sort((a, b) => new Date(b.used_at) - new Date(a.used_at)));
});

app.post('/api/usage', (req, res) => {
  const data = loadData();
  const { material_type, material_id, amount_used, project_name, notes } = req.body;
  const unit = material_type === 'filament' ? 'g' : 'ml';

  if (material_type === 'filament') {
    const item = data.filaments.find(f => f.id === Number(material_id));
    if (!item) return res.status(404).json({ error: 'Filamento no encontrado' });
    if (item.remaining_weight_g - amount_used < 0) return res.status(400).json({ error: 'No hay suficiente material' });
    item.remaining_weight_g -= amount_used;
    item.updated_at = now();
  } else if (material_type === 'resin') {
    const item = data.resins.find(r => r.id === Number(material_id));
    if (!item) return res.status(404).json({ error: 'Resina no encontrada' });
    if (item.remaining_volume_ml - amount_used < 0) return res.status(400).json({ error: 'No hay suficiente material' });
    item.remaining_volume_ml -= amount_used;
    item.updated_at = now();
  } else if (material_type === 'paint') {
    const item = data.paints.find(p => p.id === Number(material_id));
    if (!item) return res.status(404).json({ error: 'Pintura no encontrada' });
    if (item.remaining_volume_ml - amount_used < 0) return res.status(400).json({ error: 'No hay suficiente material' });
    item.remaining_volume_ml -= amount_used;
    item.updated_at = now();
  }

  const id = data.nextId++;
  data.usage_log.push({ id, material_type, material_id: Number(material_id), amount_used, unit, project_name: project_name || null, notes: notes || null, used_at: now() });
  saveData(data);
  res.status(201).json({ id, message: 'Uso registrado' });
});

// ============================================================
// ALERTS
// ============================================================

app.get('/api/alerts', (req, res) => {
  const data = loadData();
  const lowF = data.filaments.filter(f => f.remaining_weight_g <= f.low_stock_threshold_g).map(f => ({ id: f.id, brand: f.brand, material: f.material, color: f.color, remaining: f.remaining_weight_g, threshold: f.low_stock_threshold_g, type: 'filament' }));
  const lowR = data.resins.filter(r => r.remaining_volume_ml <= r.low_stock_threshold_ml).map(r => ({ id: r.id, brand: r.brand, material: r.type, color: r.color, remaining: r.remaining_volume_ml, threshold: r.low_stock_threshold_ml, type: 'resin' }));
  const lowP = data.paints.filter(p => p.remaining_volume_ml <= p.low_stock_threshold_ml).map(p => ({ id: p.id, brand: p.brand, material: p.type, color: p.color, remaining: p.remaining_volume_ml, threshold: p.low_stock_threshold_ml, type: 'paint' }));
  const all = [...lowF, ...lowR, ...lowP];
  res.json({ low_stock: all, count: all.length });
});

// ============================================================
// PURCHASES
// ============================================================

app.get('/api/purchases', (req, res) => {
  const data = loadData();
  res.json(data.purchase_history.sort((a, b) => new Date(b.purchased_at) - new Date(a.purchased_at)));
});

// ============================================================
// STATS
// ============================================================

app.get('/api/stats', (req, res) => {
  const data = loadData();
  const totalFV = data.filaments.reduce((s, f) => s + (f.price || 0), 0);
  const totalRV = data.resins.reduce((s, r) => s + (r.price || 0), 0);
  const totalPV = data.paints.reduce((s, p) => s + (p.price || 0), 0);
  const lowF = data.filaments.filter(f => f.remaining_weight_g <= f.low_stock_threshold_g).length;
  const lowR = data.resins.filter(r => r.remaining_volume_ml <= r.low_stock_threshold_ml).length;
  const lowP = data.paints.filter(p => p.remaining_volume_ml <= p.low_stock_threshold_ml).length;
  const recentUsage = data.usage_log.sort((a, b) => new Date(b.used_at) - new Date(a.used_at)).slice(0, 10);

  res.json({
    total_filaments: data.filaments.length,
    total_resins: data.resins.length,
    total_paints: data.paints.length,
    total_inventory_value: totalFV + totalRV + totalPV,
    low_stock_alerts: lowF + lowR + lowP,
    recent_usage: recentUsage
  });
});

module.exports = app;
