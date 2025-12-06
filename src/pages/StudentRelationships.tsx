import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { relationshipAPI } from '@/lib/api';
import { TeacherStudentRelationship } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';
import { Star, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const StudentRelationships = () => {
  const [relationships, setRelationships] = useState<TeacherStudentRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratingDialog, setRatingDialog] = useState<{ open: boolean; relationship: TeacherStudentRelationship | null }>({
    open: false,
    relationship: null,
  });
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState('');
  const { toast } = useToast();
  const { t, dir } = useLanguage();

  useEffect(() => {
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      const response = await relationshipAPI.getMyTeachers();
      setRelationships(response.data);
    } catch (error) {
      console.error('Failed to fetch relationships:', error);
      toast({
        title: t('common.error'),
        description: t('student.failedToLoadTeachers'),
        variant: 'destructive',
      });
    }
  };

  const handleRateTeacher = async () => {
    if (!ratingDialog.relationship) return;
    
    setLoading(true);
    try {
      await relationshipAPI.rateTeacher(ratingDialog.relationship.id, rating, comments);
      toast({
        title: t('common.success'),
        description: t('student.ratingSubmitted'),
      });
      setRatingDialog({ open: false, relationship: null });
      fetchRelationships();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('student.failedToSubmitRating'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openRatingDialog = (relationship: TeacherStudentRelationship) => {
    setRatingDialog({ open: true, relationship });
    setRating(relationship.rating_by_student || 5);
    setComments(relationship.comments_by_student || '');
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const SUBJECT_NAMES: Record<string, string> = {
    math: t('subject.math'),
    science: t('subject.science'),
    english: t('subject.english'),
    arabic: t('subject.arabic'),
    social_studies: t('subject.social_studies'),
    art: t('subject.art'),
    music: t('subject.music'),
    physical_education: t('subject.physical_education'),
    computer_science: t('subject.computer_science'),
    religious_studies: t('subject.religious_studies'),
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          {t('student.myTeachers')}
        </h2>
        <p className="text-sm text-gray-600">{t('student.viewTeachersAndFeedback')}</p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t('student.allTeachers')} ({relationships.length})</TabsTrigger>
          <TabsTrigger value="rated">{t('student.rated')}</TabsTrigger>
          <TabsTrigger value="unrated">{t('student.unrated')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {relationships.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">{t('student.noTeachersAssigned')}</p>
                <p className="text-sm text-gray-400 mt-2">{t('student.teachersWillAppearHere')}</p>
              </CardContent>
            </Card>
          ) : (
            relationships.map((rel) => (
              <Card key={rel.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {rel.teacher_info.full_name}
                        <div className="flex gap-1 flex-wrap">
                          {rel.teacher_info.subjects?.map((subject) => (
                            <span key={subject} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {SUBJECT_NAMES[subject] || subject}
                            </span>
                          ))}
                        </div>
                      </CardTitle>
                      <CardDescription>@{rel.teacher_info.username}</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openRatingDialog(rel)}>
                      <Star className="h-4 w-4 mr-2" />
                      {rel.rating_by_student ? t('student.updateRating') : t('student.rateTeacher')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">{t('student.yourRating')}</p>
                      {rel.rating_by_student ? (
                        <div className="space-y-1">
                          {renderStars(rel.rating_by_student)}
                          {rel.comments_by_student && (
                            <p className="text-sm text-gray-600 mt-2">{rel.comments_by_student}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">{t('student.notRatedYet')}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">{t('student.teachersRatingOfYou')}</p>
                      {rel.rating_by_teacher ? (
                        <div className="space-y-1">
                          {renderStars(rel.rating_by_teacher)}
                          {rel.comments_by_teacher && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{rel.comments_by_teacher}"</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">{t('student.notRatedYet')}</p>
                      )}
                    </div>
                  </div>
                  {rel.average_rating && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-gray-700">
                        {t('student.averageRating')}: {rel.average_rating.toFixed(1)} / 5.0
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rated" className="space-y-4">
          {relationships.filter(r => r.rating_by_student).map((rel) => (
            <Card key={rel.id}>
              <CardHeader>
                <CardTitle>{rel.teacher_info.full_name}</CardTitle>
                <CardDescription>
                  {rel.teacher_info.subjects?.map(s => SUBJECT_NAMES[s] || s).join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStars(rel.rating_by_student!)}
                {rel.comments_by_student && (
                  <p className="text-sm text-gray-600 mt-2">{rel.comments_by_student}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unrated" className="space-y-4">
          {relationships.filter(r => !r.rating_by_student).map((rel) => (
            <Card key={rel.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{rel.teacher_info.full_name}</CardTitle>
                    <CardDescription>
                      {rel.teacher_info.subjects?.map(s => SUBJECT_NAMES[s] || s).join(', ')}
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => openRatingDialog(rel)}>
                    {t('student.rateTeacher')}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Rating Dialog */}
      <Dialog open={ratingDialog.open} onOpenChange={(open) => setRatingDialog({ open, relationship: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('student.rateYourTeacher')} - {ratingDialog.relationship?.teacher_info.full_name}</DialogTitle>
            <DialogDescription>
              {t('student.provideRatingFor')} {ratingDialog.relationship?.teacher_info.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('student.selectRating')} (1-5)</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 cursor-pointer transition-colors ${
                        star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comments">{t('student.yourComments')}</Label>
              <Textarea
                id="comments"
                placeholder={t('student.shareYourThoughts')}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleRateTeacher} disabled={loading} className="w-full">
              {loading ? t('student.submitting') : t('student.submitRating')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentRelationships;
