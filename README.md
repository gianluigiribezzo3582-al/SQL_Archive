# SQL Archive

Un tool per esercitarsi con SQL nei panni del nuovo archivista dell'**Archivio di Ombravalle** (anno 1891).
Il vecchio archivista è sparito, e con lui il prezioso *Codex Umbrae*: missione dopo missione impari SQL,
rimetti in ordine la biblioteca e scopri il colpevole.

Tutto gira **nel browser**: il database è un vero SQLite (via [sql.js](https://sql.js.org)/WebAssembly),
non serve nessun server applicativo né un database esterno.

## Cosa c'è dentro

- **35 missioni in 7 capitoli**, da `SELECT *` alle funzioni finestra:
  SELECT, WHERE, ORDER BY, LIMIT, LIKE, BETWEEN, IN, IS NULL, DISTINCT, COUNT/SUM/AVG/MAX,
  GROUP BY, HAVING, JOIN, LEFT JOIN, INSERT, UPDATE, DELETE, CREATE TABLE AS, sottoquery, CTE (`WITH`),
  `ROW_NUMBER() OVER`, `sqlite_master`.
- **Una trama gialla**: dal capitolo VI si indaga sulla scomparsa del Codex incrociando prestiti,
  registro degli accessi e scaffali. C'è anche una tabella nascosta che non compare nello Schedario…
- **Verifica automatica**: il risultato della tua query viene confrontato con quello atteso
  (colonne, righe, ordine quando richiesto). Per le missioni che modificano il catalogo viene confrontato lo
  stato finale; se un tentativo sbagliato sporca i dati, puoi riavvolgere il catalogo all'inizio della missione.
- **Messaggi d'errore tradotti** in italiano e con consigli pratici.
- **Gamification**: gocce d'inchiostro (XP), 6 gradi (da *Apprendista* a *Custode del Codex*),
  sigilli d'oro per le missioni risolte senza suggerimenti, attestato finale stampabile.
- **Suggerimenti progressivi** e soluzione (con costo in XP).
- **Schedario** (schema delle tabelle, cliccabile), **Prontuario** (esempi di sintassi) e **Cronologia** delle query.
- **Sala di lettura libera**: sandbox senza missioni.
- Editor con evidenziazione SQL e autocompletamento (`Ctrl+Spazio`), esecuzione con `Ctrl+Invio`.
- Tema **giorno/candela** (chiaro/scuro), layout desktop a tre colonne e mobile con pannelli a scomparsa.
- Progressi e stato dell'archivio salvati nel browser (localStorage).
- Box per le **donazioni PayPal** in fondo alla pagina.

## Configurare le donazioni

Apri `js/config.js` e imposta il tuo nome utente PayPal.Me:

```js
paypal: {
  username: 'MarioRossi',   // da https://paypal.me/MarioRossi
  hostedButtonId: '',       // in alternativa: ID di un pulsante "Donate" di PayPal
  currency: 'EUR',
  amounts: [3, 5, 10, 20]
}
```

Se compili `hostedButtonId`, il pulsante usa il link `paypal.com/donate` e i tagli suggeriti vengono nascosti.

## Pubblicazione

È un sito statico: carica l'intera cartella sul tuo hosting (o usa GitHub Pages, Netlify, ecc.).

> Il file `vendor/sqljs/sql-wasm.wasm` deve essere servito via HTTP(S): aprendo `index.html`
> direttamente dal disco (`file://`) il motore SQL non si carica.

Per provarlo in locale:

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

## Struttura

```
index.html          interfaccia
css/style.css       tema pergamena (chiaro/scuro, responsive)
js/config.js        configurazione PayPal
js/data.js          schema e popolamento dell'archivio (deterministico)
js/missions.js      capitoli, missioni, gradi
js/app.js           motore: esecuzione, verifica, UI
vendor/             sql.js 1.10.3 e CodeMirror 5.65.16 (licenza MIT)
```

### Aggiungere una missione

In `js/missions.js` aggiungi un oggetto all'elenco `missions`:

```js
{
  id: 36, chapter: 7, title: 'Titolo', concept: 'GROUP BY',
  story: 'Testo narrativo… {nome} viene sostituito con il nome dell\'archivista.',
  task: 'Cosa deve fare l\'utente (HTML).',
  solution: 'SELECT …;',
  hints: ['Primo suggerimento', 'Secondo suggerimento'],
  check: 'result',   // oppure 'state' + verify: 'SELECT …' per INSERT/UPDATE/DELETE
  ordered: false     // true se l'ordine delle righe conta
}
```

## Licenze

Codice del progetto: tuo. Librerie incluse: sql.js (MIT), CodeMirror 5 (MIT).
Font: Google Fonts (IM Fell English, EB Garamond, Courier Prime — SIL Open Font License).
