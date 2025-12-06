import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';
import api, { authAPI, testAPI } from '@/lib/api';
import { Lesson } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface TestResult {
  questionIndex: number;
  userAnswer: number;
  isCorrect: boolean;
}

const MCQTestPage = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await api.get('/lessons/');
      setLessons(response.data);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lessons',
        variant: 'destructive',
      });
    }
  };

  const generateTest = async (lesson: Lesson) => {
    setIsGenerating(true);
    setSelectedLesson(lesson);
    try {
      // Check if there's an approved test for this lesson
      const response = await api.get(`/tests/`, { params: { lesson: lesson.id } });
      const approvedTests = response.data.filter((test: any) => test.status === 'approved');
      
      if (approvedTests.length > 0) {
        // Use existing approved test
        const existingTest = approvedTests[0];
        setQuestions(existingTest.questions);
        setTestStarted(true);
        setCurrentQuestionIndex(0);
        setResults([]);
        setTestCompleted(false);
        
        toast({
          title: 'Test Loaded! ✅',
          description: `${existingTest.questions.length} approved questions ready.`,
        });
      } else {
        toast({
          title: 'No Test Available',
          description: 'No approved test found for this lesson. Please contact your teacher to create and approve a test.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch test:', error);
      toast({
        title: 'Loading Failed',
        description: error.response?.data?.error || 'Failed to load test',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(false);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) {
      toast({
        title: 'Please select an answer',
        description: 'You must select an answer before continuing',
        variant: 'destructive',
      });
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    const newResults = [
      ...results,
      {
        questionIndex: currentQuestionIndex,
        userAnswer: selectedAnswer,
        isCorrect,
      },
    ];
    
    setResults(newResults);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Test is complete - submit it
      await submitTest(newResults);
      setTestCompleted(true);
    }
  };

  const submitTest = async (finalResults: TestResult[]) => {
    try {
      const correctAnswers = finalResults.filter((r) => r.isCorrect).length;
      const percentage = Math.round((correctAnswers / questions.length) * 100);
      
      // Get test ID from the selected lesson
      const response = await api.get(`/tests/`, { params: { lesson: selectedLesson?.id } });
      const approvedTests = response.data.filter((test: any) => test.status === 'approved');
      
      if (approvedTests.length > 0) {
        const testId = approvedTests[0].id;
        
        // Prepare answers in the format expected by the backend
        const answersData = finalResults.map((result) => ({
          question_index: result.questionIndex,
          selected_answer: result.userAnswer,
          is_correct: result.isCorrect
        }));
        
        // Submit the test
        await api.post(`/tests/${testId}/submit/`, {
          answers: answersData,
          score: percentage
        });
        
        toast({
          title: 'Test Submitted! 🎉',
          description: 'Your test has been submitted for teacher review.',
        });
      }
    } catch (error: any) {
      console.error('Failed to submit test:', error);
      // Don't show error to user - they can still see results
      // Toast will be shown when teacher approves
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const previousResult = results[currentQuestionIndex - 1];
      setSelectedAnswer(previousResult?.userAnswer ?? null);
      setShowExplanation(false);
    }
  };

  const handleShowExplanation = () => {
    setShowExplanation(true);
  };

  const calculateScore = () => {
    const correctAnswers = results.filter((r) => r.isCorrect).length;
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    return { correctAnswers, total: questions.length, percentage };
  };

  const resetTest = () => {
    setTestStarted(false);
    setTestCompleted(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setResults([]);
    setSelectedLesson(null);
    setShowExplanation(false);
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/');
  };

  // Lesson Selection Screen
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                MCQ Test - {user?.school_name}
              </h1>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('select.lessonToTest')}</CardTitle>
              <CardDescription>
                Choose a lesson and we'll generate a personalized MCQ test for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lessons.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No lessons available yet. Ask your teacher to create some!
                </p>
              ) : (
                <div className="grid gap-4">
                  {lessons.map((lesson) => (
                    <Card
                      key={lesson.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">
                              {lesson.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {lesson.content.substring(0, 150)}...
                            </p>
                            <p className="text-xs text-gray-500">
                              Created by {lesson.created_by_name} •{' '}
                              {new Date(lesson.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            onClick={() => generateTest(lesson)}
                            disabled={isGenerating}
                            className="ml-4"
                          >
                            {isGenerating && selectedLesson?.id === lesson.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              'Start Test'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Test Completed Screen
  if (testCompleted) {
    const score = calculateScore();
    const passPercentage = 70;
    const passed = score.percentage >= passPercentage;

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {passed ? (
                  <Trophy className="h-20 w-20 text-yellow-500" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl">📚</span>
                  </div>
                )}
              </div>
              <CardTitle className="text-3xl">
                {passed ? 'Congratulations! 🎉' : 'Keep Practicing! 💪'}
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                {selectedLesson?.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{score.percentage}%</div>
                <p className="text-gray-600">
                  You got {score.correctAnswers} out of {score.total} questions correct
                </p>
              </div>

              <Progress value={score.percentage} className="h-4" />

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {score.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {score.total - score.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button onClick={resetTest} className="flex-1">
                  Take Another Test
                </Button>
                <Button onClick={() => navigate('/student')} variant="outline" className="flex-1">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, index) => {
                const result = results[index];
                const isCorrect = result?.isCorrect;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold mb-2">
                          Question {index + 1}: {question.question}
                        </p>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Your answer:</strong> {question.options[result?.userAnswer]}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Correct answer:</strong>{' '}
                            {question.options[question.correct_answer]}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Test Taking Screen
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedLesson?.title}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
          <Progress value={progressPercentage} className="mb-2" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={selectedAnswer?.toString()}
              onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            >
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-base"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {showExplanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Hint:</strong> {currentQuestion.explanation}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button
                onClick={handlePreviousQuestion}
                variant="outline"
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {!showExplanation && selectedAnswer !== null && (
                <Button onClick={handleShowExplanation} variant="outline">
                  Show Hint
                </Button>
              )}

              <Button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Finish Test' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MCQTestPage;
