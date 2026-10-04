import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { SchoolClass, Student } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import { EmptyState } from '../components/common/EmptyState'
import { TableSkeleton } from '../components/common/Skeleton'
import {
  School,
  Plus,
  Users,
  BookOpen,
  MapPin,
  Calendar,
} from 'lucide-react'

export const ClassesPage: React.FC = () => {
  const { user } = useAuth()
  const { success, error: toastError } = useToast()

  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    grade_level: 5,
    section: 'A',
    medium_of_instruction: 'Marathi',
    academic_year: '2024-2025',
    room_number: 'Room 101',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [classesData, studentsData] = await Promise.all([
        api.listClasses(),
        api.listStudents({ active_only: true }),
      ])
      setClasses(classesData)
      setStudents(studentsData)
    } catch (err: any) {
      toastError(err.message || 'Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createClass(form)
      success('Class section created successfully!')
      setIsAddOpen(false)
      loadData()
    } catch (err: any) {
      toastError(err.message || 'Failed to create class')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Classes & Divisions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage rural school classrooms, divisions, medium of instruction, and student enrollments.
          </p>
        </div>

        {user?.role === 'school_admin' && (
          <button
            onClick={() => {
              setForm({
                name: `Class 5th (A)`,
                grade_level: 5,
                section: 'A',
                medium_of_instruction: 'Marathi',
                academic_year: '2024-2025',
                room_number: 'Room 103',
              })
              setIsAddOpen(true)
            }}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Section</span>
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={School}
          title="No Classes Setup Yet"
          description="Create grade divisions and classrooms for your school."
          actionLabel="Create First Class"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const classStudents = students.filter((s) => s.class_id === cls.id || (!s.class_id && s.grade_level === cls.grade_level))

            return (
              <div
                key={cls.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-sky-50 text-sky-800 font-bold rounded-lg text-xs border border-sky-200">
                      Grade {cls.grade_level}th • Section {cls.section}
                    </span>
                    <Badge variant="marathi">{cls.medium_of_instruction}</Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-tight mb-1">{cls.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {cls.room_number || 'Main Wing'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {cls.academic_year}
                    </span>
                  </div>

                  {/* Enrollment Count */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-600" />
                      <span className="text-xs font-semibold text-slate-700">Enrolled Students</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900">{classStudents.length}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 border-t pt-3 flex justify-between">
                  <span>Class ID: {cls.id.substring(0, 8)}...</span>
                  <span className="text-emerald-600 font-semibold">Active Session</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Class Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Class & Division"
        subtitle="Configure grade level, medium of instruction, and classroom details."
      >
        <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class Display Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Class 5th (A)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grade Level *</label>
              <select
                value={form.grade_level}
                onChange={(e) => setForm({ ...form, grade_level: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>Class {g}th</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Section / Division *</label>
              <input
                type="text"
                required
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                placeholder="A / B / C"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medium of Instruction *</label>
              <select
                value={form.medium_of_instruction}
                onChange={(e) => setForm({ ...form, medium_of_instruction: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Semi-English">Semi-English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="English">English</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room / Wing</label>
              <input
                type="text"
                value={form.room_number}
                onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                placeholder="Room 101"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
            >
              Create Class
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
