# 📖 API — Full command documentation

```
node bin/fantalab-cli.js <comando> [sottocomando] [--parametro valore]
```

---

## 🔐 Login

| Command | Description | Parameters |
|---|---|---|
| `login` | One-time login (visible Chromium) | none |

**Example:**
```bash
node bin/fantalab-cli.js login
```

---

## 📁 Strategies

### `strategies list`
Lists all your strategies.

| Parameters | Required | Default |
|---|---|---|
| — | — | — |

**Output:** `[{id, name, credits, type}]`

**Example:**
```bash
node bin/fantalab-cli.js strategies list
```

### `strategies find --name <nome>`
Find a strategy by name (returns id).

| Parameters | Required | Default |
|---|---|---|
| `--name` | ✅ | — |

**Output:** `{found, id, name, credits}`

**Example:**
```bash
node bin/fantalab-cli.js strategies find --name "OP SOLIDITA"
```

### `strategies create --name <nome>`
Create a new strategy.

| Parameters | Required | Default |
|---|---|---|
| `--name` | ✅ | — |
| `--credits` | ❌ | 500 |
| `--type` | ❌ | classic |
| `--list` | ❌ | serie-a |
| `--budget` | ❌ | `{"P":9,"D":11,"C":21,"A":59}` |

- `--type`: `classic` | `mantra`
- `--list`: `serie-a` | `euroleghe`
- `--budget`: JSON con budget per ruolo

**Output:** `{ok, strategy_id, name, credits}`

**Example:**
```bash
node bin/fantalab-cli.js strategies create --name "Mia" --credits 500
node bin/fantalab-cli.js strategies create --name "Mia" --budget '{"P":10,"D":20,"C":30,"A":40}'
```

### `strategies update --id <id>`
Update an existing strategy.

| Parameters | Required | Default |
|---|---|---|
| `--id` | ✅ | — |
| `--name` | ❌ | — |
| `--credits` | ❌ | — |
| `--type` | ❌ | — |
| `--list` | ❌ | — |
| `--budget` | ❌ | — |

At least one optional parameter must be provided.

**Output:** `{ok, response}`

**Example:**
```bash
node bin/fantalab-cli.js strategies update --id <id> --name "Nuovo" --credits 600
```

### `strategies delete --id <id>`
Delete a strategy.

| Parametri | Richiesto |
|---|---|
| `--id` | ✅ |

**Output:** `{ok, response}`

**Example:**
```bash
node bin/fantalab-cli.js strategies delete --id <id>
```

---

## 👤 Players

### `players list --id <strategyId>`
List players of a strategy (fascia, price, notes, comment).

| Parametri | Richiesto |
|---|---|
| `--id` (strategyId) | ✅ |

**Output:** `[{player_id, fascia, price, notes, comment, player:{...}}]`

**Example:**
```bash
node bin/fantalab-cli.js players list --id <strategyId>
```

### `players listone [--search <nome>]`
List all players (520+). With `--search`, filter by name.

| Parametri | Richiesto |
|---|---|
| `--search` | ❌ |

**Output:** `[{player_id, name, role}]`

**Example:**
```bash
node bin/fantalab-cli.js players listone
node bin/fantalab-cli.js players listone --search "Dimarco"
```

### `players add --id <strategyId> --player <nome>`
Add a player to the strategy (or update if exists).

| Parametri | Richiesto | Note |
|---|---|---|
| `--id` (strategyId) | ✅ | — |
| `--player` | ✅ | Name as in the list |
| `--fascia` | ❌ | see Fascias |
| `--price` | ❌ | Number (e.g. 75) |
| `--notes` | ❌ | Comma-separated list |
| `--comment` | ❌ | Text note |

**Output:** `{ok, player, player_id, response}`

**Example:**
```bash
node bin/fantalab-cli.js players add --id <id> --player "Orsolini" --fascia Top --price 75 --notes rigorista,tiratore --comment "Rigorista Bologna"
```

### `players update --id <strategyId> --player <nome>`
Update an existing player.

| Parametri | Richiesto | Note |
|---|---|---|
| `--id` | ✅ | — |
| `--player` | ✅ | — |
| `--fascia` | ❌ | see Fascias |
| `--price` | ❌ | — |
| `--notes` | ❌ | — |
| `--comment` | ❌ | — |
| `--clear-notes` | ❌ | Clear the notes |

**Output:** `{ok, player, player_id, response}`

**Example:**
```bash
node bin/fantalab-cli.js players update --id <id> --player "Dimarco" --price 90
```

### `players notes --id <strategyId> --player <nome> --notes <a,b>`
Set notes (and comment) of a player.

| Parametri | Richiesto |
|---|---|
| `--id` | ✅ |
| `--player` | ✅ |
| `--notes` | ✅ |
| `--comment` | ❌ |

**Output:** `{ok, player, notes, comment, response}`

**Example:**
```bash
node bin/fantalab-cli.js players notes --id <id> --player "De Bruyne" --notes rigorista,tiratore --comment "Rigorista Napoli"
```

### `players remove-fascia --id <strategyId> --player <nome>`
Remove a player's fascia (sets to 0).

| Parametri | Richiesto |
|---|---|
| `--id` | ✅ |
| `--player` | ✅ |

**Output:** `{ok, player, response}`

**Example:**
```bash
node bin/fantalab-cli.js players remove-fascia --id <id> --player "Dimarco"
```

---

## 🎯 Fascias

| Valore CLI | Numero API | Significato |
|---|---|---|
| `not set` | 0 | — |
| `Top` | 1 | Primary |
| `Semi-Top` | 2 | Secondary |
| `Terza` | 3 | — |
| `Quarta` | 4 | — |
| `Bet` / `Scommessa` | 5 | Bets |

---

## 📌 Available notes (20)

| Note | Meaning |
|---|---|
| `titolarissimo` | Certain starter |
| `modificatore` | Great for the modifier |
| `costante` | Consistent performance |
| `rigorista` | Takes penalties |
| `tiratore` | Takes free kicks/corners |
| `pararigori` | Saves penalties |
| `bonus` | Prone to bonuses |
| `tantiGol` | Goalscorer |
| `assistman` | Many assists |
| `imbattibilità` | Solid keeper/defense |
| `scommessa` | High risk/high reward |
| `affareNascosto` | Underrated |
| `jolly` | Versatile |
| `esca` | — |
| `rischioInfortuni` | Physically fragile |
| `cartellini` | Many penalties (cards) |
| `incostante` | Inconsistent performance |
| `subentrante` | Comes on as substitute |
| `contrattoInScadenza` | — |
| `coppaAfrica` | AFCON commitments |

---

## 🛠️ Utilities

### `node bin/cleanup.js`
Closes residual headless Chromium processes (never user's Brave/Chrome).

### `npm test`
Runs the automated test suite (14 tests).
