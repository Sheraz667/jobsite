import type { ContentLink } from './types'

export type SponsorStatus = 'Draft' | 'Published' | 'Closed'
export type SponsorSocialPlatform = 'instagram' | 'facebook' | 'pinterest' | 'tiktok'

export interface Sponsor {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  destinationUrl: string
  socialLinks?: Partial<Record<SponsorSocialPlatform, string>>
  additionalLinks?: ContentLink[]
  status: SponsorStatus
  expiryDays: 3 | 7 | 10 | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}