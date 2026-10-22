// Used by tests/browser/run.js. The real abcjs is not part of the repository (and the tests use no internet).
// stand-in for abcjs: draws with the built-in renderer, then makes the drawing look to the app like abcjs output:
// no tap rectangles of its own, and stroke/fill="currentColor" on every <svg> (abcjs createSvg() does exactly this)
window.ABCJS = { renderAbc(host, text, opts) {
  const R = parseABC(text);
  const out = renderScore(R, { width: opts.staffwidth + 24, names: false, naming: 'german', voices: R.voices.map((v, i) => i) });
  host.innerHTML = out.systems.join('');
  host.querySelectorAll('rect.hit').forEach(r => r.remove());
  host.querySelectorAll('svg').forEach(s => { s.setAttribute('stroke', 'currentColor'); s.setAttribute('fill', 'currentColor'); });
  const map = new Map(); R.voices.forEach((v, vi) => v.events.forEach(ev => map.set(ev.c0, { vi, ev })));
  return [{ getElementFromChar(p) { const x = map.get(p); if (!x) return null;
    const g = host.querySelector('g.ev[data-v="' + x.vi + '"][data-i="' + x.ev.i + '"]');
    return g ? { abselem: { elemset: [...g.children] } } : null; } }];
} };
