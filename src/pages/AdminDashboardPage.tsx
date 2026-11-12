import { Activity, ArrowLeft, ArrowRight, BookOpenText, BriefcaseBusiness, CheckCircle2, ClipboardCheck, Clock3, FileText, Files, GraduationCap, KeyRound, LockKeyhole, MailCheck, Megaphone, PencilLine, Tags, Trash2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RichTextEditor } from '../components/RichTextEditor'
import { ContentLinksEditor } from '../components/ContentLinksEditor'
import { deleteCategory, reloadCategories, saveCategory, useCategories } from '../lib/categoryStore'
import { reloadBlogs, saveBlogs, useBlogs } from '../lib/blogStore'
import { normalizeImageUrl } from '../lib/imageUrl'
import { reloadJobs, saveJobs, useJobs } from '../lib/jobStore'
import { sanitizeRichText } from '../lib/sanitizeRichText'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { reloadSponsors, saveSponsors, useSponsors } from '../lib/sponsorStore'
import { reloadUpdates, saveUpdates, useUpdates } from '../lib/updateStore'
import { defaultPages, reloadPages, savePage, usePages } from '../lib/pageStore'
import { isJobDeadlinePassed, isJobUnavailable, pakistanToday } from '../lib/jobDeadline'
import type { CategoryDefinition, ContentLink, Job, JobStatus } from '../types'
import type { BlogArticle, BlogSocialPlatform, BlogStatus } from '../types.blog'
import type { Sponsor, SponsorSocialPlatform, SponsorStatus } from '../types.sponsor'
import type { AcademicUpdate, UpdateKind, UpdateStatus } from '../types.update'
import type { ManagedPage } from '../types.page'

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
  socialLinks: { instagram: '', facebook: '', pinterest: '', tiktok: '' },
}

const updateFormDefaults = { title: '', department: '', details: '', thumbnailUrl: '', sourceUrl: '', actionUrl: '' }

type SponsorExpiryOption = '' | '3' | '7' | '10'

export function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authPending, setAuthPending] = useState(true)
  const [activeSection, setActiveSection] = useState<'jobs' | 'categories' | 'admissions' | 'results' | 'blogs' | 'pages' | 'sponsors'>('jobs')
  const jobsList = useJobs()
  const categoriesList = useCategories()
  const blogsList = useBlogs()
  const sponsorsList = useSponsors()
  const updatesList = useUpdates()
  const pagesList = usePages()
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState('')
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [recoveryError, setRecoveryError] = useState('')
  const [recoveryPending, setRecoveryPending] = useState(false)
  const [formData, setFormData] = useState(formDefaults)
  const [previewMode, setPreviewMode] = useState(false)
  const [pendingAction, setPendingAction] = useState<'Draft' | 'Published'>('Draft')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [blogForm, setBlogForm] = useState(blogFormDefaults)
  const [blogStatus, setBlogStatus] = useState<BlogStatus>('Draft')
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null)
  const [blogError, setBlogError] = useState('')
  const [blogAdditionalLinks, setBlogAdditionalLinks] = useState<ContentLink[]>([])
  const [loginError, setLoginError] = useState('')
  const [sponsorForm, setSponsorForm] = useState(sponsorFormDefaults)
  const [sponsorStatus, setSponsorStatus] = useState<SponsorStatus>('Draft')
  const [sponsorExpiryDays, setSponsorExpiryDays] = useState<SponsorExpiryOption>('')
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null)
  const [sponsorError, setSponsorError] = useState('')
  const [sponsorAdditionalLinks, setSponsorAdditionalLinks] = useState<ContentLink[]>([])
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState('')
  const [updateForm, setUpdateForm] = useState(updateFormDefaults)
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState('')
  const [jobAdditionalLinks, setJobAdditionalLinks] = useState<ContentLink[]>([])
  const [updateAdditionalLinks, setUpdateAdditionalLinks] = useState<ContentLink[]>([])
  const [selectedPageSlug, setSelectedPageSlug] = useState(defaultPages[0].slug)
  const [pageForm, setPageForm] = useState<ManagedPage>(defaultPages[0])
  const [pageError, setPageError] = useState('')
  const [pageSaved, setPageSaved] = useState(false)

  useEffect(() => {
    let active = true
    let recoverySessionActive = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && active) {
        recoverySessionActive = true
        setIsPasswordRecovery(true)
        setAuthPending(false)
        setRecoveryError('')
        setRecoveryMessage('Choose a new password for your admin account.')
      }
    })

    const verifyAdminSession = async () => {
      if (!isSupabaseConfigured) {
        setAuthPending(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (recoverySessionActive) {
        if (active) {
          setIsPasswordRecovery(true)
          setAuthPending(false)
        }
        return
      }
      if (!session) {
        if (active) setAuthPending(false)
        return
      }

      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (recoverySessionActive) {
        if (active) {
          setIsPasswordRecovery(true)
          setAuthPending(false)
        }
        return
      }

      if (active) {
        setIsAuthenticated(profile?.role === 'admin')
        setAuthPending(false)
        if (profile?.role !== 'admin') await supabase.auth.signOut()
      }
    }

    void verifyAdminSession()
    return () => {
      active = false
      subscription.unsubscribe()
    }
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
      setFailedLoginAttempts((attempts) => attempts + 1)
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

    setFailedLoginAttempts(0)
    await Promise.all([reloadJobs(), reloadBlogs(), reloadSponsors(), reloadCategories(), reloadUpdates(), reloadPages()])
    setIsAuthenticated(true)
  }

  const handlePasswordResetRequest = async (event: React.FormEvent) => {
    event.preventDefault()
    setRecoveryError('')
    setRecoveryMessage('')
    if (!isSupabaseConfigured) {
      setRecoveryError('Password recovery is not configured.')
      return
    }
    if (!loginForm.email.trim()) {
      setRecoveryError('Enter your admin email address first.')
      return
    }
    setRecoveryPending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(loginForm.email.trim(), {
      redirectTo: `${window.location.origin}/admin`,
    })
    setRecoveryPending(false)
    if (error) {
      setRecoveryError('Could not send the reset email. Check the email address and Supabase email settings.')
      return
    }
    setRecoveryMessage('If this email belongs to an admin account, a password reset link has been sent.')
  }

  const handlePasswordRecovery = async (event: React.FormEvent) => {
    event.preventDefault()
    setRecoveryError('')
    if (recoveryPassword.length < 8) {
      setRecoveryError('Use at least 8 characters for the new password.')
      return
    }
    if (recoveryPassword !== recoveryPasswordConfirm) {
      setRecoveryError('The passwords do not match.')
      return
    }
    setRecoveryPending(true)
    const { error } = await supabase.auth.updateUser({ password: recoveryPassword })
    if (error) {
      setRecoveryPending(false)
      setRecoveryError('Could not update the password. Request a fresh reset link and try again.')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setRecoveryPending(false)
      setRecoveryError('Your reset session expired. Request a new reset link.')
      return
    }
    const { data: profile } = await supabase.from('admin_profiles').select('role').eq('user_id', user.id).maybeSingle()
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setIsPasswordRecovery(false)
      setRecoveryPending(false)
      setRecoveryError('This account does not have admin access.')
      return
    }
    setIsPasswordRecovery(false)
    setRecoveryPending(false)
    setRecoveryMessage('Password updated. Your admin workspace is ready.')
    await Promise.all([reloadJobs(), reloadBlogs(), reloadSponsors(), reloadCategories(), reloadUpdates(), reloadPages()])
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

  const setSponsorSocialLink = (platform: SponsorSocialPlatform, value: string) => {
    setSponsorForm((current) => ({ ...current, socialLinks: { ...current.socialLinks, [platform]: value } }))
  }

  const handleSaveCategory = async () => {
    const name = categoryForm.name.trim()
    const existing = categoriesList.find((category) => category.id === editingCategoryId)
    const slug = existing?.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!name || !slug) {
      setCategoryError('Enter a category name using English letters or numbers.')
      return
    }
    if (!existing && categoriesList.some((category) => category.slug === slug)) {
      setCategoryError('A job type with this name already exists.')
      return
    }

    const category: CategoryDefinition = {
      id: existing?.id ?? crypto.randomUUID(),
      slug,
      name,
      description: categoryForm.description.trim(),
      accent: existing?.accent ?? 'bg-slate-100 text-slate-700',
    }
    const error = await saveCategory(category)
    if (error) {
      setCategoryError(`Could not save this job type: ${error}`)
      return
    }
    setCategoryForm({ name: '', description: '' })
    setEditingCategoryId(null)
    setCategoryError('')
  }

  const handleSelectPage = (slug: string) => {
    const page = pagesList.find((item) => item.slug === slug) ?? defaultPages.find((item) => item.slug === slug)
    if (!page) return
    setSelectedPageSlug(slug)
    setPageForm({ ...page, list: [...page.list] })
    setPageError('')
    setPageSaved(false)
  }

  const handleSavePage = async () => {
    const actionHref = pageForm.actionHref?.trim()
    if (actionHref) {
      try {
        if (!['http:', 'https:'].includes(new URL(actionHref).protocol)) throw new Error()
      } catch {
        setPageError('Button link must be a complete http:// or https:// URL.')
        return
      }
    }
    const page: ManagedPage = {
      ...pageForm,
      slug: selectedPageSlug,
      title: pageForm.title.trim(),
      intro: pageForm.intro.trim(),
      list: pageForm.list.map((item) => item.trim()).filter(Boolean),
      actionHref: actionHref || undefined,
      actionLabel: pageForm.actionLabel?.trim() || undefined,
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    if (!page.title || !page.intro) {
      setPageError('Page title and introduction are required.')
      return
    }
    if (Boolean(page.actionHref) !== Boolean(page.actionLabel)) {
      setPageError('Add both button text and button link, or leave both empty.')
      return
    }
    const error = await savePage(page)
    if (error) {
      setPageError(`Could not save page: ${error}`)
      return
    }
    setPageForm(page)
    setPageError('')
    setPageSaved(true)
  }

  const handleDeleteCategory = async (category: CategoryDefinition) => {
    if (categoriesList.length <= 1) {
      setCategoryError('Keep at least one job type available.')
      return
    }
    if (jobsList.some((job) => job.category === category.slug)) {
      setCategoryError(`“${category.name}” is assigned to jobs. Reassign or delete those jobs before removing this type.`)
      return
    }
    const error = await deleteCategory(category)
    if (error) {
      setCategoryError(error)
      return
    }
    setCategoryError('')
  }

  const handleSaveUpdate = async (kind: UpdateKind, status: UpdateStatus) => {
    const validUrl = (value: string) => {
      try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
    }
    if (!updateForm.title.trim() || !updateForm.department.trim() || !updateForm.details.trim()) {
      setUpdateError('Add a title, department or institute, and update details.')
      return
    }
    if (!validUrl(updateForm.sourceUrl.trim()) || !validUrl(updateForm.actionUrl.trim())) {
      setUpdateError('Add valid source and action links beginning with https:// or http://.')
      return
    }
    const additionalLinks = updateAdditionalLinks.filter((link) => link.label.trim() || link.url.trim())
    if (additionalLinks.some((link) => !link.label.trim() || (link.type === 'external' ? !validUrl(link.url.trim()) : !link.url.startsWith('/') || link.url.startsWith('//')))) {
      setUpdateError('Each extra link needs a label and a valid site path (internal) or http:// / https:// URL (external).')
      return
    }
    const previous = updatesList.find((item) => item.id === editingUpdateId)
    const today = new Date().toISOString().slice(0, 10)
    const update: AcademicUpdate = {
      id: editingUpdateId ?? `update-${Date.now()}`,
      kind,
      title: updateForm.title.trim(),
      department: updateForm.department.trim(),
      details: updateForm.details.trim(),
      thumbnailUrl: normalizeImageUrl(updateForm.thumbnailUrl),
      sourceUrl: updateForm.sourceUrl.trim(),
      actionUrl: updateForm.actionUrl.trim(),
      additionalLinks: additionalLinks.map((link) => ({ ...link, label: link.label.trim(), url: link.url.trim() })),
      status,
      createdAt: previous?.createdAt ?? today,
      updatedAt: today,
    }
    const saved = await saveUpdates((current) => editingUpdateId
      ? current.map((item) => item.id === editingUpdateId ? update : item)
      : [update, ...current])
    if (!saved) {
      setUpdateError('Could not save this update. Check the Supabase academic_updates table and admin permissions.')
      return
    }
    setUpdateForm(updateFormDefaults)
    setUpdateAdditionalLinks([])
    setEditingUpdateId(null)
    setUpdateError('')
  }

  const sponsorStats = [
    ['Total Sponsors', sponsorsList.length],
    ['Published', sponsorsList.filter((sponsor) => sponsor.status === 'Published').length],
    ['Drafts', sponsorsList.filter((sponsor) => sponsor.status === 'Draft').length],
    ['Closed', sponsorsList.filter((sponsor) => sponsor.status === 'Closed').length],
  ]

  const handleSaveSponsor = async (status: SponsorStatus) => {
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
    const invalidSocialUrl = Object.values(sponsorForm.socialLinks).some((value) => value.trim() && !validUrl(value.trim()))
    if (invalidSocialUrl) {
      setSponsorError('Social profile links must be full http:// or https:// URLs.')
      return
    }
    const additionalLinks = sponsorAdditionalLinks.filter((link) => link.label.trim() || link.url.trim())
    if (additionalLinks.some((link) => !link.label.trim() || (link.type === 'external' ? !validUrl(link.url.trim()) : !link.url.startsWith('/') || link.url.startsWith('//')))) {
      setSponsorError('Each extra link needs a label and a valid site path or http:// / https:// URL.')
      return
    }

    const now = new Date().toISOString().slice(0, 10)
    const previous = sponsorsList.find((sponsor) => sponsor.id === editingSponsorId)
    const expiryDays = sponsorExpiryDays ? Number(sponsorExpiryDays) as 3 | 7 | 10 : null
    const expiresAt = status !== 'Published' || !expiryDays
      ? null
      : previous?.status === 'Published' && previous.expiryDays === expiryDays
        ? previous.expiresAt
        : new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
    const sponsor: Sponsor = {
      id: editingSponsorId ?? `sponsor-${Date.now()}`,
      name: sponsorForm.name.trim(),
      description: sponsorForm.description.trim(),
      thumbnailUrl: normalizeImageUrl(sponsorForm.thumbnailUrl),
      destinationUrl: sponsorForm.destinationUrl.trim(),
      socialLinks: Object.fromEntries(Object.entries(sponsorForm.socialLinks).filter(([, value]) => value.trim()).map(([platform, value]) => [platform, value.trim()])) as Sponsor['socialLinks'],
      additionalLinks: additionalLinks.map((link) => ({ ...link, label: link.label.trim(), url: link.url.trim() })),
      status,
      expiryDays,
      expiresAt,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    }
    const saved = await saveSponsors((current) => editingSponsorId
      ? current.map((item) => item.id === editingSponsorId ? sponsor : item)
      : [sponsor, ...current])
    if (!saved) {
      setSponsorError('Sponsor could not be saved to Supabase. Check the Supabase table, permissions, and sponsor expiry migration.')
      return
    }
    setSponsorForm(sponsorFormDefaults)
    setSponsorAdditionalLinks([])
    setEditingSponsorId(null)
    setSponsorExpiryDays('')
    setSponsorError('')
  }

  const today = pakistanToday()
  const jobStats = [
    ['Total Jobs', jobsList.length],
    ['Published', jobsList.filter((job) => job.status === 'Published' && !isJobDeadlinePassed(job, today)).length],
    ['Active', jobsList.filter((job) => ['Open', 'Closing Soon', 'Coming Soon', 'Published'].includes(job.status) && !isJobUnavailable(job, today)).length],
    ['Closed', jobsList.filter((job) => job.status === 'Closed').length],
    ['Drafts', jobsList.filter((job) => job.status === 'Draft').length],
    ['Expired', jobsList.filter((job) => job.status === 'Expired' || isJobDeadlinePassed(job, today)).length],
  ]

  const blogStats = [
    ['Total Articles', blogsList.length],
    ['Published', blogsList.filter((blog) => blog.status === 'Published').length],
    ['Drafts', blogsList.filter((blog) => blog.status === 'Draft').length],
  ]

  const academicStats = (kind: UpdateKind) => [
    [`Total ${kind === 'results' ? 'Results' : 'Admissions'}`, updatesList.filter((item) => item.kind === kind).length],
    ['Published', updatesList.filter((item) => item.kind === kind && item.status === 'Published').length],
    ['Drafts', updatesList.filter((item) => item.kind === kind && item.status === 'Draft').length],
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
    const additionalLinks = jobAdditionalLinks.filter((link) => link.label.trim() || link.url.trim())
    if (additionalLinks.some((link) => !link.label.trim() || (link.type === 'external' ? !validHttpUrl(link.url.trim()) : !link.url.startsWith('/') || link.url.startsWith('//')))) {
      setFormError('Each extra link needs a label and a valid site path (internal) or http:// / https:// URL (external).')
      return
    }

    setFormError('')
    const nextJob: Job = {
      id: editingId ?? `job-${Date.now()}`,
      title: formData.title || 'New Job Opening',
      slug: (formData.title || 'new-job-opening').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      department: formData.department || 'Department Name',
      category: formData.category as Job['category'],
      categoryLabel: categoriesList.find((category) => category.slug === formData.category)?.name ?? 'Government Jobs',
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
      additionalLinks: additionalLinks.map((link) => ({ ...link, label: link.label.trim(), url: link.url.trim() })),
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
    setJobAdditionalLinks([])
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
    const additionalLinks = blogAdditionalLinks.filter((link) => link.label.trim() || link.url.trim())
    const validHttpUrl = (value: string) => {
      try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
    }
    if (additionalLinks.some((link) => !link.label.trim() || (link.type === 'external' ? !validHttpUrl(link.url.trim()) : !link.url.startsWith('/') || link.url.startsWith('//')))) {
      setBlogError('Each extra link needs a label and a valid site path or http:// / https:// URL.')
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
      additionalLinks: additionalLinks.map((link) => ({ ...link, label: link.label.trim(), url: link.url.trim() })),
      status,
      createdAt: previousBlog?.createdAt ?? now,
      updatedAt: now,
    }

    saveBlogs((current) => editingBlogId
      ? current.map((blog) => blog.id === editingBlogId ? article : blog)
      : [article, ...current])
    setBlogForm(blogFormDefaults)
    setBlogAdditionalLinks([])
    setEditingBlogId(null)
    setBlogError('')
  }

  const handleClose = (jobId: string) => {
    saveJobs((current) =>
      current.map((job) => (job.id === jobId ? { ...job, status: 'Closed', updatedAt: today } : job)),
    )
  }

  const handleDelete = (jobId: string) => {
    saveJobs((current) => current.filter((job) => job.id !== jobId))
  }

  if (authPending) {
    return <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 text-sm text-slate-600">Checking admin access…</div>
  }

  if (isPasswordRecovery) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-md items-center justify-center px-4 py-10">
        <form onSubmit={handlePasswordRecovery} className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-900"><KeyRound className="size-6" /></div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Admin account recovery</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Set a new password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Choose a strong password with at least 8 characters.</p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">New password
              <input autoComplete="new-password" type="password" minLength={8} required value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Confirm new password
              <input autoComplete="new-password" type="password" minLength={8} required value={recoveryPasswordConfirm} onChange={(event) => setRecoveryPasswordConfirm(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" />
            </label>
          </div>
          {recoveryError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{recoveryError}</p>}
          <button type="submit" disabled={recoveryPending} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
            <LockKeyhole className="size-4" />{recoveryPending ? 'Updating password…' : 'Update password'}
          </button>
        </form>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-md items-center justify-center px-4 py-10">
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-emerald-950/5">
          <div className="border-b border-emerald-900/10 bg-[#f5f8f6] px-6 py-6 sm:px-8">
            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-emerald-900 text-[#f7d154]"><LockKeyhole className="size-6" /></div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Restricted workspace</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Admin sign in</h1>
            <p className="mt-1 text-sm text-slate-600">Use your authorized admin account to continue.</p>
          </div>

          <div className="p-6 sm:p-8">
            {!showForgotPassword ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Admin email
                  <input autoComplete="username" type="email" required value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" placeholder="you@example.com" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">Password
                  <input autoComplete="current-password" type="password" required value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" placeholder="Enter your password" />
                </label>
                {!isSupabaseConfigured && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-900">Admin access is unavailable until Supabase URL and anon key are configured.</p>}
                {loginError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{loginError}</p>}
                {failedLoginAttempts >= 5 && (
                  <button type="button" onClick={() => { setShowForgotPassword(true); setRecoveryError(''); setRecoveryMessage('') }} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950">
                    <KeyRound className="size-4" /> Forgot password?
                  </button>
                )}
                <button type="submit" disabled={!isSupabaseConfigured} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                  Sign in <ArrowRight className="size-4" />
                </button>
                {failedLoginAttempts > 0 && <p className="text-center text-xs text-slate-500">Failed attempts: {failedLoginAttempts}</p>}
              </form>
            ) : (
              <form onSubmit={handlePasswordResetRequest} className="space-y-4">
                <button type="button" onClick={() => { setShowForgotPassword(false); setRecoveryError(''); setRecoveryMessage('') }} className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4" /> Back to sign in</button>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Reset admin password</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-600">Enter the email for your admin account. We’ll send a secure reset link if it’s authorized.</p>
                </div>
                <label className="block text-sm font-semibold text-slate-700">Admin email
                  <input autoComplete="email" type="email" required value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" placeholder="you@example.com" />
                </label>
                {recoveryError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{recoveryError}</p>}
                {recoveryMessage && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900"><span className="inline-flex items-center gap-2"><MailCheck className="size-4 shrink-0" />{recoveryMessage}</span></p>}
                <button type="submit" disabled={!isSupabaseConfigured || recoveryPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50">
                  <MailCheck className="size-4" />{recoveryPending ? 'Sending link…' : 'Send reset link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  const sectionItems = [
    { id: 'jobs', label: 'Jobs', icon: BriefcaseBusiness, count: jobsList.length },
    { id: 'admissions', label: 'Admissions', icon: GraduationCap, count: updatesList.filter((item) => item.kind === 'admissions').length },
    { id: 'results', label: 'Results', icon: ClipboardCheck, count: updatesList.filter((item) => item.kind === 'results').length },
    { id: 'categories', label: 'Job types', icon: Tags, count: categoriesList.length },
    { id: 'blogs', label: 'Blogs', icon: BookOpenText, count: blogsList.length },
    { id: 'pages', label: 'Pages', icon: Files, count: pagesList.length },
    { id: 'sponsors', label: 'Sponsors', icon: Megaphone, count: sponsorsList.length },
  ] as const
  const activeSectionItem = sectionItems.find((section) => section.id === activeSection)
  const ActiveSectionIcon = activeSectionItem?.icon ?? Activity
  const activeSectionLabel = activeSectionItem?.label ?? 'Dashboard'
  const sectionDescriptions: Record<(typeof sectionItems)[number]['id'], string> = {
    jobs: 'Create listings, review deadlines, and manage applications.',
    admissions: 'Publish institute announcements and application links.',
    results: 'Share verified result notices and official result links.',
    categories: 'Manage the job types shown in navigation and filters.',
    blogs: 'Write, edit, and publish career articles.',
    pages: 'Edit About, Contact, Disclaimer, and policy page content.',
    sponsors: 'Manage sponsored placements and their visibility.',
  }
  const sectionStats = activeSection === 'jobs'
    ? jobStats
    : activeSection === 'blogs'
      ? blogStats
        : activeSection === 'pages'
          ? [['Editable pages', pagesList.length]]
      : activeSection === 'sponsors'
        ? sponsorStats
        : activeSection === 'admissions'
          ? academicStats('admissions')
          : activeSection === 'results'
            ? academicStats('results')
            : [['Job Types', categoriesList.length]]

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 border-t-4 border-t-emerald-800 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-900 text-[#f7d154] shadow-sm"><ActiveSectionIcon className="size-5" /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">PakJobInfo · Admin workspace</p>
            <h1 className="mt-0.5 text-2xl font-black leading-7 text-slate-950">{activeSectionLabel}</h1>
            <p className="mt-1 text-sm text-slate-500">{sectionDescriptions[activeSectionItem?.id ?? 'jobs']}</p>
          </div>
        </div>
        <button onClick={() => {
          void supabase.auth.signOut()
          setIsAuthenticated(false)
        }} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-800 sm:self-auto">
          <XCircle className="size-4" /> Log out
        </button>
      </header>

      <div className={`mb-7 grid grid-cols-2 gap-3 ${activeSection === 'jobs' ? 'sm:grid-cols-3 xl:grid-cols-6' : 'sm:grid-cols-3'}`}>
        {sectionStats.map(([label, value]) => {
          const StatIcon = label === 'Active' || label === 'Published' ? CheckCircle2 : label === 'Expired' || label === 'Closed' ? Clock3 : label === 'Drafts' ? FileText : Activity
          return (
            <article key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${label === 'Expired' || label === 'Closed' ? 'bg-rose-50 text-rose-700' : label === 'Active' || label === 'Published' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                <StatIcon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-500">{label}</span>
                <span className="block text-xl font-black tabular-nums leading-6 text-slate-950">{value}</span>
              </span>
            </article>
          )
        })}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Admin sections" className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Manage content</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:flex lg:flex-col">
            {sectionItems.map(({ id, label, icon: Icon, count }) => {
              const isActive = activeSection === id
              return (
                <button key={id} type="button" onClick={() => setActiveSection(id)} aria-current={isActive ? 'page' : undefined} className={`group flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition lg:w-full ${isActive ? 'border-emerald-900 bg-emerald-900 text-white shadow-sm' : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950'}`}>
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${isActive ? 'bg-white/10 text-[#f7d154]' : 'bg-slate-100 text-slate-500 group-hover:text-emerald-800'}`}><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <span className={`hidden rounded-md px-1.5 py-0.5 text-[11px] tabular-nums sm:inline-flex ${isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                </button>
              )
            })}
          </div>
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
            <ContentLinksEditor links={jobAdditionalLinks} onChange={setJobAdditionalLinks} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Main category
                <select value={formData.category} onChange={(event) => handleFieldChange('category', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500">
                  {categoriesList.map((category) => (
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
                <p><span className="font-semibold">Main category:</span> {categoriesList.find((category) => category.slug === formData.category)?.name}</p>
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
                    <p className="text-sm text-slate-600">{job.department} • {isJobDeadlinePassed(job, today) ? 'Expired' : job.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setEditingId(job.id); setFormData({ title: job.title, department: job.department, category: job.category, description: job.description, thumbnailUrl: job.thumbnailUrl, officialSourceUrl: job.officialSourceUrl, officialApplyUrl: job.officialApplyUrl, location: job.location, province: job.province, city: job.city, qualification: job.qualification, vacancies: String(job.vacancies), deadline: job.deadline, status: job.status }); setJobAdditionalLinks(job.additionalLinks ?? []); setPreviewMode(false) }} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
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
                  <span>{categoriesList.find((category) => category.slug === job.category)?.name ?? job.categoryLabel}</span>
                  <span>{job.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>}

      {(activeSection === 'admissions' || activeSection === 'results') && (() => {
        const kind = activeSection
        const title = kind === 'results' ? 'Result update' : 'Admission update'
        const actionLabel = kind === 'results' ? 'Check result link' : 'Apply / admission link'
        const records = updatesList.filter((item) => item.kind === kind)
        return <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{kind === 'results' ? 'Results desk' : 'Admissions desk'}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{editingUpdateId ? `Edit ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}</h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">Announcement title
                <input value={updateForm.title} onChange={(event) => setUpdateForm((current) => ({ ...current, title: event.target.value }))} placeholder={kind === 'results' ? 'e.g. Board examination results announced' : 'e.g. Fall 2027 admissions open'} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Department / institute / board
                <input value={updateForm.department} onChange={(event) => setUpdateForm((current) => ({ ...current, department: event.target.value }))} placeholder="Organization name" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Details
                <textarea rows={5} value={updateForm.details} onChange={(event) => setUpdateForm((current) => ({ ...current, details: event.target.value }))} placeholder="Add key dates, eligibility, roll number, or other useful details" className="mt-1 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Thumbnail image URL (Google Drive share link supported)
                <input value={updateForm.thumbnailUrl} onChange={(event) => setUpdateForm((current) => ({ ...current, thumbnailUrl: event.target.value }))} placeholder="Paste a public Google Drive image link or direct image URL" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
              </label>
              {updateForm.thumbnailUrl && <img src={normalizeImageUrl(updateForm.thumbnailUrl)} alt={`${kind} thumbnail preview`} className="h-40 w-full rounded-xl bg-slate-50 object-cover" />}
              <label className="block text-sm font-medium text-slate-700">Official source URL
                <input type="url" value={updateForm.sourceUrl} onChange={(event) => setUpdateForm((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="https://official-department.gov.pk/notice" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
              </label>
              <label className="block text-sm font-medium text-slate-700">{actionLabel}
                <input type="url" value={updateForm.actionUrl} onChange={(event) => setUpdateForm((current) => ({ ...current, actionUrl: event.target.value }))} placeholder="https://official-portal.gov.pk/..." className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
              </label>
              <ContentLinksEditor links={updateAdditionalLinks} onChange={setUpdateAdditionalLinks} />
              {updateError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{updateError}</p>}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => { void handleSaveUpdate(kind, 'Draft') }} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Save draft</button>
                <button type="button" onClick={() => { void handleSaveUpdate(kind, 'Published') }} className="rounded-xl bg-[#013d2d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005b3f]">Publish {kind === 'results' ? 'result' : 'admission'}</button>
                {editingUpdateId && <button type="button" onClick={() => { setUpdateForm(updateFormDefaults); setUpdateAdditionalLinks([]); setEditingUpdateId(null); setUpdateError('') }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel edit</button>}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Published page content</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{kind === 'results' ? 'Results' : 'Admissions'}</h2>
            <div className="mt-5 space-y-3">
              {records.length ? records.map((item) => (
                <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start">
                  {item.thumbnailUrl && <img src={normalizeImageUrl(item.thumbnailUrl)} alt="" className="h-20 w-20 shrink-0 rounded-lg bg-white object-cover" />}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.department} · {item.status} · {item.updatedAt}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.details}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingUpdateId(item.id); setUpdateForm({ title: item.title, department: item.department, details: item.details, thumbnailUrl: item.thumbnailUrl, sourceUrl: item.sourceUrl, actionUrl: item.actionUrl }); setUpdateAdditionalLinks(item.additionalLinks ?? []); setUpdateError('') }} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
                    <button type="button" onClick={() => { void saveUpdates((current) => current.filter((entry) => entry.id !== item.id)) }} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700">Delete</button>
                  </div>
                </article>
              )) : <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No {kind} updates yet. Add the first announcement here.</p>}
            </div>
          </div>
        </section>
      })()}

      {activeSection === 'categories' && <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">All Jobs navigation</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">{editingCategoryId ? 'Edit job type' : 'Add a job type'}</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Type name
              <input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Remote Jobs" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Short description
              <textarea rows={3} value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the jobs in this type" className="mt-1 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]" />
            </label>
            {editingCategoryId && <p className="text-xs text-slate-500">The URL slug stays unchanged when editing so existing job links remain stable.</p>}
            {categoryError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{categoryError}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { void handleSaveCategory() }} className="rounded-xl bg-[#013d2d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005b3f]">{editingCategoryId ? 'Save changes' : 'Add job type'}</button>
              {editingCategoryId && <button type="button" onClick={() => { setCategoryForm({ name: '', description: '' }); setEditingCategoryId(null); setCategoryError('') }} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Available in All Jobs</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Job types</h2>
          <div className="mt-5 space-y-3">
            {categoriesList.map((category) => (
              <article key={category.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900">{category.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{category.description || 'No description'}</p>
                  <p className="mt-1 text-xs text-slate-400">/{category.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditingCategoryId(category.id); setCategoryForm({ name: category.name, description: category.description }); setCategoryError('') }} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
                  <button type="button" onClick={() => { void handleDeleteCategory(category) }} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700">Delete</button>
                </div>
              </article>
            ))}
            {!categoriesList.length && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No job types loaded. Check Supabase categories setup.</p>}
          </div>
        </div>
      </section>}

      {activeSection === 'pages' && <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Website content</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Edit static page</h2>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Select page
              <select value={selectedPageSlug} onChange={(event) => handleSelectPage(event.target.value)} className="mt-1 block w-full min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10">
                {pagesList.map((page) => <option key={page.slug} value={page.slug}>{page.title}</option>)}
              </select>
            </label>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Page title
              <input value={pageForm.title} onChange={(event) => { setPageForm((current) => ({ ...current, title: event.target.value })); setPageSaved(false) }} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Introduction
              <textarea rows={5} value={pageForm.intro} onChange={(event) => { setPageForm((current) => ({ ...current, intro: event.target.value })); setPageSaved(false) }} className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Bullet points <span className="font-normal text-slate-500">(one per line)</span>
              <textarea rows={5} value={pageForm.list.join('\n')} onChange={(event) => { setPageForm((current) => ({ ...current, list: event.target.value.split('\n') })); setPageSaved(false) }} className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10" />
            </label>
            <fieldset className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
              <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Optional action button</legend>
              <label className="block text-sm font-semibold text-slate-700">Button text
                <input value={pageForm.actionLabel ?? ''} onChange={(event) => { setPageForm((current) => ({ ...current, actionLabel: event.target.value })); setPageSaved(false) }} placeholder="e.g. Open contact form" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">External button URL
                <input type="url" value={pageForm.actionHref ?? ''} onChange={(event) => { setPageForm((current) => ({ ...current, actionHref: event.target.value })); setPageSaved(false) }} placeholder="https://..." className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700" />
              </label>
            </fieldset>
            {pageError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{pageError}</p>}
            {pageSaved && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-900">Page content saved.</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">Public URL: <span className="font-semibold text-slate-700">/{pageForm.slug}</span></p>
              <button type="button" onClick={() => { void handleSavePage() }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"><CheckCircle2 className="size-4" />Save page</button>
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-[#f5f8f6] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Page preview</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{pageForm.title}</h3>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{pageForm.intro}</p>
          {pageForm.list.filter((item) => item.trim()).length > 0 && <ul className="mt-4 space-y-2 pl-5 text-sm text-slate-700">{pageForm.list.filter((item) => item.trim()).map((item, index) => <li key={`${index}-${item}`} className="list-disc">{item}</li>)}</ul>}
          {pageForm.actionLabel && <span className="mt-5 inline-flex rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white">{pageForm.actionLabel}</span>}
        </aside>
      </section>}

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
            <ContentLinksEditor links={blogAdditionalLinks} onChange={setBlogAdditionalLinks} />
            {blogForm.thumbnailUrl && <img src={normalizeImageUrl(blogForm.thumbnailUrl)} alt="Article thumbnail preview" className="h-40 w-full rounded-xl object-cover" />}
            {blogError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{blogError}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { setBlogStatus('Draft'); handleSaveBlog('Draft') }} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${blogStatus === 'Draft' ? 'border-[#005b3f] bg-emerald-50 text-[#013d2d]' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Save draft</button>
              <button type="button" onClick={() => { setBlogStatus('Published'); handleSaveBlog('Published') }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${blogStatus === 'Published' ? 'bg-[#005b3f] ring-2 ring-[#f7d154]' : 'bg-[#013d2d] hover:bg-[#005b3f]'}`}>Publish article</button>
              {editingBlogId && <button type="button" onClick={() => { setBlogForm(blogFormDefaults); setBlogAdditionalLinks([]); setEditingBlogId(null); setBlogError('') }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel edit</button>}
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
                  <button type="button" onClick={() => { setEditingBlogId(blog.id); setBlogForm({ title: blog.title, excerpt: blog.excerpt, content: blog.content, thumbnailUrl: blog.thumbnailUrl, socialLinks: { ...blogFormDefaults.socialLinks, ...blog.socialLinks } }); setBlogAdditionalLinks(blog.additionalLinks ?? []); setBlogStatus(blog.status); setBlogError('') }} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
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
            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-700">Social profiles (optional)</legend>
              <div className="grid grid-cols-2 gap-3">
                {([['instagram', 'Instagram'], ['facebook', 'Facebook'], ['pinterest', 'Pinterest'], ['tiktok', 'TikTok']] as const).map(([platform, label]) => (
                  <label key={platform} className="block min-w-0 text-xs font-medium text-slate-600">{label}
                    <input type="url" value={sponsorForm.socialLinks[platform]} onChange={(event) => setSponsorSocialLink(platform, event.target.value)} placeholder={`https://${platform}.com/...`} className="mt-1 h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-[#005b3f]" />
                  </label>
                ))}
              </div>
            </fieldset>
            <ContentLinksEditor links={sponsorAdditionalLinks} onChange={setSponsorAdditionalLinks} />
            <label className="block text-sm font-medium text-slate-700">Close placement after
              <select value={sponsorExpiryDays} onChange={(event) => setSponsorExpiryDays(event.target.value as SponsorExpiryOption)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#005b3f]">
                <option value="">No automatic closing</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="10">10 days</option>
              </select>
              <span className="mt-1 block text-xs text-slate-500">The countdown starts when you publish. Expired placements disappear and are marked Closed automatically.</span>
            </label>
            {sponsorError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sponsorError}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => { setSponsorStatus('Draft'); handleSaveSponsor('Draft') }} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${sponsorStatus === 'Draft' ? 'border-[#005b3f] bg-emerald-50 text-[#013d2d]' : 'border-slate-300 text-slate-700'}`}>Save draft</button>
              <button type="button" onClick={() => { setSponsorStatus('Published'); handleSaveSponsor('Published') }} className="rounded-xl bg-[#013d2d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005b3f]">Publish sponsor</button>
              {editingSponsorId && <button type="button" onClick={() => { setSponsorForm(sponsorFormDefaults); setSponsorAdditionalLinks([]); setEditingSponsorId(null); setSponsorError('') }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel edit</button>}
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
                  <button type="button" onClick={() => { setEditingSponsorId(sponsor.id); setSponsorForm({ name: sponsor.name, description: sponsor.description, thumbnailUrl: sponsor.thumbnailUrl, destinationUrl: sponsor.destinationUrl, socialLinks: { ...sponsorFormDefaults.socialLinks, ...sponsor.socialLinks } }); setSponsorAdditionalLinks(sponsor.additionalLinks ?? []); setSponsorStatus(sponsor.status); setSponsorExpiryDays(sponsor.expiryDays ? String(sponsor.expiryDays) as SponsorExpiryOption : ''); setSponsorError('') }} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
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
