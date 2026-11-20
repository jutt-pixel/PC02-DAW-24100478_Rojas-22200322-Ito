# PC02 - Country Explorer

Práctica calificada 02 del curso **Desarrollo de Aplicaciones Web**.

Aplicación de frontend hecha con **Vue 3** (Composition API y `script setup`), **Quasar** y TypeScript que consume la API pública de **RestCountries** para explorar países: listado con búsqueda y filtro, vista de detalle y panel de tipo de cambio.

El proyecto está en la carpeta `Frontend-Country-Explorer`.

## Integrantes y reparto del trabajo

| Integrante | Código   | Parte a cargo                                      |
| ---------- | -------- | -------------------------------------------------- |
| Rojas      | 24100478 | **Parte A – Listado de países, búsqueda y filtro** |
| Ito        | 22200322 | **Parte B – Detalle del país y tipo de cambio**    |

### Parte A – Listado, búsqueda y filtro (Rojas)

- **Buscador por capital** en la cabecera, con sugerencias y envío explícito: `src/pages/index.vue`
- **Selector de continente** en el filtro del buscador: `src/pages/index.vue`
- **Listado completo de países**: la API entrega como máximo 100 por pedido, así que se recorren las páginas (`limit` y `offset`) y se pide solo lo que muestra la tarjeta (`response_fields`): `src/services/restCountries.ts`
- Funciones del servicio `getCountries`, `searchCountriesByCapital` y `getCountriesByContinent`, con memoria de respuestas para cuidar el límite de consultas: `src/services/restCountries.ts`
- Continente en cada tarjeta y estado **«sin resultados»** con botón «Limpiar filtros».
- Descarte de respuestas antiguas cuando llega una búsqueda más nueva.
- Lectura de todas las monedas que entrega la API con `getCountryCurrencies`.
- Lectura de la clave desde el archivo `.env` con Quasar CLI (`QCLI_RESTCOUNTRIES_API_KEY` y compatibilidad con `VITE_RESTCOUNTRIES_API_KEY`) y mensaje claro cuando la clave no admite el origen `localhost`.
- Estilos de la fila de filtros: `src/css/app.scss`

### Parte B – Detalle y tipo de cambio (Ito)

- Estructura del proyecto con Quasar CLI, diseño general y cabecera: `src/pages/index.vue`, `src/css/app.scss`
- Tarjetas del listado y estados de carga y de error.
- **Vista de detalle del país** (bandera, capital, población, superficie, idiomas, zonas horarias, código telefónico, dominio, lado de conducción y países fronterizos): `src/pages/index/country/[code].vue`
- **Panel de tipo de cambio** con la tasa frente al dólar y el conversor a USD: `src/components/CurrencyRateDialog.vue`
- Funciones del servicio para el detalle, la tasa y la conversión: `src/services/restCountries.ts`

## Funcionalidades

**Pantalla 1 – Listado**

- Buscador por capital y selector de continente.
- Tarjeta por país con bandera, nombre, capital, población, continente y moneda.
- Al tocar la moneda se abre el panel de tipo de cambio sin salir del listado.

**Pantalla 2 – Detalle**

- Reemplaza al listado (no es una ventana aparte).
- Bandera grande, nombre, continente y capital destacada.
- Población, área, idiomas, zona horaria, código telefónico, dominio y lado de conducción.
- Países fronterizos.

**Panel de moneda**

- Nombre, código y símbolo de la moneda.
- Tasa actual frente al dólar (USD).
- Conversor: monto y botón para convertir a USD.

**Estados**

- Carga, error con botón «Reintentar» y «sin resultados» con botón «Limpiar filtros».

## Configuración de la clave de la API

1. Crear una cuenta en <https://restcountries.com/sign-up> y copiar la clave.
2. Dentro de la carpeta `Frontend-Country-Explorer`, copiar el archivo `.env.example` como `.env` y colocar la clave:

```
QCLI_RESTCOUNTRIES_API_KEY=tu_clave
```

El archivo `.env` no se sube al repositorio. En desarrollo Quasar añade la clave al reenviar la consulta. Si sirves la compilación estática, autoriza el nombre de host (sin protocolo ni puerto) en los [orígenes de la clave](https://restcountries.com/api-keys).

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
- Banderas: `https://flagcdn.com/w160/{codigo}.png`

## Calidad

El proyecto pasa `npm run lint:check`, `npm run typecheck` y `npm run build`.
