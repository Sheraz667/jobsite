import { BookOpenText, BriefcaseBusiness, CheckCircle2, FileText, Megaphone, PencilLine, Trash2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RichTextEditor } from '../components/RichTextEditor'
import { categories } from '../data/jobs'
import { reloadBlogs, saveBlogs, useBlogs } from '../lib/blogStore'
import { normalizeImageUrl } from '../lib/imageUrl'
import { reloadJobs, saveJobs, useJobs } from '../lib/jobStore'
import { sanitizeRichText } from '../lib/sanitizeRichText'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { reloadSponsors, saveSponsors, useSponsors } from '../lib/sponsorStore'
import type { Job, JobStatus } from '../types'
import type { BlogArticle, BlogSocialPlatform, BlogStatus } from '../types.blog'
import type { Sponsor, SponsorStatus } from '../types.sponsor'

const formDefaults = {
  title: '',
  department: '',
  category: 'government',
  description: '',
  thumbnailUrl: '',
  officialSourceUrl: '',
  officialApplyUrl: '',
  location: 'Lahore',
  province: 'Punjab',
  city: 'Lahore',
  qualification: 'Bachelor degree',
  vacancies: '5',
  deadline: '2026-12-30',
  status: 'Draft' as JobStatus,
}

const blogFormDefaults = {
  title: '',
  excerpt: '',
  content: '',
  thumbnailUrl: '',
  socialLinks: {
    pinterest: '',
    tiktok: '',
    instagram: '',
    facebook: '',
    youtube: '',
    twitter: '',
  },
}

const sponsorFormDefaults = {
  name: '',
  description: '',
  thumbnailUrl: '',
  destinationUrl: '',
}

export function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authPending, setAuthPending] = useState(true)
  const [activeSection, setActiveSection] = useState<'jobs' | 'blogs' | 'sponsors'>('jobs')
  const jobsList = useJobs()
  const blogsList = useBlogs()
  const sponsorsList = useSponsors()
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [formData, setFormData] = useState(formDefaults)
  const [previewMode, setPreviewMode] = useState(false)
  const [pendingAction, setPendingAction] = useState<'Draft' | 'Published'>('Draft')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [blogForm, setBlogForm] = useState(blogFormDefaults)
  const [blogStatus, setBlogStatus] = useState<BlogStatus>('Draft')
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null)
  const [blogError, setBlogError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [sponsorForm, setSponsorForm] = useState(sponsorFormDefaults)
  const [sponsorStatus, setSponsorStatus] = useState<SponsorStatus>('Draft')
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null)
  const [sponsorError, setSponsorError] = useState('')

  useEffect(() => {
    let active = true

    const verifyAdminSession = async () => {
      if (!isSupabaseConfigured) {
        setAuthPending(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (active) setAuthPending(false)
        return
      }

      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (active) {
        setIsAuthenticated(profile?.role === 'admin')
        setAuthPending(false)
        if (profile?.role !== 'admin') await supabase.auth.signOut()
      }
    }

    void verifyAdminSession()
    return () => { active = false }
  }, [])

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoginError('')
    if (!isSupabaseConfigured) {
      setLoginError('Admin login is not configured. Add your Supabase URL and anon key to the local .env file.')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword(loginForm)
    if (error || !data.user) {
      setLoginError('Email or password is incorrect.')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setLoginError('This account does not have admin access.')
      return
    }

    await Promise.all([reloadJobs(), reloadBlogs(), reloadSponsors()])
    setIsAuthenticated(true)
  }

  const handleFieldChange = (key: keyof typeof formDefaults, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }))
  }

  const setBlogField = (key: keyof typeof blogFormDefaults, value: string) => {
    setBlogForm((current) => ({ ...current, [key]: value }))
  }

  const setBlogSocialLink = (platform: BlogSocialPlatform, value: string) => {
    setBlogForm((current) => ({
      ...current,
      socialLinks: { ...current.socialLinks, [platform]: value },
    }))
  }

  const setSponsorField = (key: keyof typeof sponsorFormDefaults, value: string) => {
    setSponsorForm((current) => ({ ...current, [key]: value }))
  }

  const sponsorStats = [
    ['Total Sponsors', sponsorsList.length],
    ['Published', sponsorsList.filter((sponsor) => sponsor.status === 'Published').length],
    ['Drafts', sponsorsList.filter((sponsor) => sponsor.status === 'Draft').length],
  ]

  const handleSaveSponsor = (status: SponsorStatus) => {
    const validUrl = (value: string) => {
      try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
    }
    if (!sponsorForm.name.trim() || !sponsorForm.description.trim() || !sponsorForm.thumbnailUrl.trim() || !sponsorForm.destinationUrl.trim()) {
      setSponsorError('Add a sponsor name, thumbnail, short description, and destination link.')
      return
    }
    if (!validUrl(sponsorForm.destinationUrl)) {
      setSponsorError('Enter a valid sponsor link beginning with http:// or https://.')
      return
    }

    const now = new Date().toISOString().slice(0, 10)
    const previous = sponsorsList.find((sponsor) => sponsor.id === editingSponsorId)
    const sponsor: Sponsor = {
      id: editingSponsorId ?? `sponsor-${Date.now()}`,
      name: sponsorForm.name.trim(),
      description: sponsorForm.description.trim(),
      thumbnailUrl: normalizeImageUrl(sponsorForm.thumbnailUrl),
      destinationUrl: sponsorForm.destinationUrl.trim(),
      status,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    }
    saveSponsors((current) => editingSponsorId
      ? current.map((item) => item.id === editingSponsorId ? sponsor : item)
      : [sponsor, ...current])
    setSponsorForm(sponsorFormDefaults)
    setEditingSponsorId(null)
    setSponsorError('')
  }

  const jobStats = [
    ['Total Jobs', jobsList.length],
    ['Published', jobsList.filter((job) => job.status === 'Published').length],
    ['Active', jobsList.filter((job) => ['Open', 'Closing Soon', 'Coming Soon'].includes(job.status)).length],
    ['Closed', jobsList.filter((job) => job.status === 'Closed').length],
    ['Drafts', jobsList.filter((job) => job.status === 'Draft').length],
    ['Expired', jobsList.filter((job) => job.status === 'Expired').length],
  ]

  const blogStats = [
    ['Total Articles', blogsList.length],
    ['Published', blogsList.filter((blog) => blog.status === 'Published').length],
    ['Drafts', blogsList.filter((blog) => blog.status === 'Draft').length],
  ]

  const handleSave = (status: 'Draft' | 'Published') => {
    const validHttpUrl = (value: string) => {
      try {
        return ['http:', 'https:'].includes(new URL(value).protocol)
      } catch {
        return false
      }
    }

    if (!formData.description.trim()) {
      setFormError('Please add the full job description before saving.')
      return
    }
    if (!validHttpUrl(formData.officialSourceUrl) || !validHttpUrl(formData.officialApplyUrl)) {
      setFormError('Add valid official source and apply links beginning with https:// or http://.')
      return
    }

    setFormError('')
    const nextJob: Job = {
      id: editingId ?? `job-${Date.now()}`,
      title: formData.title || 'New Job Opening',
      slug: (formData.title || 'new-job-opening').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      department: formData.department || 'Department Name',
      category: formData.category as Job['category'],
      categoryLabel: categories.find((category) => category.slug === formData.category)?.name ?? 'Government Jobs',
      description: formData.description,
      qualification: formData.qualification,
      ageLimit: '18-40 years',
      experience: '1-3 years',
      salary: 'PKR 80,000 - 150,000',
      location: formData.location,
      province: formData.province,
      city: formData.city,
      vacancies: Number(formData.vacancies) || 1,
      startDate: new Date().toISOString().slice(0, 10),
      deadline: formData.deadline,
      status,
      thumbnailUrl: normalizeImageUrl(formData.thumbnailUrl) || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&q=60',
      advertisementUrl: '/pdfs/demo-job.pdf',
      officialApplyUrl: formData.officialApplyUrl,
      officialSourceUrl: formData.officialSourceUrl,
      seoTitle: `${formData.title || 'New Job'} | Pakistan Jobs Portal`,
      seoDescription: 'Professional job opening from Pakistan Jobs Portal.',
      seoKeywords: ['job', 'pakistan', formData.category],
      publishedAt: status === 'Published' ? new Date().toISOString().slice(0, 10) : undefined,
      createdAt: editingId ? jobsList.find((job) => job.id === editingId)?.createdAt ?? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    }

    if (editingId) {
      saveJobs((current) => current.map((job) => (job.id === editingId ? { ...job, ...nextJob } : job)))
    } else {
      saveJobs((current) => [nextJob, ...current])
    }

    setFormData(formDefaults)
    setEditingId(null)
    setPreviewMode(false)
  }

  const handleSaveBlog = (status: BlogStatus) => {
    const safeContent = sanitizeRichText(blogForm.content)
    const contentText = new DOMParser().parseFromString(safeContent, 'text/html').body.textContent?.trim()

    if (!blogForm.title.trim() || !blogForm.excerpt.trim() || !contentText) {
      setBlogError('Add an article title, short summary, and full article before saving.')
      return
    }

    const invalidSocialLink = Object.values(blogForm.socialLinks).some((value) => {
      if (!value.trim()) return false
      try {
        return !['http:', 'https:'].includes(new URL(value).protocol)
      } catch {
        return true
      }
    })
    if (invalidSocialLink) {
      setBlogError('Social links must be full http:// or https:// URLs.')
      return
    }

    const now = new Date().toISOString().slice(0, 10)
    const previousBlog = blogsList.find((blog) => blog.id === editingBlogId)
    const article: BlogArticle = {
      id: editingBlogId ?? `blog-${Date.now()}`,
      title: blogForm.title.trim(),
      slug: blogForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      excerpt: blogForm.excerpt.trim(),
      content: safeContent,
      thumbnailUrl: normalizeImageUrl(blogForm.thumbnailUrl) || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=960&q=65',
      socialLinks: Object.fromEntries(Object.entries(blogForm.socialLinks).filter(([, value]) => value.trim())) as BlogArticle['socialLinks'],
      status,
      createdAt: previousBlog?.createdAt ?? now,
      updatedAt: now,
    }

    saveBlogs((current) => editingBlogId
      ? current.map((blog) => blog.id === editingBlogId ? article : blog)
      : [article, ...current])
    setBlogForm(blogFormDefaults)
    setEditingBlogId(null)
    setBlogError('')
  }

  const handleClose = (jobId: string) => {
    saveJobs((current) =>
      current.map((job) => (job.id === jobId ? { ...job, status: 'Closed', updatedAt: '2026-11-11' } : job)),
    )
  }

  const handleDelete = (jobId: string) => {
    saveJobs((current) => current.filter((job) => job.id !== jobId))
  }

  if (authPending) {
    return <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 text-sm text-slate-600">Checking admin access…</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-12">
        <form onSubmit={handleLogin} className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Secure access</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Admin login</h1>
            {!isSupabaseConfigured && <p className="mt-3 text-sm leading-6 text-amber-800">Admin access is locked until Supabase is configured. Add the project URL/key, create an Auth user, and grant it the admin role.</p>}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="admin@jobsportal.pk" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="••••••••" />
            </label>
          </div>

          <button type="submit" disabled={!isSupabaseConfigured} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
            Access dashboard
          </button>

          {loginError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loginError}</p>}
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Job management</h1>
        </div>
        <button onClick={() => {
          void supabase.auth.signOut()
          setIsAuthenticated(false)
        }} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Log out
        </button>
      </div>

      <div className={`mb-8 grid gap-4 ${activeSection === 'jobs' ? 'md:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-3'}`}>
        {(activeSection === 'jobs' ? jobStats : activeSection === 'blogs' ? blogStats : sponsorStats).map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Admin sections" className="flex gap-2 lg:flex-col lg:gap-3">
          <button
            type="button"
            onClick={() => setActiveSection('jobs')}
            aria-current={activeSection === 'jobs' ? 'page' : undefined}
            className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition lg:flex-none ${activeSection === 'jobs' ? 'border-[#f7d154] bg-[#013d2d] text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-700/30 hover:bg-emerald-50'}`}
          >
            <BriefcaseBusiness className="h-5 w-5" />
            Jobs
            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${activeSection === 'jobs' ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>{jobsList.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('blogs')}
            aria-current={activeSection === 'blogs' ? 'page' : undefined}
            className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition lg:flex-none ${activeSection === 'blogs' ? 'border-[#f7d154] bg-[#013d2d] text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-700/30 hover:bg-emerald-50'}`}
          >
            <BookOpenText className="h-5 w-5" />
            Blogs
            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${activeSection === 'blogs' ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>{blogsList.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('sponsors')}
            aria-current={activeSection === 'sponsors' ? 'page' : undefined}
            className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition lg:flex-none ${activeSection === 'sponsors' ? 'border-[#f7d154] bg-[#013d2d] text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-700/30 hover:bg-emerald-50'}`}
          >
            <Megaphone className="h-5 w-5" />
            Sponsors
            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${activeSection === 'sponsors' ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>{sponsorsList.length}</span>
          </button>
        </nav>

        <div className="min-w-0">
        {activeSection === 'jobs' && <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Create & edit</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Job form</h2>
            </div>
            <button onClick={() => setPreviewMode((current) => !current)} className="rounded-full bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800">
              {previewMode ? 'Hide preview' : 'Preview'}
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Job title
              <input value={formData.title} onChange={(event) => handleFieldChange('title', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Department / Company Name
              <input value={formData.department} onChange={(event) => handleFieldChange('department', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Full job description
              <textarea rows={6} value={formData.description} onChange={(event) => { handleFieldChange('description', event.target.value); setFormError('') }} placeholder="Add responsibilities, eligibility details, and application instructions..." className="mt-1 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Thumbnail image URL (Google Drive share link supported)
              <input value={formData.thumbnailUrl} onChange={(event) => handleFieldChange('thumbnailUrl', event.target.value)} placeholder="Paste a public Google Drive image link or direct image URL" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
            </label>
            {formData.thumbnailUrl && <img src={normalizeImageUrl(formData.thumbnailUrl)} alt="Job thumbnail preview" className="h-40 w-full rounded-xl object-cover" />}
            <div className="grid gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Official source / advertisement link
                <input type="url" value={formData.officialSourceUrl} onChange={(event) => { handleFieldChange('officialSourceUrl', event.target.value); setFormError('') }} placeholder="https://official-site.gov.pk/announcement" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Apply now link
                <input type="url" value={formData.officialApplyUrl} onChange={(event) => { handleFieldChange('officialApplyUrl', event.target.value); setFormError('') }} placeholder="https://official-site.gov.pk/apply" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Main category
                <select value={formData.category} onChange={(event) => handleFieldChange('category', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500">
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Qualification
                <input value={formData.qualification} onChange={(event) => handleFieldChange('qualification', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Province
                <input value={formData.province} onChange={(event) => handleFieldChange('province', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                City
                <input value={formData.city} onChange={(event) => handleFieldChange('city', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Vacancies
                <input value={formData.vacancies} onChange={(event) => handleFieldChange('vacancies', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Deadline
                <input type="date" value={formData.deadline} onChange={(event) => handleFieldChange('deadline', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
                <button type="button" onClick={() => { setPendingAction('Draft'); setPreviewMode(true) }} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <FileText className="h-4 w-4" /> Save as Draft
              </button>
                <button type="button" onClick={() => { setPendingAction('Published'); setPreviewMode(true) }} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
                <CheckCircle2 className="h-4 w-4" /> Publish Now
              </button>
            </div>
          </div>

          {formError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}

          {previewMode && (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">Publish confirmation</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">Are you sure you want to publish this job?</p>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p><span className="font-semibold">Job title:</span> {formData.title || 'New Job Opening'}</p>
                <p><span className="font-semibold">Main category:</span> {categories.find((category) => category.slug === formData.category)?.name}</p>
                <p><span className="font-semibold">Department:</span> {formData.department || 'Department Name'}</p>
                <p><span className="font-semibold">Description:</span> {formData.description || 'Add the full job description before publishing.'}</p>
                <p><span className="font-semibold">Official source:</span> {formData.officialSourceUrl || 'Add an official source URL.'}</p>
                <p><span className="font-semibold">Apply link:</span> {formData.officialApplyUrl || 'Add an application URL.'}</p>
                <p><span className="font-semibold">Deadline:</span> {formData.deadline}</p>
                <p><span className="font-semibold">Selected status:</span> {pendingAction}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => handleSave(pendingAction)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  Confirm {pendingAction}
                </button>
                <button onClick={() => setPreviewMode(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Overview</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Recent job posts</h2>
            </div>
          </div>

          <div className="space-y-4">
            {jobsList.slice(0, 6).map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{job.title}</p>
                    <p className="text-sm text-slate-600">{job.department} • {job.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setEditingId(job.id); setFormData({ title: job.title, department: job.department, category: job.category, description: job.description, thumbnailUrl: job.thumbnailUrl, officialSourceUrl: job.officialSourceUrl, officialApplyUrl: job.officialApplyUrl, location: job.location, province: job.province, city: job.city, qualification: job.qualification, vacancies: String(job.vacancies), deadline: job.deadline, status: job.status }); setPreviewMode(false) }} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                      <PencilLine className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => handleClose(job.id)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                      <XCircle className="h-3.5 w-3.5" /> Close
                    </button>
                    <button onClick={() => handleDelete(job.id)} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                  <span>{job.categoryLabel}</span>
                  <span>{job.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>}

      {activeSection === 'blogs' && <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Blog publishing</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{editingBlogId ? 'Edit article' : 'Write an article'}</h2>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Article title
              <input value={blogForm.title} onChange={(event) => setBlogField('title', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Short summary
              <textarea rows={2} value={blogForm.excerpt} onChange={(event) => setBlogField('excerpt', event.target.value)} className="mt-1 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Full article
              <div className="mt-1">
                <RichTextEditor value={blogForm.content} onChange={(value) => setBlogField('content', value)} />
              </div>
            </label>
            <label className="block text-sm font-medium text-slate-700">Thumbnail image URL (Google Drive share link supported)
              <input value={blogForm.thumbnailUrl} onChange={(event) => setBlogField('thumbnailUrl', event.target.value)} placeholder="Paste a public Google Drive image link or direct image URL" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" />
            </label>
            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-700">Article social links (optional)</legend>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
                {([
                ['pinterest', 'Pinterest'],
                ['tiktok', 'TikTok'],
                ['instagram', 'Instagram'],
                ['facebook', 'Facebook'],
                ['youtube', 'YouTube'],
                ['twitter', 'X / Twitter'],
                ] as const).map(([platform, label]) => (
                <label key={platform} className="block min-w-0 text-xs font-medium text-slate-600">{label}
                  <input type="url" value={blogForm.socialLinks[platform]} onChange={(event) => setBlogSocialLink(platform, event.target.value)} placeholder={`https://${platform === 'twitter' ? 'x.com' : platform === 'youtube' ? 'youtube.com' : `${platform}.com`}/...`} className="mt-1 h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500" />
                </label>
              ))}
              </div>
            </fieldset>
            {blogForm.thumbnailUrl && <img src={normalizeImageUrl(blogForm.thumbnailUrl)} alt="Article thumbnail preview" className="h-40 w-full rounded-xl object-cover" />}
            {blogError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{blogError}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { setBlogStatus('Draft'); handleSaveBlog('Draft') }} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${blogStatus === 'Draft' ? 'border-[#005b3f] bg-emerald-50 text-[#013d2d]' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Save draft</button>
              <button type="button" onClick={() => { setBlogStatus('Published'); handleSaveBlog('Published') }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${blogStatus === 'Published' ? 'bg-[#005b3f] ring-2 ring-[#f7d154]' : 'bg-[#013d2d] hover:bg-[#005b3f]'}`}>Publish article</button>
              {editingBlogId && <button type="button" onClick={() => { setBlogForm(blogFormDefaults); setEditingBlogId(null); setBlogError('') }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel edit</button>}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Blog management</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Your articles</h2>
          <div className="mt-5 space-y-3">
            {blogsList.length ? blogsList.map((blog) => (
              <article key={blog.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <img src={blog.thumbnailUrl} alt="" className="h-20 w-full rounded-xl object-cover sm:w-28" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900">{blog.title}</h3>
                  <p className="text-sm text-slate-600">{blog.status} · {blog.updatedAt}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditingBlogId(blog.id); setBlogForm({ title: blog.title, excerpt: blog.excerpt, content: blog.content, thumbnailUrl: blog.thumbnailUrl, socialLinks: { ...blogFormDefaults.socialLinks, ...blog.socialLinks } }); setBlogStatus(blog.status); setBlogError('') }} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
                  <button type="button" onClick={() => saveBlogs((current) => current.filter((item) => item.id !== blog.id))} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700">Delete</button>
                </div>
              </article>
            )) : <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No articles yet. Create your first post here.</p>}
          </div>
        </div>
      </section>}

      {activeSection === 'sponsors' && <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Sponsored placements</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">{editingSponsorId ? 'Edit sponsor' : 'Add a sponsor'}</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Sponsor name
              <input value={sponsorForm.name} onChange={(event) => setSponsorField('name', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Short description
              <textarea rows={3} value={sponsorForm.description} onChange={(event) => setSponsorField('description', event.target.value)} className="mt-1 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Thumbnail image URL (Google Drive share link supported)
              <input value={sponsorForm.thumbnailUrl} onChange={(event) => setSponsorField('thumbnailUrl', event.target.value)} placeholder="Paste a public image URL" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
            </label>
            {sponsorForm.thumbnailUrl && <img src={normalizeImageUrl(sponsorForm.thumbnailUrl)} alt="Sponsor preview" className="h-40 w-full rounded-xl bg-slate-50 object-contain" />}
            <label className="block text-sm font-medium text-slate-700">Sponsor destination link
              <input type="url" value={sponsorForm.destinationUrl} onChange={(event) => setSponsorField('destinationUrl', event.target.value)} placeholder="https://sponsor.example" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
            </label>
            {sponsorError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sponsorError}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { setSponsorStatus('Draft'); handleSaveSponsor('Draft') }} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${sponsorStatus === 'Draft' ? 'border-[#005b3f] bg-emerald-50 text-[#013d2d]' : 'border-slate-300 text-slate-700'}`}>Save draft</button>
              <button type="button" onClick={() => { setSponsorStatus('Published'); handleSaveSponsor('Published') }} className="rounded-xl bg-[#013d2d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005b3f]">Publish sponsor</button>
              {editingSponsorId && <button type="button" onClick={() => { setSponsorForm(sponsorFormDefaults); setEditingSponsorId(null); setSponsorError('') }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel edit</button>}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Placement management</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Sponsors</h2>
          <div className="mt-5 space-y-3">
            {sponsorsList.length ? sponsorsList.map((sponsor) => (
              <article key={sponsor.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <img src={sponsor.thumbnailUrl} alt="" className="h-20 w-full rounded-xl bg-white object-cover sm:w-28" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900">{sponsor.name}</h3>
                  <p className="text-sm text-slate-600">{sponsor.status} · {sponsor.updatedAt}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditingSponsorId(sponsor.id); setSponsorForm({ name: sponsor.name, description: sponsor.description, thumbnailUrl: sponsor.thumbnailUrl, destinationUrl: sponsor.destinationUrl }); setSponsorStatus(sponsor.status); setSponsorError('') }} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
                  <button type="button" onClick={() => saveSponsors((current) => current.filter((item) => item.id !== sponsor.id))} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700">Delete</button>
                </div>
              </article>
            )) : <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No sponsors yet. Your public page will show the advertising invitation here.</p>}
          </div>
        </div>
      </section>}
        </div>
      </div>
    </div>
  )
}
