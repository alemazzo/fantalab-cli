#!/usr/bin/env node
// cleanup.js — Closes ONLY Chromium/Playwright processes opened by CLI scripts.
// ⚠️ NEVER touches the user's Brave/Chrome (your windows stay intact).
// Usage: node bin/cleanup.js
const { execSync } = require('child_process');

try {
  // Chiudi solo i processi Chromium di Playwright (headless shell), MAI Brave
  const out = execSync('pgrep -f "chromium_headless_shell|chrome-headless-shell" | wc -l').toString().trim();
  console.log(`Active headless Chromium processes: ${out}`);
  if (parseInt(out) > 0) {
    execSync('pkill -f "chromium_headless_shell"');
    execSync('pkill -f "chrome-headless-shell"');
    console.log('✅ Headless Chromium processes closed');
  } else {
    console.log('✅ No Chromium processes to close');
  }
  console.log('ℹ️  Brave/Chrome dell\'utente NON toccati.');
} catch (e) {
  console.log('No Chromium processes found.');
}
