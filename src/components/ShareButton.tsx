import { Share2 } from 'lucide-react'
import { useState } from 'react'

interface ShareButtonProps {
  title: string
  text?: string
  url?: string
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const [message, setMessage] = useState('')

  async function sharePost() {
    setMessage('')
    const shareUrl = url ?? window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }

    if (!navigator.clipboard?.writeText) {
      setMessage('Sharing is not available in this browser.')
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setMessage('Link copied')
    } catch {
      setMessage('Could not copy the link. Please copy it from the address bar.')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={sharePost}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        <Share2 className="size-4" />
        Share
      </button>
      <span role="status" aria-live="polite" className="text-xs text-emerald-800">{message}</span>
    </div>
  )
}
