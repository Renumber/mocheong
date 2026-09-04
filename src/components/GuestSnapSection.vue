<script setup lang="ts">
import { ref } from 'vue'
import { isAmplifyConfigured } from '../amplify'
import { uploadSnap } from '../composables/useGuestSnap'
import { resizeImage } from '../lib/resizeImage'

const available = isAmplifyConfigured()
const fileInput = ref<HTMLInputElement | null>(null)
const website = ref('')
const uploading = ref(false)
const progress = ref(0)
const done = ref(false)
const error = ref('')

async function onFile(event: Event) {
  error.value = ''
  done.value = false
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (website.value) {
    done.value = true
    return
  }

  uploading.value = true
  progress.value = 10
  try {
    const blob = await resizeImage(file)
    progress.value = 40
    await uploadSnap(blob)
    progress.value = 100
    done.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : '사진을 저장하지 못했습니다'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Guest Snap</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">게스트 스냅</h2>
    <p class="mt-4 text-sm leading-6 text-stone-500">
      예식에서 찍은 사진을 남겨 주세요.<br />신랑신부가 나중에 받아 갑니다.
    </p>

    <p v-if="!available" class="mt-8 text-sm text-stone-500">지금은 사진을 받을 수 없습니다.</p>

    <div v-else class="mt-8 space-y-4">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFile"
      />
      <label class="absolute -left-[10000px] h-px w-px overflow-hidden">
        홈페이지
        <input v-model="website" type="text" tabindex="-1" autocomplete="off" />
      </label>

      <button
        type="button"
        class="w-full rounded-xl bg-blush py-4 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
        :disabled="uploading"
        @click="fileInput?.click()"
      >
        {{ uploading ? '올리는 중...' : '사진 올리기' }}
      </button>

      <div v-if="uploading" class="h-1 overflow-hidden rounded-full bg-gray-100">
        <div class="h-full bg-blush transition-all" :style="{ width: `${progress}%` }" />
      </div>

      <p v-if="done" class="text-sm text-stone-600">저장됐어요. 신랑신부가 나중에 받습니다.</p>
      <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
    </div>
  </section>
</template>
