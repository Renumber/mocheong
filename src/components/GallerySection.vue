<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { wedding } from '../config/wedding'

const PREVIEW_COUNT = 9
const images = wedding.galleryImages
const previewImages = computed(() => images.slice(0, PREVIEW_COUNT))
const remaining = computed(() => Math.max(0, images.length - PREVIEW_COUNT))

const viewerIndex = ref<number | null>(null)
const stripEl = ref<HTMLElement | null>(null)

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

function onKeydown(e: KeyboardEvent) {
  if (viewerIndex.value === null) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') move(-1)
  else if (e.key === 'ArrowRight') move(1)
}

function isMoreCell(i: number) {
  return remaining.value > 0 && i === previewImages.value.length - 1
}

let touchStartX = 0
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1)
}

watch(viewerIndex, async (i) => {
  if (i === null) return
  await nextTick()
  const active = stripEl.value?.querySelector<HTMLElement>('[data-active="true"]')
  active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <section class="px-6 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Gallery</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">우리의 순간들</h2>

    <div class="mt-8 grid grid-cols-3 gap-2">
      <button
        v-for="(src, i) in previewImages"
        :key="`${src}-${i}`"
        type="button"
        class="relative aspect-[4/5] overflow-hidden rounded-lg"
        :aria-label="isMoreCell(i) ? `나머지 ${remaining}장 포함 갤러리 보기` : `갤러리 사진 ${i + 1}`"
        @click="open(i)"
      >
        <img
          :src="src"
          :alt="`갤러리 사진 ${i + 1}`"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <span
          v-if="isMoreCell(i)"
          class="absolute inset-0 flex items-center justify-center bg-black/50 font-serif text-lg text-white"
        >
          +{{ remaining }}
        </span>
      </button>
    </div>

    <button
      v-if="remaining > 0"
      type="button"
      class="mt-6 w-full rounded-xl bg-white py-4 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 transition-colors hover:bg-gray-100"
      @click="open(0)"
    >
      전체 사진 보기 ({{ images.length }})
    </button>

    <Teleport to="body">
      <div
        v-if="viewerIndex !== null"
        class="fixed inset-0 z-50 flex flex-col bg-black/90"
        @click.self="close"
      >
        <div class="flex items-center justify-between p-4 text-white">
          <span class="text-sm tabular-nums">{{ viewerIndex + 1 }} / {{ images.length }}</span>
          <button type="button" class="p-2 text-2xl leading-none" aria-label="닫기" @click="close">
            ×
          </button>
        </div>
        <div
          class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2"
          @click.self="close"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
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
            class="h-full w-auto max-w-full rounded-lg object-contain"
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
        <div
          ref="stripEl"
          class="flex gap-1.5 overflow-x-auto px-4 pt-3 pb-6"
          @touchstart.stop
          @touchend.stop
        >
          <button
            v-for="(src, i) in images"
            :key="`${src}-${i}`"
            type="button"
            :data-active="viewerIndex === i"
            class="h-14 w-11 shrink-0 overflow-hidden rounded-md ring-2 transition-opacity"
            :class="viewerIndex === i ? 'ring-white' : 'ring-transparent opacity-40'"
            :aria-label="`갤러리 사진 ${i + 1}`"
            @click="viewerIndex = i"
          >
            <img :src="src" :alt="`갤러리 사진 ${i + 1}`" loading="lazy" class="h-full w-full object-cover" />
          </button>
        </div>
      </div>
    </Teleport>
  </section>
</template>
