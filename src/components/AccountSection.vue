<script setup lang="ts">
import { ref } from 'vue'
import { wedding, type Account } from '../config/wedding'

const groups = [
  { id: 'groom', title: '신랑측 계좌번호', accounts: wedding.accounts.groom },
  { id: 'bride', title: '신부측 계좌번호', accounts: wedding.accounts.bride },
]

const openGroup = ref<string | null>(null)
const copiedKey = ref<string | null>(null)

function toggle(id: string) {
  openGroup.value = openGroup.value === id ? null : id
}

async function copy(account: Account) {
  const text = `${account.bank} ${account.number}`
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copiedKey.value = account.number
  setTimeout(() => {
    if (copiedKey.value === account.number) copiedKey.value = null
  }, 1500)
}
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Account</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">마음 전하실 곳</h2>
    <p class="mt-4 text-sm leading-6 text-stone-500">
      참석이 어려우신 분들을 위해<br />계좌번호를 기재하였습니다.<br />너른 마음으로 양해 부탁드립니다.
    </p>

    <div class="mt-8 space-y-3">
      <div
        v-for="group in groups"
        :key="group.id"
        class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200/70"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-stone-700"
          @click="toggle(group.id)"
        >
          {{ group.title }}
          <span
            class="text-stone-400 transition-transform duration-300"
            :class="{ 'rotate-180': openGroup === group.id }"
          >
            ▾
          </span>
        </button>
        <div v-show="openGroup === group.id" class="divide-y divide-stone-100 border-t border-stone-100">
          <div
            v-for="account in group.accounts"
            :key="account.number"
            class="flex items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <div>
              <p class="text-xs text-stone-400">{{ account.label }} · {{ account.holder }}</p>
              <p class="mt-1 text-sm text-stone-700">{{ account.bank }} {{ account.number }}</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ring-1 transition-colors"
              :class="
                copiedKey === account.number
                  ? 'bg-blush text-white ring-blush'
                  : 'bg-gray-100 text-stone-600 ring-stone-200 hover:bg-stone-200'
              "
              @click="copy(account)"
            >
              {{ copiedKey === account.number ? '복사됨' : '복사' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
