import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { relationshipAPI } from '@/lib/api';
import { TeacherStudentRelationship, UserBasic } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Users, UserPlus } from 'lucide-react';

const TeacherRelationships = () => {
  const [relationships, setRelationships] = useState<TeacherStudentRelationship[]>([]);
  const [availableStudents, setAvailableStudents] = useState<UserBasic[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [ratingDialog, setRatingDialog] = useState<{ open: boolean; relationship: TeacherStudentRelationship | null }>({
    open: false,
    relationship: null,
  });
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState('');
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchRelationships();
    fetchAvailableStudents();
  }, []);

  const fetchRelationships = async () => {
    try {
      const response = await relationshipAPI.getMyStudents();
      setRelationships(response.data);
    } catch (error) {
      console.error('Failed to fetch relationships:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your students',
        variant: 'destructive',
      });
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await relationshipAPI.getAvailableStudents();
      setAvailableStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch available students:', error);
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedStudent) return;
    
    setLoading(true);
    try {
      await relationshipAPI.assignStudent(parseInt(selectedStudent));
      toast({
        title: 'Success',
        description: 'Student assigned successfully',
      });
      setAssignDialogOpen(false);
      setSelectedStudent('');
      fetchRelationships();
      fetchAvailableStudents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to assign student',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRateStudent = async () => {
    if (!ratingDialog.relationship) return;
    
    setLoading(true);
    try {
      await relationshipAPI.rateStudent(ratingDialog.relationship.id, rating, comments);
      toast({
        title: 'Success',
        description: 'Rating submitted successfully',
      });
      setRatingDialog({ open: false, relationship: null });
      fetchRelationships();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit rating',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openRatingDialog = (relationship: TeacherStudentRelationship) => {
    setRatingDialog({ open: true, relationship });
    setRating(relationship.rating_by_teacher || 5);
    setComments(relationship.comments_by_teacher || '');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            My Students
          </h2>
          <p className="text-sm text-gray-600">Manage your student relationships and ratings</p>
        </div>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign New Student</DialogTitle>
              <DialogDescription>
                Select a student to add to your class
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('choose.student')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.length === 0 ? (
                      <SelectItem value="none" disabled>No available students</SelectItem>
                    ) : (
                      availableStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.full_name} ({student.username})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAssignStudent} 
                disabled={!selectedStudent || loading}
                className="w-full"
              >
                {loading ? 'Assigning...' : 'Assign Student'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Students ({relationships.length})</TabsTrigger>
          <TabsTrigger value="rated">Rated</TabsTrigger>
          <TabsTrigger value="unrated">Not Rated</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {relationships.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No students assigned yet</p>
                <p className="text-sm text-gray-400 mt-2">Click "Assign Student" to add students to your class</p>
              </CardContent>
            </Card>
          ) : (
            relationships.map((rel) => (
              <Card key={rel.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{rel.student_info.full_name}</CardTitle>
                      <CardDescription>@{rel.student_info.username}</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openRatingDialog(rel)}>
                      <Star className="h-4 w-4 mr-2" />
                      {rel.rating_by_teacher ? 'Update Rating' : 'Rate Student'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Your Rating</p>
                      {rel.rating_by_teacher ? (
                        <div className="space-y-1">
                          {renderStars(rel.rating_by_teacher)}
                          {rel.comments_by_teacher && (
                            <p className="text-sm text-gray-600 mt-2">{rel.comments_by_teacher}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not rated yet</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Student's Rating of You</p>
                      {rel.rating_by_student ? (
                        <div className="space-y-1">
                          {renderStars(rel.rating_by_student)}
                          {rel.comments_by_student && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{rel.comments_by_student}"</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not rated yet</p>
                      )}
                    </div>
                  </div>
                  {rel.average_rating && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-gray-700">
                        Average Rating: {rel.average_rating.toFixed(1)} / 5.0
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rated" className="space-y-4">
          {relationships.filter(r => r.rating_by_teacher).map((rel) => (
            <Card key={rel.id}>
              <CardHeader>
                <CardTitle>{rel.student_info.full_name}</CardTitle>
                <CardDescription>@{rel.student_info.username}</CardDescription>
              </CardHeader>
              <CardContent>
                {renderStars(rel.rating_by_teacher!)}
                {rel.comments_by_teacher && (
                  <p className="text-sm text-gray-600 mt-2">{rel.comments_by_teacher}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unrated" className="space-y-4">
          {relationships.filter(r => !r.rating_by_teacher).map((rel) => (
            <Card key={rel.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{rel.student_info.full_name}</CardTitle>
                    <CardDescription>@{rel.student_info.username}</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => openRatingDialog(rel)}>
                    Rate Student
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
            <DialogTitle>Rate {ratingDialog.relationship?.student_info.full_name}</DialogTitle>
            <DialogDescription>
              Provide your rating and feedback for this student
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating (1-5 stars)</Label>
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
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Share your thoughts about this student's progress..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleRateStudent} disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherRelationships;
