#!/usr/bin/env node
// Tests for Partia chóralna / Choir Part Trainer. Needs only Node.js 18 or newer – no packages to install.
//
//   node tests/run.js              run all tests
//   node tests/run.js pl           run only tests whose file name contains "pl"
//   node tests/run.js --verbose    also list the known limitations
//   node tests/run.js --update     rewrite tests/lyrics/*.expected.abc from the current code
//                                  (only after checking that the new output is right!)
//
// What is tested:
//   tests/syllables/<lang>.txt   how single words are split into syllables
//   tests/lines/<lang>.txt       how many syllables (notes) a line of a hymn has
//   tests/lyrics/*.abc           words from W: placed under the notes; the result must equal *.expected.abc,
//                                land on the same notes in abcjs, and read back the same in the app
//   tests/abc.test.js            the ABC reader: notes, repeats, ties, lyrics rules, text decoding
'use strict';
const fs = require('fs');
const path = require('path');
const app = require('./lib/load-app')();
const abcjsAddWords = require('./lib/abcjs-words');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose'), UPDATE = args.includes('--update');
const FILTER = args.find(a => !a.startsWith('--')) || '';
const DIR = __dirname;
const totals = { pass: 0, fail: 0, known: 0, fixed: 0 };
const failures = [], knownList = [], fixedList = [];
const pick = f => !FILTER || f.includes(FILTER);

function record(ok, known, where, msg) {
  if (ok && known) { totals.fixed++; fixedList.push(where + '  ' + msg); return; }
  if (ok) { totals.pass++; return; }
  if (known) { totals.known++; knownList.push(where + '  ' + msg); return; }
  totals.fail++; failures.push(where + '  ' + msg);
}
function dataLines(file) {
  return fs.readFileSync(file, 'utf8').split('\n').map((t, i) => ({ t: t.trim(), n: i + 1 }))
    .filter(x => x.t && !x.t.startsWith('#'));
}
function suite(name, fn) {
  const before = { ...totals };
  fn();
  const p = totals.pass - before.pass, f = totals.fail - before.fail, k = totals.known - before.known;
  console.log(`${f ? 'FAIL' : ' ok '}  ${name.padEnd(34)} ${p} passed${f ? ', ' + f + ' failed' : ''}${k ? ', ' + k + ' known' : ''}`);
}
const show = sy => sy.map(x => x.t + (x.cont ? '-' : ' ')).join('').trim();

// ---------- syllables of words ----------
for (const f of fs.readdirSync(path.join(DIR, 'syllables')).filter(f => f.endsWith('.txt') && pick('syllables/' + f))) {
  const lang = path.basename(f, '.txt');
  suite('syllables/' + f, () => {
    for (const { t, n } of dataLines(path.join(DIR, 'syllables', f))) {
      const known = t.startsWith('!');
      const alts = t.replace(/^!\s*/, '').split('|').map(s => s.trim());
      const word = alts[0].replace(/-/g, '');
      const got = app.lyrSyllables(word, lang).map(x => x.t).join('-');
      record(alts.includes(got), known, `syllables/${f}:${n}`, `${alts.join(' | ')}  →  got ${got}`);
    }
  });
}

// ---------- syllable count of lines ----------
for (const f of fs.readdirSync(path.join(DIR, 'lines')).filter(f => f.endsWith('.txt') && pick('lines/' + f))) {
  const lang = path.basename(f, '.txt');
  suite('lines/' + f, () => {
    for (const { t, n } of dataLines(path.join(DIR, 'lines', f))) {
      const known = t.startsWith('!');
      const m = /^!?\s*(\d+)\s*\|\s*(.+)$/.exec(t);
      if (!m) { record(false, false, `lines/${f}:${n}`, 'line not in the form "count | text"'); continue; }
      const sy = app.lyrSyllables(m[2], lang);
      record(sy.length === +m[1], known, `lines/${f}:${n}`, `expected ${m[1]}, got ${sy.length}: ${show(sy)}`);
    }
  });
}

// ---------- W: words placed under the notes ----------
// The elements abcjs sees for one lyrics line: notes and rests of the line, with a bar between measures.
function abcjsCheck(R, byLine) {
  let bad = [];
  R.voices.forEach(v => {
    const groups = [...new Set(v.events.map(e => e.lg))];
    for (const g of groups) {
      const evs = v.events.filter(e => e.lg === g && (e.kind === 'note' || e.kind === 'rest'));
      if (!evs.length) continue;
      const els = []; let pm = null;
      for (const e of evs) { if (pm !== null && e.measure !== pm) els.push({ type: 'bar' }); pm = e.measure; els.push({ type: e.kind, ev: e }); }
      const li = Math.max(...evs.map(e => e.li));
      for (const l of (byLine.get(li) || [])) abcjsAddWords(els, l.replace(/^w:\s?/, ''));
      for (const el of els) {
        if (!el.ev || el.ev.kind !== 'note') continue;
        const a = (el.lyric || []).map(x => x.syllable.replace(/\u00a0/g, ' ').trim());
        const b = el.ev.lyrics.map(x => (x ? x.t.trim() : ''));
        for (let r = 0; r < Math.max(a.length, b.length); r++)
          if ((a[r] || '') !== (b[r] || '')) bad.push(`voice ${v.id}, note ${el.ev.i + 1}, verse ${r + 1}: abcjs "${a[r] || ''}", app "${b[r] || ''}"`);
      }
    }
  });
  return bad;
}
const lyricFiles = fs.readdirSync(path.join(DIR, 'lyrics')).filter(f => f.endsWith('.abc') && !f.endsWith('.expected.abc') && pick('lyrics/' + f));
if (lyricFiles.length) suite('lyrics/*.abc', () => {
  for (const f of lyricFiles) {
    const where = 'lyrics/' + f, text = fs.readFileSync(path.join(DIR, 'lyrics', f), 'utf8').replace(/\r\n/g, '\n');
    const expFile = path.join(DIR, 'lyrics', f.replace(/\.abc$/, '.expected.abc'));
    const R = app.parseABC(text), res = app.autoLyrics(R);
    const out = res ? app.abcWithAutoLyrics(R, text) : text;
    if (UPDATE) { fs.writeFileSync(expFile, out); console.log('      updated ' + path.relative(process.cwd(), expFile)); }
    if (!fs.existsSync(expFile)) { record(false, false, where, 'no ' + path.basename(expFile) + ' – run with --update, check it and commit it'); continue; }
    const exp = fs.readFileSync(expFile, 'utf8').replace(/\r\n/g, '\n');   // files checked out on Windows may have CRLF
    if (out === exp) record(true, false, where, '');
    else {
      const a = out.split('\n'), b = exp.split('\n'); let k = 0; while (k < a.length && a[k] === b[k]) k++;
      record(false, false, where, `differs from ${path.basename(expFile)} at line ${k + 1}:\n        expected: ${b[k]}\n        got:      ${a[k]}`);
    }
    if (res) {
      const bad = abcjsCheck(R, res.byLine);
      record(!bad.length, false, where, 'abcjs would put words on other notes: ' + bad.slice(0, 3).join('; '));
      const R2 = app.parseABC(out); let diff = 0;
      R.voices.forEach((v, vi) => v.events.forEach((e, k) => {
        const s1 = e.lyrics.map(x => (x ? x.t.trim() : '')).join('|').replace(/\|+$/, '');
        const s2 = R2.voices[vi].events[k].lyrics.map(x => (x ? x.t.trim() : '')).join('|').replace(/\|+$/, '');
        if (s1 !== s2) diff++;
      }));
      record(diff === 0, false, where, `${diff} notes read back with other words after "Save in the notes"`);
      const info = res.info.verses.map((x, i) => `verse ${x.label || i + 1}: ${x.n} syllables, ` + x.voices.map(z => (R.voices[z.vi].id) + ' ' + z.N + ' notes' + (z.ok ? '' : ' (mismatch)')).join(', ')).join('; ');
      if (VERBOSE) console.log('      ' + f + ' – ' + res.info.lang + ' – ' + info);
    }
  }
});

// ---------- unit tests of the ABC reader ----------
if (pick('abc.test')) {
  const tests = [];
  const ctx = {
    test: (name, fn) => tests.push({ name, fn }),
    eq: (a, b, msg) => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error((msg ? msg + ': ' : '') + 'expected ' + y + ', got ' + x); },
    ok: (c, msg) => { if (!c) throw new Error(msg || 'condition is false'); },
    app, abcjsAddWords
  };
  require('./abc.test.js')(ctx);
  suite('abc.test.js', () => {
    for (const t of tests) {
      try { t.fn(); record(true, false, '', ''); } catch (e) { record(false, false, 'abc.test.js', t.name + ': ' + e.message); }
    }
  });
}

// ---------- report ----------
console.log('');
if (fixedList.length) console.log('Known limitations that now work – remove the "!" in the test file:\n  ' + fixedList.join('\n  ') + '\n');
if (VERBOSE && knownList.length) console.log('Known limitations:\n  ' + knownList.join('\n  ') + '\n');
if (failures.length) console.log('FAILED:\n  ' + failures.join('\n  ') + '\n');
console.log(`${totals.fail ? 'FAILED' : 'OK'}: ${totals.pass} passed, ${totals.fail} failed, ${totals.known} known limitations` + (totals.known && !VERBOSE ? ' (--verbose lists them)' : ''));
process.exit(totals.fail ? 1 : 0);
