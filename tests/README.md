# Tests

The tests need only [Node.js](https://nodejs.org) 18 or newer – there is nothing to install.
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
