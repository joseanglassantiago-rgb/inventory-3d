const API = window.location.origin + '/api';

// ============================================================
// GREETING
// ============================================================

function setGreeting() {
  const h = new Date().getHours();
  let greeting = 'Buenas noches';
  if (h >= 5 && h < 12) greeting = 'Buen dia';
  else if (h >= 12 && h < 19) greeting = 'Buenas tardes';
  document.getElementById('greeting').textContent = greeting + ', KREA LAB';
}
setGreeting();

// ============================================================
// NAVIGATION
// ============================================================

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll(`.nav-btn[data-section="${btn.dataset.section}"]`).forEach(b => b.classList.add('active'));
    document.getElementById('section-' + btn.dataset.section).classList.add('active');
  });
});

// ============================================================
// DATA
// ============================================================

let allFilaments = [];
let allResins = [];
let allPaints = [];

function currencySymbol(currency) {
  if (currency === 'PEN') return 'S/';
  if (currency === 'USD') return '$';
  if (currency === 'EUR') return '\u20AC';
  return currency + ' ';
}

function formatPrice(price, currency) {
  return currencySymbol(currency) + price.toLocaleString('es-PE', { minimumFractionDigits: 2 });
}

const TYPE_LABELS = { filament: 'Filamento', resin: 'Resina', paint: 'Pintura' };

async function loadDashboard() {
  const res = await fetch(API + '/stats');
  const data = await res.json();
  document.getElementById('stat-filaments').textContent = data.total_filaments;
  document.getElementById('stat-resins').textContent = data.total_resins;
  document.getElementById('stat-paints').textContent = data.total_paints;
  document.getElementById('stat-value').textContent = 'S/' + data.total_inventory_value.toLocaleString('es-PE', { minimumFractionDigits: 2 });
  document.getElementById('stat-alerts').textContent = data.low_stock_alerts;

  // Recent usage
  const usageList = document.getElementById('recent-usage-list');
  if (data.recent_usage.length === 0) {
    usageList.innerHTML = '<p style="color:var(--text-muted);font-size:14px;padding:12px 0;">Sin uso registrado aun.</p>';
  } else {
    usageList.innerHTML = data.recent_usage.map(u => `
      <div class="usage-item">
        <div class="usage-dot ${u.material_type}"></div>
        <div class="usage-info">
          <div class="usage-project">${u.project_name || 'Sin proyecto'}</div>
          <div class="usage-detail">${TYPE_LABELS[u.material_type] || u.material_type} &middot; ${u.amount_used} ${u.unit}</div>
        </div>
        <div class="usage-date">${formatDate(u.used_at)}</div>
      </div>
    `).join('');
  }

  // Quick inventory
  const quickInv = document.getElementById('quick-inventory');
  const items = [];
  allFilaments.slice(0, 3).forEach(f => {
    const pct = Math.round((f.remaining_weight_g / f.total_weight_g) * 100);
    items.push(`
      <div class="inv-item">
        <div class="inv-color" style="background:${getColorHex(f.color)}"></div>
        <div class="inv-info">
          <div class="inv-name">${f.brand} ${f.material}</div>
          <div class="inv-meta">${f.color} &middot; ${f.diameter}mm</div>
        </div>
        <div class="inv-stock" style="color:${pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--danger)'}">${f.remaining_weight_g}g</div>
      </div>
    `);
  });
  allResins.slice(0, 3).forEach(r => {
    const pct = Math.round((r.remaining_volume_ml / r.total_volume_ml) * 100);
    items.push(`
      <div class="inv-item">
        <div class="inv-color" style="background:${getColorHex(r.color)}"></div>
        <div class="inv-info">
          <div class="inv-name">${r.brand} ${r.type}</div>
          <div class="inv-meta">${r.color} &middot; Resina</div>
        </div>
        <div class="inv-stock" style="color:${pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--danger)'}">${r.remaining_volume_ml}ml</div>
      </div>
    `);
  });
  allPaints.slice(0, 3).forEach(p => {
    const pct = Math.round((p.remaining_volume_ml / p.total_volume_ml) * 100);
    items.push(`
      <div class="inv-item">
        <div class="inv-color" style="background:${getColorHex(p.color)}"></div>
        <div class="inv-info">
          <div class="inv-name">${p.brand} ${p.type}</div>
          <div class="inv-meta">${p.color} &middot; Pintura</div>
        </div>
        <div class="inv-stock" style="color:${pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--danger)'}">${p.remaining_volume_ml}ml</div>
      </div>
    `);
  });
  quickInv.innerHTML = items.length ? items.join('') : '<p style="color:var(--text-muted);font-size:14px;padding:12px 0;">Agrega materiales para verlos aqui.</p>';

  // Alerts
  const alertsRes = await fetch(API + '/alerts');
  const alerts = await alertsRes.json();
  const banner = document.getElementById('alerts-banner');
  if (alerts.count > 0) {
    banner.classList.remove('hidden');
    banner.innerHTML = '&#9888; ' + alerts.count + ' material(es) con stock bajo: ' +
      alerts.low_stock.map(a => '<strong>' + a.brand + ' ' + a.color + '</strong> (' + a.remaining + (a.type === 'filament' ? 'g' : 'ml') + ')').join(', ');
  } else {
    banner.classList.add('hidden');
  }
}

async function loadFilaments() {
  const res = await fetch(API + '/filaments');
  allFilaments = await res.json();
  const tbody = document.querySelector('#filaments-table tbody');
  tbody.innerHTML = allFilaments.map(f => {
    const pct = (f.remaining_weight_g / f.total_weight_g) * 100;
    const barClass = pct > 50 ? 'stock-high' : pct > 20 ? 'stock-mid' : 'stock-low';
    return '<tr>' +
      '<td><strong>' + f.brand + '</strong></td>' +
      '<td><span class="material-tag">' + f.material + '</span></td>' +
      '<td>' + colorDot(f.color) + f.color + '</td>' +
      '<td>' + f.diameter + 'mm</td>' +
      '<td><div class="stock-bar"><div class="stock-bar-fill ' + barClass + '" style="width:' + pct + '%"></div></div>' + f.remaining_weight_g + 'g / ' + f.total_weight_g + 'g</td>' +
      '<td>' + formatPrice(f.price, f.currency) + '</td>' +
      '<td>' + (f.supplier || '-') + '</td>' +
      '<td>' +
        '<button class="btn-sm btn-use" onclick="quickUse(\'filament\',' + f.id + ',\'' + escapeQuotes(f.brand + ' ' + f.color) + '\')">Usar</button>' +
        '<button class="btn-sm btn-edit" onclick="editFilament(' + f.id + ')">Editar</button>' +
        '<button class="btn-sm btn-delete" onclick="deleteFilament(' + f.id + ')">X</button>' +
      '</td></tr>';
  }).join('');
}

async function loadResins() {
  const res = await fetch(API + '/resins');
  allResins = await res.json();
  const tbody = document.querySelector('#resins-table tbody');
  tbody.innerHTML = allResins.map(r => {
    const pct = (r.remaining_volume_ml / r.total_volume_ml) * 100;
    const barClass = pct > 50 ? 'stock-high' : pct > 20 ? 'stock-mid' : 'stock-low';
    return '<tr>' +
      '<td><strong>' + r.brand + '</strong></td>' +
      '<td><span class="material-tag">' + r.type + '</span></td>' +
      '<td>' + colorDot(r.color) + r.color + '</td>' +
      '<td><div class="stock-bar"><div class="stock-bar-fill ' + barClass + '" style="width:' + pct + '%"></div></div>' + r.remaining_volume_ml + 'ml / ' + r.total_volume_ml + 'ml</td>' +
      '<td>' + formatPrice(r.price, r.currency) + '</td>' +
      '<td>' + (r.supplier || '-') + '</td>' +
      '<td>' +
        '<button class="btn-sm btn-use" onclick="quickUse(\'resin\',' + r.id + ',\'' + escapeQuotes(r.brand + ' ' + r.color) + '\')">Usar</button>' +
        '<button class="btn-sm btn-edit" onclick="editResin(' + r.id + ')">Editar</button>' +
        '<button class="btn-sm btn-delete" onclick="deleteResin(' + r.id + ')">X</button>' +
      '</td></tr>';
  }).join('');
}

async function loadPaints() {
  const res = await fetch(API + '/paints');
  allPaints = await res.json();
  const tbody = document.querySelector('#paints-table tbody');
  tbody.innerHTML = allPaints.map(p => {
    const pct = (p.remaining_volume_ml / p.total_volume_ml) * 100;
    const barClass = pct > 50 ? 'stock-high' : pct > 20 ? 'stock-mid' : 'stock-low';
    return '<tr>' +
      '<td><strong>' + p.brand + '</strong></td>' +
      '<td><span class="material-tag">' + p.type + '</span></td>' +
      '<td>' + colorDot(p.color) + p.color + '</td>' +
      '<td><div class="stock-bar"><div class="stock-bar-fill ' + barClass + '" style="width:' + pct + '%"></div></div>' + p.remaining_volume_ml + 'ml / ' + p.total_volume_ml + 'ml</td>' +
      '<td>' + formatPrice(p.price, p.currency) + '</td>' +
      '<td>' + (p.supplier || '-') + '</td>' +
      '<td>' +
        '<button class="btn-sm btn-use" onclick="quickUse(\'paint\',' + p.id + ',\'' + escapeQuotes(p.brand + ' ' + p.color) + '\')">Usar</button>' +
        '<button class="btn-sm btn-edit" onclick="editPaint(' + p.id + ')">Editar</button>' +
        '<button class="btn-sm btn-delete" onclick="deletePaint(' + p.id + ')">X</button>' +
      '</td></tr>';
  }).join('');
}

async function loadUsage() {
  const res = await fetch(API + '/usage');
  const data = await res.json();
  const tbody = document.querySelector('#usage-table tbody');
  tbody.innerHTML = data.map(u => `
    <tr>
      <td>${formatDate(u.used_at)}</td>
      <td><span class="material-tag">${TYPE_LABELS[u.material_type] || u.material_type}</span></td>
      <td>${getMaterialName(u.material_type, u.material_id)}</td>
      <td><strong>${u.amount_used} ${u.unit}</strong></td>
      <td>${u.project_name || '-'}</td>
      <td>${u.notes || '-'}</td>
    </tr>
  `).join('');
}

async function loadPurchases() {
  const res = await fetch(API + '/purchases');
  const data = await res.json();
  const tbody = document.querySelector('#purchases-table tbody');
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${formatDate(p.purchased_at)}</td>
      <td><span class="material-tag">${TYPE_LABELS[p.material_type] || p.material_type}</span></td>
      <td>${formatPrice(p.unit_price, p.currency)}</td>
      <td><strong>${formatPrice(p.total_price, p.currency)}</strong></td>
      <td>${p.supplier || '-'}</td>
    </tr>
  `).join('');
}

async function loadAll() {
  await Promise.all([loadFilaments(), loadResins(), loadPaints()]);
  await Promise.all([loadDashboard(), loadUsage(), loadPurchases()]);
}

// ============================================================
// MODALS
// ============================================================

function openModal(type) {
  if (type === 'filament') {
    document.getElementById('form-filament').reset();
    document.getElementById('fil-id').value = '';
    document.getElementById('modal-filament-title').textContent = 'Agregar Filamento';
  } else if (type === 'resin') {
    document.getElementById('form-resin').reset();
    document.getElementById('res-id').value = '';
    document.getElementById('modal-resin-title').textContent = 'Agregar Resina';
  } else if (type === 'paint') {
    document.getElementById('form-paint').reset();
    document.getElementById('pnt-id').value = '';
    document.getElementById('modal-paint-title').textContent = 'Agregar Pintura';
  }
  document.getElementById('modal-' + type).classList.remove('hidden');
}

function closeModal(type) {
  document.getElementById('modal-' + type).classList.add('hidden');
}

function openUsageModal() {
  document.getElementById('form-usage').reset();
  document.getElementById('use-material').innerHTML = '<option value="">Primero selecciona tipo...</option>';
  document.getElementById('modal-usage').classList.remove('hidden');
}

// Close modals on backdrop click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

// ============================================================
// FILAMENT CRUD
// ============================================================

async function saveFilament(e) {
  e.preventDefault();
  const id = document.getElementById('fil-id').value;
  const body = {
    brand: document.getElementById('fil-brand').value,
    material: document.getElementById('fil-material').value,
    color: document.getElementById('fil-color').value,
    diameter: parseFloat(document.getElementById('fil-diameter').value),
    total_weight_g: parseFloat(document.getElementById('fil-weight').value),
    price: parseFloat(document.getElementById('fil-price').value),
    currency: document.getElementById('fil-currency').value,
    supplier: document.getElementById('fil-supplier').value,
    purchase_date: document.getElementById('fil-date').value || null,
    low_stock_threshold_g: parseFloat(document.getElementById('fil-threshold').value),
    notes: document.getElementById('fil-notes').value
  };

  if (id) {
    body.remaining_weight_g = parseFloat(document.getElementById('fil-weight').value);
    await fetch(API + '/filaments/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } else {
    await fetch(API + '/filaments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }
  closeModal('filament');
  loadAll();
}

function editFilament(id) {
  const f = allFilaments.find(x => x.id === id);
  if (!f) return;
  document.getElementById('fil-id').value = f.id;
  document.getElementById('fil-brand').value = f.brand;
  document.getElementById('fil-material').value = f.material;
  document.getElementById('fil-color').value = f.color;
  document.getElementById('fil-diameter').value = f.diameter;
  document.getElementById('fil-weight').value = f.total_weight_g;
  document.getElementById('fil-price').value = f.price;
  document.getElementById('fil-currency').value = f.currency;
  document.getElementById('fil-supplier').value = f.supplier || '';
  document.getElementById('fil-date').value = f.purchase_date || '';
  document.getElementById('fil-threshold').value = f.low_stock_threshold_g;
  document.getElementById('fil-notes').value = f.notes || '';
  document.getElementById('modal-filament-title').textContent = 'Editar Filamento';
  document.getElementById('modal-filament').classList.remove('hidden');
}

async function deleteFilament(id) {
  if (!confirm('Eliminar este filamento?')) return;
  await fetch(API + '/filaments/' + id, { method: 'DELETE' });
  loadAll();
}

// ============================================================
// RESIN CRUD
// ============================================================

async function saveResin(e) {
  e.preventDefault();
  const id = document.getElementById('res-id').value;
  const body = {
    brand: document.getElementById('res-brand').value,
    type: document.getElementById('res-type').value,
    color: document.getElementById('res-color').value,
    total_volume_ml: parseFloat(document.getElementById('res-volume').value),
    price: parseFloat(document.getElementById('res-price').value),
    currency: document.getElementById('res-currency').value,
    supplier: document.getElementById('res-supplier').value,
    purchase_date: document.getElementById('res-date').value || null,
    low_stock_threshold_ml: parseFloat(document.getElementById('res-threshold').value),
    notes: document.getElementById('res-notes').value
  };

  if (id) {
    body.remaining_volume_ml = parseFloat(document.getElementById('res-volume').value);
    await fetch(API + '/resins/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } else {
    await fetch(API + '/resins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }
  closeModal('resin');
  loadAll();
}

function editResin(id) {
  const r = allResins.find(x => x.id === id);
  if (!r) return;
  document.getElementById('res-id').value = r.id;
  document.getElementById('res-brand').value = r.brand;
  document.getElementById('res-type').value = r.type;
  document.getElementById('res-color').value = r.color;
  document.getElementById('res-volume').value = r.total_volume_ml;
  document.getElementById('res-price').value = r.price;
  document.getElementById('res-currency').value = r.currency;
  document.getElementById('res-supplier').value = r.supplier || '';
  document.getElementById('res-date').value = r.purchase_date || '';
  document.getElementById('res-threshold').value = r.low_stock_threshold_ml;
  document.getElementById('res-notes').value = r.notes || '';
  document.getElementById('modal-resin-title').textContent = 'Editar Resina';
  document.getElementById('modal-resin').classList.remove('hidden');
}

async function deleteResin(id) {
  if (!confirm('Eliminar esta resina?')) return;
  await fetch(API + '/resins/' + id, { method: 'DELETE' });
  loadAll();
}

// ============================================================
// PAINT CRUD
// ============================================================

async function savePaint(e) {
  e.preventDefault();
  const id = document.getElementById('pnt-id').value;
  const body = {
    brand: document.getElementById('pnt-brand').value,
    type: document.getElementById('pnt-type').value,
    color: document.getElementById('pnt-color').value,
    total_volume_ml: parseFloat(document.getElementById('pnt-volume').value),
    price: parseFloat(document.getElementById('pnt-price').value),
    currency: document.getElementById('pnt-currency').value,
    supplier: document.getElementById('pnt-supplier').value,
    purchase_date: document.getElementById('pnt-date').value || null,
    low_stock_threshold_ml: parseFloat(document.getElementById('pnt-threshold').value),
    notes: document.getElementById('pnt-notes').value
  };

  if (id) {
    body.remaining_volume_ml = parseFloat(document.getElementById('pnt-volume').value);
    await fetch(API + '/paints/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } else {
    await fetch(API + '/paints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }
  closeModal('paint');
  loadAll();
}

function editPaint(id) {
  const p = allPaints.find(x => x.id === id);
  if (!p) return;
  document.getElementById('pnt-id').value = p.id;
  document.getElementById('pnt-brand').value = p.brand;
  document.getElementById('pnt-type').value = p.type;
  document.getElementById('pnt-color').value = p.color;
  document.getElementById('pnt-volume').value = p.total_volume_ml;
  document.getElementById('pnt-price').value = p.price;
  document.getElementById('pnt-currency').value = p.currency;
  document.getElementById('pnt-supplier').value = p.supplier || '';
  document.getElementById('pnt-date').value = p.purchase_date || '';
  document.getElementById('pnt-threshold').value = p.low_stock_threshold_ml;
  document.getElementById('pnt-notes').value = p.notes || '';
  document.getElementById('modal-paint-title').textContent = 'Editar Pintura';
  document.getElementById('modal-paint').classList.remove('hidden');
}

async function deletePaint(id) {
  if (!confirm('Eliminar esta pintura?')) return;
  await fetch(API + '/paints/' + id, { method: 'DELETE' });
  loadAll();
}

// ============================================================
// USAGE
// ============================================================

async function loadMaterialOptions() {
  const type = document.getElementById('use-type').value;
  const select = document.getElementById('use-material');
  const unitLabel = document.getElementById('use-unit-label');

  if (type === 'filament') {
    unitLabel.textContent = '(gramos)';
    const res = await fetch(API + '/filaments');
    const data = await res.json();
    select.innerHTML = data.map(f => '<option value="' + f.id + '">' + f.brand + ' - ' + f.material + ' ' + f.color + ' (' + f.remaining_weight_g + 'g restantes)</option>').join('');
  } else if (type === 'resin') {
    unitLabel.textContent = '(ml)';
    const res = await fetch(API + '/resins');
    const data = await res.json();
    select.innerHTML = data.map(r => '<option value="' + r.id + '">' + r.brand + ' - ' + r.type + ' ' + r.color + ' (' + r.remaining_volume_ml + 'ml restantes)</option>').join('');
  } else if (type === 'paint') {
    unitLabel.textContent = '(ml)';
    const res = await fetch(API + '/paints');
    const data = await res.json();
    select.innerHTML = data.map(p => '<option value="' + p.id + '">' + p.brand + ' - ' + p.type + ' ' + p.color + ' (' + p.remaining_volume_ml + 'ml restantes)</option>').join('');
  } else {
    select.innerHTML = '<option value="">Primero selecciona tipo...</option>';
  }
}

async function saveUsage(e) {
  e.preventDefault();
  const body = {
    material_type: document.getElementById('use-type').value,
    material_id: parseInt(document.getElementById('use-material').value),
    amount_used: parseFloat(document.getElementById('use-amount').value),
    project_name: document.getElementById('use-project').value,
    notes: document.getElementById('use-notes').value
  };
  const res = await fetch(API + '/usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error);
    return;
  }
  closeModal('usage');
  loadAll();
}

function quickUse(type, id, name) {
  const unitText = type === 'filament' ? 'gramos' : 'ml';
  const amount = prompt('Cantidad usada de "' + name + '" (' + unitText + '):');
  if (!amount || isNaN(amount)) return;
  const project = prompt('Nombre del proyecto (opcional):') || '';
  fetch(API + '/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ material_type: type, material_id: id, amount_used: parseFloat(amount), project_name: project })
  }).then(res => {
    if (!res.ok) return res.json().then(e => alert(e.error));
    loadAll();
  });
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getMaterialName(type, id) {
  if (type === 'filament') {
    const f = allFilaments.find(x => x.id === id);
    return f ? f.brand + ' ' + f.material + ' ' + f.color : 'ID: ' + id;
  }
  if (type === 'resin') {
    const r = allResins.find(x => x.id === id);
    return r ? r.brand + ' ' + r.type + ' ' + r.color : 'ID: ' + id;
  }
  if (type === 'paint') {
    const p = allPaints.find(x => x.id === id);
    return p ? p.brand + ' ' + p.type + ' ' + p.color : 'ID: ' + id;
  }
  return 'ID: ' + id;
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

const COLOR_MAP = {
  negro: '#2d2d2d', black: '#2d2d2d', blanco: '#f5f5f5', white: '#f5f5f5',
  rojo: '#e74c3c', red: '#e74c3c', azul: '#3498db', blue: '#3498db',
  verde: '#27ae60', green: '#27ae60', amarillo: '#f1c40f', yellow: '#f1c40f',
  naranja: '#e67e22', orange: '#e67e22', rosa: '#e91e8a', pink: '#e91e8a',
  morado: '#9b59b6', purple: '#9b59b6', gris: '#95a5a6', gray: '#95a5a6', grey: '#95a5a6',
  transparente: '#e0e0e0', clear: '#e0e0e0', natural: '#f5e6c8',
  dorado: '#d4a017', gold: '#d4a017', plateado: '#c0c0c0', silver: '#c0c0c0',
  marron: '#8B4513', brown: '#8B4513', cafe: '#8B4513',
  celeste: '#87CEEB', cyan: '#00BCD4', turquesa: '#40E0D0',
  crema: '#FFFDD0', beige: '#F5F5DC',
};

function getColorHex(colorName) {
  return COLOR_MAP[colorName.toLowerCase()] || '#b0b0b0';
}

function colorDot(colorName) {
  const hex = getColorHex(colorName);
  return '<span class="color-dot" style="background:' + hex + '"></span>';
}

// Initial load
loadAll();
