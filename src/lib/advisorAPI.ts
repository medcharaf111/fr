import api from './api';
import { 
  TeacherAdvisorAssignment, 
  TeacherInspection, 
  AdvisorDashboardStats,
  AdvisorTeacherStats 
} from '@/types/api';

/**
 * Advisor-specific API endpoints
 * These endpoints are for advisors to manage their assigned teachers,
 * view schedules, create reports, and track teacher progress
 */

// Get all teachers assigned to the current advisor
export const getMyAssignedTeachers = () => 
  api.get<TeacherAdvisorAssignment[]>('/advisor-dashboard/assigned_teachers/');

// Get detailed stats for a specific assigned teacher
export const getTeacherStats = (teacherId: number) =>
  api.get<AdvisorTeacherStats>(`/advisor-dashboard/teacher_stats/?teacher_id=${teacherId}`);

// Get dashboard overview stats for advisor
export const getAdvisorDashboardStats = () =>
  api.get<AdvisorDashboardStats>('/advisor-dashboard/stats/');

// Get all inspections/meetings assigned to the advisor
export const getMyInspections = (params?: {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
}) => api.get<TeacherInspection[]>('/advisor-inspections/', { params });

// Get upcoming inspections (next 30 days)
export const getUpcomingInspections = () =>
  api.get<TeacherInspection[]>('/advisor-inspections/upcoming/');

// Start an inspection (mark as in_progress)
export const startInspection = (inspectionId: number, notes?: string) =>
  api.post(`/advisor-inspections/${inspectionId}/report_start/`, { notes });

// Complete an inspection with report
export const completeInspection = (
  inspectionId: number, 
  data: {
    report: string;
  }
) => api.post(`/advisor-inspections/${inspectionId}/report_completion/`, data);

// Update inspection report
export const updateInspectionReport = (
  inspectionId: number,
  data: {
    notes: string;
  }
) => api.post(`/advisor-inspections/${inspectionId}/update_notes/`, data);

// Get teacher progress data (for viewing journal/timeline)
export const getTeacherProgress = (teacherId: number, params?: {
  subject?: string;
  grade_level?: string;
}) => api.get(`/teacher-progress/`, { 
  params: { teacher_id: teacherId, ...params } 
});

// Get teacher's teaching plans
export const getTeacherTeachingPlans = (teacherId: number, params?: {
  subject?: string;
  grade_level?: string;
  status?: string;
}) => api.get(`/teaching-plans/`, {
  params: { teacher_id: teacherId, ...params }
});

// Get teacher's chapter notifications
export const getTeacherChapterNotifications = (teacherId: number) =>
  api.get(`/chapter-notifications/`, {
    params: { teacher_id: teacherId }
  });

// Get teachers available for chat (only assigned teachers)
export const getAssignedTeachersForChat = () =>
  api.get('/advisor/assigned-teachers-for-chat/');

// Create group chat with assigned teachers only
export const createAdvisorGroupChat = (data: {
  name: string;
  teacher_ids: number[];
  subject: string;
}) => api.post('/group-chats/', data);

// Get teacher analytics for assigned teacher
export const getAssignedTeacherAnalytics = (teacherId: number) =>
  api.get(`/advisor/teacher-analytics/${teacherId}/`);

// Create advisor report/review on teacher content
export const createAdvisorReport = (data: {
  teacher_id: number;
  review_type: 'lesson' | 'mcq_test' | 'qa_test' | 'general';
  lesson?: number;
  mcq_test?: number;
  qa_test?: number;
  rating: number;
  remarks: string;
}) => api.post('/advisor-reviews/', data);

// Get all reports created by current advisor
export const getMyReports = () =>
  api.get('/advisor-reviews/my-reviews/');

// Get teacher attendance for review
export const getTeacherAttendance = (teacherId: number, params?: {
  start_date?: string;
  end_date?: string;
}) => api.get(`/teacher-attendance/`, {
  params: { teacher_id: teacherId, ...params }
});

const advisorAPI = {
  getMyAssignedTeachers,
  getTeacherStats,
  getAdvisorDashboardStats,
  getMyInspections,
  getUpcomingInspections,
  startInspection,
  completeInspection,
  updateInspectionReport,
  getTeacherProgress,
  getTeacherTeachingPlans,
  getTeacherChapterNotifications,
  getAssignedTeachersForChat,
  createAdvisorGroupChat,
  getAssignedTeacherAnalytics,
  createAdvisorReport,
  getMyReports,
  getTeacherAttendance,
};

export default advisorAPI;
