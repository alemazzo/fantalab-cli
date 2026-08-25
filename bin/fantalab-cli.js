#!/usr/bin/env node
// fantalab-cli — CLI to interact with FantaLab as an API
// CRUD strategies, players, fascias, notes, text notes. Headless, cached token.
const strategies = require('../src/strategies');
const players = require('../src/players');
const { CHROMIUM_PROFILE } = require('../src/auth');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ==================== ARGUMENT PARSING ====================
const args = process.argv.slice(2);
const cmd = args[0];
const opts = {};
for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith('--')) { opts[key] = next; i++; }
    else opts[key] = true;
  } else {
    opts._positional = opts._positional || [];
    opts._positional.push(a);
  }
}

// ==================== VALIDATION ====================
function requireOpt(names) {
  const missing = names.filter(n => opts[n] === undefined);
  if (missing.length) throw new Error(`Missing parameters: --${missing.join(', --')}`);
}
function requirePositional(count) {
  if (!opts._positional || opts._positional.length < count) {
    throw new Error(`Missing subcommand. Use: node bin/fantalab-cli.js help`);
  }
}

// ==================== FULL HELP ====================
const help = `
╔══════════════════════════════════════════════════════════════╗
║  fantalab-cli — FantaLab API client                       ║
║  Headless · cached token · never touches Brave/Chrome           ║
╚══════════════════════════════════════════════════════════════╝

USAGE:
  node bin/fantalab-cli.js <comando> [sottocomando] [--parametro valore]

────────────────────────────────────────────────────────────
 🔐 LOGIN (one-time)
────────────────────────────────────────────────────────────
  login
      Opens visible Chromium, sign in with Google.
      Saves the token in .token-cache.json.
      After that: headless, no web login.
      Parameters: none.

────────────────────────────────────────────────────────────
 📁 STRATEGIES (CRUD)
────────────────────────────────────────────────────────────
  strategies list
      Lists all your strategies.
      Output: [{id, name, credits, type}]
      Parameters: none.

  strategies find --name <nome>
      Find a strategy by name (returns id).
      Required: --name (es. "OP SOLIDITA")
      Output: {found, id, name, credits}

  strategies create --name <nome> [--credits N] [--type X] [--list X] [--budget JSON]
      Create a new strategy.
      Required: --name
      Optional:
        --credits  (default 500)
        --type     classic | mantra (default classic)
        --list     serie-a | euroleghe (default serie-a)
        --budget   JSON es. '{"P":9,"D":11,"C":21,"A":59}' (default 9/11/21/59)
      Output: {ok, strategy_id, name}

  strategies update --id <id> [--name X] [--credits N] [--type X] [--list X] [--budget JSON]
      Update an existing strategy.
      Required: --id
      Optional: --name, --credits, --type, --list, --budget (almeno uno)
      Output: {ok, response}

  strategies delete --id <id>
      Delete a strategy.
      Required: --id
      Output: {ok, response}

────────────────────────────────────────────────────────────
 👤 PLAYERS (CRUD in strategy)
────────────────────────────────────────────────────────────
  players list --id <strategyId>
      List players of a strategy (fascia, price, notes, comment).
      Required: --id (strategyId)
      Output: [{player_id, fascia, price, notes, comment, player:{...}}]

  players listone [--search <nome>]
      List all players (520+). With --search, filter by name.
      Optional: --search
      Output: [{player_id, name, role}]

  players add --id <strategyId> --player <nome> [--fascia X] [--price N] [--notes a,b] [--comment "testo"]
      Add a player to the strategy (or update if exists).
      Required: --id, --player (nome come nel listone)
      Optional:
        --fascia   non impostata(0) | Top(1) | Semi-Top(2) | Terza(3) | Quarta(4) | Scomm.(5)
        --price    numero (es. 75)
        --notes    lista separata da virgole (es. rigorista,tiratore)
        --comment  text note (e.g. "Rigorista Bologna")
      Output: {ok, player, player_id, response}

  players update --id <strategyId> --player <nome> [--fascia X] [--price N] [--notes a,b] [--comment "testo"] [--clear-notes]
      Update an existing player.
      Required: --id, --player
      Optional: --fascia, --price, --notes, --comment, --clear-notes (svuota le note)
      Output: {ok, player, player_id, response}

  players notes --id <strategyId> --player <nome> --notes a,b [--comment "testo"]
      Set notes (and comment) of a player.
      Required: --id, --player, --notes
      Optional: --comment
      Output: {ok, player, notes, comment, response}

  players remove-fascia --id <strategyId> --player <nome>
      Remove a player's fascia (sets to 0).
      Required: --id, --player
      Output: {ok, player, response}

────────────────────────────────────────────────────────────
 📌 AVAILABLE NOTES (20)
────────────────────────────────────────────────────────────
  ${players.NOTE_DISPONIBILI.join(', ')}

────────────────────────────────────────────────────────────
 🎯 FASCIAS
────────────────────────────────────────────────────────────
  non impostata(0) · Top(1) · Semi-Top(2) · Terza(3) · Quarta(4) · Scomm.(5)

────────────────────────────────────────────────────────────
 📝 EXAMPLES
────────────────────────────────────────────────────────────
  node bin/fantalab-cli.js login
  node bin/fantalab-cli.js strategies list
  node bin/fantalab-cli.js strategies find --name "OP SOLIDITA"
  node bin/fantalab-cli.js strategies create --name "Mia" --credits 500
  node bin/fantalab-cli.js players list --id <id>
  node bin/fantalab-cli.js players add --id <id> --player "Orsolini" --fascia Top --price 75 --notes rigorista,tiratore --comment "Rigorista Bologna"
  node bin/fantalab-cli.js players update --id <id> --player "Dimarco" --price 90
  node bin/fantalab-cli.js players remove-fascia --id <id> --player "Dimarco"
  node bin/fantalab-cli.js players listone --search "Dimarco"
`;

// ==================== LOGIN ====================
async function doLogin() {
  console.log('🟢 Opening Chromium (visible) for FantaLab login...');
  console.log('   Dedicated profile (isolated): ' + CHROMIUM_PROFILE);
  console.log('   📢 COMPLETE THE LOGIN IN THE WINDOW:');
  console.log('      1. Click "Continue with Google"');
  console.log('      2. Choose your account');
  console.log('      3. Wait for the FantaLab home screen');
  console.log('   The script waits up to 3 minutes.\n');

  const CACHE_FILE = path.join(__dirname, '..', '.token-cache.json');
  const context = await chromium.launchPersistentContext(CHROMIUM_PROFILE, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check'],
  });
  try {
    let page = context.pages()[0];
    if (!page) page = await context.newPage();
    await page.goto('https://app.fantalab.it/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    let tokens = null;
    for (let i = 0; i < 90; i++) {
      await page.waitForTimeout(2000);
      tokens = await page.evaluate(() => {
        const at = localStorage.getItem('access_token');
        const auth = localStorage.getItem('auth_tokens');
        let parsed = null;
        try { parsed = auth ? JSON.parse(auth) : null; } catch {}
        return {
          access_token: at || (parsed && parsed.access_token) || null,
          id_token: (parsed && parsed.id_token) || null,
          refresh_token: (parsed && parsed.refresh_token) || null,
        };
      }).catch(() => null);
      if (tokens && tokens.access_token) break;
      if (i % 15 === 0) console.log(`   ...waiting for login (${Math.round(i * 2)}s)...`);
    }

    if (tokens && tokens.access_token) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(tokens));
      console.log('\n✅ Login complete! Token saved locally (.token-cache.json).');
      console.log('   The CLI now works headless (no window, no web login).');
    } else {
      console.log('\n❌ Login not completed within 3 minutes. Try again.');
      process.exitCode = 1;
    }
  } finally {
    try { await context.close(); } catch {}
    console.log('🔒 Browser closed.');
  }
}

// ==================== MAIN ====================
async function main() {
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { console.log(help); return; }

  if (cmd === 'login') { await doLogin(); return; }

  switch (cmd) {
    // === STRATEGIE ===
    case 'strategies': {
      requirePositional(1);
      const sub = opts._positional[0];
      switch (sub) {
        case 'list': {
          const data = await strategies.listStrategies();
          const arr = Array.isArray(data) ? data : (data.data || data.strategies || []);
          console.log(JSON.stringify(arr.map(s => ({ id: s.strategy_id || s.id, name: s.strategy_name || s.name, credits: s.credits, type: s.strategy_type || s.type })), null, 2));
          break;
        }
        case 'find': {
          requireOpt(['name']);
          const s = await strategies.findStrategyByName(opts.name);
          if (!s) { console.log(JSON.stringify({ found: false, name: opts.name })); break; }
          console.log(JSON.stringify({ found: true, id: s.strategy_id || s.id, name: s.strategy_name || s.name, credits: s.credits }, null, 2));
          break;
        }
        case 'create': {
          requireOpt(['name']);
          const budget = opts.budget ? JSON.parse(opts.budget) : undefined;
          const r = await strategies.createStrategy({
            name: opts.name,
            credits: opts.credits ? parseInt(opts.credits) : 500,
            type: opts.type,
            playersList: opts.list,
            budget,
          });
          console.log(JSON.stringify({ ok: true, strategy_id: r.strategy_id, name: r.strategy_name, credits: r.credits }, null, 2));
          break;
        }
        case 'update': {
          requireOpt(['id']);
          const r = await strategies.updateStrategy({
            strategyId: opts.id,
            name: opts.name,
            credits: opts.credits ? parseInt(opts.credits) : undefined,
            type: opts.type,
            playersList: opts.list,
            budget: opts.budget ? JSON.parse(opts.budget) : undefined,
          });
          console.log(JSON.stringify({ ok: true, response: r }, null, 2));
          break;
        }
        case 'delete': {
          requireOpt(['id']);
          const r = await strategies.deleteStrategy({ strategyId: opts.id });
          console.log(JSON.stringify({ ok: true, response: r }, null, 2));
          break;
        }
        default:
          throw new Error(`Invalid strategies subcommand: '${sub}'. Use: list|find|create|update|delete`);
      }
      break;
    }

    // === GIOCATORI ===
    case 'players': {
      requirePositional(1);
      const sub = opts._positional[0];
      switch (sub) {
        case 'list': {
          requireOpt(['id']);
          const data = await players.getPlayers(opts.id);
          const arr = Array.isArray(data) ? data : (data.data || data.players || []);
          console.log(JSON.stringify(arr, null, 2));
          break;
        }
        case 'listone': {
          const listone = await players.getListone();
          const arr = Array.isArray(listone) ? listone : (listone.data || listone.players || []);
          const out = opts.search ? arr.filter(p => (p.name || '').toLowerCase().includes(opts.search.toLowerCase())) : arr;
          console.log(JSON.stringify(out.slice(0, 100).map(p => ({ player_id: p.player_id || p.id, name: p.name || p.player_name, role: p.role })), null, 2));
          break;
        }
        case 'add':
        case 'update': {
          requireOpt(['id', 'player']);
          const listone = await players.getListone();
          const pid = await players.findPlayerId(opts.player, listone);
          if (!pid) throw new Error('Player not found in list: ' + opts.player);
          const notes = opts.notes ? opts.notes.split(',').map(n => n.trim()).filter(Boolean) : undefined;
          if (opts['clear-notes']) {
            await players.setNotes(opts.id, pid, [], opts.comment || '');
          }
          const r = await players.setPlayer(opts.id, pid, {
            fascia: opts.fascia,
            price: opts.price ? parseInt(opts.price) : undefined,
            notes,
            comment: opts.comment,
          });
          console.log(JSON.stringify({ ok: true, player: opts.player, player_id: pid, response: r }, null, 2));
          break;
        }
        case 'notes': {
          requireOpt(['id', 'player', 'notes']);
          const listone = await players.getListone();
          const pid = await players.findPlayerId(opts.player, listone);
          if (!pid) throw new Error('Player not found: ' + opts.player);
          const notes = opts.notes.split(',').map(n => n.trim()).filter(Boolean);
          const r = await players.setNotes(opts.id, pid, notes, opts.comment || '');
          console.log(JSON.stringify({ ok: true, player: opts.player, notes, comment: opts.comment || '', response: r }, null, 2));
          break;
        }
        case 'remove-fascia': {
          requireOpt(['id', 'player']);
          const listone = await players.getListone();
          const pid = await players.findPlayerId(opts.player, listone);
          if (!pid) throw new Error('Player not found: ' + opts.player);
          const r = await players.removeFascia(opts.id, pid);
          console.log(JSON.stringify({ ok: true, player: opts.player, response: r }, null, 2));
          break;
        }
        default:
          throw new Error(`Invalid players subcommand: '${sub}'. Use: list|listone|add|update|notes|remove-fascia`);
      }
      break;
    }

    default:
      throw new Error(`Invalid command: '${cmd}'. Use: login|strategies|players (or 'help')`);
  }
}

main().catch(e => {
  console.error('❌ ERROR: ' + e.message);
  console.error('   Use: node bin/fantalab-cli.js help');
  process.exit(1);
});
