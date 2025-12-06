import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionAPI } from '@/lib/api';
import {
  GPIDashboardStats,
  InspectionReport,
  MonthlyReport,
  InspectorInfo,
} from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  FileCheck,
  TrendingUp,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import GPIMapView from '@/components/GPIMapView';

const GPIDashboard = () => {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GPIDashboardStats | null>(null);
  const [pendingReports, setPendingReports] = useState<InspectionReport[]>([]);
  const [pendingMonthly, setPendingMonthly] = useState<MonthlyReport[]>([]);
  const [inspectors, setInspectors] = useState<InspectorInfo[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes, monthlyRes, inspectorsRes] = await Promise.all([
        inspectionAPI.getGPIStats(),
        inspectionAPI.getPendingReports(),
        inspectionAPI.getPendingMonthlyReports(),
        inspectionAPI.getAllInspectors(),
      ]);
      setStats(statsRes.data);
      setPendingReports(reportsRes.data);
      setPendingMonthly(monthlyRes.data);
      setInspectors(inspectorsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async (reportId: number) => {
    try {
      await inspectionAPI.approveReport(reportId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving report:', error);
    }
  };

  const handleRejectReport = async (reportId: number, feedback: string) => {
    try {
      await inspectionAPI.rejectReport(reportId, feedback);
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{t('gpi.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('gpi.title')}</h1>
          <p className="text-muted-foreground">
            {t('gpi.subtitle')}
          </p>
        </div>
        <LanguageToggle />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gpi.stats.totalInspectors')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_inspectors || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_inspectors || 0} {t('gpi.stats.activeInspectors')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gpi.stats.pendingReviews')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_reports_pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_monthly_reports_pending || 0} {t('gpi.stats.monthly')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gpi.stats.thisMonth')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_visits_this_month || 0}</div>
            <p className="text-xs text-muted-foreground">{t('gpi.stats.totalVisits')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gpi.monthly.avgRating')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.average_rating_this_month?.toFixed(2) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">{t('gpi.stats.thisMonth')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('gpi.review.approvedMonth')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.reports_approved_this_month || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              {t('gpi.review.rejectedMonth')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.reports_rejected_this_month || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regions Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('gpi.regions.title')}
          </CardTitle>
          <CardDescription>{t('gpi.regions.title')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats?.regions_summary?.map((region) => (
              <Card key={region.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{region.name}</CardTitle>
                  <CardDescription>{t('gpi.regions.inspector')}: {region.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('gpi.inspectors.name')}:</span>
                      <span className="font-medium">{region.inspector_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('gpi.inspectors.schools')}:</span>
                      <span className="font-medium">{region.school_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('gpi.inspectors.teachers')}:</span>
                      <span className="font-medium">{region.teacher_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('gpi.inspectors.visitsMonth')}:</span>
                      <span className="font-medium">{region.visits_this_month}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">
            <FileCheck className="mr-2 h-4 w-4" />
            {t('gpi.tabs.pending')} ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <TrendingUp className="mr-2 h-4 w-4" />
            {t('gpi.tabs.monthly')} ({pendingMonthly.length})
          </TabsTrigger>
          <TabsTrigger value="inspectors">
            <Users className="mr-2 h-4 w-4" />
            {t('gpi.tabs.inspectors')} ({inspectors.length})
          </TabsTrigger>
          <TabsTrigger value="map">
            <MapPin className="mr-2 h-4 w-4" />
            Schools Map
          </TabsTrigger>
        </TabsList>

        {/* Pending Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('gpi.reports.pending')}</CardTitle>
              <CardDescription>
                {t('gpi.reports.pending')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('gpi.pending.noReports')}
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{report.teacher_name}</h3>
                                <Badge variant="outline">{report.visit_type}</Badge>
                                <Badge>{t('gpi.reports.rating')}: {report.final_rating}/5</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span>{t('gpi.pending.inspector')}: {report.inspector_name}</span>
                                <span className="mx-2">•</span>
                                <span>{new Date(report.visit_date).toLocaleDateString()}</span>
                                <span className="mx-2">•</span>
                                <span>{t('gpi.pending.submitted')}: {new Date(report.submitted_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm">{report.summary}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/gpi/reports/${report.id}`)}
                            >
                              {t('gpi.reports.review')}
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveReport(report.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {t('gpi.pending.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const feedback = prompt(t('gpi.feedback.placeholder'));
                                if (feedback) handleRejectReport(report.id, feedback);
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              {t('gpi.pending.reject')}
                            </Button>
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

        {/* Monthly Reports Tab */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('gpi.monthly.pending')}</CardTitle>
              <CardDescription>
                {t('gpi.monthly.noReports')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingMonthly.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('gpi.monthly.noReports')}
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMonthly.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{report.inspector_name}</h3>
                              <Badge>{report.month_year}</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">{t('gpi.stats.totalVisits')}</div>
                                <div className="text-xl font-bold">{report.total_visits}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">{t('gpi.stats.approved')}</div>
                                <div className="text-xl font-bold text-green-600">
                                  {report.completed_visits}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">{t('visit.status.cancelled')}</div>
                                <div className="text-xl font-bold text-red-600">
                                  {report.cancelled_visits}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">{t('gpi.monthly.avgRating')}</div>
                                <div className="text-xl font-bold">
                                  {report.average_rating?.toFixed(2) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/gpi/monthly-reports/${report.id}`)}
                          >
                            {t('gpi.monthly.review')}
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

        {/* Inspectors Tab */}
        <TabsContent value="inspectors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('gpi.inspectors.performance')}</CardTitle>
              <CardDescription>
                {t('gpi.inspectors.all')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inspectors.map((inspector) => (
                  <Card key={inspector.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-semibold text-lg">{inspector.full_name}</h3>
                          <div className="text-sm text-muted-foreground">
                            {inspector.email} • {inspector.phone_number}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {inspector.assigned_regions.map((region) => (
                              <Badge key={region.id} variant="outline">
                                {region.name}
                              </Badge>
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">{t('gpi.stats.totalVisits')}</div>
                              <div className="text-lg font-bold">{inspector.total_visits}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">{t('gpi.stats.approved')}</div>
                              <div className="text-lg font-bold">{inspector.completed_visits}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">{t('gpi.monthly.avgRating')}</div>
                              <div className="text-lg font-bold">
                                {inspector.average_rating?.toFixed(2) || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schools Map Tab */}
        <TabsContent value="map" className="space-y-4">
          <GPIMapView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GPIDashboard;
