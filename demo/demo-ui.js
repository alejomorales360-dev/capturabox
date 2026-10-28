/* CapturaBox — MODO DEMO: insignia "DEMO" y ayudas de acceso. */
(function () {
  'use strict';
  var esTV = /\/tv\/?(index\.html)?$/.test(location.pathname);
  var FONT = '-apple-system,Segoe UI,Roboto,Arial,sans-serif';

  function insignia() {
    if (document.getElementById('cbDemoBadge')) return;
    var wrap = document.createElement('div');
    wrap.id = 'cbDemoBadge';
    wrap.setAttribute('style', 'position:fixed;' + (esTV ? 'bottom:10px;' : 'top:8px;') + 'right:8px;z-index:2147483000;font-family:' + FONT + ';');
    var item = 'display:block;width:100%;text-align:left;border:none;background:none;padding:10px 14px;font:700 13px/1.2 ' + FONT + ';color:#0b3c5d;cursor:pointer;text-decoration:none;box-sizing:border-box;';
    wrap.innerHTML =
      '<button type="button" id="cbDemoBtn" style="border:none;border-radius:999px;padding:5px 10px;background:#42b0d5;color:#06223a;' +
        'font:800 11px/1 ' + FONT + ';letter-spacing:.6px;box-shadow:0 3px 10px rgba(0,0,0,.25);cursor:pointer;">DEMO ▾</button>' +
      '<div id="cbDemoMenu" style="display:none;position:absolute;right:0;' + (esTV ? 'bottom:30px;' : 'top:30px;') + 'min-width:230px;background:#fff;border-radius:12px;' +
        'box-shadow:0 10px 30px rgba(0,0,0,.25);overflow:hidden;">' +
        '<div style="padding:10px 14px;font:600 12px/1.4 ' + FONT + ';color:#5a6b77;border-bottom:1px solid #eef2f5;">' +
          'Estás en una <b style="color:#0b3c5d;">demo con datos ficticios</b>. Lo que hagas queda solo en este navegador.</div>' +
        (esTV
          ? '<a href="../" style="' + item + '">← Volver a la app</a>'
          : '<a href="tv/" target="_blank" rel="noopener" style="' + item + '">📺 Abrir dashboard TV</a>') +
        (esTV ? '' : '<button type="button" id="cbDemoLotes" style="' + item + '">🔢 Lotes de ejemplo para probar</button>') +
        '<button type="button" id="cbDemoReiniciar" style="' + item + 'color:#c0392b;">↺ Reiniciar datos de la demo</button>' +
      '</div>';
    document.body.appendChild(wrap);
    var menu = document.getElementById('cbDemoMenu');
    document.getElementById('cbDemoBtn').onclick = function (e) { e.stopPropagation(); menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; };
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) menu.style.display = 'none'; });
    var btnLotes = document.getElementById('cbDemoLotes');
    if (btnLotes) btnLotes.onclick = function () { menu.style.display = 'none'; panelLotes(); };
    document.getElementById('cbDemoReiniciar').onclick = function () {
      if (confirm('¿Reiniciar la demo? Se borran los cambios que hiciste y vuelven los datos de ejemplo.')) window.CapturaBoxDemo.reiniciar();
    };
  }

  // Campos de escaneo de la app: al tocar un lote de ejemplo se carga en el que esté a la vista.
  var CAMPOS = ['scannerInput', 'prep_lote', 'rx_lote', 'lote', 'trazar_lote'];
  function campoVisible() {
    for (var i = 0; i < CAMPOS.length; i++) {
      var el = document.getElementById(CAMPOS[i]);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }

  function aviso(txt) {
    var t = document.createElement('div');
    t.setAttribute('style', 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483001;background:#0b3c5d;color:#fff;' +
      'padding:10px 16px;border-radius:12px;font:600 13px/1.35 ' + FONT + ';box-shadow:0 8px 24px rgba(0,0,0,.3);max-width:86vw;text-align:center;');
    t.textContent = txt;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  function usarLote(lote) {
    var el = campoVisible();
    try { navigator.clipboard && navigator.clipboard.writeText(lote); } catch (e) { /* sin permiso: igual se carga en el campo */ }
    cerrarPanel();
    if (!el) { aviso('Lote ' + lote + ' copiado. Abre una pantalla de escaneo y pégalo.'); return; }
    el.value = lote;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
    if (el.id === 'prep_lote' && typeof window.procesarLotePreparacion === 'function') window.procesarLotePreparacion();
    else if (el.id === 'scannerInput' && typeof window.procesarScanner === 'function') window.procesarScanner();
    else el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    if (el.id === 'lote') aviso('Lote cargado. Completa producto, peso y ubicación, y presiona Guardar lote.');
  }

  function cerrarPanel() { var p = document.getElementById('cbDemoPanel'); if (p) p.remove(); }

  function panelLotes() {
    cerrarPanel();
    var s = window.CapturaBoxDemo.sugerencias();
    var chip = function (x) {
      return '<button type="button" data-lote="' + x.lote + '" style="margin-top:0;display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;' +
        'border:1px solid #e3e9ee;background:#f7fafc;border-radius:10px;padding:9px 12px;margin:0 0 6px;cursor:pointer;font:inherit;text-align:left;">' +
        '<b style="font:800 15px/1 ui-monospace,Menlo,monospace;color:#0b3c5d;letter-spacing:.5px;">' + x.lote + '</b>' +
        '<span style="font-size:11px;color:#7a8b95;">' + (x.info || '') + '</span></button>';
    };
    var seccion = function (titulo, ayuda, lista) {
      if (!lista || !lista.length) return '';
      return '<div style="margin:14px 0 6px;font-weight:800;color:#0b3c5d;font-size:13px;">' + titulo + '</div>' +
        '<div style="font-size:12px;color:#5a6b77;margin-bottom:8px;">' + ayuda + '</div>' + lista.map(chip).join('');
    };
    var c = s.consolidado;
    var secs = [
      { campo: 'lote', html: seccion('📥 Recepción', 'Lotes que el cliente informó y aún no llegan a bodega.', s.recepcion) },
      { campo: 'prep_lote', html: seccion('📋 Preparación', 'Lotes ya recibidos, pendientes de preparar.', s.preparacion) },
      { campo: 'scannerInput', html: seccion('📦 Consolidado', 'Abre un contenedor para <b>' + c.cliente + '</b> y escanea estos lotes de la entrega <b>' + c.entrega + '</b> (nave ' + c.nave + ').', c.lotes) },
      { campo: 'rx_lote', html: seccion('📤 Despacho', 'Lotes en stock que se pueden despachar.', s.despacho) },
      { campo: 'trazar_lote', html: seccion('🔎 Trazabilidad', 'Busca este lote en Herramientas → Trazabilidad.', s.trazabilidad) }
    ];
    var activo = campoVisible();
    secs.sort(function (a, b) { return (activo && b.campo === activo.id ? 1 : 0) - (activo && a.campo === activo.id ? 1 : 0); });
    var secciones = secs.map(function (x) { return x.html; });
    var p = document.createElement('div');
    p.id = 'cbDemoPanel';
    p.setAttribute('style', 'position:fixed;inset:0;z-index:2147483001;background:rgba(6,34,58,.55);display:flex;align-items:flex-end;justify-content:center;font-family:' + FONT + ';');
    p.innerHTML =
      '<div style="background:#fff;width:100%;max-width:520px;max-height:82vh;overflow:auto;border-radius:18px 18px 0 0;padding:16px 16px 22px;box-sizing:border-box;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<div style="font-weight:800;color:#0b3c5d;font-size:16px;">Lotes de ejemplo</div>' +
          '<button type="button" id="cbDemoPanelX" style="width:auto;margin:0;flex:none;border:none;background:#eef2f5;color:#0b3c5d;border-radius:10px;padding:6px 12px;font-weight:800;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div style="font-size:12px;color:#5a6b77;margin-top:6px;">Toca un lote y se carga en el campo de escaneo que tengas abierto (también queda copiado).</div>' +
        secciones.join('') +
      '</div>';
    document.body.appendChild(p);
    p.addEventListener('click', function (e) {
      if (e.target === p || e.target.id === 'cbDemoPanelX') { cerrarPanel(); return; }
      var b = e.target.closest('[data-lote]');
      if (b) usarLote(b.getAttribute('data-lote'));
    });
  }

  function ayudaLogin() {
    var rut = document.getElementById('login_rut');
    var clave = document.getElementById('login_clave');
    if (!rut || !clave) return;
    if (!rut.value) rut.value = '12345678-9';
    if (!clave.value) clave.value = 'demo';
    var card = document.getElementById('login_card');
    if (!card || document.getElementById('cbDemoAyuda')) return;
    var a = document.createElement('div');
    a.id = 'cbDemoAyuda';
    a.setAttribute('style', 'margin:0 0 18px;padding:10px 12px;border-radius:10px;background:#eef6ff;color:#0b3c5d;font:600 13px/1.4 ' + FONT + ';text-align:center;');
    a.innerHTML = 'Demo: el RUT y la clave ya están cargados, solo presiona <b>Ingresar</b>.';
    var panel = document.getElementById('loginPanel');
    var titulo = panel && panel.firstElementChild;
    if (titulo && titulo.nextSibling) titulo.parentNode.insertBefore(a, titulo.nextSibling);
    else card.insertBefore(a, card.firstChild);
  }

  document.addEventListener('DOMContentLoaded', function () {
    insignia();
    if (!esTV) ayudaLogin();
  });
})();
