async function renderReports() {
  const c = document.getElementById('content');
  const now = new Date();

  c.innerHTML = `
    <div class="page-header">
      <h2>📈 मासिक अहवाल</h2>
    </div>
    <div class="search-bar" style="margin-bottom:20px">
      <select id="rMonth">
        ${marathiMonths.slice(1).map((m, i) => `<option value="${i+1}" ${i+1===now.getMonth()+1?'selected':''}>${m}</option>`).join('')}
      </select>
      <select id="rYear">
        ${[now.getFullYear()-1, now.getFullYear()].map(y => `<option value="${y}" ${y===now.getFullYear()?'selected':''}>${y}</option>`).join('')}
      </select>
      <button class="btn btn-primary" onclick="loadReport()">📊 अहवाल पहा</button>
    </div>
    <div id="reportContent"><div class="loading">महिना निवडा आणि 'अहवाल पहा' वर क्लिक करा</div></div>
  `;
}

async function loadReport() {
  const महिना = document.getElementById('rMonth').value;
  const वर्ष = document.getElementById('rYear').value;
  const div = document.getElementById('reportContent');
  div.innerHTML = `<div class="loading">⏳ अहवाल तयार होत आहे...</div>`;

  try {
    const d = await apiFetch(`/reports/monthly?महिना=${महिना}&वर्ष=${वर्ष}`);
    const monthName = marathiMonths[parseInt(महिना)];
    const isProfitable = d.निव्वळ_नफा >= 0;

    div.innerHTML = `
      <!-- Profit Banner -->
      <div class="profit-banner ${isProfitable ? '' : 'loss'}">
        <div class="profit-label">${monthName} ${वर्ष} - निव्वळ नफा</div>
        <div class="profit-value">${rupee(d.निव्वळ_नफा)}</div>
        <div style="font-size:13px;opacity:0.8;margin-top:4px">
          (विक्री ${rupee(d.एकूण_विक्री)} - खर्च ${rupee(d.एकूण_खर्च)} - माल खरेदी ${rupee(d.खरेदी_किंमत_एकूण)})
        </div>
      </div>

      <!-- Key Numbers -->
      <div class="stats-grid" style="margin-bottom:24px">
        <div class="stat-card green">
          <div class="stat-icon">🧾</div>
          <div class="stat-label">एकूण विक्री</div>
          <div class="stat-value green">${rupee(d.एकूण_विक्री)}</div>
        </div>
        <div class="stat-card gold">
          <div class="stat-icon">💰</div>
          <div class="stat-label">वसूल झालेले</div>
          <div class="stat-value gold">${rupee(d.वसूल_झालेले)}</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">📌</div>
          <div class="stat-label">उधार बाकी (एकूण)</div>
          <div class="stat-value red">${rupee(d.एकूण_उधार_बाकी)}</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">📅</div>
          <div class="stat-label">अपेक्षित उत्पन्न</div>
          <div class="stat-value">${rupee(d.अपेक्षित_उत्पन्न)}</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">💸</div>
          <div class="stat-label">एकूण खर्च</div>
          <div class="stat-value red">${rupee(d.एकूण_खर्च)}</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">📉</div>
          <div class="stat-label">एकूण सूट दिली</div>
          <div class="stat-value">${rupee(d.एकूण_सूट)}</div>
        </div>
      </div>

      <div class="grid-2" style="gap:20px;margin-bottom:20px">
        <!-- Bill Status -->
        <div class="card">
          <div class="card-title">🧾 बिल स्थिती (${d.एकूण_बिले} बिले)</div>
          <div class="bill-line">
            <span>✅ पूर्ण भरलेले:</span>
            <strong style="color:var(--green)">${d.बिल_स्थिती.पूर्ण_भरलेले} बिले</strong>
          </div>
          <div class="bill-line">
            <span>🔶 अंशतः भरलेले:</span>
            <strong style="color:var(--gold)">${d.बिल_स्थिती.अंशतः_भरलेले} बिले</strong>
          </div>
          <div class="bill-line">
            <span>⏳ उधार:</span>
            <strong style="color:var(--red)">${d.बिल_स्थिती.उधार} बिले</strong>
          </div>
        </div>

        <!-- Profit Breakdown -->
        <div class="card">
          <div class="card-title">📊 नफा तपशील</div>
          <div class="bill-line"><span>विक्री रक्कम:</span><strong>${rupee(d.एकूण_विक्री)}</strong></div>
          <div class="bill-line"><span>माल खरेदी किंमत:</span><strong style="color:var(--red)">- ${rupee(d.खरेदी_किंमत_एकूण)}</strong></div>
          <div class="bill-line"><span>सकल नफा:</span><strong style="color:var(--green)">${rupee(d.gross_profit)}</strong></div>
          <div class="bill-line"><span>एकूण खर्च:</span><strong style="color:var(--red)">- ${rupee(d.एकूण_खर्च)}</strong></div>
          <div class="bill-line total"><span>निव्वळ नफा:</span><strong style="color:${isProfitable?'var(--green)':'var(--red)'}">${rupee(d.निव्वळ_नफा)}</strong></div>
        </div>
      </div>

      <!-- Expenses Detail -->
      ${d.खर्च_तपशील.length ? `
        <div class="card" style="margin-bottom:20px">
          <div class="card-title">💸 खर्च तपशील (${monthName})</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>शीर्षक</th><th>श्रेणी</th><th>व्यक्ती</th><th>रक्कम</th><th>दिनांक</th></tr></thead>
              <tbody>
                ${d.खर्च_तपशील.map(e => `
                  <tr>
                    <td>${e.शीर्षक}</td>
                    <td>${e.श्रेणी.replace('_',' ')}</td>
                    <td>${e.व्यक्ती_नाव||'-'}</td>
                    <td style="color:var(--red);font-weight:700">${rupee(e.रक्कम)}</td>
                    <td>${marathiDate(e.दिनांक)}</td>
                  </tr>
                `).join('')}
                <tr style="background:var(--green-bg)">
                  <td colspan="3"><strong>एकूण खर्च</strong></td>
                  <td colspan="2"><strong style="color:var(--red)">${rupee(d.एकूण_खर्च)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- ग्राहक विक्री -->
      ${Object.keys(d.customerSales).length ? `
        <div class="card">
          <div class="card-title">👥 ग्राहकनिहाय विक्री (${monthName})</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ग्राहक</th><th>विक्री रक्कम</th></tr></thead>
              <tbody>
                ${Object.entries(d.customerSales)
                  .sort((a,b) => b[1]-a[1])
                  .map(([name, amt]) => `
                    <tr>
                      <td>${name}</td>
                      <td style="font-weight:700;color:var(--green)">${rupee(amt)}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Monthly note about payment tracking -->
      <div class="card" style="margin-top:20px;background:var(--green-bg);border:1.5px solid var(--border)">
        <div style="font-size:13px;color:var(--text-light)">
          📌 <strong>नोंद:</strong> "वसूल झालेले" म्हणजे ${monthName} महिन्यात प्रत्यक्ष मिळालेले पैसे (कोणत्याही महिन्याच्या बिलाचे असले तरी).
          "अपेक्षित उत्पन्न" म्हणजे सर्व उधार बिलांची बाकी रक्कम जी अजून मिळायची आहे.
        </div>
      </div>
    `;
  } catch (err) {
    div.innerHTML = `<div class="alert-box">❌ ${err.message}</div>`;
  }
}
