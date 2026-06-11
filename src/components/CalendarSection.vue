<script setup lang="ts">
import { computed } from 'vue'
import { wedding } from '../config/wedding'
import { useCountdown } from '../composables/useCountdown'

const { days, hours, minutes, seconds, isPast } = useCountdown(wedding.date)

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const calendar = computed(() => {
  const d = wedding.date
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: lastDate }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return { year, month: month + 1, weddingDay: d.getDate(), cells }
})

const units = computed(() => [
  { label: 'DAYS', value: days.value },
  { label: 'HOUR', value: hours.value },
  { label: 'MIN', value: minutes.value },
  { label: 'SEC', value: seconds.value },
])

function pad(n: number) {
  return String(n).padStart(2, '0')
}
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Save the Date</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">
      {{ calendar.year }}년 {{ calendar.month }}월
    </h2>

    <!-- 달력 -->
    <div class="mx-auto mt-8 max-w-[320px]">
      <div class="grid grid-cols-7 gap-y-3 text-sm">
        <span
          v-for="(w, i) in weekDays"
          :key="w"
          class="font-medium"
          :class="i === 0 ? 'text-rose-400' : 'text-stone-400'"
        >
          {{ w }}
        </span>
        <span
          v-for="(cell, i) in calendar.cells"
          :key="i"
          class="flex h-9 items-center justify-center"
        >
          <span
            v-if="cell"
            class="flex h-9 w-9 items-center justify-center rounded-full"
            :class="
              cell === calendar.weddingDay
                ? 'bg-blush font-semibold text-white shadow-md'
                : i % 7 === 0
                  ? 'text-rose-400'
                  : 'text-stone-600'
            "
          >
            {{ cell }}
          </span>
        </span>
      </div>
    </div>

    <!-- 카운트다운 -->
    <div class="mt-12">
      <template v-if="!isPast">
        <div class="flex items-center justify-center gap-2">
          <div
            v-for="unit in units"
            :key="unit.label"
            class="w-[72px] rounded-xl bg-white py-4 shadow-sm ring-1 ring-stone-200/70"
          >
            <p class="font-serif text-2xl font-medium tabular-nums text-stone-800">
              {{ pad(unit.value) }}
            </p>
            <p class="mt-1 text-[10px] tracking-widest text-stone-400">{{ unit.label }}</p>
          </div>
        </div>
        <p class="mt-6 text-sm text-stone-600">
          {{ wedding.groom.name }} ♥ {{ wedding.bride.name }}의 결혼식이
          <span class="font-semibold text-blush">{{ days }}일</span> 남았습니다.
        </p>
      </template>
      <p v-else class="text-sm text-stone-600">
        {{ wedding.groom.name }} ♥ {{ wedding.bride.name }}, 결혼식이 시작되었습니다!
      </p>
    </div>
  </section>
</template>
