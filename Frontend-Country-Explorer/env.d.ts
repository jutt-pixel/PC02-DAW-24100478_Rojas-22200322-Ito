/**
 * Tipos de las variables de entorno que usa la aplicacion.
 * https://quasar.dev/quasar-cli-vite/handling-import-meta-env#type-inference
 */
interface ImportMetaEnv {
  // Clave de RestCountries (archivo .env.local, no se sube al repositorio).
  readonly QCLI_RESTCOUNTRIES_KEY?: string;
  // Opcional: otra direccion base de la API.
  readonly QCLI_API_ROOT?: string;
}
