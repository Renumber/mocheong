<script setup lang="ts">
import { computed, ref } from 'vue'
import { wedding } from '../config/wedding'

type Side = 'groom' | 'bride'

const sides: Record<Side, { label: string; name: string }> = {
  groom: {
    label: '신랑측',
    name: wedding.groom.name,
  },
  bride: {
    label: '신부측',
    name: wedding.bride.name,
  },
}

const result = ref<Side | null>(null)
const spinning = ref(false)
const displaySide = ref<Side | null>(null)

const currentDisplay = computed(() => {
  const side = displaySide.value ?? result.value
  return side ? sides[side] : null
})

function pickSide() {
  if (spinning.value) return

  spinning.value = true
  result.value = null
  displaySide.value = null

  const finalSide: Side = Math.random() < 0.5 ? 'groom' : 'bride'
  const ticks = 16 + Math.floor(Math.random() * 6)
  let count = 0

  function tick() {
    displaySide.value = count % 2 === 0 ? 'groom' : 'bride'
    count++

    if (count <= ticks) {
      setTimeout(tick, 70 + count * 22)
    } else {
      displaySide.value = finalSide
      result.value = finalSide
      spinning.value = false
    }
  }

  tick()
}

function reset() {
  result.value = null
  displaySide.value = null
}
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Seat</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">어느 쪽 자리에 앉을까요?</h2>

    <p class="mt-6 text-[15px] leading-7 text-stone-600">
      양측 모두와 가까운 분들을 위해,<br />
      어느 쪽 자리에 앉으실지 고민되신다면 가볍게 뽑아보세요.
    </p>

    <div
      class="mt-8 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200/70 transition-all duration-500"
      :class="result ? 'ring-blush/40' : ''"
    >
      <div
        class="flex flex-col items-center justify-center px-6 py-10"
        :class="spinning ? 'animate-pulse' : ''"
      >
        <div class="flex h-16 items-center justify-center">
          <p
            v-if="currentDisplay"
            class="font-serif text-3xl text-stone-800 transition-transform duration-300"
            :class="result && !spinning ? 'scale-110' : ''"
          >
            {{ currentDisplay.label }}
          </p>
          <div
            v-else
            class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
          >
            <svg viewBox="0 0 24 24" class="h-8 w-8 text-blush" fill="none" aria-hidden="true">
              <circle cx="8" cy="12" r="5" stroke="currentColor" stroke-width="1.5" />
              <circle cx="16" cy="12" r="5" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </div>
        </div>
        <p class="mt-4 min-h-5 text-sm" :class="currentDisplay ? 'text-blush' : 'text-stone-500'">
          {{
            currentDisplay
              ? `${currentDisplay.name} 쪽`
              : '버튼을 눌러 자리를 뽑아보세요'
          }}
        </p>
      </div>
    </div>

    <div class="mt-6 space-y-3">
      <button
        v-if="!result || spinning"
        type="button"
        class="w-full rounded-xl bg-blush py-4 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
        :disabled="spinning"
        @click="pickSide"
      >
        {{ spinning ? '뽑는 중...' : '자리 뽑기' }}
      </button>

      <template v-else>
        <p class="text-sm leading-relaxed text-stone-600">
          <span class="font-medium text-stone-800">{{ currentDisplay?.label }}</span
          >에서 자리를 빛내주시는 건 어떨까요?
        </p>
        <button
          type="button"
          class="w-full rounded-xl bg-white py-4 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 transition-colors hover:bg-gray-100"
          @click="reset"
        >
          다시 뽑기
        </button>
      </template>
    </div>
  </section>
</template>
