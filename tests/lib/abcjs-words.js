// How abcjs (the library that draws the notes in this app, the EH ABC Editor and Michael Eskin's ABC Tools)
// puts the syllables of a "w:" line under the notes. The logic follows addWords() in abcjs 6.5,
// src/parse/abc_parse.js – abcjs is MIT licensed, (c) Paul Rosen and Gregory Dyke.
// The tests use it to check that lyrics written by the app land on the same notes in abcjs as in the app.
'use strict';

// elements: [{type:'note'|'rest'|'bar'}] in the order of the music line; words: the text after "w:".
// Each call adds one row (verse) to el.lyric.
module.exports = function abcjsAddWords(elements, words) {
  words = words.trim();
  if (words[words.length - 1] !== '-') words = words + ' ';
  const list = [];
  let last = 0, replace = false, escNext = false;
  const addWord = i => {
    let word = words.substring(last, i).trim().replace(/\\([-_*|~])/g, '$1');
    last = i + 1;
    if (!word.length) return false;
    if (replace) word = word.replace(/~/g, ' ');
    let div = words[i];
    if (div !== '_' && div !== '-') div = ' ';
    list.push({ syllable: word, divider: div });
    replace = false;
    return true;
  };
  for (let i = 0; i < words.length; i++) {
    switch (words[i]) {
      case ' ': addWord(i); break;
      case '-': if (!escNext && !addWord(i) && list.length) { list[list.length - 1].divider = '-'; list.push({ skip: 'next' }); } break;
      case '_': if (!escNext) { addWord(i); list.push({ skip: 'slur' }); } break;
      case '*': if (!escNext) { addWord(i); list.push({ skip: 'next' }); } break;
      case '|': if (!escNext) { addWord(i); list.push({ skip: 'bar' }); } break;
      case '~': if (!escNext) replace = true; break;
    }
    escNext = words[i] === '\\';
  }
  for (const el of elements) {
    if (!list.length) break;
    const isNote = el.type === 'note' || el.type === 'rest';   // in abcjs a rest is a note without pitches
    if (list[0].skip) {
      const to = list[0].skip;
      if ((to === 'next' || to === 'slur') && isNote) list.shift();
      else if (to === 'bar' && el.type === 'bar') list.shift();
      if (el.type !== 'bar') (el.lyric = el.lyric || []).push({ syllable: '', divider: ' ' });
    } else if (el.type === 'note') {
      const ly = list.shift();
      if (ly.syllable) ly.syllable = ly.syllable.replace(/ +/g, '\u00a0');
      (el.lyric = el.lyric || []).push(ly);
    }
  }
  return elements;
};
