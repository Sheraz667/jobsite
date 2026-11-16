import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'

const AcademicUpdatesPage = lazy(() => import('./pages/AcademicUpdatesPage').then((module) => ({ default: module.AcademicUpdatesPage })))
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage').then((module) => ({ default: module.BlogDetailPage })))
const BlogsPage = lazy(() => import('./pages/BlogsPage').then((module) => ({ default: module.BlogsPage })))
const CategoryPage = lazy(() => import('./pages/CategoryPage').then((module) => ({ default: module.CategoryPage })))
const JobDetailPage = lazy(() => import('./pages/JobDetailPage').then((module) => ({ default: module.JobDetailPage })))
const JobsPage = lazy(() => import('./pages/JobsPage').then((module) => ({ default: module.JobsPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const StaticPage = lazy(() => import('./pages/StaticPage').then((module) => ({ default: module.StaticPage })))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })))

function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 text-sm text-slate-600">Loading page…</div>}>
      {children}
    </Suspense>
  )
}

const categoryRoutes = [
  { path: '/government', key: 'government' },
  { path: '/private', key: 'private' },
  { path: '/internship', key: 'internship' },
  { path: '/apprenticeship', key: 'apprenticeship' },
  { path: '/police', key: 'police' },
  { path: '/banking', key: 'banking' },
  { path: '/teaching', key: 'teaching' },
  { path: '/healthcare', key: 'healthcare' },
  { path: '/engineering', key: 'engineering' },
  { path: '/it', key: 'it' },
  { path: '/other', key: 'other' },
] as const

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="jobs" element={<PageSuspense><JobsPage /></PageSuspense>} />
          <Route path="jobs/:slug" element={<PageSuspense><JobDetailPage /></PageSuspense>} />
          <Route path="blogs" element={<PageSuspense><BlogsPage /></PageSuspense>} />
          <Route path="blogs/:slug" element={<PageSuspense><BlogDetailPage /></PageSuspense>} />
          <Route path="about" element={<PageSuspense><StaticPage slug="about" /></PageSuspense>} />
          <Route path="contact" element={<PageSuspense><StaticPage slug="contact" /></PageSuspense>} />
          <Route path="disclaimer" element={<PageSuspense><StaticPage slug="disclaimer" /></PageSuspense>} />
          <Route path="privacy-policy" element={<PageSuspense><StaticPage slug="privacy-policy" /></PageSuspense>} />
          <Route path="terms" element={<PageSuspense><StaticPage slug="terms" /></PageSuspense>} />
          <Route path="editorial-policy" element={<PageSuspense><StaticPage slug="editorial-policy" /></PageSuspense>} />
          <Route path="admissions" element={<PageSuspense><AcademicUpdatesPage kind="admissions" /></PageSuspense>} />
          <Route path="results" element={<PageSuspense><AcademicUpdatesPage kind="results" /></PageSuspense>} />
          <Route path="admin" element={<PageSuspense><AdminDashboardPage /></PageSuspense>} />
          {categoryRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<PageSuspense><CategoryPage categoryKey={route.key} /></PageSuspense>}
            />
          ))}
          <Route path="category/:slug" element={<PageSuspense><CategoryPage /></PageSuspense>} />
          <Route path="*" element={<PageSuspense><NotFoundPage /></PageSuspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
