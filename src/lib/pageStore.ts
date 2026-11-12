import { useSyncExternalStore } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import type { ManagedPage } from '../types.page'

export const defaultPages: ManagedPage[] = [
  {
    slug: 'about',
    title: 'About Us',
    intro: 'Pakistan Jobs Portal is an independent information platform dedicated to career opportunities across Pakistan. We curate verified public notices from official sources and present them in a clean, searchable, and easy-to-use format.',
    list: ['Independent job information service', 'Responsible editorial checks', 'Focus on public, active, and legitimate hiring opportunities'],
    updatedAt: '2026-01-01',
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    intro: 'We welcome queries, corrections, and partnership opportunities related to job information, admissions, and career content.',
    list: ['Support: Monday to Friday, 9:00 AM to 5:00 PM', 'Response time is usually within 2 business days'],
    actionLabel: 'Open contact form',
    actionHref: 'https://docs.google.com/forms/d/e/1FAIpQLSdWBN6fBO-RPoO77wrMtMYrpBb6OtYwVG8oQQd91CsMYxLEZg/viewform?usp=header',
    updatedAt: '2026-01-01',
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer',
    intro: 'We are an independent job information and updates website. We are not affiliated with any government department, recruitment agency, or official hiring authority. Job information is collected from publicly available announcements and official sources. Applicants should verify all details through the relevant official department before applying. We do not recruit candidates or guarantee employment.',
    list: ['Always verify deadlines and requirements through official channels', 'We do not accept recruitment fees from applicants', 'We provide information, not hiring services'],
    updatedAt: '2026-01-01',
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    intro: 'This portal respects user privacy and uses data responsibly to provide a better job discovery experience.',
    list: ['We do not sell personal data to third parties', 'Analytics may be used to improve site performance and content quality', 'Admin access remains restricted to authorized users'],
    updatedAt: '2026-01-01',
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    intro: 'Use of this website is subject to compliance with local laws and responsible browsing practices.',
    list: ['Do not misuse data or attempt unauthorized access', 'Information is provided as-is for public guidance', 'Users must verify official announcements before applying'],
    updatedAt: '2026-01-01',
  },
  {
    slug: 'editorial-policy',
    title: 'Editorial Policy',
    intro: 'Our editorial process is focused on accuracy, public-source transparency, and responsible job listing practices.',
    list: ['Only include published and current opportunities', 'Avoid fake or misleading job claims', 'Review and update listings when official notices change'],
    updatedAt: '2026-01-01',
  },
]

const listeners = new Set<() => void>()
let pageSnapshot = defaultPages

function notify() {
  listeners.forEach((listener) => listener())
}

export function usePages() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => pageSnapshot,
    () => defaultPages,
  )
}

export function getPagesSnapshot() {
  return pageSnapshot
}

export async function reloadPages() {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.from('static_pages').select('*')
  if (error) {
    console.error('Page content load failed:', error.message)
    return
  }
  const storedPages = (data ?? []).map((row) => ({
    slug: String(row.slug),
    title: String(row.title),
    intro: String(row.intro ?? ''),
    list: Array.isArray(row.content_list) ? row.content_list.map(String) : [],
    actionHref: row.action_href ? String(row.action_href) : undefined,
    actionLabel: row.action_label ? String(row.action_label) : undefined,
    updatedAt: String(row.updated_at ?? '').slice(0, 10),
  }))
  pageSnapshot = defaultPages.map((defaultPage) => storedPages.find((page) => page.slug === defaultPage.slug) ?? defaultPage)
  notify()
}

export async function savePage(page: ManagedPage): Promise<string | null> {
  if (!isSupabaseConfigured) {
    pageSnapshot = pageSnapshot.map((item) => item.slug === page.slug ? page : item)
    notify()
    return null
  }

  const { error } = await supabase.from('static_pages').upsert({
    slug: page.slug,
    title: page.title,
    intro: page.intro,
    content_list: page.list,
    action_href: page.actionHref || null,
    action_label: page.actionLabel || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'slug' })
  if (error) return error.message
  pageSnapshot = pageSnapshot.map((item) => item.slug === page.slug ? page : item)
  notify()
  return null
}

if (isSupabaseConfigured) void reloadPages()
