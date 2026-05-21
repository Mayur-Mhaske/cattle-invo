async function renderCustomers() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading">⏳ लोड होत आहे...</div>`;

  try {
    const customers = await apiFetch('/customers');

    c.innerHTML = `
      <div class="page-header">
        <h2>👥 ग्राहक व्यवस्थापन</h2>
        <button class="btn btn-primary" onclick="openAddCustomer()">➕ नवीन ग्राहक</button>
      </div>
      <div class="search-bar">
        <input type="text" id="custSearch" placeholder="🔍 ग्राहक शोधा..." oninput="filterCustomers()" style="max-width:280px">
        <span style="color:var(--text-muted);font-size:13px">एकूण: ${customers.length} ग्राहक</span>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table id="custTable">
            <thead>
              <tr>
                <th>नाव</th><th>फोन</th><th>पत्ता</th><th>उधार बाकी</th><th>नोंदणी</th><th>कृती</th>
              </tr>
            </thead>
            <tbody>
              ${customers.length ? customers.map(cu => `
                <tr data-name="${cu.नाव.toLowerCase()}">
                  <td><strong>${cu.नाव}</strong></td>
                  <td>${cu.फोन || '-'}</td>
                  <td>${cu.पत्ता || '-'}</td>
                  <td><span style="color:${cu.एकूण_उधार > 0 ? 'var(--red)' : 'var(--green)'};font-weight:700">${rupee(cu.एकूण_उधार)}</span></td>
                  <td>${marathiDate(cu.नोंदणी_दिनांक)}</td>
                  <td>
                    <button class="btn-icon" onclick="viewCustomer('${cu._id}')" title="इतिहास">👁️</button>
                    <button class="btn-icon" onclick="editCustomer('${cu._id}', '${cu.नाव}', '${cu.फोन||''}', '${cu.पत्ता||''}')" title="संपादन">✏️</button>
                    <button class="btn-icon" onclick="deleteCustomer('${cu._id}')" title="काढा">🗑️</button>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👥</div><p>अजून कोणतेही ग्राहक नाहीत</p></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    c.innerHTML = `<div class="alert-box">❌ ${err.message}</div>`;
  }
}

function filterCustomers() {
  const q = document.getElementById('custSearch').value.toLowerCase();
  document.querySelectorAll('#custTable tbody tr').forEach(row => {
    row.style.display = row.dataset.name?.includes(q) ? '' : 'none';
  });
}

function openAddCustomer() {
  openModal(`
    <div class="modal-title">➕ नवीन ग्राहक जोडा</div>
    <div class="form-group"><label>नाव *</label><input id="cName" placeholder="ग्राहकाचे नाव"></div>
    <div class="form-group"><label>फोन नंबर</label><input id="cPhone" placeholder="फोन नंबर" type="tel"></div>
    <div class="form-group"><label>पत्ता</label><textarea id="cAddr" placeholder="पत्ता"></textarea></div>
    <div style="display:flex;gap:10px;margin-top:4px">
      <button class="btn btn-primary" onclick="saveCustomer()">✅ जतन करा</button>
      <button class="btn btn-outline" onclick="closeModalDirect()">रद्द करा</button>
    </div>
  `);
}

async function saveCustomer(id) {
  const नाव = document.getElementById('cName').value.trim();
  if (!नाव) return showToast('नाव टाका', 'error');
  const payload = { नाव, फोन: document.getElementById('cPhone').value, पत्ता: document.getElementById('cAddr').value };
  try {
    if (id) await apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await apiFetch('/customers', { method: 'POST', body: JSON.stringify(payload) });
    showToast('✅ ग्राहक जतन झाला');
    closeModalDirect();
    renderCustomers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editCustomer(id, नाव, फोन, पत्ता) {
  openModal(`
    <div class="modal-title">✏️ ग्राहक संपादन</div>
    <div class="form-group"><label>नाव *</label><input id="cName" value="${नाव}" placeholder="नाव"></div>
    <div class="form-group"><label>फोन</label><input id="cPhone" value="${फोन}" type="tel"></div>
    <div class="form-group"><label>पत्ता</label><textarea id="cAddr">${पत्ता}</textarea></div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" onclick="saveCustomer('${id}')">✅ जतन करा</button>
      <button class="btn btn-outline" onclick="closeModalDirect()">रद्द करा</button>
    </div>
  `);
}

async function deleteCustomer(id) {
  if (!confirm('हा ग्राहक काढायचा आहे का?')) return;
  try {
    await apiFetch(`/customers/${id}`, { method: 'DELETE' });
    showToast('ग्राहक काढला');
    renderCustomers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function viewCustomer(id) {
  const { customer, bills, payments } = await apiFetch(`/customers/${id}`);
  const totalBilled = bills.reduce((s, b) => s + b.अंतिम_रक्कम, 0);
  const totalPaid = bills.reduce((s, b) => s + b.दिलेली_रक्कम, 0);

  openModal(`
    <div class="modal-title">👤 ${customer.नाव} - इतिहास</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="text-align:center;background:var(--green-bg);border-radius:8px;padding:12px">
        <div style="font-size:11px;color:var(--text-muted)">एकूण बिले</div>
        <div style="font-size:22px;font-weight:800">${bills.length}</div>
      </div>
      <div style="text-align:center;background:#fff3cd;border-radius:8px;padding:12px">
        <div style="font-size:11px;color:var(--text-muted)">एकूण विक्री</div>
        <div style="font-size:18px;font-weight:800">${rupee(totalBilled)}</div>
      </div>
      <div style="text-align:center;background:#f8d7da;border-radius:8px;padding:12px">
        <div style="font-size:11px;color:var(--text-muted)">उधार बाकी</div>
        <div style="font-size:18px;font-weight:800;color:var(--red)">${rupee(customer.एकूण_उधार)}</div>
      </div>
    </div>
    <div style="font-weight:700;margin-bottom:8px">📋 बिल इतिहास (${bills.length})</div>
    <div style="max-height:240px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
      <table><thead><tr><th>बिल क्र.</th><th>दिनांक</th><th>रक्कम</th><th>बाकी</th><th>स्थिती</th></tr></thead>
      <tbody>
        ${bills.map(b => `
          <tr>
            <td>${b.बिल_क्रमांक}</td>
            <td>${marathiDate(b.बिल_दिनांक)}</td>
            <td>${rupee(b.अंतिम_रक्कम)}</td>
            <td>${rupee(b.बाकी_रक्कम)}</td>
            <td>${statusBadge(b.देयक_स्थिती)}</td>
          </tr>
        `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">कोणतेही बिल नाही</td></tr>'}
      </tbody></table>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="btn btn-gold" onclick="closeModalDirect();showPage('payments')">💰 उधार भरणा</button>
      <button class="btn btn-outline" onclick="closeModalDirect()">बंद करा</button>
    </div>
  `);
}
