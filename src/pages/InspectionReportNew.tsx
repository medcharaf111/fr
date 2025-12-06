import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Star } from 'lucide-react';
import { inspectionAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Visit {
  id: number;
  teacher_name: string;
  school_name: string;
  visit_date: string;
  inspection_type_display: string;
}

export default function InspectionReportNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visit_id');
  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [formData, setFormData] = useState({
    teaching_quality: 3,
    class_management: 3,
    student_engagement: 3,
    content_delivery: 3,
    final_rating: 3,
    strengths: '',
    weaknesses: '',
    recommendations: '',
    summary: '',
    follow_up_needed: false,
    follow_up_notes: '',
  });

  useEffect(() => {
    if (visitId) {
      fetchVisit();
    }
  }, [visitId]);

  useEffect(() => {
    // Calculate average rating
    const avg = (
      formData.teaching_quality +
      formData.class_management +
      formData.student_engagement +
      formData.content_delivery
    ) / 4;
    setFormData((prev) => ({ ...prev, final_rating: Math.round(avg * 10) / 10 }));
  }, [
    formData.teaching_quality,
    formData.class_management,
    formData.student_engagement,
    formData.content_delivery,
  ]);

  const fetchVisit = async () => {
    try {
      const response = await inspectionAPI.getVisit(Number(visitId));
      setVisit(response.data);
    } catch (error) {
      console.error('Error fetching visit:', error);
      toast({
        title: t('common.error'),
        description: t('report.new.loadVisitError'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitId) return;

    // Debug: Check authentication
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    console.log('Auth Debug:', {
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : 'none',
      user: user ? JSON.parse(user) : 'none'
    });

    setLoading(true);

    try {
      await inspectionAPI.createReport({
        visit: Number(visitId),
        teaching_quality_rating: formData.teaching_quality,
        class_management_rating: formData.class_management,
        student_engagement_rating: formData.student_engagement,
        content_delivery_rating: formData.content_delivery,
        final_rating: formData.final_rating,
        strengths: formData.strengths,
        weaknesses: formData.weaknesses,
        recommendations: formData.recommendations,
        summary: formData.summary,
        follow_up_needed: formData.follow_up_needed,
        follow_up_notes: formData.follow_up_notes,
      });

      toast({
        title: t('common.success'),
        description: t('report.new.submitSuccess'),
      });

      navigate('/inspector');
    } catch (error: any) {
      console.error('Error creating report:', error);
      console.error('Error response:', error.response?.data);
      
      // Enhanced auth error logging
      if (error.response?.status === 401) {
        console.error('401 UNAUTHORIZED - Token may be expired or invalid');
        console.error('Current token:', localStorage.getItem('access_token')?.substring(0, 20));
        console.error('Current user:', localStorage.getItem('user'));
      }

      let errorMessage = t('report.new.submitError');
      if (error.response?.status === 401) {
        errorMessage = t('common.authFailed');
        // Redirect to login after 2 seconds
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.data) {
        const errors = error.response.data;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]: [string, any]) => {
            return `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          })
          .join('\n');
        errorMessage = errorMessages || errorMessage;
      }

      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const RatingInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 ${
                rating <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
      </div>
    </div>
  );

  if (!visitId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">{t('report.new.noVisitId')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/inspector/visits/${visitId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('report.new.backToVisit')}
        </Button>
        <h1 className="text-3xl font-bold">{t('report.new.title')}</h1>
        {visit && (
          <p className="text-muted-foreground mt-2">
            {visit.inspection_type_display} - {visit.teacher_name} at{' '}
            {visit.school_name}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ratings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('report.new.performanceRatings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RatingInput
              label={t('report.new.teachingQuality')}
              value={formData.teaching_quality}
              onChange={(value) =>
                setFormData({ ...formData, teaching_quality: value })
              }
            />
            <RatingInput
              label={t('report.new.classManagement')}
              value={formData.class_management}
              onChange={(value) =>
                setFormData({ ...formData, class_management: value })
              }
            />
            <RatingInput
              label={t('report.new.studentEngagement')}
              value={formData.student_engagement}
              onChange={(value) =>
                setFormData({ ...formData, student_engagement: value })
              }
            />
            <RatingInput
              label={t('report.new.contentDelivery')}
              value={formData.content_delivery}
              onChange={(value) =>
                setFormData({ ...formData, content_delivery: value })
              }
            />

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-lg">{t('report.new.finalRating')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {formData.final_rating}
                  </span>
                  <span className="text-muted-foreground">/5</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('report.new.averageRatings')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>{t('report.new.detailedFeedback')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strengths">{t('report.new.strengths')} *</Label>
              <Textarea
                id="strengths"
                required
                placeholder={t('report.new.strengthsPlaceholder')}
                value={formData.strengths}
                onChange={(e) =>
                  setFormData({ ...formData, strengths: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weaknesses">{t('report.new.weaknesses')} *</Label>
              <Textarea
                id="weaknesses"
                required
                placeholder={t('report.new.weaknessesPlaceholder')}
                value={formData.weaknesses}
                onChange={(e) =>
                  setFormData({ ...formData, weaknesses: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">{t('report.new.recommendations')} *</Label>
              <Textarea
                id="recommendations"
                required
                placeholder={t('report.new.recommendationsPlaceholder')}
                value={formData.recommendations}
                onChange={(e) =>
                  setFormData({ ...formData, recommendations: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">{t('report.new.summary')} *</Label>
              <Textarea
                id="summary"
                required
                placeholder={t('report.new.summaryPlaceholder')}
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Follow-up */}
        <Card>
          <CardHeader>
            <CardTitle>{t('report.new.followUp')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="follow_up_needed"
                checked={formData.follow_up_needed}
                onChange={(e) =>
                  setFormData({ ...formData, follow_up_needed: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="follow_up_needed" className="cursor-pointer">
                {t('report.new.followUpNeeded')}
              </Label>
            </div>

            {formData.follow_up_needed && (
              <div className="space-y-2">
                <Label htmlFor="follow_up_notes">{t('report.new.followUpNotes')}</Label>
                <Textarea
                  id="follow_up_notes"
                  placeholder={t('report.new.followUpPlaceholder')}
                  value={formData.follow_up_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, follow_up_notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/inspector/visits/${visitId}`)}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? t('report.new.submitting') : t('report.new.submitReport')}
          </Button>
        </div>
      </form>
    </div>
  );
}
