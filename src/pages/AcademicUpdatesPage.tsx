import { ArrowUpRight, CalendarDays, FileCheck2, Landmark } from 'lucide-react'
import { ContentLinksList } from '../components/ContentLinksList'
import { usePageMeta } from '../lib/usePageMeta'
import { useUpdates } from '../lib/updateStore'
import type { UpdateKind } from '../types.update'

interface AcademicUpdatesPageProps {
  kind: UpdateKind
}

const pageCopy = {
  admissions: {
    title: 'Admissions',
    description: 'Latest admission announcements, application details, and official links from universities and institutes.',
    actionLabel: 'Apply / View admission',
    emptyTitle: 'No admission updates yet',
  },
  results: {
    title: 'Results',
    description: 'Recently announced results with department details, official sources, and result-check links.',
    actionLabel: 'Check result',
    emptyTitle: 'No result updates yet',
  },
} satisfies Record<UpdateKind, { title: string; description: string; actionLabel: string; emptyTitle: string }>

export function AcademicUpdatesPage({ kind }: AcademicUpdatesPageProps) {
  const copy = pageCopy[kind]
  const updates = useUpdates().filter((item) => item.kind === kind && item.status === 'Published')
  usePageMeta({ title: `${copy.title} | PakJobInfo`, description: copy.description })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-8 border-b border-emerald-900/10 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">PakJobInfo updates</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{copy.title}</h1>
        <p className="mt-2 max-w-3xl leading-6 text-slate-600">{copy.description}</p>
      </header>

      {updates.length ? (
        <div className="divide-y divide-slate-200">
          {updates.map((item) => (
            <article key={item.id} className="grid gap-5 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800"><Landmark className="size-3.5" />{item.department}</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{item.updatedAt}</span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-slate-900">{item.title}</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.details}</p>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline">
                  Official source <ArrowUpRight className="size-4" />
                </a>
              </div>
              <a href={item.actionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#013d2d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005b3f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7d154]">
                <FileCheck2 className="size-4" />{copy.actionLabel}
              </a>
              <ContentLinksList links={item.additionalLinks} />
            </article>
          ))}
        </div>
      ) : (
        <div className="border-y border-dashed border-slate-300 py-14 text-center">
          <FileCheck2 className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-3 text-lg font-bold text-slate-800">{copy.emptyTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">New published updates will appear here.</p>
        </div>
      )}
    </div>
  )
}
