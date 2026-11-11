export type BlogStatus = 'Draft' | 'Published'

export interface BlogArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  thumbnailUrl: string
  status: BlogStatus
  createdAt: string
  updatedAt: string
}