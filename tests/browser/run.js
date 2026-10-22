#!/usr/bin/env node
// Browser tests: the real app in a real (headless) Chromium – screen, sound scheduling, files, links, microphone.
// They cover what the Node tests (tests/run.js) cannot: the page itself.
//
//   npm install --no-save playwright && npx playwright install chromium     (once)
//   node tests/browser/run.js [filter] [--headed]
//
// No internet is used: requests outside the local test server are blocked, so the built-in renderer and the
// built-in synthesizer are tested. If vendor/abcjs-basic-min.js exists (python tools/fetch_abcjs.py), the abcjs
// test runs as well; otherwise it is skipped.
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) {
  console.log('Playwright is not installed. Run:  npm install --no-save playwright && npx playwright install chromium');
  process.exit(2);
}

const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const FILTER = args.find(a => !a.startsWith('--')) || '';
const HEADED = args.includes('--headed');

// ----- tiny test harness -----
const tests = [];
const test = (name, fn, opts = {}) => tests.push({ name, fn, opts });
class Fail extends Error {}
const ok = (v, msg) => { if (!v) throw new Fail(msg || 'expected true'); };
const eq = (a, b, msg) => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Fail((msg ? msg + ': ' : '') + 'expected ' + y + ', got ' + x); };
const near = (a, b, tol, msg) => { if (!(Math.abs(a - b) <= tol)) throw new Fail((msg ? msg + ': ' : '') + 'expected ' + b + ' ± ' + tol + ', got ' + a); };

// ----- static server for the app -----
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.md': 'text/markdown; charset=utf-8', '.ico': 'image/x-icon' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

// a 440 Hz "singer" for the fake microphone (mono 16-bit WAV, 6 s)
function fakeMicWav() {
  const sr = 48000, n = sr * 6, buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * i / sr) * 12000), 44 + i * 2);
  const f = path.join(os.tmpdir(), 'choir-fake-mic-440.wav'); fs.writeFileSync(f, buf); return f;
}

// ----- helpers used inside tests -----
let BASE = '';
async function openApp(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, locale: opts.locale || 'pl-PL', serviceWorkers: 'block', acceptDownloads: true, permissions: ['microphone'] });
  await ctx.route(url => !url.href.startsWith(BASE), route => route.abort());
  if (opts.fakeAbcjs) await ctx.addInitScript({ path: path.join(__dirname, 'fake-abcjs.js') });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  await page.goto(BASE + 'index.html' + (opts.hash || ''));
  await page.waitForFunction(() => typeof S !== 'undefined' && S.parsed && S.cur && document.getElementById('playBtn'));
  if (!opts.keepAbcjs) await page.evaluate(() => { S.set.abcjs = false; renderNow(); });
  return { ctx, page };
}
// put ABC text in the editor the way typing does (input event, then the delayed re-read)
async function setAbc(page, text) {
  await page.evaluate(t => { const e = document.getElementById('ed'); e.value = t; e.dispatchEvent(new Event('input', { bubbles: true })); }, text);
  await page.waitForFunction(t => S.cur && S.cur.abc === t && S.parsed && document.getElementById('ed').value === t, text);
  await page.waitForTimeout(350);
}
const toastText = page => page.evaluate(() => document.getElementById('toast').textContent);
const PIECE = 'X:1\nT:Test\nM:4/4\nL:1/4\nQ:1/4=100\nK:C\nC D E F | G A B c | c B A G | F E D C |]\n';

// =====================================================================================================
test('the app opens in Polish, English and German without errors or missing texts', async ({ browser }) => {
  for (const [locale, word] of [['pl-PL', 'Tempo'], ['en-GB', 'Tempo'], ['de-DE', 'Tempo']]) {
    const { ctx, page } = await openApp(browser, { locale });
    const bad = await page.evaluate(() => Array.from(document.querySelectorAll('[data-i18n]')).filter(el => {
      const k = el.dataset.i18n, s = el.textContent.trim(); return !s || (s === k && /[A-Z.]/.test(k)); }).map(el => el.dataset.i18n));
    eq(bad, [], locale + ' untranslated');
    ok((await page.textContent('body')).includes(word), locale + ' text');
    ok((await page.textContent('#footVer')).includes(await page.evaluate(() => APP_VERSION)), 'version in the footer');
    eq(page.errors, [], locale + ' errors');
    await ctx.close();
  }
});

test('the score is drawn with notes and note names', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, PIECE);
  eq(await page.locator('#score .ev').count() > 0, true, 'notes drawn');
  eq(await page.textContent('#songTitle'), 'Test');
  await page.evaluate(() => { S.set.names = true; renderNow(); });
  const names = await page.$$eval('#score text', ts => ts.map(t => t.textContent.trim()).filter(x => /^[a-hA-H][is]*$/.test(x)));
  ok(names.length >= 16, 'note names under the notes: ' + names.length);
  eq(page.errors, []);
  await ctx.close();
});

test('choosing a voice and the full score in a four-part piece', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await page.click('#newSatbBtn');
  await setAbc(page, 'X:1\nT:SATB\nM:4/4\nL:1/4\nV:S name="Sopran"\nV:A name="Alt"\nV:T name="Tenor" clef=treble-8\nV:B name="Bas" clef=bass\nK:C\nV:S\nc4|]\nV:A\nG4|]\nV:T\nE4|]\nV:B\nC,4|]\n');
  eq(await page.locator('#voiceChips button').count() >= 4, true, 'voice chips');
  await page.click('#voiceChips button:nth-child(4)');
  await page.waitForFunction(() => S.vi === 3);
  ok((await page.textContent('#pVoice')).includes('Bas'), 'chosen voice shown');
  await page.click('#tAll');
  await page.waitForTimeout(200);
  eq(await page.locator('#score svg .staff, #score svg line.st').count() >= 0, true);
  eq(await page.evaluate(() => !!(S.cur && S.cur.showAll)), true, 'full score on');
  eq(page.errors, []);
  await ctx.close();
});

test('warnings are shown in the user language; correct ABC gives none', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, 'X:1\nT:t\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c !D.S.!|]\n');
  ok((await page.textContent('#warn')).includes('segno'), 'D.S. without segno');
  await setAbc(page, 'X:1\nT:t\nL:1/4\nV:T clef=tenor\nK:C\nV:T\nc d e f|g a b c\'|\n');
  ok((await page.textContent('#warn')).includes('treble-8'), 'tenor clef hint');
  await setAbc(page, 'X:1\nT:t\nM:4/4\nL:1/4\nK:C\nC D E HF $ | G4 !fermata!|]\n');
  eq(await page.evaluate(() => S.parsed.warnings.length), 0, 'fermata H and $ are fine');
  eq(await page.locator('#warn').isHidden(), true, 'no warning box');
  eq(page.errors, []);
  await ctx.close();
});

test('words from W: are placed under the notes, saved as w: lines and the change can be undone', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  const text = 'X:1\nT:t\nM:4/4\nL:1/4\nK:C\nC D E F | G4 |]\nW:Wśród noc-nej ci-szy głos\n';
  await setAbc(page, text);
  await page.waitForSelector('#lyrNote:not([hidden])');
  await page.click('#lyrNote [data-lyr="save"]');
  await page.waitForFunction(() => /\nw:/.test(document.getElementById('ed').value));
  ok(!/\nW:/.test(await page.inputValue('#ed')), 'W: replaced');
  await page.click('#lyrNote [data-lyr="undo"]');
  await page.waitForFunction(t => document.getElementById('ed').value === t, text);
  eq(page.errors, []);
  await ctx.close();
});

test('playback highlights the notes in playing order (D.C. al Fine, fermata)', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, 'X:1\nT:t\nM:2/4\nL:1/4\nQ:1/4=300\nK:C\nC D | E HF !fine!|| G A | B c !D.C.alfine!|]\n');
  await page.evaluate(() => { S.set.count = false; S.set.metro = false; S.set.loop = false; });
  const tl = await page.evaluate(() => { const t = buildTimeline(S.parsed, S.vi); return { seq: t.seq, total: t.total }; });
  eq(tl.seq, [0, 1, 2, 3, 0, 1], 'bars in playing order');
  eq(tl.total, 3.5, 'the fermata bar is played twice, a quarter longer each time');
  await page.click('#playBtn');
  const seen = [];
  for (let i = 0; i < 200; i++) {
    const s = await page.evaluate(() => ({ on: P.playing, i: P.curI }));
    if (s.i != null && s.i >= 0 && seen[seen.length - 1] !== s.i) seen.push(s.i);
    if (!s.on && i > 5) break;
    await page.waitForTimeout(25);
  }
  eq(seen, [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3], 'highlighted notes');
  eq(page.errors, []);
  await ctx.close();
});

test('the built-in synthesizer plays when instrument sounds cannot be downloaded', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, PIECE);
  await page.selectOption('#instSel', 'acoustic_grand_piano');
  await page.click('#playBtn');
  await page.waitForFunction(() => P.playing && P.iters.length);
  const kinds = await page.evaluate(() => { const n = P.iters.flatMap(i => i.nodes); return { osc: n.filter(x => x instanceof OscillatorNode).length, buf: n.filter(x => x instanceof AudioBufferSourceNode).length }; });
  ok(kinds.osc > 0, 'oscillators scheduled');
  ok((await toastText(page)).length > 0, 'a message about the sounds');
  await page.click('#playBtn');
  eq(await page.evaluate(() => P.playing), false, 'stopped');
  eq(page.errors, []);
  await ctx.close();
});

test('transposing with the buttons: label, key, note names and sound; kept after reload', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, 'X:1\nT:Tr\nM:4/4\nL:1/4\nK:C\nC D E F |]\n');
  eq(await page.textContent('#trV'), 'bez zmian');
  ok(await page.locator('#trReset').isDisabled(), 'reset disabled at 0');
  await page.click('#trUp'); await page.click('#trUp');
  await page.waitForFunction(() => S.parsed && S.parsed.transpose === 2);
  eq(await page.textContent('#trV'), '+2 półtony');
  ok((await page.textContent('#songMeta')).includes('2♯'), 'key signature in the header');
  ok((await page.textContent('#songMeta')).includes('transpozycja +2'), 'transposition in the header');
  eq(await page.evaluate(() => S.parsed.voices[0].events.map(e => e.notes[0].midi)), [62, 64, 66, 67], 'sound');
  eq(await page.evaluate(() => S.parsed.voices[0].events.map(e => nameOf(e, 'german'))), ['d', 'e', 'fis', 'g'], 'note names');
  await page.waitForTimeout(1500);                                   // saved
  await page.reload();
  await page.waitForFunction(() => S.parsed && S.parsed.transpose === 2);
  eq(await page.textContent('#trV'), '+2 półtony', 'kept after reload');
  for (let i = 0; i < 4; i++) await page.click('#trDown');
  await page.waitForFunction(() => S.parsed && S.parsed.transpose === -2);
  eq(await page.textContent('#trV'), '−2 półtony');
  await page.click('#trReset');
  await page.waitForFunction(() => S.parsed && !S.parsed.transpose);
  eq(await page.evaluate(() => S.parsed.voices[0].events.map(e => e.notes[0].midi)), [60, 62, 64, 65], 'back to the original');
  eq(page.errors, []);
  await ctx.close();
});

test('a share link carries the piece and its transposition to another person', async ({ browser }) => {
  const A = await openApp(browser);
  const text = 'X:1\nT:Link test\nM:4/4\nL:1/4\nK:F\nF G A B | c4 |]\nw: Al-le-lu-ja A-men\n';
  await setAbc(A.page, text);
  await A.page.click('#trDown');
  await A.page.waitForFunction(() => S.parsed.transpose === -1);
  await A.page.click('#shareBtn');
  await A.page.waitForFunction(() => document.getElementById('shareUrl').value.includes('&p='));
  const url = await A.page.inputValue('#shareUrl');
  ok(url.includes('&t=-1&p=z'), 'compressed piece and transposition in the link: ' + url.slice(0, 80));
  const B = await openApp(browser, { locale: 'de-DE', hash: url.slice(url.indexOf('#')) });
  await B.page.waitForFunction(t => document.getElementById('ed').value === t, text);
  ok((await toastText(B.page)).includes('Link test'), 'received message');
  eq(await B.page.evaluate(() => S.parsed.transpose), -1, 'transposition received');
  eq(await B.page.evaluate(() => location.hash), '', 'link removed from the address bar');
  // the same link pasted with "Paste link" opens the same piece without a copy
  await B.page.click('#pasteBtn'); await B.page.fill('#pasteIn', url); await B.page.click('#pasteGo');
  await B.page.waitForTimeout(500);
  eq(await B.page.evaluate(() => S.songs.filter(s => s.title === 'Link test').length), 1, 'no duplicate');
  eq(A.page.errors.concat(B.page.errors), []);
  await A.ctx.close(); await B.ctx.close();
});

const pdfPages = buf => (buf.toString('latin1').match(/\/Type \/Page[^s]/g) || []).length;
test('PDF download gives a valid PDF', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, PIECE.replace('T:Test', 'T:Bóg się rodzi'));
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#pdfBtn')]);
  const buf = fs.readFileSync(await dl.path());
  eq(buf.slice(0, 5).toString(), '%PDF-', 'PDF header');
  ok(buf.includes('/Type /Page'), 'has a page');
  ok(buf.length > 5000, 'size ' + buf.length);
  eq(dl.suggestedFilename(), 'Bóg się rodzi.pdf', 'file name with Polish letters');
  eq(pdfPages(buf), 1, 'one page');
  eq(page.errors, []);
  await ctx.close();
});

// 8 parts × 5 verses: one system is taller than an A4 page
const HUGE = 'X:1\nT:Osiem głosów\nM:4/4\nL:1/4\n' + ['S1', 'S2', 'A1', 'A2', 'T1', 'T2', 'B1', 'B2'].map(v => 'V:' + v + (v[0] === 'B' ? ' clef=bass' : v[0] === 'T' ? ' clef=treble-8' : '') + '\n').join('') + 'K:C\n' +
  ['S1', 'S2', 'A1', 'A2', 'T1', 'T2', 'B1', 'B2'].map(v => 'V:' + v + '\n' + (v[0] === 'B' ? 'C, D, E, F, | G,4 |]' : 'c d e f | g4 |]') + '\n' + [1, 2, 3, 4, 5].map(k => 'w: ' + k + '.~Zwrot-ka nu-mer ' + k + ' tu\n').join('')).join('');
test('a system taller than a page: the PDF shrinks it instead of cutting it off', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, HUGE);
  await page.evaluate(() => { S.cur.showAll = true; renderNow(); });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#pdfBtn')]);
  const buf = fs.readFileSync(await dl.path());
  eq(pdfPages(buf), 1, 'everything on page 1 together with the title');
  // the same layout with the real sizes of the drawn systems: every system inside the page, none cut off
  const lay = await page.evaluate(() => {
    S.printing = true; document.documentElement.classList.add('pdfmode'); renderNow(true);
    const sizes = [...SC.querySelectorAll('svg')].map(svgSnapshot).map(x => ({ w: x.w, h: x.h }));
    document.documentElement.classList.remove('pdfmode'); S.printing = false; renderNow();
    const mm = 200 / 25.4, PW = Math.round(210 * mm), PH = Math.round(297 * mm), pg = { PW, PH, ML: 15 * mm, MT: 14 * mm, MB: 16 * mm, CW: PW - 30 * mm, head: 44 * 200 / 72 };
    return { pages: pdfLayout(sizes, pg), bottom: PH - pg.MB };
  });
  ok(lay.pages.flat().every(it => it.y + it.h <= lay.bottom + 0.01), 'no system below the bottom margin');
  eq(page.errors, []);
  await ctx.close();
});

test('printing: the first system fits on page 1 under the title (no page with only the title)', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, HUGE);
  await page.evaluate(() => { S.cur.showAll = true; renderNow(); preparePrint(); });
  await page.emulateMedia({ media: 'print' });
  const mm = await page.evaluate(() => { const svgs = [...SC.querySelectorAll('svg')]; return svgs.map(s => s.getBoundingClientRect().height * 25.4 / 96); });
  ok(mm.length > 0, 'systems'); ok(mm[0] <= 240.5, 'first system ' + mm[0].toFixed(0) + ' mm'); ok(mm.every(h => h <= 262.5), 'all systems fit a page');
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true });
  ok(pdf.length > 1000, 'print to PDF works');
  await page.emulateMedia({ media: 'screen' }); await page.evaluate(() => endPrint());
  eq(page.errors, []);
  await ctx.close();
});

test('saving the .abc file and opening a collection with several pieces', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, PIECE);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#saveBtn')]);
  const saved = fs.readFileSync(await dl.path(), 'utf8');
  ok(saved.startsWith('%abc-2.1'), 'standard header'); ok(saved.includes('T:Test'), 'piece in the file');
  const coll = 'X:1\nT:Pierwsza\nK:C\nCDEF|\n\nX:2\nT:Druga\nK:G\nGABc|\n\nX:3\nT:Trzecia\nK:D\nDEFA|\n';
  await page.setInputFiles('#fileIn', { name: 'zbior.abc', mimeType: 'text/plain', buffer: Buffer.from(coll) });
  await page.waitForSelector('#pickSheet:not([hidden])');
  eq(await page.locator('#pickList button').count(), 3, 'three pieces offered');
  await page.click('#pickList button[data-pk="1"]');
  await page.waitForFunction(() => S.parsed && S.parsed.title === 'Druga');
  eq(page.errors, []);
  await ctx.close();
});

test('recording with a microphone and downloading the take as WAV', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, 'X:1\nT:Rec\nM:4/4\nL:1/4\nQ:1/4=240\nK:C\nC D E F | G A B c |]\n');
  await page.evaluate(() => { S.set.count = false; S.set.loop = false; document.getElementById('recSec').open = true; });
  await page.click('#recBtn');
  await page.waitForFunction(() => REC.on, null, { timeout: 10000 });
  await page.waitForFunction(() => !REC.on && REC.take, null, { timeout: 15000 });
  await page.waitForSelector('#takeBox:not([hidden])');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#tkDlVoice')]);
  const buf = fs.readFileSync(await dl.path());
  eq(buf.slice(0, 4).toString() + buf.slice(8, 12).toString(), 'RIFFWAVE', 'WAV file');
  ok(buf.length > 20000, 'has sound: ' + buf.length);
  eq(page.errors, []);
  await ctx.close();
}, { mic: true });

test('the tuner hears a 440 Hz voice as a', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await page.evaluate(() => { document.getElementById('tunerSec').open = true; });
  await page.click('#tMic');
  await page.waitForFunction(() => /\d/.test(document.getElementById('tHz').textContent), null, { timeout: 10000 });
  await page.waitForTimeout(800);
  const hz = parseFloat((await page.textContent('#tHz')).replace(',', '.'));
  near(hz, 440, 4, 'frequency');
  ok(/^a/i.test((await page.textContent('#tNote')).trim()), 'note name ' + await page.textContent('#tNote'));
  await page.click('#tMic');
  eq(page.errors, []);
  await ctx.close();
}, { mic: true });

test('a warm-up opens as a piece with notes', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await page.evaluate(() => { document.getElementById('warmSec').open = true; });
  await page.click('#warmList [data-wu]');
  await page.waitForFunction(() => S.parsed && S.parsed.voices.some(v => v.events.some(e => e.kind === 'note')));
  ok(await page.locator('#score .ev').count() > 0, 'warm-up drawn');
  eq(page.errors, []);
  await ctx.close();
});

test('note buttons write ABC into the editor', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await setAbc(page, 'X:1\nT:t\nM:4/4\nL:1/4\nK:C\n');
  await page.evaluate(() => { document.getElementById('edDetails').open = true; const e = document.getElementById('ed'); e.focus(); e.setSelectionRange(e.value.length, e.value.length); });
  const before = await page.inputValue('#ed');
  await page.click('#noteRow button >> nth=0');
  await page.waitForTimeout(400);
  ok((await page.inputValue('#ed')).length > before.length, 'a note was written');
  eq(page.errors, []);
  await ctx.close();
});

test('in-app help describes jumps, fermata, breath, parts and transposition in every language', async ({ browser }) => {
  for (const [locale, words] of [['pl-PL', ['Skoki', 'Fermata', 'Oddech', 'P:', 'transpose=']], ['en-GB', ['Jumps', 'Fermata', 'Breath', 'P:', 'transpose=']], ['de-DE', ['Sprünge', 'Fermate', 'Atem', 'P:', 'transpose=']]]) {
    const { ctx, page } = await openApp(browser, { locale });
    const help = await page.evaluate(() => document.querySelector('.helpbody').textContent);
    for (const w of words) ok(help.includes(w), locale + ' help mentions ' + w);
    await ctx.close();
  }
});

// ----- printed pages: every page has whole, readable staves; nothing is cut off, faint or coloured -----
const { analyzePage } = require('./page-check.js');
const { execFileSync } = require('child_process');
const HAS_PDFTOPPM = (() => { try { execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' }); return true; } catch (e) { return false; } })();
// the app's own PDF: structure (xref offsets, pages, A4) and the JPEG of every page
function readAppPdf(buf) {
  const s = buf.toString('latin1'), sx = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(s);
  ok(sx, 'startxref at the end');
  const xr = s.slice(+sx[1]); ok(xr.startsWith('xref'), 'xref table where startxref points');
  const m = /xref\s+0 (\d+)\s+/.exec(xr), n = +m[1], rows = xr.slice(m[0].length).split('\n');
  for (let k = 1; k < n; k++) { const off = parseInt(rows[k], 10); ok(s.startsWith(k + ' 0 obj', off), 'object ' + k + ' at its xref offset'); }
  const count = +/\/Type \/Pages [^>]*\/Count (\d+)/.exec(s)[1];
  eq((s.match(/\/MediaBox \[0 0 595\.28 841\.89\]/g) || []).length, count, 'every page is A4');
  const imgs = []; const re = /\/Subtype \/Image \/Width (\d+) \/Height (\d+)[^>]*\/Length (\d+) >>\nstream\n/g; let mm;
  while ((mm = re.exec(s))) { const st = mm.index + mm[0].length, jpg = buf.subarray(st, st + +mm[3]); ok(jpg[0] === 0xFF && jpg[1] === 0xD8 && jpg[jpg.length - 2] === 0xFF && jpg[jpg.length - 1] === 0xD9, 'whole JPEG'); imgs.push({ w: +mm[1], h: +mm[2], jpg }); }
  eq(imgs.length, count, 'one picture per page');
  return imgs;
}
// how many staves the score should have on paper: systems x parts shown
const expectedStaves = page => page.evaluate(() => {
  S.printing = true; renderNow(true); const n = SC.querySelectorAll('svg').length; S.printing = false; renderNow();
  const parts = S.cur.showAll ? S.parsed.voices.filter(v => v.measures.length).length : 1; return n * parts;
});
function checkPages(label, pages, expect, opts = {}) {
  ok(pages.length >= (opts.minPages || 1), label + ': ' + pages.length + ' pages');
  let total = 0;
  pages.forEach((r, k) => {
    const p = label + ' page ' + (k + 1);
    ok(r.staves.length > 0, p + ': has music');
    ok(r.staves.every(s => s.n === 5), p + ': every staff has 5 lines (' + r.staves.map(s => s.n).join(',') + ')');
    eq(r.lonely, 0, p + ': no single staff lines (staff cut by the page edge)');
    ok(Math.min(...r.staves.map(s => s.space)) >= (opts.minSpace || 1.9), p + ': readable, staff space ' + Math.min(...r.staves.map(s => s.space)).toFixed(2) + ' mm');
    for (const side of ['left', 'right', 'top', 'bottom']) ok(r.margin[side] <= 30, p + ': nothing printed in the ' + side + ' margin (' + r.margin[side] + ')');
    ok(r.color <= r.w * r.h * 1e-4, p + ': black on white, coloured pixels ' + r.color);
    total += r.staves.length;
  });
  eq(total, expect, label + ': all staves are printed');
}
// "Pobierz PDF": download it, check the file, decode each page in the browser and analyse it there
async function downloadAndCheck(page, label, opts = {}) {
  const expect = await expectedStaves(page);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#pdfBtn')]);
  const imgs = readAppPdf(fs.readFileSync(await dl.path()));
  await page.addScriptTag({ path: path.join(__dirname, 'page-check.js') });
  const res = [];
  for (const im of imgs) res.push(await page.evaluate(async ([b64, w, h]) => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < u.length; i++) u[i] = bin.charCodeAt(i);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/jpeg' })), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d'); cx.drawImage(bm, 0, 0);
    return analyzePage(cx.getImageData(0, 0, w, h).data, w, h, 4, 200, { left: 15, right: 15, top: 14, bottom: 16, footerTop: 11 });
  }, [Buffer.from(im.jpg).toString('base64'), im.w, im.h]));
  checkPages(label + ' (PDF)', res, expect, opts);
  return res;
}
// "Drukuj": the browser prints the page with the print stylesheet; pages are rendered with pdftoppm (poppler)
async function printAndCheck(page, label, opts = {}) {
  const expect = await expectedStaves(page);
  await page.evaluate(() => preparePrint()); await page.emulateMedia({ media: 'print', colorScheme: opts.dark ? 'dark' : 'light' });
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true });
  await page.emulateMedia({ media: 'screen', colorScheme: opts.dark ? 'dark' : 'light' }); await page.evaluate(() => endPrint());
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'choir-print-')), f = path.join(dir, 'p.pdf'); fs.writeFileSync(f, pdf);
  execFileSync('pdftoppm', ['-r', '200', f, path.join(dir, 'p')]);
  const res = fs.readdirSync(dir).filter(x => x.endsWith('.ppm')).sort().map(x => {
    const b = fs.readFileSync(path.join(dir, x)); let p = 0;
    const tok = () => { while (/\s/.test(String.fromCharCode(b[p]))) p++; let s = ''; while (!/\s/.test(String.fromCharCode(b[p]))) s += String.fromCharCode(b[p++]); return s; };
    tok(); const w = +tok(), h = +tok(); tok(); p++;
    return analyzePage(b.subarray(p), w, h, 3, 200, { left: 15, right: 15, top: 14, bottom: 15 });
  });
  fs.rmSync(dir, { recursive: true, force: true });
  checkPages(label + ' (print)', res, expect, opts);
  return res;
}
const LONG = 'X:1\nT:Długa partia\nM:4/4\nL:1/4\nK:F\n' + Array.from({ length: 12 }, () => 'F G A B | c2 A2 | B G E C | F4 |\nw: Al-le-lu-ja chwa-ła Pa-nu wszyst-kie lu-dy śpie-waj-cie mu').join('\n') + '\n';
const SATB6 = 'X:1\nT:Chorał\nM:4/4\nL:1/4\nV:S name="Sopran"\nV:A name="Alt"\nV:T name="Tenor" clef=treble-8\nV:B name="Bas" clef=bass\nK:D\n' +
  [['S', 'A B c d | e2 d2 | c B A G | F4'], ['A', 'F G A B | c2 B2 | A G F E | D4'], ['T', 'd d e f | g2 f2 | e d c B | A4'], ['B', 'D, E, F, G, | A,2 B,2 | A, G, F, E, | D,4']]
    .map(([v, m]) => 'V:' + v + '\n' + Array.from({ length: 6 }, () => m + ' |\nw: Al-le-lu-ja chwa-ła Pa-nu wszyst-kie lu-dy śpie-waj-cie mu').join('\n')).join('\n') + '\n';
const VERSES = 'X:1\nT:Trzy zwrotki\nM:3/4\nL:1/4\nV:S name="Sopran"\nV:B name="Bas" clef=bass\nK:C\nV:S\nE F G | A2 G | F E D | C3 |]\nw: 1.~Pierw-sza zwrot-ka, tekst pod nu-ta-mi\nw: 2.~Dru-ga zwrot-ka, tekst pod nu-ta-mi\nw: 3.~Trze-cia zwrot-ka, tekst pod nu-ta-mi\nV:B\nC, D, E, | F,2 E, | D, C, B,, | C,3 |]\n';
const PRINT_CASES = [
  ['short piece', PIECE, {}],
  ['long part on two pages', LONG, { minPages: 2 }],
  ['full SATB score on three pages', SATB6, { all: true, minPages: 3 }],
  ['one part of the SATB score', SATB6, { voice: 3 }],
  ['verses under the notes', VERSES, { all: true }],
  ['transposed', PIECE, { up: 3 }],
  ['a system taller than a page', HUGE, { all: true, minSpace: 1.2 }]
];
async function preparePiece(page, abc, o) {
  await setAbc(page, abc);
  if (o.all) await page.evaluate(() => { S.cur.showAll = true; renderNow(); });
  if (o.voice != null) await page.evaluate(v => { S.cur.showAll = false; S.vi = v; S.cur.voice = S.parsed.voices[v].id; refresh(); }, o.voice);
  for (let k = 0; k < (o.up || 0); k++) await page.click('#trUp');
  await page.waitForTimeout(250);
}

test('PDF download: every page has whole, readable staves; nothing cut off, faint or empty', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  for (const [label, abc, o] of PRINT_CASES) { await preparePiece(page, abc, o); await downloadAndCheck(page, label, o); }
  eq(page.errors, []);
  await ctx.close();
});

test('PDF download in dark mode with tuner marks and the playback cursor: black on white only', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await page.emulateMedia({ colorScheme: 'dark' });
  await preparePiece(page, SATB6, { all: true });
  await page.evaluate(() => { const v = S.vi, evs = S.parsed.voices[v].events; S.marks = { songId: S.cur.id, v, res: {}, fresh: 0 }; evs.forEach((e, k) => { if (e.kind === 'note') S.marks.res[e.i] = { cls: ['ok', 'warn', 'bad'][k % 3], c: 10 }; }); applyMarks(); setCur(2); });
  ok(await page.evaluate(() => SC.querySelectorAll('.pk-ok,.pk-bad,.cur').length) > 0, 'marks are on screen');
  await downloadAndCheck(page, 'dark mode with marks', { minPages: 3 });
  eq(page.errors, []);
  await ctx.close();
});

test('printing: every page has whole, readable staves; nothing cut off, faint or empty', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  for (const [label, abc, o] of PRINT_CASES) { await preparePiece(page, abc, o); await printAndCheck(page, label, o); }
  eq(page.errors, []);
  await ctx.close();
}, { needsTool: 'pdftoppm' });

test('printing in dark mode with tuner marks: black on white only', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await page.emulateMedia({ colorScheme: 'dark' });
  await preparePiece(page, SATB6, { all: true });
  await page.evaluate(() => { const v = S.vi, evs = S.parsed.voices[v].events; S.marks = { songId: S.cur.id, v, res: {}, fresh: 0 }; evs.forEach((e, k) => { if (e.kind === 'note') S.marks.res[e.i] = { cls: ['ok', 'warn', 'bad'][k % 3], c: 10 }; }); applyMarks(); });
  await printAndCheck(page, 'dark mode with marks', { dark: true, minPages: 3 });
  eq(page.errors, []);
  await ctx.close();
}, { needsTool: 'pdftoppm' });

// ----- the invisible tap areas around the notes (rect.hit) and the bar-range band (rect.rng) -----
// abcjs sets stroke="currentColor" on its drawings, so a rectangle added without its own stroke gets a black frame.
// The pages must be the same with and without these rectangles: they are never visible on paper.
async function pdfPagePixels(page) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#pdfBtn')]);
  const imgs = readAppPdf(fs.readFileSync(await dl.path())), out = [];
  for (const im of imgs) out.push(await page.evaluate(async ([b64, w, h]) => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < u.length; i++) u[i] = bin.charCodeAt(i);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/jpeg' })), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d'); cx.drawImage(bm, 0, 0); const d = cx.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h);
    for (let i = 0; i < g.length; i++) g[i] = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3;
    let s = ''; for (let i = 0; i < g.length; i += 8192) s += String.fromCharCode.apply(null, g.subarray(i, i + 8192)); return btoa(s);
  }, [Buffer.from(im.jpg).toString('base64'), im.w, im.h]));
  return out.map(b64 => Buffer.from(b64, 'base64'));
}
async function printPagePixels(page, removeRects) {
  await page.evaluate(() => preparePrint()); await page.emulateMedia({ media: 'print' });
  if (removeRects) await page.evaluate(() => SC.querySelectorAll('rect.hit,rect.rng').forEach(r => r.remove()));
  const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true });
  await page.emulateMedia({ media: 'screen' }); await page.evaluate(() => endPrint());
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'choir-hit-')), f = path.join(dir, 'p.pdf'); fs.writeFileSync(f, pdf);
  execFileSync('pdftoppm', ['-r', '150', '-gray', f, path.join(dir, 'p')]);
  const out = fs.readdirSync(dir).filter(x => x.endsWith('.pgm')).sort().map(x => fs.readFileSync(path.join(dir, x)));
  fs.rmSync(dir, { recursive: true, force: true }); return out;
}
const differing = (a, b) => { if (a.length !== b.length) return Infinity; let n = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 40) n++; return n; };
async function checkTapAreas(page, label) {
  await setAbc(page, 'X:1\nT:Ramki\nM:4/4\nL:1/4\nK:G\nG A B c | d2 B2 | c A F D | G4 |]\n');
  await page.fill('#fromIn', '2'); await page.fill('#toIn', '3'); await page.dispatchEvent('#toIn', 'change'); await page.waitForTimeout(300);
  const look = () => page.evaluate(() => [...SC.querySelectorAll('rect.hit,rect.rng')].map(r => { const cs = getComputedStyle(r); return { cls: r.classList.contains('hit') ? 'hit' : 'rng', stroke: cs.stroke, fill: cs.fill, display: cs.display }; }));
  const screen = await look();
  ok(screen.some(r => r.cls === 'hit') && screen.some(r => r.cls === 'rng'), label + ': tap areas and the bar-range band exist (' + JSON.stringify(screen.map(r => r.cls).reduce((o, c) => (o[c] = (o[c] || 0) + 1, o), {})) + ', mode ' + await page.evaluate(() => S.layout && S.layout.mode) + ', range ' + await page.evaluate(() => JSON.stringify(rangeVals())) + ')');
  ok(screen.every(r => r.stroke === 'none'), label + ': no frame on screen (' + [...new Set(screen.map(r => r.stroke))].join(', ') + ')');
  ok(screen.filter(r => r.cls === 'hit').every(r => r.fill === 'rgba(0, 0, 0, 0)' || r.fill === 'none'), label + ': tap areas are see-through');
  await page.evaluate(() => preparePrint()); await page.emulateMedia({ media: 'print' });
  const printed = await look();
  await page.emulateMedia({ media: 'screen' }); await page.evaluate(() => endPrint());
  ok(printed.every(r => r.display === 'none'), label + ': not drawn when printing');
  // PDF download: pages with and without the rectangles are the same
  const pdfA = await pdfPagePixels(page);
  await page.evaluate(() => { window.__snap = svgSnapshot; svgSnapshot = svg => { svg.querySelectorAll('rect.hit,rect.rng').forEach(r => r.remove()); return window.__snap(svg); }; });
  const pdfB = await pdfPagePixels(page);
  await page.evaluate(() => { svgSnapshot = window.__snap; });
  eq(pdfA.length, pdfB.length, label + ': PDF pages');
  pdfA.forEach((a, k) => eq(differing(a, pdfB[k]), 0, label + ': PDF page ' + (k + 1) + ' has no frames (differing pixels)'));
  // printing: the same comparison on the printed pages
  if (HAS_PDFTOPPM) {
    const pA = await printPagePixels(page, false), pB = await printPagePixels(page, true);
    eq(pA.length, pB.length, label + ': printed pages');
    pA.forEach((a, k) => eq(differing(a, pB[k]), 0, label + ': printed page ' + (k + 1) + ' has no frames (differing pixels)'));
  }
}
test('tap areas around the notes are invisible and never printed – abcjs drawing', async ({ browser }) => {
  const { ctx, page } = await openApp(browser, { fakeAbcjs: true, keepAbcjs: true });
  await page.waitForFunction(() => S.layout && S.layout.mode === 'abcjs');
  await checkTapAreas(page, 'abcjs');
  eq(page.errors, []);
  await ctx.close();
});
test('tap areas around the notes are invisible and never printed – built-in drawing', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  await checkTapAreas(page, 'built-in');
  eq(page.errors, []);
  await ctx.close();
});

test('the files of the installable app are served', async ({ browser }) => {
  const { ctx, page } = await openApp(browser);
  const st = await page.evaluate(async () => {
    const out = {};
    for (const f of ['manifest.webmanifest', 'sw.js', 'i18n.js', 'warmups.js', 'warmups.html']) out[f] = (await fetch(f)).status;
    const man = await (await fetch('manifest.webmanifest')).json();
    for (const ic of man.icons || []) out[ic.src] = (await fetch(ic.src)).status;
    return out;
  });
  for (const [f, s] of Object.entries(st)) eq(s, 200, f);
  await ctx.close();
});

test('abcjs draws and transposes the score (needs vendor/abcjs-basic-min.js)', async ({ browser }) => {
  const { ctx, page } = await openApp(browser, { keepAbcjs: true });
  await page.waitForFunction(() => ABCJS_STATE !== 'loading', null, { timeout: 15000 });
  eq(await page.evaluate(() => ABCJS_STATE), 'ready', 'abcjs loaded from vendor/');
  await setAbc(page, 'X:1\nT:abcjs\nM:4/4\nL:1/4\nK:C\nC D E F | G4 |]\n');
  ok(await page.locator('#score svg .abcjs-note').count() >= 5, 'abcjs notes');
  const before = await page.innerHTML('#score');
  await page.click('#trUp'); await page.click('#trUp');
  await page.waitForFunction(() => S.parsed.transpose === 2);
  await page.waitForTimeout(300);
  ok(await page.locator('#score svg .abcjs-note').count() >= 5, 'still drawn');
  ok(before !== await page.innerHTML('#score'), 'the drawing changed');
  await page.click('#trReset');
  await checkTapAreas(page, 'real abcjs');
  eq(page.errors, []);
  await ctx.close();
}, { needs: 'vendor/abcjs-basic-min.js' });

// =====================================================================================================
(async () => {
  const srv = await serve();
  BASE = 'http://127.0.0.1:' + srv.address().port + '/';
  const mic = fakeMicWav();
  // Chromium on Linux takes the file-name encoding from LANG; without it, names like "Bóg się rodzi.pdf" become "download"
  const env = Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' });
  const launch = withMic => chromium.launch({ headless: !HEADED, env, args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'].concat(withMic ? ['--use-file-for-fake-audio-capture=' + mic] : []) });
  const plain = await launch(false), withMic = await launch(true);
  let pass = 0, fail = 0, skip = 0; const failed = [];
  for (const t of tests) {
    if (FILTER && !t.name.toLowerCase().includes(FILTER.toLowerCase())) continue;
    if (t.opts.needs && !fs.existsSync(path.join(ROOT, t.opts.needs))) { skip++; console.log(' skip ' + t.name + '  (no ' + t.opts.needs + ')'); continue; }
    if (t.opts.needsTool && !HAS_PDFTOPPM) { skip++; console.log(' skip ' + t.name + '  (no ' + t.opts.needsTool + ': install poppler-utils)'); continue; }
    const t0 = Date.now();
    try {
      await Promise.race([t.fn({ browser: t.opts.mic ? withMic : plain }), new Promise((_, rej) => setTimeout(() => rej(new Fail('timeout')), 60000))]);
      pass++; console.log(' ok   ' + t.name + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
    } catch (e) {
      fail++; failed.push(t.name + ': ' + (e instanceof Fail ? e.message : (e.stack || e).toString().split('\n').slice(0, 3).join(' | ')));
      console.log('FAIL ' + t.name);
    }
  }
  await plain.close(); await withMic.close(); srv.close();
  if (failed.length) { console.log('\nFAILED:'); for (const f of failed) console.log('  ' + f); }
  console.log('\n' + (fail ? 'FAILED' : 'OK') + ': ' + pass + ' passed, ' + fail + ' failed' + (skip ? ', ' + skip + ' skipped' : ''));
  process.exit(fail ? 1 : 0);
})();
