// Unit tests of the ABC reader and of the lyrics rules. Each test(name, fn) throws when something is wrong.
// eq(actual, expected) compares as JSON. Run with: node tests/run.js abc.test
'use strict';
module.exports = ({ test, eq, ok, app, abcjsAddWords }) => {
  const parse = body => app.parseABC('X:1\nT:t\nM:4/4\nL:1/4\nK:C\n' + body + '\n');
  const midis = (R, v = 0) => R.voices[v].events.filter(e => e.kind === 'note').map(e => e.notes.map(n => n.midi).join('+'));
  const words = (R, row = 0, v = 0) => R.voices[v].events.filter(e => e.kind === 'note').map(e => (e.lyrics[row] ? e.lyrics[row].t : ''));
  // the same w: line read by abcjs (see lib/abcjs-words.js) must put the same syllables on the same notes
  const likeAbcjs = (R, wline, v = 0) => {
    const els = []; let pm = null;
    for (const e of R.voices[v].events) {
      if (e.kind !== 'note' && e.kind !== 'rest') continue;
      if (pm !== null && e.measure !== pm) els.push({ type: 'bar' });
      pm = e.measure; els.push({ type: e.kind, ev: e });
    }
    abcjsAddWords(els, wline);
    return els.filter(x => x.type === 'note').map(x => (x.lyric && x.lyric[0] ? x.lyric[0].syllable.replace(/\u00a0/g, ' ') : ''));
  };
  const lyricCase = (name, music, wline, expected) => test('lyrics: ' + name, () => {
    const R = parse(music + '\nw:' + wline);
    eq(words(R), expected, 'app');
    eq(likeAbcjs(parse(music), wline), expected, 'abcjs');
  });

  // ----- notes -----
  test('pitches and octave marks', () => eq(midis(parse("C D E F G A B c c' C,")), ['60', '62', '64', '65', '67', '69', '71', '72', '84', '48']));
  test('key signature, and an accidental lasts until the bar line', () => eq(midis(app.parseABC('X:1\nL:1/4\nK:G\nF ^c c | c|\n')), ['66', '73', '73', '72']));
  test('chords', () => eq(midis(parse('[CEG] [A,CE]')), ['60+64+67', '57+60+64']));
  test('note lengths with L:1/8', () => {
    const R = app.parseABC('X:1\nL:1/8\nK:C\nA A2 A/2 A3/2 A/|\n');
    eq(R.voices[0].events.map(e => e.dur), [0.125, 0.25, 0.0625, 0.1875, 0.0625]);
  });
  test('broken rhythm A>B', () => eq(app.parseABC('X:1\nL:1/8\nK:C\nA>B|\n').voices[0].events.map(e => e.dur), [0.1875, 0.0625]));
  test('triplet (3', () => eq(app.parseABC('X:1\nL:1/8\nK:C\n(3ABC|\n').voices[0].events.map(e => Math.round(e.dur * 3 * 1000) / 1000), [0.25, 0.25, 0.25]));
  test('tie marks the second note', () => eq(parse('C2- C2 D2').voices[0].events.map(e => e.tieFromPrev), [false, true, false]));
  test('slur start and end are recorded', () => { const ev = parse('(C D E) F').voices[0].events; eq([ev[0].slurStart, ev[2].slurEnd, ev[3].slurStart], [1, 1, 0]); });
  test('tenor in treble-8 sounds an octave lower', () => {
    const R = app.parseABC('X:1\nL:1/4\nV:T clef=treble-8\nK:C\nV:T\nc|\n');
    eq(midis(R), ['60']);
  });
  test('voices are read with their names and clefs', () => {
    const R = app.parseABC('X:1\nL:1/4\nV:S name="Sopran"\nV:B name="Bas" clef=bass\nK:C\nV:S\nc|\nV:B\nC,|\n');
    eq(R.voices.map(v => [v.id, v.name, v.clef]), [['S', 'Sopran', 'treble'], ['B', 'Bas', 'bass']]);
  });
  test('an incomplete first bar (pickup) is bar 0', () => eq(parse('C | D E F G | A4|').voices[0].measures.map(m => m.number), [0, 1, 2]));

  // ----- repeats -----
  test('repeat |: :| is played twice', () => eq(app.expandRepeats(parse('|: C4 | D4 :| E4 |]').voices[0].measures), [0, 1, 0, 1, 2]));
  test('first and second endings', () => eq(app.expandRepeats(parse('|: C4 |1 D4 :|2 E4 |]').voices[0].measures), [0, 1, 0, 2]));

  // ----- D.C. / D.S. / Fine / Coda (played order of bars, by bar number) -----
  const order = (body, head) => {
    const R = app.parseABC((head || 'X:1\nT:t\nM:4/4\nL:1/4\nK:C\n') + body + '\n'), M = R.voices[0].measures;
    return { bars: app.buildTimeline(R, 0).seq.map(i => M[i].number), warn: R.warnings.map(w => w.k), R };
  };
  const jumpCase = (name, body, bars, warn = []) => test('jumps: ' + name, () => { const r = order(body); eq(r.bars, bars, 'bars'); eq(r.warn, warn, 'warnings'); });
  jumpCase('a piece without jumps keeps its repeats', '|: C D E F | G A B c :|', [1, 2, 1, 2]);
  jumpCase('D.C. plays everything again', 'C D E F | G A B c !D.C.!|]', [1, 2, 1, 2]);
  jumpCase('D.C. al Fine stops at Fine', 'C D E F | G A B c !fine!|| d e f g | g f e d !D.C.alfine!|]', [1, 2, 3, 4, 1, 2]);
  jumpCase('plain D.C. stops at Fine when there is one', 'C D E F | G A B c !fine!|| d e f g | g f e d !D.C.!|]', [1, 2, 3, 4, 1, 2]);
  jumpCase('D.S. al Fine starts at the segno (S)', 'C D E F |S G A B c | c B A G !fine!|| d e f g !D.S.alfine!|]', [1, 2, 3, 4, 2, 3]);
  jumpCase('segno written before a bar line belongs to the next bar', 'C D E F !segno!| G A B c | d e f g !D.S.!|]', [1, 2, 3, 2, 3]);
  jumpCase('D.S. al Coda: from the first O to the second', 'C D E F |S G A B c | c B A G O|| d e f g !D.S.alcoda!|| O C4 | C4 |]', [1, 2, 3, 4, 2, 3, 5, 6]);
  jumpCase('!coda! decorations work like O', 'C D E F | G A B c !coda!|| d e f g !D.C.alcoda!|| !coda! C4 |]', [1, 2, 3, 1, 2, 4]);
  jumpCase('"To Coda" text marks where to leave', 'C D E F | G A B c "^To Coda"O|| d e f g "^D.C. al Coda"|| O C4 |]', [1, 2, 3, 1, 2, 4]);
  jumpCase('text "D.C. al Fine" and "Fine" above the notes', 'C D E F | G A B c "^Fine"|| d e f g | g f e d "^D.C. al Fine"|]', [1, 2, 3, 4, 1, 2]);
  jumpCase('old +D.C.+ and +fine+ decorations', 'C D E F | G A B c +fine+|| d e f g +D.C.+|]', [1, 2, 3, 1, 2]);
  jumpCase('after D.C. repeats are played once, with the last ending', '|: C D E F |[1 G A B c :|[2 c B A G || d e f g !D.C.!|]', [1, 2, 1, 3, 4, 1, 3, 4]);
  jumpCase('bars after the D.C. are played at the end', 'C D E F | G A B c !D.C.!|| d e f g |]', [1, 2, 1, 2, 3]);
  jumpCase('D.S. without a segno repeats from the beginning and warns', 'C D E F | G A B c !D.S.!|]', [1, 2, 1, 2], ['w.noSegno']);
  jumpCase('al Coda without coda signs plays to the end and warns', 'C D E F | G A B c !D.C.alcoda!|]', [1, 2, 1, 2], ['w.noCoda']);
  test('jumps: a mark written in one part applies to all parts', () => {
    const R = app.parseABC('X:1\nM:4/4\nL:1/4\nV:S\nV:B clef=bass\nK:C\nV:S\nC D E F | G A B c !fine!|| d e f g !D.C.alfine!|]\nV:B\nC, D, E, F, | G, A, B, C | D E F G |]\n');
    const tl = app.buildTimeline(R, 1);
    eq(tl.seq, [0, 1, 2, 0, 1]);
    eq(tl.audio.filter(a => a.v === 1).length, 20);
    eq(tl.total, 5);
  });
  test('jumps: a chosen range of bars is played straight, without jumps', () => {
    const R = order('C D E F | G A B c !D.C.!|]').R;
    eq(app.buildTimeline(R, 0, 1, 2).seq, [0, 1]);
  });
  test('jumps: chord symbols are not jump marks', () => eq(order('"Am"C D "G7"E F | "Dm"G A B c |]').bars, [1, 2]));

  // ----- octave= and transpose= (ABC 2.1, 4.6 – like abcjs) -----
  const pitches = (head, body) => { const R = app.parseABC('X:1\nL:1/4\n' + head + '\n' + body + '\n'); return { midi: midis(R), steps: R.voices[0].events.map(e => e.notes[0].step), warn: R.warnings.map(w => w.k), R }; };
  test('octave=-1 in V: moves notes down an octave on the staff and in sound', () => {
    const r = pitches('V:B clef=bass octave=-1\nK:C\nV:B', 'c C|');
    eq(r.midi, ['60', '48']); eq(r.steps, [28, 21]);
  });
  test('octave= in K: works for a single part', () => eq(pitches('K:C clef=bass octave=-1', 'c C|').midi, ['60', '48']));
  test('octave= in V: wins over K:', () => eq(pitches('V:S octave=1\nK:C octave=-1\nV:S', 'C|').midi, ['72']));
  test('inline [K: octave=1] changes the following notes', () => eq(pitches('K:C', 'C [K:C octave=1] C|').midi, ['60', '72']));
  test('transpose= changes the sound but not the staff position', () => {
    const r = pitches('V:S transpose=-2\nK:C\nV:S', 'c|');
    eq(r.midi, ['70']); eq(r.steps, [35]);
  });
  test('transpose= in K:', () => eq(pitches('K:F transpose=3', 'F|').midi, ['68']));
  test('treble-8 and octave= add up (octave=1 lifts the written C, the 8 below lowers the sound)', () => eq(pitches('V:T clef=treble-8 octave=1\nK:C\nV:T', 'C|').midi, ['60']));
  test('treble+8 sounds an octave higher, bass-8 an octave lower', () => {
    eq(pitches('K:C clef=treble+8', 'C|').midi, ['72']);
    eq(pitches('K:C clef=bass-8', 'C,|').midi, ['36']);
  });
  test('ties still join notes with octave= and transpose=', () => eq(pitches('V:S octave=-1 transpose=2\nK:C\nV:S', 'c2- c2|').R.voices[0].events.map(e => e.tieFromPrev), [false, true]));
  test('soundShift of a part (used when previewing typed notes)', () => {
    eq(pitches('V:B clef=bass octave=-1\nK:C\nV:B', 'C|').R.voices[0].soundShift, -12);
    eq(pitches('V:T clef=treble-8\nK:C\nV:T', 'C|').R.voices[0].soundShift, -12);
    eq(pitches('V:S transpose=-2\nK:C\nV:S', 'C|').R.voices[0].soundShift, -2);
  });

  // ----- warnings that must not appear for correct ABC -----
  test('H right before a note is a fermata, no warning', () => {
    const r = pitches('K:C', 'Hc HC H[CE] H(D)|');
    eq(r.warn, []); eq(r.midi, ['72', '60', '60+64', '62']);
  });
  test('H used as the note H still warns', () => {
    ok(pitches('K:C', 'A H c d|').warn.includes('w.H'), 'H between spaces');
    ok(pitches('K:C', 'A H, c|').warn.includes('w.H'), 'H with an octave mark');
    ok(pitches('K:C', 'A h c|').warn.includes('w.H'), 'lower-case h');
  });
  test('$ (score line break of ABC 2.1) is not an unknown character', () => {
    const r = pitches('K:C', 'C D $ E F|');
    eq(r.warn, []); eq(r.midi, ['60', '62', '64', '65']);
  });

  // ----- lyrics: the same rules as abcjs and abcm2ps -----
  lyricCase('syllables and hyphens', 'C D E F |', ' Al-le-lu-ja', ['Al', 'le', 'lu', 'ja']);
  lyricCase('a tied note counts as a note; _ holds the syllable', 'C2- C2 | D2 E2 |', ' love _ is here', ['love', '', 'is', 'here']);
  lyricCase('syllables pass over rests', 'C z D E |', ' a b c', ['a', 'b', 'c']);
  lyricCase('* skips a note', 'C D E F |', ' a * c d', ['a', '', 'c', 'd']);
  lyricCase('| jumps to the next bar', 'C D E F | G A B c |', ' a b | c', ['a', 'b', '', '', 'c', '', '', '']);
  lyricCase('~ keeps two words under one note', 'C D |', ' a~b c', ['a b', 'c']);
  lyricCase('\\- is a hyphen inside a syllable', 'C D |', ' a\\-b c', ['a-b', 'c']);
  lyricCase('-- skips a note inside a word', 'C D E |', ' Glo--ria', ['Glo', '', 'ria']);
  test('lyrics: +: continues a w: line', () => eq(words(parse('C D E F |\nw: a b\n+: c d')), ['a', 'b', 'c', 'd']));
  test('lyrics: each w: line is a verse', () => { const R = parse('C D |\nw: a b\nw: c d'); eq([words(R, 0), words(R, 1)], [['a', 'b'], ['c', 'd']]); });
  test('lyrics: a music line continued with \\ takes one w: line', () => eq(words(parse('C D \\\nE F |\nw: a b c d')), ['a', 'b', 'c', 'd']));
  test('lyrics: more syllables than notes gives a warning', () => ok(parse('C D |\nw: a b c').warnings.some(w => w.k === 'w.lyrics')));

  // ----- text -----
  test('text: TeX mnemonics', () => eq(app.decodeAbcText('Gr\\"u\\ss Gott, \\\'el\\`eve, Dvo\\vr\\\'ak'), 'Grüß Gott, élève, Dvořák'));
  test('text: html entities and unicode codes', () => eq(app.decodeAbcText('&Auml;pfel &#322; \\u0105'), 'Äpfel ł ą'));
  test('text: % starts a comment, \\% is a percent sign', () => eq([app.stripComment('abc % comment'), app.decodeAbcText(app.stripComment('100\\% sure'))], ['abc', '100% sure']));
  test('text: title and composer with Polish letters', () => { const R = app.parseABC('X:1\nT:Zażółć gęślą jaźń\nC:Ł. Żółkiewski\nK:C\nC|\n'); eq([R.title, R.composer], ['Zażółć gęślą jaźń', 'Ł. Żółkiewski']); });

  // ----- words from W: -----
  test('W: lines are collected, w: lines are not', () => eq(app.parseABC('X:1\nW:first\nK:C\nC|\nw: a\nW:second\n+:more\n').words, ['first', 'second more']));
  test('verses: numbers, empty lines and refrains', () => eq(
    app.lyrVerses(['1. a b', 'c d', '', 'e f', 'Refren:', 'g h', '2) i j']).map(v => [v.label, v.lines.length]),
    [['1.', 2], ['', 1], ['Refren', 1], ['2.', 1]]));
  test('language is recognised', () => eq([
    'Wśród nocnej ciszy głos się rozchodzi, wstańcie pasterze, Bóg się wam rodzi',
    'Stille Nacht, heilige Nacht, alles schläft, einsam wacht',
    'Amazing grace, how sweet the sound that saved a wretch like me',
    'Pater noster, qui es in caelis, sanctificetur nomen tuum'].map(app.lyrDetectLang), ['pl', 'de', 'en', 'la']));
  test('a Latin line inside another language needs clear evidence', () => {
    const sc = l => { const x = app.lyrLangScores(l); return x.la >= 2 && x.la > x.en + 0.5; };
    eq(['Gloria in excelsis Deo', 'Venite adoremus', 'Virginia should not call in vain', 'Arise in majesty again'].map(sc), [true, true, false, false]);
  });
  test('a verse that does not fit the notes is reported', () => {
    const R = app.parseABC('X:1\nL:1/4\nK:C\nW:la la la la la\nC D E F|\n');
    const r = app.autoLyrics(R); eq([r.info.verses[0].n, r.info.verses[0].voices[0].N, r.info.verses[0].voices[0].ok], [5, 4, false]);
  });
  test('the text given to abcjs has the w: lines and no W: block', () => {
    const text = 'X:1\nL:1/4\nK:C\nW:Al-le-lu-ja\nC D E F|\n', R = app.parseABC(text); app.autoLyrics(R);
    const d = app.abcDisplay(R, text, [0], false, 'german').text;
    ok(/^w: Al-le-lu-ja$/m.test(d) && !/^W:/m.test(d), d);
  });
  test('"Save in the notes" removes W: and keeps everything else', () => {
    const text = 'X:1\nT:t\nL:1/4\nK:C\nW:Al-le-lu-ja\nC D E F|\n', R = app.parseABC(text); app.autoLyrics(R);
    eq(app.abcWithAutoLyrics(R, text), 'X:1\nT:t\nL:1/4\nK:C\nC D E F|\nw: Al-le-lu-ja\n');
  });
};
