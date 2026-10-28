/* CapturaBox — MODO DEMO
 *
 * Se carga antes que cualquier otro script de la app (ver tools/build-demo.js).
 * 1) Aísla el almacenamiento: todo lo que la app guarda en localStorage /
 *    sessionStorage / IndexedDB queda bajo el prefijo "cbdemo", así la demo
 *    nunca lee ni pisa datos de la app real abierta en el mismo navegador.
 * 2) Reemplaza el servidor (Google Apps Script) por un backend local con
 *    datos ficticios que viven en este navegador.
 * 3) No registra service worker.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- storage
  function prefixedStorage(real, pfx) {
    function own() { return Object.keys(real).filter(function (k) { return k.indexOf(pfx) === 0; }); }
    return {
      getItem: function (k) { return real.getItem(pfx + k); },
      setItem: function (k, v) { real.setItem(pfx + k, String(v)); },
      removeItem: function (k) { real.removeItem(pfx + k); },
      clear: function () { own().forEach(function (k) { real.removeItem(k); }); },
      key: function (i) { var k = own()[i]; return k ? k.slice(pfx.length) : null; },
      get length() { return own().length; }
    };
  }
  var realLS = window.localStorage;
  var demoLS = prefixedStorage(realLS, 'cbdemo:');
  var demoSS = prefixedStorage(window.sessionStorage, 'cbdemo:');
  Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return demoLS; } });
  Object.defineProperty(window, 'sessionStorage', { configurable: true, get: function () { return demoSS; } });

  var idbOpen = IDBFactory.prototype.open;
  var idbDelete = IDBFactory.prototype.deleteDatabase;
  IDBFactory.prototype.open = function (name, version) {
    var n = 'cbdemo_' + name;
    return version === undefined ? idbOpen.call(this, n) : idbOpen.call(this, n, version);
  };
  IDBFactory.prototype.deleteDatabase = function (name) { return idbDelete.call(this, 'cbdemo_' + name); };

  if (window.ServiceWorkerContainer) {
    ServiceWorkerContainer.prototype.register = function () { return Promise.resolve({}); };
  }

  // ---------------------------------------------------------------- helpers
  var DB_KEY = '__db_v1';
  var FOTO_DEMO = new URL('foto-demo.svg', document.currentScript ? document.currentScript.src : location.href).href;
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var isoDate = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var clDate = function (d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); };
  var hhmm = function (d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  var round = function (n, dec) { var f = Math.pow(10, dec || 0); return Math.round(n * f) / f; };
  var parseISO = function (s) { var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); };
  var dayKey = function (v) { return isoDate(new Date(v)); };
  function semanaISO(fecha) {
    var d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    var dia = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dia);
    var ini = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - ini) / 86400000 + 1) / 7);
  }
  function lunesDe(d) { var x = new Date(d); var w = x.getDay(); x.setDate(x.getDate() - (w === 0 ? 6 : w - 1)); x.setHours(12, 0, 0, 0); return x; }
  function inRange(ts, desde, hasta) {
    var k = dayKey(ts);
    return (!desde || k >= String(desde).slice(0, 10)) && (!hasta || k <= String(hasta).slice(0, 10));
  }
  function seeded(s) { return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

  // ---------------------------------------------------------------- catálogo demo
  var CLIENTES = ['FORESTAL DEMO', 'MADERAS SUR', 'PANELES NORTE'];
  var PRODUCTOS = {
    'FORESTAL DEMO': ['PLYWOOD', 'MADERA SECA'],
    'MADERAS SUR': ['MOLDURAS', 'MOLDURAS MDF'],
    'PANELES NORTE': ['TRUPAN', 'BLANKS']
  };
  var MARCAS = { 'FORESTAL DEMO': 'FD-PLY', 'MADERAS SUR': 'MS-MOLD', 'PANELES NORTE': 'PN-MDF' };
  var NAVES = [
    { nave: 'NORDIC STAR', linea: 'MSC', puerto: 'SAN ANTONIO', dias: 6 },
    { nave: 'ANDES EXPRESS', linea: 'MAERSK', puerto: 'SAN ANTONIO', dias: 13 },
    { nave: 'PACIFIC TRADER', linea: 'HAPAG-LLOYD', puerto: 'VALPARAISO', dias: 20 }
  ];
  var BODEGAS = ['BODEGA', 'ALERO', 'PATIO'];
  var PATENTES = ['GPSK47', 'RPVS49', 'PBLV65', 'JJHS50', 'PBLV71', 'RDCJ75', 'LTRK10', 'KXWB22', 'HZTR38', 'FFCD19', 'TRBK88', 'SVPL52'];
  var PREFIJOS_CONT = ['MSKU', 'TGHU', 'CAIU', 'FFAU', 'MRSU', 'TCNU'];
  var SUPERVISOR = '12345678-9';
  var CAPACIDAD_M3 = 1500;
  var NOMBRE = 'Supervisor Demo';
  var PERMISOS = ['CONSOLIDADO', 'RECEPCION', 'PREPARACION', 'REEXPEDICION', 'STOCK', 'DASHBOARD_EJECUTIVO',
    'PACKING_LIST', 'TRAZABILIDAD', 'RESUMEN_NAVE', 'INFORME_GENERAL', 'EDITAR_RECEPCION'];

  // ---------------------------------------------------------------- generación de datos
  function generar() {
    var rnd = seeded(20261028);
    var pick = function (arr) { return arr[Math.floor(rnd() * arr.length)]; };
    var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    var db = {
      creado: isoDate(hoy), lotes: {}, recepciones: [], preparaciones: [], consolidados: [],
      reexpediciones: [], metas: [], gate: [], seq: { rec: 800, cons: 1530, reex: 200, lote: 0 }
    };

    // naves y metas
    var semanaActual = semanaISO(hoy);
    var naves = NAVES.map(function (n, i) {
      var eta = new Date(hoy); eta.setDate(hoy.getDate() + n.dias);
      return Object.assign({}, n, { eta: eta, semana: semanaActual + i });
    });

    // lotes: packing list de cada cliente para cada nave
    var nLote = 3808200000;
    naves.forEach(function (nv, ni) {
      CLIENTES.forEach(function (cli, ci) {
        var entregas = 2 + ((ni + ci) % 2);
        for (var e = 0; e < entregas; e++) {
          var entrega = 'ENT-' + (2280 + ni * 10 + ci * 3 + e);
          var reserva = 'RES-' + (51000 + ni * 100 + ci * 10 + e);
          var cant = ni === 0 ? 48 + Math.floor(rnd() * 16) : 22 + Math.floor(rnd() * 14);
          var prod = PRODUCTOS[cli][e % PRODUCTOS[cli].length];
          for (var k = 0; k < cant; k++) {
            nLote += 7 + Math.floor(rnd() * 40);
            var lote = String(nLote);
            var vol = round(2.4 + rnd() * 1.2, 3);
            db.lotes[lote] = {
              lote: lote, cliente: cli, entrega: entrega, nave: nv.nave, reserva: reserva,
              marca: MARCAS[cli], producto: prod, clase: 'A', peso: Math.round(vol * 610 + rnd() * 120),
              volumen: vol, etaNave: clDate(nv.eta), puerto: nv.puerto,
              asignado: '', recepcionado: false, ubicacion: '', yaPreparado: false,
              fechaRecepcion: '', operacionRecepcion: '', fechaPreparacion: ''
            };
          }
        }
      });
    });
    var todos = Object.keys(db.lotes);

    // recepciones: últimos 15 días hábiles, el 85% de los lotes de las 2 primeras naves
    var aRecibir = todos.filter(function (l) { return db.lotes[l].nave !== naves[2].nave || rnd() < 0.35; });
    aRecibir = aRecibir.filter(function () { return rnd() < 0.88; });
    var dias = [];
    for (var d = 15; d >= 0; d--) {
      var f = new Date(hoy); f.setDate(hoy.getDate() - d);
      if (f.getDay() !== 0) dias.push(f);
    }
    var idx = 0;
    dias.forEach(function (dia, di) {
      var camiones = di === dias.length - 1 ? 5 : 2 + Math.floor(rnd() * 3);
      for (var c = 0; c < camiones && idx < aRecibir.length; c++) {
        var primero = db.lotes[aRecibir[idx]];
        var cli = primero.cliente;
        var ini = new Date(dia); ini.setHours(8 + c * 2, Math.floor(rnd() * 50), 0, 0);
        var detalle = [];
        var n = 9 + Math.floor(rnd() * 8);
        while (detalle.length < n && idx < aRecibir.length && db.lotes[aRecibir[idx]].cliente === cli) {
          var L = db.lotes[aRecibir[idx++]];
          var bod = pick(BODEGAS), pos = String.fromCharCode(65 + Math.floor(rnd() * 6)) + '-' + (1 + Math.floor(rnd() * 30));
          var conDanio = rnd() < 0.006;
          L.recepcionado = true; L.ubicacion = bod + ' ' + pos; L.fechaRecepcion = ini.toISOString(); L.danioRecepcion = conDanio;
          detalle.push({ lote: L.lote, producto: L.producto, peso: L.peso, bodega: bod, ubicacion: pos, cantidad: 1, danio: conDanio ? 'SI' : 'NO', tipoDanio: conDanio ? 'GOLPE' : '', piezasDanadas: conDanio ? 2 : 0, observacionDanio: conDanio ? 'DAÑO DE ORIGEN' : '' });
        }
        if (!detalle.length) { idx++; continue; }
        var fin = new Date(ini.getTime() + (25 + Math.floor(rnd() * 35)) * 60000);
        var rec = nuevaRecepcion({
          cliente: cli, patente: pick(PATENTES), guias: [String(458000 + db.seq.rec * 3)],
          detalle: detalle, proteccion: pick(['Carpa', 'Cortina', 'Carpa', 'Cintas']),
          volumenTotal: round(detalle.reduce(function (s, x) { return s + db.lotes[x.lote].volumen; }, 0), 1),
          horaInicio: ini.toISOString(), horaTermino: fin.toISOString(), fecha: ini.toISOString(), tipo: 'codigo'
        }, db);
        detalle.forEach(function (x) { db.lotes[x.lote].operacionRecepcion = rec.operacion; });
      }
    });

    // preparación: buena parte de lo recibido de la primera nave
    var recibidos = todos.filter(function (l) { return db.lotes[l].recepcionado; });
    recibidos.forEach(function (l) {
      var L = db.lotes[l];
      if (L.nave === naves[0].nave && rnd() < 0.8 || L.nave === naves[1].nave && rnd() < 0.25) {
        var fp = new Date(L.fechaRecepcion); fp.setDate(fp.getDate() + 1 + Math.floor(rnd() * 2));
        if (fp > new Date()) fp = new Date(Date.now() - 3600000 * (1 + rnd() * 3));
        L.yaPreparado = true; L.fechaPreparacion = fp.toISOString();
        db.preparaciones.push({ fecha: fp.toISOString(), lote: l, cliente: L.cliente, entrega: L.entrega, nave: L.nave, ubicacion: L.ubicacion, producto: L.producto, peso: L.peso, volumen: L.volumen, supervisor: SUPERVISOR, servicios: rnd() < 0.04 ? ['Lateral'] : [] });
      }
    });

    // consolidados: contenedores de la primera nave esta semana
    var lun = lunesDe(hoy);
    var preparados = todos.filter(function (l) { return db.lotes[l].yaPreparado && db.lotes[l].nave === naves[0].nave; });
    var porEntrega = {};
    preparados.forEach(function (l) { var k = db.lotes[l].entrega; (porEntrega[k] = porEntrega[k] || []).push(l); });
    var diaCons = 0;
    Object.keys(porEntrega).forEach(function (ent) {
      var lista = porEntrega[ent];
      while (lista.length >= 16) {
        var tomar = lista.splice(0, 9 + Math.floor(rnd() * 4));
        var diasTranscurridos = Math.max(1, ((hoy.getDay() + 6) % 7) + 1);
        var fd = new Date(lun); fd.setDate(lun.getDate() + (diaCons % diasTranscurridos));
        diaCons++;
        fd.setHours(8 + Math.floor(rnd() * 8), Math.floor(rnd() * 59), 0, 0);
        if (fd > new Date()) fd = new Date(Date.now() - 3600000 * 2);
        nuevoConsolidado(db, tomar, fd, 'COMPLETO', pick, rnd);
      }
    });
    // uno en proceso hoy
    var resto = todos.filter(function (l) { var L = db.lotes[l]; return L.yaPreparado && !L.asignado; }).slice(0, 5);
    if (resto.length) nuevoConsolidado(db, resto, new Date(Date.now() - 1800000), 'PARCIAL', pick, rnd);

    // metas por nave y cliente
    naves.forEach(function (nv) {
      CLIENTES.forEach(function (cli) {
        var lotesNC = todos.filter(function (l) { return db.lotes[l].nave === nv.nave && db.lotes[l].cliente === cli; });
        if (!lotesNC.length) return;
        var hechos = db.consolidados.filter(function (c) { return c.estado === 'COMPLETO' && c.nave === nv.nave && c.cliente === cli; }).length;
        db.metas.push({ nave: nv.nave, semana: nv.semana, cliente: cli, total: hechos ? hechos + 1 + Math.floor(rnd() * 2) : Math.ceil(lotesNC.length / 11) });
      });
    });

    // reexpediciones
    for (var r = 0; r < 4; r++) {
      var fr = new Date(hoy); fr.setDate(hoy.getDate() - r * 2); fr.setHours(10 + r, 15, 0, 0);
      var cliR = CLIENTES[r % 3];
      var lotesR = todos.filter(function (l) { var L = db.lotes[l]; return L.cliente === cliR && L.recepcionado && !L.yaPreparado && !L.asignado; }).slice(0, 5 + r);
      if (!lotesR.length) continue;
      db.seq.reex++;
      var opR = 'REX-' + String(db.seq.reex).padStart(6, '0');
      var detR = lotesR.map(function (l) { var L = db.lotes[l]; L.asignado = 'DESPACHO ' + opR; return { lote: l, producto: L.producto, entrega: L.entrega, peso: L.peso, volumen: L.volumen, nave: L.nave, cliente: L.cliente, ubicacion: L.ubicacion }; });
      db.reexpediciones.push({ operacion: opR, fecha: fr.toISOString(), cliente: cliR, patente: PATENTES[r + 4], destino: 'PLANTA ' + ['NORTE', 'SUR', 'CENTRO', 'NORTE'][r], lotes: detR.length, volumen: round(detR.reduce(function (t, d) { return t + d.volumen; }, 0), 2), supervisor: SUPERVISOR, encarpado: r % 2 ? 'SI' : 'NO', detalle: detR });
    }

    // gate control de hoy
    db.gate = [
      { tipo: 'RECEPCION', estado: 'VACIO', cliente: 'PANELES NORTE', contenedor: 'TGHU 448201 3', fecha: new Date().toISOString() },
      { tipo: 'RECEPCION', estado: 'VACIO', cliente: 'FORESTAL DEMO', contenedor: 'CAIU 220931 7', fecha: new Date().toISOString() },
      { tipo: 'DESPACHO', estado: 'LLENO', cliente: 'FORESTAL DEMO', contenedor: 'MSKU 307242 2', fecha: new Date().toISOString() }
    ];
    return db;
  }

  function nuevaRecepcion(data, db) {
    db.seq.rec++;
    var operacion = data.operacion || ('REC-' + String(db.seq.rec).padStart(6, '0'));
    var ini = data.horaInicio ? new Date(data.horaInicio) : new Date();
    var fin = data.horaTermino ? new Date(data.horaTermino) : new Date();
    var fecha = data.fecha ? new Date(data.fecha) : ini;
    var det = (data.detalle || []).map(function (x) { return sinBase64(Object.assign({}, x)); });
    var rec = {
      id: operacion, operacion: operacion, envioId: data.envioId || '', tipo: data.tipo || 'codigo',
      cliente: data.cliente || '', patente: data.patente || '', guias: data.guias || [],
      supervisor: data.supervisor || SUPERVISOR, proteccion: data.proteccion || '',
      volumenTotal: Number(data.volumenTotal) || 0, fechaISO: isoDate(fecha), fecha: fecha.toISOString(),
      createdAt: ini.getTime(), closedAt: fin.getTime(), updatedAt: fin.getTime(), estado: 'VERDE',
      horaInicio: ini.toISOString(), horaTermino: fin.toISOString(), detalle: det
    };
    recalcularRecepcion(rec);
    db.recepciones.push(rec);
    return rec;
  }
  function sinBase64(x) {
    ['fotosDanio', 'fotos', 'base64'].forEach(function (k) {
      if (Array.isArray(x[k])) x[k] = x[k].map(function (f) { var u = typeof f === 'string' ? f : (f && f.url) || ''; return /^https?:/.test(u) ? u : FOTO_DEMO; });
      else if (typeof x[k] === 'string' && x[k].length > 300) x[k] = FOTO_DEMO;
    });
    return x;
  }
  function recalcularRecepcion(rec) {
    rec.totalItems = rec.detalle.length;
    rec.totalPeso = rec.detalle.reduce(function (s, x) { return s + (Number(x.peso) || 0); }, 0);
    rec.totalCantidad = rec.detalle.reduce(function (s, x) { return s + (Number(x.cantidad) || 1); }, 0);
    rec.totalVolumen = rec.volumenTotal;
  }

  function nuevoConsolidado(db, lotes, fecha, estado, pick, rnd) {
    db.seq.cons++;
    var L0 = db.lotes[lotes[0]];
    var cont = pick(PREFIJOS_CONT) + ' ' + (100000 + Math.floor(rnd() * 899999)) + ' ' + Math.floor(rnd() * 9);
    var nv = NAVES.filter(function (n) { return n.nave === L0.nave; })[0] || NAVES[0];
    var fin = new Date(fecha.getTime() + (40 + Math.floor(rnd() * 40)) * 60000);
    var c = {
      operacion: 'CONS-' + String(db.seq.cons).padStart(6, '0'), contenedor: cont, cliente: L0.cliente, nave: L0.nave,
      linea: nv.linea, tipo: "40' HC", tara: 3880, gross: 30480, selloLinea: 'ML-' + (880000 + db.seq.cons),
      selloSag: 'SAG-' + (55000 + db.seq.cons), destino: nv.puerto, entrega: L0.entrega, reserva: L0.reserva,
      fecha: fecha.toISOString(), horaInicio: hhmm(fecha), horaFin: estado === 'COMPLETO' ? hhmm(fin) : '',
      estado: estado, supervisor: SUPERVISOR, lotes: lotes.slice()
    };
    lotes.forEach(function (l) { if (estado === 'COMPLETO') db.lotes[l].asignado = cont; });
    db.consolidados.push(c);
    return c;
  }

  // ---------------------------------------------------------------- persistencia
  var DB = null;
  function cargar() {
    if (DB) return DB;
    try { DB = JSON.parse(demoLS.getItem(DB_KEY) || 'null'); } catch (e) { DB = null; }
    if (!DB || DB.creado !== isoDate(new Date())) { DB = generar(); guardar(); }
    return DB;
  }
  function guardar() { try { demoLS.setItem(DB_KEY, JSON.stringify(DB)); } catch (e) { /* cuota llena: queda en memoria */ } }

  window.CapturaBoxDemo = {
    reiniciar: function () {
      Object.keys(realLS).filter(function (k) { return k.indexOf('cbdemo:') === 0; }).forEach(function (k) { realLS.removeItem(k); });
      var dbs = ['CapturaBoxDB', 'RC_DB', 'RX_DB'];
      try {
        indexedDB.databases().then(function (list) {
          (list || []).forEach(function (d) { if (d.name && d.name.indexOf('cbdemo_') === 0) idbDelete.call(indexedDB, d.name); });
          setTimeout(function () { location.reload(); }, 300);
        });
      } catch (e) { dbs.forEach(function (n) { idbDelete.call(indexedDB, 'cbdemo_' + n); }); setTimeout(function () { location.reload(); }, 300); }
    },
    db: function () { return cargar(); },
    sugerencias: function () {
      var db = cargar();
      var todos = Object.keys(db.lotes).map(function (k) { return db.lotes[k]; });
      var enConsolidado = {};
      db.consolidados.forEach(function (c) { c.lotes.forEach(function (l) { enConsolidado[l] = 1; }); });
      var libres = todos.filter(function (L) { return L.yaPreparado && !L.asignado && !enConsolidado[L.lote]; });
      var porEntrega = {};
      libres.forEach(function (L) { (porEntrega[L.entrega] = porEntrega[L.entrega] || []).push(L); });
      var mejor = Object.keys(porEntrega).sort(function (a, b) { return porEntrega[b].length - porEntrega[a].length; })[0];
      var cons = mejor ? porEntrega[mejor].slice(0, 8) : [];
      var trazado = todos.filter(function (L) { return L.asignado && L.asignado.indexOf('DESPACHO') !== 0; })[0];
      return {
        recepcion: todos.filter(function (L) { return !L.recepcionado; }).slice(0, 8).map(function (L) { return { lote: L.lote, info: L.cliente + ' · ' + L.producto }; }),
        preparacion: todos.filter(function (L) { return L.recepcionado && !L.yaPreparado && !L.asignado; }).slice(0, 8).map(function (L) { return { lote: L.lote, info: L.cliente + ' · ' + L.ubicacion }; }),
        consolidado: { cliente: cons[0] ? cons[0].cliente : '', nave: cons[0] ? cons[0].nave : '', entrega: mejor || '', lotes: cons.map(function (L) { return { lote: L.lote, info: L.ubicacion }; }) },
        despacho: todos.filter(function (L) { return L.recepcionado && !L.asignado && !enConsolidado[L.lote]; }).slice(-8).map(function (L) { return { lote: L.lote, info: L.cliente + ' · ' + L.ubicacion }; }),
        trazabilidad: trazado ? [{ lote: trazado.lote, info: 'recorrido completo: recepción → consolidado' }] : []
      };
    },
    sinManejar: []
  };

  // ---------------------------------------------------------------- vistas derivadas
  function stockVigente(db) {
    return Object.keys(db.lotes).map(function (k) { return db.lotes[k]; }).filter(function (L) { return L.recepcionado && !L.asignado; });
  }
  function porClienteSum(lista, campoVol) {
    var m = {};
    lista.forEach(function (x) {
      var c = x.cliente || '—';
      m[c] = m[c] || { cliente: c, volumen: 0, m3: 0, lotes: 0 };
      m[c].lotes++; m[c].volumen += Number(x[campoVol || 'volumen']) || 0;
    });
    return Object.keys(m).map(function (k) { m[k].volumen = round(m[k].volumen, 3); m[k].m3 = m[k].volumen; return m[k]; })
      .sort(function (a, b) { return b.volumen - a.volumen; });
  }
  function volCons(db, c) { return round(c.lotes.reduce(function (s, l) { return s + (db.lotes[l] ? db.lotes[l].volumen : 0); }, 0), 3); }
  function pesoCons(db, c) { return c.lotes.reduce(function (s, l) { return s + (db.lotes[l] ? Number(db.lotes[l].peso) || 0 : 0); }, 0); }
  function consCompletos(db, desde, hasta) { return db.consolidados.filter(function (c) { return c.estado === 'COMPLETO' && inRange(c.fecha, desde, hasta); }); }
  function recEnRango(db, desde, hasta) { return db.recepciones.filter(function (r) { return inRange(r.fecha, desde, hasta); }); }
  function prepEnRango(db, desde, hasta) { return db.preparaciones.filter(function (p) { return inRange(p.fecha, desde, hasta); }); }
  function contarPorCliente(lista) {
    var m = {};
    lista.forEach(function (x) { m[x.cliente] = (m[x.cliente] || 0) + 1; });
    return Object.keys(m).map(function (c) { return { cliente: c, total: m[c] }; }).sort(function (a, b) { return b.total - a.total; });
  }
  function porDia(lista, campoFecha) {
    var m = {};
    lista.forEach(function (x) { var k = dayKey(x[campoFecha || 'fecha']); m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).sort().map(function (k) { return { fecha: k, total: m[k] }; });
  }
  function porDiaCliente(lista) {
    var m = {};
    lista.forEach(function (x) {
      var k = dayKey(x.fecha);
      m[k] = m[k] || {};
      m[k][x.cliente] = (m[k][x.cliente] || 0) + 1;
    });
    var out = {};
    Object.keys(m).forEach(function (k) { out[k] = Object.keys(m[k]).map(function (c) { return { cliente: c, total: m[k][c] }; }); });
    return out;
  }
  function recResumen(r) {
    return Object.assign({}, r, { detalle: r.detalle.map(function (x) { return Object.assign({}, x); }) });
  }
  function loteRecord(db, L) {
    var c = L.asignado ? db.consolidados.filter(function (x) { return x.contenedor === L.asignado; })[0] : null;
    return Object.assign({ ok: true }, L, {
      contenedorAsignado: L.asignado || '', consolidado: L.asignado ? 'SI' : '',
      destino: c ? c.destino : '', danioRecepcion: !!L.danioRecepcion,
      danioPreparacion: L.danioPreparacion && String(L.danioPreparacion).toUpperCase() !== 'NO' ? 'SI' : ''
    });
  }

  // ---------------------------------------------------------------- acciones
  var H = {};

  H.verificarLicencia = function () { return { ok: true }; };
  H.login = function () { return { ok: true, nombre: NOMBRE, rol: 'Supervisor', permisos: PERMISOS.slice(), esAdmin: false }; };
  H.registrarDispositivo = function () { return { ok: true, estado: 'APROBADO' }; };
  H.obtenerPermisos = function () { return { ok: true, permisos: PERMISOS.slice(), esAdmin: false }; };
  H.cambiarClave = function () { return { ok: true, msg: 'En la demo la clave no se cambia.' }; };

  H.dashboardResumen = function (b, db) {
    var hoyK = isoDate(new Date());
    var cons = consCompletos(db, b.desde, b.hasta);
    var recs = recEnRango(db, b.desde, b.hasta);
    var preps = prepEnRango(db, hoyK, hoyK);
    var reex = db.reexpediciones.filter(function (x) { return inRange(x.fecha, hoyK, hoyK); });
    var consHoy = cons.filter(function (c) { return dayKey(c.fecha) === hoyK; });
    var recHoy = recs.filter(function (r) { return dayKey(r.fecha) === hoyK; });
    return {
      ok: true,
      hoy: { consolidado: consHoy.length, recepcion: recHoy.length, preparacion: preps.length, reexpedicion: reex.length },
      porDia: porDia(cons), porDiaRecepcion: porDia(recs),
      porDiaCliente: { consolidado: porDiaCliente(cons), recepcion: porDiaCliente(recs) },
      desglose: { consolidado: contarPorCliente(consHoy), recepcion: contarPorCliente(recHoy), preparacion: contarPorCliente(preps), reexpedicion: contarPorCliente(reex) }
    };
  };

  H.stockResumenBodega = function (b, db) {
    var st = stockVigente(db);
    var pc = porClienteSum(st);
    var tot = round(st.reduce(function (s, x) { return s + x.volumen; }, 0), 3);
    return { ok: true, bodega: 'Bodega Central', totalVolumen: tot, capacidadM3: CAPACIDAD_M3, totalLotes: st.length, totalClientes: pc.length, porCliente: pc };
  };

  // ---- recepción
  H.generarNumeroOperacionRecepcion = function (b, db) {
    db.seq.rec++;
    return { ok: true, numero: 'REC-' + String(db.seq.rec).padStart(6, '0') };
  };
  H.validarGuiasRecepcion = function (b, db) {
    var guias = (b.guias || []).map(function (g) { return String(g).toUpperCase(); });
    var rep = [];
    db.recepciones.forEach(function (r) {
      if (String(r.cliente).toUpperCase() !== String(b.cliente || '').toUpperCase()) return;
      (r.guias || []).forEach(function (g) {
        if (guias.indexOf(String(g).toUpperCase()) !== -1) rep.push({ guia: g, fecha: clDate(new Date(r.fecha)), patente: r.patente });
      });
    });
    return { ok: true, repetidas: rep };
  };
  function aplicarRecepcionALotes(db, rec) {
    rec.detalle.forEach(function (x) {
      var k = String(x.lote || '').trim().toUpperCase();
      if (!k || k === 'SIN_CODIGO') return;
      var L = db.lotes[k];
      if (!L) {
        L = db.lotes[k] = {
          lote: k, cliente: rec.cliente, entrega: '', nave: '', reserva: '', marca: '', producto: x.producto || '', clase: '',
          peso: Number(x.peso) || 0, volumen: 2.8, etaNave: '', puerto: '', asignado: '', recepcionado: false,
          ubicacion: '', yaPreparado: false, fechaRecepcion: '', operacionRecepcion: '', fechaPreparacion: ''
        };
      }
      L.recepcionado = true;
      L.ubicacion = [x.bodega, String(x.ubicacion || '').trim().replace(/\s+/, '-')].filter(Boolean).join(' ');
      L.danioRecepcion = !!x.danio && String(x.danio).toUpperCase() !== 'NO';
      L.fechaRecepcion = rec.fecha; L.operacionRecepcion = rec.operacion;
      if (x.producto) L.producto = x.producto;
      if (Number(x.peso)) L.peso = Number(x.peso);
    });
  }
  H.guardarRecepcion = function (b, db) {
    if (b.envioId && db.recepciones.some(function (r) { return r.envioId === b.envioId; })) return { ok: true, duplicado: true };
    if (b.operacion) db.seq.rec--; // el número ya se reservó al iniciar el camión
    var rec = nuevaRecepcion(b, db);
    aplicarRecepcionALotes(db, rec);
    return { ok: true, hoja: b.tipo === 'manual' ? 'RECEPCION_MANUAL' : 'RECEPCION_CODIGO', filas: rec.detalle.length, operacion: rec.operacion };
  };
  H.actualizarRecepcion = function (b, db) {
    var rec = db.recepciones.filter(function (r) { return r.operacion === b.operacion; })[0];
    if (!rec) return H.guardarRecepcion(b, db);
    ['cliente', 'patente', 'guias', 'proteccion'].forEach(function (k) { if (b[k] !== undefined) rec[k] = b[k]; });
    rec.volumenTotal = Number(b.volumenTotal) || rec.volumenTotal;
    rec.detalle = (b.detalle || []).map(function (x) { return sinBase64(Object.assign({}, x)); });
    rec.updatedAt = Date.now();
    recalcularRecepcion(rec);
    aplicarRecepcionALotes(db, rec);
    return { ok: true, filas: rec.detalle.length };
  };
  H.verificarEnvio = function (b, db) {
    return { ok: true, existe: db.recepciones.some(function (r) { return r.envioId && r.envioId === b.envioId; }) };
  };
  H.listarRecepciones = function (b, db) {
    var desde = b.fechaDesde || b.desde, hasta = b.fechaHasta || b.hasta || desde;
    var lista = db.recepciones.filter(function (r) { return inRange(r.fecha, desde, hasta); });
    var texto = String(b.texto || b.busqueda || b.q || '').trim().toUpperCase();
    if (b.cliente) lista = lista.filter(function (r) { return r.cliente === b.cliente; });
    if (texto) {
      lista = db.recepciones.filter(function (r) {
        return [r.operacion, r.patente, r.cliente].concat(r.guias || []).join(' ').toUpperCase().indexOf(texto) !== -1 ||
          r.detalle.some(function (x) { return String(x.lote).toUpperCase() === texto; });
      });
    }
    lista = lista.slice().sort(function (a, b2) { return b2.createdAt - a.createdAt; });
    return { ok: true, data: lista.map(recResumen) };
  };
  H.subirFoto = function () { return { __texto: FOTO_DEMO }; };

  // ---- preparación
  H.listarLotesPreparacion = function (b, db) {
    var out = {};
    Object.keys(db.lotes).forEach(function (k) { out[k] = loteRecord(db, db.lotes[k]); });
    return { ok: true, lotes: out, total: Object.keys(out).length };
  };
  H.buscarLotePreparacion = function (b, db) {
    var L = db.lotes[String(b.lote || '').trim().toUpperCase()];
    if (!L) return { ok: false, msg: 'Lote no encontrado en la base demo.' };
    return loteRecord(db, L);
  };
  H.guardarPreparacionLote = function (b, db) {
    var k = String(b.lote || '').trim().toUpperCase();
    var L = db.lotes[k];
    if (!L) return { ok: false, msg: 'Lote no encontrado.' };
    L.ubicacion = b.ubicacion || L.ubicacion; L.yaPreparado = true; L.fechaPreparacion = new Date().toISOString();
    if (b.producto) L.producto = b.producto;
    L.danioPreparacion = b.danio && String(b.danio).toUpperCase() !== 'NO' ? 'SI' : '';
    db.preparaciones.push({ fecha: L.fechaPreparacion, lote: k, cliente: L.cliente, entrega: L.entrega, nave: L.nave, ubicacion: L.ubicacion, producto: L.producto, peso: L.peso, volumen: L.volumen, supervisor: b.supervisor || SUPERVISOR, servicios: [] });
    return { ok: true };
  };

  H.listarPreparaciones = function (b, db) {
    var lista = prepEnRango(db, b.fechaDesde, b.fechaHasta || b.fechaDesde).slice().sort(function (a, c) { return new Date(c.fecha) - new Date(a.fecha); });
    return {
      ok: true, data: lista.map(function (p) {
        var L = db.lotes[p.lote] || {};
        return { fecha: p.fecha, lote: p.lote, cliente: p.cliente, marca: L.marca || '', producto: p.producto, nave: p.nave, entrega: p.entrega, ubicacion: p.ubicacion, peso: p.peso, volumen: p.volumen, asignado: L.asignado || '', usuario: NOMBRE, observacion: '', danio: L.danioPreparacion === 'SI' ? 'SI' : 'NO', tipoDanio: '', piezasDanadas: 0, observacionDanio: '', linkFotosDanio: '', servicios: (p.servicios || []).join(' + ') };
      })
    };
  };
  H.serviciosDeLote = function (b, db) {
    var k = String(b.lote || '').toUpperCase();
    var out = [];
    db.preparaciones.forEach(function (p) { if (p.lote === k) (p.servicios || []).forEach(function (s) { out.push({ fecha: p.fecha, servicio: s }); }); });
    return { ok: true, data: out };
  };
  H.guardarServiciosAdicionales = function (b, db) {
    var k = String(b.lote || '').toUpperCase();
    var lista = b.servicios || (b.servicio ? [b.servicio] : []);
    var p = db.preparaciones.filter(function (x) { return x.lote === k; }).pop();
    if (p) p.servicios = (p.servicios || []).concat(lista.map(function (s) { return typeof s === 'string' ? s : (s.servicio || s.nombre || 'Servicio'); }));
    return { ok: true };
  };

  // ---- consolidado
  H.listarLotes = function (b, db) {
    return { ok: true, lotes: Object.keys(db.lotes).map(function (k) { return loteRecord(db, db.lotes[k]); }) };
  };
  H.buscarLote = function (b, db) {
    var L = db.lotes[String(b.lote || '').trim().toUpperCase()];
    if (!L) return { ok: false, msg: 'Lote no encontrado en la base demo.' };
    return loteRecord(db, L);
  };

  H.nuevaOperacion = function (b, db) {
    db.seq.cons++;
    return { ok: true, operacion: 'CONS-' + String(db.seq.cons).padStart(6, '0') };
  };
  function upsertConsolidado(db, b, estado) {
    var op = b.operacion || '';
    var c = op ? db.consolidados.filter(function (x) { return x.operacion === op; })[0] : null;
    var creado = b.creado ? new Date(b.creado) : new Date();
    if (!c) {
      c = { operacion: op || ('CONS-' + String(++db.seq.cons).padStart(6, '0')), fecha: creado.toISOString(), horaInicio: hhmm(creado), lotes: [], supervisor: SUPERVISOR };
      db.consolidados.push(c);
    }
    ['cliente', 'linea', 'contenedor', 'tara', 'tipo', 'nave', 'selloLinea', 'trineo', 'envioId'].forEach(function (k) { if (b[k] !== undefined && b[k] !== '') c[k] = b[k]; });
    if (b.selloSAG) c.selloSag = b.selloSAG;
    if (b.maxgross) c.gross = b.maxgross;
    if (Array.isArray(b.lotes)) {
      c.lotes = b.lotes.map(function (r) { return String(r.lote || '').toUpperCase(); }).filter(Boolean);
      c.registros = b.lotes.map(function (r) { return sinBase64(Object.assign({}, r)); });
      var r0 = b.lotes[0] || {};
      c.entrega = r0.entrega || c.entrega || ''; c.reserva = r0.reserva || c.reserva || ''; c.nave = r0.nave || c.nave || '';
    }
    if (!c.destino) { var nv = NAVES.filter(function (n) { return n.nave === c.nave; })[0]; c.destino = nv ? nv.puerto : 'SAN ANTONIO'; }
    c.totalLotes = Number(b.totalLotes) || c.lotes.length;
    c.totalPeso = Number(b.totalPeso) || c.totalPeso || 0;
    c.totalVolumen = Number(b.totalVolumen) || c.totalVolumen || 0;
    c.actualizado = new Date().toISOString();
    c.estado = estado;
    if (estado === 'COMPLETO') {
      c.horaFin = hhmm(new Date());
      c.lotes.forEach(function (l) { if (db.lotes[l]) db.lotes[l].asignado = c.contenedor; });
    }
    return c;
  }
  H.guardarConsolidadoParcial = function (b, db) { var c = upsertConsolidado(db, b, 'PARCIAL'); return { ok: true, operacion: c.operacion }; };
  H.eliminarConsolidadoParcial = function (b, db) {
    db.consolidados = db.consolidados.filter(function (c) { return !(c.estado === 'PARCIAL' && (c.operacion === b.operacion || c.contenedor === b.contenedor)); });
    return { ok: true };
  };
  H.guardarConsolidadoCompleto = function (b, db) {
    if (b.envioId && db.consolidados.some(function (c) { return c.envioId === b.envioId && c.estado === 'COMPLETO'; })) return { ok: true, duplicado: true };
    var c = upsertConsolidado(db, b, 'COMPLETO');
    return { ok: true, operacion: c.operacion, filas: c.lotes.length };
  };
  function consParaLista(db, c) {
    var regs = c.registros || c.lotes.map(function (l) {
      var L = db.lotes[l] || {};
      return { lote: l, entrega: L.entrega, reserva: L.reserva, peso: L.peso, volumen: L.volumen, nave: L.nave, cliente: L.cliente, producto: L.producto, destino: c.destino, cantidad: 1 };
    });
    return {
      operacion: c.operacion, contenedor: c.contenedor, cliente: c.cliente, linea: c.linea, tipo: c.tipo, tara: c.tara,
      maxgross: c.gross, gross: c.gross, selloLinea: c.selloLinea, selloSAG: c.selloSag, nave: c.nave, reserva: c.reserva,
      totalLotes: regs.length, totalPeso: c.totalPeso || pesoCons(db, c), totalVolumen: c.totalVolumen || volCons(db, c),
      creado: c.fecha, actualizado: c.actualizado || c.fecha, estado: c.estado, lotes: regs, carpetaFotos: ''
    };
  }
  H.listarEnviados = function (b, db) {
    return { ok: true, data: consCompletos(db, b.fechaDesde, b.fechaHasta || b.fechaDesde).slice().reverse().map(function (c) { return consParaLista(db, c); }) };
  };
  H.buscarContenedor = function (b, db) {
    var q = String(b.contenedor || '').replace(/\s+/g, '').toUpperCase();
    var regs = db.consolidados.filter(function (c) { return String(c.contenedor || '').replace(/\s+/g, '').toUpperCase().indexOf(q) !== -1; }).map(function (c) { return consParaLista(db, c); });
    return { ok: true, existe: regs.length > 0, registros: regs };
  };
  H.traerConsolidado = function (b, db) {
    var q = String(b.contenedor || '').replace(/\s+/g, '').toUpperCase();
    var c = db.consolidados.filter(function (x) { return String(x.contenedor || '').replace(/\s+/g, '').toUpperCase() === q; }).pop();
    if (!c) return { ok: false, msg: 'Contenedor no encontrado.' };
    return { ok: true, data: consParaLista(db, c) };
  };
  H.cargarContenedor = function (b, db) {
    var r = H.traerConsolidado(b, db);
    if (!r.ok) return r;
    return { ok: true, datos: r.data };
  };
  H.buscarConsolidadoParcial = function (b, db) {
    var c = db.consolidados.filter(function (x) { return x.estado === 'PARCIAL' && (!b.contenedor || x.contenedor === b.contenedor); }).pop();
    return c ? { ok: true, existe: true, data: consParaLista(db, c) } : { ok: true, existe: false };
  };

  H.listarLotesConsolidados = function (b, db) {
    var mapa = {};
    db.consolidados.forEach(function (c) { c.lotes.forEach(function (l) { mapa[l] = { contenedor: c.contenedor, operacion: c.operacion }; }); });
    return { ok: true, mapa: mapa };
  };

  // ---- dashboard ejecutivo e informes
  function filtrosDe(b) {
    var f = Object.assign({}, b.filtros || {});
    f.fechaDesde = f.fechaDesde || b.fechaDesde || '';
    f.fechaHasta = f.fechaHasta || b.fechaHasta || '';
    return f;
  }
  function pasaCliente(f, cli) { return !f.cliente || f.cliente === cli; }
  function lineaDe(nave) { var n = NAVES.filter(function (x) { return x.nave === nave; })[0]; return n ? n.linea : ''; }
  function agrupar(lista, clave, ini, sumar) {
    var m = {}, orden = [];
    lista.forEach(function (x) {
      var k = typeof clave === 'function' ? clave(x) : x[clave];
      if (!m[k]) { m[k] = ini(k); orden.push(k); }
      sumar(m[k], x);
    });
    return orden.map(function (k) { return m[k]; });
  }
  function consFiltrados(db, f) {
    return consCompletos(db, f.fechaDesde, f.fechaHasta).filter(function (c) {
      return pasaCliente(f, c.cliente) && (!f.naviera || lineaDe(c.nave) === f.naviera) && (!f.nave || c.nave === f.nave);
    });
  }
  function consDetalle(db, c) {
    var L0 = db.lotes[c.lotes[0]] || {};
    return { fecha: clDate(new Date(c.fecha)), horaInicio: c.horaInicio, horaFin: c.horaFin, contenedor: c.contenedor, cliente: c.cliente, nave: c.nave, linea: c.linea, entrega: c.entrega, producto: L0.producto || '', puertoDestino: c.destino, trineo: 'NO', m3: volCons(db, c), lotes: c.lotes.length, operacion: c.operacion };
  }

  H.dashboardEjecutivo = function (b, db) {
    var f = filtrosDe(b);
    var cons = consFiltrados(db, f);
    var recs = recEnRango(db, f.fechaDesde, f.fechaHasta).filter(function (r) { return pasaCliente(f, r.cliente); });
    var reex = db.reexpediciones.filter(function (x) { return inRange(x.fecha, f.fechaDesde, f.fechaHasta) && pasaCliente(f, x.cliente); });
    var m3Cons = cons.reduce(function (s, c) { return s + volCons(db, c); }, 0);
    var m3Rec = recs.reduce(function (s, r) { return s + (Number(r.volumenTotal) || 0); }, 0);
    var dias = {};
    cons.concat(recs).forEach(function (x) { dias[dayKey(x.fecha)] = 1; });
    var clientes = {};
    cons.concat(recs).forEach(function (x) { clientes[x.cliente] = 1; });
    var st = stockVigente(db);
    var desde = f.fechaDesde ? parseISO(f.fechaDesde) : lunesDe(new Date());
    var hasta = f.fechaHasta ? parseISO(f.fechaHasta) : new Date();
    var porDiaCons = [];
    for (var d = new Date(desde); dayKey(d) <= dayKey(hasta); d.setDate(d.getDate() + 1)) {
      var k = dayKey(d);
      porDiaCons.push({ fecha: k, total: cons.filter(function (c) { return dayKey(c.fecha) === k; }).length });
      if (porDiaCons.length > 62) break;
    }
    return {
      ok: true,
      kpis: {
        m3Movilizados: round(m3Cons, 1), boxConsolidados: cons.length,
        promedioM3PorBox: cons.length ? round(m3Cons / cons.length, 1) : 0,
        promedioM3PorCamion: recs.length ? round(m3Rec / recs.length, 1) : 0,
        clientesActivos: Object.keys(clientes).length, diasTrabajados: Object.keys(dias).length
      },
      consolidadoPorCliente: agrupar(cons, 'cliente', function (c) { return { cliente: c, contenedores: 0, m3: 0 }; }, function (a, c) { a.contenedores++; a.m3 = round(a.m3 + volCons(db, c), 1); }),
      recepcionPorCliente: agrupar(recs, 'cliente', function (c) { return { cliente: c, camiones: 0, m3: 0, cintas: 0, carpas: 0, cortinas: 0 }; }, function (a, r) {
        a.camiones++; a.m3 = round(a.m3 + (Number(r.volumenTotal) || 0), 1);
        var p = String(r.proteccion || '').toLowerCase();
        if (p === 'cintas') a.cintas++; else if (p === 'carpa') a.carpas++; else if (p === 'cortina') a.cortinas++;
      }),
      reexpedicionPorCliente: agrupar(reex, 'cliente', function (c) { return { cliente: c, m3: 0 }; }, function (a, r) { a.m3 = round(a.m3 + r.volumen, 1); }),
      rankingLineas: agrupar(cons, 'linea', function (l) { return { linea: l, contenedores: 0 }; }, function (a) { a.contenedores++; }).sort(function (a, c) { return c.contenedores - a.contenedores; }),
      contenedoresPorDia: porDiaCons,
      flujoPorDia: porDiaCons.map(function (d) {
        var entrada = recs.filter(function (r) { return dayKey(r.fecha) === d.fecha; }).reduce(function (s, r) { return s + (Number(r.volumenTotal) || 0); }, 0);
        var salida = cons.filter(function (c) { return dayKey(c.fecha) === d.fecha; }).reduce(function (s, c) { return s + volCons(db, c); }, 0) +
          reex.filter(function (x) { return dayKey(x.fecha) === d.fecha; }).reduce(function (s, x) { return s + x.volumen; }, 0);
        return { fecha: d.fecha, entrada: round(entrada, 1), salida: round(salida, 1) };
      }),
      stock: {
        bodega: 'Bodega Central', capacidadM3: CAPACIDAD_M3, totalVolumen: round(st.reduce(function (s, x) { return s + x.volumen; }, 0), 1),
        porCliente: porClienteSum(st)
      },
      opciones: { clientes: CLIENTES.slice(), navieras: NAVES.map(function (n) { return n.linea; }) }
    };
  };

  H.informeStock = function (b, db) {
    var f = filtrosDe(b);
    var st = stockVigente(db).filter(function (L) { return pasaCliente(f, L.cliente) && (!f.producto || L.producto === f.producto); });
    var porCliente = agrupar(st, 'cliente', function (c) { return { cliente: c, m3: 0, lotes: 0, _p: {} }; }, function (a, L) {
      a.m3 = round(a.m3 + L.volumen, 3); a.lotes++;
      a._p[L.producto] = a._p[L.producto] || { producto: L.producto, m3: 0, lotes: 0 };
      a._p[L.producto].m3 = round(a._p[L.producto].m3 + L.volumen, 3); a._p[L.producto].lotes++;
    }).map(function (c) { c.porProducto = Object.keys(c._p).map(function (k) { return c._p[k]; }); delete c._p; return c; });
    var porProducto = agrupar(st, 'producto', function (p) { return { producto: p, m3: 0, lotes: 0, _c: {} }; }, function (a, L) {
      a.m3 = round(a.m3 + L.volumen, 3); a.lotes++; a._c[L.cliente] = 1;
    }).map(function (p) { p.clientes = Object.keys(p._c).length; delete p._c; return p; });
    var hoy = Date.now();
    var antig = st.map(function (L) {
      return { lote: L.lote, cliente: L.cliente, producto: L.producto, volumen: L.volumen, diasEnBodega: Math.max(0, Math.floor((hoy - new Date(L.fechaRecepcion).getTime()) / 86400000)) };
    }).sort(function (a, c) { return c.diasEnBodega - a.diasEnBodega; });
    var tot = round(st.reduce(function (s, x) { return s + x.volumen; }, 0), 3);
    return {
      ok: true, bodega: 'Bodega Central', capacidadM3: CAPACIDAD_M3, totalVolumen: tot, totalLotes: st.length,
      porCliente: porCliente, porProducto: porProducto, antiguedad: antig,
      detalle: st.map(function (L) { return { lote: L.lote, cliente: L.cliente, producto: L.producto, marca: L.marca, entrega: L.entrega, nave: L.nave, ubicacion: L.ubicacion, volumen: L.volumen, peso: L.peso, guia: '', contenedor: '', reexpedicion: '' }; }),
      opciones: { clientes: CLIENTES.slice(), productos: Object.keys(PRODUCTOS).reduce(function (a, c) { return a.concat(PRODUCTOS[c]); }, []) }
    };
  };

  H.informeConsolidado = function (b, db) {
    var f = filtrosDe(b);
    var cons = consFiltrados(db, f);
    var det = cons.map(function (c) { return consDetalle(db, c); });
    var porCliente = agrupar(det, 'cliente', function (c) { return { cliente: c, contenedores: 0, m3: 0, trineos: 0 }; }, function (a, d) { a.contenedores++; a.m3 = round(a.m3 + d.m3, 2); });
    var porNaviera = agrupar(det, 'linea', function (l) { return { linea: l, contenedores: 0, m3: 0 }; }, function (a, d) { a.contenedores++; a.m3 = round(a.m3 + d.m3, 2); });
    var porNave = agrupar(det, 'nave', function (n) { return { nave: n, contenedores: 0, m3: 0, trineos: 0, _c: {} }; }, function (a, d) {
      a.contenedores++; a.m3 = round(a.m3 + d.m3, 2);
      a._c[d.cliente] = a._c[d.cliente] || { cliente: d.cliente, contenedores: 0, m3: 0 };
      a._c[d.cliente].contenedores++; a._c[d.cliente].m3 = round(a._c[d.cliente].m3 + d.m3, 2);
    }).map(function (n) { n.porCliente = Object.keys(n._c).map(function (k) { return n._c[k]; }); delete n._c; return n; });
    var porClienteProducto = agrupar(det, 'cliente', function (c) { return { cliente: c, _p: {} }; }, function (a, d) {
      a._p[d.producto] = a._p[d.producto] || { producto: d.producto, contenedores: 0, m3: 0 };
      a._p[d.producto].contenedores++; a._p[d.producto].m3 = round(a._p[d.producto].m3 + d.m3, 2);
    }).map(function (c) { c.porProducto = Object.keys(c._p).map(function (k) { return c._p[k]; }); delete c._p; return c; });
    return {
      ok: true, totalContenedores: det.length, totalM3: round(det.reduce(function (s, d) { return s + d.m3; }, 0), 2),
      porCliente: porCliente, porNaviera: porNaviera, porNave: porNave, porClienteProducto: porClienteProducto,
      trineo: { si: { contenedores: 0, m3: 0 }, no: { contenedores: det.length, m3: 0 } },
      detalle: det.sort(function (a, c) { return a.fecha < c.fecha ? -1 : 1; }),
      opciones: { clientes: CLIENTES.slice(), navieras: NAVES.map(function (n) { return n.linea; }) }
    };
  };

  H.informeRecepcion = function (b, db) {
    var f = filtrosDe(b);
    var recs = recEnRango(db, f.fechaDesde, f.fechaHasta).filter(function (r) { return pasaCliente(f, r.cliente); })
      .sort(function (a, c) { return a.createdAt - c.createdAt; });
    var det = recs.map(function (r) {
      var conDanio = r.detalle.some(function (x) { return String(x.danio).toUpperCase() === 'SI'; });
      return { fecha: clDate(new Date(r.fecha)), horaFin: hhmm(new Date(r.closedAt)), horaInicio: hhmm(new Date(r.createdAt)), patente: r.patente, cliente: r.cliente, m3: Number(r.volumenTotal) || 0, guia: (r.guias || []).join(' / '), lotes: r.detalle.length, danio: conDanio ? 'SI' : 'NO', proteccion: r.proteccion, operacion: r.operacion };
    });
    var prot = { cintas: 0, carpa: 0, cortina: 0, sinDato: 0 };
    det.forEach(function (d) { var p = String(d.proteccion || '').toLowerCase(); if (prot[p] !== undefined) prot[p]++; else prot.sinDato++; });
    return {
      ok: true, totalCamiones: det.length, totalLotes: det.reduce(function (s, d) { return s + d.lotes; }, 0),
      totalM3: round(det.reduce(function (s, d) { return s + d.m3; }, 0), 1), totalConDanio: det.filter(function (d) { return d.danio === 'SI'; }).length,
      porCliente: agrupar(det, 'cliente', function (c) { return { cliente: c, camiones: 0, lotes: 0, m3: 0, conDanio: 0 }; }, function (a, d) { a.camiones++; a.lotes += d.lotes; a.m3 = round(a.m3 + d.m3, 1); if (d.danio === 'SI') a.conDanio++; }),
      porProteccion: prot, detalle: det,
      opciones: { clientes: CLIENTES.slice() }
    };
  };

  H.informeReexpedicion = function (b, db) {
    var f = filtrosDe(b);
    var lista = db.reexpediciones.filter(function (x) { return inRange(x.fecha, f.fechaDesde, f.fechaHasta) && pasaCliente(f, x.cliente); });
    var det = [];
    lista.forEach(function (x) {
      (x.detalle || []).forEach(function (d) { det.push({ fecha: clDate(new Date(x.fecha)), operacion: x.operacion, lote: d.lote, cliente: x.cliente, entrega: d.entrega, nave: d.nave, producto: d.producto, peso: d.peso, m3: Number(d.volumen) || 0 }); });
    });
    return {
      ok: true, totalLotes: det.length, totalM3: round(det.reduce(function (s, d) { return s + d.m3; }, 0), 1),
      porCliente: agrupar(det, 'cliente', function (c) { return { cliente: c, lotes: 0, m3: 0 }; }, function (a, d) { a.lotes++; a.m3 = round(a.m3 + d.m3, 1); }),
      porProducto: agrupar(det, 'producto', function (p) { return { producto: p, lotes: 0, m3: 0 }; }, function (a, d) { a.lotes++; a.m3 = round(a.m3 + d.m3, 1); }),
      detalle: det
    };
  };

  H.informeServicios = function (b, db) {
    var f = filtrosDe(b);
    var det = db.preparaciones.filter(function (p) { return p.servicios && p.servicios.length && inRange(p.fecha, f.fechaDesde, f.fechaHasta) && pasaCliente(f, p.cliente); })
      .map(function (p) { return { fecha: clDate(new Date(p.fecha)), lote: p.lote, cliente: p.cliente, producto: p.producto, servicio: p.servicios.join(' + '), m3: p.volumen }; });
    return {
      ok: true, totalRegistros: det.length, totalLotes: det.length, totalM3: round(det.reduce(function (s, d) { return s + d.m3; }, 0), 1),
      porTipo: agrupar(det, 'servicio', function (s) { return { servicio: s, cantidad: 0, lotes: 0 }; }, function (a) { a.cantidad++; a.lotes++; }),
      porCliente: agrupar(det, 'cliente', function (c) { return { cliente: c, cantidad: 0, lotes: 0 }; }, function (a) { a.cantidad++; a.lotes++; }),
      detalle: det
    };
  };

  // ---- reexpedición (despacho)
  H.generarNumeroOperacionReexpedicion = function (b, db) {
    db.seq.reex++;
    return { ok: true, numero: 'REX-' + String(db.seq.reex).padStart(6, '0') };
  };
  H.listarLotesReex = function (b, db) {
    return { ok: true, lotes: stockVigente(db).map(function (L) { return loteRecord(db, L); }) };
  };
  H.buscarLoteReex = function (b, db) {
    var L = db.lotes[String(b.lote || '').trim().toUpperCase()];
    if (!L) return { ok: false, msg: 'Lote no encontrado en la base demo.' };
    if (!L.recepcionado) return { ok: false, msg: 'El lote todavía no ha sido recepcionado.' };
    return loteRecord(db, L);
  };
  H.listarDespachados = function (b, db) {
    var mapa = {};
    db.reexpediciones.forEach(function (x) { (x.detalle || []).forEach(function (d) { mapa[d.lote] = { operacion: x.operacion, patente: x.patente }; }); });
    return { ok: true, mapa: mapa };
  };
  H.guardarReexpedicion = function (b, db) {
    if (b.envioId && db.reexpediciones.some(function (x) { return x.envioId === b.envioId; })) return { ok: true, duplicado: true, filas: 0 };
    var op = b.operacion || ('REX-' + String(++db.seq.reex).padStart(6, '0'));
    var det = (b.detalle || []).map(function (d) { return sinBase64(Object.assign({}, d)); });
    det.forEach(function (d) { var L = db.lotes[String(d.lote || '').toUpperCase()]; if (L) L.asignado = 'DESPACHO ' + op; });
    db.reexpediciones.push({ operacion: op, envioId: b.envioId || '', fecha: b.fecha || new Date().toISOString(), cliente: b.cliente, patente: b.patente, destino: '', lotes: det.length, volumen: round(det.reduce(function (t, d) { return t + (Number(d.volumen) || 0); }, 0), 2), supervisor: b.supervisor || SUPERVISOR, encarpado: b.encarpado || 'NO', detalle: det });
    return { ok: true, filas: det.length };
  };
  H.listarReexpediciones = function (b, db) {
    var lista = db.reexpediciones.filter(function (x) { return inRange(x.fecha, b.fechaDesde, b.fechaHasta || b.fechaDesde); })
      .slice().sort(function (a, c) { return new Date(c.fecha) - new Date(a.fecha); });
    return {
      ok: true, data: lista.map(function (x) {
        return { operacion: x.operacion, guias: x.operacion, fecha: x.fecha, cliente: x.cliente, patente: x.patente, supervisor: x.supervisor, totalItems: (x.detalle || []).length, totalPeso: (x.detalle || []).reduce(function (t, d) { return t + (Number(d.peso) || 0); }, 0), encarpado: x.encarpado, detalle: x.detalle || [] };
      })
    };
  };

  H.informeGeneral = function (b, db) {
    var f = filtrosDe(b);
    if (!f.fechaDesde) { var l = lunesDe(new Date()); f.fechaDesde = isoDate(l); f.fechaHasta = isoDate(new Date()); }
    var cons = consFiltrados(db, f), recs = recEnRango(db, f.fechaDesde, f.fechaHasta).filter(function (r) { return pasaCliente(f, r.cliente); });
    var preps = prepEnRango(db, f.fechaDesde, f.fechaHasta).filter(function (p) { return pasaCliente(f, p.cliente); });
    var reex = db.reexpediciones.filter(function (x) { return inRange(x.fecha, f.fechaDesde, f.fechaHasta) && pasaCliente(f, x.cliente); });
    var c = { total: cons.length, m3: 0, trineos: 0, porCliente: {}, porNave: {} };
    cons.forEach(function (x) {
      var v = volCons(db, x); c.m3 += v;
      var pc = c.porCliente[x.cliente] = c.porCliente[x.cliente] || { box: 0, m3: 0, trineos: 0 }; pc.box++; pc.m3 += v;
      var pn = c.porNave[x.nave] = c.porNave[x.nave] || { box: 0, m3: 0, trineos: 0, clientes: {} }; pn.box++; pn.m3 += v;
      var pnc = pn.clientes[x.cliente] = pn.clientes[x.cliente] || { box: 0, m3: 0, trineos: 0 }; pnc.box++; pnc.m3 += v;
    });
    var r = { camiones: recs.length, lotes: 0, m3: 0, conDanio: 0, porCliente: {} };
    recs.forEach(function (x) {
      var pc = r.porCliente[x.cliente] = r.porCliente[x.cliente] || { camiones: 0, lotes: 0, m3: 0, proteccion: { cintas: 0, carpa: 0, cortina: 0 } };
      pc.camiones++; pc.lotes += x.detalle.length; pc.m3 += Number(x.volumenTotal) || 0;
      var pk = String(x.proteccion || '').toLowerCase(); if (pc.proteccion[pk] !== undefined) pc.proteccion[pk]++;
      r.lotes += x.detalle.length; r.m3 += Number(x.volumenTotal) || 0;
      if (x.detalle.some(function (d) { return String(d.danio).toUpperCase() === 'SI'; })) r.conDanio++;
    });
    var p = { lotes: preps.length, m3: 0, porCliente: {} };
    preps.forEach(function (x) { var pc = p.porCliente[x.cliente] = p.porCliente[x.cliente] || { lotes: 0, m3: 0 }; pc.lotes++; pc.m3 += x.volumen; p.m3 += x.volumen; });
    var d = { operaciones: reex.length, lotes: 0, m3: 0, encarpados: 0, porCliente: {}, periodoDesde: clDate(parseISO(f.fechaDesde)), periodoHasta: clDate(parseISO(f.fechaHasta)) };
    reex.forEach(function (x) {
      var pc = d.porCliente[x.cliente] = d.porCliente[x.cliente] || { operaciones: 0, lotes: 0, m3: 0, encarpados: 0 };
      pc.operaciones++; pc.lotes += x.lotes; pc.m3 += x.volumen; d.lotes += x.lotes; d.m3 += x.volumen;
      if (x.encarpado === 'SI') { pc.encarpados++; d.encarpados++; }
    });
    var s = { total: 0, porTipo: {}, porTipoCliente: {} };
    preps.forEach(function (x) { (x.servicios || []).forEach(function (t) {
      s.total++; s.porTipo[t] = (s.porTipo[t] || 0) + 1;
      var tc = s.porTipoCliente[t] = s.porTipoCliente[t] || {}; tc[x.cliente] = tc[x.cliente] || { cantidad: 0, m3: 0 }; tc[x.cliente].cantidad++; tc[x.cliente].m3 += x.volumen;
    }); });
    return { ok: true, consolidado: c, recepcion: r, preparacion: p, despacho: d, servicios: s, opciones: { clientes: CLIENTES.slice(), productos: [] } };
  };

  // ---- herramientas
  H.trazarLote = function (b, db) {
    var k = String(b.lote || '').trim().toUpperCase();
    var L = db.lotes[k];
    if (!L) return { ok: false, msg: 'El lote ' + k + ' no existe en la base demo.' };
    var cons = db.consolidados.filter(function (c) { return c.lotes.indexOf(k) !== -1; }).pop();
    var desp = db.reexpediciones.filter(function (x) { return (x.detalle || []).some(function (d) { return d.lote === k; }); }).pop();
    var ev = [];
    db.recepciones.forEach(function (r) {
      var d = r.detalle.filter(function (x) { return String(x.lote).toUpperCase() === k; })[0];
      if (d) ev.push({ tipo: 'RECEPCION', fuente: 'RECEPCION_CODIGO', fecha: r.horaTermino, operacion: r.operacion, cliente: r.cliente, patente: r.patente, guia: (r.guias || []).join(' / '), bodega: d.bodega, ubicacion: d.ubicacion, usuario: NOMBRE, danio: d.danio });
    });
    db.preparaciones.forEach(function (p2) { if (p2.lote === k) ev.push({ tipo: 'PREPARACION', fuente: 'PREPARACION', fecha: p2.fecha, cliente: p2.cliente, ubicacion: p2.ubicacion, nave: p2.nave, usuario: NOMBRE }); });
    if (cons) ev.push({ tipo: 'CONSOLIDADO', fuente: 'CONSOLIDADO', fecha: cons.fecha, operacion: cons.operacion, cliente: cons.cliente, contenedor: cons.contenedor, nave: cons.nave, usuario: NOMBRE });
    if (desp) ev.push({ tipo: 'DESPACHO', fuente: 'REEXPEDICION', fecha: desp.fecha, operacion: desp.operacion, cliente: desp.cliente, patente: desp.patente, usuario: NOMBRE });
    ev.sort(function (a, c) { return new Date(a.fecha) - new Date(c.fecha); });
    var estado = desp ? 'DESPACHADO' : (cons && cons.estado === 'COMPLETO') ? 'CONSOLIDADO' : L.recepcionado ? 'VIGENTE' : 'SIN_REGISTRO';
    return {
      ok: true, lote: k,
      maestro: { entrega: L.entrega, material: L.marca, nave: L.nave, reserva: L.reserva, producto: L.producto, destino: (NAVES.filter(function (n) { return n.nave === L.nave; })[0] || {}).puerto || '', puertoEmbarque: 'SAN ANTONIO', volumen: L.volumen, peso: L.peso, contenedorAsignado: cons && cons.estado === 'COMPLETO' ? cons.contenedor : '' },
      stock: { estado: estado, ubicacion: L.ubicacion, marca: L.marca, contenedor: cons ? cons.contenedor : '', recepcionado: L.recepcionado ? 'SI' : 'NO', consolidado: cons && cons.estado === 'COMPLETO' ? 'SI' : 'NO', despachado: desp ? 'SI' : 'NO' },
      eventos: ev
    };
  };

  H.packingListGeneral = function (b, db) {
    var f = b.filtros || {};
    var lotes = Object.keys(db.lotes).map(function (k) { return db.lotes[k]; }).filter(function (L) {
      if (f.entrega && String(L.entrega).toUpperCase() !== String(f.entrega).toUpperCase()) return false;
      if (f.cliente && L.cliente !== f.cliente) return false;
      if (f.nave && String(L.nave).toUpperCase().indexOf(String(f.nave).toUpperCase()) === -1) return false;
      if (f.soloPendientes && L.asignado) return false;
      return true;
    });
    var entregas = agrupar(lotes, 'entrega', function (e) { return { entrega: e, cliente: '', nave: '', ct: '', grupoEntr: '', totalLotes: 0, totalM3: 0, lotes: [] }; }, function (a, L) {
      a.cliente = L.cliente; a.nave = L.nave; a.totalLotes++; a.totalM3 = round(a.totalM3 + L.volumen, 3);
      a.lotes.push({ lote: L.lote, marca: L.marca, material: L.marca, producto: L.producto, peso: L.peso, volumen: L.volumen, ubicacion: L.ubicacion || 'Sin recepcionar', consolidado: L.asignado ? 'SI' : '', contenedorAsignado: L.asignado || '' });
    });
    if (!entregas.length) return { ok: false, msg: 'No hay lotes para ese filtro en la demo. Prueba con la entrega ENT-2280.' };
    return { ok: true, entregas: entregas };
  };

  H.resumenPorNave = function (b, db) {
    var f = b.filtros || {};
    var cons = consCompletos(db).filter(function (c) { return (!f.cliente || c.cliente === f.cliente) && (!f.nave || String(c.nave).toUpperCase().indexOf(String(f.nave).toUpperCase()) !== -1); });
    var naves = agrupar(cons, 'nave', function (n) { return { nave: n, totalContenedores: 0, totalEntregas: 0, totalLotes: 0, totalPeso: 0, totalVolumen: 0, contenedores: [], _e: {} }; }, function (a, c) {
      var v = volCons(db, c), pz = pesoCons(db, c);
      a.totalContenedores++; a.totalLotes += c.lotes.length; a.totalPeso += pz; a.totalVolumen = round(a.totalVolumen + v, 3); a._e[c.entrega] = 1;
      a.contenedores.push({ contenedor: c.contenedor, cliente: c.cliente, entrega: c.entrega, reserva: c.reserva, destino: c.destino, fecha: c.fecha, tipo: c.tipo, selloLinea: c.selloLinea, selloSAG: c.selloSag, pesoCarga: pz, totalLotes: c.lotes.length, totalVolumen: v });
    }).map(function (n) { n.totalEntregas = Object.keys(n._e).length; delete n._e; return n; });
    return { ok: true, naves: naves };
  };

  H.detalleNave = function (b, db) {
    var r = H.informeConsolidado({ filtros: { nave: b.nave } }, db);
    var det = [];
    consCompletos(db).filter(function (c) { return c.nave === b.nave; }).forEach(function (c) {
      c.lotes.forEach(function (l) { var L = db.lotes[l] || {}; det.push({ lote: l, cliente: c.cliente, contenedor: c.contenedor, entrega: L.entrega, reserva: L.reserva, producto: L.producto, peso: L.peso, volumen: L.volumen, puertoDestino: c.destino }); });
    });
    r.detalle = det;
    return r;
  };

  // ---- dashboard TV
  H.avanceNaves = function (b, db) {
    return {
      ok: true, naves: db.metas.map(function (m) {
        var cons = db.consolidados.filter(function (c) { return c.estado === 'COMPLETO' && c.nave === m.nave && c.cliente === m.cliente; }).length;
        return { nave: m.nave, semana: m.semana, cliente: m.cliente, consolidados: cons, total: Math.max(m.total, cons) };
      })
    };
  };
  H.listarConsolidadosParciales = function (b, db) {
    return {
      ok: true, parciales: db.consolidados.filter(function (c) { return c.estado === 'PARCIAL'; }).map(function (c) {
        return { supervisor: NOMBRE, fecha: clDate(new Date(c.fecha)).replace(/\//g, '-'), horaInicio: c.horaInicio, contenedor: c.contenedor, cliente: c.cliente, nave: c.nave, operacion: c.operacion, lotes: c.lotes.length, totalLotes: c.lotes.length, totalPeso: c.totalPeso || pesoCons(db, c), totalVolumen: c.totalVolumen || volCons(db, c), actualizado: c.actualizado || c.fecha };
      })
    };
  };
  H.listarMovimientosGateControl = function (b, db) {
    return { ok: true, movimientos: db.gate.filter(function (m) { return inRange(m.fecha, b.fechaDesde, b.fechaHasta); }) };
  };
  H.ultimosPreparados = function (b, db) {
    var lista = db.preparaciones.slice().sort(function (a, c) { return new Date(c.fecha) - new Date(a.fecha); }).slice(0, b.limite || 8);
    return { ok: true, items: lista.map(function (p) { return { lote: p.lote, cliente: p.cliente, ubicacion: p.ubicacion, m3: p.volumen, servicios: p.servicios || [] }; }) };
  };
  H.historicoOcupacionBodega = function (b, db) {
    var hoy = new Date(); var items = [];
    var actual = stockVigente(db).reduce(function (s, x) { return s + x.volumen; }, 0);
    for (var k = (b.dias || 60) - 1; k >= 0; k--) {
      var d = new Date(hoy); d.setDate(hoy.getDate() - k);
      var v = round(actual * (0.78 + 0.18 * Math.sin(k / 6.5) + 0.05 * Math.sin(k / 2.1)) + (k === 0 ? 0 : 0), 1);
      if (k === 0) v = round(actual, 1);
      items.push({ fecha: isoDate(d), totalVolumen: v, pctOcupacion: v / CAPACIDAD_M3 * 100 });
    }
    var max = items.reduce(function (a, c) { return c.totalVolumen > a.totalVolumen ? c : a; });
    var min = items.reduce(function (a, c) { return c.totalVolumen < a.totalVolumen ? c : a; });
    return { ok: true, items: items, maxItem: max, minItem: min };
  };

  // ---------------------------------------------------------------- despacho
  function manejar(body) {
    var db = cargar();
    var h = H[body.accion];
    if (!h) {
      window.CapturaBoxDemo.sinManejar.push(body.accion);
      console.warn('[DEMO] acción sin simular:', body.accion, body);
      return { ok: false, msg: 'Esta función no está disponible en la demo.' };
    }
    var res;
    try { res = h(body, db); } catch (e) { console.error('[DEMO] error en', body.accion, e); res = { ok: false, msg: 'Error en la demo: ' + e.message }; }
    guardar();
    return res;
  }
  window.CapturaBoxDemo.manejar = manejar;
  window.CapturaBoxDemo.H = H;

  var realFetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    var u = typeof url === 'string' ? url : (url && url.url) || '';
    if (u.indexOf('script.google.com') !== -1 || u.indexOf('script.googleusercontent.com') !== -1) {
      var body = {};
      try { body = JSON.parse((opts && opts.body) || '{}'); } catch (e) { body = {}; }
      var res = manejar(body);
      var espera = 120 + Math.floor(Math.random() * 230);
      var texto = res && res.__texto !== undefined ? String(res.__texto) : JSON.stringify(res);
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(new Response(texto, { status: 200, headers: { 'Content-Type': res && res.__texto !== undefined ? 'text/plain' : 'application/json' } }));
        }, espera);
      });
    }
    return realFetch(url, opts);
  };
})();
