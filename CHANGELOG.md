# Changelog

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
