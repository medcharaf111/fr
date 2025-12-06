/**
 * GDHR (General Directorate of Human Resources) Dashboard
 * Comprehensive HR analytics and teacher/staff management
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import api, { authAPI } from '@/lib/api';
import DashboardHeader from '@/components/DashboardHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Users,
  UserCheck,
  Award,
  TrendingUp,
  TrendingDown,
  School,
  Target,
  BarChart3,
  Loader2,
  RefreshCw,
  Search,
  UserCog,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Languages
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Type definitions
interface HROverview {
  total_teachers: number;
  total_students: number;
  total_parents: number;
  total_advisors: number;
  total_directors: number;
  total_cnp: number;
  total_delegation: number;
  total_gdhr: number;
  total_admins: number;
  total_schools: number;
  teacher_student_ratio: number;
  active_relationships: number;
  total_workers: number;
}

interface TeacherPerformance {
  teacher_id: number;
  teacher_name: string;
  email: string;
  school_name: string;
  subjects: string[];
  total_students: number;
  total_lessons_created: number;
  total_tests_created: number;
  avg_student_score: number;
  avg_rating: number;
  quality_score: number;
  level: 'excellent' | 'good' | 'needs_improvement';
}

interface SchoolStats {
  id: number;
  name: string;
  total_teachers: number;
  total_students: number;
  total_advisors: number;
  avg_teacher_rating: number;
  teacher_student_ratio: number;
}

interface SubjectBreakdown {
  subject: string;
  count: number;
  teachers: TeacherPerformance[];
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

const GDHRDashboard = () => {
  const { t, language, setLanguage, dir } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = authAPI.getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<HROverview | null>(null);
  const [teachers, setTeachers] = useState<TeacherPerformance[]>([]);
  const [studentDemographics, setStudentDemographics] = useState<StudentDemographics | null>(null);
  const [schools, setSchools] = useState<SchoolStats[]>([]);
  const [subjectBreakdown, setSubjectBreakdown] = useState<SubjectBreakdown[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch HR overview data
      const overviewRes = await api.get('/analytics/hr-overview/');
      setOverview(overviewRes.data);

      // Fetch teacher performance data from HR endpoint
      try {
        const teachersRes = await api.get('/analytics/hr-teacher-performance/');
        setTeachers(teachersRes.data.teachers || []);
        setSubjectBreakdown(teachersRes.data.by_subject || []);
      } catch (err) {
        console.warn('Teacher performance endpoint not available, trying fallback');
        try {
          const teachersRes = await api.get('/analytics/teacher-quality/');
          setTeachers(teachersRes.data.all_teachers || teachersRes.data.top_performers || []);
          setSubjectBreakdown([]);
        } catch (err2) {
          console.warn('Teacher quality endpoint also not available');
          setTeachers([]);
          setSubjectBreakdown([]);
        }
      }

      // Fetch student performance data from HR endpoint
      try {
        const studentsRes = await api.get('/analytics/hr-student-performance/');
        console.log('Student demographics loaded:', studentsRes.data);
        setStudentDemographics(studentsRes.data);
      } catch (err) {
        console.error('Student performance endpoint error:', err);
        setStudentDemographics(null);
      }

      // Fetch schools data
      try {
        const schoolsRes = await api.get('/admin/schools/');
        setSchools(schoolsRes.data);
      } catch (err) {
        console.warn('Schools endpoint not available');
        setSchools([]);
      }
    } catch (error) {
      console.error('Failed to load HR data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load HR analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: 'Data Refreshed',
      description: 'HR analytics data has been updated',
    });
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.school_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs_improvement': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'needs_improvement': return 'Needs Improvement';
      default: return level;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir={dir}>
        <DashboardHeader user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading HR Analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir={dir}>
      <DashboardHeader user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                <UserCog className="inline-block w-10 h-10 mr-3 text-blue-600" />
                GDHR Dashboard
              </h1>
              <p className="text-gray-600">
                General Directorate of Human Resources - Teacher & Staff Analytics
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('common.refreshData')}
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {t('gdhr.totalTeachers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview.total_teachers.toLocaleString()}</div>
                <p className="text-xs text-blue-100 mt-1">{t('common.acrossAllSchools')}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('gdhr.totalStudents')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview.total_students.toLocaleString()}</div>
                <p className="text-xs text-purple-100 mt-1">{t('common.activeLearners')}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  {t('gdhr.ratio')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1:{Math.round(overview.teacher_student_ratio)}</div>
                <p className="text-xs text-green-100 mt-1">{t('common.averageRatio')}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                  <School className="h-4 w-4" />
                  {t('gdhr.totalSchools')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview.total_schools.toLocaleString()}</div>
                <p className="text-xs text-orange-100 mt-1">{t('common.educationalInstitutions')}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview">{t('tab.overview')}</TabsTrigger>
            <TabsTrigger value="teachers">{t('gdhr.teacherPerformance')}</TabsTrigger>
            <TabsTrigger value="subjects">{t('gdhr.bySubject')}</TabsTrigger>
            <TabsTrigger value="students">{t('gdhr.studentPerformance')}</TabsTrigger>
            <TabsTrigger value="grades">{t('gdhr.byGrade')}</TabsTrigger>
            <TabsTrigger value="schools">{t('tab.schools')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Staff Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    {t('gdhr.staffDistribution')}
                  </CardTitle>
                  <CardDescription>{t('gdhr.staffDistribution.desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overview && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('tab.teachers')}</span>
                        <span className="text-2xl font-bold text-blue-600">{overview.total_teachers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('tab.students')}</span>
                        <span className="text-2xl font-bold text-purple-600">{overview.total_students}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('gdhr.parents')}</span>
                        <span className="text-2xl font-bold text-pink-600">{overview.total_parents}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('gdhr.advisors')}</span>
                        <span className="text-2xl font-bold text-green-600">{overview.total_advisors}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('gdhr.directors')}</span>
                        <span className="text-2xl font-bold text-orange-600">{overview.total_directors}</span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm font-medium">{t('common.total')} {t('gdhr.workers')}</span>
                        <span className="text-2xl font-bold text-indigo-600">{overview.total_workers}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    {t('gdhr.performanceSummary')}
                  </CardTitle>
                  <CardDescription>{t('gdhr.qualityDistribution')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teachers.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          {t('gdhr.excellent')} {t('tab.teachers')}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {teachers.filter(t => t.level === 'excellent').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          {t('gdhr.good')} {t('tab.teachers')}
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {teachers.filter(t => t.level === 'good').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                          {t('gdhr.needsDevelopment')}
                        </span>
                        <span className="text-2xl font-bold text-orange-600">
                          {teachers.filter(t => t.level === 'needs_improvement').length}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teacher Performance Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      {t('gdhr.teacherPerformanceAnalytics')}
                    </CardTitle>
                    <CardDescription>{t('gdhr.detailedMetrics')}</CardDescription>
                  </div>
                  <div className="w-72">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={t('gdhr.searchTeachers')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('gdhr.teacherName')}</TableHead>
                        <TableHead>{t('gdhr.school')}</TableHead>
                        <TableHead>{t('gdhr.subjects')}</TableHead>
                        <TableHead className="text-center">{t('tab.students')}</TableHead>
                        <TableHead className="text-center">{t('gdhr.lessons')}</TableHead>
                        <TableHead className="text-center">{t('gdhr.tests')}</TableHead>
                        <TableHead className="text-center">{t('gdhr.avgScore')}</TableHead>
                        <TableHead className="text-center">{t('gdhr.rating')}</TableHead>
                        <TableHead className="text-center">{t('gdhr.quality')}</TableHead>
                        <TableHead className="text-center">{t('common.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeachers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                            {t('gdhr.noTeachersFound')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTeachers.map((teacher) => (
                          <TableRow key={teacher.teacher_id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{teacher.teacher_name}</div>
                                <div className="text-sm text-gray-500">{teacher.email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{teacher.school_name}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {teacher.subjects.slice(0, 2).map((subject, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                                {teacher.subjects.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{teacher.subjects.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{teacher.total_students}</TableCell>
                            <TableCell className="text-center">{teacher.total_lessons_created}</TableCell>
                            <TableCell className="text-center">{teacher.total_tests_created}</TableCell>
                            <TableCell className="text-center">
                              <span className={teacher.avg_student_score >= 70 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                                {teacher.avg_student_score.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Award className="h-4 w-4 text-yellow-500" />
                                <span className="font-medium">{teacher.avg_rating?.toFixed(1) || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-blue-600">
                                {teacher.quality_score.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={getLevelColor(teacher.level)}>
                                {getLevelLabel(teacher.level)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subject Classification Tab */}
          <TabsContent value="subjects" className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Subjects</p>
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
                      <p className="text-sm font-medium text-green-600">Total Teachers</p>
                      <p className="text-3xl font-bold text-green-900">
                        {subjectBreakdown.reduce((sum, s) => sum + s.count, 0)}
                      </p>
                    </div>
                    <UserCheck className="h-12 w-12 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Avg Quality Score</p>
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
                  {t('gdhr.teachersDistributionBySubject')}
                </CardTitle>
                <CardDescription>{t('gdhr.numberOfTeachersPerSubject')}</CardDescription>
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
                    <YAxis label={{ value: t('tab.teachers'), angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={(value) => value}
                      labelFormatter={(label) => t(`subject.${label}`)}
                    />
                    <Legend />
                    <Bar dataKey="excellent" stackId="a" fill="#22c55e" name={t('gdhr.excellent')} />
                    <Bar dataKey="good" stackId="a" fill="#3b82f6" name={t('gdhr.good')} />
                    <Bar dataKey="needs_improvement" stackId="a" fill="#f97316" name={t('gdhr.needsDevelopment')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Score by Subject - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  {t('gdhr.avgQualityScoreBySubject')}
                </CardTitle>
                <CardDescription>{t('gdhr.performanceQualityMetrics')}</CardDescription>
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
                    <YAxis label={{ value: 'Quality Score', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={(value) => Number(value).toFixed(1)}
                      labelFormatter={(label) => t(`subject.${label}`)}
                    />
                    <Bar dataKey="avg_quality_score" fill="#8b5cf6" name="Avg Quality Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Subject Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Teachers by Subject - Detailed Breakdown
                </CardTitle>
                <CardDescription>Classification and performance breakdown by subject area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectBreakdown.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-8">
                      No subject data available
                    </div>
                  ) : (
                    subjectBreakdown.map((subject) => (
                      <Card key={subject.subject} className="border-2 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span className="capitalize">{subject.subject.replace('_', ' ')}</span>
                            <Badge variant="secondary" className="text-lg font-bold">
                              {subject.count}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Quality Score */}
                          <div className="flex items-center justify-between pb-2 border-b">
                            <span className="text-sm font-medium text-gray-600">Avg Quality</span>
                            <span className="text-xl font-bold text-blue-600">
                              {subject.avg_quality_score.toFixed(1)}
                            </span>
                          </div>

                          {/* Performance Distribution */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                <span>Excellent</span>
                              </div>
                              <span className="font-semibold text-green-600">{subject.excellent}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                <span>Good</span>
                              </div>
                              <span className="font-semibold text-blue-600">{subject.good}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                                <span>Needs Dev.</span>
                              </div>
                              <span className="font-semibold text-orange-600">{subject.needs_improvement}</span>
                            </div>
                          </div>

                          {/* Performance Bar */}
                          <div className="pt-2">
                            <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                              {subject.excellent > 0 && (
                                <div
                                  className="bg-green-500"
                                  style={{ width: `${(subject.excellent / subject.count) * 100}%` }}
                                ></div>
                              )}
                              {subject.good > 0 && (
                                <div
                                  className="bg-blue-500"
                                  style={{ width: `${(subject.good / subject.count) * 100}%` }}
                                ></div>
                              )}
                              {subject.needs_improvement > 0 && (
                                <div
                                  className="bg-orange-500"
                                  style={{ width: `${(subject.needs_improvement / subject.count) * 100}%` }}
                                ></div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Performance Tab */}
          <TabsContent value="students" className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Total Students</p>
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
                      <p className="text-sm font-medium text-blue-600">Age Range</p>
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
                      <p className="text-sm font-medium text-indigo-600">Regions</p>
                      <p className="text-3xl font-bold text-indigo-900">{studentDemographics?.by_region.length || 0}</p>
                    </div>
                    <School className="h-12 w-12 text-indigo-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-pink-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-pink-600">Grade Levels</p>
                      <p className="text-3xl font-bold text-pink-900">{studentDemographics?.by_grade.length || 0}</p>
                    </div>
                    <GraduationCap className="h-12 w-12 text-pink-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Demographics Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Student Demographics
                </CardTitle>
                <CardDescription>
                  Total Students: {studentDemographics?.total_students || 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* By Gender - Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gender Distribution</CardTitle>
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

                  {/* By Age - Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Age Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={studentDemographics?.by_age || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="age" label={{ value: 'Age (years)', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="male" fill="#3b82f6" name="Male" />
                          <Bar dataKey="female" fill="#ec4899" name="Female" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* By Region with Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5 text-indigo-600" />
                  Students by Region
                </CardTitle>
                <CardDescription>Distribution across regions/delegations (Top 10 shown in chart)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bar Chart for Top 10 Regions */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Top 10 Regions</h3>
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
                      <YAxis label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="male" fill="#3b82f6" name="Male" />
                      <Bar dataKey="female" fill="#ec4899" name="Female" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Full Table */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">All Regions</h3>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead>Region</TableHead>
                          <TableHead className="text-right">Total Students</TableHead>
                          <TableHead className="text-right">Male</TableHead>
                          <TableHead className="text-right">Female</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentDemographics?.by_region.map((item) => (
                          <TableRow key={item.region}>
                            <TableCell className="font-medium">{item.region}</TableCell>
                            <TableCell className="text-right font-bold text-lg text-indigo-600">{item.count}</TableCell>
                            <TableCell className="text-right text-blue-600">{item.male}</TableCell>
                            <TableCell className="text-right text-pink-600">{item.female}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Grade Tab */}
          <TabsContent value="grades" className="space-y-6">
            {/* Students by Grade with Gender Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  Students by Grade Level
                </CardTitle>
                <CardDescription>Gender distribution within each grade (e.g., 6th grade: 50% male, rest female)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bar Chart */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Grade Distribution Chart</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={studentDemographics?.by_grade || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="male" fill="#3b82f6" name="Male" />
                      <Bar dataKey="female" fill="#ec4899" name="Female" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Detailed Breakdown</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Male</TableHead>
                        <TableHead className="text-center">Female</TableHead>
                        <TableHead className="text-center">Male %</TableHead>
                        <TableHead className="text-center">Female %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentDemographics?.by_grade.map((item) => (
                        <TableRow key={item.grade_value}>
                          <TableCell className="font-medium">{item.grade}</TableCell>
                          <TableCell className="text-center font-bold text-lg">{item.total}</TableCell>
                          <TableCell className="text-center font-semibold text-blue-600">{item.male}</TableCell>
                          <TableCell className="text-center font-semibold text-pink-600">{item.female}</TableCell>
                          <TableCell className="text-center text-blue-600">{item.male_percentage}%</TableCell>
                          <TableCell className="text-center text-pink-600">{item.female_percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5 text-blue-600" />
                  School Statistics
                </CardTitle>
                <CardDescription>HR distribution across educational institutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School Name</TableHead>
                        <TableHead className="text-center">Teachers</TableHead>
                        <TableHead className="text-center">Students</TableHead>
                        <TableHead className="text-center">Advisors</TableHead>
                        <TableHead className="text-center">Ratio</TableHead>
                        <TableHead className="text-center">Avg Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schools.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No school data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        schools.map((school) => (
                          <TableRow key={school.id}>
                            <TableCell className="font-medium">{school.name}</TableCell>
                            <TableCell className="text-center">{school.total_teachers}</TableCell>
                            <TableCell className="text-center">{school.total_students}</TableCell>
                            <TableCell className="text-center">{school.total_advisors}</TableCell>
                            <TableCell className="text-center">
                              1:{Math.round(school.teacher_student_ratio)}
                            </TableCell>
                            <TableCell className="text-center">
                              {school.avg_teacher_rating ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Award className="h-4 w-4 text-yellow-500" />
                                  <span className="font-medium">{school.avg_teacher_rating.toFixed(1)}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GDHRDashboard;
