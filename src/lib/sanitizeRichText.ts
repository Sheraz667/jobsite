const allowedTags = new Set(['A', 'B', 'BLOCKQUOTE', 'BR', 'DIV', 'EM', 'FONT', 'H2', 'H3', 'I', 'LI', 'OL', 'P', 'SPAN', 'STRONG', 'U', 'UL'])
const highlightedColors = new Set(['#fff3a3', 'rgb(255, 243, 163)'])
const alignableTags = new Set(['BLOCKQUOTE', 'DIV', 'H2', 'H3', 'LI', 'P'])

interface SanitizeOptions {
  allowLinks?: boolean
}

function safeHref(value: string) {
  const href = value.trim()
  if (href.startsWith('/') && !href.startsWith('//')) return href

  try {
    const url = new URL(href)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

export function sanitizeRichText(html: string, { allowLinks = true }: SanitizeOptions = {}) {
  if (typeof document === 'undefined') return html

  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const output = document.createElement('div')

  const copyNode = (node: Node, parent: HTMLElement) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const lines = (node.textContent ?? '').split(/\r\n?|\n/)
      lines.forEach((line, index) => {
        if (index > 0) parent.append(document.createElement('br'))
        if (line) parent.append(document.createTextNode(line))
      })
      return
    }
    if (!(node instanceof HTMLElement)) return

    const tag = node.tagName
    if (tag === 'A' && !allowLinks) {
      node.childNodes.forEach((child) => copyNode(child, parent))
      return
    }
    if (!allowedTags.has(tag)) {
      node.childNodes.forEach((child) => copyNode(child, parent))
      return
    }

    const safeElement = document.createElement(tag === 'FONT' ? 'span' : tag.toLowerCase())
    if (alignableTags.has(tag)) {
      const alignment = (node.style.textAlign || node.getAttribute('align') || '').toLowerCase()
      if (['left', 'center', 'right'].includes(alignment)) safeElement.style.textAlign = alignment
    }
    if ((tag === 'SPAN' || tag === 'FONT') && highlightedColors.has(node.style.backgroundColor.toLowerCase())) {
      safeElement.style.backgroundColor = '#fff3a3'
    }
    if (tag === 'A') {
      const href = safeHref(node.getAttribute('href') ?? '')
      if (href) {
        safeElement.setAttribute('href', href)
        if (/^https?:\/\//i.test(href)) {
          safeElement.setAttribute('target', '_blank')
          safeElement.setAttribute('rel', 'noopener noreferrer')
        }
      }
    }
    node.childNodes.forEach((child) => copyNode(child, safeElement))
    parent.append(safeElement)
  }

  parsed.body.childNodes.forEach((node) => copyNode(node, output))
  return output.innerHTML
}

export function plainTextFromRichText(html: string) {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, ' ').trim()
  return new DOMParser().parseFromString(sanitizeRichText(html), 'text/html').body.textContent?.trim() ?? ''
}