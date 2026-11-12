import { useMemo, useState } from 'react'
import { JobCard } from '../components/JobCard'
import { useCategories } from '../lib/categoryStore'
import { useJobs } from '../lib/jobStore'
import { usePageMeta } from '../lib/usePageMeta'

export function JobsPage() {
  const jobs = useJobs()
  const categories = useCategories()
  usePageMeta({ title: 'Latest Jobs in Pakistan | PakJobInfo', description: 'Search government jobs, private sector careers, and internships across Pakistan.' })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedProvince, setSelectedProvince] = useState('All')

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => !['Draft', 'Closed', 'Expired'].includes(job.status)).filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.department.toLowerCase().includes(search.toLowerCase()) ||
        job.location.toLowerCase().includes(search.toLowerCase())

      const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory
      const matchesProvince = selectedProvince === 'All' || job.province === selectedProvince

      return matchesSearch && matchesCategory && matchesProvince
    })
  }, [jobs, search, selectedCategory, selectedProvince])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Job title, department, city" className="w-full bg-transparent text-slate-800 outline-none" />
          </label>

          <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Category</span>
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="w-full bg-transparent text-slate-800 outline-none">
              <option>All</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Province</span>
            <select value={selectedProvince} onChange={(event) => setSelectedProvince(event.target.value)} className="w-full bg-transparent text-slate-800 outline-none">
              <option>All</option>
              <option>Punjab</option>
              <option>Sindh</option>
              <option>Khyber Pakhtunkhwa</option>
              <option>Islamabad Capital Territory</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Search results</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Latest career opportunities</h1>
        </div>
        <p className="text-sm text-slate-600">{filteredJobs.length} jobs found</p>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xl font-semibold text-slate-800">No matching jobs found.</p>
          <p className="mt-2 text-slate-600">Adjust your filters or search term to find more opportunities.</p>
        </div>
      )}
    </div>
  )
}
