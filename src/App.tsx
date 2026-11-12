import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AcademicUpdatesPage } from './pages/AcademicUpdatesPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { BlogsPage } from './pages/BlogsPage'
import { CategoryPage } from './pages/CategoryPage'
import { HomePage } from './pages/HomePage'
import { JobDetailPage } from './pages/JobDetailPage'
import { JobsPage } from './pages/JobsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { StaticPage } from './pages/StaticPage'

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })))

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
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:slug" element={<JobDetailPage />} />
          <Route path="blogs" element={<BlogsPage />} />
          <Route path="blogs/:slug" element={<BlogDetailPage />} />
          <Route path="about" element={<StaticPage slug="about" />} />
          <Route path="contact" element={<StaticPage slug="contact" />} />
          <Route path="disclaimer" element={<StaticPage slug="disclaimer" />} />
          <Route path="privacy-policy" element={<StaticPage slug="privacy-policy" />} />
          <Route path="terms" element={<StaticPage slug="terms" />} />
          <Route path="editorial-policy" element={<StaticPage slug="editorial-policy" />} />
          <Route path="admissions" element={<AcademicUpdatesPage kind="admissions" />} />
          <Route path="results" element={<AcademicUpdatesPage kind="results" />} />
          <Route path="admin" element={<Suspense fallback={<div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 text-sm text-slate-600">Loading admin workspace…</div>}><AdminDashboardPage /></Suspense>} />
          {categoryRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<CategoryPage categoryKey={route.key} />}
            />
          ))}
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
