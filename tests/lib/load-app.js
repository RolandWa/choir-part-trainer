// Loads the notation code of index.html – everything between "// ===== PURE START" and "// ===== PURE END" –
// into a sandbox, so the tests run exactly the code the app runs (no copy that could drift apart).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const EXPORTS = [
  'parseABC', 'buildTimeline', 'expandRepeats', 'abcDisplay', 'renderScore', 'decodeAbcText', 'stripComment',
  'lyrSyllabify', 'lyrSyllabifyLa', 'lyrSyllables', 'lyrVerses', 'lyrDetectLang', 'autoLyrics', 'abcWithAutoLyrics'
];

module.exports = function loadApp() {
  const file = path.join(__dirname, '..', '..', 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const a = html.indexOf('// ===== PURE START'), b = html.indexOf('// ===== PURE END');
  if (a < 0 || b < 0) throw new Error('The markers "// ===== PURE START" and "// ===== PURE END" were not found in index.html');
  const code = html.slice(a, b);
  const line = html.slice(0, a).split('\n').length;
  const ctx = { console };
  vm.createContext(ctx);
  // padding keeps line numbers in error messages equal to the lines in index.html
  vm.runInContext('\n'.repeat(line - 1) + code + '\n;globalThis.__app={' + EXPORTS.join(',') + '};', ctx, { filename: file });
  return ctx.__app;
};
