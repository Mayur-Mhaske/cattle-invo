async function renderPayments() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading">⏳ लोड होत आहे...</div>`;

  try {
    const bills = await apiFetch('/bills?स्थिती=उधार');
    const partialBills = await apiFetch('/bills?स्थिती=अंशतः_भरलेले');
    const allPending = [...bills, ...partialBills].sort((a, b) => new Date(b.बिल_दिनांक) - new Date(a.बिल_दिनांक));

    const totalUdhar = allPending.reduce((s, b) => s + b.बाकी_रक्कम, 0);

    c.innerHTML = `
      <div class="page-header">
        <h2>💰 उधार व देयके</h2>
        <div class="badge badge-red" style="font-size:15px;padding:8px 16px">एकूण उधार: ${rupee(totalUdhar)}</div>
      </div>

      <div class="card">
        <div class="card-title">⏳ उधार बिले (${allPending.length})</div>
        ${allPending.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>बिल क्र.</th><th>ग्राहक</th><th>दिनांक</th><th>एकूण</th><th>दिले</th><th>बाकी</th><th>स्थिती</th><th>कृती</th></tr>
              </thead>
              <tbody>
                ${allPending.map(b => `
                  <tr>
                    <td><strong>${b.बिल_क्रमांक}</strong></td>
                    <td>${b.ग्राहक_नाव || '-'}</td>
                    <td>${marathiDate(b.बिल_दिनांक)}</td>
                    <td>${rupee(b.अंतिम_रक्कम)}</td>
                    <td style="color:var(--green)">${rupee(b.दिलेली_रक्कम)}</td>
                    <td style="color:var(--red);font-weight:700">${rupee(b.बाकी_रक्कम)}</td>
                    <td>${statusBadge(b.देयक_स्थिती)}</td>
                    <td>
                      <button class="btn btn-gold btn-sm" onclick="openPayBill('${b._id}', '${b.बिल_क्रमांक}', ${b.बाकी_रक्कम}, '${b.ग्राहक_नाव||''}')">
                        💰 भरणा घ्या
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div class="empty-state"><div class="empty-icon">🎉</div><p>सर्व बिले भरलेली आहेत!</p></div>`}
      </div>

      <div class="card" style="margin-top:20px">
        <div class="card-title">📜 अलीकडील देयके</div>
        <div id="recentPayments"><div class="loading">लोड होत आहे...</div></div>
      </div>
    `;

    // Load recent payments
    const payments = await apiFetch('/payments');
    const recentDiv = document.getElementById('recentPayments');
    if (payments.length) {
      recentDiv.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>ग्राहक</th><th>बिल क्र.</th><th>रक्कम</th><th>दिनांक</th><th>नोट</th></tr></thead>
            <tbody>
              ${payments.slice(0, 30).map(p => `
                <tr>
                  <td>${p.ग्राहक_नाव || '-'}</td>
                  <td>${p.बिल_क्रमांक || '-'}</td>
                  <td style="color:var(--green);font-weight:700">${rupee(p.रक्कम)}</td>
                  <td>${marathiDate(p.देयक_दिनांक)}</td>
                  <td>${p.नोट || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      recentDiv.innerHTML = `<div class="empty-state"><div class="empty-icon">💸</div><p>अजून कोणतेही देयक नाही</p></div>`;
    }

  } catch (err) {
    c.innerHTML = `<div class="alert-box">❌ ${err.message}</div>`;
  }
}

function openPayBill(billId, billNo, बाकी, customerName) {
  openModal(`
    <div class="modal-title">💰 उधार भरणा - ${billNo}</div>
    <p style="color:var(--text-muted);margin-bottom:16px">ग्राहक: <strong>${customerName}</strong> | बाकी रक्कम: <strong style="color:var(--red)">${rupee(बाकी)}</strong></p>
    <div class="form-group">
      <label>दिलेली रक्कम (₹) *</label>
      <input id="payAmt" type="number" min="1" max="${बाकी}" value="${बाकी}" placeholder="रक्कम">
    </div>
    <div class="form-group">
      <label>देयक दिनांक</label>
      <input id="payDate" type="date" value="${new Date().toISOString().split('T')[0]}">
    </div>
    <div class="form-group">
      <label>नोट</label>
      <input id="payNote" placeholder="नोट (ऐच्छिक)">
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" onclick="submitPayment('${billId}')">✅ भरणा नोंदवा</button>
      <button class="btn btn-outline" onclick="closeModalDirect()">रद्द करा</button>
    </div>
  `);
}

async function submitPayment(billId) {
  const रक्कम = parseFloat(document.getElementById('payAmt').value);
  const देयक_दिनांक = document.getElementById('payDate').value;
  const नोट = document.getElementById('payNote').value;

  if (!रक्कम || रक्कम <= 0) return showToast('योग्य रक्कम टाका', 'error');

  try {
    await apiFetch(`/bills/${billId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ रक्कम, देयक_दिनांक, नोट })
    });
    showToast(`✅ ${rupee(रक्कम)} भरणा नोंदवला गेला`);
    closeModalDirect();
    renderPayments();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
