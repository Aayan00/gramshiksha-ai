import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Assessment, Student, SchoolClass, LearningPathway, StudentAssessmentResult } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Modal } from '../components/common/Modal'
import { Badge } from '../components/common/Badge'
import { EmptyState } from '../components/common/EmptyState'
import { TableSkeleton } from '../components/common/Skeleton'
import {
  LineChart,
  BookOpen,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Languages,
  Clock,
  Layers,
} from 'lucide-react'

export const LearningAnalyticsPage: React.FC = () => {
  const { user } = useAuth()
  const { success, error: toastError } = useToast()

  const [activeTab, setActiveTab] = useState<'assessments' | 'pathways'>('assessments')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false)
  const [selectedAssessmentForMarks, setSelectedAssessmentForMarks] = useState<Assessment | null>(null)
  const [assessmentResults, setAssessmentResults] = useState<StudentAssessmentResult[]>([])
  const [marksEntries, setMarksEntries] = useState<Record<string, { marks: number; weak_topics: string; notes: string }>>({})

  // Pathway Generator State
  const [pathwayStudentId, setPathwayStudentId] = useState('')
  const [pathwaySubject, setPathwaySubject] = useState('Mathematics')
  const [generatedPlan, setGeneratedPlan] = useState<LearningPathway | null>(null)
  const [pathwayLoading, setPathwayLoading] = useState(false)
  const [savedPathways, setSavedPathways] = useState<LearningPathway[]>([])

  // Form State
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    subject: 'Mathematics',
    grade_level: 5,
    class_id: '',
    total_marks: 50,
    passing_marks: 17.5,
    competency_tag: 'FLN_MATH_L5',
    assessment_date: new Date().toISOString().split('T')[0],
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [asmData, stData, clsData] = await Promise.all([
        api.listAssessments(),
        api.listStudents({ active_only: true }),
        api.listClasses(),
      ])
      setAssessments(asmData)
      setStudents(stData)
      setClasses(clsData)
      if (stData.length > 0 && !pathwayStudentId) {
        setPathwayStudentId(stData[0].id)
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load assessments data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createAssessment({
        ...assessmentForm,
        class_id: assessmentForm.class_id || undefined,
      })
      success('Assessment created successfully!')
      setIsAddAssessmentOpen(false)
      loadData()
    } catch (err: any) {
      toastError(err.message || 'Failed to create assessment')
    }
  }

  const handleOpenMarksEntry = async (asm: Assessment) => {
    setSelectedAssessmentForMarks(asm)
    try {
      const existingResults = await api.listAssessmentResults(asm.id)
      setAssessmentResults(existingResults)

      const initialMap: Record<string, { marks: number; weak_topics: string; notes: string }> = {}
      // Filter students matching the grade
      const gradeStudents = students.filter((s) => s.grade_level === asm.grade_level)
      gradeStudents.forEach((st) => {
        const found = existingResults.find((r) => r.student_id === st.id)
        if (found) {
          initialMap[st.id] = {
            marks: found.marks_obtained,
            weak_topics: (found.weak_topics || []).join(', '),
            notes: found.teacher_notes || '',
          }
        } else {
          initialMap[st.id] = {
            marks: 35,
            weak_topics: '',
            notes: '',
          }
        }
      })
      setMarksEntries(initialMap)
    } catch (err: any) {
      toastError('Could not load marks')
    }
  }

  const handleSaveBatchMarks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssessmentForMarks) return
    try {
      const resultsPayload = Object.entries(marksEntries).map(([student_id, entry]) => ({
        student_id,
        marks_obtained: Number(entry.marks),
        weak_topics: entry.weak_topics.split(',').map((t) => t.trim()).filter(Boolean),
        teacher_notes: entry.notes || undefined,
      }))

      await api.recordAssessmentResults(selectedAssessmentForMarks.id, resultsPayload)
      success(`Marks and learning gap flags recorded for ${resultsPayload.length} students!`)
      setSelectedAssessmentForMarks(null)
      loadData()
    } catch (err: any) {
      toastError(err.message || 'Failed to record marks')
    }
  }

  const handleGeneratePathway = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pathwayStudentId) return
    setPathwayLoading(true)
    try {
      const created = await api.createStudentPathway(pathwayStudentId, {
        subject: pathwaySubject,
      })
      setGeneratedPlan(created)
      success('Generated NIPUN Bharat personalized learning pathway!')
      // Refresh pathways
      const currentList = await api.listStudentPathways(pathwayStudentId)
      setSavedPathways(currentList)
    } catch (err: any) {
      toastError(err.message || 'Failed to generate learning pathway')
    } finally {
      setPathwayLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>NIPUN Bharat FLN & Progress Tracking</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Learning Analytics & Remedial Pathways
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record unit assessments, detect foundational learning gaps, and auto-generate multilingual revision pathways.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'assessments'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-sky-600" />
            Unit Assessments
          </button>
          <button
            onClick={() => setActiveTab('pathways')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'pathways'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Remedial Pathway AI
          </button>
        </div>
      </div>

      {activeTab === 'assessments' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recorded Assessments</h2>
            {(user?.role === 'school_admin' || user?.role === 'teacher') && (
              <button
                onClick={() => setIsAddAssessmentOpen(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Assessment</span>
              </button>
            )}
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : assessments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Assessments Yet"
              description="Create your first unit test or foundational literacy assessment."
              actionLabel="Create Assessment"
              onAction={() => setIsAddAssessmentOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((asm) => (
                <div
                  key={asm.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge variant="blue">{asm.subject}</Badge>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        Class {asm.grade_level}th
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">{asm.title}</h3>
                    <p className="text-xs text-slate-500 mb-4">Date: {asm.assessment_date}</p>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center mb-4 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Marks</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{asm.total_marks}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Average Score</div>
                        <div className="text-xs font-bold text-sky-700 mt-0.5">
                          {asm.average_score ? `${asm.average_score}%` : 'Pending Entry'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenMarksEntry(asm)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-sky-50 text-slate-800 hover:text-sky-900 font-bold rounded-xl text-xs border border-slate-200 hover:border-sky-200 transition-all flex items-center justify-center gap-2"
                  >
                    <FileCheck className="w-4 h-4 text-sky-600" />
                    <span>Enter / View Student Marks</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Remedial Pathway Generator Studio */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generator Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Generate NIPUN Pathway
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Select a student to generate a structured remedial practice plan aligned with regional FLN competencies.
            </p>

            <form onSubmit={handleGeneratePathway} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student *</label>
                <select
                  value={pathwayStudentId}
                  onChange={(e) => setPathwayStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.display_name} (Class {st.grade_level}th • {st.preferred_language})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                <select
                  value={pathwaySubject}
                  onChange={(e) => setPathwaySubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="Mathematics">Mathematics (गणित)</option>
                  <option value="Science">Science (विज्ञान)</option>
                  <option value="English">English (इंग्रजी)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-[11px] text-emerald-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  NIPUN Bharat Pedagogical Heuristics
                </div>
                Analyzes recorded weak topics to formulate concrete hands-on activities with regional language instruction.
              </div>

              <button
                type="submit"
                disabled={pathwayLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{pathwayLoading ? 'Generating Plan...' : 'Generate Learning Pathway'}</span>
              </button>
            </form>
          </div>

          {/* Pathway Plan Display */}
          <div className="lg:col-span-2 space-y-4">
            {!generatedPlan ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
                <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Personalized Learning Generator</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Select a student and subject on the left to create concrete revision sequences and localized practice modules.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{generatedPlan.target_competency}</h3>
                      <Badge variant="green">{generatedPlan.current_level}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Subject: <span className="font-semibold text-slate-800">{generatedPlan.subject}</span> • Student: <span className="font-semibold text-slate-800">{generatedPlan.student_name}</span>
                    </p>
                  </div>
                  <Badge variant="blue">Status: Active</Badge>
                </div>

                {/* Recommended Topics */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Recommended Remedial Sequence:
                  </h4>
                  <div className="space-y-1.5">
                    {generatedPlan.recommended_topics.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practice Activities Cards */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Multi-lingual Practice Modules:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {generatedPlan.practice_activities.map((act, ai) => (
                      <div key={ai} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-slate-700 border">
                            {act.type}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {act.duration_minutes} min
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{act.title}</div>
                        {act.language_hint && (
                          <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-medium">
                            {act.language_hint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record / View Student Marks Modal */}
      <Modal
        isOpen={Boolean(selectedAssessmentForMarks)}
        onClose={() => setSelectedAssessmentForMarks(null)}
        maxWidth="3xl"
        title={`Record Marks — ${selectedAssessmentForMarks?.title}`}
        subtitle={`Class ${selectedAssessmentForMarks?.grade_level}th • Subject: ${selectedAssessmentForMarks?.subject} • Total Marks: ${selectedAssessmentForMarks?.total_marks}`}
      >
        <form onSubmit={handleSaveBatchMarks} className="space-y-4 text-xs">
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3 w-28">Marks (/{selectedAssessmentForMarks?.total_marks})</th>
                  <th className="p-3">Weak Topics (Comma-separated)</th>
                  <th className="p-3">Teacher Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students
                  .filter((s) => s.grade_level === selectedAssessmentForMarks?.grade_level)
                  .map((st) => {
                    const currentEntry = marksEntries[st.id] || { marks: 35, weak_topics: '', notes: '' }
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">{st.display_name}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={selectedAssessmentForMarks?.total_marks || 100}
                            value={currentEntry.marks}
                            onChange={(e) =>
                              setMarksEntries({
                                ...marksEntries,
                                [st.id]: { ...currentEntry, marks: Number(e.target.value) },
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-900 font-bold"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="e.g. Fraction Division, Decimals"
                            value={currentEntry.weak_topics}
                            onChange={(e) =>
                              setMarksEntries({
                                ...marksEntries,
                                [st.id]: { ...currentEntry, weak_topics: e.target.value },
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-900"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Optional notes"
                            value={currentEntry.notes}
                            onChange={(e) =>
                              setMarksEntries({
                                ...marksEntries,
                                [st.id]: { ...currentEntry, notes: e.target.value },
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-900"
                          />
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setSelectedAssessmentForMarks(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
            >
              Save Results & Flag Gaps
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Assessment Modal */}
      <Modal
        isOpen={isAddAssessmentOpen}
        onClose={() => setIsAddAssessmentOpen(false)}
        title="Create New Unit Assessment"
        subtitle="Set up a unit test or foundational assessment for classroom evaluation."
      >
        <form onSubmit={handleCreateAssessment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assessment Title *</label>
            <input
              type="text"
              required
              value={assessmentForm.title}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
              placeholder="e.g. Unit 2: Basic Geometry & Angles"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
              <select
                value={assessmentForm.subject}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, subject: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="Marathi">Marathi</option>
                <option value="English">English</option>
                <option value="Social Science">Social Science</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grade Level *</label>
              <select
                value={assessmentForm.grade_level}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, grade_level: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>Class {g}th</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Marks *</label>
              <input
                type="number"
                min="5"
                max="100"
                value={assessmentForm.total_marks}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, total_marks: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Passing Marks *</label>
              <input
                type="number"
                min="0"
                max="100"
                value={assessmentForm.passing_marks}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, passing_marks: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsAddAssessmentOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20"
            >
              Create Assessment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
