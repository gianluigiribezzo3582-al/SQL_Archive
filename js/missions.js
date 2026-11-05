/* ==========================================================================
   SQL Archive — Capitoli e missioni
   check: 'result' -> confronta il risultato della query con quello della soluzione
   check: 'state'  -> esegue la soluzione su una copia dell'archivio e confronta
                      il risultato della query di verifica (verify)
   ordered: true   -> anche l'ordine delle righe conta
   ========================================================================== */
(function () {
  'use strict';

  const chapters = [
    {
      id: 1, roman: 'I', title: 'La chiave dell\'archivio',
      intro: 'Il portone di Ombravalle cigola. Dentro, polvere e silenzio. Prima di tutto, impara a guardare.',
      outro: 'Hai imparato a leggere il catalogo. Ma tra le schede, una manca all\'appello…'
    },
    {
      id: 2, roman: 'II', title: 'Polvere e indici',
      intro: 'Il catalogo è immenso. Un buon archivista sa filtrare: cerca solo ciò che serve.',
      outro: 'I filtri non hanno segreti per te. Il notaio Ferri ti chiede ora di fare i conti.'
    },
    {
      id: 3, roman: 'III', title: 'Il conto dei tomi',
      intro: 'Il Consiglio cittadino vuole numeri: quanti volumi, quanto valgono, quanto costano i restauri.',
      outro: 'I conti tornano… quasi. Il valore del Codex Umbrae compare nel registro, ma il volume no.'
    },
    {
      id: 4, roman: 'IV', title: 'Fili che legano',
      intro: 'Le tabelle dell\'archivio parlano tra loro attraverso i loro identificativi. Impara a unirle.',
      outro: 'Ora vedi i fili che legano volumi, scaffali e persone. È tempo di rimettere ordine.'
    },
    {
      id: 5, roman: 'V', title: 'Riordinare la biblioteca',
      intro: 'Una cassa arrivata da Venezia, volumi da mandare in restauro, schede doppie: tocca a te modificare il catalogo.',
      outro: 'La biblioteca è in ordine. Ora puoi concentrarti sul mistero che tutti, qui, fingono di ignorare.'
    },
    {
      id: 6, roman: 'VI', title: 'Il mistero del Codex Umbrae',
      intro: 'Nella notte tra il 31 ottobre e il 1° novembre 1891 il Codex Umbrae è sparito. Il custode giura di averlo visto al suo posto alle 23:30.',
      outro: 'Il colpevole ha un nome. Ma nel diario di Aurelio c\'è ancora una pagina che non torna…'
    },
    {
      id: 7, roman: 'VII', title: 'La stanza nascosta',
      intro: '«Ogni archivio ha una stanza che non compare nel catalogo», scriveva Aurelio. Trovala.',
      outro: 'Il cerchio si chiude. L\'Archivio di Ombravalle ha un nuovo custode.'
    }
  ];

  const missions = [
    // ---------------------------------------------------------------- Cap. I
    {
      id: 1, chapter: 1, title: 'Il primo sguardo', concept: 'SELECT *',
      story: 'Eccoti, {nome}. Il vecchio archivista, Maestro Aurelio Vannucci, è scomparso pochi giorni fa lasciando le chiavi sulla scrivania. Prima di tutto, fai il giro delle stanze.',
      task: 'Mostra <b>tutte le colonne</b> di <b>tutte le sale</b> dell\'archivio (tabella <code>sale</code>).',
      solution: 'SELECT * FROM sale;',
      hints: ['L\'asterisco <code>*</code> significa «tutte le colonne».', 'La forma è <code>SELECT * FROM nome_tabella;</code>'],
      check: 'result'
    },
    {
      id: 2, chapter: 1, title: 'Titoli e date', concept: 'SELECT colonne',
      story: 'Sulla scrivania di Aurelio c\'è un foglio: «Prima regola: non leggere tutto. Leggi solo ciò che serve».',
      task: 'Elenca solo il <b>titolo</b> e l\'<b>anno</b> di tutti i volumi (tabella <code>volumi</code>).',
      solution: 'SELECT titolo, anno FROM volumi;',
      hints: ['Al posto di <code>*</code> scrivi i nomi delle colonne separati da una virgola.', '<code>SELECT titolo, anno FROM …</code>'],
      check: 'result'
    },
    {
      id: 3, chapter: 1, title: 'La sala dei versi', concept: 'WHERE',
      story: 'Caterina Sforzini, poetessa milanese, chiede quali opere di poesia possieda l\'archivio.',
      task: 'Mostra <b>tutte le colonne</b> dei volumi il cui <code>genere</code> è <code>\'Poesia\'</code>.',
      solution: "SELECT * FROM volumi WHERE genere = 'Poesia';",
      hints: ['Le condizioni si scrivono dopo <code>WHERE</code>.', 'I testi vanno tra apici singoli: <code>WHERE genere = \'Poesia\'</code>'],
      check: 'result'
    },
    {
      id: 4, chapter: 1, title: 'L\'ordine dei secoli', concept: 'ORDER BY',
      story: 'Aurelio teneva gli autori in ordine cronologico, dal più antico al più recente. Qualcuno ha mescolato le schede.',
      task: 'Elenca <b>nome</b> e <b>nascita</b> di tutti gli autori, ordinati per anno di nascita <b>crescente</b>.',
      solution: 'SELECT nome, nascita FROM autori ORDER BY nascita;',
      hints: ['Usa <code>ORDER BY colonna</code> alla fine della query.', 'L\'ordine crescente è quello predefinito (<code>ASC</code>). Gli anni negativi sono a.C.'],
      check: 'result', ordered: true
    },
    {
      id: 5, chapter: 1, title: 'I più antichi', concept: 'LIMIT',
      story: 'Il Consiglio cittadino vuole esporre in vetrina i cinque volumi più antichi dell\'archivio.',
      task: 'Mostra <b>titolo</b> e <b>anno</b> dei <b>5 volumi più antichi</b>, dal più antico.',
      solution: 'SELECT titolo, anno FROM volumi ORDER BY anno LIMIT 5;',
      hints: ['Prima ordina per anno, poi taglia il risultato.', '<code>… ORDER BY anno LIMIT 5;</code>'],
      check: 'result', ordered: true
    },

    // --------------------------------------------------------------- Cap. II
    {
      id: 6, chapter: 2, title: 'Tomi in latino', concept: 'AND',
      story: 'Padre Anselmo Rubei cerca letture impegnative: volumi in latino, e che siano corposi.',
      task: 'Mostra <b>titolo</b> e <b>pagine</b> dei volumi in lingua <code>\'Latino\'</code> con <b>più di 300 pagine</b>.',
      solution: "SELECT titolo, pagine FROM volumi WHERE lingua = 'Latino' AND pagine > 300;",
      hints: ['Due condizioni che devono essere vere insieme si uniscono con <code>AND</code>.', '<code>WHERE lingua = \'Latino\' AND pagine &gt; 300</code>'],
      check: 'result'
    },
    {
      id: 7, chapter: 2, title: 'Un titolo a metà', concept: 'LIKE',
      story: 'La studiosa Rosalia Monti ricorda solo che il titolo conteneva la parola «storia». Non sa dove, né se maiuscola.',
      task: 'Mostra il <b>titolo</b> dei volumi il cui titolo <b>contiene</b> «storia».',
      solution: "SELECT titolo FROM volumi WHERE titolo LIKE '%storia%';",
      hints: ['<code>LIKE</code> confronta con un modello: <code>%</code> vale «qualsiasi sequenza di caratteri».', '<code>WHERE titolo LIKE \'%storia%\'</code> (in SQLite LIKE ignora maiuscole/minuscole).'],
      check: 'result'
    },
    {
      id: 8, chapter: 2, title: 'Il secolo d\'oro', concept: 'BETWEEN',
      story: 'Il Cinquecento è il secolo preferito di Aurelio: ne parlava come di «un\'età in cui la carta profumava di inchiostro nuovo».',
      task: 'Mostra <b>titolo</b> e <b>anno</b> dei volumi pubblicati <b>dal 1500 al 1599</b> (estremi inclusi).',
      solution: 'SELECT titolo, anno FROM volumi WHERE anno BETWEEN 1500 AND 1599;',
      hints: ['<code>BETWEEN a AND b</code> include entrambi gli estremi.', '<code>WHERE anno BETWEEN 1500 AND 1599</code>'],
      check: 'result'
    },
    {
      id: 9, chapter: 2, title: 'Promesse mancate', concept: 'IS NULL',
      story: 'Alcuni visitatori hanno preso libri e non li hanno mai riportati. Nel registro, la data di restituzione è rimasta vuota.',
      task: 'Mostra <b>tutte le colonne</b> dei prestiti in cui <code>data_restituzione</code> è <b>vuota</b> (NULL).',
      solution: 'SELECT * FROM prestiti WHERE data_restituzione IS NULL;',
      hints: ['NULL non si confronta con <code>=</code>: serve un operatore speciale.', '<code>WHERE data_restituzione IS NULL</code>'],
      check: 'result'
    },
    {
      id: 10, chapter: 2, title: 'Le lingue dell\'archivio', concept: 'DISTINCT',
      story: 'Il tipografo Moro vuole stampare un cartello con tutte le lingue presenti nell\'archivio, ciascuna una sola volta.',
      task: 'Elenca le <b>lingue</b> dei volumi, <b>senza ripetizioni</b>.',
      solution: 'SELECT DISTINCT lingua FROM volumi;',
      hints: ['C\'è una parola chiave che elimina i duplicati.', '<code>SELECT DISTINCT lingua FROM volumi;</code>'],
      check: 'result'
    },
    {
      id: 11, chapter: 2, title: 'Gli antichi', concept: 'IN',
      story: 'Nella Torre dei Filosofi vuoi riunire gli autori del mondo classico.',
      task: 'Mostra <b>nome</b> e <b>nazione</b> degli autori la cui nazione è <code>\'Grecia\'</code> oppure <code>\'Roma\'</code>, usando <code>IN</code>.',
      solution: "SELECT nome, nazione FROM autori WHERE nazione IN ('Grecia', 'Roma');",
      hints: ['<code>IN (…)</code> verifica se un valore appartiene a un elenco.', '<code>WHERE nazione IN (\'Grecia\', \'Roma\')</code>'],
      check: 'result'
    },

    // -------------------------------------------------------------- Cap. III
    {
      id: 12, chapter: 3, title: 'Quanti siamo?', concept: 'COUNT',
      story: 'Il notaio Annibale Ferri deve redigere l\'inventario ufficiale. Prima domanda: quanti volumi ci sono?',
      task: 'Conta il <b>numero totale</b> di volumi.',
      solution: 'SELECT COUNT(*) FROM volumi;',
      hints: ['Le funzioni di aggregazione riassumono molte righe in una.', '<code>SELECT COUNT(*) FROM volumi;</code>'],
      check: 'result'
    },
    {
      id: 13, chapter: 3, title: 'Volumi per genere', concept: 'GROUP BY',
      story: '«E per genere?», chiede il notaio, intingendo la penna.',
      task: 'Per ogni <b>genere</b>, mostra il genere e il <b>numero di volumi</b>.',
      solution: 'SELECT genere, COUNT(*) FROM volumi GROUP BY genere;',
      hints: ['<code>GROUP BY</code> raggruppa le righe con lo stesso valore.', '<code>SELECT genere, COUNT(*) FROM volumi GROUP BY genere;</code>'],
      check: 'result'
    },
    {
      id: 14, chapter: 3, title: 'Il peso delle lingue', concept: 'AVG · ROUND',
      story: 'Margherita Lunardi, studentessa, sostiene che i libri in latino siano sempre i più lunghi. Verifichiamo.',
      task: 'Per ogni <b>lingua</b>, mostra la lingua e la <b>media delle pagine</b> arrotondata all\'intero con <code>ROUND</code>.',
      solution: 'SELECT lingua, ROUND(AVG(pagine)) FROM volumi GROUP BY lingua;',
      hints: ['<code>AVG(colonna)</code> calcola la media; <code>ROUND(x)</code> arrotonda.', '<code>SELECT lingua, ROUND(AVG(pagine)) FROM volumi GROUP BY lingua;</code>'],
      check: 'result'
    },
    {
      id: 15, chapter: 3, title: 'Il più prezioso', concept: 'MAX · ORDER BY DESC',
      story: 'Ferri si ferma a metà inventario: «Qual è il volume di maggior valore? Voglio vederlo con i miei occhi».',
      task: 'Mostra <b>titolo</b> e <b>valore</b> del volume con il <b>valore più alto</b> (una sola riga).',
      solution: 'SELECT titolo, valore FROM volumi ORDER BY valore DESC LIMIT 1;',
      hints: ['Ordina dal più grande al più piccolo con <code>DESC</code> e tieni solo la prima riga.', 'In alternativa: <code>WHERE valore = (SELECT MAX(valore) FROM volumi)</code>'],
      check: 'result'
    },
    {
      id: 16, chapter: 3, title: 'Autori prolifici', concept: 'HAVING',
      story: 'Per ottimizzare gli scaffali vuoi sapere quali autori occupano più spazio.',
      task: 'Mostra <b>autore_id</b> e <b>numero di volumi</b> per gli autori con <b>più di 3 volumi</b>.',
      solution: 'SELECT autore_id, COUNT(*) FROM volumi GROUP BY autore_id HAVING COUNT(*) > 3;',
      hints: ['<code>WHERE</code> filtra le righe; per filtrare i gruppi serve <code>HAVING</code>.', '<code>… GROUP BY autore_id HAVING COUNT(*) &gt; 3;</code>'],
      check: 'result'
    },
    {
      id: 17, chapter: 3, title: 'Il conto del restauro', concept: 'SUM',
      story: 'Le fatture dei restauratori si sono accumulate sulla scrivania. Il Consiglio vuole sapere quanto ha speso con ciascuno.',
      task: 'Per ogni <b>restauratore</b>, mostra il nome e la <b>somma</b> dei costi (tabella <code>restauri</code>).',
      solution: 'SELECT restauratore, SUM(costo) FROM restauri GROUP BY restauratore;',
      hints: ['<code>SUM(colonna)</code> somma i valori di un gruppo.', '<code>SELECT restauratore, SUM(costo) FROM restauri GROUP BY restauratore;</code>'],
      check: 'result'
    },

    // --------------------------------------------------------------- Cap. IV
    {
      id: 18, chapter: 4, title: 'Il nome dietro il numero', concept: 'JOIN',
      story: 'Nei volumi l\'autore è solo un numero (<code>autore_id</code>). I visitatori, però, vogliono leggere nomi.',
      task: 'Mostra il <b>titolo</b> di ogni volume insieme al <b>nome</b> del suo autore.',
      solution: 'SELECT v.titolo, a.nome FROM volumi v JOIN autori a ON v.autore_id = a.id;',
      hints: ['<code>JOIN … ON …</code> unisce due tabelle collegando le colonne corrispondenti.', '<code>FROM volumi v JOIN autori a ON v.autore_id = a.id</code>'],
      check: 'result'
    },
    {
      id: 19, chapter: 4, title: 'Dov\'è l\'Orlando?', concept: 'JOIN multipli',
      story: 'La pittrice Elena Castaldi vuole copiare le illustrazioni dell\'«Orlando furioso». In che sala si trova?',
      task: 'Mostra <b>titolo</b>, <b>codice</b> dello scaffale e <b>nome</b> della sala del volume <code>\'Orlando furioso\'</code>.',
      solution: "SELECT v.titolo, sc.codice, s.nome FROM volumi v JOIN scaffali sc ON v.scaffale_id = sc.id JOIN sale s ON sc.sala_id = s.id WHERE v.titolo = 'Orlando furioso';",
      hints: ['Il percorso è volumi → scaffali → sale: servono due JOIN.', '<code>… JOIN scaffali sc ON v.scaffale_id = sc.id JOIN sale s ON sc.sala_id = s.id WHERE v.titolo = \'Orlando furioso\'</code>'],
      check: 'result'
    },
    {
      id: 20, chapter: 4, title: 'Autori senza libri', concept: 'LEFT JOIN',
      story: 'Nello schedario degli autori ci sono nomi illustri di cui l\'archivio non possiede nemmeno un volume. Aurelio li chiamava «i fantasmi».',
      task: 'Mostra il <b>nome</b> degli autori che <b>non hanno alcun volume</b> nell\'archivio.',
      solution: 'SELECT a.nome FROM autori a LEFT JOIN volumi v ON v.autore_id = a.id WHERE v.id IS NULL;',
      hints: ['<code>LEFT JOIN</code> tiene tutte le righe della tabella di sinistra, anche senza corrispondenza.', 'Dove non c\'è corrispondenza, le colonne di destra sono NULL: <code>WHERE v.id IS NULL</code>'],
      check: 'result'
    },
    {
      id: 21, chapter: 4, title: 'I lettori più assidui', concept: 'JOIN + GROUP BY',
      story: 'Vuoi premiare i lettori più fedeli con un segnalibro di cuoio.',
      task: 'Per ogni visitatore che ha fatto prestiti, mostra il <b>nome</b> e il <b>numero di prestiti</b>, dal più assiduo al meno assiduo.',
      solution: 'SELECT vi.nome, COUNT(*) AS prestiti FROM visitatori vi JOIN prestiti p ON p.visitatore_id = vi.id GROUP BY vi.id ORDER BY prestiti DESC;',
      hints: ['Unisci <code>visitatori</code> e <code>prestiti</code>, poi raggruppa per visitatore.', '<code>… GROUP BY vi.id ORDER BY COUNT(*) DESC;</code>'],
      check: 'result'
    },
    {
      id: 22, chapter: 4, title: 'Il tesoro di ogni sala', concept: 'JOIN + SUM',
      story: 'L\'assicurazione vuole sapere quanto vale il contenuto di ciascuna sala.',
      task: 'Per ogni sala, mostra il <b>nome</b> della sala e la <b>somma del valore</b> dei volumi che contiene.',
      solution: 'SELECT s.nome, SUM(v.valore) FROM sale s JOIN scaffali sc ON sc.sala_id = s.id JOIN volumi v ON v.scaffale_id = sc.id GROUP BY s.id;',
      hints: ['Percorso: sale → scaffali → volumi. Poi raggruppa per sala.', '<code>SELECT s.nome, SUM(v.valore) FROM sale s JOIN scaffali sc ON … JOIN volumi v ON … GROUP BY s.id;</code>'],
      check: 'result'
    },

    // ---------------------------------------------------------------- Cap. V
    {
      id: 23, chapter: 5, title: 'La cassa da Venezia', concept: 'INSERT',
      story: 'È arrivata una cassa da Venezia: dentro, una copia delle «Ultime lettere di Jacopo Ortis». Va catalogata.',
      task: 'Inserisci in <code>volumi</code> un volume con: titolo <code>\'Ultime lettere di Jacopo Ortis\'</code>, autore_id <code>25</code>, anno <code>1802</code>, genere <code>\'Narrativa\'</code>, lingua <code>\'Italiano\'</code>, pagine <code>240</code>, scaffale_id <code>2</code>, stato <code>\'integro\'</code>, valore <code>770</code>. L\'<code>id</code> lascialo assegnare all\'archivio.',
      solution: "INSERT INTO volumi (titolo, autore_id, anno, genere, lingua, pagine, scaffale_id, stato, valore) VALUES ('Ultime lettere di Jacopo Ortis', 25, 1802, 'Narrativa', 'Italiano', 240, 2, 'integro', 770);",
      verify: "SELECT titolo, autore_id, anno, genere, lingua, pagine, scaffale_id, stato, valore FROM volumi WHERE titolo LIKE '%Jacopo Ortis%';",
      hints: ['<code>INSERT INTO tabella (colonne…) VALUES (valori…);</code>', 'Elenca le 9 colonne nello stesso ordine dei 9 valori; i testi tra apici.'],
      check: 'state'
    },
    {
      id: 24, chapter: 5, title: 'In convalescenza', concept: 'UPDATE',
      story: 'Gaspare Tornielli, il restauratore, ha spazio nel laboratorio. Vuole tutti i volumi danneggiati più antichi del 1600.',
      task: 'Imposta <code>stato = \'restauro\'</code> per tutti i volumi con stato <code>\'danneggiato\'</code> e <b>anno minore di 1600</b>.',
      solution: "UPDATE volumi SET stato = 'restauro' WHERE stato = 'danneggiato' AND anno < 1600;",
      verify: 'SELECT id, stato FROM volumi ORDER BY id;',
      hints: ['<code>UPDATE tabella SET colonna = valore WHERE condizione;</code>', 'Senza <code>WHERE</code> modificheresti tutti i volumi! Usa due condizioni con <code>AND</code>.'],
      check: 'state'
    },
    {
      id: 25, chapter: 5, title: 'Il professore restituisce', concept: 'UPDATE con NULL',
      story: 'Il Prof. Livio Ceccarelli (visitatore n. 3) si presenta con una borsa di libri: restituisce tutto ciò che aveva ancora in prestito.',
      task: 'Per i prestiti del visitatore <code>3</code> ancora aperti, imposta <code>data_restituzione = \'1891-11-05\'</code>.',
      solution: "UPDATE prestiti SET data_restituzione = '1891-11-05' WHERE visitatore_id = 3 AND data_restituzione IS NULL;",
      verify: 'SELECT id, visitatore_id, data_restituzione FROM prestiti ORDER BY id;',
      hints: ['Un prestito «aperto» ha <code>data_restituzione IS NULL</code>.', 'Non toccare i prestiti già restituiti: le loro date devono restare quelle originali.'],
      check: 'state'
    },
    {
      id: 26, chapter: 5, title: 'Schede doppie', concept: 'DELETE + sottoquery',
      story: 'Nella cassetta delle <code>schede_provvisorie</code> ci sono schede di libri che sono già a catalogo. Vanno eliminate.',
      task: 'Elimina da <code>schede_provvisorie</code> le schede il cui <b>titolo è già presente</b> nella tabella <code>volumi</code>.',
      solution: 'DELETE FROM schede_provvisorie WHERE titolo IN (SELECT titolo FROM volumi);',
      verify: 'SELECT * FROM schede_provvisorie ORDER BY id;',
      hints: ['Una sottoquery può fornire l\'elenco per <code>IN</code>.', '<code>DELETE FROM schede_provvisorie WHERE titolo IN (SELECT titolo FROM volumi);</code>'],
      check: 'state'
    },
    {
      id: 27, chapter: 5, title: 'L\'indice dei preziosi', concept: 'CREATE TABLE AS',
      story: 'L\'assicuratore pretende un registro separato con i volumi di grande valore, da tenere in cassaforte.',
      task: 'Crea una nuova tabella <code>preziosi</code> con le colonne <b>id</b>, <b>titolo</b> e <b>valore</b> dei volumi con <b>valore di almeno 5000</b>.',
      solution: 'DROP TABLE IF EXISTS preziosi; CREATE TABLE preziosi AS SELECT id, titolo, valore FROM volumi WHERE valore >= 5000;',
      verify: 'SELECT id, titolo, valore FROM preziosi ORDER BY id;',
      hints: ['Si può creare una tabella direttamente dal risultato di una query: <code>CREATE TABLE nome AS SELECT …</code>', 'Se la tabella esiste già da un tentativo precedente, eliminala prima con <code>DROP TABLE preziosi;</code>'],
      check: 'state'
    },

    // --------------------------------------------------------------- Cap. VI
    {
      id: 28, chapter: 6, title: 'Sopra la media', concept: 'Sottoquery',
      story: 'Prima di indagare, vuoi sapere quali volumi farebbero gola a un ladro: quelli che valgono più della media.',
      task: 'Mostra <b>titolo</b> e <b>valore</b> dei volumi con valore <b>superiore alla media</b> di tutti i volumi.',
      solution: 'SELECT titolo, valore FROM volumi WHERE valore > (SELECT AVG(valore) FROM volumi);',
      hints: ['Una query tra parentesi può restituire un singolo valore da usare in un confronto.', '<code>WHERE valore &gt; (SELECT AVG(valore) FROM volumi)</code>'],
      check: 'result'
    },
    {
      id: 29, chapter: 6, title: 'Lo scaffale vuoto', concept: 'Indagine · JOIN',
      story: 'Nel catalogo il Codex Umbrae risulta «smarrito». Devi sapere esattamente dove avrebbe dovuto trovarsi.',
      task: 'Mostra <b>titolo</b>, <b>stato</b>, <b>codice</b> dello scaffale e <b>nome</b> della sala del volume <code>\'Codex Umbrae\'</code>.',
      solution: "SELECT v.titolo, v.stato, sc.codice, s.nome FROM volumi v JOIN scaffali sc ON v.scaffale_id = sc.id JOIN sale s ON sc.sala_id = s.id WHERE v.titolo = 'Codex Umbrae';",
      hints: ['È come la missione dell\'Orlando, con una colonna in più.', 'volumi → scaffali → sale, filtrando per titolo.'],
      check: 'result'
    },
    {
      id: 30, chapter: 6, title: 'Le ultime mani', concept: 'Indagine · JOIN + ORDER BY',
      story: 'Chi ha avuto il Codex tra le mani negli ultimi mesi? Il registro dei prestiti non mente.',
      task: 'Mostra <b>nome</b> del visitatore, <b>data_prestito</b> e <b>data_restituzione</b> di tutti i prestiti del <code>\'Codex Umbrae\'</code>, in ordine di <b>data di prestito</b>.',
      solution: "SELECT vi.nome, p.data_prestito, p.data_restituzione FROM prestiti p JOIN visitatori vi ON p.visitatore_id = vi.id JOIN volumi v ON p.volume_id = v.id WHERE v.titolo = 'Codex Umbrae' ORDER BY p.data_prestito;",
      hints: ['Servono tre tabelle: prestiti, visitatori e volumi.', 'Le date sono testi nel formato AAAA-MM-GG, quindi si ordinano correttamente.'],
      check: 'result', ordered: true
    },
    {
      id: 31, chapter: 6, title: 'La notte di Ognissanti', concept: 'Indagine · filtri su date',
      story: 'Il Codex era al suo posto alle 23:30 del 31 ottobre 1891. All\'alba non c\'era più. Il registro degli accessi alla Sala dei Codici (sala n. 4) ricorda chi è sceso nella cripta.',
      task: 'Mostra <b>nome</b> del visitatore, <b>ingresso</b> e <b>uscita</b> degli accessi alla sala <code>4</code> con ingresso <b>tra \'1891-10-31 23:30\' e \'1891-11-01 06:00\'</b>, in ordine di ingresso.',
      solution: "SELECT vi.nome, ra.ingresso, ra.uscita FROM registro_accessi ra JOIN visitatori vi ON ra.visitatore_id = vi.id WHERE ra.sala_id = 4 AND ra.ingresso BETWEEN '1891-10-31 23:30' AND '1891-11-01 06:00' ORDER BY ra.ingresso;",
      hints: ['Le date con ora sono testi \'AAAA-MM-GG HH:MM\': <code>BETWEEN</code> funziona anche su di loro.', 'Unisci <code>registro_accessi</code> con <code>visitatori</code> e filtra per <code>sala_id = 4</code>.'],
      check: 'result', ordered: true
    },
    {
      id: 32, chapter: 6, title: 'Il colpevole', concept: 'Indagine · CTE / JOIN complessi',
      story: 'Due sospetti, una sola verità. Il custode ricorda un dettaglio: «Il ladro aveva ancora in prestito, mai restituito, un altro volume della Sala dei Codici. Usava quella scusa per scendere».',
      task: 'Trova il <b>nome</b> del visitatore che è entrato nella sala 4 in quella fascia oraria <b>e</b> ha un prestito <b>non restituito</b> di un volume collocato in uno scaffale della <b>sala 4</b>.',
      solution: "WITH sospetti AS (SELECT visitatore_id FROM registro_accessi WHERE sala_id = 4 AND ingresso BETWEEN '1891-10-31 23:30' AND '1891-11-01 06:00') SELECT DISTINCT vi.nome FROM visitatori vi JOIN prestiti p ON p.visitatore_id = vi.id JOIN volumi v ON p.volume_id = v.id JOIN scaffali sc ON v.scaffale_id = sc.id WHERE vi.id IN (SELECT visitatore_id FROM sospetti) AND p.data_restituzione IS NULL AND sc.sala_id = 4;",
      hints: ['Con <code>WITH sospetti AS (…)</code> puoi dare un nome alla lista dei sospetti e riusarla.', 'Poi: visitatori → prestiti → volumi → scaffali, con <code>data_restituzione IS NULL</code> e <code>sc.sala_id = 4</code>. Usa <code>DISTINCT</code>.'],
      check: 'result'
    },

    // -------------------------------------------------------------- Cap. VII
    {
      id: 33, chapter: 7, title: 'Il re di ogni sala', concept: 'Funzioni finestra',
      story: 'Nel diario di Aurelio: «L\'ultima chiave è nascosta sotto il volume più prezioso di ogni sala». Ti serve un elenco preciso.',
      task: 'Per <b>ogni sala</b>, mostra <b>nome della sala</b>, <b>titolo</b> e <b>valore</b> del volume <b>più prezioso</b> che contiene.',
      solution: 'WITH r AS (SELECT s.nome AS sala, v.titolo, v.valore, ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY v.valore DESC) AS rn FROM sale s JOIN scaffali sc ON sc.sala_id = s.id JOIN volumi v ON v.scaffale_id = sc.id) SELECT sala, titolo, valore FROM r WHERE rn = 1;',
      hints: ['<code>ROW_NUMBER() OVER (PARTITION BY … ORDER BY …)</code> numera le righe all\'interno di ogni gruppo.', 'Calcola il numero di riga per sala ordinando per valore decrescente, poi tieni solo <code>rn = 1</code>.'],
      check: 'result'
    },
    {
      id: 34, chapter: 7, title: 'La stanza fuori catalogo', concept: 'sqlite_master',
      story: 'Il volume più prezioso della Sala dei Codici è proprio il Codex scomparso. Sul suo scaffale vuoto, però, trovi un biglietto: «Il catalogo dei cataloghi si chiama sqlite_master. Chiedigli quali tabelle esistono davvero».',
      task: 'Elenca il <b>nome</b> (<code>name</code>) di tutte le tabelle presenti in <code>sqlite_master</code> (quelle con <code>type = \'table\'</code>).',
      solution: "SELECT name FROM sqlite_master WHERE type = 'table';",
      hints: ['<code>sqlite_master</code> è una tabella speciale che descrive il database stesso.', '<code>SELECT name FROM sqlite_master WHERE type = \'table\';</code>'],
      check: 'result'
    },
    {
      id: 35, chapter: 7, title: 'Le ultime parole di Aurelio', concept: 'Gran finale',
      story: 'C\'è una tabella che non compariva nello Schedario: <code>registro_segreto</code>. Le pagine sono numerate.',
      task: 'Leggi il <b>messaggio</b> di tutte le pagine di <code>registro_segreto</code>, in ordine di <b>pagina</b>.',
      solution: 'SELECT messaggio FROM registro_segreto ORDER BY pagina;',
      hints: ['È una semplice SELECT con ordinamento.', '<code>SELECT messaggio FROM registro_segreto ORDER BY pagina;</code>'],
      check: 'result', ordered: true
    }
  ];

  const ranks = [
    { xp: 0, name: 'Apprendista', seal: 'I' },
    { xp: 300, name: 'Copista', seal: 'II' },
    { xp: 800, name: 'Scrivano', seal: 'III' },
    { xp: 1500, name: 'Archivista', seal: 'IV' },
    { xp: 2300, name: 'Bibliotecario Maggiore', seal: 'V' },
    { xp: 3000, name: 'Custode del Codex', seal: 'VI' }
  ];

  window.ARCHIVE_CHAPTERS = chapters;
  window.ARCHIVE_MISSIONS = missions;
  window.ARCHIVE_RANKS = ranks;
})();
