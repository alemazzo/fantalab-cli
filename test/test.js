// test.js — Automated test suite for fantalab-cli
// Verifies all CRUD: strategies, players, fascias, notes, comments
// Usage: npm test  (or node test/test.js)
const strategies = require('../src/strategies');
const players = require('../src/players');
const { api } = require('../src/auth');

let passed = 0, failed = 0;
function assert(name, cond, extra) {
  if (cond) { passed++; console.log('✅ ' + name); }
  else { failed++; console.log('❌ ' + name + (extra ? ' — ' + extra : '')); }
}

async function main() {
  console.log('🧪 Testing fantalab-cli\n');

  // === STRATEGIE ===
  console.log('— STRATEGIES —');
  const testName = 'CLI TEST ' + Date.now();
  let sid = null;
  try {
    const created = await strategies.createStrategy({ name: testName, credits: 500 });
    sid = created.strategy_id;
    assert('create strategy (generated id)', !!sid && created.strategy_name === testName);
  } catch (e) { assert('create strategy', false, e.message); }

  if (sid) {
    try {
      const list = await strategies.listStrategies();
      const arr = Array.isArray(list) ? list : (list.data || list.strategies || []);
      assert('list strategies (contains new one)', arr.some(s => (s.strategy_id || s.id) === sid));
    } catch (e) { assert('list strategie', false, e.message); }

    try {
      const found = await strategies.findStrategyByName(testName);
      assert('find strategy by name', !!found && (found.strategy_id || found.id) === sid);
    } catch (e) { assert('find strategia', false, e.message); }

    try {
      await strategies.updateStrategy({ strategyId: sid, name: testName + ' R', credits: 600 });
      const found = await strategies.findStrategyByName(testName + ' R');
      assert('update strategy (rename+credits)', !!found && Number(found.credits) === 600);
    } catch (e) { assert('update strategia', false, e.message); }
  }

  // === GIOCATORI ===
  console.log('\n— PLAYERS —');
  if (sid) {
    try {
      const listone = await players.getListone();
      const arr = Array.isArray(listone) ? listone : (listone.data || listone.players || []);
      assert('listone (520+ players)', Array.isArray(arr) && arr.length > 500, 'count=' + arr.length);
    } catch (e) { assert('listone', false, e.message); }

    try {
      const pid = await players.findPlayerId('Dimarco', await players.getListone());
      assert('findPlayerId Dimarco', !!pid, 'pid=' + pid);
    } catch (e) { assert('findPlayerId', false, e.message); }

    // add con fascia+prezzo+note+commento
    try {
      const r = await players.setPlayer(sid, await players.findPlayerId('Dimarco', await players.getListone()), {
        fascia: 1, price: 90, notes: ['titolarissimo', 'bonus'], comment: 'Top D Inter',
      });
      assert('setPlayer (fascia 1, price 90, notes, comment)', r && r.fascia === 1 && r.price === 90 && r.notes.includes('titolarissimo') && r.comment === 'Top D Inter');
    } catch (e) { assert('setPlayer', false, e.message); }

    // update prezzo
    try {
      const pid = await players.findPlayerId('Dimarco', await players.getListone());
      const r = await players.setPrice(sid, pid, 85);
      assert('setPrice 85', r && r.price === 85);
    } catch (e) { assert('setPrice', false, e.message); }

    // update fascia
    try {
      const pid = await players.findPlayerId('Dimarco', await players.getListone());
      const r = await players.setFascia(sid, pid, 'Semi-Top');
      assert('setFascia Semi-Top', r && r.fascia === 2);
    } catch (e) { assert('setFascia', false, e.message); }

    // notes
    try {
      const pid = await players.findPlayerId('Dimarco', await players.getListone());
      const r = await players.setNotes(sid, pid, ['rigorista'], 'nota test');
      assert('setNotes (rigorista + comment)', r && r.notes.includes('rigorista') && r.comment === 'nota test');
    } catch (e) { assert('setNotes', false, e.message); }

    // commento
    try {
      const pid = await players.findPlayerId('Dimarco', await players.getListone());
      const r = await players.setComment(sid, pid, 'solo commento');
      assert('setComment', r && r.comment === 'solo commento');
    } catch (e) { assert('setComment', false, e.message); }

    // getPlayers
    try {
      const data = await players.getPlayers(sid);
      const arr = Array.isArray(data) ? data : (data.data || data.players || []);
      assert('getPlayers (contains Dimarco)', Array.isArray(arr) && arr.some(p => p.player && (p.player.name === 'Dimarco' || p.player_id)));
    } catch (e) { assert('getPlayers', false, e.message); }

    // remove fascia
    try {
      const pid = await players.findPlayerId('Dimarco', await players.getListone());
      const r = await players.removeFascia(sid, pid);
      assert('removeFascia (fascia 0)', r && r.fascia === 0);
    } catch (e) { assert('removeFascia', false, e.message); }
  }

  // === DELETE ===
  console.log('\n— DELETE —');
  if (sid) {
    try {
      await strategies.deleteStrategy({ strategyId: sid });
      const found = await strategies.findStrategyByName(testName + ' R');
      assert('delete strategy', !found);
    } catch (e) { assert('delete strategy', false, e.message); }
  }

  console.log(`\n📊 RESULT: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('❌ ' + e.message); process.exit(1); });
