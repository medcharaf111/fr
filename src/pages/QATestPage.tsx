import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2, Maximize2, Send, BookOpen } from 'lucide-react';
import api, { authAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface QATest {
  id: number;
  lesson: number;
  lesson_title: string;
  title: string;
  questions: QAQuestion[];
  time_limit: number;
  status: string;
  num_questions: number;
}

interface QAQuestion {
  question: string;
  expected_points: string;
}

interface Answer {
  question_index: number;
  answer: string;
}

const QATestPage = () => {
  const [availableTests, setAvailableTests] = useState<QATest[]>([]);
  const [selectedTest, setSelectedTest] = useState<QATest | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const testContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    fetchAvailableTests();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fullscreenMonitorRef.current) clearInterval(fullscreenMonitorRef.current);
      exitFullscreen();
    };
  }, []);

  // Force fullscreen immediately when component mounts and test is started
  useEffect(() => {
    if (testStarted && !testSubmitted && !document.fullscreenElement) {
      enterFullscreen();
    }
  }, [testStarted, testSubmitted]);

  // Block ESC key during test to prevent easy fullscreen exit
  useEffect(() => {
    if (testStarted && !testSubmitted) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Block ESC key
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          toast({
            title: 'Action Blocked',
            description: 'You cannot exit fullscreen mode during the test.',
            variant: 'destructive',
          });
          return false;
        }
        
        // Block F11 (fullscreen toggle)
        if (e.key === 'F11') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [testStarted, testSubmitted]);

  // Persistent fullscreen monitoring - checks every 500ms and forces re-entry
  useEffect(() => {
    if (testStarted && !testSubmitted) {
      fullscreenMonitorRef.current = setInterval(() => {
        if (!document.fullscreenElement) {
          console.log('Fullscreen lost, forcing re-entry...');
          enterFullscreen();
        }
      }, 500);

      return () => {
        if (fullscreenMonitorRef.current) {
          clearInterval(fullscreenMonitorRef.current);
        }
      };
    }
  }, [testStarted, testSubmitted]);

  useEffect(() => {
    if (testStarted && !testSubmitted) {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!document.fullscreenElement;
        setIsFullscreen(isCurrentlyFullscreen);
        
        if (!isCurrentlyFullscreen && testStarted) {
          setFullscreenExits(prev => prev + 1);
          toast({
            title: 'Fullscreen Exited!',
            description: `Warning: You exited fullscreen mode. This has been recorded. (${fullscreenExits + 1} exits). Re-entering fullscreen...`,
            variant: 'destructive',
          });
          
          // FORCEFULLY re-enter fullscreen after 1 second
          setTimeout(() => {
            if (!document.fullscreenElement && testStarted && !testSubmitted) {
              enterFullscreen();
            }
          }, 1000);
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  }, [testStarted, testSubmitted, fullscreenExits]);

  const fetchAvailableTests = async () => {
    try {
      const response = await api.get('/qa-tests/');
      // Filter for approved tests only (backend should already do this for students)
      const approvedTests = response.data.filter((test: QATest) => test.status === 'approved');
      setAvailableTests(approvedTests);
    } catch (error) {
      console.error('Failed to fetch Q&A tests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available tests',
        variant: 'destructive',
      });
    }
  };

  const enterFullscreen = async () => {
    try {
      // Use document.documentElement (the <html> element) which is always available
      const element = testContainerRef.current || document.documentElement;
      console.log('Attempting to enter fullscreen...', element);
      await element.requestFullscreen();
      console.log('Fullscreen request sent successfully');
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      toast({
        title: 'Fullscreen Required',
        description: 'Please allow fullscreen mode to start the test. Check your browser permissions.',
        variant: 'destructive',
      });
      throw error; // Re-throw to handle in startTest
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  const startTest = async (test: QATest) => {
    setIsLoading(true);
    console.log('Starting test:', test);
    try {
      setSelectedTest(test);
      setAnswers(test.questions.map((_, index) => ({ question_index: index, answer: '' })));
      setTimeRemaining(test.time_limit * 60);
      
      // Try to enter fullscreen
      console.log('Requesting fullscreen...');
      try {
        await enterFullscreen();
        
        // Wait a bit to ensure fullscreen is active
        setTimeout(() => {
          console.log('Checking fullscreen status:', !!document.fullscreenElement);
          if (document.fullscreenElement) {
            // Fullscreen successful, start the test
            console.log('Fullscreen confirmed! Starting test...');
            setTestStarted(true);
            setStartTime(Date.now());
            startTimer(test.time_limit * 60);
            toast({
              title: 'Test Started! ✏️',
              description: `You have ${test.time_limit} minutes. Stay in fullscreen mode.`,
            });
          } else {
            // Fullscreen failed, try again
            console.warn('Fullscreen not active, retrying...');
            toast({
              title: 'Fullscreen Required',
              description: 'Attempting to enter fullscreen mode again...',
              variant: 'destructive',
            });
            // Retry after 500ms
            setTimeout(async () => {
              try {
                await enterFullscreen();
                setTestStarted(true);
                setStartTime(Date.now());
                startTimer(test.time_limit * 60);
              } catch (retryError) {
                console.error('Fullscreen retry failed:', retryError);
                toast({
                  title: 'Fullscreen Failed',
                  description: 'You must allow fullscreen mode to take the test. Please try again.',
                  variant: 'destructive',
                });
                setSelectedTest(null);
              }
            }, 500);
          }
        }, 300);
      } catch (fsError) {
        console.error('Fullscreen error:', fsError);
        toast({
          title: 'Fullscreen Required',
          description: 'Please allow fullscreen mode when prompted.',
          variant: 'destructive',
        });
        setSelectedTest(null);
      }
    } catch (error: any) {
      console.error('Failed to start test:', error);
      toast({
        title: 'Error',
        description: 'Failed to start test',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = (seconds: number) => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => 
      prev.map(a => a.question_index === questionIndex ? { ...a, answer } : a)
    );
  };

  const handleSubmit = async (autoSubmit: boolean = false) => {
    if (!selectedTest) return;

    // Check if all questions are answered
    const unanswered = answers.filter(a => !a.answer.trim()).length;
    if (unanswered > 0 && !autoSubmit) {
      const confirmed = window.confirm(
        `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmed) return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    try {
      const response = await api.post('/qa-submissions/submit/', {
        test_id: selectedTest.id,
        answers: answers,
        time_taken: timeTaken,
        fullscreen_exits: fullscreenExits,
      });

      toast({
        title: 'Test Submitted Successfully! 🎉',
        description: 'Your answers have been sent for AI grading and teacher review.',
      });

      setTestSubmitted(true);
      await exitFullscreen();
      
      // Show results after a delay
      setTimeout(() => {
        navigate('/student');
      }, 3000);
    } catch (error: any) {
      console.error('Failed to submit test:', error);
      toast({
        title: 'Submission Failed',
        description: error.response?.data?.error || 'Failed to submit test',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = selectedTest ? ((currentQuestionIndex + 1) / selectedTest.questions.length) * 100 : 0;

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Q&A Tests
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('select.lessonForQA')}
            </p>
          </div>

          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription>
              • Tests MUST be taken in fullscreen mode (enforced automatically)<br />
              • ESC key is disabled - you cannot exit fullscreen during the test<br />
              • Any fullscreen exit will be recorded and you'll be forced back<br />
              • Your answers will be graded by AI and reviewed by your teacher<br />
              • You cannot retake a test once submitted
            </AlertDescription>
          </Alert>

          {availableTests.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Tests Available</AlertTitle>
              <AlertDescription>
                There are no approved Q&A tests available at this time. Please check back later.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTests.map((test) => (
                <Card key={test.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <CardDescription>Lesson: {test.lesson_title}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <p>📝 {test.num_questions} Questions</p>
                      <p>⏱️ {test.time_limit} Minutes</p>
                    </div>
                    <Button
                      onClick={() => startTest(test)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Start Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (testSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center">Test Submitted!</CardTitle>
            <CardDescription className="text-center">
              Your answers have been submitted for review
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>AI grading has been completed.</p>
            <p>Awaiting teacher review for final score.</p>
            {fullscreenExits > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You exited fullscreen {fullscreenExits} time(s) during the test.
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={() => navigate('/student')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={testContainerRef} className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Timer and Progress Header */}
        <Card className="mb-6 sticky top-0 z-10 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-red-500 animate-pulse' : ''}`} />
                <span className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Badge variant={isFullscreen ? 'default' : 'destructive'}>
                {isFullscreen ? 'Fullscreen Active' : 'NOT IN FULLSCREEN!'}
              </Badge>
              {fullscreenExits > 0 && (
                <Badge variant="destructive">
                  {fullscreenExits} Fullscreen Exit(s)
                </Badge>
              )}
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Question {currentQuestionIndex + 1} of {selectedTest?.questions.length}
            </p>
          </CardContent>
        </Card>

        {/* Question Card */}
        {selectedTest && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
              <CardDescription className="text-base">
                {selectedTest.questions[currentQuestionIndex].question}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Answer:</label>
                <Textarea
                  value={answers[currentQuestionIndex]?.answer || ''}
                  onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                  placeholder="Type your detailed answer here..."
                  className="min-h-[200px] font-mono"
                  rows={10}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Write a comprehensive answer. Be sure to address all key points.
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                {currentQuestionIndex < selectedTest.questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubmit(false)}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Test
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Navigator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedTest?.questions.map((_, index) => (
                <Button
                  key={index}
                  variant={currentQuestionIndex === index ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-12 h-12 ${answers[index]?.answer.trim() ? 'border-green-500' : ''}`}
                >
                  {index + 1}
                  {answers[index]?.answer.trim() && (
                    <CheckCircle2 className="h-3 w-3 absolute top-1 right-1 text-green-500" />
                  )}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Click a number to jump to that question. Green border indicates answered questions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QATestPage;
