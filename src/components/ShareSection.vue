<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { wedding } from '../config/wedding'
import { useKakaoShare } from '../composables/useKakao'

const { ready, init, shareToKakao } = useKakaoShare()
const copied = ref(false)

onMounted(() => {
  init().catch(() => {
    // SDK 로드 실패 시 공유 버튼 비활성 상태 유지
  })
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(wedding.siteUrl)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // clipboard 미지원 환경
  }
}
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Share</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">청첩장 공유하기</h2>

    <div class="mt-8 space-y-3">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-4 text-sm font-semibold text-[#191919] shadow-sm transition-opacity disabled:opacity-50"
        :disabled="!ready"
        @click="shareToKakao"
      >
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path
            d="M12 3C6.48 3 2 6.54 2 10.9c0 2.8 1.86 5.26 4.66 6.65l-.95 3.52c-.08.31.27.56.54.38l4.18-2.78c.52.06 1.04.1 1.57.1 5.52 0 10-3.54 10-7.87C22 6.54 17.52 3 12 3z"
          />
        </svg>
        카카오톡으로 공유하기
      </button>

      <button
        type="button"
        class="w-full rounded-xl bg-white py-4 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 transition-colors hover:bg-gray-100"
        @click="copyLink"
      >
        {{ copied ? '링크가 복사되었습니다!' : '청첩장 링크 복사하기' }}
      </button>
    </div>
  </section>
</template>
