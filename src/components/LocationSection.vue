<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { wedding } from '../config/wedding'
import { loadKakaoMap } from '../composables/useKakao'

const mapEl = ref<HTMLElement | null>(null)
const mapError = ref(false)
const mapInteractive = ref(false)
let mapInstance: any = null

const { name, address, lat, lng } = {
  name: wedding.venue.name,
  address: wedding.venue.address,
  lat: wedding.venue.lat,
  lng: wedding.venue.lng,
}

const navLinks = [
  {
    label: '카카오맵',
    href: `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`,
  },
  {
    label: '네이버지도',
    href: `https://map.naver.com/p/search/${encodeURIComponent(address)}`,
  },
]

function enableMapInteraction() {
  if (!mapInstance || mapInteractive.value) return
  mapInstance.setDraggable(true)
  mapInstance.setZoomable(true)
  mapInteractive.value = true
}

onMounted(async () => {
  try {
    await loadKakaoMap()
    if (!mapEl.value) return
    const kakao = window.kakao
    const center = new kakao.maps.LatLng(lat, lng)
    const map = new kakao.maps.Map(mapEl.value, {
      center,
      level: 3,
      draggable: false,
      scrollwheel: false,
      disableDoubleClickZoom: true,
    })
    map.setZoomable(false)
    mapInstance = map
    new kakao.maps.Marker({ map, position: center })
    new kakao.maps.CustomOverlay({
      map,
      position: center,
      yAnchor: 2.6,
      content: `<div style="padding:4px 10px;background:#fff;border:1px solid #c9a96a;border-radius:9999px;font-size:12px;color:#3f3a36;box-shadow:0 2px 6px rgba(0,0,0,.15);white-space:nowrap;">${name}</div>`,
    })
  } catch {
    mapError.value = true
  }
})
</script>

<template>
  <section class="px-8 py-16 text-center">
    <p class="font-serif text-xs tracking-[0.35em] text-blush uppercase">Location</p>
    <h2 class="mt-3 font-serif text-xl text-stone-800">오시는 길</h2>

    <div class="mt-6 text-[15px] text-stone-700">
      <p class="whitespace-pre-line font-medium">{{ wedding.venue.name }} {{ wedding.venue.hall }}</p>
      <p class="mt-1 whitespace-pre-line text-sm text-stone-500">{{ wedding.venue.address }}</p>
      <a :href="`tel:${wedding.venue.tel}`" class="mt-1 inline-block text-sm text-blush underline">
        {{ wedding.venue.tel }}
      </a>
    </div>

    <!-- 지도: 기본은 스크롤 통과, 탭 후 조작 -->
    <div class="relative mt-6 overflow-hidden rounded-xl ring-1 ring-stone-200">
      <div v-if="!mapError" ref="mapEl" class="h-64 w-full" />
      <a
        v-else
        :href="navLinks[0].href"
        target="_blank"
        rel="noopener"
        class="flex h-64 w-full flex-col items-center justify-center gap-2 bg-gray-100 text-sm text-stone-500"
      >
        <span>지도를 불러오지 못했습니다.</span>
        <span class="text-blush underline">카카오맵에서 위치 보기</span>
      </a>
      <button
        v-if="!mapError && !mapInteractive"
        type="button"
        class="absolute inset-0 z-10 flex items-center justify-center bg-black/20 text-sm font-medium text-white"
        @click="enableMapInteraction"
      >
        <span class="rounded-full bg-black/55 px-4 py-2 backdrop-blur-sm">지도 터치하여 이동</span>
      </button>
    </div>

    <!-- 지도 앱 버튼 -->
    <div class="mt-4 grid grid-cols-2 gap-2">
      <a
        v-for="link in navLinks"
        :key="link.label"
        :href="link.href"
        target="_blank"
        rel="noopener"
        class="rounded-lg bg-white py-3 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200 transition-colors hover:bg-gray-100"
      >
        {{ link.label }}
      </a>
    </div>

    <!-- 교통 안내 -->
    <div class="mt-8 space-y-4 rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-stone-200/70">
      <div>
        <p class="text-sm font-semibold text-stone-700">지하철</p>
        <p class="mt-1 whitespace-pre-line text-sm leading-6 text-stone-500">{{ wedding.transport.subway }}</p>
      </div>
      <div>
        <p class="text-sm font-semibold text-stone-700">버스</p>
        <p class="mt-1 whitespace-pre-line text-sm leading-6 text-stone-500">{{ wedding.transport.bus }}</p>
      </div>
      <div>
        <p class="text-sm font-semibold text-stone-700">주차</p>
        <p class="mt-1 whitespace-pre-line text-sm leading-6 text-stone-500">{{ wedding.transport.parking }}</p>
      </div>
    </div>

    <!-- 화환 안내 -->
    <div class="mt-6 rounded-xl bg-gray-100 px-5 py-4 text-sm leading-6 text-stone-600">
      보다 쾌적하고 안전한 예식 진행을 위해<br />
      축하화환은 정중히 받지 않고 있습니다.<br />
      너른 이해 부탁드립니다.
    </div>
  </section>
</template>
