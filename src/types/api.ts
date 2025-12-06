export interface School {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'teacher' | 'student' | 'parent' | 'admin' | 'advisor' | 'director' | 'cnp' | 'delegation' | 'minister' | 'gdhr' | 'inspector' | 'gpi'|'secretary';
  school: number;
  school_name: string;
  date_of_birth?: string;
  phone?: string;
  subjects?: string[];
  grade_level?: string;
  is_active: boolean;
}

export interface Lesson {
  id: number;
  title: string;
  content: string;
  subject: string;
  subject_display: string;
  grade_level: string;
  grade_level_display: string;
  created_by: number;
  created_by_name: string;
  school: number;
  school_name: string;
  created_at: string;
  updated_at: string;
  scheduled_date?: string | null;
  vault_source?: number | null;
  vault_source_title?: string | null;
}

export interface Test {
  id: number;
  lesson: number;
  lesson_title: string;
  title: string;
  questions: any; // JSON
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface TestSubmission {
  id: number;
  test: number;
  test_title: string;
  student: number;
  student_name: string;
  answers: any; // JSON
  score: number;
  status: 'submitted' | 'approved' | 'rejected';
  attempt_number: number;
  is_final: boolean;
  teacher_feedback: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  reviewed_by_name?: string;
}

export interface Progress {
  id: number;
  student: number;
  student_name: string;
  lesson: number;
  lesson_title: string;
  score?: number;
  completed_at?: string;
  notes: string;
}

export interface Portfolio {
  id: number;
  student: number;
  student_name: string;
  summary: string;
  achievements: any[];
  test_results: TestResult[];
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  lesson_name: string;
  test_title: string;
  test_type: 'MCQ' | 'QA';
  score: number;
  date: string;
  attempt: number;
}

export interface SubjectStatistic {
  average_score: number;
  test_count: number;
  subject_display: string;
}

export interface SubjectStatistics {
  [subject: string]: SubjectStatistic;
}

export interface StatisticsResponse {
  student: string;
  statistics: SubjectStatistics;
}

export interface QATest {
  id: number;
  lesson: number;
  lesson_title: string;
  title: string;
  questions: any; // JSON
  time_limit: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  created_by: number;
  created_by_name: string;
  num_questions: number;
}

export interface AIAnalysis {
  overall_assessment: string;
  spelling_grammar: {
    has_issues: boolean;
    severity: 'minor' | 'moderate' | 'severe';
    examples: string[];
    count: number;
  };
  comprehension: {
    has_issues: boolean;
    severity: 'minor' | 'moderate' | 'severe';
    problems: string[];
    misunderstood_questions: number[];
  };
  completeness: {
    incomplete_count: number;
    details: string[];
    incomplete_questions: number[];
  };
  critical_thinking: {
    level: 'weak' | 'developing' | 'good' | 'strong';
    observations: string[];
    needs_improvement: boolean;
  };
  strengths: string[];
  recommendations_for_teacher: string[];
  priority_areas: string[];
  confidence_score: number;
}

export interface QASubmission {
  id: number;
  test: number;
  test_title: string;
  student: number;
  student_name: string;
  answers: any; // JSON
  ai_feedback: any; // JSON
  ai_analysis: AIAnalysis | null;
  teacher_feedback: string;
  final_score: number | null;
  status: 'submitted' | 'ai_graded' | 'teacher_review' | 'finalized';
  time_taken: number | null;
  fullscreen_exits: number;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
}

export interface ProgressAnalysisResponse {
  student: string;
  student_id: number;
  analysis: {
    has_data: boolean;
    message?: string;
    total_analyses?: number;
    date_range?: {
      first: string;
      last: string;
    };
    improvement_trends?: {
      spelling_grammar: {
        improving: boolean;
        history: Array<{
          date: string;
          severity: string;
          count: number;
          subject: string;
        }>;
      };
      comprehension: {
        improving: boolean;
        history: Array<{
          date: string;
          severity: string;
          problems_count: number;
          subject: string;
        }>;
      };
      critical_thinking: {
        improving: boolean;
        history: Array<{
          date: string;
          level: string;
          subject: string;
        }>;
      };
    };
    persistent_issues?: {
      spelling_errors: Array<{ error: string; occurrences: number }>;
      comprehension_problems: Array<{ problem: string; occurrences: number }>;
    };
    strengths_identified?: Array<{
      strength: string;
      date: string;
      subject: string;
    }>;
    recommendations_history?: Array<{
      recommendation: string;
      date: string;
      subject: string;
    }>;
    by_subject?: {
      [subject: string]: {
        test_count: number;
        recent_analysis: any;
      };
    };
  };
}

export interface AuthResponse {
  user: User;
  refresh: string;
  access: string;
}

export interface LessonGenerateRequest {
  prompt: string;
}

export interface LessonGenerateResponse {
  lesson_id: number;
  content: string;
}

export interface GradeRequest {
  image: File;
}

export interface GradeResponse {
  scores: Record<string, number>;
}

export interface UserBasic {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'teacher' | 'student' | 'parent' | 'admin' | 'advisor';
  subjects?: string[];
}

export interface TeacherStudentRelationship {
  id: number;
  teacher: number;
  student: number;
  teacher_info: UserBasic;
  student_info: UserBasic;
  rating_by_teacher: number | null;
  comments_by_teacher: string;
  rating_by_student: number | null;
  comments_by_student: string;
  average_rating: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvisorReview {
  id: number;
  advisor: number;
  advisor_info: UserBasic;
  review_type: 'lesson' | 'mcq_test' | 'qa_test';
  lesson?: number;
  mcq_test?: number;
  qa_test?: number;
  rating: number;
  remarks: string;
  target_title: string;
  teacher_username: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  chat: number;
  sender: number;
  sender_info: UserBasic;
  message: string;
  file_attachment?: string;
  file_attachment_url?: string;
  read_by_users: string[];  // Array of usernames who have read the message
  is_read_by_current_user: boolean;  // Whether current user has read the message
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupChat {
  id: number;
  name: string;
  subject: string;
  subject_display: string;
  advisor: number;
  advisor_info: UserBasic;
  teachers: number[];
  teachers_info: UserBasic[];
  latest_message: ChatMessage | null;
  unread_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Teacher-Advisor Assignment Types
export interface TeacherAdvisorAssignment {
  id: number;
  teacher: number;
  teacher_info: UserBasic;
  advisor: number;
  advisor_info: UserBasic;
  assigned_by: number | null;
  assigned_by_info: UserBasic | null;
  school: number;
  subject: string;
  subject_display: string;
  is_active: boolean;
  notes: string;
  assigned_at: string;
  updated_at: string;
  deactivated_at: string | null;
}

export interface TeacherInspection {
  id: number;
  teacher: number;
  teacher_info: UserBasic;
  delegator: number;
  delegator_info: UserBasic;
  advisor: number | null;
  advisor_info: UserBasic | null;
  school: number;
  school_info?: {
    id: number;
    name: string;
  };
  subject: string;
  subject_display: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  purpose: string;
  pre_inspection_notes: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  advisor_started_at?: string | null;
  advisor_completed_at?: string | null;
  advisor_report: string;
  advisor_notes?: string;
  observations: string;
  recommendations: string;
  rating: number | null;
  completion_verified_by_delegator?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvisorDashboardStats {
  total_assigned_teachers: number;
  active_assignments: number;
  pending_reports: number;
  upcoming_inspections: number;
  completed_inspections_this_month: number;
  average_teacher_performance: number;
  subjects_covered: string[];
  recent_activity: {
    type: 'inspection' | 'report' | 'assignment';
    description: string;
    date: string;
  }[];
}

export interface AdvisorTeacherStats {
  teacher_id: number;
  teacher_name: string;
  subject: string;
  total_lessons: number;
  completed_lessons: number;
  completion_rate: number;
  average_student_score: number;
  last_activity: string;
  needs_attention: boolean;
  performance_trend: 'improving' | 'stable' | 'declining';
}

// Parent Platform Types
export interface ParentStudentRelationship {
  id: number;
  parent: number;
  student: number;
  parent_info: UserBasic;
  student_info: UserBasic;
  relationship_type: 'parent' | 'guardian' | 'relative' | 'other';
  relationship_type_display: string;
  is_primary: boolean;
  can_view_grades: boolean;
  can_chat_teachers: boolean;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignedTeacher {
  id: number;
  name: string;
  email: string;
  subjects: string[];
  rating: number | null;
  comments: string;
}

export interface StudentPerformance {
  student: UserBasic;
  overall_average: number;
  total_tests: number;
  recent_tests: Array<{
    lesson_name: string;
    test_title: string;
    test_type: string;
    score: number;
    date: string;
    attempt: number;
  }>;
  portfolio_summary: {
    total_achievements: number;
    summary: string;
  };
  assigned_teachers: AssignedTeacher[];
  strengths?: string[];  // Optional - not provided to parents for privacy
  weaknesses?: string[];  // Optional - not provided to parents for privacy
  xp_points: number;
  level: number;
  streak_days: number;
  relationship_type: string;
}

export interface ParentTeacherChat {
  id: number;
  parent: number;
  teacher: number;
  student: number;
  parent_info: UserBasic;
  teacher_info: UserBasic;
  student_info: UserBasic;
  subject: string;
  subject_display: string;
  latest_message: ParentTeacherMessage | null;
  unread_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParentTeacherMessage {
  id: number;
  chat: number;
  sender: number;
  sender_info: UserBasic;
  message: string;
  file_attachment: string | null;
  file_url: string | null;
  is_read: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

// Teacher Analytics Types
export interface TeacherProgress {
  id: number;
  teacher: number;
  teacher_info: UserBasic;
  subject: string;
  subject_display: string;
  grade_level: string;
  grade_level_display: string;
  current_chapter: string;
  chapter_number: number;
  total_chapters: number;
  progress_percentage: number;
  started_at: string;
  updated_at: string;
}

export interface ChapterProgressNotification {
  id: number;
  teacher_progress: number;
  teacher_progress_info: TeacherProgress;
  advisor: number;
  advisor_info: UserBasic;
  teacher_info: UserBasic;
  previous_chapter: string;
  previous_chapter_number: number;
  new_chapter: string;
  new_chapter_number: number;
  ai_detected: boolean;
  ai_confidence: number;
  status: 'pending' | 'confirmed' | 'rejected';
  status_display: string;
  advisor_notes: string;
  created_at: string;
  reviewed_at: string | null;
}

export interface TeacherAnalytics {
  id: number;
  teacher: number;
  teacher_info: UserBasic;
  total_lessons_created: number;
  total_mcq_tests_created: number;
  total_qa_tests_created: number;
  total_students: number;
  average_student_score: number;
  average_student_rating: number;
  total_student_ratings: number;
  average_advisor_rating: number;
  total_advisor_ratings: number;
  overall_rating: number;
  last_lesson_created: string | null;
  last_test_created: string | null;
  subjects_taught: string[];
  updated_at: string;
}

// Teaching Timeline Types
export interface TeachingPlan {
  id: number;
  teacher: number;
  teacher_name: string;
  title: string;
  description: string;
  subject: string;
  subject_display: string;
  grade_level: string;
  grade_level_display: string;
  lesson: number | null;
  lesson_title: string | null;
  date: string; // YYYY-MM-DD format
  time: string | null; // HH:MM:SS format
  status: 'planned' | 'taught' | 'cancelled';
  status_display: string;
  duration_minutes: number | null;
  notes: string;
  completion_notes: string;
  created_at: string;
  updated_at: string;
}

// Administrator Types
export interface AdminDashboardStats {
  total_schools: number;
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_advisors: number;
  total_parents: number;
  total_lessons: number;
  total_mcq_tests: number;
  total_qa_tests: number;
  total_test_submissions: number;
  total_advisor_reviews: number;
  active_relationships: number;
  avg_teacher_rating: number | null;
}

export interface AdminSchoolStats {
  id: number;
  name: string;
  address: string;
  created_at: string;
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_advisors: number;
  total_parents: number;
  total_lessons: number;
  total_tests: number;
  avg_teacher_rating: number | null;
}

export interface AdminUserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'teacher' | 'student' | 'advisor' | 'parent' | 'admin';
  school: number;
  school_name: string;
  date_of_birth: string | null;
  phone: string;
  subjects: string[];
  is_active: boolean;
  date_joined: string;
  
  // Teacher-specific stats
  total_students?: number | null;
  total_lessons_created?: number | null;
  total_tests_created?: number | null;
  average_rating_from_students?: number | null;
  
  // Student-specific stats
  total_teachers?: number | null;
  total_lessons_completed?: number | null;
  total_tests_taken?: number | null;
  
  // Advisor-specific stats
  total_teachers_supervised?: number | null;
  total_reviews_given?: number | null;
}

export interface AdminTeacherPerformance {
  teacher_id: number;
  teacher_name: string;
  subjects: string[];
  total_students: number;
  total_lessons_created: number;
  total_tests_created: number;
  avg_rating: number;
  advisor_name: string;
  latest_advisor_review: string | null;
  progress_percentage: number;
}

export interface AdminAdvisorPerformance {
  advisor_id: number;
  advisor_name: string;
  advisor_subject: string;
  total_teachers_supervised: number;
  total_reviews_given: number;
  total_notifications_reviewed: number;
  average_response_time_hours: number;
  teachers_list: {
    id: number;
    name: string;
    subjects: string[];
  }[];
}

export interface AdminReview {
  id: string | number;
  type: 'advisor_review' | 'teacher_review' | 'student_review';
  reviewer: string;
  reviewer_role: 'advisor' | 'teacher' | 'student';
  reviewed?: string;
  reviewed_role?: 'teacher' | 'student';
  review_type?: string;
  content_type?: string;
  content_title?: string;
  rating: number;
  remarks?: string;
  comments?: string;
  created_at: string;
  school: string;
}

export interface AdminAdvisorTeacherNote {
  review_id: number;
  advisor_id: number;
  advisor_name: string;
  teacher_id: number;
  teacher_name: string;
  content_type: string;
  content_title: string;
  rating: number;
  remarks: string;
  created_at: string;
}

export interface AdminAdvisorTeacherAssignment {
  advisor_id: number;
  advisor_name: string;
  subject: string;
  school: string;
  total_teachers: number;
  teachers: {
    id: number;
    name: string;
    subjects: string[];
    total_students: number;
  }[];
}

// School Map Types
export interface SchoolMapData {
  id: number;
  name: string;
  name_ar: string;
  address: string;
  latitude: number;
  longitude: number;
  school_code: string;
  school_type: string;
  delegation: string;
  cre: string;
  total_users: number;
  teachers: number;
  students: number;
  advisors: number;
}

export interface SchoolMapResponse {
  schools: SchoolMapData[];
  filter_options: {
    types: string[];
    delegations: string[];
    cres: string[];
  };
  total_count: number;
}

// Vault System Types
export interface VaultLessonPlan {
  id: number;
  title: string;
  description: string;
  content: string;
  subject: string;
  subject_display: string;
  grade_level: string;
  grade_level_display: string;
  objectives: string[];
  materials_needed: string[];
  duration_minutes: number | null;
  tags: string[];
  // Language-specific fields (English, French, Arabic)
  grammar: string[];
  vocabulary: string[];
  life_skills_and_values: string[];
  // AI Generation fields
  source_type: 'manual' | 'ai_yearly' | 'ai_single' | 'imported';
  source_type_display: string;
  source_teacher: number | null;
  source_teacher_name: string | null;
  teacher_guide_file: string | null;
  yearly_breakdown_file: string | null;
  ai_generation_prompt: string;
  created_by: number;
  created_by_name: string;
  created_by_full_name: string;
  school: number;
  school_name: string;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  use_count: number;
  comments_count: number;
  average_rating: number | null;
  exercises_count: number;
  materials_count: number;
  created_at: string;
  updated_at: string;
}

export interface YearlyBreakdown {
  id: number;
  advisor: number;
  advisor_name: string;
  school: number;
  school_name: string;
  subject: string;
  subject_display: string;
  grade_level: string;
  grade_level_display: string;
  input_pdf: string;
  custom_instructions: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  status_display: string;
  error_message: string;
  generated_plans_count: number;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export interface VaultLessonPlanUsage {
  id: number;
  lesson_plan: number;
  lesson_plan_title: string;
  teacher: number;
  teacher_name: string;
  used_at: string;
  notes: string;
  rating: number | null;
  feedback: string;
}

export interface VaultComment {
  id: number;
  lesson_plan: number;
  user: number;
  user_name: string;
  user_full_name: string;
  user_role: string;
  comment: string;
  parent_comment: number | null;
  replies_count: number;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
}

export interface VaultExercise {
  id: number;
  vault_lesson_plan: number;
  vault_lesson_plan_title: string;
  vault_lesson_plan_subject: string;
  vault_lesson_plan_grade: string;
  title: string;
  description: string;
  exercise_type: 'mcq' | 'qa';
  exercise_type_display: string;
  questions: any[]; // MCQ: {question, options, correct_answer} | QA: {question, expected_points, sample_answer}
  time_limit: number | null;
  num_questions: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  difficulty_level_display: string;
  created_by: number;
  created_by_name: string;
  created_by_full_name: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface VaultMaterial {
  id: number;
  vault_lesson_plan: number;
  vault_lesson_plan_title: string;
  vault_lesson_plan_subject: string;
  vault_lesson_plan_grade: string;
  title: string;
  description: string;
  material_type: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'image' | 'video_link' | 'other';
  material_type_display: string;
  file: string | null;
  file_url: string | null;
  file_name: string | null;
  external_link: string;
  file_size: number | null;
  mime_type: string;
  created_by: number;
  created_by_name: string;
  created_by_full_name: string;
  is_active: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface VaultBySubject {
  [subject: string]: {
    subject_display: string;
    plans: VaultLessonPlan[];
  };
}

// Analytics Types
export interface NationalKPIDashboard {
  active_users: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  platform_adoption: {
    by_region: Array<{
      cre: string;
      active_schools: number;
      total_users: number;
    }>;
    total_active_schools: number;
    adoption_rate: number;
  };
  student_teacher_ratios: {
    average: number;
    by_school: Array<{
      school_id: number;
      school_name: string;
      ratio: number;
    }>;
  };
  content_creation: {
    lessons_this_week: number;
    lessons_last_week: number;
    growth: number;
    tests_this_week: number;
  };
  assessment_completion: {
    rate: number;
    completed: number;
    total: number;
  };
  // Monthly historical trends for last 12 months
  historical_trends?: Array<{
    month: string; // YYYY-MM
    month_name: string; // e.g. "Oct 2025"
    active_users: number;
    lessons_created: number;
    tests_created: number;
    submissions: number;
    avg_score: number;
  }>;
}

export interface RegionalPerformance {
  regional_stats: Array<{
    cre: string;
    delegation: string;
    total_schools: number;
    total_students: number;
    total_teachers: number;
    total_lessons: number;
    total_tests: number;
  }>;
  performance_rankings: Array<{
    region: string;
    schools: number;
    students: number;
    avg_score: number;
    total_submissions: number;
  }>;
  top_performers: Array<{
    region: string;
    schools: number;
    students: number;
    avg_score: number;
    total_submissions: number;
  }>;
  needs_support: Array<{
    region: string;
    schools: number;
    students: number;
    avg_score: number;
    total_submissions: number;
  }>;
  // region name -> monthly data
  regional_trends?: {
    [region: string]: Array<{
      month: string;
      month_name: string;
      avg_score: number;
      submissions: number;
    }>;
  };
}

export interface CurriculumEffectiveness {
  subject_analysis: Array<{
    subject: string;
    lessons_count: number;
    tests_count: number;
    avg_score: number;
    completion_rate: number;
    total_submissions: number;
  }>;
  hardest_subjects: Array<{
    subject: string;
    lessons_count: number;
    tests_count: number;
    avg_score: number;
    completion_rate: number;
    total_submissions: number;
  }>;
  easiest_subjects: Array<{
    subject: string;
    lessons_count: number;
    tests_count: number;
    avg_score: number;
    completion_rate: number;
    total_submissions: number;
  }>;
  most_effective_lessons: Array<{
    id: number;
    title: string;
    subject: string;
    avg_score: number;
  }>;
}

export interface AtRiskStudents {
  total_at_risk: number;
  high_risk: number;
  medium_risk: number;
  students: Array<{
    student_id: number;
    student_name: string;
    school: string;
    avg_score: number;
    total_tests: number;
    is_declining: boolean;
    recent_scores: number[];
    risk_level: 'high' | 'medium';
  }>;
  recommendations: string[];
}

export interface TeacherQualityMetrics {
  total_teachers: number;
  average_quality_score: number;
  top_performers: Array<{
    teacher_id: number;
    teacher_name: string;
    school: string;
    subjects: string[];
    quality_score: number;
    metrics: {
      lessons_created: number;
      tests_created: number;
      avg_student_score: number;
      approval_rate: number;
      advisor_rating: number;
      unique_students_reached: number;
      recent_activity: number;
    };
    level: 'excellent' | 'good' | 'needs_improvement';
  }>;
  needs_development: Array<{
    teacher_id: number;
    teacher_name: string;
    school: string;
    subjects: string[];
    quality_score: number;
    metrics: {
      lessons_created: number;
      tests_created: number;
      avg_student_score: number;
      approval_rate: number;
      advisor_rating: number;
      unique_students_reached: number;
      recent_activity: number;
    };
    level: 'excellent' | 'good' | 'needs_improvement';
  }>;
  metrics_breakdown: {
    excellent: number;
    good: number;
    needs_improvement: number;
  };
}

// Advisor Analytics Types
export interface AdvisorAnalytics {
  advisor_info: {
    name: string;
    email: string;
    subject: string;
    school: string | null;
  };
  overview: {
    total_teachers_supervised: number;
    total_reviews_given: number;
    avg_rating_given: number;
    approval_rate: number;
    avg_response_time_hours: number;
    pending_notifications: number;
  };
  review_breakdown: {
    lesson_reviews: number;
    mcq_test_reviews: number;
    qa_test_reviews: number;
    total: number;
  };
  teacher_performance: {
    all_teachers: Array<{
      teacher_id: number;
      teacher_name: string;
      email: string;
      subjects: string[];
      lessons_created: number;
      tests_created: number;
      students: number;
      avg_student_score: number;
      avg_advisor_rating: number;
      total_reviews: number;
      recent_activity_30d: number;
      needs_attention: boolean;
    }>;
    top_performers: Array<{
      teacher_id: number;
      teacher_name: string;
      email: string;
      subjects: string[];
      lessons_created: number;
      tests_created: number;
      students: number;
      avg_student_score: number;
      avg_advisor_rating: number;
      total_reviews: number;
      recent_activity_30d: number;
      needs_attention: boolean;
    }>;
    needs_support: Array<{
      teacher_id: number;
      teacher_name: string;
      email: string;
      subjects: string[];
      lessons_created: number;
      tests_created: number;
      students: number;
      avg_student_score: number;
      avg_advisor_rating: number;
      total_reviews: number;
      recent_activity_30d: number;
      needs_attention: boolean;
    }>;
  };
  monthly_trends: Array<{
    month: string; // YYYY-MM
    month_name: string; // e.g. "Oct 2025"
    reviews_given: number;
    avg_rating_given: number;
    lessons_created: number;
    tests_created: number;
    avg_student_score: number;
    submissions: number;
  }>;
  notifications: {
    total: number;
    confirmed: number;
    pending: number;
    confirmation_rate: number;
  };
}

// Director Dashboard Types
export interface TeacherGradeAssignment {
  id: number;
  teacher: number;
  teacher_info: {
    id: number;
    username: string;
    full_name: string;
    subjects: string[];
  };
  grade_level: string;
  grade_level_display: string;
  subject: string;
  subject_display: string;
  school: number;
  school_name: string;
  assigned_by: number;
  assigned_by_info?: {
    id: number;
    username: string;
    full_name: string;
  };
  academic_year: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DirectorAssignmentsOverview {
  school_name: string;
  total_teachers: number;
  total_assignments: number;
  unassigned_teachers_count: number;
  unassigned_teachers: Array<{
    id: number;
    name: string;
    subjects: string[];
  }>;
  assignments_by_grade: {
    [gradeLevel: string]: {
      grade_label: string;
      total_assignments: number;
      subjects_covered: string[];
      teachers: Array<{
        assignment_id: number;
        teacher_id: number;
        name: string;
        subject: string;
        subject_display: string;
      }>;
    };
  };
}

export interface DirectorTeacherInfo {
  id: number;
  username: string;
  full_name: string;
  email: string;
  subjects: string[];
  current_assignments_count: number;
  current_assignments: Array<{
    id: number;
    grade_level: string;
    grade_display: string;
    subject: string;
    subject_display: string;
  }>;
}

export interface NotebookPage {
  id: number;
  notebook: number;
  date: string;
  lesson_name: string;
  exercises_set_by_teacher: string;
  exercises_answers: string;
  notes: string;
  teacher_viewed: boolean;
  teacher_comment: string;
  teacher_viewed_at: string | null;
  answer_status: 'pending' | 'correct' | 'incorrect' | 'partial';
  created_at: string;
  updated_at: string;
  student_name_readonly: string;
  student_id: number;
}

export interface StudentNotebook {
  id: number;
  student: number;
  student_full_name: string;
  pages: NotebookPage[];
  pages_count: number;
  created_at: string;
  updated_at: string;
}

export interface CNPTeacherGuide {
  id: number;
  title: string;
  description: string;
  subject: string;
  subject_display: string;
  grade_level: string;
  grade_level_display: string;
  guide_type: 'yearly' | 'unit' | 'lesson' | 'assessment' | 'resource';
  guide_type_display: string;
  academic_year: string;
  pdf_file: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_size_mb: number | null;
  page_count: number | null;
  keywords: string[];
  topics_covered: string[];
  learning_objectives: string[];
  status: 'pending' | 'approved' | 'archived';
  status_display: string;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_by_username: string;
  approved_by: number | null;
  approved_by_name: string | null;
  usage_count: number;
  download_count: number;
  cnp_notes: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

export interface CNPDashboardStats {
  my_uploads?: number;
  total_guides?: number;
  pending_review: number;
  approved: number;
  archived: number;
  total_usage: number;
  total_downloads: number;
  by_subject: Array<{ name: string; count: number }>;
  by_grade: Array<{ name: string; count: number }>;
  by_type: Array<{ name: string; count: number }>;
  recent_uploads?: CNPTeacherGuide[];
  pending_guides?: CNPTeacherGuide[];
}

// ============================================================
// INSPECTION SYSTEM TYPES
// ============================================================

export interface Region {
  id: number;
  name: string;
  code: string;
  governorate: string;
  is_active: boolean;
  school_count: number;
  inspector_count: number;
  teacher_count: number;
}

export interface InspectorRegionAssignment {
  id: number;
  inspector: number;
  inspector_name: string;
  region: number;
  region_name: string;
  assigned_by: number;
  assigned_by_name: string;
  assigned_at: string;
}

export interface TeacherComplaint {
  id: number;
  teacher: number;
  teacher_name: string;
  filed_by: number;
  filed_by_name: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severity_display: string;
  status: 'pending' | 'under_investigation' | 'resolved' | 'dismissed';
  status_display: string;
  category: string;
  evidence: string;
  assigned_inspector: number | null;
  assigned_inspector_name: string | null;
  resolution_notes: string;
  filed_at: string;
  resolved_at: string | null;
  related_visits_count: number;
}

export interface InspectionVisit {
  id: number;
  inspector: number;
  inspector_name: string;
  teacher: number;
  teacher_name: string;
  teacher_subject: string | null;
  school: number;
  school_name: string;
  related_complaint: number | null;
  related_complaint_title: string | null;
  visit_date: string;
  visit_time: string;
  inspection_type: 'class_visit' | 'follow_up' | 'complaint_based' | 'evaluation_renewal' | 'routine';
  inspection_type_display: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  status_display: string;
  duration_minutes: number;
  notes: string;
  cancellation_reason: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  has_report: boolean;
  can_write_report: boolean;
}

export interface InspectionReport {
  id: number;
  visit: number;
  visit_date: string;
  visit_type: string;
  inspector: number;
  inspector_name: string;
  teacher: number;
  teacher_name: string;
  summary: string;
  classroom_observations: string;
  pedagogical_evaluation: string;
  teacher_strengths: string;
  improvement_points: string;
  student_engagement: string;
  material_quality: string;
  final_rating: number;
  recommendations: string;
  follow_up_required: boolean;
  follow_up_date: string | null;
  attachments: string[];
  gpi_status: 'pending' | 'approved' | 'rejected' | 'revision_needed';
  gpi_status_display: string;
  gpi_reviewer: number | null;
  gpi_reviewer_name: string | null;
  gpi_feedback: string;
  gpi_reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
  visit_details?: InspectionVisit;
}

export interface MonthlyReport {
  id: number;
  inspector: number;
  inspector_name: string;
  month: string;
  month_year: string;
  total_visits: number;
  completed_visits: number;
  cancelled_visits: number;
  pending_visits: number;
  rating_distribution: { [key: string]: number };
  average_rating: number | null;
  recurring_issues: string;
  positive_trends: string;
  recommendations: string;
  challenges_faced: string;
  status: 'draft' | 'submitted' | 'approved' | 'revision_needed';
  status_display: string;
  gpi_reviewer: number | null;
  gpi_reviewer_name: string | null;
  gpi_feedback: string;
  gpi_reviewed_at: string | null;
  created_at: string;
  submitted_at: string | null;
  updated_at: string;
}

export interface TeacherRatingHistory {
  id: number;
  teacher: number;
  teacher_name: string;
  inspector: number;
  inspector_name: string;
  inspection_report: number;
  rating: number;
  inspection_date: string;
  inspection_type: string;
  inspection_type_display: string;
  subject_taught: string;
  grade_level: string;
  created_at: string;
}

export interface InspectorDashboardStats {
  total_visits: number;
  completed_visits: number;
  pending_visits: number;
  upcoming_visits: number;
  reports_pending_review: number;
  reports_approved: number;
  reports_revision_needed: number;
  assigned_regions: Array<{
    id: number;
    name: string;
    code: string;
    governorate: string;
    school_count: number;
    teacher_count: number;
  }>;
  assigned_teachers_count: number;
  monthly_report_status: string | null;
}

export interface GPIDashboardStats {
  total_inspectors: number;
  active_inspectors: number;
  total_reports_pending: number;
  total_monthly_reports_pending: number;
  reports_approved_this_month: number;
  reports_rejected_this_month: number;
  average_rating_this_month: number | null;
  total_visits_this_month: number;
  regions_summary: Array<{
    id: number;
    name: string;
    code: string;
    inspector_count: number;
    visits_this_month: number;
    school_count: number;
    teacher_count: number;
  }>;
}

export interface TeacherInfo {
  id: number;
  full_name: string;
  email: string;
  school: string | null;
  subject: string;
  phone_number: string;
}

export interface InspectorInfo {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  assigned_regions: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  total_visits: number;
  completed_visits: number;
  average_rating: number | null;
}

