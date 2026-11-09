/**
 * Despensa de emergencia — Google Apps Script
 * Guarda el inventario en este Google Sheet y lo sirve como app web.
 *
 * Si este proyecto NO se abrió desde el Sheet (Extensiones > Apps Script),
 * pega aquí el ID del Sheet (la parte larga de su URL entre /d/ y /edit).
 */
const SHEET_ID = ''; // Ej.: '1lD5m...'. Déjalo vacío si el script se creó desde el Sheet.

const HOJA_ART = 'Articulos';
const HOJA_CFG = 'Config';
const COLS = ['ID', 'Sección', 'Artículo', 'Para', 'Necesitan', 'Tienen', 'Faltan', 'Vence', 'Propio', 'Cantidad propia', 'Creado', 'Actualizado'];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'cargar') {
    try { return json_(cargar()); } catch (err) { return json_({ error: String(err.message || err) }); }
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Despensa de emergencia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/** Guardar desde el HTML abierto fuera de Apps Script (POST con JSON). */
function doPost(e) {
  try { return json_(guardar(JSON.parse(e.postData.contents))); }
  catch (err) { return json_({ error: String(err.message || err) }); }
}

function libro_() {
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('El script no está unido a un Sheet. Pega el ID del Sheet en SHEET_ID (línea 8) y vuelve a implementar con "Nueva versión".');
  return ss;
}

/** Ejecuta esta función desde el editor para probar la conexión con el Sheet. */
function probar() {
  const ss = libro_();
  const r = cargar();
  Logger.log('Conectado a: ' + ss.getName() + ' · artículos guardados: ' + r.items.length);
}

function hojaArticulos_() {
  const ss = libro_();
  let sh = ss.getSheetByName(HOJA_ART);
  if (!sh) sh = ss.insertSheet(HOJA_ART);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold');
    sh.getRange('A:A').setNumberFormat('@'); // ID como texto
    sh.getRange('H:H').setNumberFormat('@'); // Vence como texto AAAA-MM
  }
  return sh;
}

function hojaConfig_() {
  const ss = libro_();
  let sh = ss.getSheetByName(HOJA_CFG);
  if (!sh) {
    sh = ss.insertSheet(HOJA_CFG);
    sh.getRange(1, 1, 4, 2).setValues([['Clave', 'Valor'], ['adults', 3], ['kids', 1], ['days', 7]]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function textoMes_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM');
  const s = String(v || '').trim();
  return /^\d{4}-\d{2}$/.test(s) ? s : '';
}

/** Devuelve la configuración y todos los artículos guardados. */
function cargar() {
  const cfgVals = hojaConfig_().getDataRange().getValues();
  const cfg = {};
  cfgVals.slice(1).forEach(function (r) { if (r[0]) cfg[r[0]] = Number(r[1]); });

  const sh = hojaArticulos_();
  const last = sh.getLastRow();
  const items = [];
  if (last > 1) {
    sh.getRange(2, 1, last - 1, COLS.length).getValues().forEach(function (r) {
      if (!r[0]) return;
      const propio = r[8] === true || r[8] === 'Sí';
      items.push({
        id: String(r[0]), sec: String(r[1] || ''), name: String(r[2] || ''), who: String(r[3] || ''),
        have: Number(r[5]) || 0, exp: textoMes_(r[7]), custom: propio,
        n: Number(r[9]) || 1, created: Number(r[10]) || 0
      });
    });
  }
  return { cfg: cfg, items: items };
}

/** Recibe {cfg, items:[...]} y actualiza el Sheet. Devuelve el estado completo. */
function guardar(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (payload && payload.cfg) {
      hojaConfig_().getRange(2, 1, 3, 2).setValues([
        ['adults', payload.cfg.adults], ['kids', payload.cfg.kids], ['days', payload.cfg.days]
      ]);
    }
    const sh = hojaArticulos_();
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    const fila = {};
    ids.forEach(function (id, i) { if (id) fila[id] = i + 2; });

    const nuevas = [];
    const borrar = [];
    const ahora = new Date();
    (payload && payload.items || []).forEach(function (it) {
      if (!it || !it.id) return;
      if (it.del) { if (fila[it.id]) borrar.push(fila[it.id]); return; }
      const need = Number(it.need) || 1;
      const have = Math.max(0, Number(it.have) || 0);
      const row = [it.id, it.sec || '', it.name || '', it.who || '', need, have, Math.max(0, need - have),
        it.exp || '', it.custom ? 'Sí' : '', it.custom ? (Number(it.n) || 1) : '', it.created || '', ahora];
      if (fila[it.id]) sh.getRange(fila[it.id], 1, 1, COLS.length).setValues([row]);
      else nuevas.push(row);
    });
    if (nuevas.length) sh.getRange(sh.getLastRow() + 1, 1, nuevas.length, COLS.length).setValues(nuevas);
    borrar.sort(function (a, b) { return b - a; }).forEach(function (r) { sh.deleteRow(r); });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return cargar();
}
