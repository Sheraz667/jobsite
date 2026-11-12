export function normalizeImageUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) return trimmed

  try {
    const url = new URL(trimmed)
    if (url.hostname === 'drive.google.com' || url.hostname === 'www.drive.google.com') {
      const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get('id')
      if (fileId) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`
    }
    return url.protocol === 'https:' || url.protocol === 'http:' ? trimmed : ''
  } catch {
    return ''
  }
}