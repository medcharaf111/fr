import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import DelegatorMapView from '@/components/DelegatorMapView';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { authAPI } from '@/lib/api';
import api from '@/lib/api';
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Languages
} from 'lucide-react';

interface DelegationStats {
  total_teachers_assigned: number;
  teachers_needing_attention: number;
  total_inspections_conducted: number;
  inspections_this_month: number;
  pending_inspections: number;
  average_teacher_score: number;
  teachers_improving: number;
  teachers_declining: number;
  pending_reviews: number;
}

interface Teacher {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  school_name: string;
  subjects_display: string[];
  phone: string;
}

interface TeacherMetrics {
  teacher: Teacher;
  total_inspections: number;
  last_inspection_date: string | null;
  average_inspection_score: number;
  improvement_trend: 'improving' | 'stable' | 'declining' | 'new';
  latest_review_score: number | null;
  needs_attention: boolean;
}

interface Inspection {
  id: number;
  teacher: Teacher;
  advisor?: Advisor;
  advisor_name?: string;
  delegator_name: string;
  school_name: string;
  subject: string;
  subject_display: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  purpose: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  status_display: string;
  has_review: boolean;
  review?: InspectionReview;
}

interface InspectionReview {
  id: number;
  teaching_quality: number;
  lesson_planning: number;
  student_engagement: number;
  classroom_management: number;
  content_knowledge: number;
  use_of_resources: number;
  overall_score: number;
  strengths: string;
  areas_for_improvement: string;
  specific_observations: string;
  recommendations: string;
  requires_follow_up: boolean;
  follow_up_date: string | null;
  submitted_at: string;
}

interface AdvisorStats {
  assigned_teachers_count: number;
  completed_inspections: number;
  pending_reviews: number;
  avg_teacher_score: number;
  inspections_this_month: number;
  upcoming_inspections: number;
}

interface Advisor {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  subjects_display: string[];
  stats?: AdvisorStats;
}

interface TeacherAdvisorAssignment {
  id: number;
  teacher: Teacher;
  advisor: Advisor;
  assigned_by_name: string;
  school_name: string;
  subject: string;
  subject_display: string;
  is_active: boolean;
  notes: string;
  assigned_at: string;
}

const DelegationDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language, setLanguage, dir } = useLanguage();
  const [user, setUser] = useState(authAPI.getCurrentUser());
  const [loading, setLoading] = useState(false);
  
  // State
  const [stats, setStats] = useState<DelegationStats | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [assignments, setAssignments] = useState<TeacherAdvisorAssignment[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherMetrics, setTeacherMetrics] = useState<TeacherMetrics | null>(null);
  const [teacherInspections, setTeacherInspections] = useState<Inspection[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advisorSearchQuery, setAdvisorSearchQuery] = useState('');
  
  // Dialog state
  const [createInspectionOpen, setCreateInspectionOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [assignAdvisorOpen, setAssignAdvisorOpen] = useState(false);
  
  // Form state
  const [inspectionForm, setInspectionForm] = useState({
    teacher_id: 0,
    advisor_id: 0,
    subject: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    purpose: '',
    pre_inspection_notes: '',
  });
  
  const [reviewForm, setReviewForm] = useState({
    inspection: 0,
    teaching_quality: 3,
    lesson_planning: 3,
    student_engagement: 3,
    classroom_management: 3,
    content_knowledge: 3,
    use_of_resources: 3,
    strengths: '',
    areas_for_improvement: '',
    specific_observations: '',
    recommendations: '',
    requires_follow_up: false,
    follow_up_date: '',
  });
  
  const [assignmentForm, setAssignmentForm] = useState({
    teacher_id: 0,
    advisor_id: 0,
    subject: '',
    notes: '',
  });

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || currentUser.role !== 'delegation') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsResponse = await api.get('/delegation-dashboard/overview/');
      setStats(statsResponse.data.stats);
      setInspections(statsResponse.data.recent_inspections || []);
      
      // Fetch teachers
      const teachersResponse = await api.get('/delegation-teachers/');
      setTeachers(teachersResponse.data || []);
      
      // Fetch advisors
      const advisorsResponse = await api.get('/delegation-advisors/');
      setAdvisors(advisorsResponse.data || []);
      
      // Fetch assignments
      const assignmentsResponse = await api.get('/teacher-advisor-assignments/');
      setAssignments(assignmentsResponse.data || []);
      
      toast({
        title: t('common.success'),
        description: t('welcome.inspection'),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherDetails = async (teacher: Teacher) => {
    setLoading(true);
    try {
      // Fetch teacher metrics
      const metricsResponse = await api.get(`/delegation-teachers/${teacher.id}/metrics/`);
      setTeacherMetrics(metricsResponse.data);
      
      // Fetch teacher inspections
      const inspectionsResponse = await api.get(`/delegation-teachers/${teacher.id}/inspections/`);
      setTeacherInspections(inspectionsResponse.data || []);
      
      setSelectedTeacher(teacher);
      setViewDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching teacher details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teacher details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInspection = async () => {
    if (!inspectionForm.teacher_id || !inspectionForm.subject || !inspectionForm.scheduled_date || !inspectionForm.purpose) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare payload - send null for advisor_id if not selected (0)
      const payload = {
        ...inspectionForm,
        advisor_id: inspectionForm.advisor_id === 0 ? null : inspectionForm.advisor_id,
      };
      
      await api.post('/teacher-inspections/', payload);
      
      toast({
        title: 'Success',
        description: 'Inspection scheduled successfully',
      });
      
      setCreateInspectionOpen(false);
      setInspectionForm({
        teacher_id: 0,
        advisor_id: 0,
        subject: '',
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        purpose: '',
        pre_inspection_notes: '',
      });
      
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error creating inspection:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message
        || Object.values(error.response?.data || {}).flat().join(', ')
        || 'Failed to schedule inspection';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.inspection) {
      toast({
        title: 'Error',
        description: 'No inspection selected',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/inspection-reviews/', reviewForm);
      
      toast({
        title: 'Success',
        description: 'Review submitted successfully',
      });
      
      setReviewDialogOpen(false);
      setSelectedInspection(null);
      
      // Reset form
      setReviewForm({
        inspection: 0,
        teaching_quality: 3,
        lesson_planning: 3,
        student_engagement: 3,
        classroom_management: 3,
        content_knowledge: 3,
        use_of_resources: 3,
        strengths: '',
        areas_for_improvement: '',
        specific_observations: '',
        recommendations: '',
        requires_follow_up: false,
        follow_up_date: '',
      });
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartInspection = async (inspection: Inspection) => {
    try {
      await api.post(`/teacher-inspections/${inspection.id}/start/`);
      toast({
        title: 'Success',
        description: 'Inspection started',
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error starting inspection:', error);
      toast({
        title: 'Error',
        description: 'Failed to start inspection',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteInspection = async (inspection: Inspection) => {
    try {
      await api.post(`/teacher-inspections/${inspection.id}/complete/`);
      toast({
        title: 'Success',
        description: 'Inspection completed. You can now submit a review.',
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error completing inspection:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete inspection',
        variant: 'destructive',
      });
    }
  };

  const openReviewDialog = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setReviewForm({
      ...reviewForm,
      inspection: inspection.id,
    });
    setReviewDialogOpen(true);
  };

  const handleAssignAdvisor = async () => {
    if (!assignmentForm.teacher_id || !assignmentForm.advisor_id || !assignmentForm.subject) {
      toast({
        title: 'Missing Fields',
        description: 'Please select teacher, advisor, and subject',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Sending assignment:', assignmentForm);
      const response = await api.post('/teacher-advisor-assignments/', assignmentForm);
      console.log('Assignment response:', response.data);
      
      toast({
        title: 'Success',
        description: 'Advisor assigned successfully',
      });
      
      setAssignAdvisorOpen(false);
      setAssignmentForm({
        teacher_id: 0,
        advisor_id: 0,
        subject: '',
        notes: '',
      });
      
      // Refresh assignments and dashboard data
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error assigning advisor:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message
        || JSON.stringify(error.response?.data || {})
        || 'Failed to assign advisor';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssignment = async (assignmentId: number, isActive: boolean) => {
    setLoading(true);
    try {
      const action = isActive ? 'deactivate' : 'activate';
      await api.post(`/teacher-advisor-assignments/${assignmentId}/${action}/`);
      
      toast({
        title: 'Success',
        description: `Assignment ${isActive ? 'deactivated' : 'activated'} successfully`,
      });
      
      // Refresh assignments
      const assignmentsResponse = await api.get('/teacher-advisor-assignments/');
      setAssignments(assignmentsResponse.data || []);
    } catch (error) {
      console.error('Error toggling assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInspections = inspections.filter(inspection =>
    (statusFilter === 'all' || inspection.status === statusFilter)
  );

  const filteredAdvisors = advisors.filter(advisor =>
    advisor.full_name.toLowerCase().includes(advisorSearchQuery.toLowerCase()) ||
    advisor.email.toLowerCase().includes(advisorSearchQuery.toLowerCase())
  );

  const getTrendBadge = (trend: string) => {
    const variants: Record<string, { color: string; icon: JSX.Element }> = {
      improving: { color: 'bg-green-100 text-green-800', icon: <TrendingUp className="h-3 w-3" /> },
      stable: { color: 'bg-blue-100 text-blue-800', icon: <Award className="h-3 w-3" /> },
      declining: { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-3 w-3" /> },
      new: { color: 'bg-gray-100 text-gray-800', icon: <Users className="h-3 w-3" /> },
    };
    
    const variant = variants[trend] || variants.new;
    
    return (
      <Badge className={variant.color}>
        {variant.icon}
        <span className="ml-1">{trend}</span>
      </Badge>
    );
  };

  return (
    <DashboardLayout userRole={user?.role || 'delegation'} userName={user?.username || ''}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('delegationDash.title')}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="gap-2"
          >
            <Languages className="h-4 w-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </Button>
        </div>
        
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title={t('delegationDash.stats.totalTeachers')}
              value={stats.total_teachers_assigned}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title={t('delegationDash.stats.needingAttention')}
              value={stats.teachers_needing_attention}
              icon={AlertTriangle}
              color="red"
            />
            <StatsCard
              title={t('delegationDash.stats.pendingInspections')}
              value={stats.pending_inspections}
              icon={Calendar}
              color="orange"
            />
            <StatsCard
              title={t('delegationDash.stats.avgTeacherScore')}
              value={stats.average_teacher_score.toFixed(1) + '/5'}
              icon={Award}
              color="green"
            />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="teachers" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-2">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-1 bg-transparent h-auto">
              <TabsTrigger 
                value="teachers"
                className="flex-col h-auto py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('delegationDash.tabs.teachers')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="inspections"
                className="flex-col h-auto py-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
              >
                <ClipboardCheck className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('delegationDash.tabs.inspections')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="advisors"
                className="flex-col h-auto py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
              >
                <UserCheck className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('delegationDash.tabs.advisors')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="flex-col h-auto py-3 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
              >
                <FileText className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('delegationDash.tabs.reviews')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="map"
                className="flex-col h-auto py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
              >
                <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-xs font-medium">{t('delegationDash.tabs.map')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('delegationDash.teachers.title')}</CardTitle>
                    <CardDescription>{t('delegationDash.teachers.description')}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('delegationDash.teachers.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTeachers.map((teacher) => (
                    <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{teacher.full_name}</h3>
                            <p className="text-sm text-gray-500">{teacher.email}</p>
                            <div className="flex gap-2 mt-2">
                              {teacher.subjects_display.map((subject, idx) => (
                                <Badge key={idx} variant="outline">{subject}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchTeacherDetails(teacher)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {t('delegationDash.teachers.viewDetails')}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setInspectionForm({ ...inspectionForm, teacher_id: teacher.id });
                                setCreateInspectionOpen(true);
                              }}
                            >
                              <ClipboardCheck className="h-4 w-4 mr-1" />
                              {t('delegationDash.teachers.scheduleInspection')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredTeachers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{t('delegationDash.teachers.noTeachers')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inspections Tab */}
          <TabsContent value="inspections" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('delegationDash.inspections.title')}</CardTitle>
                    <CardDescription>{t('delegationDash.inspections.description')}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={t('delegationDash.inspections.filterStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('delegationDash.inspections.all')}</SelectItem>
                        <SelectItem value="scheduled">{t('delegationDash.inspections.scheduled')}</SelectItem>
                        <SelectItem value="in_progress">{t('delegationDash.inspections.inProgress')}</SelectItem>
                        <SelectItem value="completed">{t('delegationDash.inspections.completed')}</SelectItem>
                        <SelectItem value="cancelled">{t('delegationDash.inspections.cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setCreateInspectionOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t('delegationDash.inspections.newInspection')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredInspections.map((inspection) => (
                    <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{inspection.teacher.full_name}</h3>
                              <Badge className={
                                inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
                                inspection.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                inspection.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {inspection.status_display}
                              </Badge>
                              {inspection.has_review && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {t('delegationDash.inspections.reviewed')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{inspection.subject_display}</p>
                            <p className="text-sm text-gray-500">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {new Date(inspection.scheduled_date).toLocaleDateString()}
                              {inspection.scheduled_time && ` at ${inspection.scheduled_time}`}
                            </p>
                            {inspection.advisor_name && (
                              <p className="text-sm text-purple-600">
                                <UserCheck className="inline h-3 w-3 mr-1" />
                                {t('delegationDash.inspections.advisor')}: {inspection.advisor_name}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">{inspection.purpose}</p>
                          </div>
                          <div className="flex gap-2">
                            {/* Delegators cannot start/complete inspections - only advisors can */}
                            {inspection.status === 'scheduled' && inspection.advisor_name && (
                              <Badge variant="outline" className="text-xs">
                                {t('delegationDash.inspections.awaitingAdvisor')}
                              </Badge>
                            )}
                            {inspection.status === 'scheduled' && !inspection.advisor_name && (
                              <Badge variant="outline" className="text-xs text-amber-600">
                                {t('delegationDash.inspections.noAdvisor')}
                              </Badge>
                            )}
                            {inspection.status === 'in_progress' && (
                              <Badge variant="outline" className="text-xs text-blue-600">
                                {t('delegationDash.inspections.inProgressByAdvisor')}
                              </Badge>
                            )}
                            {inspection.status === 'completed' && !inspection.has_review && (
                              <Badge variant="outline" className="text-xs text-purple-600">
                                {t('delegationDash.inspections.awaitingReview')}
                              </Badge>
                            )}
                            {inspection.has_review && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedInspection(inspection);
                                  setViewDetailsOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {t('delegationDash.inspections.viewReview')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredInspections.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{t('delegationDash.inspections.noInspections')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advisors Tab */}
          <TabsContent value="advisors" className="space-y-4">
            {/* Search and Actions */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Advisors & Assignments</h2>
                <p className="text-gray-500">Manage advisor assignments and track performance</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search advisors..."
                  value={advisorSearchQuery}
                  onChange={(e) => setAdvisorSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button onClick={() => setAssignAdvisorOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Assign Advisor
                </Button>
              </div>
            </div>

            {/* Advisors Grid with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAdvisors.map((advisor) => (
                <Card key={advisor.id} className="hover:shadow-lg transition-all border-2 hover:border-purple-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{advisor.full_name}</CardTitle>
                        <p className="text-sm text-gray-500">{advisor.email}</p>
                        {advisor.phone && (
                          <p className="text-xs text-gray-400">{advisor.phone}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setInspectionForm({ ...inspectionForm, advisor_id: advisor.id });
                            setCreateInspectionOpen(true);
                          }}
                          title="Schedule Inspection"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setAssignmentForm({ ...assignmentForm, advisor_id: advisor.id });
                            setAssignAdvisorOpen(true);
                          }}
                          title="Assign to Teacher"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Subjects */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {advisor.subjects_display.map((subject, idx) => (
                        <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  
                  {advisor.stats && (
                    <CardContent className="pt-3 border-t">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Assigned Teachers */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-blue-700 font-medium">Teachers</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-900">{advisor.stats.assigned_teachers_count}</p>
                          <p className="text-xs text-blue-600">Assigned</p>
                        </div>

                        {/* Completed Inspections */}
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Inspections</span>
                          </div>
                          <p className="text-2xl font-bold text-green-900">{advisor.stats.completed_inspections}</p>
                          <p className="text-xs text-green-600">Completed</p>
                        </div>

                        {/* Upcoming Inspections */}
                        <div className="bg-orange-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="text-xs text-orange-700 font-medium">Upcoming</span>
                          </div>
                          <p className="text-2xl font-bold text-orange-900">{advisor.stats.upcoming_inspections}</p>
                          <p className="text-xs text-orange-600">Scheduled</p>
                        </div>

                        {/* Average Score */}
                        <div className="bg-purple-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-purple-700 font-medium">Avg Score</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-900">
                            {advisor.stats.avg_teacher_score > 0 ? advisor.stats.avg_teacher_score.toFixed(1) : 'N/A'}
                          </p>
                          <p className="text-xs text-purple-600">Out of 5.0</p>
                        </div>
                      </div>

                      {/* This Month Badge */}
                      {advisor.stats.inspections_this_month > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <Badge className="bg-indigo-100 text-indigo-800 w-full justify-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {advisor.stats.inspections_this_month} inspections this month
                          </Badge>
                        </div>
                      )}

                      {/* Pending Reviews Warning */}
                      {advisor.stats.pending_reviews > 0 && (
                        <div className="mt-2">
                          <Badge variant="destructive" className="w-full justify-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {advisor.stats.pending_reviews} pending reviews
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
              
              {filteredAdvisors.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <UserCheck className="h-16 w-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No advisors found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              )}
            </div>

            {/* Assignments Section */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Active Assignments</CardTitle>
                    <CardDescription>Teacher-Advisor assignments and their status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="space-y-3">
                    {assignments
                      .filter(a => a.is_active)
                      .map((assignment) => (
                        <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-sm">
                                    {assignment.teacher.full_name}
                                  </p>
                                  <p className="text-xs text-gray-500">Teacher</p>
                                </div>
                                <Badge className="bg-purple-100 text-purple-800">
                                  {assignment.subject_display}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <UserCheck className="h-3 w-3 mr-1" />
                                <span>{assignment.advisor.full_name}</span>
                              </div>
                              
                              {assignment.notes && (
                                <p className="text-xs text-gray-500 italic">{assignment.notes}</p>
                              )}
                              
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-xs text-gray-400">
                                  Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleAssignment(assignment.id, assignment.is_active)}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Deactivate
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    
                    {assignments.filter(a => a.is_active).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No active assignments</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Inactive Assignments */}
                  {assignments.filter(a => !a.is_active).length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-500 mb-2">Inactive Assignments</h4>
                      <div className="space-y-2">
                        {assignments
                          .filter(a => !a.is_active)
                          .map((assignment) => (
                            <Card key={assignment.id} className="opacity-60">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {assignment.teacher.full_name} → {assignment.advisor.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{assignment.subject_display}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleAssignment(assignment.id, assignment.is_active)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Reactivate
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submitted Reviews</CardTitle>
                <CardDescription>View all inspection reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Reviews section coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <DelegatorMapView />
          </TabsContent>
        </Tabs>

        {/* Create Inspection Dialog */}
        <Dialog open={createInspectionOpen} onOpenChange={setCreateInspectionOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Inspection</DialogTitle>
              <DialogDescription>Create a new teacher inspection</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Teacher *</Label>
                <Select
                  value={inspectionForm.teacher_id.toString()}
                  onValueChange={(value) => setInspectionForm({ ...inspectionForm, teacher_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select.teacher')} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.full_name} - {teacher.subjects_display.join(', ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subject *</Label>
                <Select
                  value={inspectionForm.subject}
                  onValueChange={(value) => setInspectionForm({ ...inspectionForm, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select.subject')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="social_studies">Social Studies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assign Advisor (Optional)</Label>
                <Select
                  value={inspectionForm.advisor_id ? inspectionForm.advisor_id.toString() : '0'}
                  onValueChange={(value) => setInspectionForm({ ...inspectionForm, advisor_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an advisor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No advisor</SelectItem>
                    {advisors.map((advisor) => (
                      <SelectItem key={advisor.id} value={advisor.id.toString()}>
                        {advisor.full_name} - {advisor.subjects_display.join(', ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={inspectionForm.scheduled_date}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, scheduled_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={inspectionForm.scheduled_time}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, scheduled_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={inspectionForm.duration_minutes}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, duration_minutes: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label>Purpose *</Label>
                <Textarea
                  placeholder="Describe the purpose and objectives of this inspection..."
                  value={inspectionForm.purpose}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, purpose: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Pre-Inspection Notes</Label>
                <Textarea
                  placeholder="Any notes before the inspection..."
                  value={inspectionForm.pre_inspection_notes}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, pre_inspection_notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateInspectionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInspection} disabled={loading}>
                {loading ? 'Scheduling...' : 'Schedule Inspection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submit Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Inspection Review</DialogTitle>
              <DialogDescription>
                {selectedInspection && `Review for ${selectedInspection.teacher.full_name}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Ratings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Teaching Quality (1-5)</Label>
                  <Select
                    value={reviewForm.teaching_quality.toString()}
                    onValueChange={(value) => setReviewForm({ ...reviewForm, teaching_quality: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Lesson Planning (1-5)</Label>
                  <Select
                    value={reviewForm.lesson_planning.toString()}
                    onValueChange={(value) => setReviewForm({ ...reviewForm, lesson_planning: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Student Engagement (1-5)</Label>
                  <Select
                    value={reviewForm.student_engagement.toString()}
                    onValueChange={(value) => setReviewForm({ ...reviewForm, student_engagement: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Classroom Management (1-5)</Label>
                  <Select
                    value={reviewForm.classroom_management.toString()}
                    onValueChange={(value) => setReviewForm({ ...reviewForm, classroom_management: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Content Knowledge (1-5)</Label>
                  <Select
                    value={reviewForm.content_knowledge.toString()}
                    onValueChange={(value) => setReviewForm({ ...reviewForm, content_knowledge: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Use of Resources (1-5)</Label>
                  <Select
                    value={reviewForm.use_of_resources.toString()}
                    onValueChange={(value) => setReviewForm({ ...reviewForm, use_of_resources: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Feedback fields */}
              <div>
                <Label>Strengths</Label>
                <Textarea
                  placeholder="Describe the teacher's strengths and positive aspects..."
                  value={reviewForm.strengths}
                  onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Areas for Improvement</Label>
                <Textarea
                  placeholder="Describe areas that need improvement..."
                  value={reviewForm.areas_for_improvement}
                  onChange={(e) => setReviewForm({ ...reviewForm, areas_for_improvement: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Specific Observations</Label>
                <Textarea
                  placeholder="Specific observations during the inspection..."
                  value={reviewForm.specific_observations}
                  onChange={(e) => setReviewForm({ ...reviewForm, specific_observations: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Recommendations</Label>
                <Textarea
                  placeholder="Recommendations for professional development..."
                  value={reviewForm.recommendations}
                  onChange={(e) => setReviewForm({ ...reviewForm, recommendations: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="requires_follow_up"
                  checked={reviewForm.requires_follow_up}
                  onChange={(e) => setReviewForm({ ...reviewForm, requires_follow_up: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="requires_follow_up">Requires Follow-up Inspection</Label>
              </div>

              {reviewForm.requires_follow_up && (
                <div>
                  <Label>Follow-up Date</Label>
                  <Input
                    type="date"
                    value={reviewForm.follow_up_date}
                    onChange={(e) => setReviewForm({ ...reviewForm, follow_up_date: e.target.value })}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReview} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Advisor Dialog */}
        <Dialog open={assignAdvisorOpen} onOpenChange={setAssignAdvisorOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Advisor to Teacher</DialogTitle>
              <DialogDescription>Create a new teacher-advisor assignment</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Teacher *</Label>
                <Select
                  value={assignmentForm.teacher_id > 0 ? assignmentForm.teacher_id.toString() : undefined}
                  onValueChange={(value) => setAssignmentForm({ ...assignmentForm, teacher_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select.teacher')} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.full_name} - {teacher.subjects_display.join(', ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Advisor *</Label>
                <Select
                  value={assignmentForm.advisor_id > 0 ? assignmentForm.advisor_id.toString() : undefined}
                  onValueChange={(value) => setAssignmentForm({ ...assignmentForm, advisor_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an advisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {advisors.map((advisor) => (
                      <SelectItem key={advisor.id} value={advisor.id.toString()}>
                        {advisor.full_name} - {advisor.subjects_display.join(', ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subject *</Label>
                <Select
                  value={assignmentForm.subject}
                  onValueChange={(value) => setAssignmentForm({ ...assignmentForm, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select.subject')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="social_studies">Social Studies</SelectItem>
                    <SelectItem value="islamic_studies">Islamic Studies</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="geography">Geography</SelectItem>
                    <SelectItem value="philosophy">Philosophy</SelectItem>
                    <SelectItem value="computer_science">Computer Science</SelectItem>
                    <SelectItem value="physical_education">Physical Education</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any additional notes about this assignment..."
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignAdvisorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignAdvisor} disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Advisor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Teacher Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Teacher Details</DialogTitle>
              {selectedTeacher && (
                <DialogDescription>
                  {selectedTeacher.full_name} - Performance Overview
                </DialogDescription>
              )}
            </DialogHeader>
            
            {teacherMetrics && (
              <div className="space-y-6">
                {/* Metrics Overview */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Inspections</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{teacherMetrics.total_inspections}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{teacherMetrics.average_inspection_score.toFixed(1)}/5</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getTrendBadge(teacherMetrics.improvement_trend)}
                    </CardContent>
                  </Card>
                </div>

                {/* Inspection History */}
                <div>
                  <h3 className="font-semibold mb-3">Inspection History</h3>
                  <div className="space-y-2">
                    {teacherInspections.map((inspection) => (
                      <Card key={inspection.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{inspection.subject_display}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(inspection.scheduled_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge>{inspection.status_display}</Badge>
                              {inspection.has_review && inspection.review && (
                                <span className="text-sm font-semibold">
                                  Score: {inspection.review.overall_score.toFixed(1)}/5
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DelegationDashboard;
