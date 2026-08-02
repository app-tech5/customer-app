#!/usr/bin/env node
/**
 * Run Hermes CDP suite.
 * Prerequisite: Metro up + debug app open on emulator/device.
 */

const { spawn } = require('child_process');
const { SUITE, resolveScriptPath } = require('./suite');

const METRO = process.env.METRO_URL || 'http://127.0.0.1:8081';

async function checkMetro() {
  const res = await fetch(`${METRO}/json/list`);
  if (!res.ok) throw new Error(`Metro HTTP ${res.status}`);
  const targets = await res.json();
  const hermes = targets.find((t) => t.webSocketDebuggerUrl);
  if (!hermes) throw new Error('No Hermes CDP target — open the debug app');
  return hermes;
}

function runTest(entry) {
  const scriptPath = resolveScriptPath(entry);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('close', (code) => resolve({ id: entry.id, ok: code === 0, code: code ?? 1 }));
  });
}

async function main() {
  console.log(`Metro: ${METRO}`);
  await checkMetro();
  const results = [];
  for (const entry of SUITE) {
    console.log(`\n=== ${entry.id}: ${entry.description} ===`);
    results.push(await runTest(entry));
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error('\nFailed:', failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
  console.log('\nAll Hermes suite tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
