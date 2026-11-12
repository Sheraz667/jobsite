import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AcademicUpdatesPage } from './pages/AcademicUpdatesPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { BlogsPage } from './pages/BlogsPage'
import { CategoryPage } from './pages/CategoryPage'
import { HomePage } from './pages/HomePage'
import { JobDetailPage } from './pages/JobDetailPage'
import { JobsPage } from './pages/JobsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { StaticPage } from './pages/StaticPage'

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
          <Route path="about" element={<StaticPage title="About Us" intro="Pakistan Jobs Portal is an independent information platform dedicated to career opportunities across Pakistan. We curate verified public notices from official sources and present them in a clean, searchable, and easy-to-use format." list={['Independent job information service', 'Responsible editorial checks', 'Focus on public, active, and legitimate hiring opportunities']} />} />
          <Route path="contact" element={<StaticPage title="Contact Us" intro="We welcome queries, corrections, and partnership opportunities related to job information, admissions, and career content." list={['Support: Monday to Friday, 9:00 AM to 5:00 PM', 'Response time is usually within 2 business days']} actionLabel="Open contact form" actionHref="https://docs.google.com/forms/d/e/1FAIpQLSdWBN6fBO-RPoO77wrMtMYrpBb6OtYwVG8oQQd91CsMYxLEZg/viewform?usp=header" />} />
          <Route path="disclaimer" element={<StaticPage title="Disclaimer" intro="We are an independent job information and updates website. We are not affiliated with any government department, recruitment agency, or official hiring authority. Job information is collected from publicly available announcements and official sources. Applicants should verify all details through the relevant official department before applying. We do not recruit candidates or guarantee employment." list={['Always verify deadlines and requirements through official channels', 'We do not accept recruitment fees from applicants', 'We provide information, not hiring services']} />} />
          <Route path="privacy-policy" element={<StaticPage title="Privacy Policy" intro="This portal respects user privacy and uses data responsibly to provide a better job discovery experience." list={['We do not sell personal data to third parties', 'Analytics may be used to improve site performance and content quality', 'Admin access remains restricted to authorized users']} />} />
          <Route path="terms" element={<StaticPage title="Terms & Conditions" intro="Use of this website is subject to compliance with local laws and responsible browsing practices." list={['Do not misuse data or attempt unauthorized access', 'Information is provided as-is for public guidance', 'Users must verify official announcements before applying']} />} />
          <Route path="editorial-policy" element={<StaticPage title="Editorial Policy" intro="Our editorial process is focused on accuracy, public-source transparency, and responsible job listing practices." list={['Only include published and current opportunities', 'Avoid fake or misleading job claims', 'Review and update listings when official notices change']} />} />
          <Route path="admissions" element={<AcademicUpdatesPage kind="admissions" />} />
          <Route path="results" element={<AcademicUpdatesPage kind="results" />} />
          <Route path="admin" element={<AdminDashboardPage />} />
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
