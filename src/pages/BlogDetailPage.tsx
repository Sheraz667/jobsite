import { ArrowLeft, CalendarDays } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useBlogs } from '../lib/blogStore'
import { sanitizeRichText } from '../lib/sanitizeRichText'
import { usePageMeta } from '../lib/usePageMeta'

export function BlogDetailPage() {
  const { slug } = useParams()
  const article = useBlogs().find((item) => item.slug === slug && item.status === 'Published')

  usePageMeta({
    title: article ? `${article.title} | PakJobInfo` : 'Career article | PakJobInfo',
    description: article?.excerpt ?? 'Career guides and information from PakJobInfo.',
    image: article?.thumbnailUrl,
  })

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-slate-900">Article not found</h1>
        <Link to="/blogs" className="mt-5 inline-flex items-center gap-2 font-semibold text-[#005b3f]"><ArrowLeft className="h-4 w-4" /> Back to articles</Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/blogs" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#005b3f]"><ArrowLeft className="h-4 w-4" /> All articles</Link>
      <header>
        <p className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> {article.updatedAt}</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">{article.title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{article.excerpt}</p>
      </header>
      <img src={article.thumbnailUrl} alt="" className="mt-8 max-h-[30rem] w-full rounded-2xl object-cover" />
      <div className="rich-article mt-8 text-base leading-8 text-slate-700" dangerouslySetInnerHTML={{ __html: sanitizeRichText(article.content) }} />
    </article>
  )
}