async function renderBills() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading">⏳ लोड होत आहे...</div>`;

  try {
    const now = new Date();
    const bills = await apiFetch(`/bills?महिना=${now.getMonth()+1}&वर्ष=${now.getFullYear()}`);

    c.innerHTML = `
      <div class="page-header">
        <h2>📋 सर्व बिले</h2>
        <button class="btn btn-primary" onclick="showPage('newbill')">➕ नवीन बिल</button>
      </div>

      <!-- Filters -->
      <div class="search-bar">
        <select id="bMonth" onchange="filterBills()">
          ${marathiMonths.slice(1).map((m, i) => `<option value="${i+1}" ${i+1===now.getMonth()+1?'selected':''}>${m}</option>`).join('')}
        </select>
        <select id="bYear" onchange="filterBills()">
          ${[now.getFullYear()-1, now.getFullYear()].map(y => `<option value="${y}" ${y===now.getFullYear()?'selected':''}>${y}</option>`).join('')}
        </select>
        <select id="bStatus" onchange="filterBills()">
          <option value="">सर्व स्थिती</option>
          <option value="पूर्ण_भरलेले">पूर्ण भरलेले</option>
          <option value="अंशतः_भरलेले">अंशतः भरलेले</option>
          <option value="उधार">उधार</option>
        </select>
        <input type="text" id="bSearch" placeholder="🔍 ग्राहक / बिल क्र. शोधा" oninput="searchBills()">
      </div>

      <div id="billsContainer">
        ${renderBillsTable(bills)}
      </div>
    `;
  } catch (err) {
    c.innerHTML = `<div class="alert-box">❌ ${err.message}</div>`;
  }
}

function renderBillsTable(bills) {
  if (!bills.length) {
    return `<div class="card"><div class="empty-state"><div class="empty-icon">📋</div><p>या महिन्यात कोणतेही बिल नाही</p></div></div>`;
  }
  const total = bills.reduce((s, b) => s + b.अंतिम_रक्कम, 0);
  const collected = bills.reduce((s, b) => s + b.दिलेली_रक्कम, 0);
  const pending = bills.reduce((s, b) => s + b.बाकी_रक्कम, 0);

  return `
    <div class="stats-grid" style="margin-bottom:16px">
      <div class="stat-card green"><div class="stat-icon">🧾</div><div class="stat-label">एकूण बिले</div><div class="stat-value">${bills.length}</div></div>
      <div class="stat-card gold"><div class="stat-icon">💵</div><div class="stat-label">एकूण विक्री</div><div class="stat-value gold">${rupee(total)}</div></div>
      <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-label">वसूल झाले</div><div class="stat-value green">${rupee(collected)}</div></div>
      <div class="stat-card red"><div class="stat-icon">⏳</div><div class="stat-label">उधार बाकी</div><div class="stat-value red">${rupee(pending)}</div></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table id="billsTable">
          <thead>
            <tr><th>बिल क्र.</th><th>ग्राहक</th><th>दिनांक</th><th>एकूण रक्कम</th><th>सूट</th><th>दिले</th><th>बाकी</th><th>स्थिती</th><th>कृती</th></tr>
          </thead>
          <tbody>
            ${bills.map(b => `
              <tr data-search="${(b.ग्राहक_नाव||'').toLowerCase()} ${b.बिल_क्रमांक.toLowerCase()}">
                <td><strong>${b.बिल_क्रमांक}</strong></td>
                <td>${b.ग्राहक_नाव || '<span style="color:var(--text-muted)">—</span>'}</td>
                <td>${marathiDate(b.बिल_दिनांक)}</td>
                <td>${rupee(b.अंतिम_रक्कम)}</td>
                <td style="color:var(--red)">${b.सूट_एकूण > 0 ? rupee(b.सूट_एकूण) : '—'}</td>
                <td style="color:var(--green)">${rupee(b.दिलेली_रक्कम)}</td>
                <td style="color:var(--red);font-weight:${b.बाकी_रक्कम > 0 ? '700' : '400'}">${rupee(b.बाकी_रक्कम)}</td>
                <td>${statusBadge(b.देयक_स्थिती)}</td>
                <td style="display:flex;gap:4px">
                  <button class="btn-icon" onclick="viewBill('${b._id}')" title="पहा">👁️</button>
                  ${b.बाकी_रक्कम > 0 ? `<button class="btn-icon" onclick="openPayBill('${b._id}','${b.बिल_क्रमांक}',${b.बाकी_रक्कम},'${b.ग्राहक_नाव||''}'); " title="भरणा">💰</button>` : ''}
                  <button class="btn-icon" onclick="deleteBill('${b._id}')" title="काढा">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function filterBills() {
  const महिना = document.getElementById('bMonth').value;
  const वर्ष = document.getElementById('bYear').value;
  const स्थिती = document.getElementById('bStatus').value;
  let url = `/bills?महिना=${महिना}&वर्ष=${वर्ष}`;
  if (स्थिती) url += `&स्थिती=${encodeURIComponent(स्थिती)}`;
  try {
    const bills = await apiFetch(url);
    document.getElementById('billsContainer').innerHTML = renderBillsTable(bills);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function searchBills() {
  const q = document.getElementById('bSearch').value.toLowerCase();
  document.querySelectorAll('#billsTable tbody tr').forEach(row => {
    row.style.display = (row.dataset.search||'').includes(q) ? '' : 'none';
  });
}

async function viewBill(id) {
  const bill = await apiFetch(`/bills/${id}`);
  openModal(`
    <div class="modal-title">🧾 बिल - ${bill.बिल_क्रमांक}</div>
    <div class="bill-preview">
      <div class="bill-line"><span>ग्राहक:</span><strong>${bill.ग्राहक_नाव||'-'}</strong></div>
      <div class="bill-line"><span>दिनांक:</span><strong>${marathiDate(bill.बिल_दिनांक)}</strong></div>
      <hr>
      <table style="width:100%;font-size:13px">
        <thead><tr><th style="text-align:left">वस्तू</th><th>प्रमाण</th><th>किंमत</th><th>एकूण</th></tr></thead>
        <tbody>
          ${bill.वस्तू.map(i => `
            <tr>
              <td>${i.उत्पादन_नाव}</td>
              <td style="text-align:center">${i.प्रमाण} ${i.एकक}</td>
              <td style="text-align:right">${rupee(i.विक्री_किंमत)}</td>
              <td style="text-align:right"><strong>${rupee(i.एकूण)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <hr>
      ${bill.सूट_एकूण > 0 ? `<div class="bill-line"><span>सूट:</span><strong style="color:var(--red)">- ${rupee(bill.सूट_एकूण)}</strong></div>` : ''}
      <div class="bill-line total"><span>अंतिम रक्कम:</span><strong>${rupee(bill.अंतिम_रक्कम)}</strong></div>
      <div class="bill-line paid"><span>दिलेली रक्कम:</span><strong>${rupee(bill.दिलेली_रक्कम)}</strong></div>
      <div class="bill-line baki"><span>बाकी रक्कम:</span><strong>${rupee(bill.बाकी_रक्कम)}</strong></div>
      <div style="text-align:center;margin-top:8px">${statusBadge(bill.देयक_स्थिती)}</div>
      ${bill.नोट ? `<div style="margin-top:8px;font-size:13px;color:var(--text-muted)">नोट: ${bill.नोट}</div>` : ''}
    </div>
    <div style="display:flex;gap:10px;margin-top:16px">
      ${bill.बाकी_रक्कम > 0 ? `<button class="btn btn-gold" onclick="closeModalDirect();openPayBill('${bill._id}','${bill.बिल_क्रमांक}',${bill.बाकी_रक्कम},'${bill.ग्राहक_नाव||''}')">💰 भरणा घ्या</button>` : ''}
      <button class="btn btn-outline" onclick="window.print()">🖨️ प्रिंट</button>
      <button class="btn btn-outline" onclick="closeModalDirect()">बंद करा</button>
    </div>
  `);
}

async function deleteBill(id) {
  if (!confirm('हे बिल काढायचे आहे का? स्टॉक परत येईल.')) return;
  try {
    await apiFetch(`/bills/${id}`, { method: 'DELETE' });
    showToast('बिल काढले');
    renderBills();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
