import {
  School,
  UserProfile,
  SchoolClass,
  Student,
  Teacher,
  MatchResponse,
  TeacherAssignment,
  Assessment,
  StudentAssessmentResult,
  AttendanceRecord,
  LearningPathway,
  SchoolOverviewStats,
  StudentAnalytics,
  AuditEvent,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

let currentToken: string | null = localStorage.getItem('gramshiksha_auth_token') || 'dev-school_admin'

export const setAuthToken = (token: string | null) => {
  currentToken = token
  if (token) {
    localStorage.setItem('gramshiksha_auth_token', token)
  } else {
    localStorage.removeItem('gramshiksha_auth_token')
  }
}

export const getAuthToken = () => currentToken

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  
  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorDetail = 'An error occurred'
    try {
      const errJson = await response.json()
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson)
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`
    }
    throw new Error(errorDetail)
  }

  return response.json()
}

export const api = {
  // Identity & Me
  getMe: () => request<{ id: string; school_id: string; role: string; display_name: string; email: string | null; school: School | null }>('/me'),

  // School Administration
  getSchool: () => request<School>('/school'),
  updateSchool: (data: Partial<School>) => request<School>('/school', { method: 'PATCH', body: JSON.stringify(data) }),
  listSchoolUsers: () => request<UserProfile[]>('/school/users'),
  createSchoolUser: (data: { role: string; display_name: string; email?: string; phone?: string }) =>
    request<UserProfile>('/school/users', { method: 'POST', body: JSON.stringify(data) }),
  listClasses: () => request<SchoolClass[]>('/school/classes'),
  createClass: (data: Partial<SchoolClass>) => request<SchoolClass>('/school/classes', { method: 'POST', body: JSON.stringify(data) }),
  listAuditLogs: () => request<AuditEvent[]>('/school/audit-logs'),

  // Students
  listStudents: (params?: { search?: string; grade_level?: number; class_id?: string; language?: string; active_only?: boolean }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.grade_level) q.set('grade_level', String(params.grade_level))
    if (params?.class_id) q.set('class_id', params.class_id)
    if (params?.language) q.set('language', params.language)
    if (params?.active_only !== undefined) q.set('active_only', String(params.active_only))
    return request<Student[]>(`/students?${q.toString()}`)
  },
  getStudent: (id: string) => request<Student>(`/students/${id}`),
  createStudent: (data: Partial<Student>) => request<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: string, data: Partial<Student>) => request<Student>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteStudent: (id: string) => request<{ message: string; id: string }>(`/students/${id}`, { method: 'DELETE' }),

  // Teachers
  listTeachers: (params?: { subject?: string; language?: string; available_only?: boolean; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.subject) q.set('subject', params.subject)
    if (params?.language) q.set('language', params.language)
    if (params?.available_only !== undefined) q.set('available_only', String(params.available_only))
    if (params?.search) q.set('search', params.search)
    return request<Teacher[]>(`/teachers?${q.toString()}`)
  },
  getTeacher: (id: string) => request<Teacher>(`/teachers/${id}`),
  createTeacher: (data: Partial<Teacher>) => request<Teacher>('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (id: string, data: Partial<Teacher>) => request<Teacher>(`/teachers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTeacher: (id: string) => request<{ message: string; id: string }>(`/teachers/${id}`, { method: 'DELETE' }),

  // AI Matching & Assignments
  getMatchRecommendations: (student_id: string, subject: string, support_hours_per_week: number = 2, limit: number = 5) =>
    request<MatchResponse>('/matching/recommendations', {
      method: 'POST',
      body: JSON.stringify({ student_id, subject, support_hours_per_week, limit }),
    }),
  listAssignments: (params?: { status_filter?: string; student_id?: string; teacher_id?: string }) => {
    const q = new URLSearchParams()
    if (params?.status_filter) q.set('status_filter', params.status_filter)
    if (params?.student_id) q.set('student_id', params.student_id)
    if (params?.teacher_id) q.set('teacher_id', params.teacher_id)
    return request<TeacherAssignment[]>(`/assignments?${q.toString()}`)
  },
  approveAssignment: (id: string) => request<TeacherAssignment>(`/assignments/${id}/approve`, { method: 'POST' }),
  rejectAssignment: (id: string, rejection_reason?: string) =>
    request<TeacherAssignment>(`/assignments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason }),
    }),
  deleteAssignment: (id: string) => request<{ message: string; id: string }>(`/assignments/${id}`, { method: 'DELETE' }),

  // Assessments & Analytics
  listAssessments: (params?: { grade_level?: number; subject?: string }) => {
    const q = new URLSearchParams()
    if (params?.grade_level) q.set('grade_level', String(params.grade_level))
    if (params?.subject) q.set('subject', params.subject)
    return request<Assessment[]>(`/assessments?${q.toString()}`)
  },
  getAssessment: (id: string) => request<Assessment>(`/assessments/${id}`),
  createAssessment: (data: Partial<Assessment>) => request<Assessment>('/assessments', { method: 'POST', body: JSON.stringify(data) }),
  recordAssessmentResults: (id: string, results: Array<{ student_id: string; marks_obtained: number; weak_topics?: string[]; teacher_notes?: string }>) =>
    request<{ message: string }>(`/assessments/${id}/results`, {
      method: 'POST',
      body: JSON.stringify({ results }),
    }),
  listAssessmentResults: (id: string) => request<StudentAssessmentResult[]>(`/assessments/${id}/results`),

  // Student Analytics & Pathways
  getStudentAnalytics: (studentId: string) => request<StudentAnalytics>(`/students/${studentId}/analytics`),
  createStudentPathway: (studentId: string, data: { subject: string; target_competency?: string; identified_gaps?: string[] }) =>
    request<LearningPathway>(`/students/${studentId}/pathways`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, ...data }),
    }),
  listStudentPathways: (studentId: string) => request<LearningPathway[]>(`/students/${studentId}/pathways`),
  getSchoolOverview: () => request<SchoolOverviewStats>('/analytics/school-overview'),

  // Attendance
  recordBatchAttendance: (data: { class_id?: string; attendance_date?: string; records: Array<{ student_id: string; status: string; remarks?: string }> }) =>
    request<{ message: string }>('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listAttendance: (params?: { attendance_date?: string; class_id?: string; student_id?: string }) => {
    const q = new URLSearchParams()
    if (params?.attendance_date) q.set('attendance_date', params.attendance_date)
    if (params?.class_id) q.set('class_id', params.class_id)
    if (params?.student_id) q.set('student_id', params.student_id)
    return request<AttendanceRecord[]>(`/attendance?${q.toString()}`)
  },

  // Reports Export URL
  getReportUrl: (type: 'students' | 'teachers' | 'assessments' | 'matching-summary') => `${API_BASE}/reports/${type}.csv`,
}
