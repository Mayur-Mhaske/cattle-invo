async function renderProducts() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading">⏳ लोड होत आहे...</div>`;

  try {
    const products = await apiFetch('/products');
    const lowStock = products.filter(p => p.स्टॉक <= p.किमान_स्टॉक);

    c.innerHTML = `
      <div class="page-header">
        <h2>📦 उत्पादने व गोदाम व्यवस्थापन</h2>
        <button class="btn btn-primary" onclick="openAddProduct()">➕ नवीन उत्पादन</button>
      </div>

      ${lowStock.length ? `<div class="alert-box">⚠️ <strong>कमी स्टॉक:</strong> ${lowStock.map(p => `${p.नाव} (${p.स्टॉक} ${p.एकक} शिल्लक)`).join(', ')}</div>` : ''}

      <div class="search-bar">
        <input type="text" id="prodSearch" placeholder="🔍 उत्पादन शोधा..." oninput="filterProducts()">
        <span style="color:var(--text-muted);font-size:13px">एकूण: ${products.length} उत्पादने</span>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table id="prodTable">
            <thead>
              <tr>
                <th>उत्पादन</th><th>श्रेणी</th><th>खरेदी किंमत</th><th>विक्री किंमत</th><th>नफा/एकक</th><th>स्टॉक</th><th>स्थिती</th><th>कृती</th>
              </tr>
            </thead>
            <tbody>
              ${products.length ? products.map(p => {
                const profit = p.विक्री_किंमत - p.खरेदी_किंमत;
                const lowS = p.स्टॉक <= p.किमान_स्टॉक;
                return `
                <tr data-name="${p.नाव.toLowerCase()}">
                  <td><strong>${p.नाव}</strong></td>
                  <td>${p.श्रेणी}</td>
                  <td>${rupee(p.खरेदी_किंमत)}</td>
                  <td>${rupee(p.विक्री_किंमत)}</td>
                  <td style="color:var(--green);font-weight:700">${rupee(profit)}</td>
                  <td><strong style="color:${lowS ? 'var(--red)' : 'var(--text)'}">${p.स्टॉक} ${p.एकक}</strong></td>
                  <td>${lowS ? '<span class="badge badge-red">कमी स्टॉक</span>' : '<span class="badge badge-green">✅ ठीक</span>'}</td>
                  <td>
                    <button class="btn-icon" onclick="openAddStock('${p._id}', '${p.नाव}', '${p.एकक}')" title="स्टॉक जोडा">➕</button>
                    <button class="btn-icon" onclick="editProduct('${p._id}')" title="संपादन">✏️</button>
                    <button class="btn-icon" onclick="deleteProduct('${p._id}')" title="काढा">🗑️</button>
                  </td>
                </tr>`;
              }).join('') : `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📦</div><p>अजून कोणतेही उत्पादन नाही</p></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    c.innerHTML = `<div class="alert-box">❌ ${err.message}</div>`;
  }
}

function filterProducts() {
  const q = document.getElementById('prodSearch').value.toLowerCase();
  document.querySelectorAll('#prodTable tbody tr').forEach(row => {
    row.style.display = (row.dataset.name||'').includes(q) ? '' : 'none';
  });
}

function openAddProduct() {
  openModal(`
    <div class="modal-title">➕ नवीन उत्पादन जोडा</div>
    <div class="form-group"><label>उत्पादनाचे नाव *</label><input id="pName" placeholder="उत्पादनाचे नाव"></div>
    <div class="form-row">
      <div class="form-group"><label>श्रेणी</label>
        <select id="pCat">
          <option>जनावरांचे खाद्य</option><option>पशुखाद्य</option><option>पक्षी खाद्य</option><option>इतर</option>
        </select>
      </div>
      <div class="form-group"><label>एकक</label>
        <select id="pUnit"><option>किलो</option><option>बॅग</option><option>लिटर</option><option>नग</option><option>क्विंटल</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>खरेदी किंमत (₹) *</label><input id="pBuy" type="number" min="0" placeholder="खरेदी किंमत"></div>
      <div class="form-group"><label>विक्री किंमत (₹) *</label><input id="pSell" type="number" min="0" placeholder="विक्री किंमत"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>सुरुवातीचा स्टॉक</label><input id="pStock" type="number" min="0" value="0" placeholder="0"></div>
      <div class="form-group"><label>किमान स्टॉक (सूचना)</label><input id="pMinStock" type="number" min="0" value="10" placeholder="10"></div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" onclick="saveProduct()">✅ जतन करा</button>
      <button class="btn btn-outline" onclick="closeModalDirect()">रद्द करा</button>
    </div>
  `);
}

async function saveProduct(id) {
  const नाव = document.getElementById('pName').value.trim();
  if (!नाव) return showToast('नाव टाका', 'error');
  const payload = {
    नाव,
    श्रेणी: document.getElementById('pCat').value,
    एकक: document.getElementById('pUnit').value,
    खरेदी_किंमत: parseFloat(document.getElementById('pBuy').value),
    विक्री_किंमत: parseFloat(document.getElementById('pSell').value),
    स्टॉक: parseFloat(document.getElementById('pStock').value) || 0,
    किमान_स्टॉक: parseFloat(document.getElementById('pMinStock').value) || 10
  };
  try {
    if (id) await apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
    showToast('✅ उत्पादन जतन झाले');
    closeModalDirect();
    renderProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function editProduct(id) {
  const p = await apiFetch(`/products/${id}`);
  openModal(`
    <div class="modal-title">✏️ उत्पादन संपादन</div>
    <div class="form-group"><label>नाव *</label><input id="pName" value="${p.नाव}"></div>
    <div class="form-row">
      <div class="form-group"><label>श्रेणी</label>
        <select id="pCat">
          ${['जनावरांचे खाद्य','पशुखाद्य','पक्षी खाद्य','इतर'].map(o => `<option ${p.श्रेणी===o?'selected':''}>${o}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>एकक</label>
        <select id="pUnit">${['किलो','बॅग','लिटर','नग','क्विंटल'].map(o => `<option ${p.एकक===o?'selected':''}>${o}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>खरेदी किंमत (₹)</label><input id="pBuy" type="number" value="${p.खरेदी_किंमत}"></div>
      <div class="form-group"><label>विक्री किंमत (₹)</label><input id="pSell" type="number" value="${p.विक्री_किंमत}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>स्टॉक</label><input id="pStock" type="number" value="${p.स्टॉक}"></div>
      <div class="form-group"><label>किमान स्टॉक</label><input id="pMinStock" type="number" value="${p.किमान_स्टॉक}"></div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" onclick="saveProduct('${id}')">✅ जतन करा</button>
      <button class="btn btn-outline" onclick="closeModalDirect()">रद्द करा</button>
    </div>
  `);
}

function openAddStock(id, नाव, एकक) {
  openModal(`
    <div class="modal-title">📦 ${नाव} - स्टॉक जोडा</div>
    <div class="form-group">
      <label>किती ${एकक} जोडायचे आहेत?</label>
      <input id="addStockQty" type="number" min="1" placeholder="प्रमाण" autofocus>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" onclick="addStock('${id}')">✅ स्टॉक जोडा</button>
      <button class="btn btn-outline" onclick="closeModalDirect()">रद्द करा</button>
    </div>
  `);
}

async function addStock(id) {
  const qty = parseFloat(document.getElementById('addStockQty').value);
  if (!qty || qty <= 0) return showToast('योग्य प्रमाण टाका', 'error');
  try {
    await apiFetch(`/products/${id}/stock-add`, { method: 'PATCH', body: JSON.stringify({ प्रमाण: qty }) });
    showToast(`✅ स्टॉक जोडला गेला`);
    closeModalDirect();
    renderProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('हे उत्पादन काढायचे आहे का?')) return;
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    showToast('उत्पादन काढले');
    renderProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
