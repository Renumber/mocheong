<script setup lang="ts">
import CoverSection from '../components/CoverSection.vue'
import GreetingSection from '../components/GreetingSection.vue'
import CalendarSection from '../components/CalendarSection.vue'
import GallerySection from '../components/GallerySection.vue'
import LocationSection from '../components/LocationSection.vue'
import AccountSection from '../components/AccountSection.vue'
import ContactSection from '../components/ContactSection.vue'
import SeatSideSection from '../components/SeatSideSection.vue'
import ShareSection from '../components/ShareSection.vue'
import { wedding } from '../config/wedding'
</script>

<template>
  <div class="mx-auto min-h-screen max-w-[430px] bg-ivory shadow-xl">
    <CoverSection />
    <main class="divide-y divide-stone-200/70">
      <GreetingSection v-reveal />
      <CalendarSection v-reveal />
      <GallerySection v-reveal />
      <LocationSection v-reveal />
      <AccountSection v-reveal />
      <ContactSection v-reveal />
      <SeatSideSection v-reveal />
      <ShareSection v-reveal />
    </main>
    <footer class="py-10 text-center text-xs text-stone-400">
      {{ wedding.groom.name }} ♥ {{ wedding.bride.name }}
    </footer>
  </div>
</template>
