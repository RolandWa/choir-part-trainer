# Publikacja na GitHub Pages – krok po kroku

## Czy to jest darmowe?

Tak. Konto **GitHub Free** pozwala publikować strony GitHub Pages z **publicznych** repozytoriów.
Strona z repozytorium prywatnego wymaga płatnego planu (np. GitHub Pro). Tutaj to niepotrzebne,
bo aplikacja i tak ma być dostępna dla wszystkich.

Limity GitHub Pages (dla tej aplikacji z ogromnym zapasem):

| Limit | Wartość | Aplikacja |
|---|---|---|
| Rozmiar opublikowanej strony | do 1 GB | ok. 0,2 MB |
| Transfer (limit miękki) | 100 GB miesięcznie | wystarczy na setki tysięcy otwarć |
| Publikacje (limit miękki) | 10 na godzinę | – |

Adres strony będzie taki: `https://TWOJ-LOGIN.github.io/NAZWA-REPOZYTORIUM/`.
Zawsze działa przez **https**, więc działa mikrofon (stroik i nagrywanie).

**Zanim zaczniesz:**

- Użyj prywatnego konta GitHub, a nie konta firmowego albo organizacji pracodawcy.
- Repozytorium jest publiczne – każdy zobaczy pliki. **Nie wgrywaj do niego nut chronionych prawem
  autorskim** (np. kopii z teczki chóru). Utwory przekazuj chórzystom przyciskiem „Udostępnij link” –
  nuty są wtedy tylko w linku, a nie w repozytorium.
- Wybierz nazwę repozytorium na stałe, zanim roześlesz linki. Zmiana nazwy zmienia adres strony
  i stare linki przestają działać.

## 1. Pierwsza publikacja przez przeglądarkę

Nie trzeba niczego instalować. Najwygodniej zrobić to na komputerze.

1. Rozpakuj `choir-part-trainer.zip`.
2. Zaloguj się na [github.com](https://github.com), kliknij **+** w prawym górnym rogu, potem **New repository**.
3. **Repository name**: np. `partia-choralna` (małe litery i myślniki). Zaznacz **Public**.
   Niczego więcej nie zaznaczaj i kliknij **Create repository**.
4. Na stronie pustego repozytorium kliknij link **uploading an existing file**.
5. Otwórz rozpakowany folder `choir-part-trainer` i przeciągnij **jego zawartość** (pliki oraz foldery `tools`, `icons`, `tests` i `.github`),
   a nie sam folder. `index.html` musi leżeć w głównym katalogu repozytorium.
   Na dole wpisz opis, np. `Wersja 1.0.0`, i kliknij **Commit changes**.
6. Sprawdź, czy na liście plików jest `.nojekyll`. Systemy często ukrywają pliki zaczynające się od kropki,
   więc mógł zostać pominięty. Jeśli go nie ma: **Add file → Create new file**, nazwa `.nojekyll`,
   pusta treść, **Commit changes**. Ten plik sprawia, że GitHub publikuje pliki dokładnie tak, jak je wgrałeś.
7. Wejdź w **Settings → Pages**. W sekcji **Build and deployment** ustaw:
   Source **Deploy from a branch**, Branch **main**, folder **/ (root)**, i kliknij **Save**.
8. Po 1–2 minutach u góry tej strony pojawi się **Your site is live at …** z adresem aplikacji.

## 2. Sprawdzenie po publikacji

- Strona otwiera się na telefonie i sama wybiera język.
- W stopce jest „Wersja 1.0.0” oraz linki „Kod źródłowy” i „Co nowego”.
- Stroik: przeglądarka pyta o zgodę na mikrofon, a po zgodzie pokazuje śpiewaną nutę (w słuchawkach).
- „Udostępnij link”: link zaczyna się od Twojego adresu `github.io` i otwiera utwór na innym telefonie.
- „Pełny opis rozgrzewek” otwiera stronę z ćwiczeniami.

## 3. Publikacja nowej wersji

### Numer wersji

Format `główna.mniejsza.poprawka`:

- **poprawka** (1.0.1) – drobne poprawki tekstów i błędów,
- **mniejsza** (1.1.0) – nowa funkcja,
- **główna** (2.0.0) – duże zmiany, np. inny sposób zapisu danych.

Numer jest w `index.html` (`APP_VERSION`) i przy plikach skryptów (`i18n.js?v=…`, `warmups.js?v=…`)
w `index.html` i `warmups.html`. Dzięki temu przeglądarki pobierają nowe pliki razem z nową stroną.
Wszystko naraz zmienia skrypt `tools/release.py` (wymaga Pythona 3).

### a) Przez przeglądarkę

1. Na swoim komputerze, w folderze aplikacji, uruchom:
   ```
   python tools/release.py 1.1.0 "Opis zmiany; druga zmiana" --no-git
   ```
   Skrypt ustawi numer wersji i dopisze wpis do `CHANGELOG.md` (średnik rozdziela punkty).
   Jeśli nie chcesz używać skryptu, zmień numer ręcznie w trzech miejscach opisanych wyżej.
2. W repozytorium kliknij **Add file → Upload files** i przeciągnij zmienione pliki.
   Pliki o tych samych nazwach zostaną zastąpione. Opis: `Wersja 1.1.0: …`, potem **Commit changes**.
3. Po około minucie nowa wersja jest online. Przeglądarki mogą pamiętać starą kopię do 10 minut –
   wystarczy odświeżyć stronę.
4. Opcjonalnie: **Releases → Draft a new release**, utwórz tag `v1.1.0`, wpisz opis
   i kliknij **Publish release**. GitHub dołączy do wydania gotowy plik .zip do pobrania.

### b) Przez git

Raz, na początku:
```
git clone https://github.com/TWOJ-LOGIN/partia-choralna.git
```
Skopiuj pliki aplikacji do tego folderu. Potem przy każdej nowej wersji:
```
python tools/release.py 1.1.0 "Opis zmiany; druga zmiana"
```
Skrypt ustawia numer wersji, aktualizuje `?v=`, dopisuje wpis w `CHANGELOG.md`,
robi commit, tworzy tag `v1.1.0` i wysyła wszystko na GitHub (`git push`).
GitHub Pages publikuje nową wersję automatycznie.

## 4. Testy automatyczne

W folderze `tests/` są testy, które sprawdzają podział słów na sylaby (polski, niemiecki, łacina, angielski),
podpisywanie słów pod nutami i czytanie zapisu ABC. Plik `.github/workflows/tests.yml` sprawia, że GitHub
uruchamia je sam po każdym wgraniu zmian.

**Na GitHubie**
1. Wgraj także foldery `tests` i `.github`. Uwaga: folder `.github` zaczyna się od kropki, więc na Macu jest
   domyślnie ukryty – w Finderze pokażesz go skrótem **Cmd + Shift + .** (kropka). Jeśli nie da się go przeciągnąć,
   na GitHubie wybierz **Add file → Create new file**, wpisz nazwę `.github/workflows/tests.yml` i wklej treść pliku.
2. Po każdym wgraniu zmian przy commicie pojawia się żółta kropka (testy trwają ok. pół minuty), potem zielony
   ptaszek (wszystko działa) albo czerwony krzyżyk (coś się zepsuło). Szczegóły są w zakładce **Actions**.
3. Strona na GitHub Pages publikuje się niezależnie od wyniku testów – krzyżyk to ostrzeżenie, nie blokada.

**Na własnym komputerze** (potrzebny tylko [Node.js](https://nodejs.org), wersja 18 lub nowsza)
```
node tests/run.js              wszystkie testy
node tests/run.js pl           tylko pliki z „pl” w nazwie
node tests/run.js --verbose    także lista znanych ograniczeń
```
Skrypt `tools/release.py` uruchamia testy przed opublikowaniem wersji i zatrzymuje się, gdy któryś nie przejdzie.

**Dodawanie własnych przypadków** – to zwykłe pliki tekstowe:
- `tests/syllables/pl.txt` – słowo podzielone łącznikami, np. `Be-tle-jem`. Kilka poprawnych podziałów
  oddzielasz kreską: `pa-ste-rze | pas-te-rze`.
- `tests/lines/pl.txt` – liczba sylab i wers, np. `8 | Bóg się rodzi, moc truchleje`. Najlepiej wersy pieśni,
  w których liczba nut jest znana.
- `tests/lyrics/nazwa.abc` – krótki utwór ze słowami w `W:`. Po dodaniu uruchom `node tests/run.js --update`,
  **obejrzyj** powstały plik `nazwa.expected.abc` (czy sylaby są pod właściwymi nutami) i wgraj oba pliki.
- Linia zaczynająca się od `!` to znane ograniczenie: jest pokazywane, ale nie psuje wyniku.

Gdy chórzysta zgłosi źle podzielone słowo, dopisz je do odpowiedniego pliku z poprawnym podziałem – test pokaże
problem, a po poprawce będzie pilnował, żeby błąd nie wrócił. Pełny opis formatu jest w `tests/README.md`.

## 5. Telefony: Android i iPhone

- **Android**: otwórz link w Chrome. Z menu (trzy kropki) wybierz **Dodaj do ekranu głównego** albo **Zainstaluj aplikację**.
- **iPhone**: otwórz link w Safari, dotknij **Udostępnij** (kwadrat ze strzałką) i wybierz **Do ekranu początkowego**.
- Po pierwszym otwarciu aplikacja działa także bez internetu – przydatne w kościele albo w sali prób.
- Na iPhonie dźwięk gra nawet przy przełączniku wyciszenia ustawionym na „cicho”.
- **Ważne na iPhonie:** aplikacja dodana do ekranu początkowego ma osobną pamięć niż Safari, a linki z wiadomości
  otwierają się w Safari. Żeby dodać utwór do aplikacji z ekranu, skopiuj link od dyrygenta i użyj przycisku
  **Wklej link**. Na Androidzie ten problem nie występuje.
- Nuty rysuje biblioteka abcjs (ta sama co w aplikacji Michaela Eskina), pobierana z internetu przy pierwszym
  otwarciu. Jeśli chcesz mieć ją w repozytorium, uruchom `python tools/fetch_abcjs.py` i wgraj folder `vendor/`.
  Bez abcjs aplikacja pokazuje prostszy, wbudowany zapis nut.
- Nuty można wydrukować przyciskiem „Drukuj” albo zapisać od razu jako plik przyciskiem „Pobierz PDF”. PDF działa też
  na telefonie i bez internetu.
- Dźwięki instrumentów (fortepian, organy itd.) pobierają się z internetu przy pierwszym odtworzeniu danego
  instrumentu – to kilkaset kilobajtów na utwór. Potem są zapamiętane i działają bez internetu. Na próbie bez
  zasięgu można też wybrać „Syntezator wbudowany”.

## 6. Dane chórzystów przy aktualizacji

- Utwory zapisane przez chórzystów są w ich przeglądarkach, a nie w repozytorium.
  Nowa wersja aplikacji ich nie usuwa.
- Dane są przypisane do adresu `TWOJ-LOGIN.github.io`. Zmiana nazwy repozytorium ich nie kasuje,
  ale zmienia adres aplikacji, więc stare linki przestaną działać.
- Przejście na własną domenę to nowy adres – chórzyści zobaczą pustą listę utworów.
  Przed taką zmianą poproś ich o zapisanie utworów przyciskiem „Zapisz plik” albo roześlij linki ponownie.

## 7. Własna domena (opcjonalnie)

W **Settings → Pages → Custom domain** możesz wpisać własny adres (np. `chor.example.pl`)
i ustawić u swojego dostawcy domeny rekord DNS według instrukcji GitHuba. Zaznacz **Enforce HTTPS** –
bez https nie zadziała mikrofon.

## 8. Gdy coś nie działa

- **Błąd 404 po publikacji** – odczekaj kilka minut. Sprawdź, czy `index.html` jest w głównym katalogu
  repozytorium, a nie w podfolderze `choir-part-trainer/`.
- **Zamiast napisów widać nazwy w rodzaju `tunTitle`** – brakuje `i18n.js` obok `index.html`.
- **Brak rozgrzewek** – brakuje `warmups.js`.
- **Mikrofon nie działa** – adres musi zaczynać się od `https://`. W ustawieniach przeglądarki
  zezwól tej stronie na mikrofon.
- **Nuty wyglądają prościej niż u Eskina** – biblioteka abcjs nie wczytała się (brak internetu przy pierwszym
  otwarciu). Odśwież stronę z internetem albo dodaj folder `vendor/` (rozdział 5).
- **Nie widać zmian** – odśwież stronę (pamięć podręczna do 10 minut). Aplikacja dodana do ekranu głównego
  pobiera nową wersję przy następnym uruchomieniu z internetem. W zakładce **Actions**
  repozytorium widać, czy publikacja się udała (zadanie „pages build and deployment”).

Dokumentacja GitHuba: [GitHub Pages](https://docs.github.com/pages) oraz
[limity GitHub Pages](https://docs.github.com/pages/getting-started-with-github-pages/github-pages-limits).
