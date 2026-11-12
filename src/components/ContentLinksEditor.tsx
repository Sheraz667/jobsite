import { Link2, Plus, Trash2 } from 'lucide-react'
import type { ContentLink } from '../types'

interface ContentLinksEditorProps {
  links: ContentLink[]
  onChange: (links: ContentLink[]) => void
}

export function ContentLinksEditor({ links, onChange }: ContentLinksEditorProps) {
  const updateLink = (index: number, patch: Partial<ContentLink>) => {
    onChange(links.map((link, linkIndex) => linkIndex === index ? { ...link, ...patch } : link))
  }

  return (
    <fieldset className="rounded-xl border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">Extra links (optional)</legend>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={`${index}-${link.type}`} className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.3fr)_2.5rem]">
            <select aria-label={`Link ${index + 1} type`} value={link.type} onChange={(event) => updateLink(index, { type: event.target.value as ContentLink['type'] })} className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm outline-none focus:border-[#005b3f]">
              <option value="external">External</option>
              <option value="internal">Internal</option>
            </select>
            <input aria-label={`Link ${index + 1} label`} value={link.label} onChange={(event) => updateLink(index, { label: event.target.value })} placeholder="Button label" className="h-10 min-w-0 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-[#005b3f]" />
            <input aria-label={`Link ${index + 1} URL`} type={link.type === 'external' ? 'url' : 'text'} value={link.url} onChange={(event) => updateLink(index, { url: event.target.value })} placeholder={link.type === 'external' ? 'https://example.com/page' : '/jobs or /admissions'} className="h-10 min-w-0 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-[#005b3f]" />
            <button type="button" onClick={() => onChange(links.filter((_, linkIndex) => linkIndex !== index))} aria-label={`Remove link ${index + 1}`} className="inline-flex size-10 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...links, { label: '', url: '', type: 'external' }])} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Plus className="size-4" /><Link2 className="size-4" />Add link
        </button>
      </div>
    </fieldset>
  )
}
