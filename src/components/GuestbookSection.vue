<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isAmplifyConfigured } from '../amplify'
import { createGuestbook, listGuestbook, type GuestbookEntry } from '../composables/useGuestbook'

const MESSAGE_MAX = 200
const available = isAmplifyConfigured()
const entries = ref<GuestbookEntry[]>([])
const name = ref('')
const message = ref('')
const website = ref('')
const submitting = ref(false)
const loading = ref(false)
const error = ref('')

const inputClass =
  'w-full rounded-xl bg-white px-4 py-3 text-left text-sm text-stone-700 shadow-sm ring-1 ring-stone-200 outline-none focus:ring-blush'

async function refresh() {
  if (!available) return
  loading.value = true
  try {
    entries.value = await listGuestbook()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '방명록을 불러오지 못했습니다'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refresh()
})

async function submit() {
  error.value = ''
  if (website.value) {
    name.value = ''
    message.value = ''
    return
  }
  const trimmedName = name.value.trim()
  const trimmedMessage = message.value.trim()
  if (!trimmedName) {
    error.value = '이름을 적어 주세요'
    return
  }
  if (trimmedName.length > 40) {
    error.value = '이름은 40자 이하로 적어 주세요'
    return
  }
  if (!trimmedMessage) {
    error.value = '메시지를 적어 주세요'
    return
  }
  if (trimmedMessage.length > MESSAGE_MAX) {
    error.value = `메시지는 ${MESSAGE_MAX}자 이하로 적어 주세요`
    return
  }

  submitting.value = true
  try {
    await createGuestbook(trimmedName, trimmedMessage)
    name.value = ''
    message.value = ''
    await refresh()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '방명록을 저장하지 못했습니다'
  } finally {
    submitting.value = false
  }
}

function formatTime(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(date)
}
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Guestbook</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">방명록</h2>
    <p class="mt-4 text-sm leading-6 text-stone-500">따뜻한 한마디를 남겨 주세요.</p>

    <p v-if="!available" class="mt-8 text-sm text-stone-500">지금은 방명록을 받을 수 없습니다.</p>

    <form v-else class="mt-8 space-y-4 text-left" @submit.prevent="submit">
      <label class="block">
        <span class="mb-2 block text-xs text-stone-400">이름</span>
        <input v-model="name" type="text" maxlength="40" autocomplete="name" :class="inputClass" />
      </label>
      <label class="block">
        <span class="mb-2 flex items-center justify-between text-xs text-stone-400">
          메시지
          <span>{{ message.length }}/{{ MESSAGE_MAX }}</span>
        </span>
        <textarea
          v-model="message"
          rows="3"
          :maxlength="MESSAGE_MAX"
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
        {{ submitting ? '남기는 중...' : '메시지 남기기' }}
      </button>
    </form>

    <div v-if="available" class="mt-8 space-y-3 text-left">
      <p v-if="loading" class="text-center text-sm text-stone-400">불러오는 중...</p>
      <p v-else-if="entries.length === 0" class="text-center text-sm text-stone-400">
        첫 번째 메시지를 남겨 주세요.
      </p>
      <article
        v-for="entry in entries"
        :key="entry.id"
        class="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-stone-200/70"
      >
        <div class="flex items-baseline justify-between gap-3">
          <p class="text-sm font-medium text-stone-700">{{ entry.name }}</p>
          <p class="text-xs text-stone-400">{{ formatTime(entry.createdAt) }}</p>
        </div>
        <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">{{ entry.message }}</p>
      </article>
    </div>
  </section>
</template>
