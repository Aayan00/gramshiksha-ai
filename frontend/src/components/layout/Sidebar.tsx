import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Sparkles,
  LineChart,
  School,
  CalendarCheck,
  FileSpreadsheet,
  Settings,
  Building2,
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'school_admin'

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', marathi: 'डॅशबोर्ड', icon: LayoutDashboard },
    { to: '/students', label: 'Students', marathi: 'विद्यार्थी व्यवस्थापन', icon: Users },
    { to: '/teachers', label: 'Teachers', marathi: 'शिक्षक माहिती', icon: GraduationCap },
    { to: '/matching', label: 'AI Teacher Match', marathi: 'शिक्षक जुळणी AI', icon: Sparkles, badge: 'AI' },
    { to: '/analytics', label: 'Learning & Gaps', marathi: 'मूल्यमापन व प्रगती', icon: LineChart },
    { to: '/classes', label: 'Classes & Sections', marathi: 'इयत्ता व तुकडी', icon: School },
    { to: '/attendance', label: 'Attendance', marathi: 'दैनंदिन हजेरी', icon: CalendarCheck },
    { to: '/reports', label: 'Reports (CSV)', marathi: 'डाऊनलोड अहवाल', icon: FileSpreadsheet },
    ...(isAdmin
      ? [{ to: '/admin', label: 'School Admin', marathi: 'शाळा प्रशासन', icon: Building2, badge: 'Admin' }]
      : []),
    { to: '/settings', label: 'Settings', marathi: 'सेटिंग्ज', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 flex-shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-sky-500/20">
            G
          </div>
          <div>
            <div className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>GramShiksha</span>
              <span className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono px-1.5 py-0.2 rounded font-bold">
                AI
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Rural School Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <div>
                  <div>{item.label}</div>
                  <div className="text-[10px] opacity-60 font-normal">{item.marathi}</div>
                </div>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    item.badge === 'AI'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / Panchayat badge */}
      <div className="p-4 m-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
        <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          NIPUN Bharat Aligned
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Empowering rural Gram Panchayat schools with explainable AI support.
        </p>
      </div>
    </aside>
  )
}
