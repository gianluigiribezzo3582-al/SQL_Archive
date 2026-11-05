/* ==========================================================================
   SQL Archive — logica dell'applicazione
   ========================================================================== */
(function () {
  'use strict';

  const MISSIONS = window.ARCHIVE_MISSIONS;
  const CHAPTERS = window.ARCHIVE_CHAPTERS;
  const RANKS = window.ARCHIVE_RANKS;
  const HIDDEN = window.ARCHIVE_HIDDEN_TABLES || [];
  const NOTES = window.ARCHIVE_TABLE_NOTES || {};
  const CONFIG = window.SQL_ARCHIVE_CONFIG || {};
  const DATA_VERSION = '1';
  const SECRET_UNLOCK_MISSION = 34;

  const XP_BASE = 100, XP_HINT = 20, XP_SOLUTION = 60, XP_MIN = 20;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------------------------------------------------------------- storage
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem('sqlarchive.' + k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(k, v) { try { localStorage.setItem('sqlarchive.' + k, JSON.stringify(v)); } catch (e) { /* storage non disponibile */ } },
    raw(k, v) {
      try {
        if (v === undefined) return localStorage.getItem('sqlarchive.' + k);
        localStorage.setItem('sqlarchive.' + k, v);
      } catch (e) { return null; }
    },
    del(k) { try { localStorage.removeItem('sqlarchive.' + k); } catch (e) { /* noop */ } }
  };

  const state = Object.assign({
    name: '',
    current: 1,          // id missione corrente, 0 = sala libera
    completed: {},       // id -> { xp, perfect, at }
    hints: {},           // id -> numero di suggerimenti visti
    solutions: {},       // id -> true se la soluzione è stata svelata
    drafts: {},          // id -> testo nel calamaio
    history: [],         // ultime query
    finaleSeen: false
  }, store.get('state', {}));
  const save = () => store.set('state', state);

  // ---------------------------------------------------------------- database
  let SQL = null;
  let db = null;
  let baseline = null;    // copia dell'archivio all'inizio di una missione «di modifica»

  function freshDb() {
    const d = new SQL.Database();
    d.run(window.ARCHIVE_SEED_SQL);
    return d;
  }

  function toBase64(u8) {
    let s = '';
    const chunk = 0x8000;
    for (let i = 0; i < u8.length; i += chunk) s += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
    return btoa(s);
  }
  function fromBase64(b64) {
    const s = atob(b64);
    const u8 = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return u8;
  }
  function persistDb() {
    try {
      store.raw('db', toBase64(db.export()));
      store.raw('dbv', DATA_VERSION);
    } catch (e) { /* quota superata o storage bloccato: pazienza */ }
  }
  function loadDb() {
    const saved = store.raw('db');
    if (saved && store.raw('dbv') === DATA_VERSION) {
      try { return new SQL.Database(fromBase64(saved)); } catch (e) { /* archivio corrotto */ }
    }
    return freshDb();
  }

  /** Esegue uno o più statement; restituisce i risultati di quelli che producono colonne. */
  function execute(database, sql) {
    const out = { sets: [], changes: 0, error: null, ms: 0, statements: 0 };
    const t0 = performance.now();
    try {
      for (const stmt of database.iterateStatements(sql)) {
        out.statements++;
        const cols = stmt.getColumnNames();
        const rows = [];
        while (stmt.step()) rows.push(stmt.get());
        stmt.free();
        if (cols.length) out.sets.push({ columns: cols, rows });
        else out.changes += database.getRowsModified();
      }
    } catch (e) {
      out.error = e && e.message ? e.message : String(e);
    }
    out.ms = performance.now() - t0;
    return out;
  }

  // ---------------------------------------------------------------- confronto
  function norm(v) {
    if (v === null || v === undefined) return '∅';
    if (typeof v === 'number') return String(Math.round(v * 100) / 100);
    if (v instanceof Uint8Array) return '[blob ' + v.length + ']';
    return String(v).trim();
  }
  const rowKey = (r) => r.map(norm).join('␟');

  function compareSets(user, expected, ordered) {
    if (!user) return { ok: false, msg: 'La tua richiesta non ha restituito alcuna tabella di risultati. Serve una <code>SELECT</code>.' };
    if (user.columns.length !== expected.columns.length) {
      return {
        ok: false,
        msg: `Il registro si aspetta <b>${expected.columns.length}</b> ${expected.columns.length === 1 ? 'colonna' : 'colonne'}, la tua risposta ne ha <b>${user.columns.length}</b>. Rileggi il compito: quali colonne vengono richieste?`
      };
    }
    const u = user.rows.map(rowKey), e = expected.rows.map(rowKey);
    if (u.length !== e.length) {
      return {
        ok: false,
        msg: `Hai trovato <b>${u.length}</b> ${u.length === 1 ? 'riga' : 'righe'}, ma il registro ne conta <b>${e.length}</b>. ${u.length > e.length ? 'Forse manca un filtro, o ci sono duplicati?' : 'Forse il filtro è troppo severo?'}`
      };
    }
    const us = u.slice().sort(), es = e.slice().sort();
    const sameSet = us.every((k, i) => k === es[i]);
    if (!sameSet) {
      return { ok: false, msg: `Il numero di righe è giusto (<b>${e.length}</b>), ma il contenuto non coincide. Controlla le colonne scelte, il loro ordine e le condizioni.` };
    }
    if (ordered && !u.every((k, i) => k === e[i])) {
      return { ok: false, msg: 'Le righe sono quelle giuste, ma l\'<b>ordine</b> non è quello richiesto.' };
    }
    return { ok: true };
  }

  function checkMission(m, userOut) {
    if (userOut.error) return null;
    if (m.check === 'state') {
      if (!baseline) return { ok: false, msg: 'Non riesco a ricostruire lo stato iniziale della missione. Ricarica la missione.' };
      const ref = new SQL.Database(baseline);
      const sol = execute(ref, m.solution);
      if (sol.error) { ref.close(); return { ok: false, msg: 'Errore interno nella verifica: ' + esc(sol.error) }; }
      const exp = execute(ref, m.verify);
      ref.close();
      const act = execute(db, m.verify);
      if (act.error) return { ok: false, msg: 'Il catalogo non contiene ancora ciò che serve: ' + esc(translateError(act.error).text), rewind: true };
      const res = compareSets(act.sets[act.sets.length - 1], exp.sets[exp.sets.length - 1], false);
      if (!res.ok) {
        return {
          ok: false,
          rewind: true,
          msg: 'Il catalogo non è nello stato atteso. ' + (userOut.changes === 0 && !/\b(create|drop|alter)\b/i.test(stripComments(currentSql()))
            ? 'Non sembra che tu abbia modificato alcuna riga.'
            : 'Se un tentativo precedente ha lasciato modifiche sbagliate, riavvolgi il catalogo e riprova.')
        };
      }
      return { ok: true };
    }
    const exp = execute(db, m.solution);
    if (exp.error) return { ok: false, msg: 'Errore interno nella verifica: ' + esc(exp.error) };
    return compareSets(userOut.sets[userOut.sets.length - 1], exp.sets[exp.sets.length - 1], m.ordered);
  }

  function stripComments(sql) { return sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''); }

  function translateError(msg) {
    const rules = [
      [/no such table: (\S+)/i, (m) => `La tabella «${m[1]}» non esiste nello schedario. Controlla il nome nello Schedario.`],
      [/no such column: (\S+)/i, (m) => `La colonna «${m[1]}» non esiste. Controlla i nomi delle colonne (e gli alias delle tabelle).`],
      [/near "(.+?)": syntax error/i, (m) => `Errore di sintassi vicino a «${m[1]}». Manca una virgola, una parola chiave o un apice?`],
      [/incomplete input/i, () => 'La richiesta sembra incompleta: manca una parentesi o un apice di chiusura?'],
      [/unrecognized token: "(.+?)"/i, (m) => `Simbolo non riconosciuto: «${m[1]}». Attenzione agli apici: i testi vanno tra apici singoli '…'.`],
      [/table (\S+) already exists/i, (m) => `La tabella «${m[1]}» esiste già. Puoi eliminarla con DROP TABLE ${m[1]};`],
      [/ambiguous column name: (\S+)/i, (m) => `La colonna «${m[1]}» compare in più tabelle: specifica quale, ad esempio v.${m[1]}.`],
      [/misuse of aggregate/i, () => 'Uso scorretto di una funzione di aggregazione: per filtrare i gruppi serve HAVING, non WHERE.'],
      [/UNIQUE constraint failed: (\S+)/i, (m) => `Valore duplicato in ${m[1]}: quella chiave esiste già.`],
      [/NOT NULL constraint failed: (\S+)/i, (m) => `Manca un valore obbligatorio: ${m[1]}.`],
      [/(\d+) values for (\d+) columns/i, (m) => `Hai indicato ${m[1]} valori per ${m[2]} colonne: devono essere in numero uguale.`],
      [/no such function: (\S+)/i, (m) => `La funzione «${m[1]}» non esiste in SQLite.`],
      [/sqlite_master may not be modified|table registro_segreto may not be/i, () => 'Questa tabella è protetta.']
    ];
    for (const [re, fn] of rules) {
      const m = msg.match(re);
      if (m) return { text: fn(m), raw: msg };
    }
    return { text: 'Il registro non ha compreso la richiesta.', raw: msg };
  }

  // ---------------------------------------------------------------- XP e gradi
  const totalXp = () => Object.values(state.completed).reduce((s, c) => s + (c.xp || 0), 0);
  function rankFor(xp) {
    let r = RANKS[0], next = null;
    for (let i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].xp) { r = RANKS[i]; next = RANKS[i + 1] || null; }
    }
    return { r, next };
  }
  function potentialXp(id) {
    return Math.max(XP_MIN, XP_BASE - (state.hints[id] || 0) * XP_HINT - (state.solutions[id] ? XP_SOLUTION : 0));
  }

  // ---------------------------------------------------------------- editor
  let cm = null;
  function initEditor() {
    cm = CodeMirror.fromTextArea($('#sqlEditor'), {
      mode: 'text/x-sqlite',
      theme: 'archive',
      lineNumbers: true,
      lineWrapping: true,
      matchBrackets: true,
      indentWithTabs: false,
      tabSize: 2,
      viewportMargin: Infinity,
      extraKeys: {
        'Ctrl-Enter': run,
        'Cmd-Enter': run,
        'Shift-Enter': run,
        'Ctrl-Space': 'autocomplete',
        'Tab': (ed) => ed.somethingSelected() ? ed.indentSelection('add') : ed.replaceSelection('  ')
      },
      hintOptions: { completeSingle: false }
    });
    cm.on('change', () => {
      state.drafts[state.current] = cm.getValue();
      saveDraftSoon();
    });
  }
  let draftTimer = null;
  function saveDraftSoon() { clearTimeout(draftTimer); draftTimer = setTimeout(save, 400); }
  const currentSql = () => cm.getValue();

  function insertAtCursor(text) {
    cm.replaceSelection(text);
    cm.focus();
  }

  function prettify() {
    const lines = [];
    for (let i = 0; i < cm.lineCount(); i++) {
      lines.push(cm.getLineTokens(i).map(t => (t.type === 'keyword' || t.type === 'builtin') ? t.string.toUpperCase() : t.string).join(''));
    }
    const text = lines.join('\n');
    if (text !== cm.getValue()) {
      const cur = cm.getCursor();
      cm.setValue(text);
      cm.setCursor(cur);
    }
    toast('Parole chiave in maiuscolo, come vuole la tradizione.');
  }

  // ---------------------------------------------------------------- schedario
  function listTables() {
    const showSecret = !!state.completed[SECRET_UNLOCK_MISSION];
    const r = execute(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid;");
    const names = r.sets.length ? r.sets[0].rows.map(x => x[0]) : [];
    return names.filter(n => showSecret || HIDDEN.indexOf(n) === -1);
  }

  const KNOWN = ['sale', 'scaffali', 'autori', 'volumi', 'visitatori', 'prestiti', 'restauri', 'registro_accessi', 'schede_provvisorie', 'registro_segreto'];

  function renderSchema() {
    const tables = listTables();
    const hintTables = {};
    const box = $('#schemaList');
    box.innerHTML = '';
    tables.forEach(name => {
      const info = execute(db, `PRAGMA table_info("${name.replace(/"/g, '""')}");`);
      const cols = info.sets.length ? info.sets[0].rows.map(r => ({ name: r[1], type: r[2] || '', pk: !!r[5] })) : [];
      const cnt = execute(db, `SELECT COUNT(*) FROM "${name.replace(/"/g, '""')}";`);
      const n = cnt.sets.length ? cnt.sets[0].rows[0][0] : '?';
      hintTables[name] = cols.map(c => c.name);

      const card = document.createElement('div');
      card.className = 'table-card' + (KNOWN.indexOf(name) === -1 || name === 'registro_segreto' ? ' is-new' : '');
      const btn = document.createElement('button');
      btn.className = 'table-name';
      btn.type = 'button';
      btn.title = `Sbircia: SELECT * FROM ${name} LIMIT 10`;
      btn.innerHTML = `<span>${esc(name)}</span><span class="count">${n} righe</span>`;
      btn.addEventListener('click', () => {
        const out = execute(db, `SELECT * FROM "${name.replace(/"/g, '""')}" LIMIT 10;`);
        renderResults(out, `Anteprima di «${name}» (prime 10 righe) — non conta per la missione`);
        hideFeedback();
        closeDrawers();
        $('.results-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      card.appendChild(btn);
      if (NOTES[name]) {
        const p = document.createElement('p');
        p.className = 'table-note';
        p.textContent = NOTES[name];
        card.appendChild(p);
      }
      const ul = document.createElement('ul');
      ul.className = 'col-list';
      cols.forEach(c => {
        const li = document.createElement('li');
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'col-chip' + (c.pk ? ' pk' : '');
        chip.innerHTML = `${esc(c.name)}<span class="t">${esc(c.type.toLowerCase())}</span>`;
        chip.title = `Inserisci «${c.name}» nel calamaio`;
        chip.addEventListener('click', () => { insertAtCursor(c.name); if (isMobile()) closeDrawers(); });
        li.appendChild(chip);
        ul.appendChild(li);
      });
      card.appendChild(ul);
      box.appendChild(card);
    });
    cm.setOption('hintOptions', { tables: hintTables, completeSingle: false });
  }

  // ---------------------------------------------------------------- prontuario
  const CHEATS = [
    ['Leggere', 'Scegli colonne e tabella', 'SELECT titolo, anno\nFROM volumi;'],
    ['Filtrare', '= <> < > <= >=, AND, OR, NOT', "SELECT * FROM volumi\nWHERE lingua = 'Latino' AND pagine > 300;"],
    ['Modelli e insiemi', 'LIKE con % e _, IN, BETWEEN', "SELECT titolo FROM volumi\nWHERE titolo LIKE 'Il%'\n  AND anno BETWEEN 1500 AND 1599;"],
    ['Valori mancanti', 'NULL si controlla con IS', 'SELECT * FROM prestiti\nWHERE data_restituzione IS NULL;'],
    ['Ordinare e limitare', 'ASC (predefinito) o DESC', 'SELECT titolo, valore FROM volumi\nORDER BY valore DESC\nLIMIT 3;'],
    ['Aggregare', 'COUNT, SUM, AVG, MIN, MAX', 'SELECT genere, COUNT(*) AS n\nFROM volumi\nGROUP BY genere\nHAVING COUNT(*) > 5;'],
    ['Unire tabelle', 'JOIN … ON …', 'SELECT v.titolo, a.nome\nFROM volumi v\nJOIN autori a ON v.autore_id = a.id;'],
    ['Tenere tutto a sinistra', 'LEFT JOIN: righe senza corrispondenza → NULL', 'SELECT a.nome, v.titolo\nFROM autori a\nLEFT JOIN volumi v ON v.autore_id = a.id;'],
    ['Sottoquery', 'Una query dentro un\'altra', 'SELECT titolo FROM volumi\nWHERE valore > (SELECT AVG(valore) FROM volumi);'],
    ['Query con nome', 'WITH (CTE)', "WITH antichi AS (\n  SELECT * FROM volumi WHERE anno < 1000\n)\nSELECT titolo FROM antichi;"],
    ['Funzioni finestra', 'Classifiche per gruppo', 'SELECT titolo, genere, valore,\n  RANK() OVER (PARTITION BY genere ORDER BY valore DESC) AS pos\nFROM volumi;'],
    ['Condizioni', 'CASE WHEN … THEN … END', "SELECT titolo,\n  CASE WHEN anno < 0 THEN 'a.C.' ELSE 'd.C.' END AS era\nFROM volumi;"],
    ['Inserire', 'INSERT INTO', "INSERT INTO visitatori (nome, professione, citta)\nVALUES ('Ada', 'Archivista', 'Ombravalle');"],
    ['Modificare', 'UPDATE … SET … WHERE (non dimenticare il WHERE!)', "UPDATE volumi SET stato = 'integro'\nWHERE id = 1;"],
    ['Eliminare', 'DELETE FROM … WHERE', 'DELETE FROM schede_provvisorie\nWHERE id = 1;'],
    ['Creare tabelle', 'CREATE TABLE … AS SELECT', 'CREATE TABLE greci AS\nSELECT * FROM autori WHERE nazione = \'Grecia\';'],
    ['Esplorare lo schema', 'Il catalogo dei cataloghi', "SELECT name, sql FROM sqlite_master\nWHERE type = 'table';"]
  ];
  function renderCheats() {
    const box = $('#cheatSheet');
    box.innerHTML = CHEATS.map(([t, d, c], i) => `<h4>${esc(t)}</h4><p>${esc(d)}</p><pre data-i="${i}" title="Tocca per copiare nel calamaio">${esc(c)}</pre>`).join('');
    $$('pre', box).forEach(pre => pre.addEventListener('click', () => {
      const c = CHEATS[+pre.dataset.i][2];
      const cur = cm.getValue().trim();
      if (!cur || /^--[^\n]*$/.test(cur)) cm.setValue(c); else insertAtCursor('\n' + c);
      toast('Esempio copiato nel calamaio');
      if (isMobile()) closeDrawers();
    }));
  }

  // ---------------------------------------------------------------- cronologia
  function pushHistory(sql, ok) {
    const s = sql.trim();
    if (!s) return;
    state.history = state.history.filter(h => h.sql !== s);
    state.history.unshift({ sql: s, ok, m: state.current });
    state.history = state.history.slice(0, 30);
    renderHistory();
  }
  function renderHistory() {
    const ol = $('#historyList');
    if (!state.history.length) { ol.innerHTML = '<li class="muted">Nessuna query, per ora.</li>'; return; }
    ol.innerHTML = '';
    state.history.forEach(h => {
      const li = document.createElement('li');
      li.className = h.ok ? 'ok' : 'err';
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = h.sql;
      b.addEventListener('click', () => { cm.setValue(h.sql); cm.focus(); if (isMobile()) closeDrawers(); });
      li.appendChild(b);
      ol.appendChild(li);
    });
  }

  // ---------------------------------------------------------------- missioni
  const byId = (id) => MISSIONS.find(m => m.id === id);
  const fill = (s) => String(s).replace(/\{nome\}/g, esc(state.name || 'archivista'));

  function renderMissionList() {
    const box = $('#chapterList');
    const open = new Set($$('.chapter[open]', box).map(d => +d.dataset.ch));
    const currentCh = state.current ? byId(state.current).chapter : 0;
    box.innerHTML = '';
    CHAPTERS.forEach(ch => {
      const ms = MISSIONS.filter(m => m.chapter === ch.id);
      const done = ms.filter(m => state.completed[m.id]).length;
      const det = document.createElement('details');
      det.className = 'chapter';
      det.dataset.ch = ch.id;
      if (open.has(ch.id) || ch.id === currentCh) det.open = true;
      det.innerHTML = `<summary><span class="ch-roman">${ch.roman}</span><span>${esc(ch.title)}</span><span class="ch-count">${done}/${ms.length}</span></summary>`;
      const list = document.createElement('div');
      list.className = 'mission-list';
      ms.forEach(m => {
        const c = state.completed[m.id];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mission-item' + (c ? ' is-done' : '') + (c && c.perfect ? ' is-perfect' : '') + (m.id === state.current ? ' is-current' : '');
        b.innerHTML = `<span class="mi-icon">${c ? (c.perfect ? '★' : '✓') : m.id}</span><span class="mi-body"><span class="mi-title">${esc(m.title)}</span><span class="mi-concept">${esc(m.concept)}</span></span>`;
        b.addEventListener('click', () => { goTo(m.id); closeDrawers(); });
        list.appendChild(b);
      });
      det.appendChild(list);
      box.appendChild(det);
    });
    $('#btnSandbox').classList.toggle('is-current', state.current === 0);

    const n = Object.keys(state.completed).filter(id => byId(+id)).length;
    const pct = Math.round(n / MISSIONS.length * 100);
    $('#progressText').textContent = `${n} di ${MISSIONS.length} missioni`;
    $('#progressPct').textContent = pct + '%';
    $('#progressFill').style.width = pct + '%';
  }

  function renderRank() {
    const xp = totalXp();
    const { r, next } = rankFor(xp);
    $('#rankName').textContent = r.name;
    $('#xpValue').textContent = xp;
    $('#rankNameSide').textContent = r.name;
    $('#xpValueSide').textContent = xp;
    const pct = next ? Math.round((xp - r.xp) / (next.xp - r.xp) * 100) : 100;
    $('#rankBarFill').style.width = pct + '%';
    $('#rankBox').title = next ? `${r.name} — ${next.xp - xp} gocce al grado di ${next.name}` : `${r.name} — grado massimo`;
  }

  function renderMission() {
    const id = state.current;
    const sandbox = id === 0;
    const m = sandbox ? null : byId(id);
    const ch = m ? CHAPTERS.find(c => c.id === m.chapter) : null;

    $('#mChapter').textContent = sandbox ? 'Fuori dai capitoli' : `Capitolo ${ch.roman} · ${ch.title}`;
    $('#mConcept').textContent = sandbox ? 'pratica libera' : m.concept;
    $('#mTitle').textContent = sandbox ? 'Sala di lettura libera' : `${m.id}. ${m.title}`;
    $('#mStory').innerHTML = sandbox
      ? 'Qui non ci sono missioni né giudici: solo tu, il registro e una candela. Esplora le tabelle, prova idee, sbaglia quanto vuoi.'
      : fill(m.story);
    $('#mTask').innerHTML = sandbox
      ? 'Scrivi qualsiasi query. Per cominciare, tocca una tabella nello <b>Schedario</b> o un esempio nel <b>Prontuario</b>.'
      : fill(m.task);

    const done = m && state.completed[m.id];
    $('#mTaskBox').querySelector('.task-label').textContent = done ? 'Il compito · sigillato ✓' : 'Il compito';

    renderHints();

    $('#btnHint').hidden = sandbox;
    $('#btnSolution').hidden = sandbox;
    $('#btnPrev').disabled = sandbox ? true : id <= 1;
    $('#btnNext').disabled = sandbox ? false : id >= MISSIONS.length;
    $('#btnNext').textContent = sandbox ? 'Torna alle missioni →' : 'Successiva →';

    const draft = state.drafts[id];
    cm.setValue(draft !== undefined ? draft : (sandbox ? '-- Sala di lettura libera\nSELECT * FROM volumi LIMIT 10;\n' : '-- Scrivi qui sotto la tua query e premi «Esegui»\n'));
    cm.setCursor(cm.lineCount(), 0);

    baseline = (m && m.check === 'state') ? db.export() : null;

    hideFeedback();
    $('#results').innerHTML = '<p class="empty">Le righe trovate compariranno qui, vergate in bella grafia.</p>';
    $('#resultsMeta').textContent = '';
  }

  function renderHints() {
    const id = state.current;
    const box = $('#mHints');
    box.innerHTML = '';
    if (!id) return;
    const m = byId(id);
    const n = state.hints[id] || 0;
    for (let i = 0; i < n && i < m.hints.length; i++) {
      const d = document.createElement('div');
      d.className = 'hint';
      d.innerHTML = `<b>Suggerimento ${i + 1}.</b> ${m.hints[i]}`;
      box.appendChild(d);
    }
    if (state.solutions[id]) {
      const d = document.createElement('div');
      d.className = 'hint';
      d.innerHTML = `<b>Soluzione.</b><pre>${esc(formatSql(m.solution))}</pre>`;
      const use = document.createElement('button');
      use.className = 'btn btn--sm';
      use.type = 'button';
      use.textContent = 'Copia nel calamaio';
      use.style.marginTop = '6px';
      use.addEventListener('click', () => { cm.setValue(formatSql(m.solution) + '\n'); cm.focus(); });
      d.appendChild(use);
      box.appendChild(d);
    }
    const hb = $('#btnHint');
    hb.disabled = n >= m.hints.length;
    hb.innerHTML = n >= m.hints.length ? 'Nessun altro suggerimento' : `Suggerimento ${n + 1}/${m.hints.length} <span class="cost">−${XP_HINT}</span>`;
    const sb = $('#btnSolution');
    sb.disabled = !!state.solutions[id];
    sb.dataset.armed = '';
    sb.innerHTML = state.solutions[id] ? 'Soluzione svelata' : `Soluzione <span class="cost">−${XP_SOLUTION}</span>`;
  }

  /** Va a capo prima delle clausole principali (solo fuori da parentesi e apici). */
  function formatSql(sql) {
    const kws = ['LEFT JOIN', 'GROUP BY', 'ORDER BY', 'FROM', 'WHERE', 'HAVING', 'LIMIT', 'JOIN', 'VALUES', 'SET', 'SELECT'];
    let out = '', depth = 0, quoted = false;
    for (let i = 0; i < sql.length; i++) {
      const c = sql[i];
      if (c === "'") { quoted = !quoted; out += c; continue; }
      if (!quoted) {
        if (c === '(') depth++;
        else if (c === ')') depth--;
        else if (c === ';' && sql[i + 1] === ' ') { out += ';\n'; i++; continue; }
        else if (c === ' ' && depth === 0) {
          const rest = sql.slice(i + 1);
          const kw = kws.find(k => rest.startsWith(k + ' '));
          if (kw && !/(DELETE|\n)$/.test(out)) { out += '\n'; continue; }
        }
      }
      out += c;
    }
    return out;
  }

  function goTo(id) {
    state.current = id;
    save();
    renderMission();
    renderMissionList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------- esecuzione
  function run() {
    const sql = currentSql();
    if (!stripComments(sql).trim()) { toast('Il calamaio è vuoto: scrivi una query.'); return; }
    const out = execute(db, sql);
    renderResults(out);
    persistDb();
    if (/\b(create|drop|alter)\b/i.test(stripComments(sql)) || out.changes) renderSchema();

    if (out.error) {
      const t = translateError(out.error);
      showFeedback('err', `<strong>Inchiostro macchiato</strong>${esc(t.text)}<span class="raw">SQLite: ${esc(t.raw)}</span>`);
      pushHistory(sql, false);
      return;
    }
    pushHistory(sql, true);
    if (state.current === 0) { hideFeedback(); return; }

    const m = byId(state.current);
    const res = checkMission(m, out);
    if (res.ok) {
      const already = !!state.completed[m.id];
      if (!already) {
        const xp = potentialXp(m.id);
        state.completed[m.id] = { xp, perfect: !state.hints[m.id] && !state.solutions[m.id], at: Date.now() };
        save();
        renderRank();
        renderMissionList();
        if (m.id === SECRET_UNLOCK_MISSION) renderSchema();
        showFeedback('ok', `<strong>Corretto!</strong>Il registro conferma: missione sigillata.`);
        $('#mTaskBox').querySelector('.task-label').textContent = 'Il compito · sigillato ✓';
        showSuccess(m, xp);
      } else {
        showFeedback('ok', '<strong>Corretto!</strong>Missione già sigillata in precedenza: nessuna goccia in più, ma tanta gloria.');
      }
    } else {
      let html = `<strong>Non ancora</strong>${res.msg}`;
      showFeedback('warn', html);
      if (res.rewind) {
        const b = document.createElement('button');
        b.className = 'btn btn--sm';
        b.type = 'button';
        b.style.marginTop = '8px';
        b.textContent = 'Riavvolgi il catalogo all\'inizio della missione';
        b.addEventListener('click', () => {
          if (!baseline) return;
          db.close();
          db = new SQL.Database(baseline);
          persistDb();
          renderSchema();
          hideFeedback();
          toast('Catalogo riavvolto. Riprova con calma.');
        });
        $('#feedback').appendChild(b);
      }
    }
  }

  function renderResults(out, caption) {
    const box = $('#results');
    box.innerHTML = '';
    const meta = [];
    if (out.error) {
      box.innerHTML = '<p class="empty">Nessun risultato: la richiesta contiene un errore.</p>';
      $('#resultsMeta').textContent = '';
      return;
    }
    if (!out.sets.length) {
      box.innerHTML = `<p class="empty">${out.changes ? `Fatto: ${out.changes} ${out.changes === 1 ? 'riga modificata' : 'righe modificate'} nel catalogo.` : 'Comando eseguito. Nessuna riga da mostrare.'}</p>`;
    }
    const MAX = 500;
    out.sets.forEach((set, i) => {
      const block = document.createElement('div');
      block.className = 'result-block';
      if (caption || out.sets.length > 1) {
        const p = document.createElement('p');
        p.className = 'result-caption';
        p.textContent = caption || `Risultato ${i + 1} di ${out.sets.length}`;
        block.appendChild(p);
      }
      if (!set.rows.length) {
        const p = document.createElement('p');
        p.className = 'empty';
        p.textContent = 'Nessuna riga corrisponde alla richiesta.';
        block.appendChild(p);
      }
      const table = document.createElement('table');
      table.className = 'ledger';
      const head = '<thead><tr><th class="rownum">#</th>' + set.columns.map(c => `<th>${esc(c)}</th>`).join('') + '</tr></thead>';
      const body = set.rows.slice(0, MAX).map((r, ri) => '<tr><td class="rownum">' + (ri + 1) + '</td>' + r.map(v => {
        if (v === null) return '<td class="null">NULL</td>';
        if (typeof v === 'number') return `<td class="num">${esc(Number.isInteger(v) ? v : Math.round(v * 1000) / 1000)}</td>`;
        return `<td>${esc(v)}</td>`;
      }).join('') + '</tr>').join('');
      table.innerHTML = head + '<tbody>' + body + '</tbody>';
      if (set.rows.length || set.columns.length) block.appendChild(table);
      if (set.rows.length > MAX) {
        const p = document.createElement('p');
        p.className = 'result-caption';
        p.textContent = `Mostrate le prime ${MAX} righe di ${set.rows.length}.`;
        block.appendChild(p);
      }
      box.appendChild(block);
    });
    const last = out.sets[out.sets.length - 1];
    if (last) meta.push(`${last.rows.length} ${last.rows.length === 1 ? 'riga' : 'righe'}`);
    if (out.changes) meta.push(`${out.changes} modificate`);
    meta.push(`${out.ms < 1 ? '<1' : Math.round(out.ms)} ms`);
    $('#resultsMeta').textContent = meta.join(' · ');
  }

  function showFeedback(kind, html) {
    const f = $('#feedback');
    f.className = 'feedback ' + kind;
    f.innerHTML = html;
    f.hidden = false;
  }
  function hideFeedback() { $('#feedback').hidden = true; }

  // ---------------------------------------------------------------- modali
  const PRAISE = [
    'Il registro annuisce, soddisfatto.',
    'Una richiesta limpida come inchiostro fresco.',
    'Maestro Aurelio ne sarebbe fiero.',
    'Il custode alza lo sguardo dal suo lume e sorride.',
    'Le pergamene frusciano in segno di approvazione.',
    'Nemmeno una sbavatura. Bel lavoro.'
  ];
  let successNextId = null;
  function showSuccess(m, xp) {
    const perfect = state.completed[m.id].perfect;
    $('#successSealText').textContent = perfect ? '★' : '✓';
    $('#successTitle').textContent = perfect ? 'Sigillo d\'oro' : 'Missione compiuta';
    $('#successText').textContent = PRAISE[m.id % PRAISE.length] + (perfect ? ' Nessun suggerimento: un sigillo d\'oro per te.' : '');
    const before = rankFor(totalXp() - xp).r, after = rankFor(totalXp()).r;
    $('#successXp').textContent = `+${xp} gocce d'inchiostro` + (after.name !== before.name ? ` · Nuovo grado: ${after.name}!` : '');

    const chMs = MISSIONS.filter(x => x.chapter === m.chapter);
    const isLastOfChapter = chMs[chMs.length - 1].id === m.id;
    const outro = $('#successOutro');
    if (isLastOfChapter) {
      const ch = CHAPTERS.find(c => c.id === m.chapter);
      outro.innerHTML = `<b>Fine del capitolo ${ch.roman}</b>${esc(ch.outro)}`;
      outro.hidden = false;
    } else outro.hidden = true;

    successNextId = m.id < MISSIONS.length ? m.id + 1 : null;
    $('#successNext').textContent = successNextId ? 'Prossima missione →' : 'Leggi l\'epilogo';
    openModal('#successModal');
  }

  function showFinale() {
    $('#certName').textContent = state.name || 'Archivista';
    const rk = rankFor(totalXp()).r;
    $('#certRank').textContent = rk.name;
    $('#certSeal').textContent = rk.seal;
    $('#certDate').textContent = 'Ombravalle, ' + new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    state.finaleSeen = true;
    save();
    openModal('#finaleModal');
  }

  let lastFocus = null;
  function openModal(sel) {
    lastFocus = document.activeElement;
    const m = $(sel);
    m.hidden = false;
    const f = m.querySelector('input, .btn--primary');
    if (f) setTimeout(() => f.focus(), 50);
  }
  function closeModal(sel) {
    $(sel).hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------------------------------------------------------------- drawer (mobile)
  const isMobile = () => window.matchMedia('(max-width: 860px)').matches;
  function openDrawer(sel) {
    closeDrawers();
    $(sel).classList.add('is-open');
    $('#backdrop').hidden = false;
  }
  function closeDrawers() {
    $$('.drawer.is-open').forEach(d => d.classList.remove('is-open'));
    $('#backdrop').hidden = true;
  }

  // ---------------------------------------------------------------- tema
  function effectiveTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function toggleTheme() {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.raw('theme', next);
    updateThemeColor();
    toast(next === 'dark' ? 'Hai acceso una candela.' : 'Hai aperto le imposte: luce del giorno.');
  }
  function updateThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', effectiveTheme() === 'dark' ? '#2a2119' : '#efe2c2');
  }

  // ---------------------------------------------------------------- donazioni
  function initDonate() {
    const p = CONFIG.paypal || {};
    const amounts = p.amounts && p.amounts.length ? p.amounts : [3, 5, 10];
    const cur = p.currency || 'EUR';
    const sym = cur === 'EUR' ? '€' : cur + ' ';
    let chosen = amounts[1] !== undefined ? amounts[1] : amounts[0];
    const box = $('#donateAmounts');
    const link = $('#donateLink');
    const update = () => {
      $$('.amount', box).forEach(b => b.classList.toggle('is-active', +b.dataset.v === chosen));
      if (p.hostedButtonId) {
        link.href = `https://www.paypal.com/donate/?hosted_button_id=${encodeURIComponent(p.hostedButtonId)}`;
      } else {
        link.href = `https://www.paypal.com/paypalme/${encodeURIComponent(p.username || '')}/${chosen}${cur}`;
      }
    };
    box.innerHTML = amounts.map(a => `<button type="button" class="amount" data-v="${a}">${sym}${a}</button>`).join('');
    $$('.amount', box).forEach(b => b.addEventListener('click', () => { chosen = +b.dataset.v; update(); }));
    if (p.hostedButtonId) box.hidden = true;
    update();
  }

  // ---------------------------------------------------------------- eventi
  function bind() {
    $('#btnRun').addEventListener('click', run);
    $('#btnClear').addEventListener('click', () => { cm.setValue(''); cm.focus(); });
    $('#btnFormat').addEventListener('click', prettify);
    $('#btnPrev').addEventListener('click', () => { if (state.current > 1) goTo(state.current - 1); });
    $('#btnNext').addEventListener('click', () => {
      if (state.current === 0) {
        const firstOpen = MISSIONS.find(m => !state.completed[m.id]);
        goTo(firstOpen ? firstOpen.id : 1);
      } else if (state.current < MISSIONS.length) goTo(state.current + 1);
    });
    $('#btnSandbox').addEventListener('click', () => { goTo(0); closeDrawers(); });

    $('#btnHint').addEventListener('click', () => {
      const id = state.current, m = byId(id);
      const n = state.hints[id] || 0;
      if (n >= m.hints.length) return;
      state.hints[id] = n + 1;
      save();
      renderHints();
      if (!state.completed[id]) toast(`Suggerimento svelato. Ricompensa massima: ${potentialXp(id)} gocce.`);
    });
    $('#btnSolution').addEventListener('click', (e) => {
      const b = e.currentTarget;
      const id = state.current;
      if (!b.dataset.armed) {
        b.dataset.armed = '1';
        b.innerHTML = 'Sicuro? Tocca di nuovo';
        setTimeout(() => { if (b.dataset.armed) renderHints(); }, 3500);
        return;
      }
      state.solutions[id] = true;
      save();
      renderHints();
    });

    const resetBtn = $('#btnReset');
    resetBtn.addEventListener('click', () => {
      if (!resetBtn.dataset.armed) {
        resetBtn.dataset.armed = '1';
        resetBtn.textContent = 'Sicuro? Tocca di nuovo';
        setTimeout(() => { resetBtn.dataset.armed = ''; resetBtn.textContent = 'Ripristina archivio'; }, 3500);
        return;
      }
      resetBtn.dataset.armed = '';
      resetBtn.textContent = 'Ripristina archivio';
      db.close();
      db = freshDb();
      persistDb();
      const m = byId(state.current);
      baseline = (m && m.check === 'state') ? db.export() : null;
      renderSchema();
      hideFeedback();
      toast('L\'archivio è tornato com\'era il giorno del tuo arrivo. I progressi restano.');
    });

    $('#btnTheme').addEventListener('click', toggleTheme);
    $('#btnOpenMissions').addEventListener('click', () => openDrawer('#panelMissions'));
    $('#btnOpenSchema').addEventListener('click', () => openDrawer('#panelSchema'));
    $('#backdrop').addEventListener('click', closeDrawers);
    $$('[data-close]').forEach(b => b.addEventListener('click', closeDrawers));

    $$('.tab').forEach(t => t.addEventListener('click', () => {
      $$('.tab').forEach(x => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
      $$('.tab-panel').forEach(p => { p.hidden = p.dataset.panel !== t.dataset.tab; });
    }));

    $('#btnStory').addEventListener('click', () => { $('#introName').value = state.name || ''; openModal('#introModal'); closeDrawers(); });
    const accept = () => {
      const name = $('#introName').value.trim();
      if (!name) { $('#introName').focus(); toast('Una firma, prego: il Consiglio insiste.'); return; }
      state.name = name;
      save();
      closeModal('#introModal');
      renderMission();
    };
    $('#introAccept').addEventListener('click', accept);
    $('#introName').addEventListener('keydown', (e) => { if (e.key === 'Enter') accept(); });

    $('#successStay').addEventListener('click', () => closeModal('#successModal'));
    $('#successNext').addEventListener('click', () => {
      closeModal('#successModal');
      if (successNextId) goTo(successNextId);
      else showFinale();
    });
    $('#finaleClose').addEventListener('click', () => closeModal('#finaleModal'));
    $('#finalePrint').addEventListener('click', () => window.print());

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('#successModal').hidden) closeModal('#successModal');
      else if (!$('#finaleModal').hidden) closeModal('#finaleModal');
      else if (!$('#introModal').hidden && state.name) closeModal('#introModal');
      else closeDrawers();
    });
    window.matchMedia('(max-width: 860px)').addEventListener('change', (e) => { if (!e.matches) closeDrawers(); });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);
  }

  // ---------------------------------------------------------------- avvio
  async function boot() {
    const loading = $('#loading');
    try {
      SQL = await initSqlJs({ locateFile: (f) => 'vendor/sqljs/' + f });
    } catch (e) {
      loading.classList.add('is-error');
      loading.querySelector('p').textContent = 'Impossibile aprire i registri: il motore SQL non si è caricato. Se hai aperto il file direttamente dal disco, pubblicalo su un server web (anche locale) e riprova.';
      return;
    }
    db = loadDb();
    if (!byId(state.current) && state.current !== 0) state.current = 1;

    initEditor();
    bind();
    renderCheats();
    renderHistory();
    renderSchema();
    renderRank();
    renderMissionList();
    renderMission();
    initDonate();
    updateThemeColor();

    loading.classList.add('is-done');
    setTimeout(() => loading.remove(), 500);
    if (!state.name) openModal('#introModal');

    // Per i test automatici e per i curiosi
    window.SQLArchive = {
      run: (sql) => { cm.setValue(sql); run(); },
      goTo,
      solution: (id) => byId(id).solution,
      state
    };
  }

  boot();
})();
