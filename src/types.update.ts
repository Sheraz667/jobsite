import type { ContentLink } from './types'

export type UpdateKind = 'admissions' | 'results'
export type UpdateStatus = 'Draft' | 'Published'

export interface AcademicUpdate {
  id: string
  kind: UpdateKind
  title: string
  department: string
  details: string
  sourceUrl: string
  actionUrl: string
  additionalLinks?: ContentLink[]
  status: UpdateStatus
  createdAt: string
  updatedAt: string
}