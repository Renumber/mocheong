<script setup lang="ts">
import { ref } from 'vue'
import { wedding } from '../config/wedding'

const images = wedding.galleryImages
const viewerIndex = ref<number | null>(null)

function open(i: number) {
  viewerIndex.value = i
  document.body.style.overflow = 'hidden'
}

function close() {
  viewerIndex.value = null
  document.body.style.overflow = ''
}

function move(delta: number) {
  if (viewerIndex.value === null) return
  viewerIndex.value = (viewerIndex.value + delta + images.length) % images.length
}

// 스와이프
let touchStartX = 0
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1)
}
</script>

<template>
  <section class="px-6 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Gallery</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">우리의 순간들</h2>

    <div class="mt-8 grid grid-cols-3 gap-2">
      <button
        v-for="(src, i) in images"
        :key="src"
        type="button"
        class="aspect-[4/5] overflow-hidden rounded-lg"
        @click="open(i)"
      >
        <img
          :src="src"
          :alt="`갤러리 사진 ${i + 1}`"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </button>
    </div>

    <!-- 전체화면 뷰어 -->
    <Teleport to="body">
      <div
        v-if="viewerIndex !== null"
        class="fixed inset-0 z-50 flex flex-col bg-black/90"
        @click.self="close"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <div class="flex items-center justify-between p-4 text-white">
          <span class="text-sm tabular-nums">{{ viewerIndex + 1 }} / {{ images.length }}</span>
          <button type="button" class="p-2 text-2xl leading-none" aria-label="닫기" @click="close">
            ×
          </button>
        </div>
        <div class="relative flex flex-1 items-center justify-center px-2 pb-8">
          <button
            type="button"
            class="absolute left-1 z-10 p-3 text-3xl text-white/70"
            aria-label="이전 사진"
            @click="move(-1)"
          >
            ‹
          </button>
          <img
            :src="images[viewerIndex]"
            :alt="`갤러리 사진 ${viewerIndex + 1}`"
            class="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            class="absolute right-1 z-10 p-3 text-3xl text-white/70"
            aria-label="다음 사진"
            @click="move(1)"
          >
            ›
          </button>
        </div>
      </div>
    </Teleport>
  </section>
</template>
