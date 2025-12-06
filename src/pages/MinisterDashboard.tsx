/**
 * Minister/Admin Analytics Dashboard
 * Comprehensive real-time analytics for ministerial oversight
 * Using real database data from backend analytics service
 */

import DarkModeToggle from '@/components/DarkModeToggle';
import DashboardHeader from '@/components/DashboardHeader';
import InspectorAssignmentManager from '@/components/InspectorAssignmentManager';
import { LanguageToggle } from '@/components/LanguageToggle';
import SchoolMapView from '@/components/SchoolMapView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import api, { authAPI } from '@/lib/api';
import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Edit,
  Loader2,
  RefreshCw,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  UserCog,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// Type definitions
interface OverallPerformance {
  totalStudents: number;
  totalTests: number;
  averageScore: number;
  passRate: number;
  excellenceRate: number;
}

interface QuestionDifficulty {
  easy: number;
  medium: number;
  hard: number;
  totalQuestions: number;
  averageCorrectRate: number;
}

interface WeeklyProgress {
  week: string;
  avgScore: number;
  students: number;
  weekStart: string;
  weekEnd: string;
}

interface StudentImprovement {
  improved: number;
  stable: number;
  declined: number;
  averageImprovement: string;
}

interface ContentQuality {
  totalLessonsCreated: number;
  aiGeneratedTests: number;
  vaultTests: number;
  avgQuestionsPerTest: number;
  approvalRate: number;
}

interface LessonPerformance {
  totalLessons: number;
  lessonsWithActivity: number;
  totalSubmissions: number;
  avgSubmissionsPerLesson: number;
  highEngagementLessons: number;
  engagementRate: number;
}

interface UserDistribution {
  teachers: number;
  students: number;
  parents: number;
  advisors: number;
  admins: number;
}

interface AnalyticsData {
  overallPerformance: OverallPerformance;
  questionDifficulty: QuestionDifficulty;
  learningProgress: WeeklyProgress[];
  studentImprovement: StudentImprovement;
  contentQuality: ContentQuality;
  lessonPerformance: LessonPerformance;
  userDistribution: UserDistribution;
  generatedAt: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'teacher' | 'student' | 'parent' | 'advisor' | 'admin' | 'delegation' | 'inspector' | 'gpi';
  school?: number;
  school_name?: string;
  is_active: boolean;
  assigned_delegation?: string;
  assigned_region?: string;
}

interface SubjectBreakdown {
  subject: string;
  count: number;
  teachers: any[];
  avg_quality_score: number;
  excellent: number;
  good: number;
  needs_improvement: number;
}

interface StudentDemographics {
  total_students: number;
  by_age: { age: number; count: number; male: number; female: number }[];
  by_region: { region: string; count: number; male: number; female: number }[];
  by_gender: { gender: string; count: number }[];
  by_grade: {
    grade: string;
    grade_value: string;
    total: number;
    male: number;
    female: number;
    male_percentage: number;
    female_percentage: number;
  }[];
}

interface MinistryHRData {
  total_employees: number;
  total_male: number;
  total_female: number;
  male_percentage: number;
  female_percentage: number;
  by_role: {
    role: string;
    count: number;
    male: number;
    female: number;
    male_percentage: number;
    female_percentage: number;
    median_age: number;
  }[];
  by_region: {
    region: string;
    count: number;
    male: number;
    female: number;
    male_percentage: number;
    female_percentage: number;
  }[];
  detailed_data: {
    region: string;
    role: string;
    count: number;
    male: number;
    female: number;
    male_female_ratio: string;
    median_age: number;
  }[];
}

const MinisterDashboard = () => {
  const { toast } = useToast();
  const { t, dir } = useLanguage();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // User Management State
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    role: '',
    is_active: true,
    assigned_delegation: '',
    assigned_region: '',
  });
  
  // HR Analytics State
  const [subjectBreakdown, setSubjectBreakdown] = useState<SubjectBreakdown[]>([]);
  const [studentDemographics, setStudentDemographics] = useState<StudentDemographics | null>(null);
  const [loadingHR, setLoadingHR] = useState(false);
  
  // Ministry HR State
  const [ministryHR, setMinistryHR] = useState<MinistryHRData | null>(null);
  const [loadingMinistryHR, setLoadingMinistryHR] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  
  const user = authAPI.getCurrentUser();

  // Helper function to translate role names
  const translateRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      'Primary School Teachers': t('minister.hr.role.primaryTeachers'),
      'Preparatory School Teachers': t('minister.hr.role.preparatoryTeachers'),
      'Secondary School Teachers': t('minister.hr.role.secondaryTeachers'),
      'Administrative staff': t('minister.hr.role.administrative'),
      'Technicians / Technical staff': t('minister.hr.role.technicians'),
      'Counselors (orientation & guidance)': t('minister.hr.role.counselors'),
      'Applied Counselors / Assessors (قيمون)': t('minister.hr.role.assessors'),
      'Supervisors & Directors': t('minister.hr.role.supervisors'),
      'Inspectors (all levels)': t('minister.hr.role.inspectors'),
      'Engineers': t('minister.hr.role.engineers'),
      'Other staff (contractors, janitors, technical assistants)': t('minister.hr.role.otherStaff'),
    };
    return roleMap[role] || role;
  };

  useEffect(() => {
    fetchAnalytics();
    fetchHRAnalytics();
    fetchMinistryHR();
  }, []);

  const fetchHRAnalytics = async () => {
    try {
      setLoadingHR(true);
      
      // Fetch teacher performance/subject breakdown
      const teachersRes = await api.get('/analytics/hr-teacher-performance/');
      setSubjectBreakdown(teachersRes.data.by_subject || []);
      
      // Fetch student demographics
      const studentsRes = await api.get('/analytics/hr-student-performance/');
      setStudentDemographics(studentsRes.data);
      
    } catch (err: any) {
      console.error('Failed to fetch HR analytics:', err);
    } finally {
      setLoadingHR(false);
    }
  };

  const fetchMinistryHR = async () => {
    try {
      setLoadingMinistryHR(true);
      const response = await api.get('/analytics/ministry-hr-by-region/');
      setMinistryHR(response.data);
    } catch (err: any) {
      console.error('Failed to fetch ministry HR data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load ministry HR data',
        variant: 'destructive',
      });
    } finally {
      setLoadingMinistryHR(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/minister-analytics/');
      setAnalytics(response.data);
    } catch (err: any) {
      console.error('Failed to fetch minister analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      is_active: user.is_active,
      assigned_delegation: user.assigned_delegation || '',
      assigned_region: user.assigned_region || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      // Convert "NONE" to empty string for the backend
      const dataToSubmit = {
        ...editForm,
        assigned_delegation: editForm.assigned_delegation === 'NONE' ? '' : editForm.assigned_delegation,
        assigned_region: editForm.assigned_region === 'NONE' ? '' : editForm.assigned_region,
      };
      
      await api.patch(`/users/${editingUser.id}/`, dataToSubmit);
      
      toast({
        title: 'Success',
        description: `User ${editingUser.username} updated successfully`,
      });
      
      setEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      console.error('Failed to update user:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={dir}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('minister.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
    <div className="min-h-screen bg-background" dir={dir}>
        <DashboardHeader user={user} onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {t('minister.error.title')}
              </CardTitle>
              <CardDescription className="text-red-600">
                {error || 'An unexpected error occurred'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchAnalytics} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('minister.error.retry')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { overallPerformance, questionDifficulty, learningProgress, studentImprovement, contentQuality, lessonPerformance, userDistribution } = analytics;

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header with Language and Theme Toggle and Refresh */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('minister.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('minister.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            {/* Language & Theme Toggle Buttons */}
            <div className="flex gap-2 p-3 px-4 bg-card rounded-lg border border-border/50">
              <DarkModeToggle />
              <LanguageToggle />
            </div>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`${dir === 'rtl' ? 'ml-2' : 'mr-2'} h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('minister.refresh')}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6" onValueChange={(value) => {
          if (value === 'user-management' && users.length === 0) {
            fetchUsers();
          }
        }}>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            <TabsList className="inline-flex w-max min-w-full justify-start">
            <TabsTrigger value="overview">{t('minister.tab.overview')}</TabsTrigger>
            <TabsTrigger value="questions">{t('minister.tab.questions')}</TabsTrigger>
            <TabsTrigger value="trends">{t('minister.tab.trends')}</TabsTrigger>
            <TabsTrigger value="content">{t('minister.tab.content')}</TabsTrigger>
            <TabsTrigger value="users">{t('minister.tab.users')}</TabsTrigger>
            <TabsTrigger value="teachers">{t('minister.tab.teachers')}</TabsTrigger>
            <TabsTrigger value="students">{t('minister.tab.students')}</TabsTrigger>
            <TabsTrigger value="user-management">{t('minister.tab.management')}</TabsTrigger>
            <TabsTrigger value="high-school">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('minister.tab.highSchool')}
            </TabsTrigger>
            <TabsTrigger value="map">{t('minister.tab.map')}</TabsTrigger>
            <TabsTrigger value="inspector-assignments">
              <Users className="h-4 w-4 mr-2" />
              {t('minister.tab.inspectorAssignments')}
            </TabsTrigger>
            <TabsTrigger value="forum" onClick={() => window.location.href = '/forum'}>
              <Users className="h-4 w-4 mr-2" />
              {t('minister.tab.forum')}
            </TabsTrigger>
            <TabsTrigger value="career-plans">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('minister.tab.careerPlans')}
            </TabsTrigger>
          </TabsList>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.kpi.totalStudents')}</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallPerformance.totalStudents.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('minister.kpi.totalStudents.desc')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.kpi.testsCompleted')}</CardTitle>
                  <BookOpen className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallPerformance.totalTests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('minister.kpi.testsCompleted.desc')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.kpi.avgScore')}</CardTitle>
                  <Target className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(overallPerformance.averageScore)}`}>
                    {overallPerformance.averageScore}%
                  </div>
                  <Progress value={overallPerformance.averageScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.kpi.passRate')}</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {overallPerformance.passRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t('minister.kpi.passRate.desc')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.kpi.excellence')}</CardTitle>
                  <Award className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {overallPerformance.excellenceRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t('minister.kpi.excellence.desc')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Student Improvement Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  {t('minister.improvement.title')}
                </CardTitle>
                <CardDescription>
                  {t('minister.improvement.subtitle')} • {t('minister.improvement.avg')}: {studentImprovement.averageImprovement}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">{t('minister.improvement.improved')}</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{studentImprovement.improved}%</div>
                    <p className="text-sm text-green-700 mt-1">{t('minister.improvement.improved.desc')}</p>
                  </div>

                  <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">{t('minister.improvement.stable')}</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-600">{studentImprovement.stable}%</div>
                    <p className="text-sm text-yellow-700 mt-1">{t('minister.improvement.stable.desc')}</p>
                  </div>

                  <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-800">{t('minister.improvement.declined')}</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">{studentImprovement.declined}%</div>
                    <p className="text-sm text-red-700 mt-1">{t('minister.improvement.declined.desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Curriculum Engagement Overview */}
            <Card>
              <CardHeader>
                <CardTitle>{t('minister.curriculum.title')}</CardTitle>
                <CardDescription>
                  {t('minister.curriculum.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">{t('minister.curriculum.totalLessons')}</p>
                    <p className="text-3xl font-bold">{lessonPerformance.totalLessons}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">{t('minister.curriculum.activeLessons')}</p>
                    <p className="text-3xl font-bold text-green-600">{lessonPerformance.lessonsWithActivity}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lessonPerformance.engagementRate}% {t('minister.curriculum.engagement')}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">{t('minister.curriculum.highEngagement')}</p>
                    <p className="text-3xl font-bold text-blue-600">{lessonPerformance.highEngagementLessons}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('minister.curriculum.highEngagement.desc')}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">{t('minister.curriculum.totalSubmissions')}</p>
                    <p className="text-3xl font-bold">{lessonPerformance.totalSubmissions.toLocaleString()}</p>
                  </div>
                  <div className="border rounded-lg p-4 md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">{t('minister.curriculum.avgSubmissions')}</p>
                    <p className="text-3xl font-bold">{lessonPerformance.avgSubmissionsPerLesson}</p>
                    <Progress 
                      value={Math.min((lessonPerformance.avgSubmissionsPerLesson / 50) * 100, 100)} 
                      className="mt-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QUESTION ANALYSIS TAB */}
          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('minister.questions.title')}</CardTitle>
                <CardDescription>
                  {t('minister.questions.subtitle')} • {questionDifficulty.totalQuestions} {t('minister.questions.analyzed')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {questionDifficulty.totalQuestions === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>{t('minister.questions.noData')}</p>
                    <p className="text-sm mt-1">{t('minister.questions.noData.desc')}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm text-green-700 mb-1">{t('minister.questions.easy')}</p>
                            <p className="text-3xl font-bold text-green-600">{questionDifficulty.easy}</p>
                            <p className="text-xs text-green-600 mt-1">
                              {((questionDifficulty.easy / questionDifficulty.totalQuestions) * 100).toFixed(1)}% {t('minister.questions.ofTotal')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <BarChart3 className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                            <p className="text-sm text-yellow-700 mb-1">{t('minister.questions.medium')}</p>
                            <p className="text-3xl font-bold text-yellow-600">{questionDifficulty.medium}</p>
                            <p className="text-xs text-yellow-600 mt-1">
                              {((questionDifficulty.medium / questionDifficulty.totalQuestions) * 100).toFixed(1)}% {t('minister.questions.ofTotal')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                            <p className="text-sm text-red-700 mb-1">{t('minister.questions.hard')}</p>
                            <p className="text-3xl font-bold text-red-600">{questionDifficulty.hard}</p>
                            <p className="text-xs text-red-600 mt-1">
                              {((questionDifficulty.hard / questionDifficulty.totalQuestions) * 100).toFixed(1)}% {t('minister.questions.ofTotal')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm text-blue-700 mb-1">{t('minister.questions.avgSuccess')}</p>
                            <p className="text-3xl font-bold text-blue-600">{questionDifficulty.averageCorrectRate}%</p>
                            <Progress value={questionDifficulty.averageCorrectRate} className="mt-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Insights */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900">{t('minister.questions.insight.balanced')}</p>
                          <p className="text-sm text-blue-700">
                            {t('minister.questions.insight.balanced.desc')}
                          </p>
                        </div>
                      </div>

                      {questionDifficulty.averageCorrectRate < 60 && (
                        <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-yellow-900">{t('minister.questions.insight.review')}</p>
                            <p className="text-sm text-yellow-700">
                              {t('minister.questions.insight.review.desc')}
                            </p>
                          </div>
                        </div>
                      )}

                      {questionDifficulty.hard > questionDifficulty.easy + questionDifficulty.medium && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-900">{t('minister.questions.insight.highDifficulty')}</p>
                            <p className="text-sm text-red-700">
                              {t('minister.questions.insight.highDifficulty.desc')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LEARNING TRENDS TAB */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('minister.trends.title')}</CardTitle>
                <CardDescription>
                  {t('minister.trends.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {learningProgress.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>{t('minister.trends.noData')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {learningProgress.map((week, idx) => {
                      const prevWeek = idx > 0 ? learningProgress[idx - 1] : null;
                      const trend = prevWeek ? week.avgScore - prevWeek.avgScore : 0;
                      
                      return (
                        <div key={week.week} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{t('common.week')} {week.week}</h3>
                              <p className="text-xs text-muted-foreground">
                                {new Date(week.weekStart).toLocaleDateString()} - {new Date(week.weekEnd).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${getScoreColor(week.avgScore)}`}>
                                {week.avgScore}%
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {week.students} {t('minister.trends.students')}
                              </p>
                            </div>
                          </div>
                          
                          <Progress value={week.avgScore} className="mb-2" />
                          
                          {prevWeek && (
                            <div className="flex items-center gap-1 text-sm">
                              {trend > 0 ? (
                                <>
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  <span className="text-green-600">
                                    +{trend.toFixed(1)}% {t('minister.trends.fromPrevious')}
                                  </span>
                                </>
                              ) : trend < 0 ? (
                                <>
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                  <span className="text-red-600">
                                    {trend.toFixed(1)}% {t('minister.trends.fromPrevious')}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-600">{t('minister.trends.noChange')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTENT QUALITY TAB */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.content.lessonsCreated')}</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentQuality.totalLessonsCreated}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('minister.content.lessonsCreated.desc')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.content.aiTests')}</CardTitle>
                  <Target className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentQuality.aiGeneratedTests}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('minister.content.aiTests.desc')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.content.vaultTests')}</CardTitle>
                  <BookOpen className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentQuality.vaultTests}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('minister.content.vaultTests.desc')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.content.avgQuestions')}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentQuality.avgQuestionsPerTest}</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('minister.content.avgQuestions.desc')}</p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('minister.content.approvalRate')}</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{contentQuality.approvalRate}%</div>
                  <Progress value={contentQuality.approvalRate} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">{t('minister.content.approvalRate.desc')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Content Quality Insights */}
            <Card>
              <CardHeader>
                <CardTitle>{t('minister.content.insights.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">{t('minister.content.insights.highApproval')}</p>
                      <p className="text-sm text-blue-700">
                        {contentQuality.approvalRate}% {t('minister.content.insights.highApproval.desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-purple-900">{t('minister.content.insights.aiAssisted')}</p>
                      <p className="text-sm text-purple-700">
                        {((contentQuality.aiGeneratedTests / (contentQuality.aiGeneratedTests + contentQuality.vaultTests)) * 100).toFixed(1)}% 
                        {' '}{t('minister.content.insights.aiAssisted.desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <BookOpen className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">{t('minister.content.insights.balance')}</p>
                      <p className="text-sm text-green-700">
                        {t('minister.content.insights.balance.desc')} ({contentQuality.aiGeneratedTests} {t('minister.content.insights.balance.desc2')}) 
                        {' '}{t('minister.content.insights.balance.desc3')} ({contentQuality.vaultTests} )
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USER STATISTICS TAB */}
          <TabsContent value="users" className="space-y-6">
            {loadingMinistryHR ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">{t('minister.hr.loading')}</p>
              </div>
            ) : ministryHR ? (
              <>
                {/* Total Ministry Employees Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('minister.hr.totalEmployees')}</CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-700">{ministryHR.total_employees.toLocaleString()}</div>
                      <p className="text-xs text-blue-600 mt-1">{t('minister.hr.acrossRegions')}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('minister.hr.maleEmployees')}</CardTitle>
                      <Users className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-indigo-700">{ministryHR.total_male.toLocaleString()}</div>
                      <p className="text-xs text-indigo-600 mt-1">{ministryHR.male_percentage}% {t('minister.hr.ofWorkforce')}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-pink-50 to-pink-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('minister.hr.femaleEmployees')}</CardTitle>
                      <Users className="h-4 w-4 text-pink-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-pink-700">{ministryHR.total_female.toLocaleString()}</div>
                      <p className="text-xs text-pink-600 mt-1">{ministryHR.female_percentage}% {t('minister.hr.ofWorkforce')}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Employees by Role with Region Filter */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          {t('minister.hr.byRole')}
                        </CardTitle>
                        <CardDescription>{t('minister.hr.byRole.desc')}</CardDescription>
                      </div>
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">{t('minister.hr.allRegions')}</option>
                        {ministryHR.by_region.map((region) => (
                          <option key={region.region} value={region.region}>
                            {region.region.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={
                        selectedRegion === 'all' 
                          ? ministryHR.by_role 
                          : (() => {
                              // Filter by selected region
                              const regionData = ministryHR.detailed_data.filter(d => d.region === selectedRegion);
                              const roleAgg: Record<string, {count: number, male: number, female: number}> = {};
                              regionData.forEach(item => {
                                if (!roleAgg[item.role]) {
                                  roleAgg[item.role] = {count: 0, male: 0, female: 0};
                                }
                                roleAgg[item.role].count += item.count;
                                roleAgg[item.role].male += item.male;
                                roleAgg[item.role].female += item.female;
                              });
                              return Object.entries(roleAgg).map(([role, data]) => ({
                                role,
                                ...data
                              })).sort((a, b) => b.count - a.count);
                            })()
                      }>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="role" 
                          angle={-45} 
                          textAnchor="end" 
                          height={120}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(role) => translateRole(role)}
                        />
                        <YAxis />
                        <Tooltip formatter={(value, name) => {
                          const translatedName = name === 'male' ? t('minister.hr.male') : name === 'female' ? t('minister.hr.female') : name;
                          return [value, translatedName];
                        }} labelFormatter={(role) => translateRole(role)} />
                        <Legend formatter={(value) => value === 'male' ? t('minister.hr.male') : value === 'female' ? t('minister.hr.female') : value} />
                        <Bar dataKey="male" stackId="a" fill="#3b82f6" name="male" />
                        <Bar dataKey="female" stackId="a" fill="#ec4899" name="female" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Median Age by Role */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      {t('minister.hr.medianAge')}
                    </CardTitle>
                    <CardDescription>{t('minister.hr.medianAge.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={ministryHR.by_role.slice().sort((a, b) => b.median_age - a.median_age)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="role" 
                          angle={-45} 
                          textAnchor="end" 
                          height={120}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(role) => translateRole(role)}
                        />
                        <YAxis label={{ value: t('minister.hr.age.years'), angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value) => [value, t('minister.hr.medianAge')]}
                          labelFormatter={(role) => translateRole(role)}
                        />
                        <Bar dataKey="median_age" fill="#f97316" name="Median Age">
                          {ministryHR.by_role.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={
                              entry.median_age >= 50 ? '#dc2626' :
                              entry.median_age >= 45 ? '#ea580c' :
                              entry.median_age >= 40 ? '#f97316' :
                              entry.median_age >= 35 ? '#fb923c' :
                              '#fdba74'
                            } />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex items-center gap-4 text-xs flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-600 rounded"></div>
                        <span>{t('minister.hr.age.legend.50plus')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-600 rounded"></div>
                        <span>{t('minister.hr.age.legend.45to49')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                        <span>{t('minister.hr.age.legend.40to44')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-400 rounded"></div>
                        <span>{t('minister.hr.age.legend.35to39')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-300 rounded"></div>
                        <span>{t('minister.hr.age.legend.below35')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top 10 Regions by Employee Count */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      {t('minister.hr.topRegions')}
                    </CardTitle>
                    <CardDescription>{t('minister.hr.topRegions.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={ministryHR.by_region.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="region" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => {
                          const translatedName = name === 'male' ? t('minister.hr.male') : name === 'female' ? t('minister.hr.female') : name;
                          return [value, translatedName];
                        }} />
                        <Legend formatter={(value) => value === 'male' ? t('minister.hr.male') : value === 'female' ? t('minister.hr.female') : value} />
                        <Bar dataKey="male" stackId="a" fill="#3b82f6" name="male" />
                        <Bar dataKey="female" stackId="a" fill="#ec4899" name="female" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Role Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ministryHR.by_role.slice(0, 6).map((roleData, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-700">
                          {translateRole(roleData.role)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold">{roleData.count.toLocaleString()}</span>
                            <span className="text-xs text-gray-500">{t('minister.hr.total')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-600">♂ {roleData.male.toLocaleString()} ({roleData.male_percentage}%)</span>
                            <span className="text-pink-600">♀ {roleData.female.toLocaleString()} ({roleData.female_percentage}%)</span>
                          </div>
                          <Progress 
                            value={roleData.male_percentage} 
                            className="h-2" 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">{t('minister.hr.noData')}</p>
                </CardContent>
              </Card>
            )}

            {/* Legacy System Users (from analytics) */}
            <Card className="border-t-4 border-t-gray-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  {t('minister.users.platformStats')}
                </CardTitle>
                <CardDescription>{t('minister.users.platformStats.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('minister.users.teachers')}</CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userDistribution.teachers}</div>
                      <p className="text-xs text-muted-foreground mt-1">{t('minister.users.teachers.desc')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('minister.users.students')}</CardTitle>
                      <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userDistribution.students}</div>
                      <p className="text-xs text-muted-foreground mt-1">{t('minister.users.students.desc')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('minister.users.parents')}</CardTitle>
                      <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userDistribution.parents}</div>
                      <p className="text-xs text-muted-foreground mt-1">{t('minister.users.parents.desc')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('minister.users.advisors')}</CardTitle>
                      <Users className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userDistribution.advisors}</div>
                      <p className="text-xs text-muted-foreground mt-1">{t('minister.users.advisors.desc')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('minister.users.admins')}</CardTitle>
                      <Users className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userDistribution.admins}</div>
                      <p className="text-xs text-muted-foreground mt-1">{t('minister.users.admins.desc')}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* User Distribution Chart (Visual Representation) */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">{t('minister.users.distribution.title')}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('minister.users.distribution.total')}: {Object.values(userDistribution).reduce((a, b) => a + b, 0).toLocaleString()}
                  </p>
                  <div className="space-y-3">
                    {Object.entries(userDistribution).map(([role, count]) => {
                      const total = Object.values(userDistribution).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (count / total * 100) : 0;
                      const colors: Record<string, string> = {
                        teachers: 'bg-blue-600',
                        students: 'bg-green-600',
                        parents: 'bg-purple-600',
                        advisors: 'bg-orange-600',
                        admins: 'bg-red-600',
                      };
                      
                      return (
                        <div key={role}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{t(`minister.users.${role}`)}</span>
                            <span className="text-sm text-muted-foreground">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${colors[role]}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEACHERS TAB */}
          <TabsContent value="teachers" className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">{t('hr.teachers.totalSubjects')}</p>
                      <p className="text-3xl font-bold text-blue-900">{subjectBreakdown.length}</p>
                    </div>
                    <BookOpen className="h-12 w-12 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">{t('hr.teachers.totalTeachers')}</p>
                      <p className="text-3xl font-bold text-green-900">
                        {subjectBreakdown.reduce((sum, s) => sum + s.count, 0)}
                      </p>
                    </div>
                    <Users className="h-12 w-12 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">{t('hr.teachers.avgQuality')}</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {subjectBreakdown.length > 0
                          ? (subjectBreakdown.reduce((sum, s) => sum + s.avg_quality_score, 0) / subjectBreakdown.length).toFixed(1)
                          : '0'}
                      </p>
                    </div>
                    <Award className="h-12 w-12 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Teachers Count by Subject - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  {t('hr.teachers.distribution')}
                </CardTitle>
                <CardDescription>{t('hr.teachers.distribution.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="subject" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tickFormatter={(value) => t(`subject.${value}`)}
                    />
                    <YAxis label={{ value: t('hr.teachers.totalTeachers'), angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={(value) => value}
                      labelFormatter={(label) => t(`subject.${label}`)}
                    />
                    <Legend />
                    <Bar dataKey="excellent" stackId="a" fill="#22c55e" name={t('hr.teachers.excellent')} />
                    <Bar dataKey="good" stackId="a" fill="#3b82f6" name={t('hr.teachers.good')} />
                    <Bar dataKey="needs_improvement" stackId="a" fill="#f97316" name={t('hr.teachers.needsDev')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Score by Subject - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  {t('hr.teachers.qualityScore')}
                </CardTitle>
                <CardDescription>{t('hr.teachers.qualityScore.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="subject" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tickFormatter={(value) => t(`subject.${value}`)}
                    />
                    <YAxis label={{ value: t('hr.teachers.avgQuality'), angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={(value) => Number(value).toFixed(1)}
                      labelFormatter={(label) => t(`subject.${label}`)}
                    />
                    <Bar dataKey="avg_quality_score" fill="#8b5cf6" name={t('hr.teachers.avgQuality')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STUDENTS TAB */}
          <TabsContent value="students" className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">{t('hr.students.totalStudents')}</p>
                      <p className="text-3xl font-bold text-purple-900">{studentDemographics?.total_students || 0}</p>
                    </div>
                    <Users className="h-12 w-12 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">{t('hr.students.ageRange')}</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {studentDemographics?.by_age.length > 0 
                          ? `${studentDemographics.by_age[0]?.age}-${studentDemographics.by_age[studentDemographics.by_age.length - 1]?.age}` 
                          : 'N/A'}
                      </p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">{t('hr.students.regions')}</p>
                      <p className="text-3xl font-bold text-indigo-900">{studentDemographics?.by_region.length || 0}</p>
                    </div>
                    <Target className="h-12 w-12 text-indigo-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-pink-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-pink-600">{t('hr.students.gradeLevels')}</p>
                      <p className="text-3xl font-bold text-pink-900">{studentDemographics?.by_grade.length || 0}</p>
                    </div>
                    <BookOpen className="h-12 w-12 text-pink-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender Distribution - Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('hr.students.genderDist')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={studentDemographics?.by_gender || []}
                        dataKey="count"
                        nameKey="gender"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.gender}: ${entry.count}`}
                      >
                        {studentDemographics?.by_gender.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.gender === 'Male' ? '#3b82f6' : entry.gender === 'Female' ? '#ec4899' : '#94a3b8'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Age Distribution - Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('hr.students.ageDist')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={studentDemographics?.by_age || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" label={{ value: t('hr.students.ageYears'), position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: t('hr.students.students'), angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="male" fill="#3b82f6" name={t('hr.students.male')} />
                      <Bar dataKey="female" fill="#ec4899" name={t('hr.students.female')} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top 10 Regions - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  {t('hr.students.top10Regions')}
                </CardTitle>
                <CardDescription>{t('hr.students.top10Regions.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentDemographics?.by_region.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="region" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      interval={0}
                    />
                    <YAxis label={{ value: t('hr.students.students'), angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#3b82f6" name={t('hr.students.male')} />
                    <Bar dataKey="female" fill="#ec4899" name={t('hr.students.female')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  {t('hr.students.byGrade')}
                </CardTitle>
                <CardDescription>{t('hr.students.byGrade.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={studentDemographics?.by_grade || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis label={{ value: t('hr.students.students'), angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#3b82f6" name={t('hr.students.male')} />
                    <Bar dataKey="female" fill="#ec4899" name={t('hr.students.female')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USER MANAGEMENT TAB */}
          <TabsContent value="user-management" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserCog className="h-5 w-5" />
                      {t('minister.management.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('minister.management.subtitle')} • {filteredUsers.length} {t('minister.management.usersShown')}
                    </CardDescription>
                  </div>
                  <Button onClick={fetchUsers} disabled={loadingUsers} variant="outline" size="sm">
                    <RefreshCw className={`${dir === 'rtl' ? 'ml-2' : 'mr-2'} h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                    {t('minister.management.refresh')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="search" className="sr-only">{t('minister.management.search')}</Label>
                    <div className="relative">
                      <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
                      <Input
                        id="search"
                        placeholder={t('minister.management.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={dir === 'rtl' ? 'pr-10' : 'pl-10'}
                      />
                    </div>
                  </div>
                  <div className="w-48">
                    <Label htmlFor="role-filter" className="sr-only">{t('minister.management.filterRole')}</Label>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger id="role-filter">
                        <SelectValue placeholder={t('minister.management.filterRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('minister.management.allRoles')}</SelectItem>
                        <SelectItem value="teacher">{t('role.teacher')}</SelectItem>
                        <SelectItem value="student">{t('role.student')}</SelectItem>
                        <SelectItem value="parent">{t('role.parent')}</SelectItem>
                        <SelectItem value="advisor">{t('role.advisor')}</SelectItem>
                        <SelectItem value="admin">{t('role.admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* User Table */}
                {loadingUsers ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-600">{t('minister.management.loading')}</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>{t('minister.management.noUsers')}</p>
                    <p className="text-sm mt-1">{t('minister.management.noUsers.desc')}</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('minister.management.table.user')}</TableHead>
                          <TableHead>{t('minister.management.table.email')}</TableHead>
                          <TableHead>{t('minister.management.table.role')}</TableHead>
                          <TableHead>{t('minister.management.table.school')}</TableHead>
                          <TableHead>{t('minister.management.table.status')}</TableHead>
                          <TableHead className="text-right">{t('minister.management.table.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.username}</div>
                                <div className="text-sm text-gray-500">
                                  {user.first_name} {user.last_name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  user.role === 'admin' ? 'border-red-200 bg-red-50 text-red-700' :
                                  user.role === 'teacher' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                  user.role === 'student' ? 'border-green-200 bg-green-50 text-green-700' :
                                  user.role === 'parent' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                                  user.role === 'advisor' ? 'border-orange-200 bg-orange-50 text-orange-700' :
                                  'border-gray-200 bg-gray-50 text-gray-700'
                                }
                              >
                                {t(`role.${user.role}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {user.school_name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                {user.is_active ? t('minister.management.status.active') : t('minister.management.status.inactive')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                                {t('minister.management.edit')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Summary Stats */}
                {!loadingUsers && filteredUsers.length > 0 && (
                  <div className="mt-4 text-sm text-gray-600">
                    {t('minister.management.showing')} {filteredUsers.length} {t('minister.management.of')} {users.length} {t('minister.management.totalUsers')}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HIGH SCHOOL BACCALAUREATE TAB */}
          <TabsContent value="high-school" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">{t('highSchool.title')}</h2>
              <p className="text-gray-600">{t('highSchool.subtitle')}</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('highSchool.years')}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2020-2025</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('highSchool.years.desc')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('highSchool.branches')}</CardTitle>
                  <BookOpen className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('highSchool.branches.desc')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('highSchool.avgSuccess')}</CardTitle>
                  <Award className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">42.3%</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('highSchool.avgSuccess.desc')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('highSchool.dataSource')}</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold">Orientini</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('highSchool.dataSource.desc')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Baccalaureate 2025 Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>{t('highSchool.bac2025.title')}</CardTitle>
                <CardDescription>{t('highSchool.bac2025.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('highSchool.mainSession')}</div>
                    <div className="text-3xl font-bold text-blue-600">38.18%</div>
                    <div className="text-xs text-gray-500 mt-2">{t('highSchool.mainSession.desc')}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('highSchool.controlSession')}</div>
                    <div className="text-3xl font-bold text-green-600">46.43%</div>
                    <div className="text-xs text-gray-500 mt-2">{t('highSchool.controlSession.desc')}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('highSchool.bothSessions')}</div>
                    <div className="text-3xl font-bold text-purple-600">52.87%</div>
                    <div className="text-xs text-gray-500 mt-2">{t('highSchool.bothSessions.desc')}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">{t('highSchool.byBranch')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: t('highSchool.branch.sciences'), rate: 55.32, students: 31847, color: 'green' },
                      { name: t('highSchool.branch.math'), rate: 67.89, students: 18293, color: 'green' },
                      { name: t('highSchool.branch.tech'), rate: 48.71, students: 15621, color: 'blue' },
                      { name: t('highSchool.branch.economics'), rate: 49.23, students: 24156, color: 'blue' },
                      { name: t('highSchool.branch.letters'), rate: 42.15, students: 12483, color: 'orange' },
                      { name: t('highSchool.branch.informatics'), rate: 63.24, students: 9847, color: 'green' }
                    ].map((branch, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{branch.name}</span>
                          <span className={`text-${branch.color}-600 font-bold`}>{branch.rate}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {branch.students.toLocaleString()} {t('highSchool.students')}
                        </div>
                        <Progress value={branch.rate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Baccalaureate 2024 Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>{t('highSchool.bac2024.title')}</CardTitle>
                <CardDescription>{t('highSchool.bac2024.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('highSchool.mainSession')}</div>
                    <div className="text-3xl font-bold text-blue-600">35.42%</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('highSchool.bothSessions')}</div>
                    <div className="text-3xl font-bold text-green-600">51.28%</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">{t('highSchool.byBranch')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: t('highSchool.branch.sciences'), rate: 54.87, students: 30621 },
                      { name: t('highSchool.branch.math'), rate: 66.42, students: 17854 },
                      { name: t('highSchool.branch.tech'), rate: 47.93, students: 15139 },
                      { name: t('highSchool.branch.economics'), rate: 48.51, students: 23487 }
                    ].map((branch, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{branch.name}</span>
                          <span className="font-bold">{branch.rate}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {branch.students.toLocaleString()} {t('highSchool.students')}
                        </div>
                        <Progress value={branch.rate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Statistics 2025 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('highSchool.regional.title')}</CardTitle>
                <CardDescription>{t('highSchool.regional.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { rank: 1, region: t('highSchool.region.sfax1'), rate: 71.31, passed: 4164, candidates: 5839 },
                    { rank: 2, region: t('highSchool.region.medenine'), rate: 68.96, passed: 3423, candidates: 4964 },
                    { rank: 3, region: t('highSchool.region.sfax2'), rate: 68.86, passed: 2966, candidates: 4307 },
                    { rank: 4, region: t('highSchool.region.sidibouzid'), rate: 67.71, passed: 2965, candidates: 4379 },
                    { rank: 5, region: t('highSchool.region.mahdia'), rate: 63.69, passed: 2540, candidates: 3988 },
                    { rank: 6, region: t('highSchool.region.sousse'), rate: 62.69, passed: 4783, candidates: 7629 },
                    { rank: 7, region: t('highSchool.region.ariana'), rate: 61.70, passed: 3901, candidates: 6323 },
                    { rank: 8, region: t('highSchool.region.monastir'), rate: 61.36, passed: 4251, candidates: 6928 },
                    { rank: 9, region: t('highSchool.region.tunis1'), rate: 60.79, passed: 3615, candidates: 5947 },
                    { rank: 10, region: t('highSchool.region.nabeul'), rate: 60.74, passed: 5235, candidates: 8618 },
                    { rank: 11, region: t('highSchool.region.benarous'), rate: 60.70, passed: 4784, candidates: 7882 },
                    { rank: 12, region: t('highSchool.region.tataouine'), rate: 60.42, passed: 858, candidates: 1420 },
                    { rank: 13, region: t('highSchool.region.gabes'), rate: 58.93, passed: 2408, candidates: 4086 },
                    { rank: 14, region: t('highSchool.region.tunis2'), rate: 57.97, passed: 3152, candidates: 5437 },
                    { rank: 15, region: t('highSchool.region.tozeur'), rate: 57.55, passed: 819, candidates: 1423 },
                    { rank: 16, region: t('highSchool.region.kebili'), rate: 56.06, passed: 1165, candidates: 2078 },
                    { rank: 17, region: t('highSchool.region.manouba'), rate: 53.96, passed: 2595, candidates: 4809 },
                    { rank: 18, region: t('highSchool.region.bizerte'), rate: 53.70, passed: 3634, candidates: 6767 },
                    { rank: 19, region: t('highSchool.region.siliana'), rate: 52.82, passed: 1423, candidates: 2694 },
                    { rank: 20, region: t('highSchool.region.kasserine'), rate: 50.86, passed: 2492, candidates: 4900 },
                    { rank: 21, region: t('highSchool.region.elkef'), rate: 50.13, passed: 1503, candidates: 2999 },
                    { rank: 22, region: t('highSchool.region.beja'), rate: 49.96, passed: 1769, candidates: 3541 },
                    { rank: 23, region: t('highSchool.region.gafsa'), rate: 46.45, passed: 1956, candidates: 4211 },
                    { rank: 24, region: t('highSchool.region.kairouan'), rate: 46.28, passed: 2524, candidates: 5454 },
                    { rank: 25, region: t('highSchool.region.zaghouan'), rate: 46.15, passed: 978, candidates: 2119 },
                    { rank: 26, region: t('highSchool.region.jendouba'), rate: 43.08, passed: 2043, candidates: 4742 }
                  ].map((region) => {
                    let colorClass = 'green';
                    if (region.rate < 50) colorClass = 'red';
                    else if (region.rate < 60) colorClass = 'orange';
                    
                    return (
                      <div key={region.rank} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                #{region.rank}
                              </Badge>
                              <span className="font-semibold text-gray-900">{region.region}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {t('highSchool.regional.passed')}: {region.passed.toLocaleString()} / {region.candidates.toLocaleString()}
                            </div>
                          </div>
                          <div className={`text-2xl font-bold text-${colorClass}-600`}>
                            {region.rate}%
                          </div>
                        </div>
                        <Progress value={region.rate} className="h-2" />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('highSchool.regional.top')}</div>
                    <div className="text-2xl font-bold text-green-600">{t('highSchool.region.sfax1')}</div>
                    <div className="text-lg text-green-700 mt-1">71.31%</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('highSchool.regional.average')}</div>
                    <div className="text-2xl font-bold text-blue-600">57.13%</div>
                    <div className="text-xs text-gray-500 mt-1">{t('highSchool.regional.averageDesc')}</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('highSchool.regional.gap')}</div>
                    <div className="text-2xl font-bold text-orange-600">28.23%</div>
                    <div className="text-xs text-gray-500 mt-1">{t('highSchool.regional.gapDesc')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historical Trends */}
            <Card>
              <CardHeader>
                <CardTitle>{t('highSchool.trends.title')}</CardTitle>
                <CardDescription>{t('highSchool.trends.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { year: '2025', rate: 52.87, color: 'green' },
                    { year: '2024', rate: 51.28, color: 'green' },
                    { year: '2023', rate: 49.15, color: 'blue' },
                    { year: '2022', rate: 47.82, color: 'blue' },
                    { year: '2021', rate: 45.93, color: 'orange' },
                    { year: '2020', rate: 44.21, color: 'orange' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold">{item.year}</div>
                        <div className="text-sm text-gray-600">{t('highSchool.bothSessions')}</div>
                      </div>
                      <div className={`text-2xl font-bold text-${item.color}-600`}>{item.rate}%</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <div className="font-semibold text-blue-900">{t('highSchool.trend.positive')}</div>
                      <div className="text-sm text-blue-700">{t('highSchool.trend.positive.desc')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle>{t('highSchool.sources.title')}</CardTitle>
                <CardDescription>{t('highSchool.sources.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <a 
                    href="https://orientini.com/AR/Annonces_Orientation_Formation_Emploi/15470/_بكالوريا-2025-:-نتائج-الدورة-الرئيسية-في-أرقام" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-semibold text-blue-600">{t('highSchool.source.bac2025main')}</div>
                    <div className="text-sm text-gray-600 mt-1">Orientini - {t('highSchool.mainSession')} 2025</div>
                  </a>
                  <a 
                    href="https://orientini.com/AR/Annonces_Orientation_Formation_Emploi/15625/_الإعلان-عن-نسب-النجاح-حسب-الشعب-في-امتحان-البكالوريا-2025---دورة-المراقبة" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-semibold text-blue-600">{t('highSchool.source.bac2025control')}</div>
                    <div className="text-sm text-gray-600 mt-1">Orientini - {t('highSchool.controlSession')} 2025</div>
                  </a>
                  <a 
                    href="https://orientini.com/AR/Annonces_Orientation_Formation_Emploi/13840/_بكالوريا-2024-:-نسب-النجاح-بالدورتين---كل-الأصناف" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-semibold text-blue-600">{t('highSchool.source.bac2024')}</div>
                    <div className="text-sm text-gray-600 mt-1">Orientini - {t('highSchool.bothSessions')} 2024</div>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Section */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  {t('highSchool.ai.title')}
                </CardTitle>
                <CardDescription>{t('highSchool.ai.desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Insights */}
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    {t('highSchool.ai.insights')}
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{t('highSchool.ai.insight1.title')}</div>
                          <div className="text-sm text-gray-600 mt-1">{t('highSchool.ai.insight1.desc')}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{t('highSchool.ai.insight2.title')}</div>
                          <div className="text-sm text-gray-600 mt-1">{t('highSchool.ai.insight2.desc')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{t('highSchool.ai.insight3.title')}</div>
                          <div className="text-sm text-gray-600 mt-1">{t('highSchool.ai.insight3.desc')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{t('highSchool.ai.insight4.title')}</div>
                          <div className="text-sm text-gray-600 mt-1">{t('highSchool.ai.insight4.desc')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategic Recommendations */}
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    {t('highSchool.ai.recommendations')}
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="font-medium text-green-900 mb-2">{t('highSchool.ai.rec1.title')}</div>
                      <div className="text-sm text-green-700">{t('highSchool.ai.rec1.desc')}</div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-900 mb-2">{t('highSchool.ai.rec2.title')}</div>
                      <div className="text-sm text-blue-700">{t('highSchool.ai.rec2.desc')}</div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                      <div className="font-medium text-purple-900 mb-2">{t('highSchool.ai.rec3.title')}</div>
                      <div className="text-sm text-purple-700">{t('highSchool.ai.rec3.desc')}</div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                      <div className="font-medium text-orange-900 mb-2">{t('highSchool.ai.rec4.title')}</div>
                      <div className="text-sm text-orange-700">{t('highSchool.ai.rec4.desc')}</div>
                    </div>
                  </div>
                </div>

                {/* Predictive Analytics */}
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-lg border-2 border-indigo-300">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-indigo-900 mb-2">{t('highSchool.ai.prediction.title')}</div>
                      <div className="text-indigo-700 mb-3">{t('highSchool.ai.prediction.desc')}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/70 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">{t('highSchool.ai.prediction.2026')}</div>
                          <div className="text-2xl font-bold text-indigo-600">53.8%</div>
                        </div>
                        <div className="bg-white/70 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">{t('highSchool.ai.prediction.confidence')}</div>
                          <div className="text-2xl font-bold text-green-600">87%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Disclaimer */}
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    {t('highSchool.ai.disclaimer')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <SchoolMapView />
          </TabsContent>

          {/* Inspector Assignments Tab */}
          <TabsContent value="inspector-assignments">
            <InspectorAssignmentManager />
          </TabsContent>

          {/* CAREER PLANS TAB - Mock Data from PDF */}
          <TabsContent value="career-plans" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">{t('careerPlans.title')}</h2>
              <p className="text-gray-600">{t('careerPlans.subtitle')}</p>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('careerPlans.totalPositions')}</CardTitle>
                  <UserCog className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700">14,523</div>
                  <p className="text-xs text-blue-600 mt-1">{t('careerPlans.totalPositions.desc')}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('careerPlans.filled')}</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">12,847</div>
                  <p className="text-xs text-green-600 mt-1">88.5% {t('careerPlans.occupancy')}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('careerPlans.vacant')}</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-700">1,676</div>
                  <p className="text-xs text-orange-600 mt-1">11.5% {t('careerPlans.vacancy')}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('careerPlans.categories')}</CardTitle>
                  <Target className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700">11</div>
                  <p className="text-xs text-purple-600 mt-1">{t('careerPlans.categories.desc')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Positions by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  {t('careerPlans.byCategory.title')}
                </CardTitle>
                <CardDescription>{t('careerPlans.byCategory.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      category: t('careerPlans.category.primaryTeachers'), 
                      total: 4821, 
                      filled: 4523, 
                      vacant: 298, 
                      color: 'blue',
                      avgAge: 42,
                      retirement5y: 487
                    },
                    { 
                      category: t('careerPlans.category.preparatoryTeachers'), 
                      total: 3254, 
                      filled: 2987, 
                      vacant: 267, 
                      color: 'green',
                      avgAge: 45,
                      retirement5y: 612
                    },
                    { 
                      category: t('careerPlans.category.secondaryTeachers'), 
                      total: 2847, 
                      filled: 2564, 
                      vacant: 283, 
                      color: 'purple',
                      avgAge: 48,
                      retirement5y: 823
                    },
                    { 
                      category: t('careerPlans.category.inspectors'), 
                      total: 487, 
                      filled: 453, 
                      vacant: 34, 
                      color: 'indigo',
                      avgAge: 51,
                      retirement5y: 187
                    },
                    { 
                      category: t('careerPlans.category.supervisors'), 
                      total: 612, 
                      filled: 589, 
                      vacant: 23, 
                      color: 'orange',
                      avgAge: 49,
                      retirement5y: 145
                    },
                    { 
                      category: t('careerPlans.category.counselors'), 
                      total: 834, 
                      filled: 742, 
                      vacant: 92, 
                      color: 'cyan',
                      avgAge: 44,
                      retirement5y: 98
                    },
                    { 
                      category: t('careerPlans.category.assessors'), 
                      total: 523, 
                      filled: 487, 
                      vacant: 36, 
                      color: 'pink',
                      avgAge: 46,
                      retirement5y: 124
                    },
                    { 
                      category: t('careerPlans.category.administrative'), 
                      total: 756, 
                      filled: 698, 
                      vacant: 58, 
                      color: 'yellow',
                      avgAge: 43,
                      retirement5y: 87
                    },
                    { 
                      category: t('careerPlans.category.technicians'), 
                      total: 412, 
                      filled: 378, 
                      vacant: 34, 
                      color: 'teal',
                      avgAge: 41,
                      retirement5y: 54
                    },
                    { 
                      category: t('careerPlans.category.engineers'), 
                      total: 198, 
                      filled: 176, 
                      vacant: 22, 
                      color: 'violet',
                      avgAge: 39,
                      retirement5y: 23
                    },
                    { 
                      category: t('careerPlans.category.other'), 
                      total: 779, 
                      filled: 750, 
                      vacant: 29, 
                      color: 'gray',
                      avgAge: 38,
                      retirement5y: 67
                    }
                  ].map((item, idx) => {
                    const fillRate = (item.filled / item.total * 100).toFixed(1);
                    const retirementRate = (item.retirement5y / item.total * 100).toFixed(1);
                    
                    return (
                      <Card key={idx} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{item.category}</h3>
                              <div className="flex gap-4 text-sm text-gray-600">
                                <span>{t('careerPlans.avgAge')}: {item.avgAge} {t('careerPlans.years')}</span>
                                <span>•</span>
                                <span>{t('careerPlans.retirement5y')}: {item.retirement5y} ({retirementRate}%)</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold text-${item.color}-600`}>
                                {item.total.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">{t('careerPlans.positions')}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">{t('careerPlans.filled')}</div>
                              <div className="text-lg font-bold text-green-700">{item.filled}</div>
                              <div className="text-xs text-green-600">{fillRate}%</div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">{t('careerPlans.vacant')}</div>
                              <div className="text-lg font-bold text-orange-700">{item.vacant}</div>
                              <div className="text-xs text-orange-600">{(100 - parseFloat(fillRate)).toFixed(1)}%</div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">{t('careerPlans.retiring')}</div>
                              <div className="text-lg font-bold text-red-700">{item.retirement5y}</div>
                              <div className="text-xs text-red-600">{t('careerPlans.next5years')}</div>
                            </div>
                          </div>

                          <Progress value={parseFloat(fillRate)} className="h-2" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Workforce Planning Projections */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  {t('careerPlans.projections.title')}
                </CardTitle>
                <CardDescription>{t('careerPlans.projections.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{t('careerPlans.projections.recruitment')}</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{t('careerPlans.projections.year2025')}</span>
                          <span className="text-2xl font-bold text-blue-600">2,847</span>
                        </div>
                        <Progress value={85} className="h-2" />
                        <p className="text-xs text-gray-600 mt-2">{t('careerPlans.projections.toFillVacancies')}</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{t('careerPlans.projections.year2026')}</span>
                          <span className="text-2xl font-bold text-green-600">1,234</span>
                        </div>
                        <Progress value={60} className="h-2" />
                        <p className="text-xs text-gray-600 mt-2">{t('careerPlans.projections.replacements')}</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{t('careerPlans.projections.year2027')}</span>
                          <span className="text-2xl font-bold text-purple-600">1,567</span>
                        </div>
                        <Progress value={45} className="h-2" />
                        <p className="text-xs text-gray-600 mt-2">{t('careerPlans.projections.retirements')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{t('careerPlans.projections.challenges')}</h4>
                    <div className="space-y-3">
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-red-900">{t('careerPlans.challenge1.title')}</div>
                            <div className="text-sm text-red-700 mt-1">{t('careerPlans.challenge1.desc')}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-orange-900">{t('careerPlans.challenge2.title')}</div>
                            <div className="text-sm text-orange-700 mt-1">{t('careerPlans.challenge2.desc')}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-start gap-3">
                          <Target className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-yellow-900">{t('careerPlans.challenge3.title')}</div>
                            <div className="text-sm text-yellow-700 mt-1">{t('careerPlans.challenge3.desc')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strategic Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  {t('careerPlans.recommendations.title')}
                </CardTitle>
                <CardDescription>{t('careerPlans.recommendations.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-green-900 mb-2">{t('careerPlans.rec1.title')}</div>
                        <div className="text-sm text-green-700">{t('careerPlans.rec1.desc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Users className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-blue-900 mb-2">{t('careerPlans.rec2.title')}</div>
                        <div className="text-sm text-blue-700">{t('careerPlans.rec2.desc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-6 w-6 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-purple-900 mb-2">{t('careerPlans.rec3.title')}</div>
                        <div className="text-sm text-purple-700">{t('careerPlans.rec3.desc')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-start gap-3">
                      <Target className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-orange-900 mb-2">{t('careerPlans.rec4.title')}</div>
                        <div className="text-sm text-orange-700">{t('careerPlans.rec4.desc')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  {t('careerPlans.regional.title')}
                </CardTitle>
                <CardDescription>{t('careerPlans.regional.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={[
                    { region: 'Tunis', filled: 2847, vacant: 287 },
                    { region: 'Sfax', filled: 1923, vacant: 198 },
                    { region: 'Sousse', filled: 1456, vacant: 156 },
                    { region: 'Ariana', filled: 1234, vacant: 134 },
                    { region: 'Nabeul', filled: 987, vacant: 98 },
                    { region: 'Ben Arous', filled: 876, vacant: 87 },
                    { region: 'Monastir', filled: 765, vacant: 76 },
                    { region: 'Kairouan', filled: 654, vacant: 65 },
                    { region: 'Bizerte', filled: 543, vacant: 54 },
                    { region: 'Gabès', filled: 432, vacant: 43 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="filled" stackId="a" fill="#22c55e" name={t('careerPlans.filled')} />
                    <Bar dataKey="vacant" stackId="a" fill="#f97316" name={t('careerPlans.vacant')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Data Source Note */}
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-yellow-900 mb-1">{t('careerPlans.dataSource.title')}</div>
                    <div className="text-sm text-yellow-800">
                      {t('careerPlans.dataSource.desc')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent dir={dir}>
            <DialogHeader>
              <DialogTitle>{t('minister.management.editDialog.title')}: {editingUser?.username}</DialogTitle>
              <DialogDescription>
                {t('minister.management.editDialog.subtitle')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">{t('minister.management.editDialog.role')}</Label>
                <Select 
                  value={editForm.role} 
                  onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder={t('minister.management.editDialog.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">{t('role.teacher')}</SelectItem>
                    <SelectItem value="student">{t('role.student')}</SelectItem>
                    <SelectItem value="parent">{t('role.parent')}</SelectItem>
                    <SelectItem value="advisor">{t('role.advisor')}</SelectItem>
                    <SelectItem value="admin">{t('role.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">{t('minister.management.editDialog.status')}</Label>
                <Select 
                  value={editForm.is_active ? 'active' : 'inactive'} 
                  onValueChange={(value) => setEditForm({ ...editForm, is_active: value === 'active' })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('minister.management.status.active')}</SelectItem>
                    <SelectItem value="inactive">{t('minister.management.status.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editForm.role === 'delegation' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-delegation">{t('minister.management.editDialog.assignedDelegation')}</Label>
                  <Select 
                    value={editForm.assigned_delegation} 
                    onValueChange={(value) => setEditForm({ ...editForm, assigned_delegation: value })}
                  >
                    <SelectTrigger id="edit-delegation">
                      <SelectValue placeholder={t('minister.management.editDialog.selectDelegation')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="NONE">{t('minister.management.editDialog.noDelegation')}</SelectItem>
                      <SelectItem value="Tunis 1">Tunis 1</SelectItem>
                      <SelectItem value="Tunis 2">Tunis 2</SelectItem>
                      <SelectItem value="Ariana">Ariana</SelectItem>
                      <SelectItem value="Ben Arous">Ben Arous</SelectItem>
                      <SelectItem value="Manouba">Manouba</SelectItem>
                      <SelectItem value="Nabeul">Nabeul</SelectItem>
                      <SelectItem value="Zaghouan">Zaghouan</SelectItem>
                      <SelectItem value="Bizerte">Bizerte</SelectItem>
                      <SelectItem value="Béja">Béja</SelectItem>
                      <SelectItem value="Jendouba">Jendouba</SelectItem>
                      <SelectItem value="Kef">Kef</SelectItem>
                      <SelectItem value="Siliana">Siliana</SelectItem>
                      <SelectItem value="Kairouan">Kairouan</SelectItem>
                      <SelectItem value="Kasserine">Kasserine</SelectItem>
                      <SelectItem value="Sidi Bouzid">Sidi Bouzid</SelectItem>
                      <SelectItem value="Sousse">Sousse</SelectItem>
                      <SelectItem value="Monastir">Monastir</SelectItem>
                      <SelectItem value="Mahdia">Mahdia</SelectItem>
                      <SelectItem value="Sfax 1">Sfax 1</SelectItem>
                      <SelectItem value="Sfax 2">Sfax 2</SelectItem>
                      <SelectItem value="Gafsa">Gafsa</SelectItem>
                      <SelectItem value="Tozeur">Tozeur</SelectItem>
                      <SelectItem value="Kebili">Kebili</SelectItem>
                      <SelectItem value="Gabès">Gabès</SelectItem>
                      <SelectItem value="Medenine">Medenine</SelectItem>
                      <SelectItem value="Tataouine">Tataouine</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">{t('minister.management.editDialog.delegationHelp')}</p>
                </div>
              )}

              {(editForm.role === 'inspector' || editForm.role === 'gpi') && (
                <div className="space-y-2">
                  <Label htmlFor="edit-region">{t('minister.management.editDialog.assignedRegion')}</Label>
                  <Select 
                    value={editForm.assigned_region} 
                    onValueChange={(value) => setEditForm({ ...editForm, assigned_region: value })}
                  >
                    <SelectTrigger id="edit-region">
                      <SelectValue placeholder={t('minister.management.editDialog.selectRegion')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="NONE">{t('minister.management.editDialog.noRegion')}</SelectItem>
                      <SelectItem value="Tunis 1">Tunis 1</SelectItem>
                      <SelectItem value="Tunis 2">Tunis 2</SelectItem>
                      <SelectItem value="Ariana">Ariana</SelectItem>
                      <SelectItem value="Ben Arous">Ben Arous</SelectItem>
                      <SelectItem value="Manouba">Manouba</SelectItem>
                      <SelectItem value="Nabeul">Nabeul</SelectItem>
                      <SelectItem value="Zaghouan">Zaghouan</SelectItem>
                      <SelectItem value="Bizerte">Bizerte</SelectItem>
                      <SelectItem value="Béja">Béja</SelectItem>
                      <SelectItem value="Jendouba">Jendouba</SelectItem>
                      <SelectItem value="Kef">Kef</SelectItem>
                      <SelectItem value="Siliana">Siliana</SelectItem>
                      <SelectItem value="Kairouan">Kairouan</SelectItem>
                      <SelectItem value="Kasserine">Kasserine</SelectItem>
                      <SelectItem value="Sidi Bouzid">Sidi Bouzid</SelectItem>
                      <SelectItem value="Sousse">Sousse</SelectItem>
                      <SelectItem value="Monastir">Monastir</SelectItem>
                      <SelectItem value="Mahdia">Mahdia</SelectItem>
                      <SelectItem value="Sfax 1">Sfax 1</SelectItem>
                      <SelectItem value="Sfax 2">Sfax 2</SelectItem>
                      <SelectItem value="Gafsa">Gafsa</SelectItem>
                      <SelectItem value="Tozeur">Tozeur</SelectItem>
                      <SelectItem value="Kebili">Kebili</SelectItem>
                      <SelectItem value="Gabès">Gabès</SelectItem>
                      <SelectItem value="Medenine">Medenine</SelectItem>
                      <SelectItem value="Tataouine">Tataouine</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">{t('minister.management.editDialog.regionHelp')}</p>
                </div>
              )}

              {editingUser && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">{t('minister.management.editDialog.userDetails')}</p>
                  <p className="text-gray-600">{t('minister.management.editDialog.name')}: {editingUser.first_name} {editingUser.last_name}</p>
                  <p className="text-gray-600">{t('minister.management.editDialog.email')}: {editingUser.email}</p>
                  <p className="text-gray-600">{t('minister.management.editDialog.school')}: {editingUser.school_name || t('minister.management.editDialog.none')}</p>
                  {editingUser.role === 'delegation' && editingUser.assigned_delegation && (
                    <p className="text-gray-600">{t('minister.management.editDialog.currentDelegation')}: {editingUser.assigned_delegation}</p>
                  )}
                  {(editingUser.role === 'inspector' || editingUser.role === 'gpi') && editingUser.assigned_region && (
                    <p className="text-gray-600">{t('minister.management.editDialog.currentRegion')}: {editingUser.assigned_region}</p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t('minister.management.editDialog.cancel')}
              </Button>
              <Button onClick={handleSaveUser}>
                {t('minister.management.editDialog.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer with Metadata */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {t('common.lastUpdated')}: {new Date(analytics.generatedAt).toLocaleString()}
        </div>
      </main>
    </div>
  );
};

export default MinisterDashboard;
