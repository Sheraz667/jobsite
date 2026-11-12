import { useSyncExternalStore } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import type { Sponsor } from '../types.sponsor'

const storageKey = 'jobsite-sponsors'
const listeners = new Set<() => void>()

function readStoredSponsors(): Sponsor[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as Sponsor[] : []
  } catch {
    return []
  }
}

let sponsorSnapshot = isSupabaseConfigured ? [] : readStoredSponsors()

function notify() {
  listeners.forEach((listener) => listener())
}

function handleStorage(event: StorageEvent) {
  if (event.key === storageKey && !isSupabaseConfigured) {
    sponsorSnapshot = readStoredSponsors()
    notify()
  }
}

if (typeof window !== 'undefined') window.addEventListener('storage', handleStorage)
if (isSupabaseConfigured) void reloadSponsors()

export function useSponsors() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => sponsorSnapshot,
    () => [],
  )
}

export async function reloadSponsors() {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.from('sponsors').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('Sponsor load failed:', error.message)
    return
  }
  sponsorSnapshot = (data ?? []).map((row) => ({
    id: String(row.external_id ?? row.id),
    name: String(row.name),
    description: String(row.description ?? ''),
    thumbnailUrl: String(row.thumbnail_url ?? ''),
    destinationUrl: String(row.destination_url ?? ''),
    status: String(row.status) as Sponsor['status'],
    createdAt: String(row.created_at).slice(0, 10),
    updatedAt: String(row.updated_at).slice(0, 10),
  }))
  notify()
}

export function saveSponsors(update: Sponsor[] | ((current: Sponsor[]) => Sponsor[])) {
  const previous = sponsorSnapshot
  sponsorSnapshot = typeof update === 'function' ? update(sponsorSnapshot) : update
  try {
    if (isSupabaseConfigured) localStorage.removeItem(storageKey)
    else localStorage.setItem(storageKey, JSON.stringify(sponsorSnapshot))
  } catch {
    // Keep the current session usable if browser storage is unavailable.
  }
  notify()

  if (!isSupabaseConfigured) return

  const oldIds = new Set(previous.map((sponsor) => sponsor.id))
  const nextIds = new Set(sponsorSnapshot.map((sponsor) => sponsor.id))
  const changed = sponsorSnapshot.filter((sponsor) => !oldIds.has(sponsor.id) || JSON.stringify(sponsor) !== JSON.stringify(previous.find((item) => item.id === sponsor.id)))
  void Promise.all([
    ...changed.map((sponsor) => supabase.from('sponsors').upsert({
      external_id: sponsor.id,
      name: sponsor.name,
      description: sponsor.description,
      thumbnail_url: sponsor.thumbnailUrl,
      destination_url: sponsor.destinationUrl,
      status: sponsor.status,
      updated_at: sponsor.updatedAt,
    }, { onConflict: 'external_id' })),
    ...previous.filter((sponsor) => !nextIds.has(sponsor.id)).map((sponsor) => supabase.from('sponsors').delete().eq('external_id', sponsor.id)),
  ]).then((results) => {
    const failed = results.find((result) => result.error)
    if (failed?.error) console.error('Sponsor save failed:', failed.error.message)
  })
}