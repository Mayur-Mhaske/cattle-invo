const pageTitles = {
  dashboard: '📊 मुख्यपान',
  newbill: '🧾 नवीन बिल तयार करा',
  bills: '📋 सर्व बिले',
  customers: '👥 ग्राहक व्यवस्थापन',
  products: '📦 उत्पादने व गोदाम',
  payments: '💰 उधार व देयके',
  expenses: '💸 खर्च व्यवस्थापन',
  reports: '📈 मासिक अहवाल'
};

function showPage(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.getElementById('pageTitle').textContent = pageTitles[page] || page;

  const fns = {
    dashboard: renderDashboard,
    newbill: renderNewBill,
    bills: renderBills,
    customers: renderCustomers,
    products: renderProducts,
    payments: renderPayments,
    expenses: renderExpenses,
    reports: renderReports
  };

  if (fns[page]) fns[page]();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// Set date
document.getElementById('dateDisplay').textContent = new Date().toLocaleDateString('mr-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// Init
showPage('dashboard');
