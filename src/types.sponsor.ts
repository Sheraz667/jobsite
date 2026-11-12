export type SponsorStatus = 'Draft' | 'Published'

export interface Sponsor {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  destinationUrl: string
  status: SponsorStatus
  createdAt: string
  updatedAt: string
}