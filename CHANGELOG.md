# Changelog

## 1.1.0 – 2026-10-22

- Transpose the whole piece with the − / + buttons below the tempo (±12 semitones): notes, key signature, note names,
  sound and tuner follow, abcjs draws it transposed (visualTranspose). The setting is saved with the piece and sent in
  share links (&t=); the .abc text is not changed.
- Parts: P:A, P:B (also inline [P:B]) start parts, P: in the header plays them in order (P:ABAB, P:A2B, P:(AB)2C),
  each with its own repeats and jumps. Warning when the order names a part that does not exist.
- Fermatas (H before a note, !fermata!, !invertedfermata!, also over a bar line or a rest) are held in all parts:
  twice as long, at most a half note longer; the metronome waits. !breath! takes a short breath from the end of its
  note without changing the tempo.
- clef=tenor and clef=alto are C clefs that sound as written, as in ABC 2.1, abcjs and abcm2ps (clef=tenor used to be
  read as treble-8). The built-in renderer shows them the modern way. A hint appears when a tenor-clef part looks
  written an octave high.
- Tempo words without a number (Q:"Andante", "Allegro moderato", "Langsam", "Nicht zu schnell", "Uroczyście", "Slowly").
- Syllables: all known limitations fixed and about 80 words added to the tests –
  Polish ś ź ż + m/n (nie-śmier-tel-na, póź-niej, pójdź-my);
  German prefixes and compounds before st/sp (er-stan-den, auf-er-stan-den, Ge-stalt, Mor-gen-stern, Bei-spiel; still
  ges-tern, ers-ten, Kris-tall) and -ie in loanwords (Fa-mi-li-e, Li-li-en; still Me-lo-die);
  English -ed after consonant + r/l (sa-cred, hun-dred), hymn adjectives (wick-ed, bless-ed, be-lov-ed), ev-ery,
  soft g (an-gels, man-ger), ie before t (qui-et, pi-e-ty), -ient/-ience (o-be-di-ent), gh (high-est), s + stop
  (in-spired, de-stroy); Latin u for v (ser-uus) and Hie-ru-sa-lem.
- Browser tests (tests/browser/run.js, Playwright + Chromium, no internet): 17 checks of the real app – languages,
  score, voices, warnings, lyrics, playback order and highlighting, synthesizer fallback, transposition, share links,
  PDF and .abc downloads, collections, recording and tuner with a simulated microphone, warm-ups, note buttons, help.
  They run on GitHub next to the Node tests (680 checks); an optional step also checks abcjs drawing.
- In-app help (PL/EN/DE) describes fermatas, breath marks, parts, tempo words, transposition and C clefs.
- Printing: a line of the full score taller than the rest of page 1 (many parts with several verses) was moved to
  page 2 by the browser, leaving page 1 with only the title. No line of music is taller than a page any more, and the
  first one leaves room for the title.
- PDF download: such a line was cut off at the bottom of the page (the lowest parts were missing). It is now shrunk
  to fit under the title or on a page of its own; nothing is cut off and no page is ever empty.
- PDF download: staff lines are as dark as in printing (they were drawn at the 50 % strength used on screen), and a
  line of music made smaller to fit keeps the thickness of its lines on paper (also when printing).
- Printing: tuner marks (green, yellow, red notes) and the playback cursor are no longer printed in colour; on paper
  the notes are black, as in the PDF download. They stay on screen.
- The invisible tap areas around the notes and the band of the chosen bars got a black frame in the abcjs view
  (abcjs gives its drawings stroke="currentColor", and the rectangles inherited it): every note was boxed on screen
  and in printing. They have no frame any more and are not drawn at all when printing (the PDF download never had
  them). Tapping a note works as before.
- Tests: the PDF page layout (Node); printing, a too-tall line and a file name with Polish letters (browser); and
  page-by-page checks of both "Download PDF" and printing for seven kinds of pieces – every page has music, all
  staves are whole and readable, nothing in the margins, black on white also in dark mode and with tuner marks
  (tests/browser/page-check.js; printing checks need pdftoppm from poppler-utils); the tap areas around the notes
  are checked to be invisible on screen and absent from PDF and printed pages, with the built-in drawing and with an
  abcjs-like drawing (tests/browser/fake-abcjs.js).

## 1.0.1 – 2026-10-22

- Jumps are played: D.C., D.S. (from the segno S / !segno!), Fine, D.C./D.S. al Fine and al Coda (from the first coda
  sign O / !coda! or “To Coda” to the second). Decorations (!D.C.!, !D.S.alcoda!, +fine+) and text above the notes
  ("^D.C. al Fine", "^Fine", "^To Coda") both work; a mark in one part applies to all parts. The second time through,
  repeats are played once with the last ending. Warnings when the segno or the coda signs are missing.
- octave= in V: and K: (also inline [K:] / [V:]) moves a part by octaves on the staff and in sound, as in ABC 2.1 and
  abcjs (e.g. clef=bass octave=-1, where c is middle C). transpose= changes only the sound. treble+8, bass-8 and
  bass+8 clefs sound an octave higher or lower. Notes typed with the note buttons are previewed at the right pitch.
- H right before a note (the fermata sign, e.g. Hc2) no longer gives the “H is not a note” warning; H used as a
  note name still does.
- $ (the score line break of ABC 2.1) is no longer reported as an unknown character.
- In-app ABC help (PL/EN/DE) describes jumps, octave= and transpose=.
- About 30 new automatic tests (566 checks in total).

## 1.0.0 – 2026-10-19

- First public version.
- Parts for every voice: treble, tenor (treble-8) and bass clefs, several parts in one ABC file.
- Part mixer, loop, tempo, metronome, count-in, note names, lyrics with verses.
- Printing on A4 (single part or full score) and saving as PDF.
- Recording your own voice in sync with the score, WAV download (voice or mix).
- Share links that contain the whole piece; updates reach recipients.
- Warm-ups for soprano, alto, tenor and bass with accompaniment, plus a printable guide (warmups.html).
- Tuner for singers: reference note, cents meter, pitch graph and grading of every note during playback.
- Polish, English and German interface.
- Words from W: placed under the notes automatically (syllables in Polish, English, German and Latin; ties, slurs and repeats), with saving as w: lines.
- Polish syllables follow Polish songbook practice (pa-ste-rze, źró-dła, zmar-twych-wstał, Naj-święt-sza; me-lo-dia, pau-za); German follows the 2006 rules with separate umlauts (ge-übt, ent-sprun-gen); Latin words such as Kyrie and Gloria keep Latin rules in any language.
- English syllables: -cious, -tion, -teous, Virginia, woe, does, bravely, baffles counted as sung.
- Automatic tests (tests/, about 500 checks, no dependencies) run on GitHub after every push and before each release.
- Latin syllables follow the rules of sung liturgical Latin (Solesmes / Gregorio hyphen-la); Latin refrains in other-language texts are split as Latin.
- Lyric alignment now follows abcjs and abcm2ps exactly (tied notes count as notes, rests are skipped by syllables).
- PDF download (A4, 200 dpi) without extra libraries.
- Instrument choice with the same General MIDI soundfont samples as abcjs / EH ABC Editor (piano by default), separate instrument for the other parts, offline fallback synthesizer.
- Notation engraved with abcjs (as in Michael Eskin's ABC Tools), with a built-in fallback renderer.
- Tenor (treble-8) written as printed and played an octave lower, compatible with other ABC tools.
- Phones: add to home screen, offline after the first visit, iPhone silent-switch fix, “Paste link”.
- Links to Michael Eskin's ABC Transcription Tools and the EH ABC Musiknoten Editor.
- Links to ABC collections (abcnotation.com, JC's collection at MIT, Folk Tune Finder, The Session, kern2abc).
- Opening collection files with many pieces (choose one from a list), encoding detection, pasting ABC text.
- ABC 2.1 text handling: mnemonics, HTML entities and \u codes in titles, composers, part names and lyrics;
  I:abc-charset; % comments and +: continuations in fields; warnings for empty lines and several tunes;
  file header copied into extracted tunes; saved files start with %abc-2.1 and I:abc-creator.
