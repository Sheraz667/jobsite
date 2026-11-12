export type JobStatus =
  | 'Draft'
  | 'Published'
  | 'Coming Soon'
  | 'Open'
  | 'Closing Soon'
  | 'Closed'
  | 'Expired'

export type JobCategory = string

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship'

export interface ContentLink {
  label: string
  url: string
  type: 'internal' | 'external'
}

export interface Job {
  id: string
  title: string
  slug: string
  department: string
  category: JobCategory
  categoryLabel: string
  subcategory?: string
  description: string
  qualification: string
  ageLimit: string
  experience: string
  salary?: string
  location: string
  province: string
  city: string
  vacancies: number
  startDate: string
  deadline: string
  status: JobStatus
  thumbnailUrl: string
  advertisementUrl: string
  officialApplyUrl: string
  officialSourceUrl: string
  additionalLinks?: ContentLink[]
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]
  featured?: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CategoryDefinition {
  id: string
  slug: string
  name: string
  description: string
  accent: string
}
