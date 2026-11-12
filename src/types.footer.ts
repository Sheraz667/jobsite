export type FooterLinkGroup = 'quick' | 'company' | 'legal' | 'social'
export type FooterLinkType = 'internal' | 'external'
export type FooterSocialPlatform = 'instagram' | 'facebook' | 'pinterest' | 'tiktok' | 'youtube' | 'twitter'

export interface FooterLinkItem {
  id: string
  group: FooterLinkGroup
  label: string
  url: string
  type: FooterLinkType
  platform?: FooterSocialPlatform
  sortOrder: number
}
