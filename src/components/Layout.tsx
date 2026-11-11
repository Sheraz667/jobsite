import { ChevronDown, ExternalLink, LayoutDashboard, Menu, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import brandLogo from '../assets/logo/logo2.png'

const primaryLinks = [
  { label: 'Home', to: '/' },
  { label: 'Admissions', to: '/admissions' },
  { label: 'Results', to: '/results' },
  { label: 'Blogs', to: '/blogs' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Disclaimer', to: '/disclaimer' },
]

const jobLinks = [
  { label: 'All Jobs', to: '/jobs' },
  { label: 'Government Jobs', to: '/government' },
  { label: 'Private Jobs', to: '/private' },
  { label: 'Internships', to: '/internship' },
  { label: 'Apprenticeships', to: '/apprenticeship' },
  { label: 'Police & Forces', to: '/police' },
  { label: 'Banking Jobs', to: '/banking' },
  { label: 'Teaching Jobs', to: '/teaching' },
  { label: 'Healthcare Jobs', to: '/healthcare' },
  { label: 'Engineering Jobs', to: '/engineering' },
  { label: 'IT Jobs', to: '/it' },
  { label: 'Other Jobs', to: '/other' },
]

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdminRoute = useLocation().pathname.startsWith('/admin')

  const quickLinks = useMemo(
    () => [
      { label: 'Government Jobs', to: '/government' },
      { label: 'Private Jobs', to: '/private' },
      { label: 'Internships', to: '/internship' },
      { label: 'Apprenticeships', to: '/apprenticeship' },
      { label: 'Police & Forces', to: '/police' },
      { label: 'Banking Jobs', to: '/banking' },
    ],
    [],
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {isAdminRoute ? (
        <header className="sticky top-0 z-40 border-b border-emerald-800 bg-[#071f19] text-white shadow-lg shadow-emerald-950/10">
          <div className="mx-auto flex min-h-20 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link to="/admin" className="flex min-w-0 items-center gap-3">
              <img src={brandLogo} alt="PakJobInfo" className="h-16 w-24 shrink-0 rounded-lg bg-white object-contain shadow-sm sm:w-32" />
              <span className="min-w-0">
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">Admin Console</span>
              </span>
            </Link>
            <nav aria-label="Admin navigation" className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-emerald-50 sm:inline-flex">
                <LayoutDashboard className="h-4 w-4 text-[#f7d154]" />
                Workspace
              </span>
              <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-[#f7d154] px-3 py-2 text-sm font-semibold text-[#013d2d] transition hover:bg-[#f3c93a] sm:px-4">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">View website</span>
                <span className="sm:hidden">Website</span>
              </Link>
            </nav>
          </div>
        </header>
      ) : (
      <header className="sticky top-3 z-40 mx-3 overflow-visible rounded-[1.5rem] border border-emerald-700/40 bg-[#012b20] text-white shadow-xl shadow-emerald-950/20 backdrop-blur sm:mx-5 lg:mx-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={brandLogo} alt="PakJobInfo" className="h-16 w-24 shrink-0 rounded-lg bg-white object-contain shadow-sm sm:w-32" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-100">Jobs & Career Updates</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-emerald-50 transition hover:bg-white/10 [&::-webkit-details-marker]:hidden">
                Jobs
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>
              <div className="absolute left-0 top-full z-50 mt-3 grid w-[25rem] grid-cols-2 gap-1 rounded-2xl border border-emerald-800/20 bg-white p-2 text-slate-800 shadow-xl">
                {jobLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-xl border border-transparent px-3 py-2 text-sm transition-colors ${isActive ? 'border-[#f7d154] bg-[#f7d154] font-semibold text-[#013d2d]' : 'text-[#013d2d] hover:border-[#f7d154] hover:bg-[#013d2d] hover:text-white'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </details>
            {primaryLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-[#f7d154] text-[#013d2d]' : 'text-emerald-50 hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-[#f7d154] px-4 py-2 text-sm font-semibold text-[#013d2d] hover:bg-[#f3c93a]">
              <ShieldCheck className="h-4 w-4" />
              Admin Login
            </Link>
          </div>

          <button type="button" className="rounded-xl border border-white/20 bg-white/5 p-2 xl:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-[#014f3b] xl:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
              <details className="group rounded-xl">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-emerald-50 hover:bg-white/5 [&::-webkit-details-marker]:hidden">
                  Jobs
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                </summary>
                <div className="mt-1 grid grid-cols-2 gap-1 border-l border-white/15 pl-3">
                  {jobLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-[#f7d154] font-semibold text-[#013d2d]' : 'text-emerald-50 hover:bg-white/5'}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </details>
              {primaryLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-[#f7d154] text-[#013d2d]' : 'text-emerald-50 hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#f7d154] px-3 py-2.5 text-sm font-semibold text-[#013d2d]">
                <ShieldCheck className="h-4 w-4" />
                Admin Login
              </Link>
            </div>
          </div>
        )}
      </header>
      )}

      <main>
        <Outlet />
      </main>

      {!isAdminRoute && <footer className="mt-16 border-t border-emerald-900/20 bg-[#013d2d] text-emerald-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src={brandLogo} alt="PakJobInfo" className="h-16 w-24 rounded-lg bg-white object-contain" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200">Jobs & Career Updates</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-emerald-50/80">
              We are an independent job information and updates website. We are not affiliated with any government department, recruitment agency, or official hiring authority.
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">Quick links</p>
            <ul className="space-y-2 text-sm">
              {quickLinks.slice(0, 6).map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">Company</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/disclaimer" className="hover:text-white">Disclaimer</Link></li>
              <li><Link to="/editorial-policy" className="hover:text-white">Editorial Policy</Link></li>
              <li><Link to="/sitemap.xml" className="hover:text-white">Sitemap</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-4 text-center text-sm text-emerald-100/80">
          © 2026 PakJobInfo. All rights reserved.
        </div>
      </footer>}
    </div>
  )
}
