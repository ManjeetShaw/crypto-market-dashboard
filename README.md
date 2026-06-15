# 🚀 Crypto Market Dashboard

A modern and responsive cryptocurrency tracking dashboard built with **Vanilla JavaScript**, providing real-time cryptocurrency prices, global market insights, watchlists, filtering, sorting, and multi-currency support using the CoinGecko API.

![GitHub repo size](https://img.shields.io/github/repo-size/ManjeetShaw/crypto-market-dashboard)
![GitHub last commit](https://img.shields.io/github/last-commit/ManjeetShaw/crypto-market-dashboard)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## 📖 Overview

Crypto Market Dashboard is a lightweight and responsive web application that allows users to monitor live cryptocurrency prices and market trends in real time.

The project focuses on clean UI design, efficient API integration, client-side state management, and a smooth user experience without relying on external frameworks.

---

## ✨ Features

### 📈 Real-Time Market Data

* Live cryptocurrency prices
* Top 50 cryptocurrencies by market capitalization
* Auto-refresh every 60 seconds

### 🌍 Global Market Statistics

* Total crypto market capitalization
* 24-hour trading volume
* Bitcoin dominance percentage
* Active cryptocurrencies count

### 🔍 Search & Discovery

* Search by coin name
* Search by symbol
* Instant filtering

### 📊 Advanced Sorting

* Sort by Rank
* Sort by Price
* Sort by Market Cap
* Sort by 24h Change

### ⭐ Personal Watchlist

* Add coins to favorites
* LocalStorage persistence
* Dedicated Watchlist view

### 💱 Multi-Currency Support

* USD ($)
* EUR (€)
* INR (₹)
* GBP (£)

### 🎨 User Experience

* Responsive design
* Loading states
* Error handling
* Empty states
* Price movement animations
* Modern dark-themed UI

---

## 🛠️ Tech Stack

| Technology        | Purpose                     |
| ----------------- | --------------------------- |
| HTML5             | Structure                   |
| CSS3              | Styling & Responsive Design |
| JavaScript (ES6+) | Application Logic           |
| CoinGecko API     | Cryptocurrency Data         |
| LocalStorage      | Watchlist Persistence       |

---

## 📂 Project Structure

```text
crypto-market-dashboard/
│
├── index.html
├── README.md
├── LICENSE
│
├── css/
│   └── style.css
│
├── js/
│   └── app.js
│
└── assets/
    ├── images/
    └── screenshots/
```

---

## ⚡ Key Implementations

### State Management

The application uses a centralized state object to manage:

* Cryptocurrency data
* Search queries
* Sorting preferences
* Currency selection
* Watchlist data

### API Optimization

* Parallel API requests using `Promise.all()`
* Efficient filtering and sorting
* Automatic refresh mechanism

### Persistence

User watchlists are stored using browser LocalStorage for a seamless experience across sessions.

---

## 📸 Screenshots

### Dashboard

```text
Add screenshot here:
assets/screenshots/dashboard.png
```

### Watchlist

```text
Add screenshot here:
assets/screenshots/watchlist.png
```

### Market Overview

```text
Add screenshot here:
assets/screenshots/market-overview.png
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/ManjeetShaw/crypto-market-dashboard.git
```

### Open Project

```bash
cd crypto-market-dashboard
```

Simply open:

```text
index.html
```

in your browser.

No installation required.

---

## 🔗 API Used

**CoinGecko Public API**

* Free
* No API Key Required
* Real-Time Cryptocurrency Data

---

## 🎯 Future Enhancements

* Interactive price charts
* Historical price analysis
* Coin detail pages
* Dark/Light theme switch
* Portfolio tracking
* Price alerts
* Market trend visualization

---

## 👨‍💻 Author

**Manjeet Shaw**

* GitHub: https://github.com/ManjeetShaw

---

## ⭐ Support

If you found this project useful, consider giving it a star on GitHub.

It helps the project reach more developers and motivates future improvements.

---

## 📜 License

This project is licensed under the MIT License.
