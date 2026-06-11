import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export function useCountdown(target: Date) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  const diff = computed(() => Math.max(0, target.getTime() - now.value))
  const isPast = computed(() => target.getTime() <= now.value)

  const days = computed(() => Math.floor(diff.value / 86_400_000))
  const hours = computed(() => Math.floor(diff.value / 3_600_000) % 24)
  const minutes = computed(() => Math.floor(diff.value / 60_000) % 60)
  const seconds = computed(() => Math.floor(diff.value / 1_000) % 60)

  return { days, hours, minutes, seconds, isPast }
}
