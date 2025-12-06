import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { authAPI, inspectionAPI } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Plus, TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface MonthlyReport {
  id: number;
  inspector_name: string;
  month: string;
  year: number;
  status: string;
  status_display: string;
  total_visits: number;
  completed_visits: number;
  reports_submitted: number;
  reports_approved: number;
  reports_revision_needed: number;
  average_rating: number;
  submitted_date: string;
  gpi_feedback: string;
}

export default function InspectorMonthlyReportList() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await inspectionAPI.getMonthlyReports();
      setReports(response.data.results || response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching monthly reports:', err);
      setError(err.response?.data?.message || 'Failed to load monthly reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'revision_needed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMonthName = (month: string) => {
    const monthNum = parseInt(month);
    const date = new Date(2000, monthNum - 1, 1);
    return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : 'en-US', { month: 'long' });
  };

  if (loading) {
    return (
      <DashboardLayout userRole="inspector" userName={user?.first_name || user?.username || t('inspector.role')}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="inspector" userName={user?.first_name || user?.username || t('inspector.role')}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchReports}>{t('common.retry')}</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="inspector" userName={user?.first_name || user?.username || t('inspector.role')}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              {t('inspector.monthly.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('inspector.monthly.description')}</p>
          </div>
          <Button onClick={() => navigate('/inspector/monthly-reports/new')} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4" />
            {t('inspector.monthly.createReport')}
          </Button>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mb-4">
                  <FileText className="h-10 w-10 text-orange-500" />
                </div>
                <p className="text-orange-900 text-lg font-medium mb-2">{t('inspector.monthly.noReports')}</p>
                <p className="text-orange-700 text-sm mb-4">{t('inspector.monthly.createFirst')}</p>
                <Button onClick={() => navigate('/inspector/monthly-reports/new')} className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4" />
                  {t('inspector.monthly.createReport')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-orange-100 hover:border-orange-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-orange-700" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-orange-900">
                            {getMonthName(report.month)} {report.year}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(report.status)}>
                              {report.status_display}
                            </Badge>
                            {report.submitted_date && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(report.submitted_date).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'en-US')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/inspector/monthly-reports/${report.id}`)}
                      className="border-orange-200 hover:bg-orange-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {report.status === 'draft' ? t('inspector.monthly.continueReport') : t('inspector.monthly.viewReport')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700 font-medium">{t('inspector.monthly.totalVisits')}</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">{report.total_visits}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-blue-300" />
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-medium">{t('inspector.monthly.completedVisits')}</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">{report.completed_visits}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-300" />
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-700 font-medium">{t('inspector.monthly.reportsSubmitted')}</p>
                          <p className="text-2xl font-bold text-purple-900 mt-1">{report.reports_submitted}</p>
                        </div>
                        <FileText className="h-8 w-8 text-purple-300" />
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-amber-700 font-medium">{t('inspector.monthly.averageRating')}</p>
                          <p className="text-2xl font-bold text-amber-900 mt-1">{report.average_rating?.toFixed(1) || '0.0'} ⭐</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-amber-300" />
                      </div>
                    </div>
                  </div>

                  {report.gpi_feedback && (
                    <div className="mt-4 bg-orange-50 p-4 rounded-lg border-l-4 border-orange-300">
                      <p className="text-sm font-medium text-orange-900 mb-1">{t('inspector.reports.gpiFeedback')}:</p>
                      <p className="text-sm text-orange-800">{report.gpi_feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
