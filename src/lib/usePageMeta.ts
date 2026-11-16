import { useEffect } from 'react'

interface PageMeta {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
  robots?: string
}

const siteOrigin = 'https://pakjobinfo.com'

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = value
}

function removeMeta(attribute: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove()
}

function shortDescription(description: string) {
  const cleanDescription = description.trim().replace(/\s+/g, ' ')
  if (cleanDescription.length <= 160) return cleanDescription
  return `${cleanDescription.slice(0, 157).replace(/\s+\S*$/, '')}...`
}

export function usePageMeta({ title, description, image, type = 'website', robots = 'index,follow' }: PageMeta) {
  useEffect(() => {
    const canonicalUrl = `${siteOrigin}${window.location.pathname}`
    const metaDescription = shortDescription(description)
    const imageUrl = image ? new URL(image, siteOrigin).href : undefined

    document.title = title
    setMeta('name', 'description', metaDescription)
    setMeta('name', 'robots', robots)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', metaDescription)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('name', 'twitter:card', imageUrl ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', metaDescription)
    if (imageUrl) {
      setMeta('property', 'og:image', imageUrl)
      setMeta('name', 'twitter:image', imageUrl)
    } else {
      removeMeta('property', 'og:image')
      removeMeta('name', 'twitter:image')
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = canonicalUrl
  }, [title, description, image, type, robots])
}