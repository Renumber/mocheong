<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { wedding } from '../config/wedding'

const images = wedding.galleryImages

const viewerIndex = ref<number | null>(null)
const slideIndex = ref(0)
const sliderEl = ref<HTMLElement | null>(null)
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

function updateSlideIndex() {
  const el = sliderEl.value
  if (!el) return
  const center = el.scrollLeft + el.clientWidth / 2
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i] as HTMLElement
    const mid = child.offsetLeft + child.offsetWidth / 2
    const dist = Math.abs(mid - center)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  slideIndex.value = best
}

let sliderRaf = 0
function onSliderScroll() {
  if (sliderRaf) return
  sliderRaf = requestAnimationFrame(() => {
    sliderRaf = 0
    updateSlideIndex()
  })
}

let pointerStartX = 0
let sliderDragged = false
function onSliderPointerDown(e: PointerEvent) {
  pointerStartX = e.clientX
  sliderDragged = false
}
function onSliderPointerMove(e: PointerEvent) {
  if (Math.abs(e.clientX - pointerStartX) > 8) sliderDragged = true
}
function onSlideClick(i: number) {
  if (sliderDragged) return
  open(i)
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
  if (sliderRaf) cancelAnimationFrame(sliderRaf)
})
</script>

<template>
  <section class="py-16 text-center">
    <p class="px-6 font-serif text-xs tracking-[0.35em] text-blush uppercase">Gallery</p>
    <h2 class="mt-3 px-6 font-serif text-xl text-stone-800">우리의 순간들</h2>

    <div
      ref="sliderEl"
      class="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 scrollbar-none"
      style="touch-action: pan-x"
      @scroll.passive="onSliderScroll"
      @pointerdown="onSliderPointerDown"
      @pointermove="onSliderPointerMove"
    >
      <button
        v-for="(src, i) in images"
        :key="`${src}-${i}`"
        type="button"
        class="aspect-4/5 w-[78%] shrink-0 snap-center overflow-hidden rounded-lg"
        :aria-label="`갤러리 사진 ${i + 1}`"
        @click="onSlideClick(i)"
      >
        <img
          :src="src"
          :alt="`갤러리 사진 ${i + 1}`"
          :loading="i < 2 ? 'eager' : 'lazy'"
          class="h-full w-full object-cover"
        />
      </button>
    </div>
    <p v-if="images.length" class="mt-4 text-sm tabular-nums text-stone-500">
      {{ slideIndex + 1 }} / {{ images.length }}
    </p>

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
