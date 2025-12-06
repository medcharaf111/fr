import axios from 'axios';
import { AuthResponse, User } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // For FormData requests, remove Content-Type to let axios set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  console.log('Request config:', {
    url: config.url,
    method: config.method,
    hasAuth: !!config.headers.Authorization,
    contentType: config.headers['Content-Type'],
    isFormData: config.data instanceof FormData
  });
  
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = refreshResponse.data.access;
          localStorage.setItem('access_token', newAccessToken);
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
    role: string;
    school: number;
    first_name?: string;
    last_name?: string;
    subjects?: string[];
  }): Promise<AuthResponse> => {
    const response = await api.post('/users/register/', data);
    return response.data;
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/users/login/', { username, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setTokens: (access: string, refresh: string, user: User) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  // Get list of all students (for parents to find student IDs)
  getStudentList: () => api.get('/users/students/'),
};

// Lesson API
export const lessonAPI = {
  generateLesson: async (prompt: string, title?: string, subject?: string, grade_level?: string) => {
    const response = await api.post('/lessons/generate/', { 
      prompt, 
      title,
      subject: subject || 'math',
      grade_level: grade_level || '1'
    });
    return response.data;
  },

  getAllLessons: async () => {
    const response = await api.get('/lessons/');
    return response.data;
  },

  getLesson: async (id: number) => {
    const response = await api.get(`/lessons/${id}/`);
    return response.data;
  },
  
  getTimeline: async (startDate?: string, endDate?: string) => {
    const params = startDate && endDate ? { start_date: startDate, end_date: endDate } : {};
    const response = await api.get('/lessons/timeline/', { params });
    return response.data;
  },
  
  scheduleLesson: async (lessonId: number, scheduledDate: string) => {
    const response = await api.patch(`/lessons/${lessonId}/schedule/`, { scheduled_date: scheduledDate });
    return response.data;
  },
};

// Test API
export const testAPI = {
  getAll: (questionType?: 'mcq' | 'qa') => {
    const params = questionType ? { question_type: questionType } : {};
    return api.get('/tests/', { params });
  },
  getById: (id: number) => api.get(`/tests/${id}/`),
  generateTest: (lessonId: number, numQuestions: number = 10, title?: string) =>
    api.post('/lessons/generate-test/', { 
      lesson_id: lessonId, 
      num_questions: numQuestions,
      title 
    }),
  approve: (testId: number, studentIds: number[], notes?: string) =>
    api.post(`/tests/${testId}/approve/`, { student_ids: studentIds, notes }),
  reject: (testId: number, notes: string) =>
    api.post(`/tests/${testId}/reject/`, { notes }),
  getMyStudents: () => api.get('/tests/my_students/'),
  updateQuestions: (testId: number, questions: any[]) =>
    api.patch(`/tests/${testId}/update_questions/`, { questions }),
  getPending: () => api.get('/tests/pending/'),
  
  // Test Submission endpoints
  submitTest: (testId: number, answers: any, score: number) =>
    api.post(`/tests/${testId}/submit/`, { answers, score }),
  getSubmissions: (statusFilter?: string) => {
    const params = statusFilter ? { status: statusFilter } : {};
    return api.get('/tests/submissions/', { params });
  },
  approveSubmission: (testId: number, submissionId: number, feedback?: string) =>
    api.post(`/tests/${testId}/approve_submission/`, { submission_id: submissionId, feedback }),
  rejectSubmission: (testId: number, submissionId: number, feedback: string) =>
    api.post(`/tests/${testId}/reject_submission/`, { submission_id: submissionId, feedback }),
  
  generateQuestions: async (lessonId: number, numQuestions: number = 5) => {
    const response = await api.post(`/tests/${lessonId}/generate_questions/`, { num_questions: numQuestions });
    return response.data;
  },
  gradeTest: async (image: File) => {
    const formData = new FormData();
    formData.append('image', image);
    const response = await api.post('/tests/grade/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  gradeTestWithPdfs: async (examPdf: File, guidePdf: File) => {
    const formData = new FormData();
    formData.append('exam_pdf', examPdf);
    formData.append('guide_pdf', guidePdf);
    const response = await api.post('/tests/grade/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Relationship API
export const relationshipAPI = {
  // Get teacher's students
  getMyStudents: () => api.get('/relationships/my-students/'),
  
  // Get student's teachers
  getMyTeachers: () => api.get('/relationships/my-teachers/'),
  
  // Get available students for assignment (teacher only)
  getAvailableStudents: () => api.get('/relationships/available-students/'),
  
  // Assign a student to teacher
  assignStudent: (studentId: number, teacherId?: number) => 
    api.post('/relationships/assign-student/', { student_id: studentId, teacher_id: teacherId }),
  
  // Teacher rates student
  rateStudent: (relationshipId: number, rating: number, comments?: string) =>
    api.post(`/relationships/${relationshipId}/rate-student/`, { rating, comments }),
  
  // Student rates teacher
  rateTeacher: (relationshipId: number, rating: number, comments?: string) =>
    api.post(`/relationships/${relationshipId}/rate-teacher/`, { rating, comments }),
  
  // Get all relationships (filtered by role)
  getAll: () => api.get('/relationships/'),
  
  // Get specific relationship
  getById: (id: number) => api.get(`/relationships/${id}/`),
};

// Advisor Review API
export const advisorReviewAPI = {
  // Get all reviews (filtered by role)
  getAll: () => api.get('/advisor-reviews/'),
  
  // Get advisor's own reviews
  getMyReviews: () => api.get('/advisor-reviews/my-reviews/'),
  
  // Get reviews on teacher's content
  getReviewsOnMyContent: () => api.get('/advisor-reviews/reviews-on-my-content/'),
  
  // Get advisor analytics dashboard
  getAdvisorAnalytics: () => api.get('/advisor-reviews/advisor-analytics/'),
  
  // Create a review
  create: (data: {
    review_type: 'lesson' | 'mcq_test' | 'qa_test';
    lesson?: number;
    mcq_test?: number;
    qa_test?: number;
    rating: number;
    remarks: string;
  }) => api.post('/advisor-reviews/', data),
  
  // Update a review
  update: (id: number, data: { rating?: number; remarks?: string }) =>
    api.patch(`/advisor-reviews/${id}/`, data),
  
  // Delete a review
  delete: (id: number) => api.delete(`/advisor-reviews/${id}/`),
};

// Group Chat API
export const groupChatAPI = {
  // Get all chats (filtered by role)
  getMyChats: () => api.get('/group-chats/my-chats/'),
  
  // Get teachers in advisor's subject
  getSubjectTeachers: () => api.get('/group-chats/subject-teachers/'),
  
  // Create chat with teachers (advisor only)
  createWithTeachers: (name: string, teacherIds: number[]) =>
    api.post('/group-chats/create-with-teachers/', { name, teacher_ids: teacherIds }),
  
  // Get chat details
  getById: (id: number) => api.get(`/group-chats/${id}/`),
  
  // Update chat
  update: (id: number, data: { name?: string; is_active?: boolean }) =>
    api.patch(`/group-chats/${id}/`, data),
  
  // Add teacher to chat (advisor only)
  addTeacher: (chatId: number, teacherId: number) =>
    api.post(`/group-chats/${chatId}/add-teacher/`, { teacher_id: teacherId }),
  
  // Remove teacher from chat (advisor only)
  removeTeacher: (chatId: number, teacherId: number) =>
    api.post(`/group-chats/${chatId}/remove-teacher/`, { teacher_id: teacherId }),
};

// Chat Message API
export const chatMessageAPI = {
  // Get messages for a chat
  getChatMessages: (chatId: number) => api.get(`/chat-messages/chat/${chatId}/`),
  
  // Send a message (with optional file)
  send: (chatId: number, message: string, file?: File) => {
    const formData = new FormData();
    formData.append('chat', chatId.toString());
    if (message) {
      formData.append('message', message);
    }
    if (file) {
      console.log('Appending file:', file.name, file.type, file.size);
      formData.append('file_attachment', file, file.name);
    }
    
    // Log FormData contents
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    
    // Get token for authorization
    const token = localStorage.getItem('access_token');
    console.log('Token exists:', !!token);
    
    // Don't set Content-Type - let axios set multipart/form-data with boundary automatically
    // The Authorization header is added by the interceptor
    return api.post('/chat-messages/', formData, {
      headers: {
        // Remove Content-Type to let axios set it automatically for FormData
        'Content-Type': undefined as any,
      }
    });
  },
  
  // Update message (edit)
  update: (messageId: number, message: string) =>
    api.patch(`/chat-messages/${messageId}/`, { message }),
  
  // Delete message
  delete: (messageId: number) => api.delete(`/chat-messages/${messageId}/`),
  
  // Mark message as read
  markRead: (messageId: number) => api.post(`/chat-messages/${messageId}/mark-read/`),
  
  // Mark all messages in a chat as read
  markChatRead: (chatId: number) => api.post('/chat-messages/mark-chat-read/', { chat_id: chatId }),
};

// Parent Platform API
export const parentAPI = {
  // Parent-Student Relationships
  assignStudent: (data: { student_id: number; relationship_type?: string; is_primary?: boolean }) =>
    api.post('/parent-students/assign_student/', data),
  
  getMyStudents: () => api.get('/parent-students/my_students/'),
  
  getRelationships: () => api.get('/parent-students/'),
  
  getRelationship: (id: number) => api.get(`/parent-students/${id}/`),
  
  updateRelationship: (id: number, data: Partial<any>) => api.patch(`/parent-students/${id}/`, data),
  
  removeRelationship: (id: number) => api.delete(`/parent-students/${id}/`),
  
  // Student Performance Dashboard
  getStudentPerformance: () => api.get('/parent-dashboard/student_performance/'),
  
  getStudentDetail: (studentId: number) => api.get(`/parent-dashboard/student/${studentId}/`),
  
  // Parent-Teacher Chats
  getMyChats: () => api.get('/parent-teacher-chats/my_chats/'),
  
  getAllChats: () => api.get('/parent-teacher-chats/'),
  
  getChat: (id: number) => api.get(`/parent-teacher-chats/${id}/`),
  
  startChat: (data: { teacher_id: number; student_id: number; subject?: string }) =>
    api.post('/parent-teacher-chats/start_chat/', data),
  
  getChatMessages: (chatId: number) => api.get(`/parent-teacher-chats/${chatId}/messages/`),
  
  sendMessage: (chatId: number, data: { message?: string; file_attachment?: File }) => {
    const formData = new FormData();
    if (data.message) formData.append('message', data.message);
    if (data.file_attachment) formData.append('file_attachment', data.file_attachment);
    
    return api.post(`/parent-teacher-chats/${chatId}/send_message/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  markChatRead: (chatId: number) => api.post(`/parent-teacher-chats/${chatId}/mark-read/`),
  
  // Message Management
  editMessage: (messageId: number, message: string) =>
    api.patch(`/parent-teacher-messages/${messageId}/edit/`, { message }),
  
  markMessageRead: (messageId: number) => api.post(`/parent-teacher-messages/${messageId}/mark-read/`),
  
  deleteMessage: (messageId: number) => api.delete(`/parent-teacher-messages/${messageId}/`),
};

// Teaching Plan API (Timeline/Calendar feature)
export const teachingPlanAPI = {
  // Get all teaching plans (filtered by role)
  getAll: () => api.get('/teaching-plans/'),
  
  // Get teaching plans grouped by teacher (for students/advisors)
  getMyTeachers: () => api.get('/teaching-plans/my_teachers/'),
  
  // Get specific teaching plan
  get: (id: number) => api.get(`/teaching-plans/${id}/`),
  
  // Create teaching plan (teachers only)
  create: (data: {
    title: string;
    description?: string;
    subject: string;
    grade_level: string;
    lesson?: number;
    date: string;
    time?: string;
    status?: 'planned' | 'taught' | 'cancelled';
    duration_minutes?: number;
    notes?: string;
    completion_notes?: string;
  }) => api.post('/teaching-plans/', data),
  
  // Update teaching plan (teachers only)
  update: (id: number, data: {
    title?: string;
    description?: string;
    subject?: string;
    grade_level?: string;
    lesson?: number;
    date?: string;
    time?: string;
    status?: 'planned' | 'taught' | 'cancelled';
    duration_minutes?: number;
    notes?: string;
    completion_notes?: string;
  }) => api.patch(`/teaching-plans/${id}/`, data),
  
  // Delete teaching plan (teachers only)
  delete: (id: number) => api.delete(`/teaching-plans/${id}/`),
};

// Administrator API
export const administratorAPI = {
  // Dashboard Statistics
  getDashboardStats: () => api.get('/administrator/dashboard_stats/'),
  
  // School Management
  getAllSchools: () => api.get('/administrator/all_schools/'),
  createSchool: (data: { name: string; address?: string }) => 
    api.post('/administrator/create_school/', data),
  updateSchool: (schoolId: number, data: { name?: string; address?: string }) => 
    api.patch(`/administrator/${schoolId}/update_school/`, data),
  deleteSchool: (schoolId: number) => 
    api.delete(`/administrator/${schoolId}/delete_school/`),
  
  // User Management (CRUD for all user types)
  getAllUsers: (params?: { role?: string; school_id?: number; search?: string }) => 
    api.get('/administrator/all_users/', { params }),
  createUser: (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: 'teacher' | 'student' | 'advisor' | 'parent' | 'admin' | 'director';
    school: number;
    date_of_birth?: string;
    phone?: string;
    subjects?: string[];
  }) => api.post('/administrator/create_user/', data),
  updateUser: (userId: number, data: any) => 
    api.patch(`/administrator/${userId}/update_user/`, data),
  deleteUser: (userId: number) => 
    api.delete(`/administrator/${userId}/delete_user/`),
  
  // Performance Metrics
  getTeacherPerformance: (params?: { school_id?: number; subject?: string }) => 
    api.get('/administrator/teacher_performance/', { params }),
  getAdvisorPerformance: (params?: { school_id?: number }) => 
    api.get('/administrator/advisor_performance/', { params }),
  
  // Reviews and Feedback
  getAllReviews: (params?: { type?: 'advisor' | 'student' | 'teacher'; school_id?: number }) => 
    api.get('/administrator/all_reviews/', { params }),
  getAdvisorTeachersNotes: (params?: { advisor_id?: number; teacher_id?: number }) => 
    api.get('/administrator/advisor_teachers_notes/', { params }),
  
  // Advisor-Teacher Assignments
  getAdvisorTeacherAssignments: (params?: { school_id?: number }) => 
    api.get('/administrator/advisor_teacher_assignments/', { params }),
  
  // School Map Data
  getSchoolsMap: (params?: { type?: string; delegation?: string; cre?: string; search?: string }) => 
    api.get('/administrator/schools_map/', { params }),
  
  // Analytics Endpoints
  getNationalKPIDashboard: () => 
    api.get('/administrator/national_kpi_dashboard/'),
  getRegionalPerformance: () => 
    api.get('/administrator/regional_performance/'),
  getCurriculumEffectiveness: () => 
    api.get('/administrator/curriculum_effectiveness/'),
  getAtRiskStudents: () => 
    api.get('/administrator/at_risk_students/'),
  getTeacherQualityMetrics: () =>
    api.get('/administrator/teacher_quality_metrics/'),
  
  // Export endpoints - return URL for download
  exportRegionalPerformance: () => 
    `${API_BASE_URL}/administrator/export_regional_performance/`,
  exportCurriculumEffectiveness: () => 
    `${API_BASE_URL}/administrator/export_curriculum_effectiveness/`,
  exportAtRiskStudents: () => 
    `${API_BASE_URL}/administrator/export_at_risk_students/`,
};

// Vault API - Lesson plan sharing system
export const vaultAPI = {
  // Lesson Plans
  getAll: (params?: { subject?: string; grade_level?: string; tags?: string }) =>
    api.get('/vault-lesson-plans/', { params }),
  
  getById: (id: number) =>
    api.get(`/vault-lesson-plans/${id}/`),
  
  getBySubject: () =>
    api.get('/vault-lesson-plans/by_subject/'),
  
  getFeatured: () =>
    api.get('/vault-lesson-plans/featured/'),
  
  getMyContributions: () =>
    api.get('/vault-lesson-plans/my_contributions/'),
  
  create: (data: {
    title: string;
    description: string;
    content: string;
    subject: string;
    grade_level: string;
    objectives?: string[];
    materials_needed?: string[];
    duration_minutes?: number;
    tags?: string[];
  }) =>
    api.post('/vault-lesson-plans/', data),
  
  update: (id: number, data: Partial<{
    title: string;
    description: string;
    content: string;
    subject: string;
    grade_level: string;
    objectives: string[];
    materials_needed: string[];
    duration_minutes: number;
    tags: string[];
    is_featured: boolean;
  }>) =>
    api.patch(`/vault-lesson-plans/${id}/`, data),
  
  delete: (id: number) =>
    api.delete(`/vault-lesson-plans/${id}/`),
  
  incrementView: (id: number) =>
    api.post(`/vault-lesson-plans/${id}/increment_view/`),
  
  usePlan: (id: number, data: { notes?: string; rating?: number; feedback?: string }) =>
    api.post(`/vault-lesson-plans/${id}/use_plan/`, data),
  
  generateLesson: (id: number, data: { scheduled_date?: string; notes?: string; rating?: number; feedback?: string }) =>
    api.post(`/vault-lesson-plans/${id}/generate_lesson/`, data),
  
  // Usage
  getUsage: (lessonPlanId?: number) =>
    api.get('/vault-usage/', { params: { lesson_plan: lessonPlanId } }),
  
  getMyUsage: () =>
    api.get('/vault-usage/my_usage/'),
  
  createUsage: (data: {
    lesson_plan: number;
    notes?: string;
    rating?: number;
    feedback?: string;
  }) =>
    api.post('/vault-usage/', data),
  
  // Comments
  getComments: (lessonPlanId: number, includeReplies = false) =>
    api.get('/vault-comments/', { 
      params: { lesson_plan: lessonPlanId, include_replies: includeReplies } 
    }),
  
  getReplies: (commentId: number) =>
    api.get(`/vault-comments/${commentId}/replies/`),
  
  createComment: (data: { lesson_plan: number; comment: string; parent_comment?: number }) =>
    api.post('/vault-comments/', data),
  
  updateComment: (id: number, comment: string) =>
    api.patch(`/vault-comments/${id}/`, { comment }),
  
  deleteComment: (id: number) =>
    api.delete(`/vault-comments/${id}/`),

  // AI Generation
  generateYearly: (formData: FormData) =>
    api.post('/vault-lesson-plans/generate_yearly/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  generateSingle: (formData: FormData) =>
    api.post('/vault-lesson-plans/generate_single/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Import
  importFromTeacher: (data: { lesson_id: number }) =>
    api.post('/vault-lesson-plans/import_from_teacher/', data),

  // Exercises
  getExercises: (params?: { vault_lesson_plan?: number; exercise_type?: string; difficulty?: string }) =>
    api.get('/vault-exercises/', { params }),
  
  getExerciseById: (id: number) =>
    api.get(`/vault-exercises/${id}/`),
  
  createExercise: (data: {
    vault_lesson_plan: number;
    title: string;
    description?: string;
    exercise_type: 'mcq' | 'qa';
    questions: any[];
    num_questions: number;
    time_limit?: number;
    difficulty_level?: 'easy' | 'medium' | 'hard';
  }) =>
    api.post('/vault-exercises/', data),
  
  updateExercise: (id: number, data: Partial<{
    title: string;
    description: string;
    questions: any[];
    time_limit: number;
    difficulty_level: string;
  }>) =>
    api.patch(`/vault-exercises/${id}/`, data),
  
  deleteExercise: (id: number) =>
    api.delete(`/vault-exercises/${id}/`),
  
  incrementExerciseUsage: (id: number) =>
    api.post(`/vault-exercises/${id}/increment_usage/`),
  
  createTestFromExercise: (exerciseId: number, lessonId: number) =>
    api.post(`/vault-exercises/${exerciseId}/create_test_from_exercise/`, {
      lesson_id: lessonId
    }),
  
  generateExerciseWithAI: (data: {
    vault_lesson_plan_id: number;
    exercise_type: 'mcq' | 'qa';
    title: string;
    num_questions: number;
    difficulty_level: 'easy' | 'medium' | 'hard';
  }) =>
    api.post('/vault-exercises/generate_with_ai/', data),

  // Materials
  getMaterials: (params?: { vault_lesson_plan?: number; material_type?: string }) =>
    api.get('/vault-materials/', { params }),
  
  getMaterialById: (id: number) =>
    api.get(`/vault-materials/${id}/`),
  
  createMaterial: (formData: FormData) =>
    api.post('/vault-materials/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  updateMaterial: (id: number, formData: FormData) =>
    api.patch(`/vault-materials/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deleteMaterial: (id: number) =>
    api.delete(`/vault-materials/${id}/`),
  
  downloadMaterial: (id: number) =>
    api.get(`/vault-materials/${id}/download/`),
  
  incrementMaterialDownload: (id: number) =>
    api.post(`/vault-materials/${id}/increment_download/`),
};

// Director API for managing teacher-grade assignments
export const directorAPI = {
  // Get overview of all assignments in school
  getAssignmentsOverview: () => 
    api.get('/teacher-grade-assignments/overview/'),
  
  // Get list of teachers available for assignment
  getAvailableTeachers: (subject?: string) => 
    api.get('/teacher-grade-assignments/teachers/', { 
      params: subject ? { subject } : undefined 
    }),
  
  // Get all assignments (with optional filters)
  getAssignments: (params?: { 
    grade_level?: string; 
    subject?: string; 
    academic_year?: string;
    is_active?: boolean;
  }) => api.get('/teacher-grade-assignments/', { params }),
  
  // Create single assignment
  createAssignment: (data: {
    teacher: number;
    grade_level: string;
    subject: string;
    academic_year?: string;
    notes?: string;
  }) => api.post('/teacher-grade-assignments/', data),
  
  // Update assignment
  updateAssignment: (id: number, data: {
    grade_level?: string;
    subject?: string;
    is_active?: boolean;
    notes?: string;
  }) => api.patch(`/teacher-grade-assignments/${id}/`, data),
  
  // Delete assignment
  deleteAssignment: (id: number) => 
    api.delete(`/teacher-grade-assignments/${id}/`),
  
  // Bulk assign multiple teachers
  bulkAssign: (assignments: Array<{
    teacher: number;
    grade_level: string;
    subject: string;
    academic_year?: string;
    notes?: string;
  }>) => api.post('/teacher-grade-assignments/bulk-assign/', { assignments }),
  
  // Timetable Management
  getTeacherTimetable: (teacherId: number) =>
    api.get(`/teacher-timetables/by-teacher/${teacherId}/`),
  
  createTimetable: (data: {
    teacher: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active?: boolean;
  }) => api.post('/teacher-timetables/', data),
  
  updateTimetable: (id: number, data: {
    start_time?: string;
    end_time?: string;
    is_active?: boolean;
  }) => api.patch(`/teacher-timetables/${id}/`, data),
  
  deleteTimetable: (id: number) =>
    api.delete(`/teacher-timetables/${id}/`),
  
  bulkCreateTimetable: (schedules: Array<{
    teacher: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active?: boolean;
  }>) => api.post('/teacher-timetables/bulk-create/', { schedules }),
};

// Student Notebook API
export const notebookAPI = {
  // Get student's notebook
  getMyNotebook: () => 
    api.get('/student-notebooks/my_notebook/'),
  
  // Get all pages from student's notebook
  getMyPages: () => 
    api.get('/notebook-pages/my_pages/'),
  
  // Get or create today's page
  getTodayPage: () => 
    api.get('/notebook-pages/today_page/'),
  
  // Create a new page (DEPRECATED - use createStudentPage for teachers)
  createPage: (data: {
    date: string;
    lesson_name?: string;
    exercises_answers?: string;
    notes?: string;
  }) => api.post('/notebook-pages/', data),
  
  // Teacher: Create a page for a student with exercises
  createStudentPage: (data: {
    student_id: number;
    date: string;
    lesson_name?: string;
    exercises_set_by_teacher?: string;
  }) => api.post('/notebook-pages/create_student_page/', data),
  
  // Update a page
  updatePage: (id: number, data: {
    lesson_name?: string;
    exercises_answers?: string;
    notes?: string;
  }) => api.patch(`/notebook-pages/${id}/`, data),
  
  // Teacher: Get pages for a specific student
  getStudentPages: (student_id: number) => 
    api.get('/notebook-pages/student_pages/', { params: { student_id } }),
  
  // Teacher: Add comment to a page
  addTeacherComment: (id: number, comment: string) => 
    api.post(`/notebook-pages/${id}/add_teacher_comment/`, { comment }),
  
  // Teacher: Mark answer as correct/incorrect/partial
  markAnswer: (id: number, answer_status: 'pending' | 'correct' | 'incorrect' | 'partial') => 
    api.post(`/notebook-pages/${id}/mark_answer/`, { answer_status }),
  
  // Teacher: Set exercises for a specific page
  setExercises: (id: number, exercises: string) => 
    api.patch(`/notebook-pages/${id}/`, { exercises_set_by_teacher: exercises }),
  
  // Get all notebook pages (for teachers/admins)
  getAllPages: () => 
    api.get('/notebook-pages/'),
};

export const cnpAPI = {
  // Get all teacher guides (with filters)
  getAllGuides: (params?: {
    subject?: string;
    grade_level?: string;
    guide_type?: string;
    status?: string;
    academic_year?: string;
    search?: string;
  }) => api.get('/cnp-teacher-guides/', { params }),

  // Get dashboard statistics
  getDashboardStats: () => api.get('/cnp-teacher-guides/dashboard_stats/'),

  // Get single guide
  getGuide: (id: number) => api.get(`/cnp-teacher-guides/${id}/`),

  // Create new guide (FormData for file upload)
  createGuide: (data: FormData) => api.post('/cnp-teacher-guides/', data),

  // Update guide
  updateGuide: (id: number, data: FormData) => api.patch(`/cnp-teacher-guides/${id}/`, data),

  // Delete guide
  deleteGuide: (id: number) => api.delete(`/cnp-teacher-guides/${id}/`),

  // Approve guide (admin/cnp)
  approveGuide: (id: number, admin_notes?: string) => 
    api.post(`/cnp-teacher-guides/${id}/approve/`, { admin_notes }),

  // Archive guide
  archiveGuide: (id: number, admin_notes?: string) => 
    api.post(`/cnp-teacher-guides/${id}/archive/`, { admin_notes }),

  // Download guide
  downloadGuide: (id: number) => api.get(`/cnp-teacher-guides/${id}/download/`),

  // Get guides available for lesson generation
  getAvailableForGeneration: (params?: {
    subject?: string;
    grade_level?: string;
    guide_type?: string;
  }) => api.get('/cnp-teacher-guides/available_for_generation/', { params }),
};

// ============================================================
// INSPECTION SYSTEM API
// ============================================================

export const inspectionAPI = {
  // Regions
  getRegions: () => api.get('/inspection/regions/'),
  getRegion: (id: number) => api.get(`/inspection/regions/${id}/`),

  // Inspector Dashboard
  getInspectorStats: () => api.get('/inspection/inspector-dashboard/stats/'),
  getUpcomingVisits: () => api.get('/inspection/inspector-dashboard/upcoming_visits/'),
  getAssignedTeachers: (page?: number) => 
    api.get('/inspection/inspector-dashboard/assigned_teachers/', { params: { page } }),

  // GPI Dashboard
  getGPIStats: () => api.get('/inspection/gpi-dashboard/stats/'),
  getPendingReports: () => api.get('/inspection/gpi-dashboard/pending_reports/'),
  getPendingMonthlyReports: () => api.get('/inspection/gpi-dashboard/pending_monthly_reports/'),
  getAllInspectors: () => api.get('/inspection/gpi-dashboard/inspectors/'),

  // Complaints
  getComplaints: (params?: { page?: number }) => 
    api.get('/inspection/complaints/', { params }),
  getComplaint: (id: number) => api.get(`/inspection/complaints/${id}/`),
  createComplaint: (data: Partial<any>) => api.post('/inspection/complaints/', data),
  updateComplaint: (id: number, data: Partial<any>) => 
    api.patch(`/inspection/complaints/${id}/`, data),
  deleteComplaint: (id: number) => api.delete(`/inspection/complaints/${id}/`),
  assignInspector: (id: number, inspector_id: number) => 
    api.post(`/inspection/complaints/${id}/assign_inspector/`, { inspector_id }),
  resolveComplaint: (id: number, resolution_notes: string) => 
    api.post(`/inspection/complaints/${id}/resolve/`, { resolution_notes }),

  // Visits
  getVisits: (params?: { page?: number; status?: string }) => 
    api.get('/inspection/visits/', { params }),
  getVisit: (id: number) => api.get(`/inspection/visits/${id}/`),
  createVisit: (data: Partial<any>) => api.post('/inspection/visits/', data),
  updateVisit: (id: number, data: Partial<any>) => 
    api.patch(`/inspection/visits/${id}/`, data),
  deleteVisit: (id: number) => api.delete(`/inspection/visits/${id}/`),
  markVisitCompleted: (id: number) => api.post(`/inspection/visits/${id}/mark_completed/`),
  cancelVisit: (id: number, cancellation_reason: string) => 
    api.post(`/inspection/visits/${id}/cancel/`, { cancellation_reason }),

  // Reports
  getReports: (params?: { page?: number; gpi_status?: string }) => 
    api.get('/inspection/reports/', { params }),
  getReport: (id: number) => api.get(`/inspection/reports/${id}/`),
  createReport: (data: Partial<any>) => api.post('/inspection/reports/', data),
  updateReport: (id: number, data: Partial<any>) => 
    api.patch(`/inspection/reports/${id}/`, data),
  deleteReport: (id: number) => api.delete(`/inspection/reports/${id}/`),
  approveReport: (id: number, feedback?: string) => 
    api.post(`/inspection/reports/${id}/approve/`, { feedback }),
  rejectReport: (id: number, feedback: string) => 
    api.post(`/inspection/reports/${id}/reject/`, { feedback }),
  requestRevision: (id: number, feedback: string) => 
    api.post(`/inspection/reports/${id}/request_revision/`, { feedback }),

  // Monthly Reports
  getMonthlyReports: (params?: { page?: number; status?: string }) => 
    api.get('/inspection/monthly-reports/', { params }),
  getMonthlyReport: (id: number) => api.get(`/inspection/monthly-reports/${id}/`),
  createMonthlyReport: (data: Partial<any>) => api.post('/inspection/monthly-reports/', data),
  updateMonthlyReport: (id: number, data: Partial<any>) => 
    api.patch(`/inspection/monthly-reports/${id}/`, data),
  deleteMonthlyReport: (id: number) => api.delete(`/inspection/monthly-reports/${id}/`),
  generateMonthlyStats: (id: number) => 
    api.post(`/inspection/monthly-reports/${id}/generate_stats/`),
  submitMonthlyReport: (id: number) => 
    api.post(`/inspection/monthly-reports/${id}/submit/`),
  approveMonthlyReport: (id: number, feedback?: string) => 
    api.post(`/inspection/monthly-reports/${id}/approve/`, { feedback }),

  // Rating History
  getRatingHistory: (params?: { teacher_id?: number; inspector_id?: number; page?: number }) => 
    api.get('/inspection/rating-history/', { params }),
  getTeacherAverage: (teacher_id: number) => 
    api.get('/inspection/rating-history/teacher_average/', { params: { teacher_id } }),
  getTeacherTrend: (teacher_id: number, months?: number) => 
    api.get('/inspection/rating-history/teacher_trend/', { 
      params: { teacher_id, months: months || 6 } 
    }),
};

export default api;

