# Site Arenal 3D

Modelo 3D interactivo del Site Arenal (Depot Talcahuano), entre la vía férrea, calle Antonio de la Fuente y calle Maritano. Sigue el mismo formato que el modelo de Bodega Cervantes.

Es una sola página (`index.html`), sin instalación ni compilación. Usa [three.js](https://threejs.org/) 0.160.0 desde jsDelivr, así que necesita internet.

## Cómo verlo

- **En GitHub Pages:** cuando esto llegue a `main`, el flujo `deploy-pages.yml` lo publica en `https://<usuario>.github.io/capturabox/layout-arenal/`.
- **En tu computador:** abre `index.html` en el navegador.
- Se puede abrir directo en una vista con `?vista=general|planta|acceso|bodegas|oficinas|patio`.

## Qué incluye

- **Deslindes:** el polígono del terreno se midió sobre la imagen satelital, con la punta del Área A al SO, el cerco de la vía al NO, calle Maritano al NE y calle Antonio de la Fuente al SE.
- **Bodegas, según el Excel "Layout Arenal" y el letrero del depot:**
  - 1-A (80 × 20 m), 1-B (25 × 20 m), N°2 (110 m) y N°3 (45 m) a lo largo de la vía.
  - Bloque de 96 × 40 m dividido entre la Bodega N°4 y el galpón de reparaciones.
  - N°5 (96 × 20 m) y N°6 (100 × 60 m, 3 naves).
  - N°7 (77 × 20 m) en el sector oriente.
- **Otras instalaciones:**
  - Bodega Modular N°8: queda operativa la mitad hacia las bodegas, 48 × 31,25 m (1.500 m²), sin invadir la Calle 3. La N°9 ya no existe.
  - Zonas: pre stacking full, zona de consolidación, zona de fumigado y consolidado.
  - Patio de contenedores con las calles B y C paralelas a la vía y las calles 1, 2 y 3 perpendiculares, más el bloque reefer.
  - Línea férrea interna: entra por la esquina NE y corre junto al cerco hasta la zona de consolidación para descargar.
  - Lavado, garage, EMR, warehouse, oficinas, fumigación, baños, control de acceso y plataforma de inspección.
  - Las áreas A, B, C y E y los dos accesos. La entrada principal va por Nuressa, junto al vértice con pasaje Uno, recta hacia la Bodega N°6.
  - Oficinas, estacionamientos, fachadas azul marino y colores de techo según fotos de dron.
  - Flechas pintadas con el sentido de circulación de las calles.
- **Vistas y opciones:**
  - Vistas: general, planta, acceso, bodegas, oficinas y patio.
  - Se pueden mostrar u ocultar los techos, las etiquetas, las cotas, los contenedores y los camiones y el tren, y activar el modo noche (torres de iluminación encendidas).
  - Al tocar una bodega o una zona se ve su ficha.

## Boceto e informe

- **Boceto:** el botón **Boceto** cambia a vista de planta y abre una barra de herramientas.
  - **Zona:** arrastras un rectángulo y muestra sus medidas y m².
  - **Medir:** arrastras una línea y muestra su largo.
  - **Texto:** tocas el plano y escribes una nota.
  - **Mover:** desplaza el plano.
  - **Colores, Deshacer e Imagen:** eliges el color de lo que dibujas, deshaces lo último o descargas un PNG de la vista con las etiquetas.
- **Dónde se guardan los bocetos:** en el navegador. En el panel puedes renombrarlos, ir a cada uno, borrarlos, y exportarlos o importarlos como JSON para compartirlos.
- **Informe:** abre un informe imprimible (o lo descarga, si el navegador bloquea la ventana). Incluye la imagen de la vista actual, las notas, el boceto con sus m², los datos del site, las bodegas con su porcentaje y las demás instalaciones. Desde ahí se puede guardar como PDF.

## Cómo editar

Todo está en `index.html`:

- **Deslinde:** en `SITE`.
- **Medidas y posiciones:** en el objeto `R`. Las coordenadas están en metros: `x` va a lo largo del cerco de la vía (de SO a NE) y `z` desde la vía hacia Antonio de la Fuente.
- **Nombres, m² y notas:** en `ZONES`.
