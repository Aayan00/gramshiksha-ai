import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { School as SchoolIcon, Bell, ChevronDown, User, ShieldCheck, LogOut, Check } from 'lucide-react'

export const Header: React.FC = () => {
  const { user, school, logout, loginAsDev } = useAuth()
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const roleLabels: Record<string, string> = {
    school_admin: 'Headmaster / Admin',
    teacher: 'Teacher (शिक्षक)',
    staff: 'Staff / Panchayat Officer',
    student: 'Student',
  }

  const roleBadgeColors: Record<string, string> = {
    school_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    teacher: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    staff: 'bg-blue-100 text-blue-800 border-blue-200',
    student: 'bg-amber-100 text-amber-800 border-amber-200',
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* School identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-700 to-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-sky-200">
          <SchoolIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-xs sm:max-w-md">
              {school?.name || 'Zilla Parishad Primary School'}
            </h2>
            {school?.udise_code && (
              <span className="hidden md:inline-block text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded border border-slate-200">
                UDISE: {school.udise_code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>{school?.panchayat_name || 'Shirur Gram Panchayat'}</span>
            <span>•</span>
            <span>{school?.district || 'Pune'}, {school?.state || 'Maharashtra'}</span>
          </div>
        </div>
      </div>

      {/* Right controls: Role switcher & profile */}
      <div className="flex items-center gap-3">
        {/* Local Persona / Role Switcher for instant testing */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Role:</span>
            <span className={`px-1.5 py-0.2 rounded font-medium border text-[11px] ${roleBadgeColors[user?.role || 'school_admin']}`}>
              {roleLabels[user?.role || 'school_admin']}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-scaleUp">
              <div className="px-3 py-1.5 font-semibold text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                Switch Test Persona (Dev Mode)
              </div>
              <button
                onClick={() => { loginAsDev('school_admin'); setShowRoleMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
              >
                <span>Headmaster (Admin)</span>
                {user?.role === 'school_admin' && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </button>
              <button
                onClick={() => { loginAsDev('teacher'); setShowRoleMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
              >
                <span>Teacher (शिक्षक)</span>
                {user?.role === 'teacher' && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </button>
              <button
                onClick={() => { loginAsDev('staff'); setShowRoleMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
              >
                <span>Panchayat Staff</span>
                {user?.role === 'staff' && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </button>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm border border-sky-200">
              {user?.display_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user?.display_name || 'User'}</div>
              <div className="text-[10px] text-slate-500">{roleLabels[user?.role || 'staff']}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-scaleUp">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-900">{user?.display_name}</div>
                <div className="text-slate-500 text-[11px] truncate">{user?.email || 'Authenticated'}</div>
              </div>
              <button
                onClick={() => { logout(); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
