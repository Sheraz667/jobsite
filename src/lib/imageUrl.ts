export function normalizeImageUrl(value: string) {
  const trimmed = value.trim()
  const fileId = trimmed.match(/drive\.google\.com\/file\/d\/([^/?]+)/)?.[1]
    ?? trimmed.match(/[?&]id=([^&]+)/)?.[1]

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`
  }

  return trimmed
}