<script setup lang="ts">
import { wedding } from '../config/wedding'

const contacts = [
  { label: '신랑', name: wedding.groom.name, phone: wedding.groom.phone },
  { label: '신부', name: wedding.bride.name, phone: wedding.bride.phone },
  { label: '신랑 아버지', name: wedding.groom.father.name, phone: wedding.groom.father.phone },
  { label: '신부 아버지', name: wedding.bride.father.name, phone: wedding.bride.father.phone },
  { label: '신랑 어머니', name: wedding.groom.mother.name, phone: wedding.groom.mother.phone },
  { label: '신부 어머니', name: wedding.bride.mother.name, phone: wedding.bride.mother.phone },
]
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Contact</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">연락하기</h2>

    <div class="mt-8 grid grid-cols-2 gap-3">
      <div
        v-for="contact in contacts"
        :key="contact.label"
        class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70"
      >
        <p class="text-xs text-stone-400">{{ contact.label }}</p>
        <p class="mt-1 text-sm font-medium text-stone-700">{{ contact.name }}</p>
        <div class="mt-3 flex justify-center gap-2">
          <a
            :href="`tel:${contact.phone}`"
            class="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-stone-600 ring-1 ring-stone-200 hover:bg-stone-200"
            :aria-label="`${contact.label}에게 전화`"
          >
            전화
          </a>
          <a
            :href="`sms:${contact.phone}`"
            class="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-stone-600 ring-1 ring-stone-200 hover:bg-stone-200"
            :aria-label="`${contact.label}에게 문자`"
          >
            문자
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
