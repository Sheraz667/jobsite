import { useSyncExternalStore } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import type { FooterLinkItem } from '../types.footer'

export const defaultFooterLinks: FooterLinkItem[] = [
  { id: 'quick-government', group: 'quick', label: 'Government Jobs', url: '/government', type: 'internal', sortOrder: 0 },
  { id: 'quick-private', group: 'quick', label: 'Private Jobs', url: '/private', type: 'internal', sortOrder: 1 },
  { id: 'quick-internship', group: 'quick', label: 'Internships', url: '/internship', type: 'internal', sortOrder: 2 },
  { id: 'quick-apprenticeship', group: 'quick', label: 'Apprenticeships', url: '/apprenticeship', type: 'internal', sortOrder: 3 },
  { id: 'quick-police', group: 'quick', label: 'Police & Forces', url: '/police', type: 'internal', sortOrder: 4 },
  { id: 'quick-banking', group: 'quick', label: 'Banking Jobs', url: '/banking', type: 'internal', sortOrder: 5 },
  { id: 'company-about', group: 'company', label: 'About Us', url: '/about', type: 'internal', sortOrder: 0 },
  { id: 'company-contact', group: 'company', label: 'Contact Us', url: '/contact', type: 'internal', sortOrder: 1 },
  { id: 'company-privacy', group: 'company', label: 'Privacy Policy', url: '/privacy-policy', type: 'internal', sortOrder: 2 },
  { id: 'company-terms', group: 'company', label: 'Terms & Conditions', url: '/terms', type: 'internal', sortOrder: 3 },
  { id: 'legal-disclaimer', group: 'legal', label: 'Disclaimer', url: '/disclaimer', type: 'internal', sortOrder: 0 },
  { id: 'legal-editorial', group: 'legal', label: 'Editorial Policy', url: '/editorial-policy', type: 'internal', sortOrder: 1 },
  { id: 'legal-sitemap', group: 'legal', label: 'Sitemap', url: '/sitemap.xml', type: 'internal', sortOrder: 2 },
  { id: 'social-instagram', group: 'social', label: 'Instagram', url: 'https://www.instagram.com/pakjobinfo.pk?dlrf=eXB1NXpydHc5Nngw', type: 'external', platform: 'instagram', sortOrder: 0 },
  { id: 'social-facebook', group: 'social', label: 'Facebook', url: 'https://www.facebook.com/share/1A7eS5HroF/', type: 'external', platform: 'facebook', sortOrder: 1 },
  { id: 'social-pinterest', group: 'social', label: 'Pinterest', url: 'https://pin.it/50hkAlHKp', type: 'external', platform: 'pinterest', sortOrder: 2 },
  { id: 'social-tiktok', group: 'social', label: 'TikTok', url: 'https://www.tiktok.com/@pakjobinfo5?_r=1&_t=ZN-9BLESJyTf7r', type: 'external', platform: 'tiktok', sortOrder: 3 },
]

const listeners = new Set<() => void>()
let footerLinkSnapshot = defaultFooterLinks

function notify() {
  listeners.forEach((listener) => listener())
}

export function useFooterLinks() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => footerLinkSnapshot,
    () => defaultFooterLinks,
  )
}

export async function reloadFooterLinks() {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.from('footer_links').select('*').order('group_key').order('sort_order')
  if (error) {
    console.error('Footer links load failed:', error.message)
    return
  }
  if (!data?.length) {
    footerLinkSnapshot = defaultFooterLinks
    notify()
    const { error: seedError } = await supabase.from('footer_links').upsert(defaultFooterLinks.map((link) => ({
      external_id: link.id,
      group_key: link.group,
      label: link.label,
      url: link.url,
      link_type: link.type,
      platform: link.platform ?? null,
      sort_order: link.sortOrder,
      updated_at: new Date().toISOString(),
    })), { onConflict: 'external_id' })
    if (seedError) console.error('Default footer links save failed:', seedError.message)
    return
  }
  footerLinkSnapshot = (data ?? []).map((row) => ({
    id: String(row.external_id ?? row.id),
    group: String(row.group_key) as FooterLinkItem['group'],
    label: String(row.label),
    url: String(row.url),
    type: String(row.link_type) as FooterLinkItem['type'],
    platform: row.platform ? String(row.platform) as FooterLinkItem['platform'] : undefined,
    sortOrder: Number(row.sort_order ?? 0),
  }))
  notify()
}

export async function saveFooterLinks(nextLinks: FooterLinkItem[]): Promise<string | null> {
  if (!isSupabaseConfigured) {
    footerLinkSnapshot = nextLinks
    notify()
    return null
  }

  const previous = footerLinkSnapshot
  const previousIds = new Set(previous.map((link) => link.id))
  const nextIds = new Set(nextLinks.map((link) => link.id))
  const changed = nextLinks.filter((link) => !previousIds.has(link.id) || JSON.stringify(link) !== JSON.stringify(previous.find((old) => old.id === link.id)))
  const results = await Promise.all([
    ...changed.map((link) => supabase.from('footer_links').upsert({
      external_id: link.id,
      group_key: link.group,
      label: link.label,
      url: link.url,
      link_type: link.type,
      platform: link.platform ?? null,
      sort_order: link.sortOrder,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'external_id' })),
    ...previous.filter((link) => !nextIds.has(link.id)).map((link) => supabase.from('footer_links').delete().eq('external_id', link.id)),
  ])
  const failed = results.find((result) => result.error)
  if (failed?.error) return failed.error.message
  footerLinkSnapshot = nextLinks
  notify()
  return null
}

if (isSupabaseConfigured) void reloadFooterLinks()
