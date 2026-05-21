async function renderDashboard() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading">⏳ डेटा लोड होत आहे...</div>`;

  try {
    const d = await apiFetch('/reports/dashboard');

    c.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card green">
          <div class="stat-icon">💵</div>
          <div class="stat-label">या महिन्याची विक्री</div>
          <div class="stat-value green">${rupee(d.या_महिन्याची_विक्री)}</div>
        </div>
        <div class="stat-card gold">
          <div class="stat-icon">💰</div>
          <div class="stat-label">या महिन्याचे वसूल</div>
          <div class="stat-value gold">${rupee(d.या_महिन्याचे_वसूल)}</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">📌</div>
          <div class="stat-label">एकूण उधार बाकी</div>
          <div class="stat-value red">${rupee(d.एकूण_उधार)}</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">👥</div>
          <div class="stat-label">एकूण ग्राहक</div>
          <div class="stat-value">${d.एकूण_ग्राहक}</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">📦</div>
          <div class="stat-label">एकूण उत्पादने</div>
          <div class="stat-value">${d.एकूण_उत्पादने}</div>
        </div>
        <div class="stat-card ${d.कमी_स्टॉक > 0 ? 'red' : 'green'}">
          <div class="stat-icon">⚠️</div>
          <div class="stat-label">कमी स्टॉक</div>
          <div class="stat-value ${d.कमी_स्टॉक > 0 ? 'red' : 'green'}">${d.कमी_स्टॉक}</div>
        </div>
      </div>

      ${d.कमी_स्टॉक > 0 ? `
        <div class="alert-box">
          ⚠️ <strong>कमी स्टॉक सूचना:</strong> 
          ${d.कमी_स्टॉक_उत्पादने.map(p => `${p.नाव} (${p.स्टॉक} ${p.एकक})`).join(', ')} - स्टॉक भरणे आवश्यक आहे!
        </div>` : ''}

      <div class="grid-2" style="gap:16px">
        <div class="card">
          <div class="card-title">🚀 त्वरित कृती</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button class="btn btn-primary" onclick="showPage('newbill')">🧾 नवीन बिल तयार करा</button>
            <button class="btn btn-gold" onclick="showPage('payments')">💰 उधार भरणा घ्या</button>
            <button class="btn btn-outline" onclick="showPage('expenses')">💸 खर्च नोंदवा</button>
            <button class="btn btn-outline" onclick="showPage('products')">📦 स्टॉक अपडेट करा</button>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📊 आजचा सारांश</div>
          <div id="todaySummary"><div class="loading">लोड होत आहे...</div></div>
        </div>
      </div>
    `;

    // Today's summary
    const today = new Date();
    const bills = await apiFetch(`/bills?महिना=${today.getMonth()+1}&वर्ष=${today.getFullYear()}`);
    const todayBills = bills.filter(b => new Date(b.बिल_दिनांक).toDateString() === today.toDateString());

    document.getElementById('todaySummary').innerHTML = `
      <div class="bill-line"><span>आजची बिले:</span><strong>${todayBills.length}</strong></div>
      <div class="bill-line"><span>आजची विक्री:</span><strong>${rupee(todayBills.reduce((s,b) => s+b.अंतिम_रक्कम, 0))}</strong></div>
      <div class="bill-line"><span>आजचे वसूल:</span><strong>${rupee(todayBills.reduce((s,b) => s+b.दिलेली_रक्कम, 0))}</strong></div>
      <hr>
      <div style="text-align:center;margin-top:8px">
        <button class="btn btn-outline btn-sm" onclick="showPage('reports')">📈 महिन्याचा अहवाल पहा</button>
      </div>
    `;

  } catch (err) {
    c.innerHTML = `<div class="alert-box">❌ डेटा लोड अयशस्वी: ${err.message}<br><small>MongoDB चालू आहे का? mongodb://localhost:27017</small></div>`;
  }
}
