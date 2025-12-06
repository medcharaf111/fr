import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Eye, Clock, AlertTriangle, FileText } from 'lucide-react';
import api, { authAPI, testAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import StudentWeaknessAnalysis from '@/components/StudentWeaknessAnalysis';
import type { AIAnalysis } from '@/types/api';

interface QATest {
  id: number;
  lesson: number;
  lesson_title: string;
  title: string;
  questions: QAQuestion[];
  time_limit: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_by_name?: string;
  reviewed_by_name?: string;
  review_notes?: string;
  num_questions: number;
  created_at: string;
}

interface QAQuestion {
  question: string;
  expected_points: string;
}

interface QASubmission {
  id: number;
  test: number;
  test_title: string;
  student_name: string;
  answers: Answer[];
  ai_feedback: AIFeedback;
  ai_analysis: AIAnalysis | null;
  teacher_feedback: string;
  final_score: number | null;
  status: string;
  time_taken: number;
  fullscreen_exits: number;
  submitted_at: string;
}

interface Answer {
  question_index: number;
  answer: string;
}

interface AIFeedback {
  question_feedback: QuestionFeedback[];
  overall_score: number;
  total_questions: number;
}

interface QuestionFeedback {
  question_index: number;
  score: number;
  feedback: string;
  strengths: string;
  improvements: string;
  points_covered: string[];
}

const QAManagement = () => {
  const [tests, setTests] = useState<QATest[]>([]);
  const [submissions, setSubmissions] = useState<QASubmission[]>([]);
  const [selectedTest, setSelectedTest] = useState<QATest | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<QASubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only teachers can manage Q&A tests',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [testsRes, submissionsRes] = await Promise.all([
        testAPI.getAll('qa'),  // Fetch only Q&A tests
        api.get('/qa-submissions/pending_review/'),
      ]);
      setTests(testsRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const approveTest = async (testId: number) => {
    try {
      await api.post(`/qa-tests/${testId}/approve/`, { notes: reviewNotes });
      toast({
        title: 'Test Approved',
        description: 'Q&A test is now available to students',
      });
      setReviewDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve test',
        variant: 'destructive',
      });
    }
  };

  const rejectTest = async (testId: number) => {
    if (!reviewNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide rejection notes',
        variant: 'destructive',
      });
      return;
    }
    try {
      await api.post(`/qa-tests/${testId}/reject/`, { notes: reviewNotes });
      toast({
        title: 'Test Rejected',
        description: 'Test has been rejected',
      });
      setReviewDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject test',
        variant: 'destructive',
      });
    }
  };

  const finalizeGrade = async (submissionId: number) => {
    try {
      await api.post(`/qa-submissions/${submissionId}/finalize/`, {
        final_score: finalScore,
        teacher_feedback: teacherFeedback,
      });
      toast({
        title: 'Grade Finalized',
        description: 'Student has been notified of their final score',
      });
      setSubmissionDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to finalize grade',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending Review' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      ai_graded: { variant: 'secondary', label: 'AI Graded - Awaiting Review' },
      finalized: { variant: 'default', label: 'Finalized' },
    };
    const config = configs[status] || configs.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const openReviewDialog = (test: QATest) => {
    setSelectedTest(test);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const openSubmissionDialog = (submission: QASubmission) => {
    setSelectedSubmission(submission);
    setTeacherFeedback('');
    setFinalScore(submission.ai_feedback?.overall_score || 0);
    setSubmissionDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Q&A Test Management</h1>
          <p className="text-muted-foreground">
            Review and manage Q&A tests and student submissions
          </p>
        </div>

        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submissions">
              Submissions to Review ({submissions.length})
            </TabsTrigger>
            <TabsTrigger value="tests">
              Manage Tests ({tests.filter(t => t.status === 'pending').length} pending)
            </TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="mt-6 space-y-4">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No submissions pending review</p>
                </CardContent>
              </Card>
            ) : (
              submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {submission.test_title}
                          {getStatusBadge(submission.status)}
                        </CardTitle>
                        <CardDescription>
                          Student: {submission.student_name} • Submitted: {new Date(submission.submitted_at).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Time: {Math.floor(submission.time_taken / 60)}m {submission.time_taken % 60}s</span>
                        </div>
                        {submission.fullscreen_exits > 0 && (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{submission.fullscreen_exits} fullscreen exit(s)</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">AI Score: {submission.ai_feedback?.overall_score}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on {submission.ai_feedback?.total_questions} questions
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => openSubmissionDialog(submission)}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review & Finalize Grade
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="mt-6 space-y-4">
            {tests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {test.title}
                        {getStatusBadge(test.status)}
                      </CardTitle>
                      <CardDescription>
                        Lesson: {test.lesson_title} • {test.num_questions} questions • {test.time_limit} min
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created by {test.created_by_name}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {test.review_notes && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Review Notes:</p>
                      <p className="text-sm">{test.review_notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => openReviewDialog(test)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review Questions
                    </Button>
                    {test.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => approveTest(test.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
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
            ))}
          </TabsContent>
        </Tabs>

        {/* Test Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Review Test: {selectedTest?.title}</DialogTitle>
              <DialogDescription>
                Review questions and approve/reject the test
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {selectedTest?.questions.map((q, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">Question {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="font-medium">{q.question}</p>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-sm font-medium">Expected Points:</p>
                        <p className="text-sm text-muted-foreground">{q.expected_points}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div>
                  <Label htmlFor="review-notes">Review Notes</Label>
                  <Textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes..."
                    rows={3}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedTest && rejectTest(selectedTest.id)}
              >
                Reject
              </Button>
              <Button onClick={() => selectedTest && approveTest(selectedTest.id)}>
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submission Review Dialog */}
        <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Review Submission: {selectedSubmission?.student_name}</DialogTitle>
              <DialogDescription className="text-base">
                Review AI analysis, grading, and provide final score
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">
                {/* AI Weakness Analysis Section - Prominently displayed first */}
                {selectedSubmission?.ai_analysis && (
                  <StudentWeaknessAnalysis 
                    analysis={selectedSubmission.ai_analysis}
                    studentName={selectedSubmission.student_name}
                  />
                )}

                {/* Divider */}
                <div className="border-t-2 border-gray-200 my-6"></div>

                {/* Question by Question Review */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Question-by-Question Review
                  </h3>
                  <div className="space-y-4">
                    {selectedSubmission?.ai_feedback?.question_feedback.map((feedback, index) => {
                      const answer = selectedSubmission.answers.find(a => a.question_index === index);
                      return (
                        <Card key={index} className="border-2">
                          <CardHeader className="bg-gray-50">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Question {index + 1}</CardTitle>
                              <Badge className="text-sm" variant={feedback.score >= 8 ? 'default' : feedback.score >= 6 ? 'secondary' : 'destructive'}>
                                AI Score: {feedback.score}/10
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">Student Answer:</p>
                              <p className="text-sm bg-gray-100 p-3 rounded-lg border">{answer?.answer || 'No answer'}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="font-semibold text-green-700 flex items-center gap-1 mb-1">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Strengths
                                </p>
                                <p className="text-sm text-gray-700">{feedback.strengths}</p>
                              </div>
                              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <p className="font-semibold text-orange-700 flex items-center gap-1 mb-1">
                                  <AlertTriangle className="h-4 w-4" />
                                  Areas for Improvement
                                </p>
                                <p className="text-sm text-gray-700">{feedback.improvements}</p>
                              </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="font-semibold text-blue-700 mb-1">AI Feedback</p>
                              <p className="text-sm text-gray-700">{feedback.feedback}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t-2 border-gray-200 my-6"></div>
                
                {/* Finalize Section */}
                <div className="space-y-4 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-gray-800">Finalize Grading</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="final-score" className="text-base font-semibold">Final Score (%)</Label>
                      <Input
                        id="final-score"
                        type="number"
                        min="0"
                        max="100"
                        value={finalScore}
                        onChange={(e) => setFinalScore(Number(e.target.value))}
                        className="mt-2 text-lg font-bold"
                      />
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                        <span className="font-medium">AI suggested:</span>
                        <span className="font-bold text-purple-600">{selectedSubmission?.ai_feedback?.overall_score}%</span>
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="teacher-feedback" className="text-base font-semibold">Teacher Feedback</Label>
                      <Textarea
                        id="teacher-feedback"
                        value={teacherFeedback}
                        onChange={(e) => setTeacherFeedback(e.target.value)}
                        placeholder="Provide overall feedback for the student..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setSubmissionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedSubmission && finalizeGrade(selectedSubmission.id)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalize Grade
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default QAManagement;
