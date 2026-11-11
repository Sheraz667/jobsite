import { usePageMeta } from '../lib/usePageMeta'

interface StaticPageProps {
  title: string
  intro: string
  list?: string[]
  actionHref?: string
  actionLabel?: string
}

export function StaticPage({ title, intro, list = [], actionHref, actionLabel }: StaticPageProps) {
  usePageMeta({ title: `${title} | PakJobInfo`, description: intro })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Pakistan Jobs Portal</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">{intro}</p>

        {list.length > 0 && (
          <ul className="mt-6 space-y-3 pl-5 text-slate-700">
            {list.map((item) => (
              <li key={item} className="list-disc leading-7">{item}</li>
            ))}
          </ul>
        )}

        {actionHref && actionLabel && (
          <a
            href={actionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#013d2d] px-6 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-[#005b3f] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7d154]"
          >
            {actionLabel}
          </a>
        )}
      </div>
    </div>
  )
}
