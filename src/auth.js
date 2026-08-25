// auth.js — FantaLab authentication
// Uses Playwright Chromium (isolated from Brave/Chrome) with a dedicated profile.
// File-based token cache to avoid opening the browser on every call.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { chromium } = require('playwright');

const API = process.env.FANTALAB_API || 'https://api.fantalab.it';
const CACHE_FILE = process.env.FANTALAB_TOKEN_CACHE || path.join(__dirname, '..', '.token-cache.json');
// Dedicated Chromium profile (ISOLATED: does not touch user's Brave/Chrome)
const CHROMIUM_PROFILE = process.env.FANTALAB_CHROMIUM_PROFILE || path.join(os.homedir(), 'Desktop/fantacalcio/tools/fantalab_chromium_profile');

// Read tokens from cache
function readCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch { return null; }
}
function writeCache(tokens) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(tokens)); } catch {}
}

// Extract access_token from dedicated Chromium profile (localStorage) — ONLY if cache is invalid
async function getTokensFromProfile({ headless = true } = {}) {
  const context = await chromium.launchPersistentContext(CHROMIUM_PROFILE, {
    headless, // headless di default (visibile solo per il login iniziale)
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check'],
  });
  try {
    // SINGLE TAB: reuse first page if exists
    let page = context.pages()[0];
    if (!page) page = await context.newPage();
    await page.goto('https://app.fantalab.it/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const tokens = await page.evaluate(() => {
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
    if (tokens && tokens.access_token) writeCache(tokens);
    return tokens;
  } finally {
    // ALWAYS close the browser (even on error) to avoid zombie processes
    try { await context.close(); } catch {}
  }
}

// Check if token is valid (not expired)
function isTokenValid(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.exp * 1000 > Date.now() + 60000;
  } catch { return false; }
}

// Renew tokens via refresh endpoint (if available)
async function refreshTokens(refreshToken) {
  try {
    const res = await fetch('https://keycloak.auth.fantalab.it/realms/fantalab/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'fantalab-website',
        refresh_token: refreshToken,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const tokens = { access_token: data.access_token, id_token: data.id_token, refresh_token: data.refresh_token };
      writeCache(tokens);
      return tokens;
    }
  } catch {}
  return null;
}

// Get valid tokens (cache -> refresh -> browser)
async function getAccessToken() {
  // 1. Cache
  let tokens = readCache();
  if (tokens && tokens.access_token && isTokenValid(tokens.access_token)) {
    return tokens.access_token;
  }
  // 2. Refresh con refresh_token
  if (tokens && tokens.refresh_token) {
    const renewed = await refreshTokens(tokens.refresh_token);
    if (renewed && renewed.access_token) return renewed.access_token;
  }
  // 3. Browser (profilo Brave)
  tokens = await getTokensFromProfile();
  if (!tokens || !tokens.access_token) {
    throw new Error('Token not found. Run first: node bin/fantalab-cli.js login (one-time Chromium login)');
  }
  return tokens.access_token;
}

// Generic API client (fetch with auth)
async function api(method, urlPath, body) {
  const token = await getAccessToken();
  const res = await fetch(API + urlPath, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw new Error(`API ${method} ${urlPath} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  return data;
}

module.exports = { getAccessToken, api, getTokensFromProfile, CHROMIUM_PROFILE, API };
