import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, Clock, Save } from 'lucide-react';
import { inspectionAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Teacher {
  id: number;
  full_name: string;
  email: string;
  school: string;
  subject: string;
  phone: string;
}

export default function InspectionVisitNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [formData, setFormData] = useState({
    teacher: '',
    visit_date: '',
    visit_time: '',
    visit_type: 'routine',
    notes: '',
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await inspectionAPI.getAssignedTeachers();
      // Handle both formats: {results: [...]} or direct array
      const teacherData = response.data.results || response.data;
      setTeachers(teacherData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: t('common.error'),
        description: t('visit.new.loadTeachersError'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await inspectionAPI.createVisit({
        teacher: parseInt(formData.teacher),
        visit_date: formData.visit_date,
        visit_time: formData.visit_time,
        inspection_type: formData.visit_type,
        notes: formData.notes,
      });

      toast({
        title: t('common.success'),
        description: t('visit.new.scheduleSuccess'),
      });

      navigate('/inspector');
    } catch (error: any) {
      console.error('Error creating visit:', error);
      console.error('Error response:', error.response?.data);
      
      // Extract error messages
      let errorMessage = t('visit.new.scheduleError');
      if (error.response?.data) {
        const errors = error.response.data;
        const errorMessages = Object.entries(errors).map(([field, messages]: [string, any]) => {
          return `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
        }).join('\n');
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/inspector')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.backToDashboard')}
        </Button>
        <h1 className="text-3xl font-bold">{t('visit.new.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('visit.new.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('visit.new.visitDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Teacher Selection */}
            <div className="space-y-2">
              <Label htmlFor="teacher">{t('visit.new.teacher')} *</Label>
              <Select
                value={formData.teacher}
                onValueChange={(value) =>
                  setFormData({ ...formData, teacher: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('visit.new.selectTeacher')} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{teacher.full_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {teacher.school} • {teacher.subject}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visit Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visit_date">{t('visit.new.visitDate')} *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="visit_date"
                    type="date"
                    required
                    value={formData.visit_date}
                    onChange={(e) =>
                      setFormData({ ...formData, visit_date: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit_time">{t('visit.new.visitTime')} *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="visit_time"
                    type="time"
                    required
                    value={formData.visit_time}
                    onChange={(e) =>
                      setFormData({ ...formData, visit_time: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Visit Type */}
            <div className="space-y-2">
              <Label htmlFor="visit_type">{t('visit.new.visitType')} *</Label>
              <Select
                value={formData.visit_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, visit_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">{t('visit.type.routine')}</SelectItem>
                  <SelectItem value="class_visit">{t('visit.type.classVisit')}</SelectItem>
                  <SelectItem value="follow_up">{t('visit.type.followUp')}</SelectItem>
                  <SelectItem value="complaint_based">{t('visit.type.complaint')}</SelectItem>
                  <SelectItem value="evaluation_renewal">{t('visit.type.evaluation')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('visit.new.notes')} *</Label>
              <Textarea
                id="notes"
                required
                placeholder={t('visit.new.notesPlaceholder')}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/inspector')}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? t('visit.new.scheduling') : t('visit.new.scheduleVisit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
