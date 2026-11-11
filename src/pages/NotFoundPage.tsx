import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">404</p>
      <h1 className="mt-3 text-4xl font-black text-slate-900">Page not found</h1>
      <p className="mt-4 text-slate-600">The page you requested does not exist or may have moved.</p>
      <Link to="/" className="mt-6 inline-flex rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
        Return home
      </Link>
    </div>
  )
}
