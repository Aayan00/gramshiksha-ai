import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Student, SchoolClass, StudentAnalytics } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import { EmptyState } from '../components/common/EmptyState'
import { TableSkeleton } from '../components/common/Skeleton'
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  BookOpen,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

export const StudentsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState<number | undefined>(undefined)
  const [langFilter, setLangFilter] = useState<string>('')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    grade_level: 5,
    preferred_language: 'Marathi',
    roll_number: '',
    class_id: '',
    learning_needs: '',
    guardian_contact: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsData, classesData] = await Promise.all([
        api.listStudents({
          search: search || undefined,
          grade_level: gradeFilter,
          language: langFilter || undefined,
        }),
        api.listClasses(),
      ])
      setStudents(studentsData)
      setClasses(classesData)
    } catch (err: any) {
      toastError(err.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [gradeFilter, langFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  const handleOpenAdd = () => {
    setFormData({
      display_name: '',
      grade_level: 5,
      preferred_language: 'Marathi',
      roll_number: '',
      class_id: classes[0]?.id || '',
      learning_needs: '',
      guardian_contact: '',
    })
    setIsAddOpen(true)
  }

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          ...formData,
          class_id: formData.class_id || undefined,
        })
        success('Student profile updated successfully!')
        setEditingStudent(null)
      } else {
        await api.createStudent({
          ...formData,
          class_id: formData.class_id || undefined,
        })
        success('New student added successfully!')
        setIsAddOpen(false)
      }
      loadData()
    } catch (err: any) {
      toastError(err.message || 'Failed to save student')
    }
  }

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to deactivate ${student.display_name}?`)) return
    try {
      await api.deleteStudent(student.id)
      success('Student deactivated')
      loadData()
    } catch (err: any) {
      toastError(err.message || 'Failed to deactivate student')
    }
  }

  const handleViewDetails = async (student: Student) => {
    setViewingStudent(student)
    setAnalyticsLoading(true)
    try {
      const data = await api.getStudentAnalytics(student.id)
      setStudentAnalytics(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student profiles, learning needs, and individual learning progress.
          </p>
        </div>

        {(user?.role === 'school_admin' || user?.role === 'teacher') && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        )}
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll number..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={gradeFilter || ''}
            onChange={(e) => setGradeFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>Class {g}th</option>
            ))}
          </select>

          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Mediums</option>
            <option value="Marathi">Marathi (मराठी)</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="English">English</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Students Found"
          description="There are no students matching your current search and filter criteria."
          actionLabel="Add First Student"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Roll #</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4">Medium</th>
                  <th className="py-3.5 px-4">Learning Needs / Focus</th>
                  <th className="py-3.5 px-4">Guardian Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {st.roll_number || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {st.display_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                        Class {st.grade_level}th
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="marathi">{st.preferred_language}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {st.learning_needs ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          {st.learning_needs}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None recorded</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {st.guardian_contact || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(st)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="View Student Profile & Analytics"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingStudent(st)
                            setFormData({
                              display_name: st.display_name,
                              grade_level: st.grade_level,
                              preferred_language: st.preferred_language,
                              roll_number: st.roll_number || '',
                              class_id: st.class_id || '',
                              learning_needs: st.learning_needs || '',
                              guardian_contact: st.guardian_contact || '',
                            })
                          }}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user?.role === 'school_admin' && (
                          <button
                            onClick={() => handleDelete(st)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Deactivate Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isAddOpen || Boolean(editingStudent)}
        onClose={() => {
          setIsAddOpen(false)
          setEditingStudent(null)
        }}
        title={editingStudent ? 'Edit Student Profile' : 'Add New Student'}
        subtitle="Record student details, grade level, and specific foundational learning needs."
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
            <input
              type="text"
              required
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g. Aarav Santosh Gaikwad"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grade Level *</label>
              <select
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>Class {g}th</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Roll Number</label>
              <input
                type="text"
                value={formData.roll_number}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                placeholder="e.g. 05"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preferred Language / Medium *</label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="English">English</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Section / Class</label>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="">Unassigned</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Learning Needs / Topics to Focus</label>
            <input
              type="text"
              value={formData.learning_needs}
              onChange={(e) => setFormData({ ...formData, learning_needs: e.target.value })}
              placeholder="e.g. Fractions arithmetic, English sight words"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Guardian Contact Phone</label>
            <input
              type="text"
              value={formData.guardian_contact}
              onChange={(e) => setFormData({ ...formData, guardian_contact: e.target.value })}
              placeholder="e.g. 9822012345"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false)
                setEditingStudent(null)
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
            >
              Save Student
            </button>
          </div>
        </form>
      </Modal>

      {/* View Student Profile & Learning Analytics Modal */}
      <Modal
        isOpen={Boolean(viewingStudent)}
        onClose={() => {
          setViewingStudent(null)
          setStudentAnalytics(null)
        }}
        maxWidth="3xl"
        title={viewingStudent?.display_name || 'Student Profile'}
        subtitle={`Class ${viewingStudent?.grade_level}th • Medium: ${viewingStudent?.preferred_language}`}
      >
        {analyticsLoading ? (
          <div className="space-y-4 py-4">
            <TableSkeleton rows={4} cols={4} />
          </div>
        ) : studentAnalytics ? (
          <div className="space-y-6 text-xs">
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl">
                <div className="text-[11px] text-sky-700 font-semibold uppercase tracking-wider">Assessment Average</div>
                <div className="text-2xl font-black text-sky-950 mt-1">{studentAnalytics.average_percentage}%</div>
                <div className="text-[10px] text-sky-600 mt-0.5">{studentAnalytics.total_assessments} tests recorded</div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider">Attendance</div>
                <div className="text-2xl font-black text-emerald-950 mt-1">{studentAnalytics.attendance_rate_pct}%</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Regular attendance record</div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="text-[11px] text-amber-800 font-semibold uppercase tracking-wider">Identified Gaps</div>
                <div className="text-2xl font-black text-amber-950 mt-1">{studentAnalytics.identified_gaps.length}</div>
                <div className="text-[10px] text-amber-700 mt-0.5">Needs remedial support</div>
              </div>
            </div>

            {/* AI Action CTA */}
            <div className="p-4 bg-gradient-to-r from-sky-800 to-indigo-800 text-white rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Assign Specialist Remedial Teacher</span>
                </div>
                <p className="text-[11px] text-sky-100/80 mt-0.5">
                  Use the explainable matching engine to find the best-fitting educator for {studentAnalytics.student_name}.
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingStudent(null)
                  navigate(`/matching?student_id=${studentAnalytics.student_id}`)
                }}
                className="px-4 py-2 bg-white text-sky-900 font-bold rounded-xl text-xs hover:bg-sky-50 shadow-md transition-all whitespace-nowrap"
              >
                Run Match Studio
              </button>
            </div>

            {/* Learning Gaps & Remedial Pathways */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Identified Foundational Learning Gaps (NIPUN Bharat)
              </h4>
              {studentAnalytics.identified_gaps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {studentAnalytics.identified_gaps.map((gap, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-medium rounded-lg text-xs"
                    >
                      {gap}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">No critical learning gaps flagged.</p>
              )}
            </div>

            {/* Assessment History Table */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 text-sm">Assessment History</h4>
              {studentAnalytics.recent_results.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b">
                      <tr>
                        <th className="p-2.5">Assessment</th>
                        <th className="p-2.5">Subject</th>
                        <th className="p-2.5">Marks</th>
                        <th className="p-2.5">Score</th>
                        <th className="p-2.5">Gap Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentAnalytics.recent_results.map((r) => (
                        <tr key={r.id}>
                          <td className="p-2.5 font-medium">{r.assessment_title}</td>
                          <td className="p-2.5">{r.subject}</td>
                          <td className="p-2.5">{r.marks_obtained} / {r.total_marks || 50}</td>
                          <td className="p-2.5 font-bold">{r.score_percentage}%</td>
                          <td className="p-2.5">
                            {r.is_learning_gap ? (
                              <Badge variant="amber">Gap Detected</Badge>
                            ) : (
                              <Badge variant="green">Passed</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 italic">No assessment history recorded yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
