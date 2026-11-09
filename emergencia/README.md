# Despensa de emergencia

App familiar para preparar la despensa y los kits de emergencia de una familia de 4: papá (diabetes e hipertensión), mamá, hija de 14 (alergia) e hija de 8 (asma). Calcula cuánto necesitan, deja marcar lo que ya tienen y muestra para cuántos días les alcanza.

Los datos se guardan en un **Google Sheet** mediante **Google Apps Script**, así se ven y se editan desde varios celulares.

## Qué incluye

- **Panel:** días de autonomía de agua y comida (por calorías), con estado frente a la meta (3, 7 o 14 días), cálculo con racionamiento y lo que falta para llegar a la meta. Gráficas de días por recurso (agua, comida, proteína, medicinas, tiras reactivas, gas, papel), de qué alimento aporta más días, del avance de cada mochila y de vencimientos de los próximos 12 meses.
- **Pestañas:** Comida y agua, Medicamentos (por persona), Botiquín, Mochilas (una por persona), Equipo y artefactos, Higiene, Documentos y plan.
- Fechas de vencimiento, artículos propios, filtro "solo lo que falta" y lista para copiar.
- Sin conexión, los cambios quedan en el dispositivo y se suben al reconectar.

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | La app. Funciona publicada en GitHub Pages, abierta como archivo, o dentro de Apps Script. |
| `apps-script/Codigo.gs` | El servidor: lee y escribe en el Sheet. Va en `Código.gs` del proyecto de Apps Script. |
| `apps-script/Index.html` | Copia de la app para servirla desde Apps Script (archivo HTML llamado `Index`). |

## Instalación

1. Abre tu Google Sheet y entra a **Extensiones > Apps Script**. Si creaste el proyecto aparte, pon el ID del Sheet en `SHEET_ID`.
2. Pega `apps-script/Codigo.gs` en `Código.gs`. Crea un archivo HTML llamado `Index` y pega `apps-script/Index.html`. Guarda.
3. Elige la función `probar` y dale **Ejecutar**. Acepta los permisos. Deben aparecer las hojas `Articulos` y `Config`.
4. **Implementar > Nueva implementación > Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (obligatorio para usarla desde GitHub Pages; con "cualquier usuario con cuenta de Google" la URL pide iniciar sesión y no sincroniza).
5. Copia la URL que termina en `/exec`.
6. Pon esa URL en `DEFAULT_API_URL` dentro de `index.html`. Así la app publicada (`https://<usuario>.github.io/capturabox/emergencia/`) se conecta sola en cualquier dispositivo, sin pedir nada.
7. Si cambias de implementación, actualiza `DEFAULT_API_URL`. En un dispositivo concreto también se puede cambiar desde **Conexión**.

Para actualizar el código sin cambiar la URL: **Implementar > Gestionar implementaciones > ✏️ > Versión: Nueva versión > Implementar**.

## Privacidad

La URL `/exec` da acceso de lectura y escritura al inventario a quien la tenga. Está escrita en `index.html` por decisión de la familia, para que ningún dispositivo la pida. Como el repositorio es público, cualquiera que lo revise puede ver y cambiar el inventario. Para cortar ese acceso, archiva la implementación en Apps Script y crea otra.

> Las cantidades son aproximadas (unas 2 000 kcal por adulto al día y 4 L de agua por persona). No reemplaza las indicaciones médicas.
