# Tests

The notation tests need only [Node.js](https://nodejs.org) 18 or newer – there is nothing to install
(the browser tests below also need Playwright).
They load the notation code straight from `index.html` (between `// ===== PURE START` and
`// ===== PURE END`), so they always test the code the app runs.

```
node tests/run.js              # everything
node tests/run.js pl           # only files whose name contains "pl"
node tests/run.js --verbose    # also list the known limitations
node tests/run.js --update     # rewrite tests/lyrics/*.expected.abc (see below)
```

On GitHub the tests run automatically after every push (`.github/workflows/tests.yml`);
the result appears as a tick or a cross next to the commit and in the **Actions** tab.
`tools/release.py` also runs them before it publishes a version.

## Browser tests

`tests/browser/run.js` opens the real app in a headless Chromium with [Playwright](https://playwright.dev) and
checks what the Node tests cannot see: the page in three languages, drawing the score, choosing voices, warnings,
words from `W:` saved as `w:` lines, playback order (D.C., fermatas) with the highlighted notes, the built-in
synthesizer when instrument sounds cannot be downloaded, the transposition buttons (also after a reload), share
links between two people, PDF and `.abc` downloads, collections with several pieces, recording and the tuner with
a simulated microphone (a 440 Hz tone), warm-ups, the note buttons, the help text and the files of the installable app.

**Printed pages.** For a set of pieces (short, two pages, a full SATB score on three pages, one part of it, verses,
transposed, and one line of music taller than a page) both "Download PDF" and the browser's printing are checked page
by page (`tests/browser/page-check.js`): the staff lines are found in the picture of each page and grouped into
staves. Every page must have music, every staff must have all 5 lines (a staff cut by the page edge or printed too
faint has fewer), the number of staves must equal systems × parts shown, the staff space must be at least 1.9 mm
(1.2 mm for the line that had to be made smaller), nothing may be printed in the margins, and there may be no
colour – also in dark mode and with tuner marks on the screen. The file of the PDF download is checked as well
(cross-reference table, A4 pages, one complete JPEG per page). The printing checks need `pdftoppm`
(`sudo apt install poppler-utils`, on a Mac `brew install poppler`); without it they are skipped.

**Tap areas.** The app puts invisible rectangles around the notes (tap a note to hear it) and a light band over the
chosen bars. abcjs draws with `stroke="currentColor"`, which such rectangles would inherit as a black frame. The tests
check, for the built-in drawing and for `fake-abcjs.js` (a stand-in that draws like abcjs, because abcjs is not in the
repository), that the rectangles have no frame on screen, are not drawn when printing, and that PDF and printed pages
are pixel for pixel the same with and without them.

```
npm install --no-save playwright && npx playwright install chromium    # once
node tests/browser/run.js              # all (about 25 seconds)
node tests/browser/run.js share        # only tests whose name contains "share"
node tests/browser/run.js --headed     # watch the browser
```

The tests use no internet: everything outside the local test server is blocked, so they test the built-in renderer
and synthesizer. The abcjs test runs only when `vendor/abcjs-basic-min.js` exists (`python tools/fetch_abcjs.py`);
on GitHub it runs as an optional step. Each test starts with an empty browser profile, so saved pieces and
settings never leak from one test to another.

## What is tested

| Files | What | How to add a case |
|---|---|---|
| `syllables/pl.txt`, `de.txt`, `la.txt`, `en.txt` | splitting single words into syllables | add a line with the word split by hyphens, e.g. `Be-tle-jem`; several accepted splits: `pa-ste-rze \| pas-te-rze` |
| `lines/pl.txt`, … | the number of syllables (= notes) in a line of a hymn | add `8 \| Bóg się rodzi, moc truchleje` |
| `lyrics/*.abc` | words from `W:` placed under the notes, compared with `*.expected.abc` | see below |
| `abc.test.js` | the ABC reader: pitches, lengths, repeats, ties, lyrics rules, text decoding | add a `test('name', () => eq(actual, expected))` |

A line starting with `!` is a **known limitation**: it is reported but does not fail the tests.
When a change makes it work, the report asks you to remove the `!`. Lines starting with `#` are comments.

### Lyrics files

Each `lyrics/name.abc` is a short piece with words in `W:`. The test places the words under the notes
(as the app does) and compares the result with `lyrics/name.expected.abc`. It also checks that
[abcjs](https://github.com/paulrosen/abcjs) – which draws the notes – would put every syllable on the same note
(`lib/abcjs-words.js` follows its alignment code), and that the saved result reads back the same.

To add a case: create `lyrics/name.abc`, run `node tests/run.js --update`, **check the new
`name.expected.abc` by eye** (are the syllables under the right notes?), then commit both files.
After an intended change to the syllable rules, run `--update`, look at the differences (e.g. with
`git diff`), and commit them only if they are improvements.

## Rules behind the expected results

- **Polish**: practice of Polish songbooks – s/ś/sz/z + consonant, a stop + r/l/ł/rz and consonant + w start the next
  syllable (*pa-ste-rze*, *źró-dła*, *zmar-twych-wstał*); prefixes stay whole (*roz-cho-dzi*, *Naj-święt-sza*);
  *i* before a vowel only softens the consonant (*nie*, *wia-ra*, *me-lo-dia*); *au* is one syllable except after
  *na-*/*za-* (*pau-za*, *na-u-ka*).
- **German**: 2006 spelling – only the last consonant moves (*Schwes-ter*), except groups that can start a word
  (*Jung-frau*, *ent-sprun-gen*); *ck*, *ch*, *sch* stay together (*Zu-cker*); ä, ö, ü are separate vowels (*ge-übt*).
- **Latin**: sung liturgical Latin after Solesmes (Études grégoriennes XLIII, 2016) as used by Gregorio's hyphen-la,
  vowels after the Liber Usualis (*cu-i*, *qui*, *cae-li*, *A-gnus*, *su-sci-pe*, *sanc-tus*, *ad-iu-to-ri-um*).
- **Latin words in other languages** (*Kyrie*, *Gloria*, *Alleluia*) and Latin lines (a refrain *Gloria in excelsis
  Deo* in a Polish carol) use the Latin rules.
- All test texts are public domain. Test melodies are made up unless a composer is given.
