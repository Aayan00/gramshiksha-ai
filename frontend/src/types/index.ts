export interface School {
  id: string;
  name: string;
  udise_code: string | null;
  panchayat_name: string | null;
  district: string | null;
  state: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  academic_year: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  school_id: string;
  role: 'school_admin' | 'teacher' | 'staff' | 'student';
  display_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  name: string;
  grade_level: number;
  section: string;
  medium_of_instruction: string;
  academic_year: string;
  room_number: string | null;
  created_at?: string;
}

export interface Student {
  id: string;
  school_id: string;
  class_id: string | null;
  display_name: string;
  roll_number: string | null;
  grade_level: number;
  preferred_language: string;
  learning_needs: string | null;
  guardian_contact: string | null;
  active: boolean;
  created_at: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  qualification: string | null;
  subjects: string[];
  languages: string[];
  experience_years: number;
  capacity: number;
  available: boolean;
  effectiveness_score: number | null;
  active: boolean;
  created_at: string;
  active_assignments_count?: number;
}

export interface MatchFactors {
  subject_match: number;
  language_match: number;
  experience_score: number;
  workload_balance: number;
  effectiveness_score: number;
}

export interface MatchCandidate {
  assignment_id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_qualification: string | null;
  score: number;
  factors: MatchFactors;
  reasons: string[];
  missing_data_warnings: string[];
  current_workload: number;
  max_capacity: number;
}

export interface MatchResponse {
  student_id: string;
  student_name: string;
  student_grade: number;
  preferred_language: string;
  subject: string;
  candidates: MatchCandidate[];
  note: string;
}

export interface TeacherAssignment {
  id: string;
  school_id: string;
  student_id: string;
  student_name?: string;
  teacher_id: string;
  teacher_name?: string;
  subject: string;
  support_hours_per_week: number;
  match_score: number;
  explanation: {
    reasons?: string[];
    factors?: MatchFactors;
    missing_warnings?: string[];
    algorithm?: string;
  };
  status: 'proposed' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
}

export interface Assessment {
  id: string;
  school_id: string;
  class_id: string | null;
  title: string;
  subject: string;
  grade_level: number;
  total_marks: number;
  passing_marks: number;
  competency_tag: string | null;
  assessment_date: string;
  created_at: string;
  results_count?: number;
  average_score?: number | null;
}

export interface StudentAssessmentResult {
  id: string;
  school_id: string;
  assessment_id: string;
  assessment_title?: string;
  subject?: string;
  student_id: string;
  student_name?: string;
  marks_obtained: number;
  total_marks?: number;
  score_percentage: number;
  is_learning_gap: boolean;
  weak_topics: string[];
  teacher_notes: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  student_id: string;
  student_name?: string;
  class_id: string | null;
  attendance_date: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  remarks: string | null;
  created_at: string;
}

export interface PracticeActivity {
  title: string;
  type: string;
  duration_minutes: number;
  language_hint?: string;
}

export interface LearningPathway {
  id: string;
  school_id: string;
  student_id: string;
  student_name?: string;
  subject: string;
  current_level: string;
  target_competency: string;
  identified_gaps: string[];
  recommended_topics: string[];
  practice_activities: PracticeActivity[];
  status: 'active' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface SubjectHealth {
  subject: string;
  average_score: number;
  students_assessed: number;
  gap_rate_pct: number;
}

export interface SchoolOverviewStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  active_assignments: number;
  pending_assignments: number;
  average_school_attendance_pct: number;
  learning_gap_students_count: number;
  subjects_health: SubjectHealth[];
  recent_assessments: Assessment[];
}

export interface StudentAnalytics {
  student_id: string;
  student_name: string;
  grade_level: number;
  preferred_language: string;
  total_assessments: number;
  average_percentage: number;
  attendance_rate_pct: number;
  subject_scores: Record<string, number>;
  identified_gaps: string[];
  recent_results: StudentAssessmentResult[];
  active_pathways: LearningPathway[];
  assigned_teachers: TeacherAssignment[];
}

export interface AuditEvent {
  id: string;
  school_id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
}
