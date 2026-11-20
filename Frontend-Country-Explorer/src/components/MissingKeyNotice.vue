<template>
  <q-page class="page-container">
    <q-banner rounded class="bg-orange-1 text-orange-10">
      <template #avatar>
        <q-icon name="vpn_key" color="orange-9" />
      </template>
      <div class="text-subtitle1 text-weight-medium">Falta configurar la clave de la API</div>
      <div class="q-mt-xs">
        Crea un archivo <code>.env.local</code> en la carpeta del proyecto con la línea
        <code>QCLI_RESTCOUNTRIES_KEY=tu_clave</code> y vuelve a iniciar el servidor. La clave
        gratuita se obtiene en restcountries.com/sign-up.
      </div>
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
// Aviso que aparece cuando falta la clave de la API en el archivo .env.local
</script>
