const allowedTags = new Set(['A', 'B', 'BLOCKQUOTE', 'BR', 'EM', 'H2', 'H3', 'I', 'LI', 'OL', 'P', 'STRONG', 'U', 'UL'])

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

export function sanitizeRichText(html: string) {
  if (typeof document === 'undefined') return html

  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const output = document.createElement('div')

  const copyNode = (node: Node, parent: HTMLElement) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent ?? ''))
      return
    }
    if (!(node instanceof HTMLElement)) return

    const tag = node.tagName
    if (!allowedTags.has(tag)) {
      node.childNodes.forEach((child) => copyNode(child, parent))
      return
    }

    const safeElement = document.createElement(tag.toLowerCase())
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