#!/usr/bin/env node
/**
 * Customer logistics captures — sync Hermes navigate with host-fetched orders.
 */
const fs = require('fs');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { fiberHelpers } = require('./hermes/navHelpers');

const ADB = process.env.ADB || '/Users/nass/Library/Android/sdk/platform-tools/adb';
const SHOTS = '/Users/nass/Documents/good-foods-description/img/pro/visuals/shots';
const TRACK_ID = '6a2999b9a72b8578d78de668';
const POD_ORDER_ID = '697a2d966e8b65e2818de67f';
const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

async function fetchOrder(token, orderId) {
  const res = await fetch(`${API}/resource/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`order ${orderId} HTTP ${res.status}`);
  return res.json();
}

function buildNavigate(screen, order) {
  return `(function(){
  ${fiberHelpers}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });
  var tabs = findNavWithRoute(hook, 'Orders') || findNavWithRoute(hook, 'BottomTabs');
  if (!tabs) return JSON.stringify({ error: 'Orders nav introuvable' });
  var order = ${JSON.stringify(order)};
  tabs.navigate('Orders', { screen: ${JSON.stringify(screen)}, params: { order: order } });
  return JSON.stringify({
    ok: true,
    screen: ${JSON.stringify(screen)},
    status: order && order.status,
    hasPod: !!(order && order.delivery && order.delivery.proofOfDelivery && order.delivery.proofOfDelivery.photoUrl),
  });
})()`;
}

async function capture(pngPath) {
  execSync(`${ADB} exec-out screencap -p > "${pngPath}"`, { shell: '/bin/zsh' });
  const jpg = pngPath.replace(/\.png$/i, '.jpg');
  execSync(`sips -s format jpeg -s formatOptions 85 "${pngPath}" --out "${jpg}" >/dev/null`);
  execSync(`sips --resampleWidth 420 "${jpg}" >/dev/null`);
  console.log('shot', jpg, Math.round(fs.statSync(jpg).size / 1024) + 'KB');
  return jpg;
}

async function texts() {
  execSync(`${ADB} shell uiautomator dump /sdcard/ui.xml >/dev/null`);
  execSync(`${ADB} pull /sdcard/ui.xml /tmp/ui-hermes.xml >/dev/null`);
  const xml = fs.readFileSync('/tmp/ui-hermes.xml', 'utf8');
  const list = [...xml.matchAll(/text="([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
  console.log(list.slice(0, 40).join(' | '));
  return list.join('\n').toLowerCase();
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const token = JSON.parse(fs.readFileSync('/tmp/gf-orders.json', 'utf8')).token;
  const trackOrder = await fetchOrder(token, TRACK_ID);
  const podOrder = await fetchOrder(token, POD_ORDER_ID);
  console.log('track', trackOrder.status, !!trackOrder.driver);
  console.log('pod', podOrder.status, !!podOrder.delivery?.proofOfDelivery?.photoUrl);

  const ws = await connectHermes();
  await installAutoOkAlerts(ws);

  console.log('→ OrderTracking');
  console.log(await evaluate(ws, buildNavigate('OrderTracking', trackOrder)));
  await new Promise((r) => setTimeout(r, 3500));
  await texts();
  await capture(`${SHOTS}/c-logistics-tracking-raw.png`);
  execSync(`cp "${SHOTS}/c-logistics-tracking-raw.jpg" "${SHOTS}/c-logistics-tracking.jpg"`);

  console.log('→ OrderDetails POD');
  console.log(await evaluate(ws, buildNavigate('OrderDetails', podOrder)));
  await new Promise((r) => setTimeout(r, 3000));
  for (let i = 0; i < 4; i++) {
    execSync(`${ADB} shell input swipe 540 1700 540 650 280`);
    await new Promise((r) => setTimeout(r, 450));
  }
  const blob = await texts();
  console.log('proof visible?', /proof|preuve|completed inside|géofence|geofence/i.test(blob));
  await capture(`${SHOTS}/c-logistics-pod-raw.png`);
  execSync(`cp "${SHOTS}/c-logistics-pod-raw.jpg" "${SHOTS}/c-logistics-pod.jpg"`);

  ws.close();
  console.log('DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
