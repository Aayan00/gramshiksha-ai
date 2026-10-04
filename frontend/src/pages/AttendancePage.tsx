import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Student, SchoolClass, AttendanceRecord } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge } from '../components/common/Badge'
import { TableSkeleton } from '../components/common/Skeleton'
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Users,
} from 'lucide-react'

export const AttendancePage: React.FC = () => {
  const { user } = useAuth()
  const { success, error: toastError } = useToast()

  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedGrade, setSelectedGrade] = useState<number | undefined>(undefined)
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: 'present' | 'absent' | 'excused' | 'late'; remarks: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsData, recordsData] = await Promise.all([
        api.listStudents({ grade_level: selectedGrade, active_only: true }),
        api.listAttendance({ attendance_date: dateStr }),
      ])
      setStudents(studentsData)

      const map: Record<string, { status: 'present' | 'absent' | 'excused' | 'late'; remarks: string }> = {}
      studentsData.forEach((st) => {
        const found = recordsData.find((r) => r.student_id === st.id)
        if (found) {
          map[st.id] = { status: found.status, remarks: found.remarks || '' }
        } else {
          map[st.id] = { status: 'present', remarks: '' }
        }
      })
      setAttendanceMap(map)
    } catch (err: any) {
      toastError(err.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateStr, selectedGrade])

  const handleMarkAll = (status: 'present' | 'absent') => {
    const updated = { ...attendanceMap }
    students.forEach((st) => {
      updated[st.id] = { ...updated[st.id], status }
    })
    setAttendanceMap(updated)
    success(`Marked all ${students.length} students as ${status}.`)
  }

  const handleSaveAttendance = async () => {
    setSaving(true)
    try {
      const records = Object.entries(attendanceMap).map(([student_id, item]) => ({
        student_id,
        status: item.status,
        remarks: item.remarks || undefined,
      }))

      await api.recordBatchAttendance({
        attendance_date: dateStr,
        records,
      })
      success(`Saved attendance record for ${records.length} students on ${dateStr}!`)
    } catch (err: any) {
      toastError(err.message || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Object.values(attendanceMap).filter((a) => a.status === 'present').length
  const absentCount = Object.values(attendanceMap).filter((a) => a.status === 'absent').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Classroom Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily roll-call tracking for rural schools with automatic attendance rate calculations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleMarkAll('present')}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
          >
            Mark All Present
          </button>
          <button
            disabled={saving}
            onClick={handleSaveAttendance}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Date:</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Class:</label>
            <select
              value={selectedGrade || ''}
              onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="">All Classes</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>Class {g}th</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-500">Summary:</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            {presentCount} Present
          </span>
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 font-bold border border-rose-200">
            {absentCount} Absent
          </span>
        </div>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : students.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No students found for the selected filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Roll #</th>
                <th className="py-3 px-4">Student Full Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4">Remarks / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st) => {
                const cur = attendanceMap[st.id] || { status: 'present', remarks: '' }

                return (
                  <tr key={st.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      {st.roll_number || '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{st.display_name}</td>
                    <td className="py-3 px-4">Class {st.grade_level}th</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {(['present', 'absent', 'excused', 'late'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setAttendanceMap({
                                ...attendanceMap,
                                [st.id]: { ...cur, status: s },
                              })
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                              cur.status === s
                                ? s === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : s === 'absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : s === 'excused'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-sky-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={cur.remarks}
                        onChange={(e) =>
                          setAttendanceMap({
                            ...attendanceMap,
                            [st.id]: { ...cur, remarks: e.target.value },
                          })
                        }
                        placeholder="Optional remarks (e.g. medical leave)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
