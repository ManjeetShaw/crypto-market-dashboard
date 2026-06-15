const state = {
  coins: [],           // raw data from API
  filtered: [],        // after search + filter
  currency: 'usd',
  sortKey: 'rank',
  sortDir: 'asc',
  filter: 'all',
  searchQuery: '',
  watchlist: JSON.parse(localStorage.getItem('watchlist') || '[]'),
  prevPrices: {},      // to detect price change direction
};

// ── Currency symbols ───────────────────────────
const SYMBOLS = { usd: '$', eur: '€', inr: '₹', gbp: '£' };

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

// Stats bar
const totalMcapEl  = document.getElementById('total-market-cap');
const totalVolEl   = document.getElementById('total-volume');
const btcDomEl     = document.getElementById('btc-dominance');
const activeCoinsEl= document.getElementById('active-coins');

// ── Fetch data from CoinGecko ──────────────────
async function fetchData() {
  showState('loading');

  try {
    // Fetch top 50 coins + global stats in parallel
    const [coinsRes, globalRes] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/markets` +
        `?vs_currency=${state.currency}` +
        `&order=market_cap_desc` +
        `&per_page=50` +
        `&page=1` +
        `&sparkline=false` +
        `&price_change_percentage=24h`
      ),
      fetch('https://api.coingecko.com/api/v3/global')
    ]);

    if (!coinsRes.ok) throw new Error('API error');

    const coinsData  = await coinsRes.json();
    const globalData = globalRes.ok ? await globalRes.json() : null;

    // Save previous prices for flash animation
    coinsData.forEach(c => {
      state.prevPrices[c.id] = state.coins.find(x => x.id === c.id)?.current_price ?? null;
    });

    state.coins = coinsData;

    updateGlobalStats(globalData);
    applyFilters();
    showState('table');

    lastUpdEl.textContent = 'Updated ' + new Date().toLocaleTimeString();

  } catch (err) {
    console.error(err);
    showState('error');
  }
}

// ── Update global stats bar ────────────────────
function updateGlobalStats(data) {
  if (!data?.data) return;

  const d = data.data;
  const sym = SYMBOLS[state.currency];

  totalMcapEl.textContent  = formatLarge(d.total_market_cap?.[state.currency], sym);
  totalVolEl.textContent   = formatLarge(d.total_volume?.[state.currency], sym);
  btcDomEl.textContent     = d.market_cap_percentage?.btc
    ? d.market_cap_percentage.btc.toFixed(1) + '%'
    : '—';
  activeCoinsEl.textContent = d.active_cryptocurrencies?.toLocaleString() ?? '—';
}

// ── Apply search + filter + sort ───────────────
function applyFilters() {
  let coins = [...state.coins];

  // Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    coins = coins.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  }

  // Filter tabs
  if (state.filter === 'watchlist') {
    coins = coins.filter(c => state.watchlist.includes(c.id));
  } else if (state.filter === 'gainers') {
    coins = coins.filter(c => (c.price_change_percentage_24h ?? 0) > 0);
  } else if (state.filter === 'losers') {
    coins = coins.filter(c => (c.price_change_percentage_24h ?? 0) < 0);
  }

  // Sort
  coins.sort((a, b) => {
    let va, vb;
    switch (state.sortKey) {
      case 'rank':   va = a.market_cap_rank; vb = b.market_cap_rank; break;
      case 'price':  va = a.current_price;   vb = b.current_price;   break;
      case 'change': va = a.price_change_percentage_24h ?? 0; vb = b.price_change_percentage_24h ?? 0; break;
      case 'mcap':   va = a.market_cap;      vb = b.market_cap;      break;
      default:       va = a.market_cap_rank; vb = b.market_cap_rank;
    }
    return state.sortDir === 'asc' ? va - vb : vb - va;
  });

  state.filtered = coins;
  renderTable();
}

// ── Render table rows ──────────────────────────
function renderTable() {
  if (state.filtered.length === 0) {
    showState('empty');
    return;
  }
  showState('table');

  const sym = SYMBOLS[state.currency];

  tbodyEl.innerHTML = state.filtered.map(coin => {
    const change  = coin.price_change_percentage_24h ?? 0;
    const isUp    = change >= 0;
    const watched = state.watchlist.includes(coin.id);

    // Flash class for price change direction
    const prev = state.prevPrices[coin.id];
    let flashClass = '';
    if (prev !== null && prev !== undefined) {
      if (coin.current_price > prev)      flashClass = 'flash-up';
      else if (coin.current_price < prev) flashClass = 'flash-down';
    }

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
        <td class="td-mcap td-hide-sm">${formatLarge(coin.market_cap, sym)}</td>
        <td class="td-volume td-hide-sm">${formatLarge(coin.total_volume, sym)}</td>
        <td>
          <button
            class="btn-watch ${watched ? 'watched' : ''}"
            data-id="${coin.id}"
            title="${watched ? 'Remove from watchlist' : 'Add to watchlist'}"
          >★</button>
        </td>
      </tr>
    `;
  }).join('');

  // Clear flash classes after animation ends
  setTimeout(() => {
    document.querySelectorAll('.flash-up, .flash-down').forEach(el => {
      el.classList.remove('flash-up', 'flash-down');
    });
  }, 900);
}

// ── Show/hide UI states ────────────────────────
function showState(which) {
  loadingEl.classList.toggle('hidden', which !== 'loading');
  errorEl.classList.toggle('hidden',   which !== 'error');
  emptyEl.classList.toggle('hidden',   which !== 'empty');
  tableEl.classList.toggle('hidden',   which !== 'table');
}

// ── Format helpers ─────────────────────────────
function formatPrice(n, sym) {
  if (n == null) return '—';
  if (n >= 1000) return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return sym + n.toFixed(4);
  return sym + n.toFixed(6);
}

function formatLarge(n, sym) {
  if (n == null) return '—';
  if (n >= 1e12) return sym + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return sym + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return sym + (n / 1e6).toFixed(2) + 'M';
  return sym + n.toLocaleString();
}

// ── Event: Search ──────────────────────────────
searchEl.addEventListener('input', () => {
  state.searchQuery = searchEl.value.trim();
  applyFilters();
});

// ── Event: Currency switch ─────────────────────
currencyEl.addEventListener('change', () => {
  state.currency = currencyEl.value;
  fetchData();
});

// ── Event: Filter tabs ─────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    applyFilters();
  });
});

// ── Event: Sort columns ────────────────────────
document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key;
      state.sortDir = key === 'rank' ? 'asc' : 'desc';
    }

    // Update header styles
    document.querySelectorAll('th.sortable').forEach(t => t.classList.remove('sort-active'));
    th.classList.add('sort-active');

    applyFilters();
  });
});

// ── Event: Watchlist toggle (delegated) ───────
tbodyEl.addEventListener('click', e => {
  const btn = e.target.closest('.btn-watch');
  if (!btn) return;

  const id = btn.dataset.id;
  if (state.watchlist.includes(id)) {
    state.watchlist = state.watchlist.filter(x => x !== id);
  } else {
    state.watchlist.push(id);
  }

  // Persist to localStorage
  localStorage.setItem('watchlist', JSON.stringify(state.watchlist));

  // Re-render (re-filter in case we're on watchlist tab)
  applyFilters();
});

// ── Event: Refresh button ──────────────────────
refreshBtn.addEventListener('click', () => {
  refreshBtn.classList.add('spinning');
  setTimeout(() => refreshBtn.classList.remove('spinning'), 650);
  fetchData();
});

// ── Auto-refresh every 60 seconds ─────────────
setInterval(fetchData, 60_000);

// ── Init ───────────────────────────────────────
fetchData();