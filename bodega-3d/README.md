# Bodega Cervantes 3D

Modelo 3D interactivo de la bodega ubicada en Pedro Montt con Cervantes y Juan Macaya (terreno de 100 × 140 m, 14.000 m²).

Es una sola página web (`index.html`), sin instalación ni compilación. Usa [three.js](https://threejs.org/) 0.160.0, que se carga desde jsDelivr.

## Cómo verlo

- **En GitHub Pages:** una vez que esto esté en `main`, el flujo `deploy-pages.yml` lo publica en `https://<usuario>.github.io/capturabox/bodega-3d/`.
- **En tu computador:** abre `index.html` en el navegador. Necesita internet para cargar three.js y las fuentes.

## Qué incluye

- **Superficies según la planilla:** bodega principal (93,8 × 61,7 m), alero en voladizo (93,8 × 13,3 m), bodega pequeña (62,5 × 8 m), sector oficinas (15 × 30 m), estacionamiento (4,2 × 62,49 m), patio delantero (92 × 48 m) y patio trasero (100 × 13,3 m).
- **Según el plano "Layout def":**
  - 5 portones y 72 ubicaciones (A-1 a F-12).
  - Portones vehiculares a Cervantes y a Juan Macaya, y portón peatonal a Pedro Montt.
  - Gate control con caseta y garita de guardias.
  - Baños de conductores bajo el alero.
  - Oficina, camarines, pañol y camarín de mujeres.
  - Zona de descanso, garita de cámaras y área verde.
  - Sendero peatonal y zonas seguras junto a los portones.
  - Contenedores, camiones y grúa en el patio.
- **Vistas:** general, planta, frente e interior. Se pueden mostrar u ocultar el techo, las etiquetas, las cotas, las ubicaciones y los vehículos.
- **Búsqueda de ubicaciones:** escribes un código (por ejemplo `C-7`) o lo tocas en el minimapa, y el modelo te lleva hasta esa ubicación.

## Supuestos pendientes de confirmar

- Alturas: bodega de 10 m al alero y 12,5 m en la cumbrera, y alero a 8 m.
- Tamaños de la garita, los baños, la garita de cámaras y las zonas seguras.
- Las 5 marcas amarillas del muro del fondo del plano: ¿son portones traseros?
- A lo largo, las zonas suman 136,3 m, frente a los 140 m de Cervantes.

## Cómo editar

Todo está en `index.html`:

- **Medidas y posiciones:** en el objeto `R`. Las coordenadas están en metros: `x` va desde Cervantes hacia Juan Macaya y `z` desde Pedro Montt hacia el fondo.
- **Textos de cada zona:** en `ZONES`.
- **Ubicaciones A–F:** en `COLS` y `ROWS`.
