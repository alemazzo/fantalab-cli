# fantalab-cli

CLI to interact with **FantaLab** as an API: full management of **strategies** (CRUD), **players**, **fascias**, **prices** and **notes**.

> Headless · cached token · **never touches the user's browser** · JSON output

---

## ✨ Features

- **Strategy CRUD**: create, list, update, delete, find
- **Player management**: add, update, remove fascia
- **Fascias**: Top, Semi-Top, Third, Fourth, Bet (0-5)
- **Prices**: set max price with automatic budget percentage
- **Notes**: 20 selectable tags + text note (comment) per player
- **Authentication**: one-time login → cached token → auto-refresh
- **Headless**: uses Playwright Chromium (isolated, never Brave/Chrome)
- **JSON output**: easy to parse and compose for agents/scripts

---

## 📦 Installation

```bash
git clone https://github.com/alemazzo/fantalab-cli.git
cd fantalab-cli
npm install
```

Requirements: **Node.js ≥ 18**, Playwright Chromium (installed automatically via `npm install` or with `npx playwright install chromium`).

---

## 🔐 Login (one-time)

```bash
node bin/fantalab-cli.js login
```

- Opens **Chromium** (visible, isolated — not Brave/Chrome)
- Sign in with Google
- The token is saved in `.token-cache.json` (local, **never committed**)
- From then on: **headless**, no web login, no windows

JWT token lasts ~5h; refresh is automatic (long-lived refresh_token); if needed, it reopens headless Chromium by itself.

---

## 🚀 Quick usage

```bash
# Strategies
node bin/fantalab-cli.js strategies list
node bin/fantalab-cli.js strategies find --name "Mia"
node bin/fantalab-cli.js strategies create --name "Mia" --credits 500
node bin/fantalab-cli.js strategies delete --id <id>

# Players
node bin/fantalab-cli.js players list --id <strategyId>
node bin/fantalab-cli.js players listone --search "Dimarco"
node bin/fantalab-cli.js players add --id <strategyId> --player "Orsolini" --fascia Top --price 75 --notes rigorista,tiratore --comment "Rigorista Bologna"
node bin/fantalab-cli.js players update --id <strategyId> --player "Dimarco" --price 90
node bin/fantalab-cli.js players remove-fascia --id <strategyId> --player "Dimarco"
```

---

## 📖 Full documentation

- **[API.md](API.md)** — all commands, required/optional parameters, fascias, notes, examples

---

## 🧪 Tests

```bash
npm test
```

Automated suite (14 tests): create strategy → list/update/find → add player with fascia/price/notes/comment → update price/fascia/notes → remove fascia → delete strategy.

---

## 📁 Structure

```
fantalab-cli/
├── bin/
│   ├── fantalab-cli.js   # Main CLI (login + strategies + players)
│   └── cleanup.js        # Closes residual headless Chromium processes
├── src/
│   ├── auth.js           # Isolated Chromium + token cache + auto-refresh
│   ├── strategies.js     # Strategies CRUD
│   └── players.js        # Player CRUD (fascia, price, notes, comment)
├── test/
│   └── test.js           # Test suite (14 tests)
├── .gitignore            # Excludes tokens, node_modules, browser profiles
├── API.md                # Full command documentation
├── LICENSE               # MIT
└── README.md
```

---

## 🔒 Privacy & security

- The access token is stored **only locally** (`.token-cache.json`, excluded from git)
- The CLI uses **Playwright Chromium with a dedicated profile** — never touches the user's Brave/Chrome
- `bin/cleanup.js` closes **only** residual headless Chromium processes
- No personal data is sent to third parties (only official FantaLab APIs)

---

## 📄 License

MIT — see [LICENSE](LICENSE).
