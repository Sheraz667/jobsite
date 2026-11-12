import { Link, useParams } from 'react-router-dom'
import { JobCard } from '../components/JobCard'
import { useCategories } from '../lib/categoryStore'
import { useJobs } from '../lib/jobStore'
import { usePageMeta } from '../lib/usePageMeta'

interface CategoryPageProps {
  categoryKey?: string
}

export function CategoryPage({ categoryKey }: CategoryPageProps) {
  const params = useParams()
  const categorySlug = categoryKey ?? params.slug ?? ''
  const categories = useCategories()
  const jobs = useJobs()
  const category = categories.find((item) => item.slug === categorySlug)
  const publicJobs = jobs.filter((job) => !['Draft', 'Closed', 'Expired'].includes(job.status) && job.category === categorySlug)

  usePageMeta({
    title: `${category?.name ?? 'Jobs'} in Pakistan | PakJobInfo`,
    description: category?.description ?? 'Browse current job opportunities across Pakistan.',
  })

  if (!category) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-xl font-semibold text-slate-900">Category not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Category</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">{category.name}</h1>
        <p className="mt-3 max-w-2xl text-slate-600">{category.description}</p>
        <div className="mt-5 flex items-center gap-3">
          <Link to="/jobs" className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Browse all jobs
          </Link>
        </div>
      </div>

      {publicJobs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {publicJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xl font-semibold text-slate-800">No jobs are available in this category right now.</p>
        </div>
      )}
    </div>
  )
}
