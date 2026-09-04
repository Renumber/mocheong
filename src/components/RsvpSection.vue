<script setup lang="ts">
import { ref } from 'vue'
import { isAmplifyConfigured } from '../amplify'
import { createRsvp, type RsvpSide } from '../composables/useRsvp'

const available = isAmplifyConfigured()
const name = ref('')
const side = ref<RsvpSide>('groom')
const attending = ref<'yes' | 'no'>('yes')
const guestCount = ref(1)
const website = ref('')
const submitting = ref(false)
const done = ref(false)
const error = ref('')

const inputClass =
  'w-full rounded-xl bg-white px-4 py-3 text-left text-sm text-stone-700 shadow-sm ring-1 ring-stone-200 outline-none focus:ring-blush'

async function submit() {
  error.value = ''
  if (website.value) {
    done.value = true
    return
  }
  const trimmed = name.value.trim()
  if (!trimmed) {
    error.value = '이름을 적어 주세요'
    return
  }
  if (trimmed.length > 40) {
    error.value = '이름은 40자 이하로 적어 주세요'
    return
  }

  const isAttending = attending.value === 'yes'
  const count = isAttending ? Number(guestCount.value) : 0
  if (isAttending && (!Number.isInteger(count) || count < 1 || count > 20)) {
    error.value = '인원은 1명에서 20명까지예요'
    return
  }

  submitting.value = true
  try {
    await createRsvp({
      name: trimmed,
      side: side.value,
      attending: isAttending,
      guestCount: count,
    })
    done.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : '참석 여부를 저장하지 못했습니다'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">RSVP</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">참석 여부</h2>
    <p class="mt-4 text-sm leading-6 text-stone-500">
      자리를 준비하는 데 도움이 됩니다.<br />편하게 알려 주세요.
    </p>

    <p v-if="!available" class="mt-8 text-sm text-stone-500">지금은 참석 여부를 받을 수 없습니다.</p>

    <p v-else-if="done" class="mt-10 font-serif text-base text-stone-700">참석 여부를 전달했습니다.</p>

    <form v-else class="mt-8 space-y-5 text-left" @submit.prevent="submit">
      <label class="block">
        <span class="mb-2 block text-xs text-stone-400">이름</span>
        <input v-model="name" type="text" maxlength="40" autocomplete="name" :class="inputClass" />
      </label>

      <fieldset>
        <legend class="mb-2 text-xs text-stone-400">어느 쪽이신가요?</legend>
        <div class="grid grid-cols-2 gap-2">
          <label
            class="cursor-pointer rounded-xl bg-white px-3 py-3 text-center text-sm ring-1 transition-colors"
            :class="side === 'groom' ? 'text-blush ring-blush' : 'text-stone-600 ring-stone-200'"
          >
            <input v-model="side" type="radio" value="groom" class="sr-only" />
            신랑측
          </label>
          <label
            class="cursor-pointer rounded-xl bg-white px-3 py-3 text-center text-sm ring-1 transition-colors"
            :class="side === 'bride' ? 'text-blush ring-blush' : 'text-stone-600 ring-stone-200'"
          >
            <input v-model="side" type="radio" value="bride" class="sr-only" />
            신부측
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-2 text-xs text-stone-400">참석하시나요?</legend>
        <div class="grid grid-cols-2 gap-2">
          <label
            class="cursor-pointer rounded-xl bg-white px-3 py-3 text-center text-sm ring-1 transition-colors"
            :class="attending === 'yes' ? 'text-blush ring-blush' : 'text-stone-600 ring-stone-200'"
          >
            <input v-model="attending" type="radio" value="yes" class="sr-only" />
            참석합니다
          </label>
          <label
            class="cursor-pointer rounded-xl bg-white px-3 py-3 text-center text-sm ring-1 transition-colors"
            :class="attending === 'no' ? 'text-blush ring-blush' : 'text-stone-600 ring-stone-200'"
          >
            <input v-model="attending" type="radio" value="no" class="sr-only" />
            못 갑니다
          </label>
        </div>
      </fieldset>

      <label v-if="attending === 'yes'" class="block">
        <span class="mb-2 block text-xs text-stone-400">인원 (본인 포함)</span>
        <input
          v-model.number="guestCount"
          type="number"
          min="1"
          max="20"
          :class="inputClass"
        />
      </label>

      <label class="absolute -left-[10000px] h-px w-px overflow-hidden">
        홈페이지
        <input v-model="website" type="text" tabindex="-1" autocomplete="off" />
      </label>

      <p v-if="error" class="text-center text-sm text-red-700">{{ error }}</p>

      <button
        type="submit"
        class="w-full rounded-xl bg-blush py-4 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
        :disabled="submitting"
      >
        {{ submitting ? '전달하는 중...' : '참석 여부 보내기' }}
      </button>
    </form>
  </section>
</template>
