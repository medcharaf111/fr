import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { administratorAPI } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  NationalKPIDashboard,
  RegionalPerformance,
  CurriculumEffectiveness,
  AtRiskStudents,
  TeacherQualityMetrics,
} from '@/types/api';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Award,
  AlertTriangle,
  BarChart3,
  Map,
  GraduationCap,
  Download,
} from 'lucide-react';

// Recharts for interactive charts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';

const AnalyticsDashboard = () => {
  const { t, dir } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<NationalKPIDashboard | null>(null);
  const [regionalData, setRegionalData] = useState<RegionalPerformance | null>(null);
  const [curriculumData, setCurriculumData] = useState<CurriculumEffectiveness | null>(null);
  const [atRiskData, setAtRiskData] = useState<AtRiskStudents | null>(null);
  const [teacherMetrics, setTeacherMetrics] = useState<TeacherQualityMetrics | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // set a default selected region when regional data arrives
  useEffect(() => {
    if (!selectedRegion && regionalData && regionalData.top_performers && regionalData.top_performers.length) {
      setSelectedRegion(regionalData.top_performers[0].region);
    }
  }, [regionalData, selectedRegion]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [kpi, regional, curriculum, atRisk, teachers] = await Promise.all([
        administratorAPI.getNationalKPIDashboard(),
        administratorAPI.getRegionalPerformance(),
        administratorAPI.getCurriculumEffectiveness(),
        administratorAPI.getAtRiskStudents(),
        administratorAPI.getTeacherQualityMetrics(),
      ]);

      setKpiData(kpi.data);
      setRegionalData(regional.data);
      setCurriculumData(curriculum.data);
      setAtRiskData(atRisk.data);
      setTeacherMetrics(teachers.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError(t('analytics.error'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = (exportType: 'regional' | 'curriculum' | 'atRisk') => {
    const token = localStorage.getItem('access_token');
    let url = '';
    
    switch (exportType) {
      case 'regional':
        url = administratorAPI.exportRegionalPerformance();
        break;
      case 'curriculum':
        url = administratorAPI.exportCurriculumEffectiveness();
        break;
      case 'atRisk':
        url = administratorAPI.exportAtRiskStudents();
        break;
    }
    
    // Add token to URL for authentication
    const downloadUrl = `${url}?Authorization=Bearer ${token}`;
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchAnalytics} variant="outline">
          {t('analytics.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Tabs defaultValue="kpi" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="kpi">{t('analytics.tabs.kpi')}</TabsTrigger>
          <TabsTrigger value="regional">{t('analytics.tabs.regional')}</TabsTrigger>
          <TabsTrigger value="curriculum">{t('analytics.tabs.curriculum')}</TabsTrigger>
          <TabsTrigger value="teachers">{t('analytics.tabs.teachers')}</TabsTrigger>
          <TabsTrigger value="at-risk">{t('analytics.tabs.atRisk')}</TabsTrigger>
        </TabsList>

        {/* National KPI Dashboard */}
        <TabsContent value="kpi" className="space-y-4">
          {kpiData && (
            <>
              {/* Active Users */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.kpi.activeUsers.daily')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.active_users.daily}</div>
                    <p className="text-xs text-muted-foreground">{t('analytics.kpi.activeUsers.daily.desc')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.kpi.activeUsers.weekly')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.active_users.weekly}</div>
                    <p className="text-xs text-muted-foreground">{t('analytics.kpi.activeUsers.weekly.desc')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.kpi.activeUsers.monthly')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.active_users.monthly}</div>
                    <p className="text-xs text-muted-foreground">{t('analytics.kpi.activeUsers.monthly.desc')}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Platform Adoption */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    {t('analytics.kpi.platform.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('analytics.kpi.platform.activeSchools')}</p>
                      <p className="text-2xl font-bold">{kpiData.platform_adoption.total_active_schools}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('analytics.kpi.platform.adoptionRate')}</p>
                      <p className="text-2xl font-bold">{kpiData.platform_adoption.adoption_rate}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('analytics.kpi.platform.topRegions')}</p>
                    {kpiData.platform_adoption.by_region.slice(0, 5).map((region, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">{region.cre}</span>
                        <div className="flex gap-4 text-sm">
                          <span>{region.active_schools} {t('analytics.kpi.platform.schools')}</span>
                          <span>{region.total_users} {t('analytics.kpi.platform.users')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Creation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {t('analytics.kpi.content.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('analytics.kpi.content.lessonsThisWeek')}</p>
                      <p className="text-2xl font-bold">{kpiData.content_creation.lessons_this_week}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('analytics.kpi.content.lessonsLastWeek')}</p>
                      <p className="text-2xl font-bold">{kpiData.content_creation.lessons_last_week}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('analytics.kpi.content.growthRate')}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-2xl font-bold">{kpiData.content_creation.growth}%</p>
                        {kpiData.content_creation.growth > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('analytics.kpi.content.testsThisWeek')}</p>
                      <p className="text-2xl font-bold">{kpiData.content_creation.tests_this_week}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assessment Completion */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    {t('analytics.kpi.assessment.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{t('analytics.kpi.assessment.completionRate')}</span>
                        <span className="text-sm font-medium">{kpiData.assessment_completion.rate}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${kpiData.assessment_completion.rate}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('analytics.kpi.assessment.completed')}</p>
                        <p className="text-xl font-bold">{kpiData.assessment_completion.completed}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('analytics.kpi.assessment.totalSubmissions')}</p>
                        <p className="text-xl font-bold">{kpiData.assessment_completion.total}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student-Teacher Ratios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('analytics.kpi.ratio.title')}
                  </CardTitle>
                  <CardDescription>{t('analytics.kpi.ratio.average')}: {kpiData.student_teacher_ratios.average}:1</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {kpiData.student_teacher_ratios.by_school.slice(0, 10).map((school, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">{school.school_name}</span>
                        <Badge variant={school.ratio > 30 ? 'destructive' : 'secondary'}>
                          {school.ratio}:1
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* KPI Historical Trends */}
              {kpiData?.historical_trends && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {t('analytics.kpi.trends.title')}
                    </CardTitle>
                    <CardDescription>{t('analytics.kpi.trends.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer>
                        <LineChart data={kpiData.historical_trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month_name" />
                          <YAxis yAxisId="left" domain={[0, 100]} />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="avg_score" name={t('analytics.kpi.trends.avgScore')} stroke="#3b82f6" />
                          <Line yAxisId="right" type="monotone" dataKey="lessons_created" name={t('analytics.kpi.trends.lessonsCreated')} stroke="#10b981" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Regional Performance */}
        <TabsContent value="regional" className="space-y-4">
          {regionalData && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t('analytics.regional.title')}</h2>
                <Button
                  onClick={() => handleExport('regional')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : ''}`} />
                  {t('analytics.export')}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      {t('analytics.regional.topPerformers')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {regionalData.top_performers.map((region, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{region.region}</p>
                            <p className="text-sm text-muted-foreground">
                              {region.schools} {t('analytics.regional.schools')} • {region.students} {t('analytics.regional.students')}
                            </p>
                          </div>
                          <Badge className="bg-green-500">{region.avg_score}%</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {region.total_submissions} {t('analytics.regional.submissions')}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Needs Support */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                      {t('analytics.regional.needsSupport')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {regionalData.needs_support.map((region, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{region.region}</p>
                            <p className="text-sm text-muted-foreground">
                              {region.schools} {t('analytics.regional.schools')} • {region.students} {t('analytics.regional.students')}
                            </p>
                          </div>
                          <Badge variant="destructive">{region.avg_score}%</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {region.total_submissions} {t('analytics.regional.submissions')}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Region selection + Trend chart */}
              {regionalData?.regional_trends && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <CardTitle>{t('analytics.regional.trends')}</CardTitle>
                        <CardDescription>{t('analytics.regional.trends.desc')}</CardDescription>
                      </div>
                      <div>
                        <select
                          className="border rounded p-1"
                          value={selectedRegion ?? ''}
                          onChange={(e) => setSelectedRegion(e.target.value)}
                        >
                          {Object.keys(regionalData.regional_trends).map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedRegion && regionalData.regional_trends[selectedRegion] ? (
                      <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                          <LineChart data={regionalData.regional_trends[selectedRegion]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month_name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="avg_score" name={t('analytics.regional.chart.avgScore')} stroke="#2563eb" />
                            <Line type="monotone" dataKey="submissions" name={t('analytics.regional.chart.submissions')} stroke="#f59e0b" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('analytics.regional.trends.select')}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* All Regions Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.regional.rankings')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {regionalData.performance_rankings.map((region, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium w-8">#{idx + 1}</span>
                          <div>
                            <p className="text-sm font-medium">{region.region}</p>
                            <p className="text-xs text-muted-foreground">
                              {region.students} {t('analytics.regional.rankings.studentsIn')} {region.schools} {t('analytics.regional.schools')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={region.avg_score > 70 ? 'default' : region.avg_score > 50 ? 'secondary' : 'destructive'}>
                          {region.avg_score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Curriculum Effectiveness */}
        <TabsContent value="curriculum" className="space-y-4">
          {curriculumData && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t('analytics.curriculum.title')}</h2>
                <Button
                  onClick={() => handleExport('curriculum')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : ''}`} />
                  {t('analytics.export')}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hardest Subjects */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      {t('analytics.curriculum.hardest')}
                    </CardTitle>
                    <CardDescription>{t('analytics.curriculum.hardest.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {curriculumData.hardest_subjects.map((subject, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold capitalize">{subject.subject}</p>
                          <Badge variant="destructive">{subject.avg_score}%</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>{subject.lessons_count} {t('analytics.curriculum.lessons')}</div>
                          <div>{subject.tests_count} {t('analytics.curriculum.tests')}</div>
                          <div>{subject.completion_rate}% {t('analytics.curriculum.completion')}</div>
                          <div>{subject.total_submissions} {t('analytics.curriculum.submissions')}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Easiest Subjects */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Award className="h-5 w-5" />
                      {t('analytics.curriculum.easiest')}
                    </CardTitle>
                    <CardDescription>{t('analytics.curriculum.easiest.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {curriculumData.easiest_subjects.map((subject, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold capitalize">{subject.subject}</p>
                          <Badge className="bg-green-500">{subject.avg_score}%</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>{subject.lessons_count} {t('analytics.curriculum.lessons')}</div>
                          <div>{subject.tests_count} {t('analytics.curriculum.tests')}</div>
                          <div>{subject.completion_rate}% {t('analytics.curriculum.completion')}</div>
                          <div>{subject.total_submissions} {t('analytics.curriculum.submissions')}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* All Subjects Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t('analytics.curriculum.analysis')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {curriculumData.subject_analysis.map((subject, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold capitalize">{subject.subject}</p>
                          <div className="flex gap-2">
                            <Badge variant={subject.avg_score > 70 ? 'default' : subject.avg_score > 50 ? 'secondary' : 'destructive'}>
                              {t('analytics.curriculum.avg')}: {subject.avg_score}%
                            </Badge>
                            <Badge variant="outline">
                              {subject.completion_rate}% {t('analytics.curriculum.completion')}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>{subject.lessons_count} {t('analytics.curriculum.lessons')}</div>
                          <div>{subject.tests_count} {t('analytics.curriculum.tests')}</div>
                          <div>{subject.total_submissions} {t('analytics.curriculum.submissions')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Effective Lessons */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {t('analytics.curriculum.effective')}
                  </CardTitle>
                  <CardDescription>{t('analytics.curriculum.effective.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {curriculumData.most_effective_lessons.map((lesson, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 hover:bg-muted rounded">
                        <div>
                          <p className="text-sm font-medium">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{lesson.subject}</p>
                        </div>
                        <Badge className="bg-green-500">{lesson.avg_score}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Teacher Quality Metrics */}
        <TabsContent value="teachers" className="space-y-4">
          {teacherMetrics && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t('analytics.teachers.title')}</h2>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.teachers.total')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teacherMetrics.total_teachers}</div>
                    <p className="text-xs text-muted-foreground">{t('analytics.teachers.total.desc')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.teachers.excellent')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {teacherMetrics.metrics_breakdown.excellent}
                    </div>
                    <p className="text-xs text-muted-foreground">{t('analytics.teachers.excellent.desc')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.teachers.good')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {teacherMetrics.metrics_breakdown.good}
                    </div>
                    <p className="text-xs text-muted-foreground">{t('analytics.teachers.good.desc')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.teachers.needsDev')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      {teacherMetrics.metrics_breakdown.needs_improvement}
                    </div>
                    <p className="text-xs text-muted-foreground">{t('analytics.teachers.needsDev.desc')}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Average Quality Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    {t('analytics.teachers.avgQuality')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600">
                    {teacherMetrics.average_quality_score}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('analytics.teachers.avgQuality.across')} {teacherMetrics.total_teachers} {t('analytics.teachers.avgQuality.teachers')}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      {t('analytics.teachers.topPerformers')}
                    </CardTitle>
                    <CardDescription>{t('analytics.teachers.topPerformers.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {teacherMetrics.top_performers.slice(0, 5).map((teacher, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{teacher.teacher_name}</p>
                            <p className="text-sm text-muted-foreground">{teacher.school}</p>
                            <p className="text-xs text-muted-foreground">
                              {teacher.subjects.join(', ')}
                            </p>
                          </div>
                          <Badge className="bg-green-500">
                            {teacher.quality_score}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                          <div>
                            <span className="font-medium">{t('analytics.teachers.metrics.studentAvg')}:</span>{' '}
                            {teacher.metrics.avg_student_score}%
                          </div>
                          <div>
                            <span className="font-medium">{t('analytics.teachers.metrics.approval')}:</span>{' '}
                            {teacher.metrics.approval_rate}%
                          </div>
                          <div>
                            <span className="font-medium">{t('analytics.teachers.metrics.students')}:</span>{' '}
                            {teacher.metrics.unique_students_reached}
                          </div>
                          <div>
                            <span className="font-medium">{t('analytics.teachers.metrics.content')}:</span>{' '}
                            {teacher.metrics.lessons_created + teacher.metrics.tests_created}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Needs Development */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                      {t('analytics.teachers.needsSupport')}
                    </CardTitle>
                    <CardDescription>{t('analytics.teachers.needsSupport.desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {teacherMetrics.needs_development.slice(0, 5).map((teacher, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{teacher.teacher_name}</p>
                            <p className="text-sm text-muted-foreground">{teacher.school}</p>
                            <p className="text-xs text-muted-foreground">
                              {teacher.subjects.join(', ')}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            {teacher.quality_score}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                          <div>
                            <span className="font-medium">{t('analytics.teachers.metrics.studentAvg')}:</span>{' '}
                            {teacher.metrics.avg_student_score}%
                          </div>
                          <div>
                            <span className="font-medium">{t('analytics.teachers.metrics.approval')}:</span>{' '}
                            {teacher.metrics.approval_rate}%
                          </div>
                          <div>
                            <span className="font-medium">{t('analytics.teachers.metrics.students')}:</span>{' '}
                            {teacher.metrics.unique_students_reached}
                          </div>
                          <div>
                            <span className="font-medium">{t('analytics.teachers.metrics.content')}:</span>{' '}
                            {teacher.metrics.lessons_created + teacher.metrics.tests_created}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Alert>
                <GraduationCap className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">{t('analytics.teachers.recommendations')}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t('analytics.teachers.rec1')}</li>
                    <li>{t('analytics.teachers.rec2')}</li>
                    <li>{t('analytics.teachers.rec3')}</li>
                    <li>{t('analytics.teachers.rec4')}</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </TabsContent>

        {/* At-Risk Students */}
        <TabsContent value="at-risk" className="space-y-4">
          {atRiskData && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t('analytics.atRisk.title')}</h2>
                <Button
                  onClick={() => handleExport('atRisk')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : ''}`} />
                  {t('analytics.export')}
                </Button>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.atRisk.total')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{atRiskData.total_at_risk}</div>
                    <p className="text-xs text-muted-foreground">{t('analytics.atRisk.total.desc')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.atRisk.high')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{atRiskData.high_risk}</div>
                    <p className="text-xs text-muted-foreground">{t('analytics.atRisk.high.desc')}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('analytics.atRisk.medium')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{atRiskData.medium_risk}</div>
                    <p className="text-xs text-muted-foreground">{t('analytics.atRisk.medium.desc')}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">{t('analytics.atRisk.recommendations')}</p>
                  <ul className="list-disc list-inside space-y-1">
                    {atRiskData.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              {/* At-Risk Students List */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.atRisk.details')}</CardTitle>
                  <CardDescription>{t('analytics.atRisk.details.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {atRiskData.students.map((student, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{student.student_name}</p>
                            <p className="text-sm text-muted-foreground">{student.school}</p>
                          </div>
                          <Badge variant={student.risk_level === 'high' ? 'destructive' : 'secondary'}>
                            {student.risk_level === 'high' ? t('analytics.atRisk.highRisk') : t('analytics.atRisk.mediumRisk')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">{t('analytics.atRisk.avgScore')}</p>
                            <p className="font-semibold">{student.avg_score}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('analytics.atRisk.testsTaken')}</p>
                            <p className="font-semibold">{student.total_tests}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('analytics.atRisk.trend')}</p>
                            <p className={`font-semibold ${student.is_declining ? 'text-red-600' : 'text-green-600'}`}>
                              {student.is_declining ? t('analytics.atRisk.declining') : t('analytics.atRisk.stable')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('analytics.atRisk.recentScores')}</p>
                            <p className="font-semibold">{student.recent_scores.join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
