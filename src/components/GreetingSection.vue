<script setup lang="ts">
import { wedding } from '../config/wedding'
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Invitation</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">소중한 분들을 초대합니다</h2>

    <p class="mt-8 text-[15px] leading-8 whitespace-pre-line text-stone-600">
      {{ wedding.greeting }}
    </p>

    <div class="mx-auto mt-10 h-px w-10 bg-blush/60" />

    <div class="mt-10 space-y-3 text-[15px] text-stone-700">
      <p>
        <span class="text-stone-500">{{ wedding.groom.father.name }} · {{ wedding.groom.mother.name }}</span>
        <span class="mx-2 text-xs text-stone-400">의 {{ wedding.groom.order }}</span>
        <span class="font-medium">{{ wedding.groom.name }}</span>
      </p>
      <p>
        <span class="text-stone-500">{{ wedding.bride.father.name }} · {{ wedding.bride.mother.name }}</span>
        <span class="mx-2 text-xs text-stone-400">의 {{ wedding.bride.order }}</span>
        <span class="font-medium">{{ wedding.bride.name }}</span>
      </p>
    </div>
  </section>
</template>
