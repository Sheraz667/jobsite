import { useSyncExternalStore } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import { normalizeImageUrl } from './imageUrl'
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
    thumbnailUrl: normalizeImageUrl(String(row.thumbnail_url ?? '')),
    destinationUrl: String(row.destination_url ?? ''),
    socialLinks: row.social_links && typeof row.social_links === 'object' ? row.social_links as Sponsor['socialLinks'] : {},
    additionalLinks: Array.isArray(row.additional_links) ? row.additional_links as Sponsor['additionalLinks'] : [],
    status: String(row.status) as Sponsor['status'],
    expiryDays: row.expiry_days === 3 || row.expiry_days === 7 || row.expiry_days === 10 ? row.expiry_days : null,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    createdAt: String(row.created_at).slice(0, 10),
    updatedAt: String(row.updated_at).slice(0, 10),
  }))
  notify()
}

export async function saveSponsors(update: Sponsor[] | ((current: Sponsor[]) => Sponsor[])): Promise<boolean> {
  const previous = sponsorSnapshot
  const nextSponsors = typeof update === 'function' ? update(previous) : update

  if (!isSupabaseConfigured) {
    sponsorSnapshot = nextSponsors
    try {
      localStorage.setItem(storageKey, JSON.stringify(sponsorSnapshot))
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
    notify()
    return true
  }

  const oldIds = new Set(previous.map((sponsor) => sponsor.id))
  const nextIds = new Set(nextSponsors.map((sponsor) => sponsor.id))
  const changed = nextSponsors.filter((sponsor) => !oldIds.has(sponsor.id) || JSON.stringify(sponsor) !== JSON.stringify(previous.find((item) => item.id === sponsor.id)))
  const results = await Promise.all([
    ...changed.map((sponsor) => supabase.from('sponsors').upsert({
      external_id: sponsor.id,
      name: sponsor.name,
      description: sponsor.description,
      thumbnail_url: sponsor.thumbnailUrl,
      destination_url: sponsor.destinationUrl,
      social_links: sponsor.socialLinks ?? {},
      additional_links: sponsor.additionalLinks ?? [],
      status: sponsor.status,
      expiry_days: sponsor.expiryDays,
      expires_at: sponsor.expiresAt,
      updated_at: sponsor.updatedAt,
    }, { onConflict: 'external_id' })),
    ...previous.filter((sponsor) => !nextIds.has(sponsor.id)).map((sponsor) => supabase.from('sponsors').delete().eq('external_id', sponsor.id)),
  ])

  const failed = results.find((result) => result.error)
  if (failed?.error) {
    console.error('Sponsor save failed:', failed.error.message)
    return false
  }

  sponsorSnapshot = nextSponsors
  try {
    localStorage.removeItem(storageKey)
  } catch {
    // Supabase remains the source of truth when browser storage is unavailable.
  }
  notify()
  return true
}