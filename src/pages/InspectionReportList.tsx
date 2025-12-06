import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { authAPI, inspectionAPI } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Plus } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface InspectionReport {
  id: number;
  teacher_name: string;
  visit_type: string;
  visit_date: string;
  gpi_status: string;
  gpi_status_display: string;
  final_rating: number;
  summary: string;
  gpi_feedback: string;
}

export default function InspectionReportList() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await inspectionAPI.getInspectorStats();
      setReports(response.data.pending_reports || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-3xl font-bold tracking-tight">{t('inspector.reports.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('inspector.reports.description')}</p>
          </div>
          <Button onClick={() => navigate('/inspector/visits')} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('inspector.reports.createFromVisit')}
          </Button>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-4">
                  <FileText className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-green-900 text-lg font-medium mb-2">{t('inspector.reports.noReports')}</p>
                <p className="text-green-700 text-sm mb-4">{t('inspector.reports.createNew')}</p>
                <Button onClick={() => navigate('/inspector/visits')} className="gap-2">
                  {t('inspector.reports.viewVisits')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
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
      </div>
    </DashboardLayout>
  );
}
