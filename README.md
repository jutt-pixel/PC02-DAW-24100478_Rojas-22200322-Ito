# PC02 - Country Explorer

Práctica calificada 02 del curso **Desarrollo de Aplicaciones Web**.

Aplicación de frontend hecha con **Vue 3** (Composition API y `script setup`), **Quasar** y TypeScript que consume la API pública de **RestCountries** para explorar países: listado con búsqueda y filtro, vista de detalle y panel de tipo de cambio.

## Integrantes y reparto del trabajo

| Integrante | Código   | Parte a cargo                          |
| ---------- | -------- | -------------------------------------- |
| Rojas      | 24100478 | **Parte A – Listado de países**        |
| Ito        | 22200322 | **Parte B – Detalle y tipo de cambio** |

### Parte A – Listado de países (Rojas)

- Estructura común de las pantallas y aviso de clave faltante: `src/pages/index.vue`, `MissingKeyNotice.vue`
- Cliente HTTP con la cabecera de autenticación, caché en memoria y manejo de errores: `src/services/http.ts`
- Servicio de países (listado, búsqueda por capital, filtro por continente, paginación): `src/services/countries.ts`
- Estado del listado con espera de 400 ms en el buscador: `src/composables/useCountries.ts`
- Pantalla de listado: `src/pages/index/(index).vue`
- Componentes: `CountryFilters.vue`, `CountryCard.vue`, `CurrencyChip.vue`, `LoadingGrid.vue`, `StateMessage.vue`
- Utilidades de formato: `src/utils/format.ts`, `src/utils/labels.ts` y los tipos de `src/types/country.ts`

### Parte B – Detalle y tipo de cambio (Ito)

- Servicio de monedas (tasa frente al dólar y conversión de montos): `src/services/currencies.ts`
- Estado del detalle y de los países fronterizos: `src/composables/useCountry.ts`
- Estado del panel de moneda: `src/composables/useCurrency.ts`
- Pantalla de detalle: `src/pages/index/pais/[code].vue`
- Componentes: `CurrencyDialog.vue`, `InfoItem.vue`
- Estados de carga, error y «país no encontrado» de la vista de detalle.

Las dos partes comparten el cliente HTTP, el componente `StateMessage.vue` y el panel `CurrencyDialog.vue` (se abre tanto desde la tarjeta del listado como desde el detalle).

## Funcionalidades

**Pantalla 1 – Listado**

- Buscador por capital y selector de continente.
- Tarjeta por país con bandera, nombre, capital, población, continente y moneda.
- Al tocar la moneda se abre el panel de tipo de cambio sin salir del listado.

**Pantalla 2 – Detalle**

- Reemplaza al listado (no es una ventana aparte) y tiene el botón «Volver al listado».
- Bandera grande, nombre, continente y capital destacada.
- Población, área, moneda, idiomas, zona horaria, código telefónico, dominio y lado de conducción.
- Países fronterizos (se puede tocar cada uno para ir a su detalle).

**Panel de moneda**

- Nombre, código y símbolo de la moneda.
- Tasa actual frente al dólar (USD).
- Conversor: monto + botón «Convertir a USD».

**Estados**

- Carga: tarjetas esqueleto en el listado y en el detalle, indicador en el panel de moneda.
- Error: mensaje claro según el caso (sin conexión, clave inválida, límite de consultas) con botón «Reintentar».
- Sin resultados: mensaje con botón «Limpiar filtros».

## Requisitos

- Node.js 22.12 o superior.
- Una clave gratuita de RestCountries.

## Configuración de la clave de la API

1. Crear una cuenta en <https://restcountries.com/sign-up> y copiar la clave.
2. En <https://restcountries.com/api-keys>, abrir la clave y agregar `localhost` en **CORS allowed origins**. Sin este paso la API rechaza los pedidos hechos desde el navegador.
3. Dentro de la carpeta `Frontend-Country-Explorer`, copiar el archivo `.env.example` como `.env.local` y colocar la clave:

```
QCLI_RESTCOUNTRIES_KEY=tu_clave
```

El archivo `.env.local` no se sube al repositorio. El prefijo `QCLI_` es el que Quasar CLI expone a la aplicación.

## Cómo ejecutar

```bash
cd Frontend-Country-Explorer
npm install
npm run dev
```

Quasar abre el navegador en la dirección que muestra la terminal (por defecto <http://localhost:9000>).

Para generar la versión de producción (queda en `dist/spa`):

```bash
npm run build
```

## Endpoints utilizados

| Uso                   | Endpoint                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| Listado inicial       | `GET /countries/v5`                                                    |
| Búsqueda por capital  | `GET /countries/v5/capitals?q={texto}`                                 |
| Filtro por continente | `GET /countries/v5/region/{continente}`                                |
| Detalle de un país    | `GET /countries/v5/codes.alpha_2/{codigo}`                             |
| Tasa de cambio        | `GET /currencies/v1/rates/{codigoMoneda}`                              |
| Conversión de montos  | `GET /currencies/v1/convert?from={origen}&to={destino}&amount={monto}` |

- Base de países: `https://api.restcountries.com/countries/v5`
- Base de monedas: `https://api.restcountries.com/currencies/v1`
- Autenticación: cabecera `Authorization: Bearer <clave>`
- Banderas: `https://flagcdn.com/w320/{codigo}.png` (miniaturas con `w80`).

## Estructura del proyecto

```
Frontend-Country-Explorer/
  src/
    pages/
      index.vue              Estructura común de las pantallas
      index/(index).vue      Pantalla 1: listado
      index/pais/[code].vue  Pantalla 2: detalle
    components/              Componentes reutilizables
    composables/
      useCountries.ts        Estado del listado
      useCountry.ts          Estado del detalle
      useCurrency.ts         Estado del panel de moneda
    services/
      http.ts                Cliente HTTP, caché y errores
      countries.ts           Endpoints de países y normalización
      currencies.ts          Endpoints de monedas
    types/country.ts         Tipos de datos
    utils/                   Formato de números y etiquetas
    css/                     Estilos
```

Las rutas se generan a partir de los archivos de `src/pages` (el detalle queda en `/pais/:code`).

## Decisiones de implementación

- **Cuidado del límite de consultas:** las respuestas se guardan en memoria durante 10 minutos y el buscador espera 400 ms después de la última tecla antes de consultar.
- **Listado completo:** la API entrega como máximo 100 países por pedido, por eso el listado se trae en páginas (`limit` y `offset`) y se pide solo lo que muestra la tarjeta (`response_fields`).
- **Respuestas fuera de orden:** si llega una respuesta antigua después de una nueva, se descarta.
- **Normalización:** la respuesta de la API se convierte en un objeto simple en `countries.js`, así los componentes no dependen del formato del servicio.
- **Clave fuera del código:** se lee de una variable de entorno; si falta, la aplicación muestra cómo configurarla.
- **Calidad:** el proyecto pasa `npm run lint:check` y `npm run typecheck`.
