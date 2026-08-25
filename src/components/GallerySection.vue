<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { wedding } from '../config/wedding'

const images = wedding.galleryImages
const PAGE_SIZE = 9
const pages = computed(() => {
  const chunks: { src: string; i: number }[][] = []
  for (let i = 0; i < images.length; i += PAGE_SIZE) {
    chunks.push(images.slice(i, i + PAGE_SIZE).map((src, j) => ({ src, i: i + j })))
  }
  return chunks
})

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
let pointerStartScroll = 0
let sliderDragged = false
let mouseDragging = false
let wheelLock = false
let touchStartX = 0
let touchStartY = 0

function onSliderPointerDown(e: PointerEvent) {
  pointerStartX = e.clientX
  sliderDragged = false
  if (e.pointerType === 'touch' || e.button !== 0) return
  const el = sliderEl.value
  if (!el || pages.value.length < 2) return
  mouseDragging = true
  pointerStartScroll = el.scrollLeft
  el.style.scrollSnapType = 'none'
  el.setPointerCapture(e.pointerId)
}

function onSliderPointerMove(e: PointerEvent) {
  if (e.pointerType === 'touch') return
  const dx = e.clientX - pointerStartX
  if (Math.abs(dx) > 8) sliderDragged = true
  if (!mouseDragging) return
  const el = sliderEl.value
  if (!el) return
  el.scrollLeft = pointerStartScroll - dx
}

function onSliderPointerUp() {
  if (!mouseDragging) return
  mouseDragging = false
  const el = sliderEl.value
  if (el) el.style.scrollSnapType = ''
  updateSlideIndex()
  scrollToPage(slideIndex.value)
}

function onSliderTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  sliderDragged = false
}

function onSliderTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return
  sliderDragged = true
  if (pages.value.length < 2) return
  scrollToPage(slideIndex.value + (dx < 0 ? 1 : -1))
}

function onSlideClick(i: number) {
  if (sliderDragged) return
  open(i)
}

function scrollToPage(i: number) {
  const max = pages.value.length - 1
  const next = Math.max(0, Math.min(max, i))
  const child = sliderEl.value?.children[next] as HTMLElement | undefined
  child?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
}

function onSliderWheel(e: WheelEvent) {
  if (pages.value.length < 2) return
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
  if (delta === 0) return
  const next = slideIndex.value + (delta > 0 ? 1 : -1)
  if (next < 0 || next >= pages.value.length) return
  e.preventDefault()
  if (wheelLock) return
  wheelLock = true
  scrollToPage(next)
  window.setTimeout(() => {
    wheelLock = false
  }, 420)
}

let viewerTouchStartX = 0
function onTouchStart(e: TouchEvent) {
  viewerTouchStartX = e.touches[0].clientX
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - viewerTouchStartX
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
  sliderEl.value?.addEventListener('wheel', onSliderWheel, { passive: false })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  sliderEl.value?.removeEventListener('wheel', onSliderWheel)
  document.body.style.overflow = ''
  if (sliderRaf) cancelAnimationFrame(sliderRaf)
})
</script>

<template>
  <section class="py-16 text-center">
    <p class="px-6 font-serif text-xs tracking-[0.35em] text-blush uppercase">Gallery</p>
    <h2 class="mt-3 px-6 font-serif text-xl text-stone-800">우리의 순간들</h2>

    <p
      v-if="!images.length"
      class="mx-6 mt-8 rounded-lg bg-gray-100 py-16 font-serif text-sm text-stone-500"
    >
      사진은 준비중입니다.
    </p>
    <div
      v-else
      ref="sliderEl"
      class="mt-8 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden scrollbar-none select-none touch-pan-y"
      :class="pages.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''"
      @scroll.passive="onSliderScroll"
      @pointerdown="onSliderPointerDown"
      @pointermove="onSliderPointerMove"
      @pointerup="onSliderPointerUp"
      @pointercancel="onSliderPointerUp"
      @touchstart.passive="onSliderTouchStart"
      @touchend.passive="onSliderTouchEnd"
    >
      <div
        v-for="(page, p) in pages"
        :key="p"
        class="grid w-full min-w-full shrink-0 snap-center grid-cols-3 gap-1.5 px-6"
      >
        <div
          v-for="item in page"
          :key="`${item.src}-${item.i}`"
          role="button"
          tabindex="0"
          class="aspect-square touch-pan-y overflow-hidden rounded-md"
          :aria-label="`갤러리 사진 ${item.i + 1}`"
          @click="onSlideClick(item.i)"
          @keydown.enter.prevent="onSlideClick(item.i)"
        >
          <img
            :src="item.src"
            :alt="`갤러리 사진 ${item.i + 1}`"
            :loading="item.i < PAGE_SIZE ? 'eager' : 'lazy'"
            class="pointer-events-none h-full w-full object-cover"
            draggable="false"
          />
        </div>
      </div>
    </div>
    <div
      v-if="pages.length > 1"
      class="mt-4 flex items-center justify-center gap-1.5"
      role="tablist"
      aria-label="갤러리 페이지"
    >
      <button
        v-for="(_, p) in pages"
        :key="p"
        type="button"
        role="tab"
        class="h-1.5 rounded-full transition-all"
        :class="slideIndex === p ? 'w-4 bg-blush' : 'w-1.5 bg-stone-300'"
        :aria-label="`갤러리 ${p + 1}페이지`"
        :aria-selected="slideIndex === p"
        @click="scrollToPage(p)"
      />
    </div>

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
