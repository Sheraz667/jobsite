import { useSyncExternalStore } from 'react'
import { categories as defaultCategories } from '../data/jobs'
import { isSupabaseConfigured, supabase } from './supabase'
import type { CategoryDefinition } from '../types'

const storageKey = 'jobsite-categories'
const listeners = new Set<() => void>()

function readStoredCategories(): CategoryDefinition[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return defaultCategories
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as CategoryDefinition[] : defaultCategories
  } catch {
    return defaultCategories
  }
}

let categorySnapshot = isSupabaseConfigured ? [] : readStoredCategories()

function notify() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey && !isSupabaseConfigured) {
      categorySnapshot = readStoredCategories()
      notify()
    }
  })
}

if (isSupabaseConfigured) void reloadCategories()

export function useCategories() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => categorySnapshot,
    () => isSupabaseConfigured ? [] : defaultCategories,
  )
}

export function getCategoriesSnapshot() {
  return categorySnapshot
}

export async function reloadCategories() {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.from('categories').select('id, slug, name, description').order('name')
  if (error) {
    console.error('Category load failed:', error.message)
    return
  }
  categorySnapshot = (data ?? []).map((row, index) => ({
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ''),
    accent: defaultCategories[index % defaultCategories.length]?.accent ?? 'bg-slate-100 text-slate-700',
  }))
  notify()
}

export async function saveCategory(category: CategoryDefinition): Promise<string | null> {
  if (!isSupabaseConfigured) {
    const existing = categorySnapshot.some((item) => item.id === category.id)
    categorySnapshot = existing
      ? categorySnapshot.map((item) => item.id === category.id ? category : item)
      : [...categorySnapshot, category]
    try {
      localStorage.setItem(storageKey, JSON.stringify(categorySnapshot))
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
    notify()
    return null
  }

  const { error } = await supabase.from('categories').upsert({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
  }, { onConflict: 'id' })
  if (error) return error.message
  await reloadCategories()
  return null
}

export async function deleteCategory(category: CategoryDefinition): Promise<string | null> {
  if (isSupabaseConfigured) {
    const { data: jobs, error: jobsError } = await supabase.from('jobs').select('id').eq('category_slug', category.slug).limit(1)
    if (jobsError) return jobsError.message
    if (jobs?.length) return 'This type is assigned to one or more jobs. Reassign or delete those jobs first.'

    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (error) return error.message
    await reloadCategories()
    return null
  }

  categorySnapshot = categorySnapshot.filter((item) => item.id !== category.id)
  try {
    localStorage.setItem(storageKey, JSON.stringify(categorySnapshot))
  } catch {
    // Keep the current session usable if browser storage is unavailable.
  }
  notify()
  return null
}