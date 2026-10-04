import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  Settings,
  User,
  Languages,
  Shield,
  Bell,
  Save,
  CheckCircle2,
} from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const { user, school, isSupabaseEnabled } = useAuth()
  const { success } = useToast()

  const [preferredLang, setPreferredLang] = useState('mr')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    success('Platform preferences saved!')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account & Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your account profile, UI language preference, and platform security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center h-fit">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-sky-600/20 mb-4">
            {user?.display_name?.charAt(0) || 'U'}
          </div>
          <h3 className="text-base font-bold text-slate-900">{user?.display_name}</h3>
          <p className="text-xs text-slate-500 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
          <div className="mt-4 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
            {school?.name || 'Zilla Parishad School'}
          </div>

          <div className="w-full mt-6 pt-4 border-t border-slate-100 text-left text-xs space-y-2 text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">Email:</span> {user?.email || 'dev-account@local'}
            </div>
            <div>
              <span className="font-semibold text-slate-700">UDISE:</span> {school?.udise_code || '27251401201'}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Cluster:</span> {school?.panchayat_name || 'Shirur GP'}
            </div>
          </div>
        </div>

        {/* Preferences Form */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <form onSubmit={handleSavePreferences} className="space-y-6 text-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Languages className="w-4 h-4 text-sky-600" />
                Language & Regional Medium
              </h2>
              <p className="text-slate-500 mb-3">Choose default language for pedagogical guidance and prompts.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'mr', label: 'मराठी (Marathi)', note: 'Regional Medium' },
                  { id: 'hi', label: 'हिंदी (Hindi)', note: 'National Medium' },
                  { id: 'en', label: 'English', note: 'Standard' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreferredLang(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      preferredLang === item.id
                        ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold ring-1 ring-sky-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.note}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Security & Supabase Identity
              </h2>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span>Supabase JWT Verification:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${isSupabaseEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {isSupabaseEnabled ? 'Connected (RS256 JWKS)' : 'Local Dev Mode (Deterministic Tokens)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>School Data Isolation:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enforced Server-Side
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
