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
