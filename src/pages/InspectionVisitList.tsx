import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { authAPI, inspectionAPI } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, ClipboardCheck, FileText, Eye, Plus } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface InspectionVisit {
  id: number;
  teacher_name: string;
  school_name: string;
  visit_date: string;
  visit_time: string;
  visit_type: string;
  status: string;
  status_display: string;
  notes: string;
  teacher_subject: string;
  can_write_report: boolean;
  has_report: boolean;
}

export default function InspectionVisitList() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [visits, setVisits] = useState<InspectionVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await inspectionAPI.getInspectorStats();
      setVisits(response.data.visits || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching visits:', err);
      setError(err.response?.data?.message || 'Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
            <Button onClick={fetchVisits}>{t('common.retry')}</Button>
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
            <h1 className="text-3xl font-bold tracking-tight">{t('inspector.visits.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('inspector.visits.description')}</p>
          </div>
          <Button onClick={() => navigate('/inspector/visits/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('inspector.visits.scheduleNew')}
          </Button>
        </div>

        {visits.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-4">
                  <ClipboardCheck className="h-10 w-10 text-blue-500" />
                </div>
                <p className="text-blue-900 text-lg font-medium mb-2">{t('inspector.visits.noVisits')}</p>
                <p className="text-blue-700 text-sm mb-4">{t('inspector.visits.scheduleFirst')}</p>
                <Button onClick={() => navigate('/inspector/visits/new')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('inspector.visits.scheduleNew')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <Card key={visit.id} className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-blue-100 hover:border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                          <ClipboardCheck className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-blue-900">{visit.teacher_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="border-blue-200 text-blue-700">
                              {visit.visit_type}
                            </Badge>
                            <Badge className={getStatusColor(visit.status)}>
                              {visit.status_display}
                            </Badge>
                            {visit.has_report && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                {t('inspector.visits.hasReport')}
                              </Badge>
                            )}
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
      </div>
    </DashboardLayout>
  );
}
