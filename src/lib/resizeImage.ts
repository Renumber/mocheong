const MAX_EDGE = 1600
const MAX_INPUT_BYTES = 15 * 1024 * 1024

export async function resizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지만 올릴 수 있어요')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('파일이 너무 커요 (15MB 이하)')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('이미지를 처리할 수 없어요')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), 'image/jpeg', 0.82)
  })
  if (!blob) throw new Error('이미지를 처리할 수 없어요')
  return blob
}
