import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, Eye, Edit, Trash2, FileText, Loader2 } from 'lucide-react';
import { testAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';

interface Test {
  id: number;
  lesson: number;
  lesson_title: string;
  title: string;
  questions: Question[];
  question_type: 'mcq' | 'qa';
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_by_name?: string;
  reviewed_by_name?: string;
  review_notes?: string;
  num_questions: number;
  created_at: string;
  updated_at: string;
}

interface Question {
  question: string;
  options?: string[];  // Optional for Q&A questions
  correct_answer?: number;  // Optional for Q&A questions
  explanation?: string;  // Optional for MCQ
  expected_points?: string;  // Optional for Q&A questions
}

interface TestSubmission {
  id: number;
  test: number;
  test_title: string;
  student: number;
  student_name: string;
  answers: any;
  score: number;
  status: 'submitted' | 'approved' | 'rejected';
  attempt_number: number;
  is_final: boolean;
  teacher_feedback: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by_name?: string;
}

const TestManagement = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [pendingTests, setPendingTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<TestSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [studentSelectionDialogOpen, setStudentSelectionDialogOpen] = useState(false);
  const [students, setStudents] = useState<Array<{id: number, username: string, full_name: string}>>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submissionFeedback, setSubmissionFeedback] = useState('');
  const [editedQuestions, setEditedQuestions] = useState<Question[]>([]);
  const { toast} = useToast();
  const navigate = useNavigate();
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only teachers can manage tests',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const [allTests, pending, subs] = await Promise.all([
        testAPI.getAll('mcq'),  // Fetch only MCQ tests
        testAPI.getPending(),
        testAPI.getSubmissions(),
      ]);
      setTests(allTests.data);
      setPendingTests(pending.data);
      setSubmissions(subs.data);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSubmission = async (submission: TestSubmission) => {
    try {
      await testAPI.approveSubmission(submission.test, submission.id, submissionFeedback);
      toast({
        title: 'Success',
        description: 'Submission approved and marks saved!',
      });
      setSubmissionDialogOpen(false);
      setSubmissionFeedback('');
      fetchTests();
    } catch (error) {
      console.error('Failed to approve submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve submission',
        variant: 'destructive',
      });
    }
  };

  const handleRejectSubmission = async (submission: TestSubmission) => {
    if (!submissionFeedback.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide feedback for rejection',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await testAPI.rejectSubmission(submission.test, submission.id, submissionFeedback);
      toast({
        title: 'Submission Rejected',
        description: 'Student can retake the test',
      });
      setSubmissionDialogOpen(false);
      setSubmissionFeedback('');
      fetchTests();
    } catch (error) {
      console.error('Failed to reject submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject submission',
        variant: 'destructive',
      });
    }
  };

  const loadStudents = async () => {
    try {
      const response = await testAPI.getMyStudents();
      // Backend returns {students: [...]}
      const studentList = response.data.students || response.data;
      setStudents(Array.isArray(studentList) ? studentList : []);
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudents([]); // Reset to empty array on error
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (testId: number) => {
    // Open student selection dialog instead of directly approving
    setSelectedTest(tests.find(t => t.id === testId) || null);
    await loadStudents();
    setStudentSelectionDialogOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (selectedStudentIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one student',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedTest) return;

    try {
      await testAPI.approve(selectedTest.id, selectedStudentIds, reviewNotes);
      toast({
        title: 'Success',
        description: `Test approved and personalized for ${selectedStudentIds.length} student(s)`,
      });
      setStudentSelectionDialogOpen(false);
      setReviewDialogOpen(false);
      setSelectedStudentIds([]);
      setReviewNotes('');
      fetchTests();
    } catch (error) {
      console.error('Failed to approve test:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve test',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(students.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleReject = async (testId: number) => {
    if (!reviewNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await testAPI.reject(testId, reviewNotes);
      toast({
        title: 'Test Rejected',
        description: 'The test has been rejected',
      });
      setReviewDialogOpen(false);
      setReviewNotes('');
      fetchTests();
    } catch (error) {
      console.error('Failed to reject test:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject test',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateQuestions = async () => {
    if (!selectedTest) return;
    
    try {
      await testAPI.updateQuestions(selectedTest.id, editedQuestions);
      toast({
        title: 'Success',
        description: 'Questions updated successfully',
      });
      setEditDialogOpen(false);
      fetchTests();
    } catch (error) {
      console.error('Failed to update questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update questions',
        variant: 'destructive',
      });
    }
  };

  const openReviewDialog = (test: Test) => {
    setSelectedTest(test);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const openEditDialog = (test: Test) => {
    setSelectedTest(test);
    // Ensure questions is always an array
    const questions = Array.isArray(test.questions) ? test.questions : [];
    setEditedQuestions(JSON.parse(JSON.stringify(questions))); // Deep copy
    setEditDialogOpen(true);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...editedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setEditedQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...editedQuestions];
    updated[qIndex].options[optIndex] = value;
    setEditedQuestions(updated);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending Review' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      draft: { variant: 'outline', label: 'Draft' },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderTestCard = (test: Test) => (
    <Card key={test.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {test.title}
              {getStatusBadge(test.status)}
            </CardTitle>
            <CardDescription>
              Lesson: {test.lesson_title} • {test.num_questions} questions
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-1">
              Created by {test.created_by_name} on {new Date(test.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {test.review_notes && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Review Notes:</p>
            <p className="text-sm text-muted-foreground">{test.review_notes}</p>
            {test.reviewed_by_name && (
              <p className="text-xs text-muted-foreground mt-1">
                Reviewed by {test.reviewed_by_name}
              </p>
            )}
          </div>
        )}
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openReviewDialog(test)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Review
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDialog(test)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Questions
          </Button>
          
          {test.status === 'pending' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleApprove(test.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedTest(test);
                  setReviewNotes('');
                  setReviewDialogOpen(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Test Management</h1>
          <p className="text-muted-foreground">
            Review and approve AI-generated MCQ tests
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">
              Pending Tests ({pendingTests.length})
            </TabsTrigger>
            <TabsTrigger value="submissions">
              Student Submissions
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({tests.filter(t => t.status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({tests.filter(t => t.status === 'rejected').length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Tests ({tests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingTests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending tests to review</p>
                </CardContent>
              </Card>
            ) : (
              pendingTests.map(renderTestCard)
            )}
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Student Test Submissions</h2>
                <Badge variant="secondary">{submissions.length} total</Badge>
              </div>
              
              {submissions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No student submissions yet</p>
                  </CardContent>
                </Card>
              ) : (
                submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {submission.student_name}
                          </CardTitle>
                          <CardDescription>
                            {submission.test_title} • Score: {submission.score}%
                          </CardDescription>
                          <p className="text-sm text-muted-foreground mt-1">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                            {submission.attempt_number > 1 && ` • Attempt #${submission.attempt_number}`}
                          </p>
                        </div>
                        <Badge variant={
                          submission.status === 'approved' ? 'default' :
                          submission.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {submission.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {submission.teacher_feedback && (
                        <div className="mb-4 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium">Teacher Feedback:</p>
                          <p className="text-sm text-muted-foreground">{submission.teacher_feedback}</p>
                          {submission.reviewed_by_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Reviewed by {submission.reviewed_by_name} on {new Date(submission.reviewed_at!).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {submission.status === 'submitted' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setSubmissionFeedback('');
                                setSubmissionDialogOpen(true);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Review & Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setSubmissionFeedback('Please retake this test.');
                                setSubmissionDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        {submission.is_final && (
                          <Badge variant="outline">Final - Marks Saved</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {tests.filter(t => t.status === 'approved').map(renderTestCard)}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {tests.filter(t => t.status === 'rejected').map(renderTestCard)}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {tests.map(renderTestCard)}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Test: {selectedTest?.title}</DialogTitle>
              <DialogDescription>
                Review the generated questions and approve or reject the test
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {(Array.isArray(selectedTest?.questions) ? selectedTest.questions : []).map((q, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Question {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{q.question}</p>
                    
                    {/* Render MCQ options */}
                    {q.options && (
                      <div className="space-y-1">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-2 rounded ${
                              optIndex === q.correct_answer
                                ? 'bg-green-100 dark:bg-green-900'
                                : 'bg-muted'
                            }`}
                          >
                            {optIndex === q.correct_answer && (
                              <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-600" />
                            )}
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Render MCQ explanation */}
                    {q.explanation && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded">
                        <p className="text-sm font-medium">Explanation:</p>
                        <p className="text-sm">{q.explanation}</p>
                      </div>
                    )}
                    
                    {/* Render Q&A expected points */}
                    {q.expected_points && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900 rounded">
                        <p className="text-sm font-medium">Expected Key Points:</p>
                        <p className="text-sm">{q.expected_points}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <div className="space-y-2">
                <Label htmlFor="review-notes">Review Notes (optional)</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Add notes about your review..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedTest && handleReject(selectedTest.id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="default"
                onClick={() => selectedTest && handleApprove(selectedTest.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Selection Dialog */}
        <Dialog open={studentSelectionDialogOpen} onOpenChange={setStudentSelectionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Students to Assign Test</DialogTitle>
              <DialogDescription>
                Select which students should receive this personalized test. Each student will get questions tailored to their performance level.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Select All Option */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={students?.length > 0 && selectedStudentIds.length === students.length}
                      onCheckedChange={handleSelectAllStudents}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Select All Students ({students?.length || 0})
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Student List */}
              {!students || students.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No students found. Please ensure you have students assigned to you.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <Card key={student.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudentIds.includes(student.id)}
                            onCheckedChange={() => handleStudentToggle(student.id)}
                          />
                          <label
                            htmlFor={`student-${student.id}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            <div>
                              <p className="font-medium">{student.full_name}</p>
                              <p className="text-sm text-muted-foreground">@{student.username}</p>
                            </div>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Summary */}
              {selectedStudentIds.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <p className="text-sm">
                      <strong>{selectedStudentIds.length}</strong> student(s) selected. 
                      Each will receive a personalized test based on their performance.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setStudentSelectionDialogOpen(false);
                  setSelectedStudentIds([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmApproval}
                disabled={selectedStudentIds.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm & Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Questions Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Questions: {selectedTest?.title}</DialogTitle>
              <DialogDescription>
                Modify questions, options, and explanations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {editedQuestions.map((q, qIndex) => (
                <Card key={qIndex}>
                  <CardHeader>
                    <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Question Text</Label>
                      <Textarea
                        value={q.question}
                        onChange={(e) =>
                          updateQuestion(qIndex, 'question', e.target.value)
                        }
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Options</Label>
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2 mt-2">
                          <Input
                            value={opt}
                            onChange={(e) =>
                              updateOption(qIndex, optIndex, e.target.value)
                            }
                          />
                          <Button
                            variant={
                              q.correct_answer === optIndex
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() =>
                              updateQuestion(qIndex, 'correct_answer', optIndex)
                            }
                          >
                            {q.correct_answer === optIndex ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              'Set Correct'
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label>Explanation</Label>
                      <Textarea
                        value={q.explanation}
                        onChange={(e) =>
                          updateQuestion(qIndex, 'explanation', e.target.value)
                        }
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateQuestions}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submission Review Dialog */}
        <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Submission</DialogTitle>
              <DialogDescription>
                Review {selectedSubmission?.student_name}'s test submission
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Student</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission?.student_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Test</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission?.test_title}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Score</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedSubmission?.score}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Attempt</p>
                  <p className="text-sm text-muted-foreground">
                    #{selectedSubmission?.attempt_number}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submission-feedback">Teacher Feedback</Label>
                <Textarea
                  id="submission-feedback"
                  placeholder="Provide feedback to the student..."
                  value={submissionFeedback}
                  onChange={(e) => setSubmissionFeedback(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedSubmission?.status === 'rejected' 
                    ? 'This feedback will be shown to the student. They will be able to retake the test.'
                    : 'If you approve, the marks will be saved and the student cannot retake this test.'}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSubmissionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedSubmission && handleRejectSubmission(selectedSubmission)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject & Allow Retake
              </Button>
              <Button
                variant="default"
                onClick={() => selectedSubmission && handleApproveSubmission(selectedSubmission)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve & Save Marks
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TestManagement;
