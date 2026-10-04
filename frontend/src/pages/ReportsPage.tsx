import React, { useState } from 'react'
import { api, getAuthToken } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  FileSpreadsheet,
  Download,
  Users,
  GraduationCap,
  BookOpen,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

export const ReportsPage: React.FC = () => {
  const { user } = useAuth()
  const { success, error: toastError } = useToast()
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (type: 'students' | 'teachers' | 'assessments' | 'matching-summary', filename: string) => {
    setDownloading(type)
    try {
      const token = getAuthToken()
      const url = api.getReportUrl(type)
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!res.ok) {
        throw new Error(`Failed to download report (${res.statusText})`)
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
      success(`Downloaded ${filename} successfully!`)
    } catch (err: any) {
      toastError(err.message || 'Report download failed')
    } finally {
      setDownloading(null)
    }
  }

  const reportsList = [
    {
      id: 'students',
      type: 'students' as const,
      filename: `students_roster_${new Date().toISOString().split('T')[0]}.csv`,
      title: 'Student Enrollment & Learning Needs Roster',
      marathi: 'विद्यार्थी यादी व शिकण्याच्या गरजा अहवाल',
      description: 'Complete student profiles, roll numbers, grade levels, preferred medium of instruction, and recorded learning focus areas.',
      icon: Users,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'teachers',
      type: 'teachers' as const,
      filename: `teachers_summary_${new Date().toISOString().split('T')[0]}.csv`,
      title: 'Teaching Staff & Specializations Summary',
      marathi: 'शिक्षक माहिती व विषय तज्ञता अहवाल',
      description: 'Educator credentials, teaching qualifications, subject specializations, regional language fluency, and available workload slots.',
      icon: GraduationCap,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      adminOnly: true,
    },
    {
      id: 'assessments',
      type: 'assessments' as const,
      filename: `assessment_results_${new Date().toISOString().split('T')[0]}.csv`,
      title: 'Unit Assessment & Learning Gap Results',
      marathi: 'मूल्यमापन निकाल व अध्ययन त्रुटी अहवाल',
      description: 'Detailed assessment marks, percentage scores, NIPUN Bharat learning gap flags, identified weak topics, and teacher feedback notes.',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'matching-summary',
      type: 'matching-summary' as const,
      filename: `teacher_matching_ledger_${new Date().toISOString().split('T')[0]}.csv`,
      title: 'AI Teacher Matching Decisions Ledger',
      marathi: 'शिक्षक जुळणी निर्णय व शिफारस अहवाल',
      description: 'Audit record of all proposed and approved teacher matches, explainable fit scores, support hours, and administrator approval dates.',
      icon: Sparkles,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      adminOnly: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Official Reports & Exports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate and download verifiable CSV data reports for Gram Panchayat review, block education officers, and school records.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportsList.map((rep) => {
          const isRestricted = rep.adminOnly && user?.role !== 'school_admin'
          const Icon = rep.icon

          return (
            <div
              key={rep.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${rep.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                    .CSV Format
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-tight mb-0.5">{rep.title}</h3>
                <p className="text-xs text-slate-400 font-medium mb-3">{rep.marathi}</p>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">{rep.description}</p>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Standard RFC-4180 CSV</span>

                {isRestricted ? (
                  <span className="text-xs text-slate-400 italic">Headmaster Permission Required</span>
                ) : (
                  <button
                    disabled={downloading === rep.type}
                    onClick={() => handleDownload(rep.type, rep.filename)}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloading === rep.type ? 'Preparing...' : 'Download CSV'}</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
