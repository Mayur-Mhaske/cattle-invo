async function renderExpenses() {
  const c = document.getElementById('content');
  const now = new Date();
  const महिना = now.getMonth() + 1;
  const वर्ष = now.getFullYear();

  c.innerHTML = `<div class="loading">⏳ लोड होत आहे...</div>`;

  try {
    const expenses = await apiFetch(`/expenses?महिना=${महिना}&वर्ष=${वर्ष}`);
    const total = expenses.reduce((s, e) => s + e.रक्कम, 0);

    // Group by category
    const catTotals = {};
    expenses.forEach(e => {
      catTotals[e.श्रेणी] = (catTotals[e.श्रेणी] || 0) + e.रक्कम;
    });

    c.innerHTML = `
      <div class="page-header">
        <h2>💸 खर्च व्यवस्थापन</h2>
        <button class="btn btn-primary" onclick="openAddExpense()">➕ खर्च नोंदवा</button>
      </div>

      <!-- Month Selector -->
      <div class="search-bar" style="margin-bottom:16px">
        <select id="expMonth" onchange="loadExpenses()">
          ${marathiMonths.slice(1).map((m, i) => `<option value="${i+1}" ${i+1===महिना?'selected':''}>${m}</option>`).join('')}
        </select>
        <select id="expYear" onchange="loadExpenses()">
          ${[वर्ष-1, वर्ष, वर्ष+1].map(y => `<option value="${y}" ${y===वर्ष?'selected':''}>${y}</option>`).join('')}
        </select>
      </div>

      <div class="stats-grid" id="expStats">
        <div class="stat-card red">
          <div class="stat-icon">💸</div>
          <div class="stat-label">एकूण खर्च</div>
          <div class="stat-value red">${rupee(total)}</div>
        </div>
        ${Object.entries(catTotals).map(([cat, amt]) => `
          <div class="stat-card gold">
            <div class="stat-icon">📌</div>
            <div class="stat-label">${cat.replace('_', ' ')}</div>
            <div class="stat-value">${rupee(amt)}</div>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-title">📋 खर्च यादी</div>
        <div class="table-wrap" id="expTable">
          ${renderExpTable(expenses)}
        </div>
      </div>
    `;
  } catch (err) {
    c.innerHTML = `<div class="alert-box">❌ ${err.message}</div>`;
  }
}

function renderExpTable(expenses) {
  if (!expenses.length) return `<div class="empty-state"><div class="empty-icon">💸</div><p>या महिन्यात कोणताही खर्च नाही</p></div>`;
  return `
    <table>
      <thead><tr><th>शीर्षक</th><th>श्रेणी</th><th>व्यक्ती</th><th>रक्कम</th><th>दिनांक</th><th>नोट</th><th>कृती</th></tr></thead>
      <tbody>
        ${expenses.map(e => `
          <tr>
            <td><strong>${e.शीर्षक}</strong></td>
            <td><span class="badge badge-blue">${e.श्रेणी.replace('_', ' ')}</span></td>
            <td>${e.व्यक्ती_नाव || '-'}</td>
            <td style="color:var(--red);font-weight:700">${rupee(e.रक्कम)}</td>
            <td>${marathiDate(e.दिनांक)}</td>
            <td>${e.नोट || '-'}</td>
            <td>
              <button class="btn-icon" onclick="deleteExpense('${e._id}')">🗑️</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadExpenses() {
  const महिना = document.getElementById('expMonth').value;
  const वर्ष = document.getElementById('expYear').value;
  try {
    const expenses = await apiFetch(`/expenses?महिना=${महिना}&वर्ष=${वर्ष}`);
    document.getElementById('expTable').innerHTML = renderExpTable(expenses);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAddExpense() {
  openModal(`
    <div class="modal-title">➕ खर्च नोंदवा</div>
    <div class="form-group"><label>शीर्षक *</label><input id="eTitle" placeholder="खर्चाचे नाव (उदा. रामचा पगार)"></div>
    <div class="form-row">
      <div class="form-group"><label>श्रेणी</label>
        <select id="eCat">
          <option value="कामगार_वेतन">कामगार वेतन</option>
          <option value="गोदाम_भाडे">गोदाम भाडे</option>
          <option value="वाहतूक">वाहतूक</option>
          <option value="वीज_बिल">वीज बिल</option>
          <option value="इतर">इतर</option>
        </select>
      </div>
      <div class="form-group"><label>रक्कम (₹) *</label><input id="eAmt" type="number" min="0" placeholder="रक्कम"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>व्यक्तीचे नाव (कामगार असल्यास)</label><input id="ePerson" placeholder="नाव"></div>
      <div class="form-group"><label>दिनांक</label><input id="eDate" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
    </div>
    <div class="form-group"><label>नोट</label><textarea id="eNote" placeholder="अतिरिक्त माहिती"></textarea></div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" onclick="saveExpense()">✅ जतन करा</button>
      <button class="btn btn-outline" onclick="closeModalDirect()">रद्द करा</button>
    </div>
  `);
}

async function saveExpense() {
  const शीर्षक = document.getElementById('eTitle').value.trim();
  const रक्कम = parseFloat(document.getElementById('eAmt').value);
  if (!शीर्षक) return showToast('शीर्षक टाका', 'error');
  if (!रक्कम || रक्कम <= 0) return showToast('योग्य रक्कम टाका', 'error');

  const payload = {
    शीर्षक,
    श्रेणी: document.getElementById('eCat').value,
    रक्कम,
    व्यक्ती_नाव: document.getElementById('ePerson').value,
    दिनांक: document.getElementById('eDate').value,
    नोट: document.getElementById('eNote').value
  };

  try {
    await apiFetch('/expenses', { method: 'POST', body: JSON.stringify(payload) });
    showToast('✅ खर्च नोंदवला गेला');
    closeModalDirect();
    renderExpenses();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteExpense(id) {
  if (!confirm('हा खर्च काढायचा आहे का?')) return;
  try {
    await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
    showToast('खर्च काढला');
    renderExpenses();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
