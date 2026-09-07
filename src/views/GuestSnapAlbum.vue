<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import GuestSnapLayout from '../components/GuestSnapLayout.vue'
import PhotoViewer from '../components/PhotoViewer.vue'
import {
  isGuestSnapConfigured,
  listGuestSnaps,
  type GuestSnapItem,
} from '../api/guestSnap'

const configured = isGuestSnapConfigured()
const items = ref<GuestSnapItem[]>([])
const cursor = ref<string | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const viewerIndex = ref<number | null>(null)

const images = computed(() => items.value.map((it) => it.url))

async function load(reset: boolean) {
  if (!configured) return
  if (reset) {
    loading.value = true
    error.value = ''
  } else {
    loadingMore.value = true
  }
  try {
    const res = await listGuestSnaps(reset ? null : cursor.value)
    items.value = reset ? res.items : [...items.value, ...res.items]
    cursor.value = res.nextToken
  } catch (err) {
    error.value = err instanceof Error ? err.message : '사진을 불러오지 못했어요'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function open(i: number) {
  viewerIndex.value = i
}

onMounted(() => {
  void load(true)
})
</script>

<template>
  <GuestSnapLayout>
    <template #title>손님이 남겨준 사진</template>
    <template #subtitle>예식에서 올려주신 사진을 모았어요.</template>

    <div
      v-if="!configured"
      class="rounded-lg bg-gray-100 px-6 py-10 text-center"
    >
      <p class="font-serif text-sm text-stone-500">게스트 스냅 API가 아직 연결되지 않았어요.</p>
    </div>

    <div
      v-else-if="loading"
      class="rounded-lg bg-gray-100 px-6 py-10 text-center"
    >
      <p class="font-serif text-sm text-stone-500">사진을 불러오는 중…</p>
    </div>

    <div
      v-else-if="error"
      class="rounded-lg bg-gray-100 px-6 py-10 text-center"
    >
      <p class="font-serif text-sm text-stone-500">{{ error }}</p>
      <button
        type="button"
        class="mt-4 rounded-xl bg-blush px-5 py-2 text-sm font-medium text-white"
        @click="load(true)"
      >
        다시 시도
      </button>
    </div>

    <div
      v-else-if="!items.length"
      class="rounded-lg bg-gray-100 px-6 py-10 text-center"
    >
      <p class="font-serif text-sm text-stone-500">아직 올라온 사진이 없어요.</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="(item, i) in items"
          :key="item.key"
          type="button"
          class="aspect-square overflow-hidden rounded-md bg-gray-100"
          :aria-label="`게스트 사진 ${i + 1}`"
          @click="open(i)"
        >
          <img :src="item.url" :alt="`게스트 사진 ${i + 1}`" loading="lazy" class="h-full w-full object-cover" />
        </button>
      </div>

      <button
        v-if="cursor"
        type="button"
        class="mt-6 w-full rounded-xl bg-white py-3 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 disabled:opacity-50"
        :disabled="loadingMore"
        @click="load(false)"
      >
        {{ loadingMore ? '불러오는 중…' : '더 보기' }}
      </button>
    </template>

    <PhotoViewer :images="images" :index="viewerIndex" @update:index="viewerIndex = $event" />
  </GuestSnapLayout>
</template>
