let billProducts = [];
let selectedItems = [];

async function renderNewBill() {
  const c = document.getElementById('content');
  
  try {
    const [customers, products] = await Promise.all([
      apiFetch('/customers'),
      apiFetch('/products')
    ]);
    billProducts = products;

    c.innerHTML = `
      <div class="page-header">
        <h2>🧾 नवीन बिल तयार करा</h2>
      </div>

      <div style="display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start">
        <!-- Left: Bill Form -->
        <div>
          <!-- Customer -->
          <div class="card" style="margin-bottom:16px">
            <div class="card-title">👤 ग्राहक निवडा</div>
            <div class="form-row">
              <div class="form-group">
                <label>विद्यमान ग्राहक</label>
                <select id="customerSelect" onchange="onCustomerSelect(this)">
                  <option value="">-- ग्राहक निवडा --</option>
                  ${customers.map(c => `<option value="${c._id}" data-name="${c.नाव}">${c.नाव} ${c.फोन ? '('+c.फोन+')' : ''}</option>`).join('')}
                  <option value="new">+ नवीन ग्राहक</option>
                </select>
              </div>
              <div class="form-group">
                <label>ग्राहकाचे नाव</label>
                <input type="text" id="customerName" placeholder="ग्राहकाचे नाव" required>
              </div>
            </div>
          </div>

          <!-- Add Items -->
          <div class="card" style="margin-bottom:16px">
            <div class="card-title">📦 वस्तू जोडा</div>
            <div class="form-row-3" style="margin-bottom:10px">
              <div class="form-group" style="margin:0">
                <label>उत्पादन</label>
                <select id="productSelect" onchange="onProductSelect(this)">
                  <option value="">-- उत्पादन निवडा --</option>
                  ${products.map(p => `<option value="${p._id}" data-price="${p.विक्री_किंमत}" data-stock="${p.स्टॉक}" data-unit="${p.एकक}">${p.नाव} (स्टॉक: ${p.स्टॉक} ${p.एकक})</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin:0">
                <label>प्रमाण (<span id="unitLabel">एकक</span>)</label>
                <input type="number" id="itemQty" min="1" value="1" placeholder="प्रमाण">
              </div>
              <div class="form-group" style="margin:0">
                <label>विक्री किंमत (मूळ: <span id="origPrice">-</span>)</label>
                <input type="number" id="itemPrice" min="0" placeholder="किंमत">
              </div>
            </div>
            <button class="btn btn-outline" onclick="addItemToBill()">➕ वस्तू जोडा</button>
          </div>

          <!-- Items Table -->
          <div class="card" style="margin-bottom:16px">
            <div class="card-title">🛒 निवडलेल्या वस्तू</div>
            <div class="bill-items-table" id="itemsTable">
              <div class="empty-state"><div class="empty-icon">🛒</div><p>अजून कोणतीही वस्तू जोडली नाही</p></div>
            </div>
          </div>

          <!-- Payment -->
          <div class="card">
            <div class="card-title">💳 देयक</div>
            <div class="form-row">
              <div class="form-group">
                <label>दिलेली रक्कम (₹)</label>
                <input type="number" id="paidAmount" min="0" value="0" placeholder="दिलेली रक्कम" oninput="updateBillSummary()">
              </div>
              <div class="form-group">
                <label>नोट (ऐच्छिक)</label>
                <input type="text" id="billNote" placeholder="बिलासाठी नोट">
              </div>
            </div>
            <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="saveBill()">
              ✅ बिल जतन करा
            </button>
          </div>
        </div>

        <!-- Right: Summary -->
        <div class="card" style="position:sticky;top:80px">
          <div class="card-title">📋 बिल सारांश</div>
          <div id="billSummary">
            <div class="bill-line"><span>एकूण वस्तू:</span><strong>0</strong></div>
            <div class="bill-line"><span>एकूण रक्कम:</span><strong>₹0</strong></div>
            <div class="bill-line"><span>एकूण सूट:</span><strong>₹0</strong></div>
            <div class="bill-line total"><span>अंतिम रक्कम:</span><strong>₹0</strong></div>
            <div class="bill-line paid"><span>दिलेली रक्कम:</span><strong>₹0</strong></div>
            <div class="bill-line baki"><span>बाकी रक्कम:</span><strong>₹0</strong></div>
            <hr>
            <div id="paymentStatus" style="text-align:center;margin-top:8px">
              <span class="badge badge-red">⏳ उधार</span>
            </div>
          </div>
        </div>
      </div>
    `;

    selectedItems = [];
  } catch (err) {
    c.innerHTML = `<div class="alert-box">❌ ${err.message}</div>`;
  }
}

function onCustomerSelect(sel) {
  const opt = sel.options[sel.selectedIndex];
  if (opt.value && opt.value !== 'new') {
    document.getElementById('customerName').value = opt.dataset.name || '';
  } else if (opt.value === 'new') {
    document.getElementById('customerName').value = '';
    document.getElementById('customerName').focus();
  }
}

function onProductSelect(sel) {
  const opt = sel.options[sel.selectedIndex];
  if (opt.value) {
    document.getElementById('itemPrice').value = opt.dataset.price || '';
    document.getElementById('origPrice').textContent = '₹' + opt.dataset.price;
    document.getElementById('unitLabel').textContent = opt.dataset.unit || 'एकक';
  }
}

function addItemToBill() {
  const pSel = document.getElementById('productSelect');
  const opt = pSel.options[pSel.selectedIndex];
  if (!opt.value) return showToast('उत्पादन निवडा', 'error');

  const qty = parseFloat(document.getElementById('itemQty').value);
  const price = parseFloat(document.getElementById('itemPrice').value);

  if (!qty || qty <= 0) return showToast('योग्य प्रमाण टाका', 'error');
  if (!price || price < 0) return showToast('योग्य किंमत टाका', 'error');
  if (qty > parseFloat(opt.dataset.stock)) return showToast(`फक्त ${opt.dataset.stock} ${opt.dataset.unit} स्टॉक उपलब्ध`, 'error');

  const origPrice = parseFloat(opt.dataset.price);
  const existingIdx = selectedItems.findIndex(i => i.उत्पादन_id === opt.value);

  if (existingIdx >= 0) {
    selectedItems[existingIdx].प्रमाण += qty;
    selectedItems[existingIdx].एकूण = selectedItems[existingIdx].विक्री_किंमत * selectedItems[existingIdx].प्रमाण;
  } else {
    selectedItems.push({
      उत्पादन_id: opt.value,
      उत्पादन_नाव: opt.text.split(' (')[0],
      प्रमाण: qty,
      एकक: opt.dataset.unit,
      मूळ_किंमत: origPrice,
      विक्री_किंमत: price,
      एकूण: price * qty
    });
  }

  pSel.selectedIndex = 0;
  document.getElementById('itemQty').value = 1;
  document.getElementById('itemPrice').value = '';
  document.getElementById('origPrice').textContent = '-';
  renderItemsTable();
  updateBillSummary();
}

function removeItem(idx) {
  selectedItems.splice(idx, 1);
  renderItemsTable();
  updateBillSummary();
}

function renderItemsTable() {
  const div = document.getElementById('itemsTable');
  if (!selectedItems.length) {
    div.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>अजून कोणतीही वस्तू जोडली नाही</p></div>`;
    return;
  }
  div.innerHTML = `
    <table>
      <thead>
        <tr><th>उत्पादन</th><th>प्रमाण</th><th>मूळ किंमत</th><th>विक्री किंमत</th><th>सूट/एकक</th><th>एकूण</th><th></th></tr>
      </thead>
      <tbody>
        ${selectedItems.map((item, i) => `
          <tr>
            <td>${item.उत्पादन_नाव}</td>
            <td>${item.प्रमाण} ${item.एकक}</td>
            <td>${rupee(item.मूळ_किंमत)}</td>
            <td><input type="number" value="${item.विक्री_किंमत}" style="width:80px;padding:4px 6px" onchange="updateItemPrice(${i}, this.value)"></td>
            <td>${item.मूळ_किंमत > item.विक्री_किंमत ? `<span style="color:var(--red)">-${rupee(item.मूळ_किंमत - item.विक्री_किंमत)}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td><strong>${rupee(item.एकूण)}</strong></td>
            <td><button class="btn-icon" onclick="removeItem(${i})">🗑️</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateItemPrice(idx, val) {
  selectedItems[idx].विक्री_किंमत = parseFloat(val) || 0;
  selectedItems[idx].एकूण = selectedItems[idx].विक्री_किंमत * selectedItems[idx].प्रमाण;
  updateBillSummary();
}

function updateBillSummary() {
  const एकूण = selectedItems.reduce((s, i) => s + (i.मूळ_किंमत * i.प्रमाण), 0);
  const सूट = selectedItems.reduce((s, i) => s + ((i.मूळ_किंमत - i.विक्री_किंमत) * i.प्रमाण), 0);
  const अंतिम = एकूण - सूट;
  const paid = parseFloat(document.getElementById('paidAmount')?.value) || 0;
  const बाकी = अंतिम - paid;

  let status = 'उधार', badgeClass = 'badge-red';
  if (paid >= अंतिम && अंतिम > 0) { status = 'पूर्ण भरलेले'; badgeClass = 'badge-green'; }
  else if (paid > 0) { status = 'अंशतः भरलेले'; badgeClass = 'badge-gold'; }

  document.getElementById('billSummary').innerHTML = `
    <div class="bill-line"><span>एकूण वस्तू:</span><strong>${selectedItems.length}</strong></div>
    <div class="bill-line"><span>एकूण रक्कम:</span><strong>${rupee(एकूण)}</strong></div>
    <div class="bill-line"><span>एकूण सूट:</span><strong style="color:var(--red)">${rupee(सूट)}</strong></div>
    <div class="bill-line total"><span>अंतिम रक्कम:</span><strong>${rupee(अंतिम)}</strong></div>
    <div class="bill-line paid"><span>दिलेली रक्कम:</span><strong>${rupee(paid)}</strong></div>
    <div class="bill-line baki"><span>बाकी रक्कम:</span><strong>${rupee(Math.max(0, बाकी))}</strong></div>
    <hr>
    <div style="text-align:center;margin-top:8px"><span class="badge ${badgeClass}">${status}</span></div>
  `;
}

async function saveBill() {
  const customerSel = document.getElementById('customerSelect');
  const customerName = document.getElementById('customerName').value.trim();
  const paid = parseFloat(document.getElementById('paidAmount').value) || 0;
  const note = document.getElementById('billNote').value;

  if (!customerName) return showToast('ग्राहकाचे नाव टाका', 'error');
  if (!selectedItems.length) return showToast('किमान एक वस्तू जोडा', 'error');

  const payload = {
    ग्राहक_id: customerSel.value && customerSel.value !== 'new' ? customerSel.value : null,
    ग्राहक_नाव: customerName,
    वस्तू: selectedItems,
    दिलेली_रक्कम: paid,
    नोट: note
  };

  try {
    const bill = await apiFetch('/bills', { method: 'POST', body: JSON.stringify(payload) });
    showToast(`✅ बिल ${bill.बिल_क्रमांक} यशस्वीरीत्या जतन झाले!`);
    selectedItems = [];
    showBillReceipt(bill);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showBillReceipt(bill) {
  openModal(`
    <div class="modal-title">🧾 बिल यशस्वी!</div>
    <div class="bill-preview">
      <h3>🌾 शेतकरी बिलिंग सिस्टम</h3>
      <div class="bill-sub">जनावरांचे खाद्य व्यवसाय</div>
      <hr>
      <div class="bill-line"><span>बिल क्रमांक:</span><strong>${bill.बिल_क्रमांक}</strong></div>
      <div class="bill-line"><span>ग्राहक:</span><strong>${bill.ग्राहक_नाव}</strong></div>
      <div class="bill-line"><span>दिनांक:</span><strong>${marathiDate(bill.बिल_दिनांक)}</strong></div>
      <hr>
      ${bill.वस्तू.map(i => `
        <div class="bill-line">
          <span>${i.उत्पादन_नाव} × ${i.प्रमाण} ${i.एकक}</span>
          <strong>${rupee(i.एकूण)}</strong>
        </div>
      `).join('')}
      <div class="bill-line total"><span>अंतिम रक्कम:</span><strong>${rupee(bill.अंतिम_रक्कम)}</strong></div>
      <div class="bill-line paid"><span>दिलेली रक्कम:</span><strong>${rupee(bill.दिलेली_रक्कम)}</strong></div>
      <div class="bill-line baki"><span>बाकी रक्कम:</span><strong>${rupee(bill.बाकी_रक्कम)}</strong></div>
      <hr>
      <div style="text-align:center">${statusBadge(bill.देयक_स्थिती)}</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="btn btn-primary" onclick="window.print()">🖨️ प्रिंट करा</button>
      <button class="btn btn-outline" onclick="closeModalDirect();showPage('newbill')">➕ नवीन बिल</button>
      <button class="btn btn-outline" onclick="closeModalDirect();showPage('bills')">📋 सर्व बिले</button>
    </div>
  `);
}
