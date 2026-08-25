// strategies.js — FantaLab strategies CRUD
const { api } = require('./auth');
const { randomUUID } = require('crypto');

const SEASON = 's_26_27';

// List strategies
async function listStrategies() {
  const data = await api('POST', '/v2/strategy', {});
  return data;
}

// Create strategy
async function createStrategy({ name, credits = 500, type = 'classic', playersList = 'serie-a', budget = { P: 9, D: 11, C: 21, A: 59 }, strategyId = null }) {
  const body = {
    strategy_id: strategyId || randomUUID(),
    strategy_name: name,
    season: SEASON,
    credits,
    strategy_type: type, // classic | mantra
    players_list: playersList, // serie-a | euroleghe
    budget,
  };
  const data = await api('PUT', '/v2/strategy/create', body);
  return { ...body, response: data };
}

// Update strategy (name, credits, budget, type)
async function updateStrategy({ strategyId, name, credits, type, playersList, budget }) {
  const body = { strategy_id: strategyId };
  if (name !== undefined) body.strategy_name = name;
  if (credits !== undefined) body.credits = credits;
  if (type !== undefined) body.strategy_type = type;
  if (playersList !== undefined) body.players_list = playersList;
  if (budget !== undefined) body.budget = budget;
  const data = await api('PUT', '/v2/strategy/update', body);
  return data;
}

// Delete strategy
async function deleteStrategy({ strategyId }) {
  const data = await api('PUT', '/v2/strategy/delete', { strategy_id: strategyId });
  return data;
}

// Find a strategy by name
async function findStrategyByName(name) {
  const strategies = await listStrategies();
  const arr = Array.isArray(strategies) ? strategies : (strategies.data || strategies.strategies || []);
  return arr.find(s => (s.strategy_name || s.name) === name) || null;
}

// Public strategies
async function listPublicStrategies() {
  const data = await api('POST', '/v2/strategy/public', {});
  return data;
}

// Restore archived strategy
async function unarchiveStrategy({ strategyId }) {
  const data = await api('POST', '/v2/strategy/unarchive', { strategy_id: strategyId });
  return data;
}

// Export strategy to Excel
async function exportExcel({ strategyId }) {
  const data = await api('POST', '/download-excel', { strategy_id: strategyId });
  return data;
}

// Add a purchase (used during auction)
async function addPurchase({ strategyId, playerId, price, fantateamId }) {
  const body = { strategy_id: strategyId, player_id: playerId, price };
  if (fantateamId) body.fantateam_id = fantateamId;
  const data = await api('PUT', '/purchase/create', body);
  return data;
}

// Delete a purchase
async function deletePurchase({ purchaseId }) {
  const data = await api('PUT', '/purchase/delete', { purchase_id: purchaseId });
  return data;
}

// Saved goalkeeper pairings (grid)
async function getSavedPairings() {
  const data = await api('POST', '/saved-pairings', {});
  return data;
}

module.exports = { listStrategies, createStrategy, updateStrategy, deleteStrategy, findStrategyByName, listPublicStrategies, unarchiveStrategy, exportExcel, addPurchase, deletePurchase, getSavedPairings, SEASON };
