import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'

const siteUrl = 'https://pakjobinfo.com'
const outputDirectory = path.resolve('dist')
const staticPaths = [
  '/',
  '/jobs',
  '/blogs',
  '/about',
  '/contact',
  '/disclaimer',
  '/privacy-policy',
  '/terms',
  '/editorial-policy',
  '/admissions',
  '/results',
  '/government',
  '/private',
  '/internship',
  '/apprenticeship',
  '/police',
  '/banking',
  '/teaching',
  '/healthcare',
  '/engineering',
  '/it',
  '/other',
]

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function sitemapEntry(location, lastModified) {
  const lastmod = lastModified ? `<lastmod>${escapeXml(lastModified.slice(0, 10))}</lastmod>` : ''
  return `  <url><loc>${escapeXml(`${siteUrl}${location}`)}</loc>${lastmod}</url>`
}

const env = {
  ...loadEnv('production', process.cwd(), 'VITE_'),
  ...process.env,
}
const paths = new Map(staticPaths.map((route) => [route, undefined]))
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const [jobsResult, blogsResult] = await Promise.all([
    supabase.from('jobs').select('slug, updated_at').in('status', ['Published', 'Open', 'Closing Soon', 'Coming Soon']),
    supabase.from('blogs').select('slug, updated_at').eq('status', 'Published'),
  ])

  for (const [label, result, routePrefix] of [
    ['jobs', jobsResult, '/jobs/'],
    ['blogs', blogsResult, '/blogs/'],
  ]) {
    if (result.error) {
      console.warn(`Could not add ${label} to sitemap: ${result.error.message}`)
      continue
    }
    for (const item of result.data ?? []) {
      if (item.slug) paths.set(`${routePrefix}${encodeURIComponent(item.slug)}`, item.updated_at)
    }
  }
} else {
  console.warn('Supabase env is missing; sitemap will contain static pages only.')
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...[...paths].map(([route, lastModified]) => sitemapEntry(route, lastModified)),
  '</urlset>',
  '',
].join('\n')

await mkdir(outputDirectory, { recursive: true })
await writeFile(path.join(outputDirectory, 'sitemap.xml'), xml)
console.log(`Generated sitemap with ${paths.size} URLs.`)