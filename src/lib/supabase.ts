import { createClient } from '@supabase/supabase-js'
import { jobs as fallbackJobs } from '../data/jobs'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(supabaseUrl || 'http://127.0.0.1:54321', supabaseAnonKey || 'not-configured', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const getPublishedJobs = async () => {
  if (!isSupabaseConfigured) {
    return fallbackJobs.filter(
      (job) => !['Draft', 'Closed', 'Expired'].includes(job.status),
    )
  }

  const { data, error } = await supabase.from('jobs').select('*').eq('status', 'Published')

  if (error) {
    console.error('Supabase fetch error:', error.message)
    return fallbackJobs.filter((job) => !['Draft', 'Closed', 'Expired'].includes(job.status))
  }

  return data ?? fallbackJobs
}
