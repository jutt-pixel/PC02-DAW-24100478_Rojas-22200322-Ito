# Country Explorer

Aplicación frontend con Vue 3, Composition API y Quasar para explorar países y consultar tipos de cambio.

## Configurar RestCountries

1. Registra una API key en [RestCountries](https://restcountries.com/sign-up).
2. Copia `.env.example` como `.env` y asigna tu clave a `VITE_RESTCOUNTRIES_API_KEY`.
3. En el panel de RestCountries, agrega el origen local (`http://localhost:9000`, o el puerto que indique Quasar) a los orígenes permitidos de la clave.
4. Reinicia el servidor después de cambiar `.env`.

La clave se usa desde el navegador porque este proyecto es solo frontend; Vite la incluye en el código cliente. No reutilices aquí una clave con permisos o cuota sensible. Para un despliegue público, las llamadas autenticadas deben pasar por un backend.

## Uso de las APIs

Todas las peticiones envían `Authorization: Bearer <API_KEY>`. La API responde con los registros en `data.objects` y los errores en `errors[].message`.

- Países: `GET https://api.restcountries.com/countries/v5?limit=24&response_fields=...`
- Detalle: `GET https://api.restcountries.com/countries/v5/codes.alpha_2/{codigo}`
- Moneda: `GET https://api.restcountries.com/currencies/v1/rates/{codigo}`; se usa `data.objects[0].rates.USD` como USD por una unidad de la moneda local.
- Conversión: `GET https://api.restcountries.com/currencies/v1/convert?from={codigo}&to=USD&amount={monto}`; se muestra el `result` devuelto por la API.

La respuesta de tasas incluye `as_of` en segundos Unix. El plan gratuito actualiza las tasas cada 24 horas; los tipos se muestran como valores de referencia. La clave también debe permitir el origen del navegador por las reglas CORS de RestCountries. Cada endpoint comparte la cuota de la cuenta.

En el detalle, la API entrega capitales como objetos con `name`, idiomas como objetos, áreas en `area.kilometers`, zonas en `timezones`, y fronteras como códigos ISO-3. La aplicación convierte las fronteras a nombres con búsquedas por `codes.alpha_3` y genera las banderas desde FlagCDN con el código ISO-2 en minúsculas.

## Desarrollo

```bash
npm install
npm run dev
```

Comandos disponibles:

```bash
npm run typecheck
npm run lint:check
npm run build
```

## Documentación consultada

- [Countries API v5](https://restcountries.com/docs/countries)
- [Currencies API v1](https://restcountries.com/docs/currencies)
- [CORS y orígenes del navegador](https://restcountries.com/docs/currencies#cors-browser-origins)
