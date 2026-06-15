const state = {
  coins: [],
  filtered: [],
  currency: 'usd',
  sortKey: 'rank',
  sortDir: 'asc',
  filter: 'all',
  searchQuery: '',
  watchlist: JSON.parse(localStorage.getItem('watchlist') || '[]'),
  prevPrices: {},
};

const SYMBOLS = { usd: '$', eur: '€', inr: '₹', gbp: '£' };
let currentCoinId = null;
let priceChart = null;

// ── DOM refs ───────────────────────────────────
const tableEl      = document.getElementById('crypto-table');
const tbodyEl      = document.getElementById('crypto-body');
const loadingEl    = document.getElementById('loading');
const errorEl      = document.getElementById('error-msg');
const emptyEl      = document.getElementById('empty-msg');
const searchEl     = document.getElementById('search-input');
const currencyEl   = document.getElementById('currency-select');
const refreshBtn   = document.getElementById('refresh-btn');
const lastUpdEl    = document.getElementById('last-updated');
const totalMcapEl  = document.getElementById('total-market-cap');
const totalVolEl   = document.getElementById('total-volume');
const btcDomEl     = document.getElementById('btc-dominance');
const activeCoinsEl= document.getElementById('active-coins');
const portfolioValEl = document.getElementById('portfolio-value');
const trendingSec  = document.getElementById('trending-section');

// ── Fetch data ─────────────────────────────────
async function fetchData() {
  showState('loading');
  try {
    const [coinsRes, globalRes] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/markets` +
        `?vs_currency=${state.currency}` +
        `&order=market_cap_desc` +
        `&per_page=50` +
        `&page=1` +
        `&sparkline=true` +                // ← CHANGED: enabled sparkline
        `&price_change_percentage=24h`
      ),
      fetch('https://api.coingecko.com/api/v3/global')
    ]);
    if (!coinsRes.ok) throw new Error('API error');
    const coinsData  = await coinsRes.json();
    const globalData = globalRes.ok ? await globalRes.json() : null;

    coinsData.forEach(c => {
      state.prevPrices[c.id] = state.coins.find(x => x.id === c.id)?.current_price ?? null;
    });

    state.coins = coinsData;
    updateGlobalStats(globalData);
    applyFilters();
    updatePortfolioValue();
    showState('table');
    lastUpdEl.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error(err);
    showState('error');
  }
}

// ── Global stats ───────────────────────────────
function updateGlobalStats(data) {
  if (!data?.data) return;
  const d = data.data;
  const sym = SYMBOLS[state.currency];
  totalMcapEl.textContent  = formatLarge(d.total_market_cap?.[state.currency], sym);
  totalVolEl.textContent   = formatLarge(d.total_volume?.[state.currency], sym);
  btcDomEl.textContent     = d.market_cap_percentage?.btc ? d.market_cap_percentage.btc.toFixed(1) + '%' : '—';
  activeCoinsEl.textContent = d.active_cryptocurrencies?.toLocaleString() ?? '—';
}

// ── Trending ───────────────────────────────────
async function loadTrending() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const data = await res.json();
    const coins = data.coins.slice(0, 5);
    const html = `
      <div style="font-size:0.9rem; margin-bottom:12px; color:#8892b0; text-transform:uppercase; letter-spacing:0.5px;">🔥 Trending</div>
      <div class="trending-grid">
        ${coins.map(({item:c}) => `
          <div class="trending-card" onclick="openCoinModal('${c.id}')">
            <img src="${c.thumb}" alt="${c.name}">
            <div>
              <div class="trending-name">${c.name}</div>
              <div class="trending-symbol">${c.symbol}</div>
            </div>
            <span class="trending-rank">#${c.market_cap_rank || 'N/A'}</span>
          </div>
        `).join('')}
      </div>
    `;
    trendingSec.innerHTML = html;
  } catch (e) { console.error('Trending error', e); }
}

// ── Portfolio ──────────────────────────────────
function updatePortfolioValue() {
  const portfolio = JSON.parse(localStorage.getItem('crypto_portfolio') || '{}');
  const sym = SYMBOLS[state.currency];
  let total = 0;
  state.coins.forEach(c => {
    if (portfolio[c.id]) total += portfolio[c.id] * c.current_price;
  });
  portfolioValEl.textContent = total > 0 ? formatPrice(total, sym) : sym + '0.00';
}

// ── Filters & Sort ─────────────────────────────
function applyFilters() {
  let coins = [...state.coins];
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    coins = coins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }
  if (state.filter === 'watchlist') coins = coins.filter(c => state.watchlist.includes(c.id));
  else if (state.filter === 'gainers') coins = coins.filter(c => (c.price_change_percentage_24h ?? 0) > 0);
  else if (state.filter === 'losers') coins = coins.filter(c => (c.price_change_percentage_24h ?? 0) < 0);

  coins.sort((a, b) => {
    let va, vb;
    switch (state.sortKey) {
      case 'rank':   va = a.market_cap_rank; vb = b.market_cap_rank; break;
      case 'price':  va = a.current_price; vb = b.current_price; break;
      case 'change': va = a.price_change_percentage_24h ?? 0; vb = b.price_change_percentage_24h ?? 0; break;
      case 'mcap':   va = a.market_cap; vb = b.market_cap; break;
      default:       va = a.market_cap_rank; vb = b.market_cap_rank;
    }
    return state.sortDir === 'asc' ? va - vb : vb - va;
  });
  state.filtered = coins;
  renderTable();
}

// ── Sparkline generator ────────────────────────
function generateSparkline(data, isUp) {
  if (!data || data.length < 2) return '—';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((p, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((p - min) / range) * 100;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = isUp ? '#64ffda' : '#ff6b6b';
  return `<svg viewBox="0 0 100 100" class="sparkline" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="2" points="${points}"/></svg>`;
}

// ── Render table ───────────────────────────────
function renderTable() {
  if (state.filtered.length === 0) { showState('empty'); return; }
  showState('table');
  const sym = SYMBOLS[state.currency];

  tbodyEl.innerHTML = state.filtered.map(coin => {
    const change  = coin.price_change_percentage_24h ?? 0;
    const isUp    = change >= 0;
    const watched = state.watchlist.includes(coin.id);
    const prev    = state.prevPrices[coin.id];
    let flashClass = '';
    if (prev !== null && prev !== undefined) {
      if (coin.current_price > prev) flashClass = 'flash-up';
      else if (coin.current_price < prev) flashClass = 'flash-down';
    }
    const sparkline = coin.sparkline_in_7d?.price ? generateSparkline(coin.sparkline_in_7d.price, isUp) : '<span style="color:#8892b0">—</span>';

    return `
      <tr class="${flashClass}" data-id="${coin.id}">
        <td class="td-rank">${coin.market_cap_rank}</td>
        <td>
          <div class="coin-cell">
            <img class="coin-icon" src="${coin.image}" alt="${coin.name}" loading="lazy" />
            <div class="coin-info">
              <span class="coin-name">${coin.name}</span>
              <span class="coin-symbol">${coin.symbol}</span>
            </div>
          </div>
        </td>
        <td class="td-price">${formatPrice(coin.current_price, sym)}</td>
        <td class="td-change ${isUp ? 'positive' : 'negative'}">
          ${isUp ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
        </td>
        <td class="td-spark td-hide-sm">${sparkline}</td>
        <td class="td-mcap td-hide-sm">${formatLarge(coin.market_cap, sym)}</td>
        <td class="td-volume td-hide-sm">${formatLarge(coin.total_volume, sym)}</td>
        <td>
          <button class="btn-watch ${watched ? 'watched' : ''}" data-id="${coin.id}">★</button>
        </td>
      </tr>
    `;
  }).join('');

  setTimeout(() => {
    document.querySelectorAll('.flash-up, .flash-down').forEach(el => {
      el.classList.remove('flash-up', 'flash-down');
    });
  }, 900);
}

// ── Modal ──────────────────────────────────────
async function openCoinModal(coinId) {
  currentCoinId = coinId;
  document.getElementById('coinModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
    const coin = await res.json();
    const md = coin.market_data;

    document.getElementById('modalIcon').src = coin.image.large;
    document.getElementById('modalName').textContent = coin.name;
    document.getElementById('modalSymbol').textContent = coin.symbol.toUpperCase();
    document.getElementById('modalPrice').textContent = formatPrice(md.current_price[state.currency], SYMBOLS[state.currency]);
    document.getElementById('modalMarketCap').textContent = formatLarge(md.market_cap[state.currency], SYMBOLS[state.currency]);
    document.getElementById('modalVolume').textContent = formatLarge(md.total_volume[state.currency], SYMBOLS[state.currency]);
    document.getElementById('modalSupply').textContent = `${(md.circulating_supply ?? 0).toLocaleString()} ${coin.symbol.toUpperCase()}`;
    document.getElementById('modalRank').textContent = `#${coin.market_cap_rank || 'N/A'}`;
    document.getElementById('modalATH').textContent = formatPrice(md.ath[state.currency], SYMBOLS[state.currency]);
    document.getElementById('modalATHDate').textContent = new Date(md.ath_date[state.currency]).toLocaleDateString();
    document.getElementById('modalATL').textContent = formatPrice(md.atl[state.currency], SYMBOLS[state.currency]);
    document.getElementById('modalATLDate').textContent = new Date(md.atl_date[state.currency]).toLocaleDateString();
    document.getElementById('modalDescription').innerHTML = coin.description?.en?.split('. ').slice(0,3).join('. ') + '.' || 'No description.';
    document.getElementById('modalWebsite').href = coin.links?.homepage?.[0] || '#';

    const change = md.price_change_percentage_24h;
    const chEl = document.getElementById('modalChange');
    chEl.textContent = `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`;
    chEl.className = `modal-change ${change >= 0 ? 'positive' : 'negative'}`;

    loadChart('7d');
  } catch (e) { console.error(e); }
}

async function loadChart(days) {
  if (priceChart) priceChart.destroy();
  document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');

  const d = days === '24h' ? 1 : days === '7d' ? 7 : days === '30d' ? 30 : 365;
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${currentCoinId}/market_chart?vs_currency=${state.currency}&days=${d}`);
    const data = await res.json();
    const ctx = document.getElementById('priceChart').getContext('2d');
    const isPos = data.prices[data.prices.length-1][1] >= data.prices[0][1];
    const color = isPos ? '#64ffda' : '#ff6b6b';

    priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.prices.map(p => ''),
        datasets: [{
          data: data.prices.map(p => p[1]),
          borderColor: color,
          backgroundColor: (ctx) => {
            const grad = ctx.chart.ctx.createLinearGradient(0,0,0,300);
            grad.addColorStop(0, color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            return grad;
          },
          fill: true, borderWidth: 2, pointRadius: 0,
          pointHoverRadius: 6, tension: 0.4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          callbacks: { label: (c) => formatPrice(c.raw, SYMBOLS[state.currency]) },
          backgroundColor: 'rgba(11,15,31,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1
        }},
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  } catch (e) { console.error('Chart error', e); }
}

function closeModal() {
  document.getElementById('coinModal').classList.remove('active');
  document.body.style.overflow = 'auto';
  if (priceChart) { priceChart.destroy(); priceChart = null; }
}

// ── UI helpers ─────────────────────────────────
function showState(which) {
  loadingEl.classList.toggle('hidden', which !== 'loading');
  errorEl.classList.toggle('hidden',   which !== 'error');
  emptyEl.classList.toggle('hidden',   which !== 'empty');
  tableEl.classList.toggle('hidden',   which !== 'table');
}
function formatPrice(n, sym) {
  if (n == null) return '—';
  if (n >= 1000) return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return sym + n.toFixed(4);
  return sym + n.toFixed(6);
}
function formatLarge(n, sym) {
  if (n == null) return '—';
  if (n >= 1e12) return sym + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return sym + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return sym + (n / 1e6).toFixed(2) + 'M';
  return sym + n.toLocaleString();
}

// ── Events ─────────────────────────────────────
searchEl.addEventListener('input', () => { state.searchQuery = searchEl.value.trim(); applyFilters(); });
currencyEl.addEventListener('change', () => { state.currency = currencyEl.value; fetchData(); });
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active'); state.filter = btn.dataset.filter; applyFilters();
  });
});
document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    else { state.sortKey = key; state.sortDir = key === 'rank' ? 'asc' : 'desc'; }
    document.querySelectorAll('th.sortable').forEach(t => t.classList.remove('sort-active'));
    th.classList.add('sort-active');
    applyFilters();
  });
});
tbodyEl.addEventListener('click', e => {
  const btn = e.target.closest('.btn-watch');
  if (btn) {
    const id = btn.dataset.id;
    state.watchlist = state.watchlist.includes(id) ? state.watchlist.filter(x => x !== id) : [...state.watchlist, id];
    localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
    applyFilters();
    return;
  }
  const row = e.target.closest('tr[data-id]');
  if (row) openCoinModal(row.dataset.id);
});
refreshBtn.addEventListener('click', () => {
  refreshBtn.classList.add('spinning');
  setTimeout(() => refreshBtn.classList.remove('spinning'), 650);
  fetchData();
});

// ── Init ───────────────────────────────────────
fetchData();
loadTrending();
setInterval(() => { fetchData(); loadTrending(); }, 60_000);