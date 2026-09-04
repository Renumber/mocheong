<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { isAmplifyConfigured } from '../amplify'
import { currentAdmin, loginAdmin, logoutAdmin } from '../composables/useAdminAuth'
import { deleteGuestbook, listGuestbook, type GuestbookEntry } from '../composables/useGuestbook'
import { downloadAllSnaps, downloadSnap, listSnaps, type SnapItem } from '../composables/useGuestSnap'
import { deleteRsvp, listRsvps, type RsvpRecord } from '../composables/useRsvp'

type Tab = 'rsvp' | 'guestbook' | 'snaps'

const available = isAmplifyConfigured()
const checking = ref(true)
const signedIn = ref(false)
const password = ref('')
const loginError = ref('')
const loggingIn = ref(false)

const tab = ref<Tab>('rsvp')
const loading = ref(false)
const actionError = ref('')

const rsvps = ref<RsvpRecord[]>([])
const guestbook = ref<GuestbookEntry[]>([])
const snaps = ref<SnapItem[]>([])

const attendingCount = computed(() =>
  rsvps.value.filter((row) => row.attending).reduce((sum, row) => sum + row.guestCount, 0),
)
const declineCount = computed(() => rsvps.value.filter((row) => !row.attending).length)

onMounted(async () => {
  if (!available) {
    checking.value = false
    return
  }
  signedIn.value = Boolean(await currentAdmin())
  checking.value = false
  if (signedIn.value) await loadTab()
})

async function onLogin() {
  loginError.value = ''
  loggingIn.value = true
  try {
    await loginAdmin(password.value)
    signedIn.value = true
    password.value = ''
    await loadTab()
  } catch (err) {
    loginError.value = err instanceof Error ? err.message : '들어가지 못했습니다'
  } finally {
    loggingIn.value = false
  }
}

async function onLogout() {
  await logoutAdmin()
  signedIn.value = false
}

async function loadTab() {
  loading.value = true
  actionError.value = ''
  try {
    if (tab.value === 'rsvp') rsvps.value = await listRsvps()
    if (tab.value === 'guestbook') guestbook.value = await listGuestbook('userPool')
    if (tab.value === 'snaps') snaps.value = await listSnaps()
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : '불러오지 못했습니다'
  } finally {
    loading.value = false
  }
}

async function selectTab(next: Tab) {
  tab.value = next
  await loadTab()
}

function formatDate(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function snapName(path: string) {
  return path.split('/').at(-1) || path
}

function exportCsv() {
  const header = ['이름', '측', '참석', '인원', '제출시각']
  const rows = rsvps.value.map((row) => [
    row.name,
    row.side === 'groom' ? '신랑측' : '신부측',
    row.attending ? '참석' : '불참',
    String(row.guestCount),
    row.createdAt ? new Date(row.createdAt).toLocaleString('ko-KR') : '',
  ])
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rsvp.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function removeRsvp(id: string) {
  if (!confirm('이 참석 응답을 삭제할까요?')) return
  await deleteRsvp(id)
  rsvps.value = rsvps.value.filter((row) => row.id !== id)
}

async function removeGuestbook(id: string) {
  if (!confirm('이 방명록을 삭제할까요?')) return
  await deleteGuestbook(id)
  guestbook.value = guestbook.value.filter((row) => row.id !== id)
}

async function saveSnap(path: string) {
  actionError.value = ''
  try {
    await downloadSnap(path)
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : '내려받지 못했습니다'
  }
}

async function saveAllSnaps() {
  actionError.value = ''
  try {
    await downloadAllSnaps(snaps.value)
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : '내려받지 못했습니다'
  }
}

const tabBtn = (active: boolean) =>
  active
    ? 'rounded-full bg-blush px-4 py-2 text-sm font-medium text-white'
    : 'rounded-full bg-white px-4 py-2 text-sm text-stone-600 ring-1 ring-stone-200'
</script>

<template>
  <div class="min-h-screen bg-[#efece6] px-4 py-10">
    <div class="mx-auto w-full max-w-3xl rounded-2xl bg-ivory p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
      <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Admin</p>
      <h1 class="mt-3 font-serif text-2xl text-stone-800">관리자</h1>

      <p v-if="!available" class="mt-8 text-sm text-stone-500">
        백엔드가 아직 연결되지 않았습니다. Amplify Gen 2 sandbox 또는 fullstack 배포 후
        <code class="rounded bg-gray-100 px-1">amplify_outputs.json</code>이 생기면 사용할 수 있습니다.
      </p>

      <p v-else-if="checking" class="mt-8 text-sm text-stone-400">확인 중...</p>

      <form v-else-if="!signedIn" class="mt-8 max-w-sm space-y-4" @submit.prevent="onLogin">
        <label class="block">
          <span class="mb-2 block text-xs text-stone-400">비밀번호</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-xl bg-white px-4 py-3 text-sm text-stone-700 ring-1 ring-stone-200 outline-none focus:ring-blush"
          />
        </label>
        <p v-if="loginError" class="text-sm text-red-700">{{ loginError }}</p>
        <button
          type="submit"
          class="w-full rounded-xl bg-blush py-3 text-sm font-semibold text-white disabled:opacity-60"
          :disabled="loggingIn || !password"
        >
          {{ loggingIn ? '확인 중...' : '들어가기' }}
        </button>
      </form>

      <div v-else class="mt-8">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            <button type="button" :class="tabBtn(tab === 'rsvp')" @click="selectTab('rsvp')">참석</button>
            <button type="button" :class="tabBtn(tab === 'guestbook')" @click="selectTab('guestbook')">
              방명록
            </button>
            <button type="button" :class="tabBtn(tab === 'snaps')" @click="selectTab('snaps')">스냅</button>
          </div>
          <button
            type="button"
            class="rounded-xl bg-white px-4 py-2 text-sm text-stone-600 ring-1 ring-stone-200 hover:bg-gray-100"
            @click="onLogout"
          >
            로그아웃
          </button>
        </div>

        <p v-if="actionError" class="mt-4 text-sm text-red-700">{{ actionError }}</p>
        <p v-if="loading" class="mt-6 text-sm text-stone-400">불러오는 중...</p>

        <section v-else-if="tab === 'rsvp'" class="mt-6">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <p class="text-sm text-stone-600">
              참석 {{ attendingCount }}명 · 불참 {{ declineCount }}건
            </p>
            <button
              type="button"
              class="rounded-xl bg-white px-4 py-2 text-sm text-stone-700 ring-1 ring-stone-200 hover:bg-gray-100"
              :disabled="rsvps.length === 0"
              @click="exportCsv"
            >
              CSV 받기
            </button>
          </div>
          <div class="mt-4 overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200/70">
            <table class="w-full min-w-[520px] text-left text-sm">
              <thead class="bg-gray-100 text-xs text-stone-500">
                <tr>
                  <th class="px-4 py-3 font-medium">이름</th>
                  <th class="px-4 py-3 font-medium">측</th>
                  <th class="px-4 py-3 font-medium">참석</th>
                  <th class="px-4 py-3 font-medium">인원</th>
                  <th class="px-4 py-3 font-medium">시각</th>
                  <th class="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rsvps" :key="row.id" class="border-t border-stone-100">
                  <td class="px-4 py-3 text-stone-700">{{ row.name }}</td>
                  <td class="px-4 py-3 text-stone-600">{{ row.side === 'groom' ? '신랑측' : '신부측' }}</td>
                  <td class="px-4 py-3">{{ row.attending ? '참석' : '불참' }}</td>
                  <td class="px-4 py-3">{{ row.guestCount }}</td>
                  <td class="px-4 py-3 text-stone-400">{{ formatDate(row.createdAt) }}</td>
                  <td class="px-4 py-3 text-right">
                    <button type="button" class="text-xs text-stone-400 hover:text-red-700" @click="removeRsvp(row.id)">
                      삭제
                    </button>
                  </td>
                </tr>
                <tr v-if="rsvps.length === 0">
                  <td colspan="6" class="px-4 py-8 text-center text-stone-400">아직 응답이 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-else-if="tab === 'guestbook'" class="mt-6 space-y-3">
          <article
            v-for="entry in guestbook"
            :key="entry.id"
            class="rounded-xl bg-white px-5 py-4 ring-1 ring-stone-200/70"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-medium text-stone-700">{{ entry.name }}</p>
                <p class="mt-1 text-xs text-stone-400">{{ formatDate(entry.createdAt) }}</p>
              </div>
              <button
                type="button"
                class="text-xs text-stone-400 hover:text-red-700"
                @click="removeGuestbook(entry.id)"
              >
                삭제
              </button>
            </div>
            <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">{{ entry.message }}</p>
          </article>
          <p v-if="guestbook.length === 0" class="text-sm text-stone-400">아직 방명록이 없습니다.</p>
        </section>

        <section v-else class="mt-6">
          <div class="flex justify-end">
            <button
              type="button"
              class="rounded-xl bg-white px-4 py-2 text-sm text-stone-700 ring-1 ring-stone-200 hover:bg-gray-100 disabled:opacity-50"
              :disabled="snaps.length === 0"
              @click="saveAllSnaps"
            >
              모두 받기
            </button>
          </div>
          <ul class="mt-4 space-y-2">
            <li
              v-for="item in snaps"
              :key="item.path"
              class="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-stone-200/70"
            >
              <div class="min-w-0">
                <p class="truncate text-stone-700">{{ snapName(item.path) }}</p>
                <p class="text-xs text-stone-400">
                  {{ item.lastModified ? formatDate(item.lastModified.toISOString()) : '' }}
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-md bg-gray-100 px-3 py-1.5 text-xs text-stone-600 ring-1 ring-stone-200 hover:bg-stone-200"
                @click="saveSnap(item.path)"
              >
                받기
              </button>
            </li>
          </ul>
          <p v-if="snaps.length === 0" class="mt-6 text-sm text-stone-400">아직 올린 사진이 없습니다.</p>
        </section>
      </div>
    </div>
  </div>
</template>
