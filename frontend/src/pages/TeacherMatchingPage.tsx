import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { Student, MatchResponse, MatchCandidate, TeacherAssignment } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge } from '../components/common/Badge'
import { Modal } from '../components/common/Modal'
import { EmptyState } from '../components/common/EmptyState'
import { TableSkeleton } from '../components/common/Skeleton'
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Users,
  BookOpen,
  Languages,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  Trash2,
} from 'lucide-react'

export const TeacherMatchingPage: React.FC = () => {
  const { user } = useAuth()
  const { success, error: toastError, warning } = useToast()
  const [searchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<'studio' | 'assignments'>('studio')
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  // Matching studio state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(searchParams.get('student_id') || '')
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics')
  const [supportHours, setSupportHours] = useState<number>(2)
  const [matchResults, setMatchResults] = useState<MatchResponse | null>(null)
  const [matchingInProgress, setMatchingInProgress] = useState(false)

  // Assignments roster state
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)

  // Rejection Dialog Modal
  const [rejectingCandidate, setRejectingCandidate] = useState<MatchCandidate | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true)
        const data = await api.listStudents({ active_only: true })
        setStudents(data)
        if (!selectedStudentId && data.length > 0) {
          setSelectedStudentId(data[0].id)
        }
      } catch (err: any) {
        toastError(err.message || 'Failed to load students list')
      } finally {
        setLoadingStudents(false)
      }
    }
    fetchStudents()
  }, [])

  const loadAssignments = async () => {
    try {
      setLoadingAssignments(true)
      const data = await api.listAssignments()
      setAssignments(data)
    } catch (err: any) {
      toastError(err.message || 'Failed to load assignments')
    } finally {
      setLoadingAssignments(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'assignments') {
      loadAssignments()
    }
  }, [activeTab])

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) {
      warning('Please select a student first')
      return
    }

    setMatchingInProgress(true)
    try {
      const response = await api.getMatchRecommendations(
        selectedStudentId,
        selectedSubject,
        supportHours,
        5
      )
      setMatchResults(response)
      success(`Generated ${response.candidates.length} explainable recommendations!`)
    } catch (err: any) {
      toastError(err.message || 'Failed to generate recommendations')
    } finally {
      setMatchingInProgress(false)
    }
  }

  const handleApprove = async (assignmentId: string) => {
    try {
      await api.approveAssignment(assignmentId)
      success('Recommendation approved! Official assignment recorded.')
      if (matchResults) {
        setMatchResults({
          ...matchResults,
          candidates: matchResults.candidates.map((c) =>
            c.assignment_id === assignmentId ? { ...c, isApproved: true } : c
          ) as any,
        })
      }
    } catch (err: any) {
      toastError(err.message || 'Approval failed')
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingCandidate) return
    try {
      await api.rejectAssignment(rejectingCandidate.assignment_id, rejectionReason)
      success('Recommendation marked as rejected.')
      setRejectingCandidate(null)
      setRejectionReason('')
      if (matchResults) {
        setMatchResults({
          ...matchResults,
          candidates: matchResults.candidates.filter(
            (c) => c.assignment_id !== rejectingCandidate.assignment_id
          ),
        })
      }
    } catch (err: any) {
      toastError(err.message || 'Rejection failed')
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to reverse this teacher assignment?')) return
    try {
      await api.deleteAssignment(assignmentId)
      success('Assignment successfully reversed.')
      loadAssignments()
    } catch (err: any) {
      toastError(err.message || 'Failed to delete assignment')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Explainable Rural Education Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Teacher Matching Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fair, explainable educator recommendations based on verified subject fit, regional language, workload bandwidth, and experience.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'bg-white text-sky-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Matching Studio
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'assignments'
                ? 'bg-white text-sky-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-600" />
            Approved Roster
          </button>
        </div>
      </div>

      {activeTab === 'studio' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Match Configuration Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              1. Select Student & Subject
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Choose the student and specific remedial or enrichment subject.
            </p>

            <form onSubmit={handleRunMatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student *</label>
                {loadingStudents ? (
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.display_name} (Class {st.grade_level}th • {st.preferred_language})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Subject *</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="Mathematics">Mathematics (गणित)</option>
                  <option value="Science">Science (विज्ञान / परिसर अभ्यास)</option>
                  <option value="Marathi">Marathi (मराठी भाषा)</option>
                  <option value="English">English (इंग्रजी)</option>
                  <option value="Social Science">Social Science (सामाजिक शास्त्रे)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Required Support Hours / Week
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={supportHours}
                    onChange={(e) => setSupportHours(Number(e.target.value))}
                    className="flex-1 accent-sky-600"
                  />
                  <span className="font-bold text-slate-900 px-3 py-1 bg-slate-100 rounded-lg text-xs">
                    {supportHours} hrs/wk
                  </span>
                </div>
              </div>

              {/* Engine Factors Preview */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 mb-1">Scoring Criteria Weighting:</div>
                <div className="flex justify-between">
                  <span>Subject Match:</span>
                  <span className="font-bold text-slate-900">40%</span>
                </div>
                <div className="flex justify-between">
                  <span>Language Alignment:</span>
                  <span className="font-bold text-slate-900">25%</span>
                </div>
                <div className="flex justify-between">
                  <span>Workload & Capacity:</span>
                  <span className="font-bold text-slate-900">15%</span>
                </div>
                <div className="flex justify-between">
                  <span>Teaching Experience:</span>
                  <span className="font-bold text-slate-900">10%</span>
                </div>
                <div className="flex justify-between">
                  <span>Recorded Efficacy Index:</span>
                  <span className="font-bold text-slate-900">10%</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={matchingInProgress}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{matchingInProgress ? 'Analyzing Teacher Profiles...' : 'Run Explainable Match'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Ranked Candidate Results */}
          <div className="lg:col-span-2 space-y-4">
            {!matchResults ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100 shadow-sm">
                  <Sparkles className="w-8 h-8 text-sky-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Ready to Match</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Select a student and subject on the left, then click "Run Explainable Match" to generate ranked teacher recommendations with transparent pedagogical factor breakdowns.
                </p>
              </div>
            ) : matchResults.candidates.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-sm">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-900">No Suitable Candidates Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">{matchResults.note}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Summary Bar */}
                <div className="bg-sky-950 text-white p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-sky-200">
                      Recommendations for {matchResults.student_name}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Subject: <span className="font-semibold text-white">{matchResults.subject}</span> • Class {matchResults.student_grade}th • Medium: {matchResults.preferred_language}
                    </div>
                  </div>
                  <Badge variant="blue">{matchResults.candidates.length} Ranked</Badge>
                </div>

                {/* Candidate Cards */}
                {matchResults.candidates.map((cand, idx) => {
                  const isApproved = (cand as any).isApproved

                  return (
                    <div
                      key={cand.assignment_id}
                      className={`bg-white rounded-3xl border p-6 shadow-sm transition-all ${
                        idx === 0 ? 'border-sky-300 ring-2 ring-sky-500/10' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 font-extrabold flex items-center justify-center text-sm border border-sky-200">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900">{cand.teacher_name}</h3>
                              {idx === 0 && <Badge variant="green">Top Recommendation</Badge>}
                            </div>
                            <p className="text-xs text-slate-500">{cand.teacher_qualification || 'Verified Educator'}</p>
                          </div>
                        </div>

                        {/* Fit Score Badge */}
                        <div className="text-right">
                          <div className="text-2xl font-black text-sky-700 leading-none">
                            {cand.score}%
                          </div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                            Pedagogical Fit
                          </div>
                        </div>
                      </div>

                      {/* Factor Breakdown Bars */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Subject Fit</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {Math.round(cand.factors.subject_match * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Language Fit</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {Math.round(cand.factors.language_match * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Workload</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {cand.current_workload} / {cand.max_capacity}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Experience</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {Math.round(cand.factors.experience_score * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Efficacy</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {Math.round(cand.factors.effectiveness_score * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Explainable Reasons */}
                      <div className="space-y-1.5 mb-4">
                        <div className="text-xs font-bold text-slate-700">Rationale & Matching Factors:</div>
                        <ul className="space-y-1">
                          {cand.reasons.map((r, ri) => (
                            <li key={ri} className="text-xs text-slate-600 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Missing Data Warnings */}
                      {cand.missing_data_warnings && cand.missing_data_warnings.length > 0 && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 mb-4">
                          {cand.missing_data_warnings.map((w, wi) => (
                            <div key={wi} className="flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Decision Controls */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">
                          {isApproved ? (
                            <span className="font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved Assignment
                            </span>
                          ) : (
                            'Status: Proposed (Requires School Admin Approval)'
                          )}
                        </span>

                        {user?.role === 'school_admin' && !isApproved && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setRejectingCandidate(cand)}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleApprove(cand.assignment_id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve Match
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Approved & Active Assignments Roster Tab */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">School Teacher Assignments</h2>
              <p className="text-xs text-slate-500">Record of all approved, proposed, and resolved teacher assignments</p>
            </div>
            <button
              onClick={loadAssignments}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Refresh Roster
            </button>
          </div>

          {loadingAssignments ? (
            <TableSkeleton rows={5} cols={6} />
          ) : assignments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Assignments Recorded"
              description="No teacher assignments have been generated yet."
              actionLabel="Run Matching Studio"
              onAction={() => setActiveTab('studio')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Assigned Teacher</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Support Load</th>
                    <th className="p-3">Fit Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{a.student_name}</td>
                      <td className="p-3 font-semibold text-slate-700">{a.teacher_name}</td>
                      <td className="p-3">
                        <Badge variant="blue">{a.subject}</Badge>
                      </td>
                      <td className="p-3 text-slate-600">{a.support_hours_per_week} hrs/wk</td>
                      <td className="p-3 font-bold text-sky-700">{a.match_score}%</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            a.status === 'approved'
                              ? 'green'
                              : a.status === 'rejected'
                              ? 'red'
                              : 'amber'
                          }
                        >
                          {a.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {user?.role === 'school_admin' && (
                          <button
                            onClick={() => handleDeleteAssignment(a.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Reverse Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reject Assignment Modal Dialog */}
      <Modal
        isOpen={Boolean(rejectingCandidate)}
        onClose={() => setRejectingCandidate(null)}
        title="Decline Teacher Recommendation"
        subtitle={`Record administrative decision for ${rejectingCandidate?.teacher_name}.`}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Decision *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Teacher currently assigned to priority Class 10th board prep / Timetable conflict"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectingCandidate(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md"
            >
              Confirm Decline
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
