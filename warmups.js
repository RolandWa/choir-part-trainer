/*
  Warm-up exercises for Choir Part Trainer.

  The app turns every exercise with notation into a playable piece for the chosen voice:
  the pattern is repeated, moving up in semitones ("steps" times) and back down,
  with an accompaniment that gives the next starting chord before each repetition.

  VOICES – starting notes as MIDI numbers (60 = middle C, C4):
    five   – first root for exercises within a fifth
    octave – first root for exercises that span an octave
  All numbers are sounding pitches. For the tenor (treble-8 clef) the app writes the notes an octave
  higher, as printed in choir scores, and plays them at the sounding pitch.

  EXERCISE FIELDS
    kind:    'solo'  – one voice + accompaniment, generated for each voice type
             'choir' – all four voices together (chord tuning)
             'free'  – no notation, only described in warmups.html
    notes:   pattern in 4/4, eighth note = 1. "degree:length", "z:length" = rest, "|" = barline.
             Degrees count steps of the major scale from the root: 0 = root, 2 = third, 4 = fifth,
             7 = octave, -1 = the note below the root.
    lyric:   syllables under the notes (ABC "w:" syntax, "_" holds the previous syllable).
    range:   'five' or 'octave' – which starting note from VOICES to use.
    steps:   how many semitones to go up before coming back.
    tempo:   quarter notes per minute.

  TEXTS – one block per language with the same keys as in i18n.js (pl, en, de...).
  To add a language, copy the "en" block in "text", change its key and translate it.
*/
window.CHOIR_WARMUPS = {

  voices: {
    S: { clef: 'treble',   five: 62, octave: 60 },   // D4, C4
    A: { clef: 'treble',   five: 57, octave: 55 },   // A3, G3
    T: { clef: 'treble-8', five: 50, octave: 48 },   // D3, C3
    B: { clef: 'bass',     five: 43, octave: 41 }    // G2, F2
  },

  exercises: [
    { id: 'body',     kind: 'free', minutes: 2 },
    { id: 'breath',   kind: 'free', minutes: 2 },
    { id: 'hum',      kind: 'solo', minutes: 1, range: 'five',   steps: 4, tempo: 72,
      notes: '4:2 3:2 2:2 1:2 | 0:4 z:4',
      lyric: 'mm _ _ _ _' },
    { id: 'liptrill', kind: 'solo', minutes: 1, range: 'five',   steps: 5, tempo: 80,
      notes: '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 | 0:4 z:4',
      lyric: 'brr _ _ _ _ _ _ _ _' },
    { id: 'siren',    kind: 'free', minutes: 1 },
    { id: 'vowels',   kind: 'solo', minutes: 1, range: 'five',   steps: 4, tempo: 76,
      notes: '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 | 0:4 z:4',
      lyric: 'ma me mi mo mu mo mi me ma' },
    { id: 'staccato', kind: 'solo', minutes: 1, range: 'five',   steps: 4, tempo: 84,
      notes: '0:1 z:1 2:1 z:1 4:1 z:1 2:1 z:1 | 0:2 z:6',
      lyric: 'ha ha ha ha ha' },
    { id: 'arpeggio', kind: 'solo', minutes: 1, range: 'octave', steps: 4, tempo: 76,
      notes: '0:1 2:1 4:1 7:1 4:1 2:1 0:2 | z:8',
      lyric: 'nu nu nu nu nu nu nu' },
    { id: 'scale',    kind: 'solo', minutes: 1, range: 'octave', steps: 3, tempo: 88,
      notes: '0:1 1:1 2:1 3:1 4:1 5:1 6:1 7:1 | 6:1 5:1 4:1 3:1 2:1 1:1 0:2 | z:8',
      lyric: 'la la la la la la la la la la la la la la la' },
    { id: 'tuning',   kind: 'choir', minutes: 1, tempo: 60,
      keys: [65, 67, 69],                       // F4, G4, A4 – roots for soprano and alto
      vowels: ['u', 'o', 'a'],                  // one vowel per key
      octave: { S: 0, A: 0, T: -12, B: -12 },   // tenor and bass sing from the root an octave lower
      chords: {                                 // I – IV – V – I, scale degrees per voice
        S: [2, 3, 1, 2],
        A: [0, 0, -1, 0],
        T: [4, 5, 4, 4],
        B: [0, -4, -3, 0]
      } }
  ],

  text: {

    pl: {
      _guide: {
        title: 'Rozgrzewka chóralna – opis ćwiczeń',
        back: '← Wróć do aplikacji',
        intro: 'Rozgrzewka przygotowuje ciało, oddech i głos do śpiewania. Wystarczy 10–15 minut. Ćwiczenia z nutami otworzysz w aplikacji jednym dotknięciem – w zakresie wygodnym dla twojego głosu i z akompaniamentem, który przed każdym powtórzeniem podaje nowy dźwięk.',
        rulesTitle: 'Najpierw bezpieczeństwo',
        rules: [
          'Śpiewaj cicho albo średnio głośno – rozgrzewka to nie koncert.',
          'Nie wyciskaj najwyższych i najniższych dźwięków. Jeśli coś ciągnie w gardle, wróć niżej albo przerwij.',
          'Ból albo chrypka to sygnał do przerwy, a nie do mocniejszej rozgrzewki.',
          'Pij wodę małymi łykami.',
          'Po chorobie albo długiej przerwie zacznij tylko od mruczenia i trelu wargami.'
        ],
        orderTitle: 'Proponowana kolejność',
        rangesTitle: 'Zakresy w aplikacji',
        rangesText: 'Ćwiczenia zaczynają się od wygodnego dźwięku, idą co pół tonu w górę, a potem wracają. Najniższy i najwyższy dźwięk dla każdego głosu:',
        colVoice: 'Głos',
        colLow: 'Najniższy dźwięk',
        colHigh: 'Najwyższy dźwięk',
        goal: 'Cel',
        how: 'Jak wykonać',
        tips: 'Na co uważać',
        practice: 'Ćwicz w aplikacji:',
        noNotes: 'Bez nut – wykonaj samodzielnie.',
        min: 'ok. {n} min',
        mixTip: 'Wskazówka: w mikserze aplikacji wybierz „Bez mojego głosu”, żeby śpiewać tylko z akompaniamentem.',
        lang: 'Język',
        footer: 'Część aplikacji Partia chóralna. Ćwiczenia możesz zmieniać i dodawać w pliku warmups.js.'
      },
      body: {
        title: 'Ciało i postawa',
        short: 'Rozluźnienie barków, szyi i szczęki',
        goal: 'Zdjąć napięcie, które przeszkadza w śpiewaniu.',
        how: [
          'Pokręć barkami do tyłu i do przodu, po kilka razy.',
          'Delikatnie skłoń głowę na boki, bez okrężnych ruchów szyją.',
          'Pomasuj szczękę przy uszach i pozwól jej swobodnie opaść.',
          'Stań stabilnie: stopy na szerokość bioder, kolana luźne, mostek lekko uniesiony, ramiona opuszczone.'
        ],
        tips: 'Postawa ma być wygodna, nie wojskowa.'
      },
      breath: {
        title: 'Oddech',
        short: 'Długi wydech na „sss” i pulsowanie',
        goal: 'Uruchomić niski, szeroki oddech i równy wydech.',
        how: [
          'Weź spokojny wdech nosem tak, żeby rozszerzyły się brzuch i boki, a nie barki.',
          'Wypuszczaj powietrze na równe „sss” przez 15–20 sekund. Powtórz 3 razy.',
          'Potem krótkie, sprężyste „s-s-s-s” – poczuj pracę mięśni brzucha.'
        ],
        tips: 'Nie nabieraj powietrza „na zapas” – wdech ma być cichy i swobodny.'
      },
      hum: {
        title: 'Mruczenie',
        short: 'Pięć dźwięków w dół na „mm”',
        goal: 'Rezonans i miękki początek dźwięku bez nacisku na krtań.',
        how: [
          'Usta zamknięte, zęby lekko rozsunięte, język luźno.',
          'Mrucz pięć dźwięków w dół: 5-4-3-2-1.',
          'Szukaj delikatnego łaskotania w okolicy nosa i ust.'
        ],
        tips: 'Cicho i lekko. Jeśli czujesz ucisk w gardle, mrucz jeszcze ciszej.'
      },
      liptrill: {
        title: 'Trel wargami',
        short: 'W górę i w dół na „brrr”',
        goal: 'Rozluźnić głos i połączyć oddech z dźwiękiem.',
        how: [
          'Wprawiaj wargi w drganie jak przy „brrr”, którym dziecko udaje samochód.',
          'Śpiewaj na tym drganiu dźwięki 1-2-3-4-5-4-3-2-1.',
          'Jeśli wargi się zatrzymują, lekko podeprzyj policzki palcami.'
        ],
        tips: 'Ćwiczenie ma być łatwe – to najlepszy sposób na rozruszanie głosu po przerwie.'
      },
      siren: {
        title: 'Syrena',
        short: 'Płynny ślizg z góry na dół',
        goal: 'Połączyć rejestry i rozciągnąć zakres bez wysiłku.',
        how: [
          'Na „u” albo na trelu wargami jedź płynnie od wysokiego, lekkiego dźwięku do niskiego.',
          'Potem w drugą stronę: z dołu do góry i z powrotem.',
          'Powtórz 3–4 razy, za każdym razem odrobinę szerzej.'
        ],
        tips: 'Góra lekko, dół miękko. Nie zatrzymuj się na „przeskoku” – po prostu jedź dalej.'
      },
      vowels: {
        title: 'Ma-me-mi-mo-mu',
        short: 'Samogłoski na pięciu dźwiękach',
        goal: 'Wyrównać samogłoski i utrzymać jedno miejsce brzmienia.',
        how: [
          'Śpiewaj legato 1-2-3-4-5-4-3-2-1 na sylabach ma-me-mi-mo-mu-mo-mi-me-ma.',
          'Zmieniaj tylko kształt ust i języka – szczęka nie skacze.',
          'Wszystkie samogłoski mają brzmieć podobnie jasno i okrągło.'
        ],
        tips: '„i” i „e” nie mogą się spłaszczyć – myśl o lekko zaokrąglonych ustach.'
      },
      staccato: {
        title: 'Staccato „ha”',
        short: 'Krótkie dźwięki z pracą brzucha',
        goal: 'Aktywne podparcie oddechowe i precyzyjne wejście dźwięku.',
        how: [
          'Śpiewaj krótko 1-3-5-3-1 na „ha”.',
          'Każdy dźwięk rodzi się z małego impulsu brzucha, jak przy śmiechu.',
          'Między dźwiękami gardło zostaje otwarte – nie zamykaj go „na twardo”.'
        ],
        tips: 'Bez uderzania krtanią. Lekkie, sprężyste „ha”, nie krzyk.'
      },
      arpeggio: {
        title: 'Trójdźwięk „nu”',
        short: 'Do oktawy i z powrotem',
        goal: 'Swobodne przejście do wyższych dźwięków i czyste interwały.',
        how: [
          'Śpiewaj 1-3-5-8-5-3-1 na „nu”.',
          'Górny dźwięk weź lekko, jakby „z góry”, nie wypychaj go.',
          'Słuchaj akompaniamentu – trójdźwięk musi z nim stroić.'
        ],
        tips: 'Jeśli góra jest za wysoko, zatrzymaj odtwarzanie albo ustaw zakres taktów na niższe powtórzenia.'
      },
      scale: {
        title: 'Gama „la”',
        short: 'Oktawa w górę i w dół',
        goal: 'Ruchliwość głosu i równe brzmienie w całej skali.',
        how: [
          'Śpiewaj gamę w górę i w dół na „la”, legato.',
          'Każdy dźwięk tak samo głośny – bez akcentu na górze.',
          'Gdy idzie dobrze, przyspiesz tempo przyciskiem +.'
        ],
        tips: 'W szybszym tempie śpiewaj lżej, nie mocniej.'
      },
      tuning: {
        title: 'Strojenie akordu',
        short: 'Cały chór: akordy na u, o, a',
        goal: 'Słuchanie innych głosów i wspólna, czysta intonacja.',
        how: [
          'Każdy głos śpiewa swoją nutę akordu, długo i spokojnie.',
          'Słuchaj basu – to fundament, do którego stroją się pozostali.',
          'Kolejne tonacje śpiewacie na „u”, potem na „o”, potem na „a”.'
        ],
        tips: 'W aplikacji ćwiczysz swój głos z pozostałymi w tle. Na próbie śpiewajcie razem, bez akompaniamentu.'
      }
    },

    en: {
      _guide: {
        title: 'Choir warm-up – exercise guide',
        back: '← Back to the app',
        intro: 'A warm-up prepares the body, breath and voice for singing; 10–15 minutes is enough. Exercises with notation open in the app with one tap – in a comfortable range for your voice and with an accompaniment that gives the new starting note before each repetition.',
        rulesTitle: 'Safety first',
        rules: [
          'Sing softly or medium loud – a warm-up is not a concert.',
          'Do not force the highest and lowest notes. If something pulls in your throat, go lower or stop.',
          'Pain or hoarseness is a signal to rest, not to warm up harder.',
          'Sip water.',
          'After an illness or a long break, start with humming and lip trills only.'
        ],
        orderTitle: 'Suggested order',
        rangesTitle: 'Ranges used in the app',
        rangesText: 'The exercises start on a comfortable note, move up in semitones and then come back down. Lowest and highest note for each part:',
        colVoice: 'Part',
        colLow: 'Lowest note',
        colHigh: 'Highest note',
        goal: 'Goal',
        how: 'How to do it',
        tips: 'Watch out for',
        practice: 'Practise in the app:',
        noNotes: 'No notation – do it on your own.',
        min: 'about {n} min',
        mixTip: 'Tip: in the app’s mixer choose “Without my part” to sing with the accompaniment only.',
        lang: 'Language',
        footer: 'Part of Choir Part Trainer. You can change and add exercises in warmups.js.'
      },
      body: {
        title: 'Body and posture',
        short: 'Loosen shoulders, neck and jaw',
        goal: 'Release tension that gets in the way of singing.',
        how: [
          'Roll your shoulders backwards and forwards a few times.',
          'Gently tilt your head to each side; do not circle your neck.',
          'Massage the jaw joints in front of your ears and let the jaw hang loose.',
          'Stand steady: feet hip-width apart, knees soft, chest slightly lifted, shoulders down.'
        ],
        tips: 'The posture should feel comfortable, not military.'
      },
      breath: {
        title: 'Breathing',
        short: 'Long “sss” and pulses',
        goal: 'Engage low, wide breathing and an even exhale.',
        how: [
          'Breathe in quietly through the nose so that your belly and sides expand, not your shoulders.',
          'Breathe out on an even “sss” for 15–20 seconds. Repeat 3 times.',
          'Then short, bouncy “s-s-s-s” pulses – feel your abdominal muscles work.'
        ],
        tips: 'Do not gasp for extra air – the inhale should be quiet and easy.'
      },
      hum: {
        title: 'Humming',
        short: 'Five notes down on “mm”',
        goal: 'Resonance and a soft onset without pressing the larynx.',
        how: [
          'Lips closed, teeth slightly apart, tongue relaxed.',
          'Hum five notes downwards: 5-4-3-2-1.',
          'Look for a gentle buzz around your nose and lips.'
        ],
        tips: 'Quiet and light. If you feel pressure in your throat, hum even more quietly.'
      },
      liptrill: {
        title: 'Lip trill',
        short: 'Up and down on “brrr”',
        goal: 'Relax the voice and connect breath with sound.',
        how: [
          'Let your lips vibrate as in the “brrr” children make for a toy car.',
          'Sing 1-2-3-4-5-4-3-2-1 on this vibration.',
          'If your lips stop, support your cheeks lightly with your fingers.'
        ],
        tips: 'It should feel easy – it is the best way to wake up the voice after a break.'
      },
      siren: {
        title: 'Siren',
        short: 'Smooth glide from top to bottom',
        goal: 'Connect the registers and stretch the range without effort.',
        how: [
          'On “oo” or a lip trill, glide smoothly from a high, light note down to a low one.',
          'Then the other way: from low to high and back.',
          'Repeat 3–4 times, a little wider each time.'
        ],
        tips: 'Light at the top, soft at the bottom. Do not stop at the “break” – just keep gliding.'
      },
      vowels: {
        title: 'Ma-me-mi-mo-mu',
        short: 'Vowels on five notes',
        goal: 'Even vowels with one consistent placement.',
        how: [
          'Sing legato 1-2-3-4-5-4-3-2-1 on ma-me-mi-mo-mu-mo-mi-me-ma.',
          'Change only the shape of your lips and tongue – the jaw does not jump.',
          'All vowels should sound equally bright and round.'
        ],
        tips: 'Keep “ee” and “eh” from going flat and wide – think of slightly rounded lips.'
      },
      staccato: {
        title: 'Staccato “ha”',
        short: 'Short notes driven by the belly',
        goal: 'Active breath support and a precise onset.',
        how: [
          'Sing 1-3-5-3-1 short on “ha”.',
          'Each note starts from a small impulse of the belly, as in laughing.',
          'Keep your throat open between the notes – do not close it hard.'
        ],
        tips: 'No pushing from the larynx. A light, bouncy “ha”, not a shout.'
      },
      arpeggio: {
        title: 'Arpeggio “nu”',
        short: 'Up to the octave and back',
        goal: 'Easy access to higher notes and clean intervals.',
        how: [
          'Sing 1-3-5-8-5-3-1 on “nu” (as in “noon”).',
          'Take the top note lightly, as if from above – do not push it up.',
          'Listen to the accompaniment – the arpeggio must be in tune with it.'
        ],
        tips: 'If the top gets too high, stop playback or set the bar range to the lower repetitions.'
      },
      scale: {
        title: 'Scale “la”',
        short: 'One octave up and down',
        goal: 'Agility and an even sound through the whole scale.',
        how: [
          'Sing the scale up and down on “la”, legato.',
          'Keep every note equally loud – no accent at the top.',
          'When it goes well, raise the tempo with the + button.'
        ],
        tips: 'At faster tempos sing lighter, not louder.'
      },
      tuning: {
        title: 'Chord tuning',
        short: 'Whole choir: chords on oo, oh, ah',
        goal: 'Listening to the other parts and tuning together.',
        how: [
          'Each part sings its note of the chord, long and calm.',
          'Listen to the bass – it is the foundation the others tune to.',
          'Sing the next keys on “u” (oo), then “o” (oh), then “a” (ah).'
        ],
        tips: 'In the app you practise your part with the others in the background. At rehearsal sing together without accompaniment.'
      }
    },

    de: {
      _guide: {
        title: 'Einsingen im Chor – Übungsanleitung',
        back: '← Zurück zur App',
        intro: 'Das Einsingen bereitet Körper, Atem und Stimme auf das Singen vor; 10–15 Minuten genügen. Übungen mit Noten öffnest du in der App mit einem Tipp – in einer bequemen Lage für deine Stimme und mit einer Begleitung, die vor jeder Wiederholung den neuen Anfangston gibt.',
        rulesTitle: 'Sicherheit zuerst',
        rules: [
          'Singe leise bis mittellaut – Einsingen ist kein Konzert.',
          'Drücke die höchsten und tiefsten Töne nicht heraus. Zieht es im Hals, geh tiefer oder hör auf.',
          'Schmerz oder Heiserkeit sind ein Zeichen für eine Pause, nicht für mehr Einsingen.',
          'Trink Wasser in kleinen Schlucken.',
          'Nach einer Krankheit oder langen Pause beginne nur mit Summen und Lippenflattern.'
        ],
        orderTitle: 'Vorgeschlagene Reihenfolge',
        rangesTitle: 'Tonumfang in der App',
        rangesText: 'Die Übungen beginnen auf einem bequemen Ton, steigen in Halbtonschritten und kehren dann zurück. Tiefster und höchster Ton je Stimme:',
        colVoice: 'Stimme',
        colLow: 'Tiefster Ton',
        colHigh: 'Höchster Ton',
        goal: 'Ziel',
        how: 'So geht es',
        tips: 'Darauf achten',
        practice: 'In der App üben:',
        noNotes: 'Ohne Noten – selbstständig ausführen.',
        min: 'ca. {n} Min.',
        mixTip: 'Tipp: Wähle im Mischpult der App „Ohne meine Stimme“, um nur mit der Begleitung zu singen.',
        lang: 'Sprache',
        footer: 'Teil des Chorstimmen-Trainers. Die Übungen kannst du in warmups.js ändern und ergänzen.'
      },
      body: {
        title: 'Körper und Haltung',
        short: 'Schultern, Nacken und Kiefer lockern',
        goal: 'Spannungen lösen, die beim Singen stören.',
        how: [
          'Kreise die Schultern einige Male nach hinten und nach vorne.',
          'Neige den Kopf sanft zu beiden Seiten, ohne den Hals kreisen zu lassen.',
          'Massiere die Kiefergelenke vor den Ohren und lass den Kiefer locker hängen.',
          'Stehe stabil: Füße hüftbreit, Knie locker, Brustbein leicht gehoben, Schultern unten.'
        ],
        tips: 'Die Haltung soll bequem sein, nicht militärisch.'
      },
      breath: {
        title: 'Atmung',
        short: 'Langes „sss“ und Impulse',
        goal: 'Tiefe, weite Atmung und gleichmäßiges Ausatmen aktivieren.',
        how: [
          'Atme ruhig durch die Nase ein, so dass sich Bauch und Flanken weiten, nicht die Schultern.',
          'Atme 15–20 Sekunden auf ein gleichmäßiges „sss“ aus. Dreimal wiederholen.',
          'Dann kurze, federnde „s-s-s-s“ – spüre die Bauchmuskeln arbeiten.'
        ],
        tips: 'Nicht nach Luft schnappen – die Einatmung soll leise und mühelos sein.'
      },
      hum: {
        title: 'Summen',
        short: 'Fünf Töne abwärts auf „mm“',
        goal: 'Resonanz und weicher Toneinsatz ohne Druck auf den Kehlkopf.',
        how: [
          'Lippen geschlossen, Zähne leicht auseinander, Zunge locker.',
          'Summe fünf Töne abwärts: 5-4-3-2-1.',
          'Suche ein leichtes Kribbeln um Nase und Lippen.'
        ],
        tips: 'Leise und leicht. Spürst du Druck im Hals, summe noch leiser.'
      },
      liptrill: {
        title: 'Lippenflattern',
        short: 'Auf und ab auf „brrr“',
        goal: 'Die Stimme lockern und Atem mit Ton verbinden.',
        how: [
          'Lass die Lippen flattern wie beim „brrr“ eines Spielzeugautos.',
          'Singe auf diesem Flattern 1-2-3-4-5-4-3-2-1.',
          'Bleiben die Lippen stehen, stütze die Wangen leicht mit den Fingern.'
        ],
        tips: 'Es soll leicht gehen – der beste Weg, die Stimme nach einer Pause zu wecken.'
      },
      siren: {
        title: 'Sirene',
        short: 'Gleiten von oben nach unten',
        goal: 'Register verbinden und den Umfang mühelos dehnen.',
        how: [
          'Gleite auf „u“ oder mit Lippenflattern von einem hohen, leichten Ton nach unten.',
          'Dann umgekehrt: von unten nach oben und zurück.',
          '3–4 Mal wiederholen, jedes Mal etwas weiter.'
        ],
        tips: 'Oben leicht, unten weich. Am „Bruch“ nicht anhalten – einfach weitergleiten.'
      },
      vowels: {
        title: 'Ma-me-mi-mo-mu',
        short: 'Vokale auf fünf Tönen',
        goal: 'Ausgeglichene Vokale mit gleichem Sitz.',
        how: [
          'Singe legato 1-2-3-4-5-4-3-2-1 auf ma-me-mi-mo-mu-mo-mi-me-ma.',
          'Ändere nur Lippen- und Zungenform – der Kiefer springt nicht.',
          'Alle Vokale sollen gleich hell und rund klingen.'
        ],
        tips: '„i“ und „e“ nicht breit werden lassen – denke an leicht gerundete Lippen.'
      },
      staccato: {
        title: 'Staccato „ha“',
        short: 'Kurze Töne aus dem Bauch',
        goal: 'Aktive Atemstütze und genauer Toneinsatz.',
        how: [
          'Singe 1-3-5-3-1 kurz auf „ha“.',
          'Jeder Ton entsteht aus einem kleinen Bauchimpuls, wie beim Lachen.',
          'Der Hals bleibt zwischen den Tönen offen – nicht hart verschließen.'
        ],
        tips: 'Nicht aus dem Kehlkopf drücken. Ein leichtes, federndes „ha“, kein Rufen.'
      },
      arpeggio: {
        title: 'Dreiklang „nu“',
        short: 'Bis zur Oktave und zurück',
        goal: 'Leichter Zugang zur Höhe und saubere Intervalle.',
        how: [
          'Singe 1-3-5-8-5-3-1 auf „nu“.',
          'Nimm den Spitzenton leicht, wie von oben – nicht hochdrücken.',
          'Hör auf die Begleitung – der Dreiklang muss mit ihr stimmen.'
        ],
        tips: 'Wird es oben zu hoch, stoppe die Wiedergabe oder wähle als Taktbereich die tieferen Wiederholungen.'
      },
      scale: {
        title: 'Tonleiter „la“',
        short: 'Eine Oktave auf und ab',
        goal: 'Beweglichkeit und gleichmäßiger Klang über die ganze Tonleiter.',
        how: [
          'Singe die Tonleiter auf und ab auf „la“, legato.',
          'Jeder Ton gleich laut – kein Akzent oben.',
          'Wenn es gut geht, erhöhe das Tempo mit der Taste +.'
        ],
        tips: 'In schnellerem Tempo leichter singen, nicht lauter.'
      },
      tuning: {
        title: 'Akkorde stimmen',
        short: 'Ganzer Chor: Akkorde auf u, o, a',
        goal: 'Auf die anderen Stimmen hören und gemeinsam sauber intonieren.',
        how: [
          'Jede Stimme singt ihren Akkordton, lang und ruhig.',
          'Hör auf den Bass – er ist das Fundament, nach dem sich die anderen richten.',
          'Die weiteren Tonarten singt ihr auf „u“, dann auf „o“, dann auf „a“.'
        ],
        tips: 'In der App übst du deine Stimme mit den anderen im Hintergrund. In der Probe singt ihr gemeinsam ohne Begleitung.'
      }
    }
  }
};
