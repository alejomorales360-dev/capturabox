# Mi Glucemia

Página para registrar la glucosa en sangre y ver estadísticas. Lee las mediciones del glucómetro **Accu-Chek Instant** por Bluetooth. Es un solo archivo (`index.html`): no hay que instalar ni compilar nada, y no usa librerías externas.

## Cómo abrirla

- **En línea (GitHub Pages):** cuando esto llegue a `main`, el flujo `deploy-pages.yml` la publica en `https://<usuario>.github.io/capturabox/glucemia/`. Desde el celular puedes usar "Agregar a pantalla de inicio".
- **En tu computador:** abre `index.html` en el navegador.

## Qué incluye

- **Hoy** (pantalla de inicio): plan del día con avance en %: dosis de medicamentos por marcar, mediciones (ayunas y 2 h después de comer), comidas del menú, minutos de actividad y peso. Incluye recomendaciones personalizadas según tus datos (ayunas alta, picos después de comer, hipoglucemias, poca actividad o dosis olvidadas).
- **Medicamentos:** nombre, dosis, horarios y cómo tomarlo; información orientativa de los fármacos frecuentes para la diabetes; cumplimiento de 7 y 30 días con calendario de 4 semanas; recordatorios diarios en un archivo `.ics` para el calendario del celular. Se pueden suspender o reanudar.
- **Ejercicio:** registro de actividad, minutos de la semana frente a la meta, plan progresivo de 8 semanas (caminata y fuerza), rutina de fuerza en casa sin equipos y recomendaciones de seguridad.
- **Registrar:** valor, fecha y hora, momento (ayunas, antes o después de comer, antes de dormir) y nota. Se puede editar y eliminar.
- **Sincronizar por Bluetooth:** usa el perfil estándar de glucosa (servicio 0x1808, RACP) para traer todas las mediciones guardadas en el medidor. Funciona en Chrome o Edge (Android, Windows, Mac, ChromeOS); Safari en iPhone no lo permite. La primera vez pide el PIN de 6 dígitos que está en la parte de atrás del medidor. Las mediciones repetidas no se duplican y las de solución de control se ignoran.
- **Resumen** de 7, 14, 30 o 90 días: última medición, promedio, HbA1c estimada (GMI), porcentaje en rango, variabilidad (CV), desviación estándar, mínimo y máximo, cada uno comparado con el periodo anterior.
- **Gráficos:** distribución por rangos, tendencia, patrón por hora del día (mediana y mitad central), promedio por momento y promedio diario con mínimo y máximo.
- **Alimentación:** plan basado en las recomendaciones de la ADA y las guías alimentarias chilenas.
  - *Menú semanal* variado con comidas chilenas (desayuno, 2 colaciones, almuerzo y once o cena). Indica los gramos de carbohidratos de cada comida, permite cambiar cada plato y generar otro menú, y tiene un botón "Medir después" que deja lista la medición posprandial con el nombre de la comida.
  - *Mi plan:* meta de calorías, carbohidratos y proteínas (Mifflin‑St Jeor) repartida por comida, y una tabla de porciones de intercambio.
  - *Cómo me afectan:* compara cada medición antes de comer con la de después y muestra las comidas que más subieron la glucosa.
  - *Guía de alimentos:* método del plato, semáforo de alimentos (preferir, moderar, evitar), hábitos y la regla 15‑15 para la hipoglucemia.
  - *Lista de compras* generada desde el menú, imprimible.
- **Informe para el médico:** imprime el resumen o lo guarda como PDF, con la tabla de mediciones.
- **Ajustes:** mg/dL o mmol/L, límites de los rangos (por defecto 54 / 70 / 180 / 250 mg/dL) y tema claro u oscuro.
- **Datos:** se guardan solo en el navegador (`localStorage`). Se pueden exportar a CSV (Excel) y respaldar o importar en JSON (la copia incluye medicamentos, ejercicio y peso), por ejemplo para pasarlos a otro dispositivo.

> Es una herramienta de registro: no reemplaza las indicaciones médicas. La HbA1c es una estimación.
