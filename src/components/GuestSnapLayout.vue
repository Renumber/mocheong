<script setup lang="ts">
import { wedding } from '../config/wedding'
</script>

<template>
  <div class="mx-auto min-h-screen max-w-[430px] bg-ivory shadow-xl">
    <header class="px-8 pt-14 pb-2 text-center">
      <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Guest Snap</p>
      <h1 class="mt-3 font-serif text-xl text-stone-800">
        <slot name="title" />
      </h1>
      <p v-if="$slots.subtitle" class="mt-3 text-sm leading-relaxed text-stone-500">
        <slot name="subtitle" />
      </p>
    </header>
    <main class="px-6 pt-8 pb-16">
      <slot />
    </main>
    <footer class="py-10 text-center text-xs text-stone-400">
      {{ wedding.groom.name }} ♥ {{ wedding.bride.name }}
    </footer>
  </div>
</template>
