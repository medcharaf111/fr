import React, { useState } from 'react';
import { vaultAPI } from '@/lib/api';
import { VaultExercise } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Check, X, Sparkles, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExerciseFormProps {
  lessonPlanId: number;
  exercise?: VaultExercise;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface MCQQuestion {
  question: string;
  options: string[];
  correct_answer: number;
}

interface QAQuestion {
  question: string;
  answer: string;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({
  lessonPlanId,
  exercise,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiGenerated, setAiGenerated] = useState(false);
  
  const [title, setTitle] = useState(exercise?.title || '');
  const [description, setDescription] = useState(exercise?.description || '');
  const [exerciseType, setExerciseType] = useState<'mcq' | 'qa'>(exercise?.exercise_type || 'mcq');
  const [difficulty, setDifficulty] = useState(exercise?.difficulty_level || 'medium');
  const [timeLimit, setTimeLimit] = useState(exercise?.time_limit?.toString() || '');
  const [numQuestionsForAI, setNumQuestionsForAI] = useState('5');
  
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>(
    exercise?.exercise_type === 'mcq' ? exercise.questions : [
      { question: '', options: ['', '', '', ''], correct_answer: 0 }
    ]
  );
  
  const [qaQuestions, setQaQuestions] = useState<QAQuestion[]>(
    exercise?.exercise_type === 'qa' ? exercise.questions : [
      { question: '', answer: '' }
    ]
  );

  const addMCQQuestion = () => {
    setMcqQuestions([...mcqQuestions, { question: '', options: ['', '', '', ''], correct_answer: 0 }]);
  };

  const removeMCQQuestion = (index: number) => {
    setMcqQuestions(mcqQuestions.filter((_, i) => i !== index));
  };

  const updateMCQQuestion = (index: number, field: keyof MCQQuestion, value: any) => {
    const updated = [...mcqQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setMcqQuestions(updated);
  };

  const updateMCQOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...mcqQuestions];
    updated[qIndex].options[oIndex] = value;
    setMcqQuestions(updated);
  };

  const addQAQuestion = () => {
    setQaQuestions([...qaQuestions, { question: '', answer: '' }]);
  };

  const removeQAQuestion = (index: number) => {
    setQaQuestions(qaQuestions.filter((_, i) => i !== index));
  };

  const updateQAQuestion = (index: number, field: keyof QAQuestion, value: string) => {
    const updated = [...qaQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQaQuestions(updated);
  };

  const handleGenerateWithAI = async () => {
    if (!title.trim()) {
      setError('Please enter a title before generating with AI');
      return;
    }

    setGeneratingAI(true);
    setError(null);

    try {
      const response = await vaultAPI.generateExerciseWithAI({
        vault_lesson_plan_id: lessonPlanId,
        exercise_type: exerciseType,
        title: title,
        num_questions: parseInt(numQuestionsForAI),
        difficulty_level: difficulty as 'easy' | 'medium' | 'hard'
      });

      const data = response.data;

      // Update form with AI-generated content
      setTitle(data.title);
      setDescription(data.description);
      
      if (exerciseType === 'mcq') {
        setMcqQuestions(data.questions);
      } else {
        setQaQuestions(data.questions);
      }

      setAiGenerated(true);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate exercise with AI');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const questions = exerciseType === 'mcq' ? mcqQuestions : qaQuestions;
      const numQuestions = questions.length;

      const data = {
        vault_lesson_plan: lessonPlanId,
        title,
        description,
        exercise_type: exerciseType,
        questions,
        num_questions: numQuestions,
        difficulty_level: difficulty,
        time_limit: timeLimit ? parseInt(timeLimit) : undefined
      };

      if (exercise) {
        await vaultAPI.updateExercise(exercise.id, data);
      } else {
        await vaultAPI.createExercise(data);
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save exercise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{exercise ? 'Edit Exercise' : 'Create New Exercise'}</CardTitle>
          <CardDescription>
            Add exercises to help students practice and assess their understanding. Use AI to generate questions or create manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {aiGenerated && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Exercise generated with AI! You can now review and modify the questions before saving.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter exercise title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the exercise objectives"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">Exercise Type *</Label>
              <Select value={exerciseType} onValueChange={(v: 'mcq' | 'qa') => setExerciseType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                  <SelectItem value="qa">Question & Answer (Q&A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="Optional"
                min="1"
              />
            </div>
          </div>

          {/* AI Generation Section */}
          {!exercise && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Generate with AI
                </CardTitle>
                <CardDescription>
                  Let AI create questions based on the lesson plan content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="numQuestions">Number of Questions</Label>
                  <Select value={numQuestionsForAI} onValueChange={setNumQuestionsForAI}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="7">7 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={generatingAI || !title.trim()}
                  className="w-full"
                  variant="default"
                >
                  {generatingAI ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Questions with AI
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-600">
                  Fill in the title, type, and difficulty above, then click to generate.
                  You can modify the generated questions before saving.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {exerciseType === 'mcq' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Multiple Choice Questions</CardTitle>
                <CardDescription>Add questions with 4 options each</CardDescription>
              </div>
              <Button type="button" onClick={addMCQQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {mcqQuestions.map((q, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <Label>Question {qIndex + 1}</Label>
                  {mcqQuestions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMCQQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                
                <Textarea
                  value={q.question}
                  onChange={(e) => updateMCQQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter question"
                  required
                />

                <div className="space-y-2">
                  <Label>Options</Label>
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2 items-center">
                      <Button
                        type="button"
                        variant={q.correct_answer === oIndex ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateMCQQuestion(qIndex, 'correct_answer', oIndex)}
                      >
                        {q.correct_answer === oIndex ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </Button>
                      <Input
                        value={option}
                        onChange={(e) => updateMCQOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        required
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">
                    Click the checkmark to mark the correct answer
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {exerciseType === 'qa' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Question & Answer</CardTitle>
                <CardDescription>Add open-ended questions with answers</CardDescription>
              </div>
              <Button type="button" onClick={addQAQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {qaQuestions.map((q, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <Label>Question {index + 1}</Label>
                  {qaQuestions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQAQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label>Question</Label>
                  <Textarea
                    value={q.question}
                    onChange={(e) => updateQAQuestion(index, 'question', e.target.value)}
                    placeholder="Enter question"
                    required
                  />
                </div>

                <div>
                  <Label>Answer</Label>
                  <Textarea
                    value={q.answer}
                    onChange={(e) => updateQAQuestion(index, 'answer', e.target.value)}
                    placeholder="Enter answer"
                    required
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : exercise ? 'Update Exercise' : 'Create Exercise'}
        </Button>
      </div>
    </form>
  );
};
