import { ArrowRight, CalendarDays, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ContentLinksList } from '../components/ContentLinksList'
import { useCategories } from '../lib/categoryStore'
import { isJobDeadlinePassed, isJobUnavailable } from '../lib/jobDeadline'
import { useJobs } from '../lib/jobStore'
import { usePageMeta } from '../lib/usePageMeta'

export function JobDetailPage() {
  const { slug } = useParams()
  const jobs = useJobs()
  const categories = useCategories()
  const job = jobs.find((item) => item.slug === slug)
  const categoryName = job ? categories.find((category) => category.slug === job.category)?.name ?? job.categoryLabel : ''
  const applicationClosed = job ? isJobUnavailable(job) : false
  const deadlinePassed = job ? isJobDeadlinePassed(job) : false

  usePageMeta({
    title: job?.seoTitle || (job ? `${job.title} | PakJobInfo` : 'Job opportunity | PakJobInfo'),
    description: job?.seoDescription || (job ? `${job.title} at ${job.department} in ${job.city}, ${job.province}. Apply by ${job.deadline}.` : 'Browse job opportunities across Pakistan.'),
    image: job?.thumbnailUrl,
  })

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-xl font-semibold text-slate-900">Job not found</p>
        <Link to="/jobs" className="mt-4 inline-flex rounded-full bg-blue-700 px-5 py-2 text-sm font-semibold text-white">
          Back to jobs
        </Link>
      </div>
    )
  }

  const relatedJobs = jobs.filter((item) => item.category === job.category && item.id !== job.id).slice(0, 3)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              <Sparkles className="h-4 w-4" />
              {categoryName}
            </div>
            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">{job.title}</h1>
            <p className="mt-3 text-lg text-slate-600">{job.department}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${applicationClosed ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>{deadlinePassed ? 'Closed' : job.status}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">{job.vacancies} vacancies</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {applicationClosed && <div role="status" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{deadlinePassed ? 'This job is closed. The application deadline has passed.' : 'Applications for this job are closed.'}</div>}
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Application deadline</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{job.deadline}</p>
            {applicationClosed ? (
              <button type="button" disabled className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-300 px-4 py-3 text-sm font-semibold text-slate-600">Applications closed</button>
            ) : (
              <a href={job.officialApplyUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">
                Apply online <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="space-y-8">
          <img src={job.thumbnailUrl} alt={job.title} className="h-72 w-full rounded-3xl object-cover shadow-lg" />

          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-900">Job description</h2>
            <p className="leading-7 text-slate-700">{job.description}</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-900">How to apply</h2>
            <ul className="list-disc space-y-2 pl-5 text-slate-700">
              <li>Review the official advertisement and ensure you meet all eligibility criteria.</li>
              <li>Prepare the required documents, including educational certificates and CNIC copies.</li>
              <li>Submit your application via the official portal or official source announcement before the deadline.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-black text-slate-900">Official sources</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Source:</span> <a href={job.officialSourceUrl} className="text-blue-700 hover:underline" target="_blank" rel="noreferrer">{job.officialSourceUrl}</a></p>
              <p><span className="font-semibold">Application URL:</span> <a href={job.officialApplyUrl} className="text-blue-700 hover:underline" target="_blank" rel="noreferrer">{job.officialApplyUrl}</a></p>
              <p><span className="font-semibold">Advertisement PDF:</span> <a href={job.advertisementUrl} className="text-blue-700 hover:underline">{job.advertisementUrl}</a></p>
            </div>
            <ContentLinksList links={job.additionalLinks} />
          </section>
        </article>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xl font-black text-slate-900">Job details</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                <span>Qualification</span>
                <span className="font-medium text-slate-900">{job.qualification}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                <span>Location</span>
                <span className="font-medium text-slate-900">{job.location}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                <span>Province</span>
                <span className="font-medium text-slate-900">{job.province}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                <span>Age limit</span>
                <span className="font-medium text-slate-900">{job.ageLimit}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                <span>Experience</span>
                <span className="font-medium text-slate-900">{job.experience}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pb-2">
                <span>Salary</span>
                <span className="font-medium text-slate-900">{job.salary ?? 'Not disclosed'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-slate-700">
              <CalendarDays className="h-4 w-4 text-blue-700" />
              Published {job.publishedAt || job.createdAt}
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-emerald-700" />
              {job.city}, {job.province}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-amber-700">
              <ShieldCheck className="h-4 w-4" />
              Independent job information source
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-900">Related jobs</h2>
          <Link to="/jobs" className="text-sm font-semibold text-blue-700">See all</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {relatedJobs.map((related) => (
            <Link key={related.id} to={`/jobs/${related.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">{categories.find((category) => category.slug === related.category)?.name ?? related.categoryLabel}</p>
              <h3 className="mt-3 text-xl font-bold text-slate-900">{related.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{related.department}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{related.city}</span>
                <span>{related.deadline}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
