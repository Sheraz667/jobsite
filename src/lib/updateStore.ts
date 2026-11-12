import { useSyncExternalStore } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import type { AcademicUpdate, UpdateKind } from '../types.update'

const storageKey = 'jobsite-academic-updates'
const listeners = new Set<() => void>()

function readStoredUpdates(): AcademicUpdate[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as AcademicUpdate[] : []
  } catch {
    return []
  }
}

let updateSnapshot = isSupabaseConfigured ? [] : readStoredUpdates()

function notify() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey && !isSupabaseConfigured) {
      updateSnapshot = readStoredUpdates()
      notify()
    }
  })
}

if (isSupabaseConfigured) void reloadUpdates()

export function useUpdates() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => updateSnapshot,
    () => [],
  )
}

export async function reloadUpdates() {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.from('academic_updates').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('Admissions/results load failed:', error.message)
    return
  }
  updateSnapshot = (data ?? []).map((row) => ({
    id: String(row.external_id ?? row.id),
    kind: String(row.kind) as UpdateKind,
    title: String(row.title),
    department: String(row.department ?? ''),
    details: String(row.details ?? ''),
    sourceUrl: String(row.source_url ?? ''),
    actionUrl: String(row.action_url ?? ''),
    additionalLinks: Array.isArray(row.additional_links) ? row.additional_links as AcademicUpdate['additionalLinks'] : [],
    status: String(row.status) as AcademicUpdate['status'],
    createdAt: String(row.created_at).slice(0, 10),
    updatedAt: String(row.updated_at).slice(0, 10),
  }))
  notify()
}

export async function saveUpdates(update: AcademicUpdate[] | ((current: AcademicUpdate[]) => AcademicUpdate[])): Promise<boolean> {
  const previous = updateSnapshot
  const next = typeof update === 'function' ? update(previous) : update
  if (!isSupabaseConfigured) {
    updateSnapshot = next
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
    notify()
    return true
  }

  const previousIds = new Set(previous.map((item) => item.id))
  const nextIds = new Set(next.map((item) => item.id))
  const changed = next.filter((item) => !previousIds.has(item.id) || JSON.stringify(item) !== JSON.stringify(previous.find((old) => old.id === item.id)))
  const results = await Promise.all([
    ...changed.map((item) => supabase.from('academic_updates').upsert({
      external_id: item.id,
      kind: item.kind,
      title: item.title,
      department: item.department,
      details: item.details,
      source_url: item.sourceUrl,
      action_url: item.actionUrl,
      additional_links: item.additionalLinks ?? [],
      status: item.status,
      updated_at: item.updatedAt,
    }, { onConflict: 'external_id' })),
    ...previous.filter((item) => !nextIds.has(item.id)).map((item) => supabase.from('academic_updates').delete().eq('external_id', item.id)),
  ])
  if (results.some((result) => result.error)) return false
  updateSnapshot = next
  try {
    localStorage.removeItem(storageKey)
  } catch {
    // Supabase remains the source of truth when browser storage is unavailable.
  }
  notify()
  return true
}