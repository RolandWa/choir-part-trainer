// Checks one printed page given as pixels: are there staves with notes, is every staff whole (5 lines), how big is the
// staff (readability), is anything printed in the margins (cut off / outside the page), are there coloured pixels.
// Plain JavaScript without dependencies: the same function runs in Node (pages of a printed PDF, rendered with
// pdftoppm) and inside the browser (pages of the app's own PDF, decoded from JPEG on a canvas).
'use strict';
function analyzePage(px, w, h, ch, dpi, box) {
  // px: pixel bytes, ch: bytes per pixel (3 RGB, 4 RGBA); dpi of the picture; box: printable area in mm
  // {left, right, top, bottom, footerTop?} measured from the page edges
  const mm = dpi / 25.4, DARK = 140;
  const lum = i => 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
  const x0 = Math.round(box.left * mm), x1 = Math.round(w - box.right * mm), y0 = Math.round(box.top * mm), y1 = Math.round(h - box.bottom * mm);
  const minRun = 0.10 * (x1 - x0);
  let dark = 0, color = 0;
  const margin = { left: 0, right: 0, top: 0, bottom: 0 };
  const cand = new Uint8Array(h), ink = new Uint32Array(h);
  const footerTop = box.footerTop != null ? Math.round(h - box.footerTop * mm) : h;
  for (let y = 0; y < h; y++) {
    let run = 0, best = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch, L = lum(i);
      const sat = Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
      if (sat > 60 && L < 235) color++;
      if (L < DARK) {
        dark++; ink[y]++; run++; if (run > best) best = run;
        if (x < x0 - mm) margin.left++; else if (x > x1 + mm) margin.right++;
        if (y < y0 - mm) margin.top++; else if (y > y1 + 0.5 * mm && y < footerTop - 0.5 * mm) margin.bottom++;
      } else run = 0;
    }
    if (best >= minRun) cand[y] = 1;
  }
  // staff lines: thin rows with a long dark run (beams are thick, ties and words are short)
  const lines = [];
  for (let y = 0; y < h;) {
    if (!cand[y]) { y++; continue; }
    let e = y; while (e + 1 < h && cand[e + 1]) e++;
    if (e - y + 1 <= 0.45 * mm + 1) lines.push((y + e) / 2);
    y = e + 1;
  }
  // five lines with equal gaps make a staff
  const staves = []; let g = null;
  const close = () => { if (g) { const gaps = g.slice(1).map((v, k) => v - g[k]); staves.push({ n: g.length, top: g[0] / mm, bottom: g[g.length - 1] / mm, space: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length / mm : 0 }); } g = null; };
  for (const y of lines) {
    if (!g) { g = [y]; continue; }
    const gap = y - g[g.length - 1];
    if (g.length === 1 ? gap <= 3.5 * mm : Math.abs(gap - (g[1] - g[0])) <= Math.max(1.5, 0.25 * (g[1] - g[0]))) g.push(y);
    else { close(); g = [y]; }
  }
  close();
  // ink below the top of the area used by music (for "page 1 is not only the title")
  return { w, h, dark, color, margin, staves: staves.filter(s => s.n >= 2), lonely: staves.filter(s => s.n === 1).length, pageMm: { w: w / mm, h: h / mm } };
}
if (typeof module !== 'undefined') module.exports = { analyzePage };
