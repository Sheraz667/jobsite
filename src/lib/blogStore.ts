import { useSyncExternalStore } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import type { BlogArticle } from '../types.blog'

const storageKey = 'jobsite-blogs'
const listeners = new Set<() => void>()

function readStoredBlogs(): BlogArticle[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as BlogArticle[] : []
  } catch {
    return []
  }
}

let blogSnapshot: BlogArticle[] = isSupabaseConfigured ? [] : readStoredBlogs()

function notify() {
  listeners.forEach((listener) => listener())
}

function handleStorage(event: StorageEvent) {
  if (event.key === storageKey) {
    blogSnapshot = readStoredBlogs()
    notify()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', handleStorage)
}

if (isSupabaseConfigured) {
  void reloadBlogs()
}

export async function reloadBlogs() {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.from('blogs').select('*')
  if (error) {
    console.error('Blog load failed:', error.message)
    return
  }
  blogSnapshot = (data ?? []).map((row) => ({
    id: String(row.external_id ?? row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: String(row.excerpt),
    content: String(row.content),
    thumbnailUrl: String(row.thumbnail_url ?? ''),
    status: String(row.status) as BlogArticle['status'],
    createdAt: String(row.created_at).slice(0, 10),
    updatedAt: String(row.updated_at).slice(0, 10),
  }))
  notify()
}

export function useBlogs() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => blogSnapshot,
    () => [],
  )
}

export function saveBlogs(update: BlogArticle[] | ((current: BlogArticle[]) => BlogArticle[])) {
  const previous = blogSnapshot
  blogSnapshot = typeof update === 'function' ? update(blogSnapshot) : update
  try {
    if (isSupabaseConfigured) localStorage.removeItem(storageKey)
    else localStorage.setItem(storageKey, JSON.stringify(blogSnapshot))
  } catch {
    // Keep the current session usable if browser storage is unavailable.
  }
  notify()

  if (isSupabaseConfigured) {
    const previousIds = new Set(previous.map((blog) => blog.id))
    const nextIds = new Set(blogSnapshot.map((blog) => blog.id))
    const changed = blogSnapshot.filter((blog) => !previousIds.has(blog.id) || JSON.stringify(blog) !== JSON.stringify(previous.find((item) => item.id === blog.id)))
    void Promise.all([
      ...changed.map((blog) => supabase.from('blogs').upsert({
        external_id: blog.id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        thumbnail_url: blog.thumbnailUrl,
        status: blog.status,
        updated_at: blog.updatedAt,
      }, { onConflict: 'external_id' })),
      ...previous.filter((blog) => !nextIds.has(blog.id)).map((blog) => supabase.from('blogs').delete().eq('external_id', blog.id)),
    ]).then((results) => {
      const failed = results.find((result) => result.error)
      if (failed?.error) console.error('Blog save failed:', failed.error.message)
    })
  }
}