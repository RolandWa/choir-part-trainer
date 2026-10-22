# Choir Part Trainer

A free, open-source web app that helps choir singers learn their own part. Type the music in
[ABC notation](https://abcnotation.com/) (or open a file prepared by your conductor), then listen
to your part, loop the tricky bars, slow down, print it on A4 and record yourself singing along.

Everything runs in the browser: no account, no server, nothing is uploaded.

## Features

- **Every voice in the choir**: treble, tenor (treble clef with 8) and bass clefs, several parts in one file (`V:`)
- **“My part” and a mixer**: your part sounds bright and the others quietly, or sing along with your part muted
- **Real instrument sounds**: the same General MIDI soundfont samples that abcjs and the EH ABC Editor play – piano by default, plus organ, accordion, harmonica, guitars, harp, strings, flutes, whistle, banjo, bagpipes and choir voices; your part and the other parts can use different instruments
- **Practice tools**: bar range, loop, tempo, metronome, count-in, first-note button, the current note is highlighted
- **Same engraving as Michael Eskin’s ABC Tools**: the score is drawn with [abcjs](https://github.com/paulrosen/abcjs);
  if abcjs cannot be loaded, a built-in simplified renderer takes over
- **Readable music**: note names, lyrics with several verses, repeats with first and second endings, D.C./D.S./Fine/Coda jumps, parts in P: order, fermatas and breath marks, triplets, ties
- **Words under the right notes**: if a piece only has its words as a poem after the tune (`W:`), the app splits them
  into syllables (Polish, English, German, Latin) and places them under the notes; one tap saves them as `w:` lines
- **Print and PDF**: print on A4, or download a PDF directly (works on phones too)
- **Phones first**: works in Chrome on Android, Safari on iPhone and any laptop browser; can be added to the home
  screen and opens offline after the first visit
- **Phone-friendly note entry** with on-screen buttons, plus warnings when a bar has the wrong length
- **Print or save as PDF** on A4, either a single part or the full score
- **Tuner for singers**: plays a reference note (short or sustained), listens through the microphone and shows the sung note, the deviation in cents on a needle and a pitch graph of the last 10 seconds; during playback it grades every note of your part green, yellow or red
- **Record yourself** in sync with the score, play it back with the music, fix latency with a slider, download WAV (voice only or mixed with the music)
- **Warm-ups for every voice**: humming, lip trill, vowels, staccato, arpeggio, scale and chord tuning, generated in a comfortable range for soprano, alto, tenor or bass, with an accompaniment that gives each new starting note; a separate guide page describes every exercise
- **Share a link** with the whole piece inside it, so the conductor or any singer can send the identical piece to the choir
- **Open and save `.abc` files**, including collections with many pieces; paste ABC text copied from a web page; pieces are kept automatically in the browser
- **Polish, English and German** interface; adding a language takes one block in `i18n.js`

## Quick start

Open the published page (see below) or download the repository and open `index.html`.
Keep all files in the same folder:

| File | Purpose |
|---|---|
| `index.html` | the app |
| `i18n.js` | interface texts in all languages |
| `warmups.js` | warm-up exercises and their descriptions |
| `warmups.html` | warm-up guide page (instructions for every exercise, printable) |
| `sw.js` | offline support (network first, cached copy when there is no internet) |
| `manifest.webmanifest`, `icons/` | “Add to Home Screen” on Android and iPhone |
| `.nojekyll` | tells GitHub Pages to publish the files as they are |
| `CHANGELOG.md` | list of changes in each version |
| `PUBLIKACJA.md` | step-by-step publishing guide (Polish) |
| `tools/release.py` | helper for releasing a new version |
| `tools/fetch_abcjs.py` | optional: downloads abcjs into `vendor/` so the app does not need a CDN |
| `tests/` | automatic tests (syllables, lyrics placement, ABC reader) – `node tests/run.js` |
| `.github/workflows/tests.yml` | runs the tests on GitHub after every push |

Recording needs the page to be served over **https** (GitHub Pages does this) or from `localhost`.
When opened directly from disk (`file://`) some browsers block the microphone.

## Publish on GitHub Pages

GitHub Pages is free for public repositories on GitHub Free (a private repository needs a paid plan).
The app is about 0.2 MB, far below the 1 GB site limit and the 100 GB/month soft bandwidth limit.

1. Create a new **public** repository and upload the **contents** of this folder
   (`index.html` must be in the root), including the hidden `.nojekyll` file.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
3. After a minute or two the app is available at `https://<your-user>.github.io/<repository>/`.

A detailed click-by-click guide in Polish, with troubleshooting, is in
[PUBLIKACJA.md](PUBLIKACJA.md).

Do not put copyrighted sheet music into the public repository – share pieces with the
**Share link** button instead; the music then lives only in the link.

## Releasing a new version

The version number lives in `index.html` (`APP_VERSION`) and in the `?v=` suffix of the script files
in `index.html` and `warmups.html`, so browsers fetch fresh scripts together with the new page.
`tools/release.py` (Python 3) updates all of them and the changelog in one go:

```
python tools/release.py 1.1.0 "What changed; another change"            # update, commit, tag v1.1.0, push
python tools/release.py 1.1.0 "What changed; another change" --no-git   # only update the files
```

With `--no-git`, upload the changed files on github.com (**Add file → Upload files**).
GitHub Pages republishes within about a minute; browsers may keep the old copy for up to 10 minutes.
Changes are listed in [CHANGELOG.md](CHANGELOG.md). Singers' saved pieces stay in their browsers and
are not affected by updates.

## ABC in 30 seconds

```
T:Alleluia
M:4/4
L:1/4
Q:1/4=72
V:S name="Soprano" clef=treble
V:B name="Bass" clef=bass
K:F
V:S
|: A2 B2 | G2 A2 :| B2 A2 |]
w: Al-le-lu-ia, A-men.
V:B
|: F,2 B,,2 | C,2 F,2 :| B,,2 F,,2 |]
w: Al-le-lu-ia, A-men.
```

- `C,` = C3, `C` = middle C (C4), `c` = C5; a comma lowers by an octave, an apostrophe raises.
- With `L:1/4` a plain note is a quarter, `A2` a half, `A/` an eighth.
- `^` sharp, `_` flat, `=` natural; `z` rest; `|:` `:|` repeats; `[1` `[2` endings.
- Tenor parts use `clef=treble-8` and are written as printed (an octave above the sounding pitch), like in
  abcjs and other ABC tools; the app plays and checks them an octave lower.
- `octave=-1` in `V:` or `K:` means the part is written an octave higher (`c` is middle C); it is shown and played
  in the right place. `transpose=-2` changes only the sound (two semitones lower). `treble+8`, `bass-8` and
  `bass+8` clefs sound an octave higher or lower than written.
- Jumps are played: `!D.C.!`, `!D.S.!` with the segno `S` (`!segno!`), `!fine!`, `!D.C.alfine!`, `!D.S.alcoda!`
  with the coda signs `O` (`!coda!`), and the same words as text above a note (`"^D.C. al Fine"`, `"^To Coda"`).
  The second time through, repeats are played once, with the last ending.
- Fermatas (`H` before a note, `!fermata!`) are held in all parts (twice as long, at most a half note longer);
  `!breath!` leaves a short breath after its note. (A comma `,` is the octave mark, not a breath.)
- Parts: `P:A`, `P:B` in the music start parts, `P:ABAB`, `P:A2B` or `P:(AB)2C` in the header gives the order.
- `clef=tenor` and `clef=alto` are C clefs and sound as written (like abcjs); for a tenor part written an octave
  up, use `clef=treble-8`.
- A tempo word without a number (`Q:"Andante"`, `Q:"Langsam"`, `Q:"Uroczyście"`) sets a typical tempo.
- The − / + buttons below the tempo transpose the whole piece by semitones (notes, names, sound, tuner); the setting
  is saved with the piece and sent in share links, the .abc text stays unchanged.

The full cheat sheet is built into the app.

## Characters and the ABC standard

The app follows the ABC 2.1 rules for text (titles, composers, part names, lyrics):

- **UTF-8 is the default** and covers every alphabet, so Polish (ą ę ł ż …), German (ä ö ü ß), Czech, Hungarian,
  French and other letters can simply be typed. Saved `.abc` files are UTF-8 and start with `%abc-2.1`
  and an `I:abc-creator` line, as the standard asks of exporting software.
- **Older notations are understood**: TeX-style mnemonics (`\"u` ü, `\'o` ó, `\ss` ß, `\vc` č, `\Ho` ő, `\cc` ç,
  `\AA` Å, `\/o` ø), named and numeric HTML entities (`&auml;`, `&#322;`) and `\u0105` / `\U0001F3B5` codes.
  The standard has no mnemonics for ą, ę or ż – use UTF-8 for those.
- **Files in other encodings**: `I:abc-charset` / `%%abc-charset` with `iso-8859-1` … `iso-8859-10` is honoured;
  files without a declaration that are not valid UTF-8 are detected as Windows-1250, ISO-8859-2 or Windows-1252
  and converted to UTF-8 (the app tells you when it did this). A byte order mark is ignored.
- `%` starts a comment anywhere on a line (`\%` is a literal percent), `+:` continues a field or lyrics line,
  and an **empty line ends a tune** – the app warns about empty lines inside a piece because other ABC programs
  would stop reading there.
- When a piece is taken out of a tunebook, the tunebook's file header is copied into the tune header.

ABC note letters are always the English ones: write the German/Polish **H** as `B` and **B** (B-flat) as `_B`.

## Sharing with your choir

**Share link** creates a link that contains the whole piece (all parts, lyrics, tempo), compressed
into the part of the address after `#`. That part is never sent to a server, so the music stays
between you and the people you send it to. Send the link by e-mail or a messenger; on phones the
**Send…** button opens the system share sheet.

- Opening the link adds the piece to the recipient's list.
- If the conductor later sends a new link to the same piece, recipients get the updated version.
  If a recipient has edited their copy, the new version is added alongside so nothing is lost.
- Singers can pass the link on; it keeps pointing to the same original piece.
- Very long pieces make long links (the length is shown); if a messenger cuts the link,
  send the `.abc` file instead (**Save file** / **Open file**).

Links use the address of the page they were created on. If you use the single-file version or host
the app elsewhere, set `SHARE_URL` near the top of the script in `index.html` to the published address.

## Phones (Android and iPhone)

- Open the link in Chrome (Android) or Safari (iPhone). **Add to Home Screen** gives an app icon;
  after the first visit the app opens without internet (useful in a church or a rehearsal room).
- iPhone: the app keeps sound on even when the ring/silent switch is set to silent.
- iPhone home-screen apps keep their own storage, separate from Safari, and links from messages open in Safari.
  To add a piece to the home-screen app, copy the conductor’s link and use **Paste link**.
- Microphone features (tuner, recording) need https, which GitHub Pages provides.

## Where to find pieces in ABC

The **Where to find pieces in ABC** section links to free collections:

- [abcnotation.com](https://abcnotation.com/search) – the largest ABC search engine, mostly folk and traditional music
- [JC’s ABC music collection (MIT)](https://trillian.mit.edu/~jc/music/abc/) – with folders for
  [hymns](https://trillian.mit.edu/~jc/music/abc/hymn/), [Christmas](https://trillian.mit.edu/~jc/music/abc/xmas/)
  and [Poland](https://trillian.mit.edu/~jc/music/abc/Poland/)
- [Folk Tune Finder](https://www.folktunefinder.com/) – search by a few notes or a title
- [The Session](https://thesession.org/) – Irish traditional music
- [Abc files derived from **kern files](https://ifdo.ca/~seymour/kern2abc/) – e.g.
  [370 Bach chorales](https://ifdo.ca/~seymour/kern2abc/jsbachchorales.abc) and
  [Palestrina masses](https://ifdo.ca/~seymour/kern2abc/palestrina_a.abc) in several parts (CC BY-NC-SA)

Download an `.abc` file and use **Open file**, or copy ABC text from a web page and use **Paste**.
Files with many pieces (several `X:` tunes) open a list where you choose one; files in UTF-8,
Windows-1250 or with `%%abc-charset` are decoded correctly. Check the copyright of each piece before sharing it.

## Other ABC editors

The **Other free ABC editors** section links to
[Michael Eskin’s ABC Transcription Tools](https://michaeleskin.com/abctools/abctools.html) and the
[EH ABC Musiknoten Editor](https://abc-editor.com/) ([phone version](https://abc-editor.com/mobile.html)).
**Copy notes and open** copies the ABC text of the current piece and opens the editor, where you paste it.
Files are compatible both ways, so you can e.g. convert MusicXML to ABC in Eskin’s tools and paste the result here.

## Warm-ups

Open **Warm-up** in the app, choose your voice and tap **Practise**. Each exercise becomes a short
piece (about a minute) that moves up in semitones and back, with an accompaniment chord before
each repetition. Use the mixer's **Without my part** to sing with the accompaniment only.
**Full warm-up guide** opens `warmups.html` with the goal, steps and tips for every exercise,
including those without notation (posture, breathing, siren).

Links from the guide open a warm-up directly, e.g. `index.html#warmup=hum&v=B`
(`v` = `S`, `A`, `T` or `B`).

To change or add exercises, edit `warmups.js`. Each exercise is a short pattern of scale degrees
(`"0:1 2:1 4:1 7:1 | z:8"`), a syllable line, a starting range and the number of semitone steps.
The comments at the top of the file explain the format; the starting notes for each voice are in `voices`.

## Tuner

Open **Tuner – am I singing in tune?** and turn on the microphone. **Use headphones:** the tuner must
hear only your voice – sound from the speaker reaches the microphone and the tuner would grade the app
instead of you. Wired headphones are best; wireless ones add delay.

- **Nearest note** works like a guitar tuner: it shows which note you sing and how many cents off you are.
- **Chosen note** compares your voice with a reference note you pick; **Play** sounds it for two seconds,
  **Sustain** keeps it sounding (use headphones, otherwise the microphone hears it).
- With **Check the notes of my part during playback** on, press ▶: each note of your part is coloured
  when it ends – green in tune, yellow close, red off – and you get a summary at the end.
  Tap a coloured note to see its deviation. Use headphones or the mixer's **Without my part**,
  so the microphone hears you and not the app.
- **Accuracy** sets the tolerance (±25, ±15 or ±8 cents). **Tuning A4** changes the reference pitch for
  the tuner and the whole app (e.g. 442 Hz to match an organ).

Pitch detection uses the YIN algorithm running locally in the browser; it covers the whole choir
range from about C2 to C6.

## Recording tips

- Use headphones, so only your voice ends up in the recording.
- Bluetooth headphones add delay. If your voice sounds late or early against the music, use the
  **Recording offset** slider, or use wired headphones.
- On iPhone and iPad, sound may switch to the earpiece while the microphone is on; headphones avoid this.
- The recording stays in the open browser tab only. Download it to keep it.

## Adding a language

Open `i18n.js`, copy the `en` block, change its key to the language code (for example `cs` or `fr`)
and translate the values. Keep placeholders such as `{n}` unchanged. Set `_naming` to `german`
if your language calls B-natural “H”, otherwise `english`. Missing keys fall back to English.
The new language appears in the selector automatically. For the warm-up texts, do the same in the `text` part of `warmups.js`.

## Privacy

Everything stays on your device. Share links carry the music inside the link itself. Pieces are stored in the browser's local storage. Microphone audio for the tuner and recordings
is processed locally and is saved only when you download a recording.

## Limitations

- One staff per part: two voices on one staff (`&`) are not supported; write them as separate `V:` parts.
- Grace notes, dynamics and other decorations are ignored.
- Alto and other C clefs are shown as treble clef.
- The sound is a simple built-in synthesizer, meant for learning notes, not for listening pleasure.

## Lyrics: `w:` and `W:`

ABC has two kinds of words. `w:` lines go right below a line of notes and say which syllable is sung on which note:
syllables are separated by spaces or hyphens, `_` holds a syllable over one more note (a melisma), `*` skips a note,
`|` jumps to the next bar, `~` joins two words under one note. Each further `w:` line is another verse. Tied notes count
as separate notes. `W:` lines are only a poem printed after the tune.

Latin is split by the rules of sung liturgical Latin used by Solesmes and Gregorio (hyphen-la): *Ie-su*, *e-ius*,
*ad-iu-to-ri-um*, *qui*, *cu-i*, *san-guis*, *sua-vis*, *cae-li*, *A-gnus*, *su-sci-pe*, *sanc-tus*, *pa-tris*,
*ex-au-di*, *re-spi-ce*, *Is-ra-el*. A Latin line inside a Polish, German or English text (a refrain such as
*Gloria in excelsis Deo*) is split as Latin.

When a piece has only `W:`, the app places the words under the notes itself: it splits words into syllables, holds a
syllable across tied notes and notes under a slur, gives a repeated section a second line of text when the words
continue on the repeat, and recognises verse numbers (`1.`, `2.`) and refrains. It follows the same alignment rules as
abcjs and abcm2ps, so the result looks the same in other ABC programs. A notice above the score reports verses whose
syllable count does not match the notes. **Save in the notes** writes the result into the piece as ordinary `w:` lines
(with **Undo**), so it can be corrected in the editor and shared.

## Tests

`node tests/run.js` runs about 500 checks with nothing to install (Node.js 18 or newer): syllable splitting in Polish,
German, Latin and English against hymn texts with known syllable counts, words from `W:` placed under the notes
(compared with expected files and with the way abcjs aligns lyrics), and the ABC reader. On GitHub they run
automatically after every push, and `tools/release.py` runs them before publishing. See [tests/README.md](tests/README.md)
for the file formats and how to add cases.

## PDF

**Download PDF** draws the printed page at 200 dpi into A4 pages and saves a PDF file directly in the browser, without
any extra library. It works offline and on phones, where printing to PDF is awkward. **Print** still uses the
browser's print dialog.

## Instruments

Playback uses the General MIDI soundfonts that abcjs uses by default
(`https://paulrosen.github.io/midi-js-soundfonts/abcjs/`, with `FluidR3_GM` as a fallback), so the instruments
sound like in the EH ABC Editor. The app still uses its own scheduler, which keeps the part mixer, count-in,
loop, tuner grading and recording sync working. Samples are downloaded on first playback (about 20–40 kB per note)
and cached for offline use; if they cannot be loaded, the built-in synthesizer plays the notes.
General MIDI has no mandolin, so it is not in the list. The **Built-in synthesizer** option works without internet.

## Credits

Instrument samples come from [midi-js-soundfonts](https://github.com/paulrosen/midi-js-soundfonts) as used by abcjs.
Notation is engraved with [abcjs](https://github.com/paulrosen/abcjs) by Paul Rosen and Gregory Dyke (MIT license),
loaded from cdnjs or jsDelivr, or from `vendor/` if you run `tools/fetch_abcjs.py`.

## License

MIT, see [LICENSE](LICENSE).

---

**Polski:** Darmowa aplikacja dla chórzystów do nauki własnej partii z nut w zapisie ABC: odtwarzanie
głosu z mikserem pozostałych głosów, pętla, tempo, druk na A4 i nagrywanie siebie zsynchronizowane z muzyką.
Działa w przeglądarce, bez konta i bez wysyłania danych.

**Deutsch:** Kostenlose App für Chorsängerinnen und Chorsänger zum Lernen der eigenen Stimme aus Noten
im ABC-Format: Wiedergabe mit Stimmen-Mischpult, Schleife, Tempo, Druck auf A4 und synchrone Aufnahme
der eigenen Stimme. Läuft im Browser, ohne Konto und ohne Datenübertragung.
