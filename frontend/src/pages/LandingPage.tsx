import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Sparkles,
  School,
  GraduationCap,
  Users,
  CheckCircle2,
  ArrowRight,
  Shield,
  Languages,
  BookOpen,
  Award,
  Zap,
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, loginAsDev } = useAuth()

  const handleQuickDemo = async (role: 'school_admin' | 'teacher') => {
    await loginAsDev(role)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-sky-500/25">
            G
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>GramShiksha</span>
              <span className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                AI
              </span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              Gram Panchayat Education Platform
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuickDemo('school_admin')}
                className="hidden sm:flex px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Instant Demo
              </button>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 transition-all"
              >
                Sign In / Login
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 sm:px-12 max-w-6xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/80 text-sky-300 text-xs font-semibold mb-8 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
          <span>Transforming Rural & Gram Panchayat Education Across India</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Explainable AI For Better Teaching & <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            Brighter Student Futures
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          A school improvement platform engineered specifically for Zilla Parishad and rural schools. Match student learning needs with the right teacher specializations, detect foundational gaps under NIPUN Bharat, and build personalized regional learning pathways.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => handleQuickDemo('school_admin')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-600/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
          >
            <span>Launch Headmaster Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleQuickDemo('teacher')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Launch Teacher View</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 shadow-lg hover:border-slate-600 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Explainable Teacher Matching</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Transparent, multi-factor recommendation engine considering subject expertise, regional language alignment, current teacher workload, and experience.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 shadow-lg hover:border-slate-600 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">NIPUN Bharat FLN Pathways</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track foundational literacy and numeracy gaps across subjects. Auto-generate remedial practice activities in Marathi, Hindi, and English.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 shadow-lg hover:border-slate-600 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">School Data Isolation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Role-based access control with cryptographic Supabase JWKS token verification and strict school-level boundaries ensuring student data privacy.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Authentic Rural Education Context */}
      <section className="bg-slate-950 py-20 border-t border-slate-800 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white">Designed for Indian Gram Panchayat Realities</h2>
            <p className="text-slate-400 text-sm mt-2">Built for multi-grade classrooms, regional language mediums, and transparent school governance.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-3xl font-black text-sky-400 mb-1">100%</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Explainable Scores</div>
              <p className="text-xs text-slate-500 mt-2">No black-box decisions. Transparent criteria for every teacher match.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-3xl font-black text-emerald-400 mb-1">मराठी / हिंदी</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Regional Mediums</div>
              <p className="text-xs text-slate-500 mt-2">Native support for regional languages in learning pathway suggestions.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-3xl font-black text-amber-400 mb-1">FLN Aligned</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">NIPUN Bharat Goals</div>
              <p className="text-xs text-slate-500 mt-2">Foundational Literacy & Numeracy milestone tracking.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-3xl font-black text-purple-400 mb-1">CSV Ready</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Instant Reports</div>
              <p className="text-xs text-slate-500 mt-2">Export student, teacher, and assessment records for official reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>GramShiksha AI — Empowering Rural & Gram Panchayat Schools</div>
          <div className="flex gap-6">
            <span>Security & Privacy First</span>
            <span>•</span>
            <span>NIPUN Bharat Baseline</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
