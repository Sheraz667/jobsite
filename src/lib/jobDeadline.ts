import type { Job } from '../types'

export function pakistanToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function isJobDeadlinePassed(job: Pick<Job, 'deadline'>, today = pakistanToday()) {
  return Boolean(job.deadline) && job.deadline < today
}

export function isJobUnavailable(job: Pick<Job, 'deadline' | 'status'>, today = pakistanToday()) {
  return ['Closed', 'Expired', 'Draft'].includes(job.status) || isJobDeadlinePassed(job, today)
}