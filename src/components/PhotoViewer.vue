<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  images: string[]
  index: number | null
}>()

const emit = defineEmits<{
  'update:index': [value: number | null]
}>()

const stripEl = ref<HTMLElement | null>(null)
let viewerTouchStartX = 0

function close() {
  emit('update:index', null)
  document.body.style.overflow = ''
}

function move(delta: number) {
  if (props.index === null || props.images.length === 0) return
  const next = (props.index + delta + props.images.length) % props.images.length
  emit('update:index', next)
}

function onKeydown(e: KeyboardEvent) {
  if (props.index === null) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') move(-1)
  else if (e.key === 'ArrowRight') move(1)
}

function onTouchStart(e: TouchEvent) {
  viewerTouchStartX = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - viewerTouchStartX
  if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1)
}

watch(
  () => props.index,
  async (i) => {
    if (i === null) {
      document.body.style.overflow = ''
      return
    }
    document.body.style.overflow = 'hidden'
    await nextTick()
    const active = stripEl.value?.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="index !== null"
      class="fixed inset-0 z-50 flex flex-col bg-black/90"
      @click.self="close"
    >
      <div class="flex items-center justify-between p-4 text-white">
        <span class="text-sm tabular-nums">{{ index + 1 }} / {{ images.length }}</span>
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
          :src="images[index]"
          :alt="`게스트 사진 ${index + 1}`"
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
          :data-active="index === i"
          class="h-14 w-11 shrink-0 overflow-hidden rounded-md ring-2 transition-opacity"
          :class="index === i ? 'ring-white' : 'ring-transparent opacity-40'"
          :aria-label="`게스트 사진 ${i + 1}`"
          @click="emit('update:index', i)"
        >
          <img :src="src" :alt="`게스트 사진 ${i + 1}`" loading="lazy" class="h-full w-full object-cover" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
