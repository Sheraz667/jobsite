import { ArrowRight, BookOpenText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBlogs } from '../lib/blogStore'
import { usePageMeta } from '../lib/usePageMeta'

export function BlogsPage() {
  const articles = useBlogs().filter((article) => article.status === 'Published')
  usePageMeta({ title: 'Career Guides & Articles | PakJobInfo', description: 'Practical career guides and information about jobs and applications in Pakistan.' })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-emerald-900/10 pb-6">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#005b3f]"><BookOpenText className="h-4 w-4" /> Career insights</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Guides & articles</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Practical information about jobs, applications, and career opportunities in Pakistan.</p>
      </header>

      {articles.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <Link to={`/blogs/${article.slug}`} className="block">
                <img src={article.thumbnailUrl} alt="" loading="lazy" className="h-52 w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#005b3f]">{article.updatedAt}</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">{article.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#005b3f]">Read article <ArrowRight className="h-4 w-4" /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xl font-semibold text-slate-800">Articles are coming soon.</p>
          <p className="mt-2 text-slate-600">Check back for career guides and useful information.</p>
        </div>
      )}
    </div>
  )
}