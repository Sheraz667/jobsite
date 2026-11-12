import { useSyncExternalStore } from 'react'
import { categories } from '../data/jobs'
import { jobs as seedJobs } from '../data/jobs'
import { isSupabaseConfigured, supabase } from './supabase'
import type { Job } from '../types'

const storageKey = 'jobsite-jobs'
const listeners = new Set<() => void>()

function readStoredJobs(): Job[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return seedJobs
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as Job[] : seedJobs
  } catch {
    return seedJobs
  }
}

let jobsSnapshot = isSupabaseConfigured ? [] : readStoredJobs()

function fromDatabaseRow(row: Record<string, unknown>): Job {
  const category = String(row.category_slug ?? 'other') as Job['category']
  const now = new Date().toISOString().slice(0, 10)
  return {
    id: String(row.external_id ?? row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    department: String(row.department ?? ''),
    category,
    categoryLabel: categories.find((item) => item.slug === category)?.name ?? 'Other',
    subcategory: row.subcategory ? String(row.subcategory) : undefined,
    description: String(row.description ?? ''),
    qualification: String(row.qualification ?? ''),
    ageLimit: String(row.age_limit ?? ''),
    experience: String(row.experience ?? ''),
    salary: row.salary ? String(row.salary) : undefined,
    location: String(row.location ?? ''),
    province: String(row.province ?? ''),
    city: String(row.city ?? ''),
    vacancies: Number(row.vacancies ?? 1),
    startDate: String(row.start_date ?? now),
    deadline: String(row.deadline ?? now),
    status: String(row.status ?? 'Published') as Job['status'],
    thumbnailUrl: String(row.thumbnail_url ?? ''),
    advertisementUrl: String(row.advertisement_url ?? ''),
    officialApplyUrl: String(row.official_apply_url ?? ''),
    officialSourceUrl: String(row.official_source_url ?? ''),
    additionalLinks: Array.isArray(row.additional_links) ? row.additional_links as Job['additionalLinks'] : [],
    seoTitle: String(row.seo_title ?? row.title ?? ''),
    seoDescription: String(row.seo_description ?? ''),
    seoKeywords: Array.isArray(row.seo_keywords) ? row.seo_keywords.map(String) : [],
    featured: Boolean(row.featured),
    publishedAt: row.published_at ? String(row.published_at).slice(0, 10) : undefined,
    createdAt: String(row.created_at ?? now).slice(0, 10),
    updatedAt: String(row.updated_at ?? now).slice(0, 10),
  }
}

function toDatabaseRow(job: Job) {
  return {
    external_id: job.id,
    title: job.title,
    slug: job.slug,
    department: job.department,
    category_slug: job.category,
    subcategory: job.subcategory ?? null,
    description: job.description,
    qualification: job.qualification,
    age_limit: job.ageLimit,
    experience: job.experience,
    salary: job.salary ?? null,
    location: job.location,
    province: job.province,
    city: job.city,
    vacancies: job.vacancies,
    start_date: job.startDate,
    deadline: job.deadline,
    status: job.status,
    thumbnail_url: job.thumbnailUrl,
    advertisement_url: job.advertisementUrl,
    official_apply_url: job.officialApplyUrl,
    official_source_url: job.officialSourceUrl,
    additional_links: job.additionalLinks ?? [],
    seo_title: job.seoTitle,
    seo_description: job.seoDescription,
    seo_keywords: job.seoKeywords,
    featured: job.featured ?? false,
    published_at: job.publishedAt ?? null,
    updated_at: job.updatedAt,
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

function handleStorage(event: StorageEvent) {
  if (event.key === storageKey) {
    jobsSnapshot = readStoredJobs()
    notify()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', handleStorage)
}

if (isSupabaseConfigured) {
  void reloadJobs()
}

export function getJobsSnapshot() {
  return jobsSnapshot
}

export function subscribeToJobs(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useJobs() {
  return useSyncExternalStore(subscribeToJobs, getJobsSnapshot, () => isSupabaseConfigured ? [] : seedJobs)
}

export function saveJobs(update: Job[] | ((current: Job[]) => Job[])) {
  const previous = jobsSnapshot
  jobsSnapshot = typeof update === 'function' ? update(jobsSnapshot) : update
  try {
    if (isSupabaseConfigured) localStorage.removeItem(storageKey)
    else localStorage.setItem(storageKey, JSON.stringify(jobsSnapshot))
  } catch {
    // Keep the current session usable if browser storage is unavailable.
  }
  notify()

  if (isSupabaseConfigured) {
    const previousIds = new Set(previous.map((job) => job.id))
    const nextIds = new Set(jobsSnapshot.map((job) => job.id))
    const changed = jobsSnapshot.filter((job) => !previousIds.has(job.id) || JSON.stringify(job) !== JSON.stringify(previous.find((item) => item.id === job.id)))
    void Promise.all([
      ...changed.map((job) => supabase.from('jobs').upsert(toDatabaseRow(job), { onConflict: 'external_id' })),
      ...previous.filter((job) => !nextIds.has(job.id)).map((job) => supabase.from('jobs').delete().eq('external_id', job.id)),
    ]).then((results) => {
      const failed = results.find((result) => result.error)
      if (failed?.error) console.error('Job save failed:', failed.error.message)
    })
  }
}

export async function reloadJobs() {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.from('jobs').select('*')
  if (error) {
    console.error('Job load failed:', error.message)
    return
  }
  jobsSnapshot = (data ?? []).map((row) => fromDatabaseRow(row as Record<string, unknown>))
  notify()
}