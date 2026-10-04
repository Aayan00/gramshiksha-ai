import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  School,
  ShieldCheck,
  GraduationCap,
  Users,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading, loginAsDev, loginWithSupabase, registerWithSupabase, isSupabaseEnabled } = useAuth()
  const { success, error: toastError } = useToast()

  const [mode, setMode] = useState<'quick' | 'supabase'>(isSupabaseEnabled ? 'supabase' : 'quick')
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, user, navigate])

  const handleQuickLogin = async (role: 'school_admin' | 'teacher' | 'staff') => {
    if (loading) return
    setLoading(true)
    try {
      await loginAsDev(role)
      success(`Logged in successfully as ${role === 'school_admin' ? 'Headmaster' : role === 'teacher' ? 'Teacher' : 'Staff'}`)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      toastError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      if (isRegister) {
        await registerWithSupabase(email, password, displayName)
        success('Registration successful! Please check your email to confirm or sign in.')
        setIsRegister(false)
      } else {
        await loginWithSupabase(email, password)
        success('Signed in successfully with Supabase!')
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      toastError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-sky-500 selection:text-white">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-2xl text-white mx-auto mb-3 shadow-xl shadow-sky-500/25">
          G
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">GramShiksha AI</h1>
        <p className="text-xs text-slate-400 mt-1">Rural School Intelligence & Teacher Matching Platform</p>
      </div>

      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'quick'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Quick Dev Login
          </button>
          <button
            type="button"
            onClick={() => setMode('supabase')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'supabase'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Supabase Auth
          </button>
        </div>

        {mode === 'quick' ? (
          <div>
            <div className="text-xs text-slate-300 mb-4 bg-sky-950/60 p-3.5 rounded-xl border border-sky-800/60 leading-relaxed">
              <span className="font-bold text-sky-400">Offline & Local Mode:</span> Select an authentic school persona to explore the platform with full role-based permissions.
            </div>

            <div className="space-y-3">
              <button
                disabled={loading}
                onClick={() => handleQuickLogin('school_admin')}
                className="w-full p-3.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/60 hover:border-sky-500 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-sky-300">
                      Headmaster (मुख्याध्यापक)
                    </div>
                    <div className="text-[11px] text-slate-400">Full administrative & matching approval access</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleQuickLogin('teacher')}
                className="w-full p-3.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/60 hover:border-emerald-500 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Teacher (शिक्षक)
                    </div>
                    <div className="text-[11px] text-slate-400">Manage assessments, students & learning pathways</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                disabled={loading}
                onClick={() => handleQuickLogin('staff')}
                className="w-full p-3.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/60 hover:border-blue-500 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">
                      Panchayat Education Officer / Staff
                    </div>
                    <div className="text-[11px] text-slate-400">View progress analytics & download reports</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSupabaseSubmit} className="space-y-4">
            {!isSupabaseEnabled && (
              <div className="text-xs text-amber-300 bg-amber-950/60 p-3 rounded-xl border border-amber-800/60 mb-2">
                Supabase URL & Anon Key are currently set to placeholders in .env. Configure them in production or use Quick Dev Login for local testing.
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Smt. Anita Shinde"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.gov.in"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : isRegister ? 'Create School Profile' : 'Sign In with Supabase'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register with school'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Back to landing */}
      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Return to Landing Page
        </button>
      </div>
    </div>
  )
}
