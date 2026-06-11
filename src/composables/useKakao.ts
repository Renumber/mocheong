import { ref } from 'vue'
import { wedding } from '../config/wedding'

declare global {
  interface Window {
    Kakao?: any
    kakao?: any
  }
}

const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.7/kakao.min.js'

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

let shareSdkPromise: Promise<void> | null = null

/** Kakao 공유(JS SDK) 초기화 */
export function useKakaoShare() {
  const ready = ref(false)

  async function init() {
    if (!shareSdkPromise) {
      shareSdkPromise = loadScript(KAKAO_SDK_URL).then(() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(wedding.kakaoJsKey)
        }
      })
    }
    await shareSdkPromise
    ready.value = true
  }

  function shareToKakao() {
    if (!window.Kakao?.isInitialized()) return
    window.Kakao.Share.sendDefault({
      objectType: 'location',
      address: wedding.venue.address,
      addressTitle: wedding.venue.name,
      content: {
        title: wedding.ogTitle,
        description: wedding.ogDescription,
        imageUrl: wedding.ogImage,
        link: {
          mobileWebUrl: wedding.siteUrl,
          webUrl: wedding.siteUrl,
        },
      },
      buttons: [
        {
          title: '청첩장 보기',
          link: {
            mobileWebUrl: wedding.siteUrl,
            webUrl: wedding.siteUrl,
          },
        },
      ],
    })
  }

  return { ready, init, shareToKakao }
}

let mapSdkPromise: Promise<void> | null = null

/** Kakao 지도 SDK 로드 */
export function loadKakaoMap(): Promise<void> {
  if (!mapSdkPromise) {
    mapSdkPromise = loadScript(
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${wedding.kakaoJsKey}&autoload=false`,
    ).then(
      () =>
        new Promise<void>((resolve) => {
          window.kakao.maps.load(() => resolve())
        }),
    )
  }
  return mapSdkPromise
}
