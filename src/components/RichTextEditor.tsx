import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Underline } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

const toolbarButtonClass = 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#f7d154] hover:bg-[#013d2d] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005b3f]'

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [linkPanelOpen, setLinkPanelOpen] = useState(false)
  const [linkHref, setLinkHref] = useState('')
  const [linkError, setLinkError] = useState('')

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    onChange(editorRef.current?.innerHTML ?? '')
  }

  const openLinkPanel = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setLinkError('Select the text for your link first.')
      setLinkPanelOpen(true)
      return
    }

    savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    setLinkHref('')
    setLinkError('')
    setLinkPanelOpen(true)
  }

  const applyLink = () => {
    const trimmedHref = linkHref.trim()
    if (!(trimmedHref.startsWith('/') && !trimmedHref.startsWith('//')) && !/^https?:\/\//i.test(trimmedHref)) {
      setLinkError('Use an internal path like /jobs or a full http:// or https:// link.')
      return
    }

    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || !savedRangeRef.current) {
      setLinkError('Select the link text in the article before inserting a link.')
      return
    }

    editor.focus()
    selection.removeAllRanges()
    selection.addRange(savedRangeRef.current)
    document.execCommand('createLink', false, trimmedHref)
    onChange(editor.innerHTML)
    setLinkPanelOpen(false)
    setLinkError('')
  }

  const toolbarActions = [
    { label: 'Bold', icon: Bold, action: () => runCommand('bold') },
    { label: 'Italic', icon: Italic, action: () => runCommand('italic') },
    { label: 'Underline', icon: Underline, action: () => runCommand('underline') },
    { label: 'Heading 2', icon: Heading2, action: () => runCommand('formatBlock', 'h2') },
    { label: 'Heading 3', icon: Heading3, action: () => runCommand('formatBlock', 'h3') },
    { label: 'Bulleted list', icon: List, action: () => runCommand('insertUnorderedList') },
    { label: 'Numbered list', icon: ListOrdered, action: () => runCommand('insertOrderedList') },
    { label: 'Insert link', icon: Link2, action: openLinkPanel },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-[#005b3f]">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2" role="toolbar" aria-label="Article formatting">
        {toolbarActions.map(({ label, icon: Icon, action }) => (
          <button key={label} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={action} className={toolbarButtonClass}>
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Full article"
        aria-multiline="true"
        data-placeholder="Write your article here. Select text to format it or add a link..."
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="rich-text-editor min-h-64 p-4 text-sm leading-7 text-slate-800 outline-none"
      />
      {linkPanelOpen && (
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="article-link-url">Internal path or external URL</label>
          <input
            id="article-link-url"
            type="text"
            value={linkHref}
            onChange={(event) => { setLinkHref(event.target.value); setLinkError('') }}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyLink() } }}
            placeholder="/jobs or https://example.com"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#005b3f]"
            autoFocus
          />
          <button type="button" onClick={applyLink} className="rounded-lg bg-[#013d2d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#005b3f]">Add link</button>
          <button type="button" onClick={() => { setLinkPanelOpen(false); setLinkError('') }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
          {linkError && <p role="alert" className="text-sm text-red-700 sm:basis-full">{linkError}</p>}
        </div>
      )}
    </div>
  )
}