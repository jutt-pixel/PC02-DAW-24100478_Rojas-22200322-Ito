<template>
  <q-layout view="hHh lpR fFf" class="app-shell">
    <q-header class="app-header">
      <q-toolbar class="page-width header-toolbar">
        <router-link to="/" class="brand-link" aria-label="Country Explorer, inicio">
          <span class="brand-mark"><q-icon name="public" /></span>
          <span class="brand-name">country<span>explorer</span></span>
        </router-link>

        <q-space />

        <div class="header-note gt-xs">
          <span class="status-dot"></span>
          Explorando el mundo, país a país
        </div>
        <q-btn
          flat
          round
          dense
          icon="travel_explore"
          color="dark"
          class="header-action"
          aria-label="Explorar países"
          to="/"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts"></script>
