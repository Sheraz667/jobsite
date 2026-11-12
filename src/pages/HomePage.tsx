import { Building2, CalendarClock, MapPin, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { JobCard } from '../components/JobCard'
import { categories } from '../data/jobs'
import { useJobs } from '../lib/jobStore'
import heroImage from '../assets/logo/hero.png'
import { usePageMeta } from '../lib/usePageMeta'
import moonImage from '../assets/logo/moon.png'

export function HomePage() {
  usePageMeta({ title: 'PakJobInfo | Jobs & Career Updates in Pakistan', description: 'Find verified government jobs, private sector careers, internships, admissions, and career opportunities across Pakistan.' })
  const jobs = useJobs()
  const publicJobs = jobs.filter((job) => !['Draft', 'Closed', 'Expired'].includes(job.status))
  const governmentJobs = publicJobs.filter((job) => job.category === 'government').slice(0, 3)
  const privateJobs = publicJobs.filter((job) => job.category === 'private').slice(0, 3)
  const internships = publicJobs.filter((job) => job.category === 'internship').slice(0, 3)
  const deadlines = [...publicJobs].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 4)
  return (
    <div>
      <section className="flag-hero">
        <img src={moonImage} alt="" aria-hidden="true" className="flag-hero-moon" />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
          <div className="relative z-10 order-2 flex flex-col justify-center lg:order-1">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-950/10">
              <Sparkles className="h-3.5 w-3.5 text-[#f7d154]" />
              Trusted updates for Pakistan careers
            </span>
            <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-5xl lg:text-[5rem]">
              Find the right job opportunity in Pakistan.
            </h1>
            <p className="mt-6 max-w-xl text-xl text-emerald-50/90 leading-8">
              Discover authentic government jobs, private-sector openings, internships, admissions, and career opportunities all in one professional portal.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-emerald-50/90">
              <div className="rounded-full border border-white/15 bg-white/5 px-3 py-2">4,800+ live vacancies</div>
              <div className="rounded-full border border-white/15 bg-white/5 px-3 py-2">Verified employers</div>
              <div className="rounded-full border border-white/15 bg-white/5 px-3 py-2">Fresh updates daily</div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/20 bg-white p-3 shadow-[0_25px_70px_rgba(0,0,0,0.20)]">
              <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
                <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Job title</span>
                  <input type="text" placeholder="e.g. Junior Clerk" className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400" />
                </label>
                <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Province</span>
                  <select className="w-full bg-transparent text-slate-800 outline-none">
                    <option>All</option>
                    <option>Punjab</option>
                    <option>Sindh</option>
                    <option>Islamabad</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Category</span>
                  <select className="w-full bg-transparent text-slate-800 outline-none">
                    <option>All</option>
                    {categories.map((category) => (
                      <option key={category.slug}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <Link to="/jobs" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f7d154] px-5 py-4 text-sm font-bold text-[#013d2d] shadow-md shadow-[#f7d154]/40 transition hover:bg-[#f5cc3d]">
                  <Search className="h-4 w-4" />
                  Search
                </Link>
              </div>
            </div>
          </div>
          <div className="relative z-10 order-1 flex min-h-[220px] items-center justify-center lg:order-2 sm:min-h-[300px]">
            <div className="flex h-64 w-full max-w-[26rem] items-center justify-center rounded-3xl bg-white p-5 shadow-[0_24px_50px_rgba(0,20,10,0.3)] sm:h-80 sm:p-7 lg:h-96">
              <img src={heroImage} alt="Pakistan jobs illustration" className="h-full w-full scale-125 object-contain" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-12">
        <div className="moon-section" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#005b3f]">Latest published jobs</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Fresh opportunities</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/jobs" className="text-sm font-semibold text-[#005b3f]">Explore all jobs</Link>
            </div>
          </div>
          <div aria-label="Latest jobs carousel" tabIndex={0} className="relative z-10 flex snap-x snap-mandatory touch-pan-x gap-5 overflow-x-auto overscroll-x-contain scroll-smooth pb-4">
            {publicJobs
              .slice()
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((job) => (
                <div key={job.id} className="w-[82vw] max-w-[340px] shrink-0 snap-start sm:w-[320px] xl:w-[340px]">
                  <JobCard job={job} />
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden py-12">
        <div className="moon-section jobs-information-backdrop" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex items-center gap-2 text-[#005b3f]">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Government jobs</span>
            </div>
            <div className="space-y-4">
              {governmentJobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.slug}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-600">{job.department}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{job.status}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                    <span>{job.city}</span>
                    <span>Deadline: {job.deadline}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-center gap-2 text-[#005b3f]">
              <CalendarClock className="h-5 w-5 text-[#f7d154]" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Upcoming deadlines</span>
            </div>
            <div className="space-y-4">
              {deadlines.map((job) => (
                <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-600">{job.department}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{job.status}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.city}</span>
                    <span>Apply by {job.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#005b3f]">Private sector</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Corporate opportunities</h2>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {privateJobs.concat(internships).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
