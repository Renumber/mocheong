export interface Account {
  bank: string
  number: string
  holder: string
  label: string
}

function parseAccount(raw: string | undefined, label: string): Account | null {
  if (!raw) return null
  const [bank, number, holder] = raw.split('|')
  if (!bank || !number || !holder) return null
  return { bank, number, holder, label }
}

const env = import.meta.env

export const wedding = {
  siteUrl: env.VITE_SITE_URL as string,
  ogTitle: env.VITE_OG_TITLE as string,
  ogDescription: env.VITE_OG_DESCRIPTION as string,
  ogImage: env.VITE_OG_IMAGE as string,
  kakaoJsKey: env.VITE_KAKAO_JS_KEY as string,

  date: new Date(env.VITE_WEDDING_DATE as string),

  venue: {
    name: env.VITE_VENUE_NAME as string,
    hall: env.VITE_VENUE_HALL as string,
    address: env.VITE_VENUE_ADDRESS as string,
    tel: env.VITE_VENUE_TEL as string,
    lat: Number(env.VITE_VENUE_LAT),
    lng: Number(env.VITE_VENUE_LNG),
  },

  groom: {
    name: env.VITE_GROOM_NAME as string,
    phone: env.VITE_GROOM_PHONE as string,
    order: env.VITE_GROOM_ORDER as string,
    father: { name: env.VITE_GROOM_FATHER as string, phone: env.VITE_GROOM_FATHER_PHONE as string },
    mother: { name: env.VITE_GROOM_MOTHER as string, phone: env.VITE_GROOM_MOTHER_PHONE as string },
  },

  bride: {
    name: env.VITE_BRIDE_NAME as string,
    phone: env.VITE_BRIDE_PHONE as string,
    order: env.VITE_BRIDE_ORDER as string,
    father: { name: env.VITE_BRIDE_FATHER as string, phone: env.VITE_BRIDE_FATHER_PHONE as string },
    mother: { name: env.VITE_BRIDE_MOTHER as string, phone: env.VITE_BRIDE_MOTHER_PHONE as string },
  },

  greeting: ((env.VITE_GREETING_MESSAGE as string) ?? '').replace(/\\n/g, '\n'),

  accounts: {
    groom: [
      parseAccount(env.VITE_GROOM_ACCOUNT, '신랑'),
      parseAccount(env.VITE_GROOM_FATHER_ACCOUNT, '신랑 아버지'),
      parseAccount(env.VITE_GROOM_MOTHER_ACCOUNT, '신랑 어머니'),
    ].filter((a): a is Account => a !== null),
    bride: [
      parseAccount(env.VITE_BRIDE_ACCOUNT, '신부'),
      parseAccount(env.VITE_BRIDE_FATHER_ACCOUNT, '신부 아버지'),
      parseAccount(env.VITE_BRIDE_MOTHER_ACCOUNT, '신부 어머니'),
    ].filter((a): a is Account => a !== null),
  },

  transport: {
    subway: env.VITE_TRANSPORT_SUBWAY as string,
    bus: env.VITE_TRANSPORT_BUS as string,
    parking: env.VITE_TRANSPORT_PARKING as string,
  },

  mainImage: env.VITE_MAIN_IMAGE as string,
  galleryImages: ((env.VITE_GALLERY_IMAGES as string) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}

export type Wedding = typeof wedding
