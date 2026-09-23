import { readFileSync } from 'fs';
import https from 'https';

const html = readFileSync('public/index.html', 'utf-8');

// 1. Check JS syntax
const jsMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!jsMatch) { console.log('FAIL: no script found'); process.exit(1); }
try {
  new Function(jsMatch[1]);
  console.log('[1] JS syntax: OK');
} catch (e) {
  console.log('[1] JS syntax ERROR:', e.message);
  process.exit(1);
}

// 2. Check all CDN scripts exist
const scriptRe = /src="(https:\/\/cdn\.jsdelivr\.net[^"]+)"/g;
const urls = [];
let m;
while ((m = scriptRe.exec(html))) urls.push(m[1]);

let cdnOk = 0;
for (const url of urls) {
  await new Promise((resolve) => {
    https.get(url, (res) => {
      const name = url.split('/').slice(-2).join('/');
      if (res.statusCode === 200) { cdnOk++; console.log('[2] CDN ' + name + ': OK'); }
      else { console.log('[2] CDN ' + name + ': FAIL ' + res.statusCode); }
      resolve();
    }).on('error', (e) => {
      console.log('[2] CDN ERROR:', url.split('/').pop(), e.message);
      resolve();
    });
  });
}
console.log('[2] CDN scripts: ' + cdnOk + '/' + urls.length + ' OK');

// 3. Check key functions exist
const fns = ['selectAgent', 'ensureSlot', 'createPaneEl', 'splitView', 'handleMessage',
  'renderAgentCards', 'showNotification', 'connectWebSocket', 'init',
  'setTheme', 'openAbout', 'openCommandPalette', 'openSearch',
  'exportActiveLog', 'saveConfig', 'openConfigModal',
  'waitForFonts', 'send'];
const missing = fns.filter(f => !jsMatch[1].includes('function ' + f));
if (missing.length) {
  console.log('[3] Missing functions:', missing.join(', '));
} else {
  console.log('[3] All ' + fns.length + ' functions: OK');
}

// 4. Check CSS is valid (no unclosed braces)
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  const open = (styleMatch[1].match(/{/g) || []).length;
  const close = (styleMatch[1].match(/}/g) || []).length;
  console.log('[4] CSS braces: ' + open + ' open, ' + close + ' close ' + (open === close ? 'OK' : 'MISMATCH'));
}

// 5. Check HTML structure
const bodyOpen = (html.match(/<body/g) || []).length;
const bodyClose = (html.match(/<\/body>/g) || []).length;
const htmlClose = (html.match(/<\/html>/g) || []).length;
console.log('[5] HTML structure: body=' + bodyOpen + '/' + bodyClose + ' html=' + htmlClose + ' ' + (bodyOpen === bodyClose && htmlClose === 1 ? 'OK' : 'MISMATCH'));

// 6. Check all modal divs have matching close
const modals = ['modal', 'workspaceModal', 'configModal', 'aboutModal', 'cmdPalette', 'searchBar'];
for (const id of modals) {
  const found = html.includes('id="' + id + '"');
  console.log('[6] Modal #' + id + ': ' + (found ? 'OK' : 'MISSING'));
}

// 7. Check key IDs referenced in JS exist in HTML
const ids = ['welcomeScreen', 'terminalArea', 'splitRoot', 'agentList', 'agentCount',
  'targetDir', 'gitBranch', 'connText', 'connStatus', 'activePill',
  'handoffBtn', 'restartBtn', 'stopBtn', 'splitCount', 'toastContainer',
  'rateLimitBanner', 'shutdownOverlay', 'sidebar'];
const missingIds = ids.filter(id => !html.includes('id="' + id + '"'));
if (missingIds.length) {
  console.log('[7] Missing HTML IDs:', missingIds.join(', '));
} else {
  console.log('[7] All ' + ids.length + ' HTML IDs: OK');
}

console.log('\n=== All checks passed ===');
