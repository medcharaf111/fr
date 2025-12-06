import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notebookAPI } from '@/lib/api';
import { NotebookPage } from '@/types/api';
import { format } from 'date-fns';
import { BookmarkIcon, BookOpen, Calendar, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

const StudentNotebook = () => {
  const [pages, setPages] = useState<NotebookPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Current page being edited
  const [editedPage, setEditedPage] = useState<Partial<NotebookPage>>({});
  
  const currentPage = pages[currentPageIndex];

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (currentPage) {
      setEditedPage({
        lesson_name: currentPage.lesson_name,
        exercises_answers: currentPage.exercises_answers,
        notes: currentPage.notes,
      });
    }
  }, [currentPage]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await notebookAPI.getMyPages();
      setPages(response.data);
      
      // If no pages exist, create today's page
      if (response.data.length === 0) {
        await createTodayPage();
      }
    } catch (error) {
      console.error('Failed to load notebook pages:', error);
      setMessage({ text: 'Failed to load notebook pages', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const createTodayPage = async () => {
    try {
      const response = await notebookAPI.getTodayPage();
      setPages([response.data.page]);
      setCurrentPageIndex(0);
    } catch (error) {
      console.error('Failed to create today page:', error);
      setMessage({ text: 'Failed to create today\'s page', type: 'error' });
    }
  };

  const savePage = async () => {
    if (!currentPage) return;
    
    try {
      setSaving(true);
      await notebookAPI.updatePage(currentPage.id, {
        lesson_name: editedPage.lesson_name,
        exercises_answers: editedPage.exercises_answers,
        notes: editedPage.notes,
      });
      
      // Update local state
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        ...editedPage,
      };
      setPages(updatedPages);
      
      setMessage({ text: 'Page saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save page:', error);
      setMessage({ text: 'Failed to save page', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const createNewPage = async () => {
    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await notebookAPI.createPage({
        date: today,
        lesson_name: '',
        exercises_answers: '',
        notes: '',
      });
      
      setPages([response.data, ...pages]);
      setCurrentPageIndex(0);
      setMessage({ text: 'New page created!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to create page:', error);
      setMessage({ text: 'Failed to create new page', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  // Swipe handling
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left - go to next page
      goToNextPage();
    }

    if (touchStart - touchEnd < -75) {
      // Swiped right - go to previous page
      goToPreviousPage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading notebook...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Header with notebook title */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              My Daily Notebook
            </h1>
            <p className="text-sm text-muted-foreground">Record your daily lessons and exercises</p>
          </div>
        </div>
      </div>

      {message && (
        <Alert className="mb-4 shadow-sm" variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {pages.length === 0 ? (
          <Card className="shadow-xl border-2 border-border">
            <CardContent className="p-12 text-center">
              <div className="bg-gradient-to-br from-muted via-muted/80 to-muted rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-foreground" />
              </div>
            <h3 className="text-xl font-semibold mb-2">Your notebook is empty</h3>
            <p className="text-muted-foreground mb-2">Your teacher will create pages with exercises for you</p>
            <p className="text-sm text-muted-foreground">Check back later to see your assignments!</p>
          </CardContent>
        </Card>
      ) : (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative"
        >
          {/* Notebook page with realistic styling */}
          <Card className="shadow-2xl border-2 border-border bg-gradient-to-br from-background via-muted/20 to-background">
            {/* Top edge with hole punch effect */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 flex gap-8">
              <div className="w-4 h-4 rounded-full bg-background border-2 border-border shadow-inner"></div>
              <div className="w-4 h-4 rounded-full bg-background border-2 border-border shadow-inner"></div>
              <div className="w-4 h-4 rounded-full bg-background border-2 border-border shadow-inner"></div>
            </div>

            {/* Header with date and navigation */}
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-b-4 border-indigo-700">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={currentPageIndex === 0}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <div className="text-center">
                  <CardTitle className="flex items-center gap-2 justify-center text-2xl">
                    <Calendar className="h-6 w-6" />
                    {currentPage && format(new Date(currentPage.date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-1">
                    Page {currentPageIndex + 1} of {pages.length}
                  </CardDescription>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={currentPageIndex === pages.length - 1}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </CardHeader>

            {/* Notebook lines background and content */}
            <CardContent
              className="p-8 space-y-6 min-h-[600px] relative"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, hsl(var(--muted) / 0.15) 31px, hsl(var(--muted) / 0.15) 32px)',
                backgroundSize: '100% 32px'
              }}
            >
              {/* Red margin line */}
              <div className="absolute left-20 top-0 bottom-0 w-0.5 bg-red-300/50"></div>

              {/* Lesson Name */}
              <div className="space-y-2 relative pl-24">
                <Label htmlFor="lesson-name" className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BookmarkIcon className="h-5 w-5" />
                  Lesson Name
                </Label>
                <Input
                  id="lesson-name"
                  value={editedPage.lesson_name || ''}
                  onChange={(e) => setEditedPage({ ...editedPage, lesson_name: e.target.value })}
                  placeholder="Enter the lesson name..."
                  className="text-xl font-semibold bg-background/90 backdrop-blur border-2 border-border focus:border-blue-500 shadow-sm"
                />
              </div>

              {/* Exercises Set by Teacher */}
              {currentPage?.exercises_set_by_teacher ? (
                <>
                  <div className="space-y-2 relative pl-24">
                    <Label className="text-lg font-bold text-foreground flex items-center gap-2">
                      📝 Exercises from Teacher
                      <span className="text-sm font-normal text-foreground bg-muted px-2 py-1 rounded-full">
                        {currentPage.exercises_set_by_teacher.split('\n').filter(line => /^\d+[.:)\-]/.test(line.trim())).length} exercise(s)
                      </span>
                    </Label>
                    <div className="p-5 bg-gradient-to-br from-muted via-muted/80 to-muted border-2 border-border rounded-lg shadow-md relative">
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-md">
                        Teacher Assignment
                      </div>
                      <div className="text-base text-foreground whitespace-pre-wrap font-medium leading-relaxed">
                        {currentPage.exercises_set_by_teacher.split('\n').map((line, index) => {
                          // Check if line is a numbered exercise (e.g., "1.", "2.", "Exercise 1:", etc.)
                          const isExerciseNumber = /^\d+[.:)\-]/.test(line.trim()) || /^Exercise\s+\d+/i.test(line.trim());
                          return (
                            <p key={index} className={`${isExerciseNumber ? 'font-bold mt-3 mb-1' : 'mb-1'}`}>
                              {line || '\u00A0'}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Student's Answers */}
                  <div className="space-y-2 relative pl-24">
                    <Label htmlFor="exercises-answers" className="text-lg font-bold text-foreground flex items-center gap-2">
                      ✍️ My Answers
                    </Label>
                    <Textarea
                      id="exercises-answers"
                      value={editedPage.exercises_answers || ''}
                      onChange={(e) => setEditedPage({ ...editedPage, exercises_answers: e.target.value })}
                      placeholder="Write your answers here... Number them to match the exercises (1., 2., 3., etc.)"
                      className="min-h-[200px] text-base bg-background/90 backdrop-blur border-2 border-border focus:border-green-500 shadow-sm leading-8 font-handwriting"
                      style={{ lineHeight: '32px' }}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2 relative pl-24">
                  <div className="p-8 bg-gradient-to-br from-muted via-muted/80 to-muted border-2 border-border rounded-lg shadow-sm text-center">
                    <div className="bg-muted-foreground/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📝</span>
                    </div>
                    <p className="text-foreground font-medium mb-2">No Exercises Assigned Yet</p>
                    <p className="text-sm text-muted-foreground">Your teacher hasn't set any exercises for this page. Check back later!</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2 relative pl-24">
                <Label htmlFor="notes" className="text-lg font-bold text-foreground flex items-center gap-2">
                  💭 My Notes & Thoughts
                </Label>
                <Textarea
                  id="notes"
                  value={editedPage.notes || ''}
                  onChange={(e) => setEditedPage({ ...editedPage, notes: e.target.value })}
                  placeholder="Additional notes, questions, or things I learned today..."
                  className="min-h-[120px] text-base bg-background/90 backdrop-blur border-2 border-border focus:border-purple-500 shadow-sm leading-8"
                  style={{ lineHeight: '32px' }}
                />
              </div>

              {/* Teacher Comment */}
              {currentPage?.teacher_comment && (
                <div className="relative pl-24">
                  <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-300 rounded-lg shadow-lg relative">
                    <div className="absolute -top-3 -left-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg transform -rotate-3">
                      ⭐ Teacher's Feedback
                    </div>
                    <p className="text-base text-amber-900 font-medium pt-3">{currentPage.teacher_comment}</p>
                    {currentPage.teacher_viewed_at && (
                      <p className="text-xs text-amber-700 mt-3 italic">
                        📅 Reviewed on {format(new Date(currentPage.teacher_viewed_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-6 relative pl-24">
                <Button onClick={savePage} disabled={saving} size="lg" className="shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  <Save className="h-5 w-5 mr-2" />
                  {saving ? 'Saving...' : 'Save My Work'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Page indicators (dots) */}
          <div className="flex justify-center gap-2 mt-6">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPageIndex(index)}
                className={`h-2.5 rounded-full transition-all shadow-sm ${
                  index === currentPageIndex
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400 w-2.5'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNotebook;
