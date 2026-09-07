<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import {
  guestSnapMaxBytes,
  isGuestSnapConfigured,
  presignUpload,
  putWithProgress,
} from '../api/guestSnap'

type UploadStatus = 'queued' | 'converting' | 'uploading' | 'done' | 'error'

type UploadItem = {
  id: string
  name: string
  previewUrl: string
  status: UploadStatus
  progress: number
  error?: string
}

const configured = isGuestSnapConfigured()
const inputEl = ref<HTMLInputElement | null>(null)
const items = ref<UploadItem[]>([])
const busy = ref(false)
const CONCURRENCY = 3
const MAX_BYTES = guestSnapMaxBytes()
const HEIC_TYPES = new Set(['image/heic', 'image/heif'])

const doneCount = computed(() => items.value.filter((it) => it.status === 'done').length)
const errorCount = computed(() => items.value.filter((it) => it.status === 'error').length)

function inferType(file: File): string {
  if (file.type) return file.type.toLowerCase()
  const name = file.name.toLowerCase()
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.heic')) return 'image/heic'
  if (name.endsWith('.heif')) return 'image/heif'
  return 'image/jpeg'
}

function isHeic(file: File, type: string): boolean {
  return HEIC_TYPES.has(type) || /\.hei[cf]$/i.test(file.name)
}

async function toUploadBlob(file: File): Promise<{ blob: Blob; contentType: string }> {
  const type = inferType(file)
  if (!isHeic(file, type)) {
    return { blob: file, contentType: type || 'image/jpeg' }
  }
  try {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.82 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    return { blob, contentType: 'image/jpeg' }
  } catch {
    return { blob: file, contentType: type || 'image/heic' }
  }
}

async function runPool<T>(tasks: T[], limit: number, worker: (task: T) => Promise<void>) {
  let index = 0
  async function next() {
    while (index < tasks.length) {
      const current = tasks[index]
      index += 1
      await worker(current)
    }
  }
  const n = Math.min(limit, tasks.length)
  await Promise.all(Array.from({ length: n }, () => next()))
}

function openPicker() {
  if (!configured || busy.value) return
  inputEl.value?.click()
}

function patch(id: string, partial: Partial<UploadItem>) {
  const item = items.value.find((it) => it.id === id)
  if (item) Object.assign(item, partial)
}

async function uploadOne(file: File, item: UploadItem) {
  try {
    patch(item.id, { status: 'converting', progress: 0 })
    const { blob, contentType } = await toUploadBlob(file)
    if (blob.size > MAX_BYTES) {
      patch(item.id, { status: 'error', error: '파일이 15MB를 넘어요' })
      return
    }
    patch(item.id, { status: 'uploading', progress: 5 })
    const signed = await presignUpload(contentType, blob.size)
    await putWithProgress(signed.url, blob, signed.headers, (pct) => {
      patch(item.id, { progress: pct })
    })
    patch(item.id, { status: 'done', progress: 100 })
  } catch (err) {
    const message = err instanceof Error ? err.message : '업로드 실패'
    patch(item.id, { status: 'error', error: message })
  }
}

async function onSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''
  if (!files.length) return

  const next: { file: File; item: UploadItem }[] = []
  for (const file of files) {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|hei[cf])$/i.test(file.name)) {
      continue
    }
    const item: UploadItem = {
      id: crypto.randomUUID(),
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      status: file.size > MAX_BYTES ? 'error' : 'queued',
      progress: 0,
      error: file.size > MAX_BYTES ? '파일이 15MB를 넘어요' : undefined,
    }
    items.value.unshift(item)
    if (item.status !== 'error') next.push({ file, item })
  }

  if (!next.length) return
  busy.value = true
  try {
    await runPool(next, CONCURRENCY, ({ file, item }) => uploadOne(file, item))
  } finally {
    busy.value = false
  }
}

onUnmounted(() => {
  for (const item of items.value) URL.revokeObjectURL(item.previewUrl)
})
</script>

<template>
  <section id="guest-snap" class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Guest Snap</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">사진을 남겨주세요</h2>
    <p class="mt-4 text-sm leading-6 text-stone-500">
      예식에서 찍은 사진을 올려주시면<br />저희가 소중히 모아둘게요.
    </p>

    <input
      ref="inputEl"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
      multiple
      class="hidden"
      @change="onSelect"
    />

    <div class="mt-8 space-y-3">
      <button
        type="button"
        class="w-full rounded-xl bg-blush py-4 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
        :disabled="!configured || busy"
        @click="openPicker"
      >
        {{ busy ? '올리는 중...' : '사진 선택하기' }}
      </button>
      <p class="text-xs text-stone-400">
        {{ configured ? 'JPEG, PNG, WEBP, HEIC · 장당 15MB까지' : '준비 중입니다.' }}
      </p>
    </div>

    <p v-if="items.length" class="mt-6 text-xs text-stone-500">
      완료 {{ doneCount }}장
      <span v-if="errorCount"> · 실패 {{ errorCount }}장</span>
    </p>

    <ul v-if="items.length" class="mt-4 grid grid-cols-3 gap-1.5">
      <li
        v-for="item in items"
        :key="item.id"
        class="relative aspect-square overflow-hidden rounded-md bg-gray-100"
      >
        <img :src="item.previewUrl" :alt="item.name" class="h-full w-full object-cover" />
        <div
          v-if="item.status !== 'done'"
          class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 px-1 text-center text-[11px] text-white"
        >
          <template v-if="item.status === 'error'">
            <span>실패</span>
            <span class="mt-0.5 line-clamp-2 text-white/80">{{ item.error }}</span>
          </template>
          <template v-else>
            <span>{{ item.status === 'converting' ? '변환 중' : '업로드 중' }}</span>
            <span class="mt-1 tabular-nums">{{ item.progress }}%</span>
          </template>
        </div>
      </li>
    </ul>
  </section>
</template>
