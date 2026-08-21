<script setup lang="ts">
import { computed } from 'vue'
import { wedding } from '../config/wedding'

const dateText = computed(() => {
  const d = wedding.date
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  const hour = d.getHours()
  const ampm = hour < 12 ? '오전' : '오후'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const minute = d.getMinutes()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${week}요일 ${ampm} ${hour12}시${minute ? ` ${minute}분` : ''}`
})
</script>

<template>
  <section class="relative flex flex-col">
    <div class="px-8 pt-14 pb-8 text-center">
      <p class="font-serif text-sm tracking-[0.4em] text-blush uppercase">Wedding Invitation</p>
      <h1 class="mt-5 font-serif text-3xl font-medium tracking-wide text-stone-800">
        {{ wedding.groom.name }}
        <span class="mx-2 text-xl text-blush">·</span>
        {{ wedding.bride.name }}
      </h1>
    </div>

    <div class="mx-8 overflow-hidden rounded-t-full">
      <img
        :src="wedding.mainImage"
        alt="메인 웨딩 사진"
        class="block h-auto w-full"
      />
    </div>

    <div class="px-8 py-8 text-center">
      <p class="font-serif text-base text-stone-700">{{ dateText }}</p>
      <p class="mt-2 whitespace-pre-line text-sm text-stone-500">{{ wedding.venue.name }} {{ wedding.venue.hall }}</p>
    </div>
  </section>
</template>
