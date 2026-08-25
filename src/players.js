// players.js — Player CRUD in strategies (fascia, price, notes, comment)
const { api } = require('./auth');

// Fascia: 0=not set, 1=Top, 2=Semi-Top, 3=Third, 4=Fourth, 5=Bet
const FASCIA_MAP = { 0: 'non impostata', 1: 'Top', 2: 'Semi-Top', 3: 'Terza', 4: 'Quarta', 5: 'Scomm.' };
const FASCIA_REV = { 'not set': 0, 'top': 1, 'semi-top': 2, 'semitop': 2, 'terza': 3, 'quarta': 4, 'scomm.': 5, 'scommessa': 5, 'scomm': 5 };

// Available note tags (from the app)
const NOTE_DISPONIBILI = [
  'titolarissimo', 'modificatore', 'costante', 'rigorista', 'tiratore', 'pararigori',
  'bonus', 'tantiGol', 'assistman', 'imbattibilità', 'scommessa', 'affareNascosto',
  'jolly', 'esca', 'rischioInfortuni', 'cartellini', 'incostante', 'subentrante',
  'contrattoInScadenza', 'coppaAfrica',
];

// Get players of a strategy
async function getPlayers(strategyId) {
  const data = await api('POST', '/v2/player-strategy', { strategy_id: strategyId });
  return data;
}

// Get players with player_id (from the list)
async function getListone() {
  const data = await api('GET', '/v2/listone', null);
  return data;
}

// Find a player_id from the list by name
async function findPlayerId(name, listone) {
  const arr = Array.isArray(listone) ? listone : (listone.data || listone.players || []);
  const q = name.toLowerCase();
  const found = arr.find(p => (p.name || p.player_name || '').toLowerCase().includes(q));
  return found ? found.player_id || found.id : null;
}

// Update a player's fascia
async function setFascia(strategyId, playerId, fascia) {
  const fasciaNum = typeof fascia === 'number' ? fascia : (FASCIA_REV[String(fascia).toLowerCase()] ?? parseInt(fascia, 10));
  if (fasciaNum === undefined || isNaN(fasciaNum)) throw new Error('Invalid fascia: ' + fascia + '. Use: not set(0), Top(1), Semi-Top(2), Third(3), Fourth(4), Bet(5)');
  return await api('PUT', '/v2/player-strategy/update', {
    player_id: playerId,
    strategy_id: strategyId,
    fascia: fasciaNum,
  });
}

// Update a player's price (price + computed percentage)
async function setPrice(strategyId, playerId, price, credits = 500) {
  const percentage = Math.round((price / credits) * 1000) / 10;
  return await api('PUT', '/v2/player-strategy/update', {
    player_id: playerId,
    strategy_id: strategyId,
    price,
    percentage,
    perc_price: percentage,
  });
}

// Update a player's notes (array + text comment)
async function setNotes(strategyId, playerId, notes = [], comment = '') {
  return await api('PUT', '/v2/player-strategy/update', {
    player_id: playerId,
    strategy_id: strategyId,
    notes,
    comment,
  });
}

// Update only the comment (text note)
async function setComment(strategyId, playerId, comment) {
  return await api('PUT', '/v2/player-strategy/update', {
    player_id: playerId,
    strategy_id: strategyId,
    comment,
  });
}

// Full operation: fascia + price + notes + comment in one call
async function setPlayer(strategyId, playerId, { fascia, price, notes, comment, credits = 500 } = {}) {
  const body = { player_id: playerId, strategy_id: strategyId };
  if (fascia !== undefined) {
    const fasciaNum = typeof fascia === 'number' ? fascia : (FASCIA_REV[String(fascia).toLowerCase()] ?? parseInt(fascia, 10));
    if (fasciaNum === undefined || isNaN(fasciaNum)) throw new Error('Invalid fascia: ' + fascia);
    body.fascia = fasciaNum;
  }
  if (price !== undefined) {
    body.price = price;
    body.percentage = Math.round((price / credits) * 1000) / 10;
    body.perc_price = body.percentage;
  }
  if (notes !== undefined) body.notes = notes;
  if (comment !== undefined) body.comment = comment;
  return await api('PUT', '/v2/player-strategy/update', body);
}

// Remove fascia (set to 0 = not set)
async function removeFascia(strategyId, playerId) {
  return await api('PUT', '/v2/player-strategy/update', {
    player_id: playerId,
    strategy_id: strategyId,
    fascia: 0,
  });
}

module.exports = {
  getPlayers, getListone, findPlayerId, setFascia, setPrice, setNotes, setComment, setPlayer, removeFascia,
  FASCIA_MAP, FASCIA_REV, NOTE_DISPONIBILI,
};
