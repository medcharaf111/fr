import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { notebookAPI } from '@/lib/api';
import { NotebookPage } from '@/types/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Save, 
  BookOpen, 
  Users,
  MessageSquare,
  FileEdit,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  MinusCircle
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';

interface Student {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

const TeacherNotebookViewer = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [pages, setPages] = useState<NotebookPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Teacher inputs
  const [exercises, setExercises] = useState('');
  const [comment, setComment] = useState('');

  const currentPage = pages[currentPageIndex];

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (currentPage) {
      setExercises(currentPage.exercises_set_by_teacher || '');
      setComment(currentPage.teacher_comment || '');
    }
  }, [currentPage]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      // Get students from teacher's relationships
      const response = await api.get('/relationships/my-students/');
      // Extract student info from relationships
      const studentList = response.data.map((rel: any) => rel.student_info);
      setStudents(studentList);
    } catch (error) {
      console.error('Failed to load students:', error);
      setMessage({ text: 'Failed to load students', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentPages = async (studentId: number) => {
    try {
      setLoading(true);
      const response = await notebookAPI.getStudentPages(studentId);
      console.log('Loaded pages:', response.data);
      const sortedPages = response.data.sort((a: NotebookPage, b: NotebookPage) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setPages(sortedPages);
      setCurrentPageIndex(0);
    } catch (error) {
      console.error('Failed to load student pages:', error);
      setMessage({ text: 'Failed to load student notebook', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    loadStudentPages(student.id);
  };

  const saveExercises = async () => {
    if (!currentPage) return;
    
    try {
      setSaving(true);
      await notebookAPI.setExercises(currentPage.id, exercises);
      
      // Update local state
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        exercises_set_by_teacher: exercises,
      };
      setPages(updatedPages);
      
      setMessage({ text: 'Exercises saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save exercises:', error);
      setMessage({ text: 'Failed to save exercises', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const saveComment = async () => {
    if (!currentPage) return;
    
    try {
      setSaving(true);
      await notebookAPI.addTeacherComment(currentPage.id, comment);
      
      // Update local state
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        teacher_comment: comment,
        teacher_viewed: true,
        teacher_viewed_at: new Date().toISOString(),
      };
      setPages(updatedPages);
      
      setMessage({ text: 'Comment saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save comment:', error);
      setMessage({ text: 'Failed to save comment', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const createNewPage = async () => {
    if (!selectedStudent) return;
    
    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await notebookAPI.createStudentPage({
        student_id: selectedStudent.id,
        date: today,
        lesson_name: '',
        exercises_set_by_teacher: ''
      });
      
      // Reload pages to include the new one
      const pagesResponse = await notebookAPI.getStudentPages(selectedStudent.id);
      const updatedPages = pagesResponse.data;
      setPages(updatedPages);
      
      // Find and navigate to the newly created/updated page
      const newPageIndex = updatedPages.findIndex((p: NotebookPage) => p.date === today);
      if (newPageIndex !== -1) {
        setCurrentPageIndex(newPageIndex);
      } else {
        // If not found, go to the last page
        setCurrentPageIndex(updatedPages.length - 1);
      }
      
      setMessage({ text: 'New page created for student!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Failed to create page:', error);
      const errorMsg = error.response?.data?.error || 'Failed to create new page';
      setMessage({ text: errorMsg, type: 'error' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const markAnswer = async (status: 'correct' | 'incorrect' | 'partial') => {
    if (!currentPage) return;
    
    try {
      setSaving(true);
      await notebookAPI.markAnswer(currentPage.id, status);
      
      // Update local state
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        answer_status: status,
        teacher_viewed: true,
        teacher_viewed_at: new Date().toISOString(),
      };
      setPages(updatedPages);
      
      const statusText = status === 'correct' ? '✓ Correct' : status === 'incorrect' ? '✗ Incorrect' : '~ Partially Correct';
      setMessage({ text: `Marked as ${statusText}`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to mark answer:', error);
      setMessage({ text: 'Failed to mark answer', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      const newIndex = currentPageIndex - 1;
      console.log('Going to previous page:', { currentPageIndex, newIndex, totalPages: pages.length });
      setCurrentPageIndex(newIndex);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      const newIndex = currentPageIndex + 1;
      console.log('Going to next page:', { currentPageIndex, newIndex, totalPages: pages.length });
      setCurrentPageIndex(newIndex);
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !selectedStudent) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Student Notebooks
            </h1>
            <p className="text-sm text-muted-foreground">View and manage your students' daily notebooks</p>
          </div>
        </div>
      </div>

      {message && (
        <Alert className="mb-4 shadow-sm" variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student List Sidebar */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Students
            </CardTitle>
            <CardDescription>{students.length} students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => selectStudent(student)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedStudent?.id === student.id
                      ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-sm">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{student.username}</p>
                </button>
              ))}
              
              {filteredStudents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notebook Viewer */}
        <div className="lg:col-span-3">
          {!selectedStudent ? (
            <Card className="shadow-xl border-2">
              <CardContent className="p-12 text-center">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-12 w-12 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Select a Student</h3>
                <p className="text-muted-foreground">Choose a student from the list to view their notebook</p>
              </CardContent>
            </Card>
          ) : pages.length === 0 ? (
            <Card className="shadow-xl border-2">
              <CardContent className="p-12 text-center">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Pages Yet</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedStudent.first_name} doesn't have any notebook pages yet
                </p>
                <Button onClick={createNewPage} disabled={saving} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Page
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Student Info Banner with Create Button */}
              <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Viewing notebook of:</p>
                    <p className="text-xl font-bold">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </p>
                  </div>
                  <Button 
                    onClick={createNewPage} 
                    disabled={saving}
                    variant="secondary"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Page
                  </Button>
                </CardContent>
              </Card>

              {/* Notebook Page */}
              <Card 
                key={currentPage?.id || currentPageIndex}
                className="shadow-2xl border-2 border-gray-300 bg-gradient-to-br from-white via-indigo-50/20 to-white"
              >
                {/* Top edge with hole punch effect */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 flex gap-8 z-10">
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400 shadow-inner"></div>
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400 shadow-inner"></div>
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400 shadow-inner"></div>
                </div>

                {/* Header */}
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-b-4 border-purple-700">
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
                      <CardDescription className="text-indigo-100 mt-1">
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

                <CardContent 
                  className="p-8 space-y-6"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e0e7ff 31px, #e0e7ff 32px)',
                    backgroundSize: '100% 32px'
                  }}
                >
                  {/* Red margin line */}
                  <div className="absolute left-20 top-0 bottom-0 w-0.5 bg-red-300/50"></div>

                  {/* Lesson Name - Read Only */}
                  <div className="space-y-2 relative pl-24">
                    <Label className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                      📚 Lesson
                    </Label>
                    <div className="p-3 bg-white/80 backdrop-blur border-2 border-indigo-200 rounded-lg">
                      <p className="text-xl font-semibold text-indigo-900">
                        {currentPage?.lesson_name || 'No lesson name'}
                      </p>
                    </div>
                  </div>

                  {/* Set Exercises for Students */}
                  <div className="space-y-2 relative pl-24">
                    <Label htmlFor="exercises" className="text-lg font-bold text-blue-900 flex items-center gap-2">
                      <FileEdit className="h-5 w-5" />
                      Set Exercises for Student
                    </Label>
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Number your exercises clearly (1., 2., 3., etc.) so students can answer them in order.
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Example:<br />
                        1. Solve: 2x + 5 = 15<br />
                        2. What is the capital of France?<br />
                        3. Explain photosynthesis in your own words.
                      </p>
                    </div>
                    <Textarea
                      id="exercises"
                      value={exercises}
                      onChange={(e) => setExercises(e.target.value)}
                      placeholder="Write the exercises or questions you want the student to complete...&#10;&#10;1. First exercise goes here&#10;2. Second exercise goes here&#10;3. Third exercise goes here&#10;&#10;Number each exercise so students can match their answers!"
                      className="min-h-[200px] text-base bg-white/80 backdrop-blur border-2 border-blue-200 focus:border-blue-500 shadow-sm leading-8"
                      style={{ lineHeight: '32px' }}
                    />
                    <Button 
                      onClick={saveExercises} 
                      disabled={saving || !exercises.trim()}
                      className="shadow-md bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Exercises'}
                    </Button>
                    {!exercises.trim() && (
                      <p className="text-sm text-amber-600">⚠️ Students cannot answer until you set exercises</p>
                    )}
                  </div>

                  {/* Student's Answers - Read Only */}
                  {currentPage?.exercises_answers ? (
                    <div className="space-y-3 relative pl-24">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg font-bold text-green-900 flex items-center gap-2">
                          ✍️ Student's Answers
                        </Label>
                        {/* Answer Status Badge */}
                        {currentPage.answer_status && currentPage.answer_status !== 'pending' && (
                          <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                            currentPage.answer_status === 'correct' 
                              ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                              : currentPage.answer_status === 'incorrect'
                              ? 'bg-red-100 text-red-800 border-2 border-red-300'
                              : 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                          }`}>
                            {currentPage.answer_status === 'correct' && <CheckCircle className="h-4 w-4" />}
                            {currentPage.answer_status === 'incorrect' && <XCircle className="h-4 w-4" />}
                            {currentPage.answer_status === 'partial' && <MinusCircle className="h-4 w-4" />}
                            {currentPage.answer_status === 'correct' && 'Correct'}
                            {currentPage.answer_status === 'incorrect' && 'Incorrect'}
                            {currentPage.answer_status === 'partial' && 'Partially Correct'}
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <div className="text-base text-green-900 whitespace-pre-wrap leading-relaxed">
                          {currentPage.exercises_answers.split('\n').map((line, index) => {
                            // Check if line is a numbered answer (e.g., "1.", "2.", "Answer 1:", etc.)
                            const isAnswerNumber = /^\d+[.:)\-]/.test(line.trim()) || /^Answer\s+\d+/i.test(line.trim());
                            return (
                              <p key={index} className={`${isAnswerNumber ? 'font-bold mt-3 mb-1 text-green-800' : 'mb-1'}`}>
                                {line || '\u00A0'}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                      {/* Marking Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => markAnswer('correct')}
                          disabled={saving}
                          variant={currentPage.answer_status === 'correct' ? 'default' : 'outline'}
                          className={`flex-1 ${currentPage.answer_status === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-700 hover:bg-green-50'}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Correct
                        </Button>
                        <Button
                          onClick={() => markAnswer('partial')}
                          disabled={saving}
                          variant={currentPage.answer_status === 'partial' ? 'default' : 'outline'}
                          className={`flex-1 ${currentPage.answer_status === 'partial' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-600 text-amber-700 hover:bg-amber-50'}`}
                        >
                          <MinusCircle className="h-4 w-4 mr-2" />
                          Partial
                        </Button>
                        <Button
                          onClick={() => markAnswer('incorrect')}
                          disabled={saving}
                          variant={currentPage.answer_status === 'incorrect' ? 'default' : 'outline'}
                          className={`flex-1 ${currentPage.answer_status === 'incorrect' ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-700 hover:bg-red-50'}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Incorrect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 relative pl-24">
                      <Label className="text-lg font-bold text-gray-600 flex items-center gap-2">
                        ✍️ Student's Answers
                      </Label>
                      <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
                        <p className="text-gray-500 italic">Student hasn't submitted answers yet</p>
                      </div>
                    </div>
                  )}

                  {/* Student's Notes - Read Only */}
                  {currentPage?.notes && (
                    <div className="space-y-2 relative pl-24">
                      <Label className="text-lg font-bold text-purple-900 flex items-center gap-2">
                        💭 Student's Notes
                      </Label>
                      <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                        <p className="text-base text-purple-900 whitespace-pre-wrap leading-relaxed">
                          {currentPage.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Add Teacher Comment */}
                  <div className="space-y-2 relative pl-24">
                    <Label htmlFor="comment" className="text-lg font-bold text-amber-900 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Your Feedback
                    </Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write your feedback and comments for the student..."
                      className="min-h-[100px] text-base bg-white/80 backdrop-blur border-2 border-amber-200 focus:border-amber-500 shadow-sm"
                    />
                    <Button 
                      onClick={saveComment} 
                      disabled={saving}
                      className="shadow-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Feedback'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Page indicators */}
              <div className="flex justify-center gap-2">
                {pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPageIndex(index)}
                    className={`h-2.5 rounded-full transition-all shadow-sm ${
                      index === currentPageIndex
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 w-8'
                        : 'bg-gray-300 hover:bg-gray-400 w-2.5'
                    }`}
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherNotebookViewer;
