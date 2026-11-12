import { ArrowRight, BriefcaseBusiness, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCategories } from '../lib/categoryStore'
import type { Job } from '../types'

interface JobCardProps {
  job: Job
}

const statusClasses: Record<string, string> = {
  Open: 'bg-emerald-100 text-emerald-700',
  'Closing Soon': 'bg-amber-100 text-amber-700',
  Published: 'bg-sky-100 text-sky-700',
  'Coming Soon': 'bg-violet-100 text-violet-700',
  Draft: 'bg-slate-200 text-slate-700',
  Closed: 'bg-red-100 text-red-700',
  Expired: 'bg-gray-200 text-gray-700',
}

export function JobCard({ job }: JobCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const categoryName = useCategories().find((category) => category.slug === job.category)?.name ?? job.categoryLabel

  return (
    <article className="job-card group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,91,63,0.14)]">
      <div className={`job-image relative ${imageLoaded ? 'is-loaded' : ''}`}>
        <div className="job-image-skeleton" aria-hidden="true" />
        <img
          src={job.thumbnailUrl}
          alt={job.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className="job-image-content h-48 w-full object-cover"
        />
        <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[job.status] ?? 'bg-slate-200 text-slate-700'}`}>
          {job.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
            {categoryName}
          </span>
          <span>{job.deadline}</span>
        </div>

        <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{job.department}</p>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            {job.city}, {job.province}
          </div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
            {job.qualification}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">{job.vacancies} vacancies</span>
          <Link to={`/jobs/${job.slug}`} className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">
            View details <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}
