import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Teacher } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import { EmptyState } from '../components/common/EmptyState'
import { TableSkeleton } from '../components/common/Skeleton'
import {
  GraduationCap,
  Plus,
  Search,
  BookOpen,
  Languages,
  Award,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Mail,
  Phone,
} from 'lucide-react'

export const TeachersPage: React.FC = () => {
  const { user } = useAuth()
  const { success, error: toastError } = useToast()

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [langFilter, setLangFilter] = useState('')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    phone: '',
    qualification: '',
    subjects: 'Mathematics, Science',
    languages: 'Marathi, English',
    experience_years: 5,
    capacity: 30,
    available: true,
    effectiveness_score: 0.85,
  })

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const data = await api.listTeachers({
        search: search || undefined,
        subject: subjectFilter || undefined,
        language: langFilter || undefined,
      })
      setTeachers(data)
    } catch (err: any) {
      toastError(err.message || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeachers()
  }, [subjectFilter, langFilter])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const subjectsList = formData.subjects.split(',').map((s) => s.trim()).filter(Boolean)
      const languagesList = formData.languages.split(',').map((s) => s.trim()).filter(Boolean)

      const payload = {
        display_name: formData.display_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        qualification: formData.qualification || undefined,
        subjects: subjectsList,
        languages: languagesList,
        experience_years: Number(formData.experience_years),
        capacity: Number(formData.capacity),
        available: formData.available,
        effectiveness_score: formData.effectiveness_score ? Number(formData.effectiveness_score) : null,
      }

      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, payload)
        success('Teacher profile updated successfully!')
        setEditingTeacher(null)
      } else {
        await api.createTeacher(payload)
        success('New teacher onboarded successfully!')
        setIsAddOpen(false)
      }
      loadTeachers()
    } catch (err: any) {
      toastError(err.message || 'Failed to save teacher')
    }
  }

  const handleDelete = async (t: Teacher) => {
    if (!window.confirm(`Are you sure you want to deactivate ${t.display_name}?`)) return
    try {
      await api.deleteTeacher(t.id)
      success('Teacher deactivated')
      loadTeachers()
    } catch (err: any) {
      toastError(err.message || 'Failed to deactivate teacher')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Teacher Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage rural school educators, qualifications, subject competencies, and workload capacities.
          </p>
        </div>

        {user?.role === 'school_admin' && (
          <button
            onClick={() => {
              setFormData({
                display_name: '',
                email: '',
                phone: '',
                qualification: 'B.Sc, B.Ed',
                subjects: 'Mathematics, Science',
                languages: 'Marathi, Hindi, English',
                experience_years: 5,
                capacity: 30,
                available: true,
                effectiveness_score: 0.85,
              })
              setIsAddOpen(true)
            }}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Teacher</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={(e) => { e.preventDefault(); loadTeachers(); }} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by teacher name..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Marathi">Marathi</option>
            <option value="English">English</option>
            <option value="Social Science">Social Science</option>
          </select>

          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Mediums</option>
            <option value="Marathi">Marathi</option>
            <option value="Hindi">Hindi</option>
            <option value="English">English</option>
          </select>
        </div>
      </div>

      {/* Teacher Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-3xl p-6 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Teachers Found"
          description="There are no teachers matching your criteria."
          actionLabel="Onboard First Teacher"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md">
                      {t.display_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{t.display_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{t.qualification || 'Educator'}</p>
                    </div>
                  </div>

                  <Badge variant={t.available ? 'green' : 'amber'}>
                    {t.available ? 'Available' : 'Busy'}
                  </Badge>
                </div>

                {/* Subject & Language Badges */}
                <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {t.subjects?.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Languages className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {t.languages?.map((l, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Experience</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{t.experience_years} Yrs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Capacity</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {t.active_assignments_count || 0} / {t.capacity} slots
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Efficacy Index</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      {t.effectiveness_score ? `${intPercentage(t.effectiveness_score)}%` : 'Unrecorded'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Admins */}
              {user?.role === 'school_admin' && (
                <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingTeacher(t)
                      setFormData({
                        display_name: t.display_name,
                        email: t.email || '',
                        phone: t.phone || '',
                        qualification: t.qualification || '',
                        subjects: (t.subjects || []).join(', '),
                        languages: (t.languages || []).join(', '),
                        experience_years: t.experience_years,
                        capacity: t.capacity,
                        available: t.available,
                        effectiveness_score: t.effectiveness_score ?? 0.8,
                      })
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Deactivate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isAddOpen || Boolean(editingTeacher)}
        onClose={() => {
          setIsAddOpen(false)
          setEditingTeacher(null)
        }}
        title={editingTeacher ? 'Edit Teacher Profile' : 'Onboard New Educator'}
        subtitle="Manage teaching qualifications, subject specializations, and capacity limits."
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Teacher Full Name *</label>
            <input
              type="text"
              required
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g. Smt. Sunita Ananda Kadam"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sunita.kadam@school.org"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98220 12345"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Qualifications / Degrees</label>
            <input
              type="text"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              placeholder="e.g. B.Sc (Maths), B.Ed, D.El.Ed"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subjects Taught (comma separated) *</label>
            <input
              type="text"
              required
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              placeholder="Mathematics, Science, Marathi"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Languages (comma separated) *</label>
            <input
              type="text"
              required
              value={formData.languages}
              onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
              placeholder="Marathi, Hindi, English"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Experience (Yrs) *</label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Capacity *</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Efficacy Score (0-1)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={formData.effectiveness_score || ''}
                onChange={(e) => setFormData({ ...formData, effectiveness_score: e.target.value ? Number(e.target.value) : 0.5 })}
                placeholder="0.85"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded"
            />
            <label htmlFor="available" className="text-xs font-semibold text-slate-700">
              Available for new remedial & subject match assignments
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false)
                setEditingTeacher(null)
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
            >
              Save Teacher
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function intPercentage(val: number): number {
  return Math.round(val * 100)
}
