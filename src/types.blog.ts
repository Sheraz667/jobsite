import type { ContentLink } from './types'

export type BlogStatus = 'Draft' | 'Published'
export type BlogSocialPlatform = 'pinterest' | 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'twitter'

export interface BlogArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  thumbnailUrl: string
  additionalLinks?: ContentLink[]
  socialLinks?: Partial<Record<BlogSocialPlatform, string>>
  status: BlogStatus
  createdAt: string
  updatedAt: string
}