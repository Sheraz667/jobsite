import { ArrowLeft, ArrowRight, CalendarDays, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ContentLinksList } from '../components/ContentLinksList'
import { useBlogs } from '../lib/blogStore'
import { sanitizeRichText } from '../lib/sanitizeRichText'
import { usePageMeta } from '../lib/usePageMeta'

export function BlogDetailPage() {
  const { slug } = useParams()
  const publishedArticles = useBlogs()
    .filter((item) => item.status === 'Published')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const article = publishedArticles.find((item) => item.slug === slug)
  const latestArticles = publishedArticles.filter((item) => item.id !== article?.id).slice(0, 3)

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
      <div className="rich-article mx-auto mt-8 max-w-[72ch] text-base leading-8 text-slate-700" dangerouslySetInnerHTML={{ __html: sanitizeRichText(article.content) }} />
      <ContentLinksList links={article.additionalLinks} />
      {article.socialLinks && Object.entries(article.socialLinks).some(([, url]) => Boolean(url)) && (
        <footer className="mt-10 border-t border-slate-200 pt-6">
          <p className="mb-3 text-sm font-semibold text-slate-700">Follow the author</p>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(article.socialLinks).filter(([, url]) => Boolean(url)).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${platform} profile`}
                title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-900/15 bg-white text-[#005b3f] transition hover:border-[#f7d154] hover:bg-[#013d2d] hover:text-white"
              >
                <SocialIcon platform={platform} />
              </a>
            ))}
          </div>
        </footer>
      )}
      {latestArticles.length > 0 && (
        <section aria-labelledby="latest-articles-heading" className="mt-12 border-t border-slate-200 pt-8">
          <h2 id="latest-articles-heading" className="text-2xl font-black text-slate-900">Latest articles</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latestArticles.map((latestArticle) => (
              <Link key={latestArticle.id} to={`/blogs/${latestArticle.slug}`} className="group flex min-h-28 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-800/30 hover:bg-emerald-50/50">
                <span className="font-semibold leading-6 text-slate-800 group-hover:text-[#005b3f]">{latestArticle.title}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#005b3f]" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

function SocialIcon({ platform }: { platform: string }) {
  const iconPaths: Record<string, string> = {
    pinterest: 'M12 2a10 10 0 0 0-3.65 19.31c-.02-.78 0-1.72.19-2.57l1.37-5.8s-.34-.68-.34-1.68c0-1.57.91-2.75 2.04-2.75.96 0 1.42.72 1.42 1.58 0 .96-.61 2.4-.92 3.73-.26 1.11.56 2.01 1.66 2.01 1.99 0 3.53-2.1 3.53-5.13 0-2.68-1.93-4.55-4.69-4.55-3.19 0-5.06 2.39-5.06 4.86 0 .96.37 1.98.83 2.54.09.11.1.21.08.33l-.31 1.25c-.05.2-.16.24-.37.14-1.4-.65-2.28-2.69-2.28-4.34 0-3.53 2.56-6.78 7.38-6.78 3.87 0 6.88 2.76 6.88 6.45 0 3.85-2.43 6.95-5.8 6.95-1.13 0-2.2-.59-2.57-1.28l-.7 2.67c-.25.97-.93 2.19-1.39 2.94A10 10 0 1 0 12 2Z',
    tiktok: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.33V2h-3.55v13.67a2.9 2.9 0 0 1-2.9 2.9A2.9 2.9 0 0 1 6.47 15.7a2.9 2.9 0 0 1 2.9-2.9c.3 0 .6.05.88.14V9.32a6.48 6.48 0 0 0-.88-.06 6.45 6.45 0 1 0 6.45 6.45V8.76a8.3 8.3 0 0 0 4.85 1.56V6.77c-.37 0-.74-.03-1.08-.08Z',
    instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z',
    facebook: 'M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.3v3h2.8v8h3.4Z',
    youtube: 'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z',
    twitter: 'M22 5.9a8 8 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.3 8.3 0 0 1-2.7 1 4.1 4.1 0 0 0-7 3.7 11.7 11.7 0 0 1-8.5-4.3 4.1 4.1 0 0 0 1.3 5.5 4 4 0 0 1-1.9-.5v.1a4.1 4.1 0 0 0 3.3 4 4 4 0 0 1-1.9.1 4.1 4.1 0 0 0 3.8 2.8A8.3 8.3 0 0 1 2 18.4 11.7 11.7 0 0 0 20 8.5v-.6A8.4 8.4 0 0 0 22 5.9Z',
  }

  return iconPaths[platform]
    ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d={iconPaths[platform]} /></svg>
    : <ExternalLink aria-hidden="true" className="h-4 w-4" />
}