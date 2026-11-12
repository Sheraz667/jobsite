import { ArrowUpRight, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ContentLink } from '../types'

interface ContentLinksListProps {
  links?: ContentLink[]
}

export function ContentLinksList({ links = [] }: ContentLinksListProps) {
  const safeLinks = Array.isArray(links) ? links.filter((item): item is ContentLink => {
    if (!item || typeof item.label !== 'string' || !item.label.trim() || typeof item.url !== 'string') return false
    if (item.type === 'internal') return item.url.startsWith('/') && !item.url.startsWith('//') && !item.url.includes('\\')
    if (item.type !== 'external') return false
    try {
      const url = new URL(item.url)
      return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
      return false
    }
  }) : []

  if (!safeLinks.length) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {safeLinks.map((item, index) => item.type === 'internal' ? (
        <Link key={`${item.url}-${index}`} to={item.url} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-800/20 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100">
          <Link2 className="size-4" />{item.label}
        </Link>
      ) : (
        <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <ArrowUpRight className="size-4" />{item.label}
        </a>
      ))}
    </div>
  )
}
