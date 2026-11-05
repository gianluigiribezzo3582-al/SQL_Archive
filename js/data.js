/* ==========================================================================
   SQL Archive — l'Archivio di Ombravalle
   Schema e popolamento del database (SQLite, generato in modo deterministico)
   ========================================================================== */
(function () {
  'use strict';

  // Generatore pseudo-casuale con seme fisso: l'archivio è identico per tutti.
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(1891);
  const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  const q = (v) => (v === null || v === undefined) ? 'NULL'
    : (typeof v === 'number' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'");
  const insert = (table, cols, rows) =>
    rows.map(r => `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${r.map(q).join(', ')});`).join('\n');

  const schema = `
CREATE TABLE sale (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  piano INTEGER,
  descrizione TEXT
);
CREATE TABLE scaffali (
  id INTEGER PRIMARY KEY,
  codice TEXT NOT NULL,
  sala_id INTEGER REFERENCES sale(id),
  capienza INTEGER
);
CREATE TABLE autori (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  nazione TEXT,
  nascita INTEGER,
  morte INTEGER
);
CREATE TABLE volumi (
  id INTEGER PRIMARY KEY,
  titolo TEXT NOT NULL,
  autore_id INTEGER REFERENCES autori(id),
  anno INTEGER,
  genere TEXT,
  lingua TEXT,
  pagine INTEGER,
  scaffale_id INTEGER REFERENCES scaffali(id),
  stato TEXT,
  valore INTEGER
);
CREATE TABLE visitatori (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  professione TEXT,
  citta TEXT,
  iscrizione TEXT
);
CREATE TABLE prestiti (
  id INTEGER PRIMARY KEY,
  volume_id INTEGER REFERENCES volumi(id),
  visitatore_id INTEGER REFERENCES visitatori(id),
  data_prestito TEXT,
  data_restituzione TEXT
);
CREATE TABLE restauri (
  id INTEGER PRIMARY KEY,
  volume_id INTEGER REFERENCES volumi(id),
  restauratore TEXT,
  data_inizio TEXT,
  data_fine TEXT,
  costo INTEGER
);
CREATE TABLE registro_accessi (
  id INTEGER PRIMARY KEY,
  visitatore_id INTEGER REFERENCES visitatori(id),
  sala_id INTEGER REFERENCES sale(id),
  ingresso TEXT,
  uscita TEXT
);
CREATE TABLE schede_provvisorie (
  id INTEGER PRIMARY KEY,
  titolo TEXT,
  autore TEXT,
  nota TEXT
);
CREATE TABLE registro_segreto (
  pagina INTEGER PRIMARY KEY,
  messaggio TEXT
);`;

  // --- Sale e scaffali ------------------------------------------------------
  const sale = [
    [1, 'Sala Grande', 0, 'Il salone d\'ingresso, con il grande lampadario di ottone'],
    [2, 'Sala dei Poeti', 1, 'Versi, poemi e commedie sotto un soffitto affrescato'],
    [3, 'Sala delle Scienze', 1, 'Astrolabi, erbari e trattati di medicina'],
    [4, 'Sala dei Codici', -1, 'La cripta umida dove riposano i manoscritti più rari'],
    [5, 'Torre dei Filosofi', 2, 'Una scala a chiocciola e mille domande senza risposta'],
    [6, 'Laboratorio di Restauro', 0, 'Colle, pennelli e pergamene in convalescenza']
  ];
  const scaffali = [
    [1, 'G-01', 1, 40], [2, 'G-02', 1, 40], [3, 'G-03', 1, 35], [4, 'G-04', 1, 35],
    [5, 'P-01', 2, 30], [6, 'P-02', 2, 30], [7, 'P-03', 2, 25], [8, 'P-04', 2, 25],
    [9, 'S-01', 3, 30], [10, 'S-02', 3, 30], [11, 'S-03', 3, 20],
    [12, 'C-01', 4, 12], [13, 'C-02', 4, 12], [14, 'C-03', 4, 10],
    [15, 'T-01', 5, 25], [16, 'T-02', 5, 25], [17, 'T-03', 5, 20],
    [18, 'R-01', 6, 15]
  ];

  // --- Autori ---------------------------------------------------------------
  const autori = [
    [1, 'Dante Alighieri', 'Italia', 1265, 1321],
    [2, 'Francesco Petrarca', 'Italia', 1304, 1374],
    [3, 'Giovanni Boccaccio', 'Italia', 1313, 1375],
    [4, 'Niccolò Machiavelli', 'Italia', 1469, 1527],
    [5, 'Ludovico Ariosto', 'Italia', 1474, 1533],
    [6, 'Torquato Tasso', 'Italia', 1544, 1595],
    [7, 'Galileo Galilei', 'Italia', 1564, 1642],
    [8, 'Giacomo Leopardi', 'Italia', 1798, 1837],
    [9, 'Alessandro Manzoni', 'Italia', 1785, 1873],
    [10, 'Omero', 'Grecia', -800, -701],
    [11, 'Publio Virgilio Marone', 'Roma', -70, -19],
    [12, 'Publio Ovidio Nasone', 'Roma', -43, 17],
    [13, 'Marco Tullio Cicerone', 'Roma', -106, -43],
    [14, 'Tito Lucrezio Caro', 'Roma', -99, -55],
    [15, 'Platone', 'Grecia', -428, -348],
    [16, 'Aristotele', 'Grecia', -384, -322],
    [17, 'William Shakespeare', 'Inghilterra', 1564, 1616],
    [18, 'Miguel de Cervantes', 'Spagna', 1547, 1616],
    [19, 'Michel de Montaigne', 'Francia', 1533, 1592],
    [20, 'François Rabelais', 'Francia', 1494, 1553],
    [21, 'Geoffrey Chaucer', 'Inghilterra', 1343, 1400],
    [22, 'Erasmo da Rotterdam', 'Paesi Bassi', 1466, 1536],
    [23, 'Tommaso d\'Aquino', 'Italia', 1225, 1274],
    [24, 'Leonardo da Vinci', 'Italia', 1452, 1519],
    [25, 'Ugo Foscolo', 'Italia', 1778, 1827],
    [26, 'Carlo Goldoni', 'Italia', 1707, 1793],
    [27, 'Johann Wolfgang von Goethe', 'Germania', 1749, 1832],
    [28, 'Voltaire', 'Francia', 1694, 1778],
    [29, 'Jonathan Swift', 'Irlanda', 1667, 1745],
    [30, 'Ippocrate di Coo', 'Grecia', -460, -370],
    [31, 'Plinio il Vecchio', 'Roma', 23, 79],
    [32, 'Anonimo', null, null, null],
    [33, 'Aurelio Vannucci', 'Italia', 1820, null],
    [34, 'Ildegarda di Bingen', 'Germania', 1098, 1179],
    [35, 'Christine de Pizan', 'Francia', 1364, 1430],
    [36, 'Saffo', 'Grecia', -630, -570]
  ];

  // --- Volumi: [titolo, autore_id, anno, genere, lingua, pagine] -------------
  const volumiBase = [
    ['Divina Commedia', 1, 1321, 'Epica', 'Italiano', 620],
    ['Vita Nova', 1, 1294, 'Poesia', 'Italiano', 140],
    ['De Monarchia', 1, 1313, 'Politica', 'Latino', 110],
    ['Convivio', 1, 1307, 'Filosofia', 'Italiano', 260],
    ['De vulgari eloquentia', 1, 1305, 'Saggistica', 'Latino', 90],
    ['Canzoniere', 2, 1374, 'Poesia', 'Italiano', 410],
    ['Trionfi', 2, 1374, 'Poesia', 'Italiano', 180],
    ['Secretum', 2, 1347, 'Filosofia', 'Latino', 150],
    ['Africa', 2, 1343, 'Epica', 'Latino', 300],
    ['Decameron', 3, 1353, 'Narrativa', 'Italiano', 780],
    ['Filostrato', 3, 1335, 'Poesia', 'Italiano', 160],
    ['Elegia di Madonna Fiammetta', 3, 1344, 'Narrativa', 'Italiano', 210],
    ['De mulieribus claris', 3, 1362, 'Storia', 'Latino', 320],
    ['Il Principe', 4, 1532, 'Politica', 'Italiano', 140],
    ['Discorsi sopra la prima deca di Tito Livio', 4, 1531, 'Politica', 'Italiano', 420],
    ['La Mandragola', 4, 1518, 'Teatro', 'Italiano', 90],
    ['Dell\'arte della guerra', 4, 1521, 'Saggistica', 'Italiano', 230],
    ['Istorie fiorentine', 4, 1532, 'Storia', 'Italiano', 510],
    ['Orlando furioso', 5, 1532, 'Epica', 'Italiano', 980],
    ['Satire', 5, 1534, 'Poesia', 'Italiano', 120],
    ['La Lena', 5, 1528, 'Teatro', 'Italiano', 95],
    ['Gerusalemme liberata', 6, 1581, 'Epica', 'Italiano', 720],
    ['Aminta', 6, 1573, 'Teatro', 'Italiano', 110],
    ['Rime', 6, 1593, 'Poesia', 'Italiano', 340],
    ['Sidereus Nuncius', 7, 1610, 'Scienza', 'Latino', 60],
    ['Il Saggiatore', 7, 1623, 'Scienza', 'Italiano', 236],
    ['Dialogo sopra i due massimi sistemi', 7, 1632, 'Scienza', 'Italiano', 458],
    ['Discorsi e dimostrazioni matematiche', 7, 1638, 'Scienza', 'Italiano', 314],
    ['Canti', 8, 1835, 'Poesia', 'Italiano', 220],
    ['Operette morali', 8, 1827, 'Filosofia', 'Italiano', 260],
    ['Zibaldone', 8, 1832, 'Saggistica', 'Italiano', 4526],
    ['I promessi sposi', 9, 1840, 'Narrativa', 'Italiano', 760],
    ['Adelchi', 9, 1822, 'Teatro', 'Italiano', 180],
    ['Storia della colonna infame', 9, 1840, 'Storia', 'Italiano', 150],
    ['Iliade', 10, -750, 'Epica', 'Greco', 680],
    ['Odissea', 10, -720, 'Epica', 'Greco', 540],
    ['Eneide', 11, -19, 'Epica', 'Latino', 590],
    ['Georgiche', 11, -29, 'Poesia', 'Latino', 160],
    ['Bucoliche', 11, -38, 'Poesia', 'Latino', 70],
    ['Metamorfosi', 12, 8, 'Epica', 'Latino', 610],
    ['Ars amatoria', 12, 2, 'Poesia', 'Latino', 130],
    ['Tristia', 12, 12, 'Poesia', 'Latino', 170],
    ['De officiis', 13, -44, 'Filosofia', 'Latino', 210],
    ['De re publica', 13, -51, 'Politica', 'Latino', 180],
    ['Orationes', 13, -60, 'Saggistica', 'Latino', 450],
    ['Repubblica', 15, -375, 'Filosofia', 'Greco', 520],
    ['Simposio', 15, -385, 'Filosofia', 'Greco', 120],
    ['Fedone', 15, -360, 'Filosofia', 'Greco', 140],
    ['Etica Nicomachea', 16, -340, 'Filosofia', 'Greco', 330],
    ['Poetica', 16, -335, 'Saggistica', 'Greco', 80],
    ['Politica', 16, -350, 'Politica', 'Greco', 300],
    ['Fisica', 16, -349, 'Scienza', 'Greco', 280],
    ['Amleto', 17, 1603, 'Teatro', 'Inglese', 210],
    ['Macbeth', 17, 1623, 'Teatro', 'Inglese', 140],
    ['La tempesta', 17, 1611, 'Teatro', 'Inglese', 150],
    ['Sonetti', 17, 1609, 'Poesia', 'Inglese', 160],
    ['Don Chisciotte della Mancia', 18, 1605, 'Narrativa', 'Spagnolo', 1020],
    ['Novelle esemplari', 18, 1613, 'Narrativa', 'Spagnolo', 480],
    ['Saggi', 19, 1580, 'Filosofia', 'Francese', 1100],
    ['Gargantua e Pantagruel', 20, 1532, 'Narrativa', 'Francese', 860],
    ['I racconti di Canterbury', 21, 1400, 'Poesia', 'Inglese', 700],
    ['Elogio della follia', 22, 1511, 'Filosofia', 'Latino', 140],
    ['Adagia', 22, 1500, 'Saggistica', 'Latino', 820],
    ['Summa Theologiae', 23, 1274, 'Teologia', 'Latino', 3020],
    ['Summa contra Gentiles', 23, 1264, 'Teologia', 'Latino', 900],
    ['Trattato della pittura', 24, 1651, 'Saggistica', 'Italiano', 190],
    ['Codice sul volo degli uccelli', 24, 1505, 'Manoscritto', 'Italiano', 36],
    ['Dei Sepolcri', 25, 1807, 'Poesia', 'Italiano', 30],
    ['Le Grazie', 25, 1822, 'Poesia', 'Italiano', 60],
    ['La locandiera', 26, 1753, 'Teatro', 'Italiano', 110],
    ['Arlecchino servitore di due padroni', 26, 1745, 'Teatro', 'Italiano', 120],
    ['Il campiello', 26, 1756, 'Teatro', 'Italiano', 100],
    ['Faust', 27, 1808, 'Teatro', 'Tedesco', 500],
    ['I dolori del giovane Werther', 27, 1774, 'Narrativa', 'Tedesco', 190],
    ['Candido', 28, 1759, 'Narrativa', 'Francese', 140],
    ['Trattato sulla tolleranza', 28, 1763, 'Filosofia', 'Francese', 200],
    ['I viaggi di Gulliver', 29, 1726, 'Narrativa', 'Inglese', 380],
    ['Aforismi', 30, -400, 'Medicina', 'Greco', 90],
    ['Corpus Hippocraticum', 30, -380, 'Medicina', 'Greco', 1200],
    ['Naturalis Historia', 31, 77, 'Scienza', 'Latino', 2400],
    ['Codex Umbrae', 32, 1123, 'Manoscritto', 'Latino', 312],
    ['Liber Herbarum', 32, 1210, 'Medicina', 'Latino', 180],
    ['Salterio di Ombravalle', 32, 1050, 'Manoscritto', 'Latino', 240],
    ['Cronaca di Ombravalle', 32, 1290, 'Manoscritto', 'Italiano', 400],
    ['Bestiario miniato', 32, 1180, 'Manoscritto', 'Latino', 96],
    ['Carmina Burana', 32, 1230, 'Poesia', 'Latino', 250],
    ['Le mille e una notte', 32, 1450, 'Narrativa', 'Arabo', 900],
    ['Chanson de Roland', 32, 1100, 'Epica', 'Francese', 160],
    ['Memorie dell\'Archivio di Ombravalle', 33, 1888, 'Storia', 'Italiano', 340],
    ['Catalogo ragionato dei codici', 33, 1885, 'Saggistica', 'Italiano', 520],
    ['Scivias', 34, 1151, 'Teologia', 'Latino', 410],
    ['Physica', 34, 1158, 'Medicina', 'Latino', 230]
  ];

  // Collocazione per genere
  const shelvesFor = {
    Poesia: [5, 6, 7, 8], Epica: [5, 6, 7, 8], Teatro: [5, 6, 7, 8],
    Scienza: [9, 10, 11], Medicina: [9, 10, 11],
    Filosofia: [15, 16, 17], Teologia: [15, 16, 17], Politica: [15, 16, 17],
    Narrativa: [1, 2, 3, 4], Storia: [1, 2, 3, 4], Saggistica: [1, 2, 3, 4],
    Manoscritto: [12, 13, 14]
  };
  const counters = {};

  // Valori fissi e collocazioni speciali (la trama ne ha bisogno)
  const overrides = {
    'Codex Umbrae': { scaffale: 13, stato: 'smarrito', valore: 50000 },
    'Codice sul volo degli uccelli': { scaffale: 14, stato: 'integro', valore: 40000 },
    'Salterio di Ombravalle': { scaffale: 12, stato: 'integro', valore: 18000 },
    'Bestiario miniato': { scaffale: 12, stato: 'integro', valore: 12000 },
    'Cronaca di Ombravalle': { scaffale: 14, stato: 'danneggiato', valore: 9500 },
    'Liber Herbarum': { scaffale: 13, stato: 'integro', valore: 7000 },
    'Decameron': { scaffale: 18, stato: 'restauro', valore: 6400 },
    'Adagia': { scaffale: 18, stato: 'restauro', valore: 2350 },
    'Divina Commedia': { valore: 15500 },
    'Canzoniere': { stato: 'integro', valore: 8200 },
    'Memorie dell\'Archivio di Ombravalle': { stato: 'integro', valore: 300 }
  };

  const usedValues = new Set([50000, 40000, 18000, 12000, 9500, 7000, 6400, 2350, 15500, 8200, 300]);
  const volumi = volumiBase.map((v, i) => {
    const [titolo, autore, anno, genere, lingua, pagine] = v;
    const o = overrides[titolo] || {};
    const list = shelvesFor[genere];
    counters[genere] = (counters[genere] || 0) + 1;
    let scaffale = o.scaffale || list[(counters[genere] - 1) % list.length];
    let valore;
    if (anno < 1400) valore = between(18, 70) * 100;
    else if (anno < 1600) valore = between(8, 30) * 100;
    else if (anno < 1750) valore = between(25, 90) * 10;
    else valore = between(8, 45) * 10;
    while (usedValues.has(valore)) valore += 10;
    const r = rnd();
    let stato = r < 0.14 ? 'danneggiato' : 'integro';
    if (o.valore !== undefined) valore = o.valore;
    if (o.stato) stato = o.stato;
    usedValues.add(valore);
    return [i + 1, titolo, autore, anno, genere, lingua, pagine, scaffale, stato, valore];
  });
  const idOf = {};
  volumi.forEach(v => { idOf[v[1]] = v[0]; });

  // --- Visitatori -----------------------------------------------------------
  const visitatori = [
    [1, 'Conte Ettore Malaspina', 'Collezionista', 'Firenze', '1884-03-12'],
    [2, 'Suor Benedetta Orsini', 'Copista', 'Siena', '1886-06-01'],
    [3, 'Prof. Livio Ceccarelli', 'Filologo', 'Bologna', '1882-10-20'],
    [4, 'Dott.ssa Irene Valli', 'Medica', 'Padova', '1889-01-15'],
    [5, 'Bartolomeo Grifi', 'Mercante di libri', 'Venezia', '1890-09-03'],
    [6, 'Margherita Lunardi', 'Studentessa', 'Pisa', '1891-02-11'],
    [7, 'Gaspare Tornielli', 'Restauratore', 'Lucca', '1887-05-30'],
    [8, 'Annibale Ferri', 'Notaio', 'Ombravalle', '1880-01-07'],
    [9, 'Caterina Sforzini', 'Poetessa', 'Milano', '1888-04-22'],
    [10, 'Padre Anselmo Rubei', 'Teologo', 'Roma', '1883-11-09'],
    [11, 'Ottavio Lenzi', 'Astronomo', 'Arcetri', '1885-07-19'],
    [12, 'Lucia Bassani', 'Maestra', 'Ombravalle', '1890-12-02'],
    [13, 'Giovanni Battista Moro', 'Tipografo', 'Torino', '1886-08-14'],
    [14, 'Elena Castaldi', 'Pittrice', 'Napoli', '1889-05-05'],
    [15, 'Fabrizio Neri', 'Studente', 'Pisa', '1891-03-28'],
    [16, 'Rosalia Monti', 'Storica', 'Palermo', '1887-09-10']
  ];

  // --- Prestiti -------------------------------------------------------------
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

  const prestitiRaw = [];
  // prestiti ordinari, tutti restituiti
  const lendable = volumi.filter(v => v[7] < 12 || (v[7] > 14 && v[7] < 18));
  const start = Date.UTC(1890, 0, 10);
  const span = Date.UTC(1891, 8, 30) - start;
  for (let i = 0; i < 34; i++) {
    const vol = lendable[Math.floor(rnd() * lendable.length)];
    const vis = between(1, 15);
    const d = new Date(start + Math.floor(rnd() * span / 86400000) * 86400000);
    prestitiRaw.push([vol[0], vis, fmt(d), fmt(addDays(d, between(6, 40)))]);
  }
  // prestiti della trama
  prestitiRaw.push(
    [idOf['Codex Umbrae'], 3, '1891-09-02', '1891-09-30'],
    [idOf['Codex Umbrae'], 2, '1891-10-05', '1891-10-19'],
    [idOf['Codex Umbrae'], 1, '1891-10-21', '1891-10-28'],
    [idOf['Bestiario miniato'], 5, '1891-10-12', null],
    [idOf['Canzoniere'], 1, '1891-10-25', null],
    [idOf['Africa'], 3, '1891-10-03', null],
    [idOf['Secretum'], 3, '1891-10-03', null],
    [idOf['Il Principe'], 6, '1891-10-15', null],
    [idOf['Candido'], 8, '1891-10-22', null],
    [idOf['Sidereus Nuncius'], 11, '1891-10-27', null],
    [idOf['Cronaca di Ombravalle'], 7, '1891-08-01', '1891-08-20']
  );
  prestitiRaw.sort((a, b) => a[2].localeCompare(b[2]));
  const prestiti = prestitiRaw.map((p, i) => [i + 1].concat(p));

  // --- Restauri -------------------------------------------------------------
  const restauri = [
    [1, idOf['Decameron'], 'Gaspare Tornielli', '1891-09-15', null, 420],
    [2, idOf['Adagia'], 'Bottega Lanzi', '1891-10-02', null, 180],
    [3, idOf['Cronaca di Ombravalle'], 'Gaspare Tornielli', '1890-04-10', '1890-06-30', 650],
    [4, idOf['Salterio di Ombravalle'], 'Bottega Lanzi', '1889-11-01', '1890-02-15', 900],
    [5, idOf['Iliade'], 'Bottega Lanzi', '1890-07-20', '1890-08-10', 140],
    [6, idOf['Codex Umbrae'], 'Gaspare Tornielli', '1891-03-01', '1891-05-12', 1200],
    [7, idOf['Divina Commedia'], 'Sorelle Ricci', '1888-02-03', '1888-03-30', 310],
    [8, idOf['Naturalis Historia'], 'Sorelle Ricci', '1890-10-11', '1890-12-20', 260],
    [9, idOf['Bestiario miniato'], 'Bottega Lanzi', '1891-01-07', '1891-02-28', 520],
    [10, idOf['Summa Theologiae'], 'Sorelle Ricci', '1891-06-04', '1891-07-01', 95]
  ];

  // --- Registro degli accessi ----------------------------------------------
  const accessiRaw = [];
  for (let i = 0; i < 46; i++) {
    const day = between(1, 30);
    const h = between(9, 17), m = between(0, 11) * 5;
    const dur = between(15, 150);
    const sala = between(1, 5);
    const vis = between(1, 16);
    const inT = Date.UTC(1891, 9, day, h, m);
    const outT = new Date(inT + dur * 60000);
    const t = (d) => `${fmt(d)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    accessiRaw.push([vis, sala, t(new Date(inT)), t(outT)]);
  }
  accessiRaw.push(
    [2, 4, '1891-10-31 21:00', '1891-10-31 21:40'],
    [9, 2, '1891-10-31 22:10', '1891-10-31 23:20'],
    [7, 4, '1891-10-31 22:40', '1891-10-31 23:10'],
    [1, 2, '1891-10-31 23:00', '1891-11-01 01:05'],
    [5, 4, '1891-10-31 23:52', '1891-11-01 00:31'],
    [1, 4, '1891-11-01 01:15', '1891-11-01 01:40'],
    [12, 1, '1891-11-01 09:30', '1891-11-01 10:15']
  );
  accessiRaw.sort((a, b) => a[2].localeCompare(b[2]));
  const accessi = accessiRaw.map((a, i) => [i + 1].concat(a));

  // --- Schede provvisorie (da riordinare) ----------------------------------
  const schede = [
    [1, 'Canti', 'G. Leopardi', 'copia doppia, rilegatura in pelle'],
    [2, 'Le confessioni di un italiano', 'I. Nievo', 'dono della famiglia Ferri'],
    [3, 'Faust', 'J. W. Goethe', 'scheda duplicata per errore'],
    [4, 'Il cortegiano', 'B. Castiglione', 'in attesa di rilegatura'],
    [5, 'Il Saggiatore', 'G. Galilei', 'già a scaffale?'],
    [6, 'Arcadia', 'J. Sannazaro', 'arrivato con la cassa di Venezia'],
    [7, 'Candido', 'Voltaire', 'scheda illeggibile, riscritta'],
    [8, 'Rime di Michelangelo', 'M. Buonarroti', 'edizione del 1623']
  ];

  // --- Il registro segreto di Aurelio -------------------------------------
  const segreto = [
    [1, 'A chi legge queste righe: se sei arrivato fin qui, sei un vero Archivista. Ogni archivio ha una stanza che non compare nel catalogo.'],
    [2, 'Il Codex Umbrae non è mai stato solo un libro: le sue pagine contengono l\'indice di tutti i saperi perduti di Ombravalle.'],
    [3, 'Sapevo che Bartolomeo Grifi lo cercava da anni. Ho lasciato che lo prendesse: ciò che ha rubato è una copia, fedele in ogni miniatura.'],
    [4, 'L\'originale riposa dove nessun visitatore guarda mai: nel Laboratorio di Restauro, scaffale R-01, dietro il terzo mattone.'],
    [5, 'Ti lascio le chiavi, l\'inchiostro e il silenzio. Custodiscili bene. — Aurelio Vannucci, Archivista Maggiore']
  ];

  const sql = [
    'PRAGMA foreign_keys = OFF;',
    schema,
    insert('sale', ['id', 'nome', 'piano', 'descrizione'], sale),
    insert('scaffali', ['id', 'codice', 'sala_id', 'capienza'], scaffali),
    insert('autori', ['id', 'nome', 'nazione', 'nascita', 'morte'], autori),
    insert('volumi', ['id', 'titolo', 'autore_id', 'anno', 'genere', 'lingua', 'pagine', 'scaffale_id', 'stato', 'valore'], volumi),
    insert('visitatori', ['id', 'nome', 'professione', 'citta', 'iscrizione'], visitatori),
    insert('prestiti', ['id', 'volume_id', 'visitatore_id', 'data_prestito', 'data_restituzione'], prestiti),
    insert('restauri', ['id', 'volume_id', 'restauratore', 'data_inizio', 'data_fine', 'costo'], restauri),
    insert('registro_accessi', ['id', 'visitatore_id', 'sala_id', 'ingresso', 'uscita'], accessi),
    insert('schede_provvisorie', ['id', 'titolo', 'autore', 'nota'], schede),
    insert('registro_segreto', ['pagina', 'messaggio'], segreto)
  ].join('\n');

  window.ARCHIVE_SEED_SQL = sql;
  window.ARCHIVE_HIDDEN_TABLES = ['registro_segreto'];

  // Breve descrizione delle tabelle, mostrata nello Schedario
  window.ARCHIVE_TABLE_NOTES = {
    sale: 'Le stanze dell\'archivio',
    scaffali: 'Ogni scaffale appartiene a una sala',
    autori: 'Chi ha scritto i volumi',
    volumi: 'Il cuore del catalogo',
    visitatori: 'Studiosi iscritti al registro',
    prestiti: 'Chi ha preso cosa, e quando',
    restauri: 'Lavori sui volumi danneggiati',
    registro_accessi: 'Ingressi e uscite dalle sale',
    schede_provvisorie: 'Schede da riordinare',
    registro_segreto: 'Le pagine nascoste di Aurelio',
    preziosi: 'L\'indice dei volumi preziosi'
  };
})();
