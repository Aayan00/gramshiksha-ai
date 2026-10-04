import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../services/api'
import { SchoolOverviewStats, TeacherAssignment } from '../types'
import { StatCard } from '../components/common/StatCard'
import { Badge } from '../components/common/Badge'
import { Skeleton } from '../components/common/Skeleton'
import {
  Users,
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  School,
  Plus,
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { user, school } = useAuth()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [stats, setStats] = useState<SchoolOverviewStats | null>(null)
  const [pendingAssignments, setPendingAssignments] = useState<TeacherAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [overviewData, assignmentsData] = await Promise.all([
        api.getSchoolOverview(),
        api.listAssignments({ status_filter: 'proposed' }),
      ])
      setStats(overviewData)
      setPendingAssignments(assignmentsData)
    } catch (err: any) {
      toastError(err.message || 'Failed to load school overview statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleQuickApprove = async (assignmentId: string) => {
    try {
      await api.approveAssignment(assignmentId)
      success('AI Teacher assignment approved successfully!')
      fetchDashboardData()
    } catch (err: any) {
      toastError(err.message || 'Could not approve assignment')
    }
  }

  const studentTeacherRatio =
    stats && stats.total_teachers > 0
      ? (stats.total_students / stats.total_teachers).toFixed(1)
      : '0'

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-sky-100 mb-3 border border-white/20">
            <School className="w-3.5 h-3.5 text-sky-300" />
            <span>{school?.name || 'Zilla Parishad Primary School'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Namaskar, {user?.display_name}!
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/80 mt-1 max-w-xl leading-relaxed">
            {user?.role === 'school_admin'
              ? 'Headmaster dashboard: Overview of rural classroom health, teacher matching, and NIPUN Bharat learning gaps.'
              : 'Teacher workspace: Track student progress, assessments, and personalized learning pathways.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/matching"
            className="px-4 py-2.5 bg-white hover:bg-sky-50 text-sky-900 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>AI Teacher Matching</span>
          </Link>
          <Link
            to="/attendance"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-300" />
            <span>Take Attendance</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Enrolled Students"
            value={stats?.total_students || 0}
            subtitle={`${stats?.total_classes || 0} active classes / sections`}
            icon={<Users className="w-5 h-5" />}
            variant="blue"
            badge="Active"
          />
          <StatCard
            title="Teaching Staff"
            value={stats?.total_teachers || 0}
            subtitle={`Student-Teacher ratio: ${studentTeacherRatio}:1`}
            icon={<GraduationCap className="w-5 h-5" />}
            variant="purple"
            badge={`${stats?.active_assignments || 0} Matches`}
          />
          <StatCard
            title="Attendance Rate"
            value={`${stats?.average_school_attendance_pct || 0}%`}
            subtitle="Current academic session"
            icon={<CalendarCheck className="w-5 h-5" />}
            variant="emerald"
            badge={stats && stats.average_school_attendance_pct >= 85 ? 'Healthy' : 'Needs Review'}
          />
          <StatCard
            title="Learning Gap Alerts"
            value={stats?.learning_gap_students_count || 0}
            subtitle="NIPUN Bharat FLN flagged students"
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="amber"
            badge="Action Required"
          />
        </div>
      )}

      {/* Main Grid: Pending AI Approvals & Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): AI Recommendations & Subject Health */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending AI Recommendations Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Pending AI Teacher Matches</h2>
                  <p className="text-xs text-slate-500">Awaiting administrator approval before teacher assignment</p>
                </div>
              </div>
              <Link to="/matching" className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1">
                View Studio <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingAssignments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-800">All matching decisions are up to date</div>
                <p className="text-xs text-slate-500 mt-0.5">No pending proposed matches waiting for review.</p>
                <Link
                  to="/matching"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New AI Match
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAssignments.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition-all gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{a.student_name}</span>
                        <Badge variant="blue">{a.subject}</Badge>
                        <Badge variant="amber">Fit: {a.match_score}%</Badge>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Recommended Teacher: <span className="font-semibold text-slate-900">{a.teacher_name}</span> ({a.support_hours_per_week} hrs/wk)
                      </div>
                      {a.explanation?.reasons && a.explanation.reasons.length > 0 && (
                        <div className="text-[11px] text-slate-500 mt-0.5 italic">
                          "{a.explanation.reasons[0]}"
                        </div>
                      )}
                    </div>

                    {user?.role === 'school_admin' ? (
                      <button
                        onClick={() => handleQuickApprove(a.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Match
                      </button>
                    ) : (
                      <span className="text-[11px] text-amber-700 font-medium">Pending Headmaster Review</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject Health & Competencies */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200 font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Subject Health & Assessment Averages</h2>
                  <p className="text-xs text-slate-500">Aggregated scores and learning gap percentages across subjects</p>
                </div>
              </div>
              <Link to="/analytics" className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1">
                Deep Analytics <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats?.subjects_health && stats.subjects_health.length > 0 ? (
              <div className="space-y-4">
                {stats.subjects_health.map((sh) => (
                  <div key={sh.subject} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{sh.subject}</span>
                        <span className="text-[11px] text-slate-500">({sh.students_assessed} students tested)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900">Avg: {sh.average_score}%</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sh.gap_rate_pct > 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {sh.gap_rate_pct}% Gaps
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sh.average_score >= 70 ? 'bg-emerald-500' : sh.average_score >= 50 ? 'bg-sky-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, sh.average_score)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                No assessments recorded yet. Go to <Link to="/analytics" className="text-sky-600 underline font-semibold">Assessments</Link> to create unit tests.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Recent Assessments */}
        <div className="space-y-8">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider text-slate-500 text-[11px]">
              Quick School Actions
            </h2>
            <div className="space-y-2.5">
              <Link
                to="/matching"
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-900 border border-slate-200 hover:border-sky-200 transition-all flex items-center gap-3 text-xs font-semibold group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Run Teacher Matching</span>
              </Link>
              <Link
                to="/students"
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-200 transition-all flex items-center gap-3 text-xs font-semibold group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span>Manage Student Roster</span>
              </Link>
              <Link
                to="/analytics"
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-800 hover:text-purple-900 border border-slate-200 hover:border-purple-200 transition-all flex items-center gap-3 text-xs font-semibold group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Record Unit Assessment</span>
              </Link>
              <Link
                to="/reports"
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-200 transition-all flex items-center gap-3 text-xs font-semibold group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span>Download Official CSV Reports</span>
              </Link>
            </div>
          </div>

          {/* Recent Assessments Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Recent Assessments</h2>
              <Link to="/analytics" className="text-xs text-sky-600 hover:underline">View all</Link>
            </div>

            <div className="space-y-3">
              {stats?.recent_assessments && stats.recent_assessments.length > 0 ? (
                stats.recent_assessments.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                    <div className="font-bold text-slate-900 truncate">{a.title}</div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mt-1">
                      <span>Grade {a.grade_level} • {a.subject}</span>
                      <span className="font-semibold text-slate-700">{a.average_score ? `Avg: ${a.average_score}%` : 'Pending'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">No assessments yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
