const API = 'https://cattle-invo-production.up.railway.app/api';

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'काहीतरी चूक झाली');
    return data;
  } catch (err) {
    throw err;
  }
}

const rupee = (n) => '₹' + (parseFloat(n) || 0).toLocaleString('mr-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const marathiDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('mr-IN', { year: 'numeric', month: 'long', day: 'numeric' });
};

const marathiMonths = [
  '', 'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
];

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3000);
}

function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modal').classList.add('open');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal')) return;
  document.getElementById('modal').classList.remove('open');
}

function closeModalDirect() {
  document.getElementById('modal').classList.remove('open');
}

function statusBadge(s) {
  if (s === 'पूर्ण_भरलेले') return `<span class="badge badge-green">✅ पूर्ण भरलेले</span>`;
  if (s === 'अंशतः_भरलेले') return `<span class="badge badge-gold">🔶 अंशतः भरलेले</span>`;
  return `<span class="badge badge-red">⏳ उधार</span>`;
}
