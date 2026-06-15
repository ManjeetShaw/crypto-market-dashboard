# CryptoTrack — Live Crypto Price Tracker

A clean, responsive crypto price tracker built with **vanilla JavaScript**, HTML, and CSS. Uses the free [CoinGecko API](https://www.coingecko.com/en/api) — no API key required.

![CryptoTrack Screenshot](screenshot.png)

## Features

- **Live prices** for top 50 cryptocurrencies
- **Search** coins by name or symbol
- **Filter** by All / Watchlist / Gainers / Losers
- **Sort** by rank, price, 24h change, or market cap
- **Multi-currency** support: USD, EUR, INR, GBP
- **Watchlist** — star coins and persist them via localStorage
- **Price flash animation** — green/red flash when prices update
- **Auto-refresh** every 60 seconds
- **Global stats bar** — total market cap, volume, BTC dominance
- Fully **responsive** for mobile

## Tech Stack

- Vanilla JavaScript (ES6+)
- HTML5 / CSS3
- [CoinGecko Public API](https://www.coingecko.com/en/api/documentation) (free, no key)
- `localStorage` for watchlist persistence
- `Promise.all` for parallel API calls

## Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/crypto-tracker.git
   cd crypto-tracker
   ```

2. **Open in browser**
   ```bash
   # Option 1: just open the file
   open index.html

   # Option 2: use a local server (recommended)
   npx serve .
   # or
   python3 -m http.server 3000
   ```

3. That's it — no build step, no dependencies, no API key needed!

## Project Structure

```
crypto-tracker/
├── index.html   # Markup & layout
├── style.css    # All styles (dark theme, responsive)
├── app.js       # All logic: fetch, filter, sort, render
└── README.md
```

## API Used

**CoinGecko `/coins/markets`** — returns price, market cap, volume, 24h change, and coin icons for the top 50 coins in your chosen currency.

**CoinGecko `/global`** — returns global market stats (total market cap, BTC dominance, etc.)

Both endpoints are completely free with no authentication.

## License

MIT