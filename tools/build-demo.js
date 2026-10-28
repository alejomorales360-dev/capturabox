#!/usr/bin/env node
// Genera la demo pública a partir de la app real, para que nunca se desfase:
//   node tools/build-demo.js
// Lee CAPTURABOX.html (y ../capturabox-tv/index.html si existe) y escribe
// demo/index.html y demo/tv/index.html con el backend simulado inyectado.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEMO = path.join(ROOT, 'demo');

// Clientes reales -> ficticios (solo literales exactos y texto de <option>,
// nunca dentro de identificadores como leerGuiaJCEConIA).
const CLIENTES = {
  ARAUCO: 'FORESTAL DEMO',
  FORACTION: 'MADERAS SUR',
  MASISA: 'PANELES NORTE',
  JCE: 'MADERAS ANDES',
  CMPC: 'PAPELERA SUR',
};

function anonimizar(html) {
  for (const [real, demo] of Object.entries(CLIENTES)) {
    html = html.replace(new RegExp(`(['"])${real}\\1`, 'g'), `$1${demo}$1`);
    html = html.replace(new RegExp(`>\\s*${real}\\s*<`, 'g'), `>${demo}<`);
    html = html.replace(new RegExp(`Ej: (Cliente )?${real}\\b`, 'g'), `Ej: $1${demo}`);
  }
  html = html.replace(/(Packing List|Stock) FORACTION/g, '$1 MADERAS SUR');
  return html.replace(/Bodega Cervantes/g, 'Bodega Central').replace(/BODEGA CERVANTES/g, 'BODEGA CENTRAL');
}

function inyectar(html, { titulo, scripts }) {
  const tags = scripts.map(s => `<script src="${s}"></script>`).join('\n');
  if (!/<meta charset="UTF-8">/i.test(html)) throw new Error('No se encontró <meta charset> para inyectar el backend demo');
  html = html.replace(/<meta charset="UTF-8">/i, m => `${m}\n<!-- MODO DEMO: generado por tools/build-demo.js, no editar a mano -->\n${tags}`);
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${titulo}</title>`);
  html = html.replace(/<link rel="manifest"[^>]*>\s*/i, '');
  return html;
}

const app = fs.readFileSync(path.join(ROOT, 'CAPTURABOX.html'), 'utf8');
let demo = inyectar(anonimizar(app), { titulo: 'CapturaBox — Demo', scripts: ['demo-backend.js', 'demo-ui.js'] });
demo = demo.replace(/href="icons\//g, 'href="../icons/');
fs.writeFileSync(path.join(DEMO, 'index.html'), demo);
console.log('demo/index.html', (demo.length / 1024).toFixed(0) + ' KB');

const tvSrc = process.env.CAPTURABOX_TV || path.join(ROOT, '..', 'capturabox-tv', 'index.html');
if (fs.existsSync(tvSrc)) {
  fs.mkdirSync(path.join(DEMO, 'tv'), { recursive: true });
  let tv = inyectar(anonimizar(fs.readFileSync(tvSrc, 'utf8')), { titulo: 'CapturaBox TV — Demo', scripts: ['../demo-backend.js', '../demo-ui.js'] });
  fs.writeFileSync(path.join(DEMO, 'tv', 'index.html'), tv);
  console.log('demo/tv/index.html', (tv.length / 1024).toFixed(0) + ' KB');
} else {
  console.log('(sin capturabox-tv: se mantiene demo/tv/index.html existente)');
}
