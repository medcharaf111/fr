import DarkModeToggle from '@/components/DarkModeToggle';
import DashboardLayout from '@/components/DashboardLayout';
import InspectorMapView from '@/components/InspectorMapView';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { authAPI, inspectionAPI } from '@/lib/api';
import {
  InspectionReport,
  InspectionVisit,
  InspectorDashboardStats,
} from '@/types/api';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  MapPin,
  Plus,
  TrendingUp,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InspectorDashboard = () => {
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();
  const user = authAPI.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InspectorDashboardStats | null>(null);
  const [upcomingVisits, setUpcomingVisits] = useState<InspectionVisit[]>([]);
  const [pendingReports, setPendingReports] = useState<InspectionReport[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, visitsRes, reportsRes] = await Promise.all([
        inspectionAPI.getInspectorStats(),
        inspectionAPI.getUpcomingVisits(),
        inspectionAPI.getReports({ gpi_status: 'pending' }),
      ]);
      setStats(statsRes.data);
      setUpcomingVisits(visitsRes.data);
      setPendingReports(reportsRes.data.results || reportsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="inspector" userName={user?.first_name || user?.username || t('inspector.role')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('inspector.loading')}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout
      userRole="inspector"
      userName={user?.first_name || user?.username || t('inspector.role')}
    >

      {/* Language & Theme Toggle Buttons */}
      <div className="flex justify-end gap-2 mb-4 p-3 px-4 bg-card rounded-lg border border-border/50">
        <DarkModeToggle />
        <LanguageToggle
          variant="outline"
          size="default"
        />
      </div>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8" dir={dir}>
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('inspector.stats.totalVisits')}</CardTitle>
              <ClipboardCheck className="h-6 w-6 text-blue-200" />
            </div>
            <CardDescription className="text-blue-100">
              {t('inspector.stats.completed')}: {stats?.completed_visits || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats?.total_visits || 0}</div>
            <p className="text-blue-100 text-sm">
              {stats?.upcoming_visits || 0} {t('inspector.stats.pending')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('inspector.stats.upcomingVisits')}</CardTitle>
              <CalendarDays className="h-6 w-6 text-green-200" />
            </div>
            <CardDescription className="text-green-100">
              {t('inspector.stats.needsAttention')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.upcoming_visits || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('inspector.stats.reportsStatus')}</CardTitle>
              <FileText className="h-6 w-6 text-purple-200" />
            </div>
            <CardDescription className="text-purple-100">
              {t('inspector.stats.pendingGPIReview')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.reports_pending_review || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-[400ms]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('inspector.stats.assignedTeachers')}</CardTitle>
              <Users className="h-6 w-6 text-orange-200" />
            </div>
            <CardDescription className="text-orange-100">
              {stats?.assigned_regions?.length || 0} {t('inspector.stats.regions')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.assigned_teachers_count || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Actions Bar */}
      <div className="mb-8" dir={dir}>
        <Card className="border-0 shadow-sm bg-muted/50 dark:bg-muted/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-sm">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('inspector.quickActions')}</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => navigate('/inspector/visits/new')}
                variant="outline"
                className="group h-auto p-4 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <CalendarDays className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-blue-900 transition-colors">
                      {t('inspector.visits.scheduleNew')}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-blue-700 transition-colors">
                      {t('inspector.visits.createvisit')}
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/inspector/visits')}
                variant="outline"
                className="group h-auto p-4 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-500/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <ClipboardCheck className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-green-900 transition-colors">
                      {t('inspector.visits.viewAll')}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-green-700 transition-colors">
                      {t('inspector.visits.manageVisits')}
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/inspector/reports')}
                variant="outline"
                className="group h-auto p-4 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-5 w-5 text-purple-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-purple-900 transition-colors">
                      {t('inspector.reports.manage')}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-purple-700 transition-colors">
                      {t('inspector.reports.viewReports')}
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/inspector/monthly-reports')}
                variant="outline"
                className="group h-auto p-4 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-5 w-5 text-orange-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-orange-900 transition-colors">
                      {t('inspector.monthly.title')}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-orange-700 transition-colors">
                      {t('inspector.monthly.createReport')}
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="regions" className="space-y-6" dir={dir}>

        {/* Modern Tab Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-2">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-1 bg-transparent h-auto">
            <TabsTrigger
              value="regions"
              className="flex-col h-auto py-3 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
            >
              <MapPin className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('inspector.regions.title')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="map"
              className="flex-col h-auto py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-teal-950 dark:data-[state=active]:text-teal-300"
            >
              <MapPin className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('inspector.map.title')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="visits"
              className="flex-col h-auto py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
            >
              <CalendarDays className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('inspector.tabs.visits')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex-col h-auto py-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-green-950 dark:data-[state=active]:text-green-300"
            >
              <FileText className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('inspector.tabs.reports')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="flex-col h-auto py-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-orange-950 dark:data-[state=active]:text-orange-300"
            >
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('inspector.tabs.monthly')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Assigned Regions Tab */}
        <TabsContent
          value="regions"
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-violet-600" />
                {t('inspector.regions.title')}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t('inspector.regions.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {stats?.assigned_regions?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                    <MapPin className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-lg font-medium mb-2">{t('inspector.regions.noRegions')}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{t('inspector.regions.contactAdmin')}</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {stats?.assigned_regions?.map((region) => (
                    <Card key={region.id} className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-violet-100 hover:border-violet-200">
                      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-violet-900">{region.name}</CardTitle>
                          <MapPin className="h-5 w-5 text-violet-600" />
                        </div>
                        <CardDescription className="text-violet-700">
                          {region.governorate} • {t('inspector.regions.code')}: {region.code}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-blue-100 rounded">
                                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-blue-900">{t('inspector.regions.schools')}</span>
                            </div>
                            <span className="text-lg font-bold text-blue-700">{region.school_count}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-green-100 rounded">
                                <Users className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-sm font-medium text-green-900">{t('inspector.regions.teachers')}</span>
                            </div>
                            <span className="text-lg font-bold text-green-700">{region.teacher_count}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Visits Tab */}
        <TabsContent
          value="visits"
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                {t('inspector.visits.title')}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t('inspector.visits.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {upcomingVisits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-4">
                    <CalendarDays className="h-10 w-10 text-blue-500" />
                  </div>
                  <p className="text-blue-900 text-lg font-medium mb-2">{t('inspector.visits.noVisits')}</p>
                  <p className="text-blue-700 text-sm leading-relaxed">{t('inspector.visits.scheduleNew')}</p>
                  <Button onClick={() => navigate('/inspector/visits/new')} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('inspector.visits.scheduleNew')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingVisits.map((visit) => (
                    <Card key={visit.id} className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-blue-100 hover:border-blue-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                                <CalendarDays className="h-5 w-5 text-blue-700" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-blue-900">{visit.teacher_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="border-blue-200 text-blue-700">{visit.inspection_type_display}</Badge>
                                  <Badge
                                    variant={
                                      visit.status === 'scheduled'
                                        ? 'default'
                                        : visit.status === 'completed'
                                        ? 'secondary'
                                        : 'destructive'
                                    }
                                  >
                                    {visit.status_display}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground ml-14">
                              <div className="flex items-center gap-1">
                                <CalendarDays className="h-4 w-4" />
                                {new Date(visit.visit_date).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {visit.visit_time}
                              </div>
                              <span className="font-medium text-blue-700">{visit.school_name}</span>
                            </div>
                            {visit.teacher_subject && (
                              <div className="ml-14 text-sm text-blue-700 font-medium">
                                {t('inspector.visits.subject')}: {visit.teacher_subject}
                              </div>
                            )}
                            {visit.notes && (
                              <div className="ml-14 text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border-l-4 border-blue-200">
                                {visit.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/inspector/visits/${visit.id}`)}
                              className="border-blue-200 hover:bg-blue-50"
                            >
                              <ClipboardCheck className="w-4 h-4 mr-2" />
                              {t('inspector.visits.viewDetails')}
                            </Button>
                            {visit.can_write_report && !visit.has_report && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/inspector/reports/new?visit=${visit.id}`)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                {t('inspector.visits.writeReport')}
                              </Button>
                            )}
                            {visit.has_report && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/inspector/reports/${visit.id}`)}
                                className="border-green-200 hover:bg-green-50"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {t('inspector.visits.viewReport')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Reports Tab */}
        <TabsContent
          value="reports"
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                {t('inspector.reports.title')}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t('inspector.reports.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {pendingReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-4">
                    <FileText className="h-10 w-10 text-green-500" />
                  </div>
                  <p className="text-green-900 text-lg font-medium mb-2">{t('inspector.reports.noReports')}</p>
                  <p className="text-green-700 text-sm leading-relaxed">{t('inspector.reports.createNew')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReports.map((report) => (
                    <Card key={report.id} className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-green-100 hover:border-green-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                                <FileText className="h-5 w-5 text-green-700" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-green-900">{report.teacher_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="border-green-200 text-green-700">{report.visit_type}</Badge>
                                  <Badge
                                    variant={
                                      report.gpi_status === 'pending'
                                        ? 'default'
                                        : report.gpi_status === 'approved'
                                        ? 'secondary'
                                        : report.gpi_status === 'revision_needed'
                                        ? 'destructive'
                                        : 'outline'
                                    }
                                  >
                                    {report.gpi_status_display}
                                  </Badge>
                                  <span className="text-sm text-green-700 font-medium">
                                    {t('inspector.reports.rating')}: {report.final_rating}/5 ⭐
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-14 text-sm text-muted-foreground">
                              {new Date(report.visit_date).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="ml-14 text-sm bg-green-50 p-3 rounded-lg border-l-4 border-green-200">
                              <p className="text-green-800 font-medium line-clamp-2">{report.summary}</p>
                            </div>
                            {report.gpi_feedback && (
                              <div className="ml-14 bg-orange-50 p-3 rounded-lg border-l-4 border-orange-200">
                                <p className="text-sm font-medium text-orange-900">{t('inspector.reports.gpiFeedback')}:</p>
                                <p className="text-sm text-orange-800">{report.gpi_feedback}</p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/inspector/reports/${report.id}`)}
                            className="border-green-200 hover:bg-green-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t('inspector.reports.viewReport')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Report Tab */}
        <TabsContent
          value="monthly"
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                {t('inspector.monthly.title')}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t('inspector.monthly.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 border-2 border-orange-200 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50">
                  <div>
                    <h3 className="font-semibold text-lg text-orange-900">
                      {t('inspector.monthly.currentMonth')}
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      {stats?.monthly_report_status || t('inspector.monthly.notSubmitted')}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/inspector/monthly-reports')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {stats?.monthly_report_status === 'draft'
                      ? t('inspector.monthly.continueReport')
                      : stats?.monthly_report_status
                      ? t('inspector.monthly.viewReport')
                      : t('inspector.monthly.createReport')}
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-700 text-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">{t('inspector.monthly.approvedReports')}</CardTitle>
                        <CheckCircle className="h-6 w-6 text-green-200" />
                      </div>
                      <CardDescription className="text-green-100">
                        {t('inspector.monthly.approvedThisMonth')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.reports_approved || 0}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-700 text-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">{t('inspector.monthly.revisionNeeded')}</CardTitle>
                        <AlertCircle className="h-6 w-6 text-red-200" />
                      </div>
                      <CardDescription className="text-red-100">
                        {t('inspector.monthly.needsAttention')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.reports_revision_needed || 0}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schools Map Tab */}
        <TabsContent value="map" className="space-y-4">
          <InspectorMapView />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default InspectorDashboard;
