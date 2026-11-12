export type SponsorStatus = 'Draft' | 'Published' | 'Closed'

export interface Sponsor {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  destinationUrl: string
  status: SponsorStatus
  expiryDays: 3 | 7 | 10 | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}