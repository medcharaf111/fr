import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { vaultAPI, lessonAPI } from '@/lib/api';
import { VaultExercise, Lesson } from '@/types/api';
import { 
  FileQuestion, 
  Search, 
  Filter,
  Eye,
  Users,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  Copy,
  Download,
  PlusCircle,
  Loader2
} from 'lucide-react';

const VaultExercisesExplorer = () => {
  const [exercises, setExercises] = useState<VaultExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<VaultExercise | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [teacherLessons, setTeacherLessons] = useState<Lesson[]>([]);
  const [assigningExerciseId, setAssigningExerciseId] = useState<number | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<{[key: number]: string}>({});

  useEffect(() => {
    fetchExercises();
    fetchTeacherLessons();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      // Fetch all exercises (no vault_lesson_plan filter)
      const response = await vaultAPI.getExercises();
      setExercises(response.data);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherLessons = async () => {
    try {
      const response = await lessonAPI.getAllLessons();
      console.log('Lessons response:', response);
      // getAllLessons returns response.data, check if it's paginated or direct array
      const lessons = Array.isArray(response) ? response : (response.results || response.data || []);
      console.log('Parsed lessons:', lessons);
      setTeacherLessons(lessons);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      setTeacherLessons([]); // Ensure it's always an array
    }
  };

  const filterExercises = () => {
    return exercises.filter(exercise => {
      const matchesSearch = 
        exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || exercise.exercise_type === typeFilter;
      const matchesDifficulty = difficultyFilter === 'all' || exercise.difficulty_level === difficultyFilter;
      
      return matchesSearch && matchesType && matchesDifficulty;
    });
  };

  const handleViewDetails = (exercise: VaultExercise) => {
    setSelectedExercise(exercise);
    setDetailsDialogOpen(true);
  };

  const handleUseExercise = async (exerciseId: number) => {
    const lessonId = selectedLessons[exerciseId];
    if (!lessonId) {
      alert('Please select a lesson first');
      return;
    }

    setAssigningExerciseId(exerciseId);
    try {
      const response = await vaultAPI.createTestFromExercise(
        exerciseId,
        parseInt(lessonId)
      );
      
      // Update usage count
      setExercises(prev => 
        prev.map(ex => 
          ex.id === exerciseId 
            ? { ...ex, usage_count: ex.usage_count + 1 }
            : ex
        )
      );
      
      alert(`✓ Test "${response.data.test_title}" created successfully for ${response.data.lesson_title}!\n\nStudents can now take this test.`);
      
      // Reset selection
      setSelectedLessons(prev => {
        const updated = { ...prev };
        delete updated[exerciseId];
        return updated;
      });
    } catch (error: any) {
      console.error('Failed to create test:', error);
      alert(error.response?.data?.error || 'Failed to create test. Please try again.');
    } finally {
      setAssigningExerciseId(null);
    }
  };

  const handleLessonSelect = (exerciseId: number, lessonId: string) => {
    setSelectedLessons(prev => ({
      ...prev,
      [exerciseId]: lessonId
    }));
  };

  const handleCopyExercise = (exercise: VaultExercise) => {
    const content = JSON.stringify(exercise, null, 2);
    navigator.clipboard.writeText(content);
    alert('✓ Exercise copied to clipboard!');
  };

  const filteredExercises = filterExercises();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileQuestion className="w-6 h-6" />
          Vault Exercises Library
        </h2>
        <p className="text-gray-600 mt-1">
          Browse and use MCQ and Q&A exercises created by teachers and advisors
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search exercises by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex gap-4 items-center">
            <Filter className="w-4 h-4 text-gray-400" />
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Exercise Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                <SelectItem value="qa">Question & Answer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            {(typeFilter !== 'all' || difficultyFilter !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('all');
                  setDifficultyFilter('all');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex gap-2">
          <Badge variant="outline">
            {exercises.filter(e => e.exercise_type === 'mcq').length} MCQ
          </Badge>
          <Badge variant="outline">
            {exercises.filter(e => e.exercise_type === 'qa').length} Q&A
          </Badge>
        </div>
      </div>

      {/* Exercises Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading exercises...</p>
          </CardContent>
        </Card>
      ) : filteredExercises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exercises Found</h3>
            <p className="text-gray-600">
              {searchQuery || typeFilter !== 'all' || difficultyFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No exercises available in the vault yet'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{exercise.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {exercise.description}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={exercise.exercise_type === 'mcq' ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {exercise.exercise_type === 'mcq' ? 'MCQ' : 'Q&A'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Metadata */}
                <div className="flex gap-2 flex-wrap">
                  <Badge 
                    variant="outline"
                    className={
                      exercise.difficulty_level === 'easy' 
                        ? 'border-green-500 text-green-700'
                        : exercise.difficulty_level === 'medium'
                        ? 'border-yellow-500 text-yellow-700'
                        : 'border-red-500 text-red-700'
                    }
                  >
                    {exercise.difficulty_level}
                  </Badge>
                  <Badge variant="outline">
                    {exercise.num_questions} Question{exercise.num_questions !== 1 ? 's' : ''}
                  </Badge>
                  {exercise.time_limit && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exercise.time_limit} min
                    </Badge>
                  )}
                </div>

                {/* Lesson Plan Info */}
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">{exercise.vault_lesson_plan_title}</span>
                  </div>
                  <p className="text-xs mt-1">
                    {exercise.vault_lesson_plan_subject} • {exercise.vault_lesson_plan_grade}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm text-gray-600 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{exercise.usage_count} uses</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {/* View and Copy buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewDetails(exercise)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCopyExercise(exercise)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>

                  {/* Lesson selector + Use Exercise button (like MCQ Test / Q&A Test) */}
                  <div className="flex gap-2">
                    <Select 
                      value={selectedLessons[exercise.id] || ''} 
                      onValueChange={(value) => handleLessonSelect(exercise.id, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select lesson..." />
                      </SelectTrigger>
                      <SelectContent>
                        {!teacherLessons || teacherLessons.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No lessons found
                          </SelectItem>
                        ) : (
                          teacherLessons.map((lesson) => (
                            <SelectItem key={lesson.id} value={lesson.id.toString()}>
                              {lesson.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => handleUseExercise(exercise.id)}
                      disabled={!selectedLessons[exercise.id] || assigningExerciseId === exercise.id}
                      className="whitespace-nowrap"
                    >
                      {assigningExerciseId === exercise.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Use Exercise
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedExercise && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  {selectedExercise.title}
                  <Badge variant={selectedExercise.exercise_type === 'mcq' ? 'default' : 'secondary'}>
                    {selectedExercise.exercise_type === 'mcq' ? 'MCQ' : 'Q&A'}
                  </Badge>
                </DialogTitle>
                <div className="flex gap-2 mt-2">
                  <Badge 
                    variant="outline"
                    className={
                      selectedExercise.difficulty_level === 'easy' 
                        ? 'border-green-500 text-green-700'
                        : selectedExercise.difficulty_level === 'medium'
                        ? 'border-yellow-500 text-yellow-700'
                        : 'border-red-500 text-red-700'
                    }
                  >
                    {selectedExercise.difficulty_level}
                  </Badge>
                  <Badge variant="outline">
                    {selectedExercise.num_questions} Questions
                  </Badge>
                  {selectedExercise.time_limit && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedExercise.time_limit} minutes
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-700">{selectedExercise.description}</p>
                </div>

                {/* Lesson Plan Context */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    From Lesson Plan
                  </h3>
                  <p className="font-medium">{selectedExercise.vault_lesson_plan_title}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedExercise.vault_lesson_plan_subject} • {selectedExercise.vault_lesson_plan_grade}
                  </p>
                </div>

                {/* Questions Preview */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    Questions ({selectedExercise.questions.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedExercise.exercise_type === 'mcq' ? (
                      // MCQ Questions
                      selectedExercise.questions.map((q: any, idx: number) => (
                        <Card key={idx}>
                          <CardHeader>
                            <CardTitle className="text-base">
                              Question {idx + 1}: {q.question}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {q.options.map((option: string, optIdx: number) => (
                                <div 
                                  key={optIdx}
                                  className={`p-3 rounded-lg border ${
                                    optIdx === q.correct_answer
                                      ? 'bg-green-50 border-green-500'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {optIdx === q.correct_answer ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="font-medium">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <span>{option}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      // Q&A Questions
                      selectedExercise.questions.map((q: any, idx: number) => (
                        <Card key={idx}>
                          <CardHeader>
                            <CardTitle className="text-base">
                              Question {idx + 1}: {q.question}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <p className="font-semibold text-green-900 mb-2">Model Answer:</p>
                              <p className="text-gray-700">{q.answer}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">Usage Statistics</h3>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span className="text-2xl font-bold">{selectedExercise.usage_count}</span>
                    <span className="text-gray-600">teachers have used this exercise</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      handleCopyExercise(selectedExercise);
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultExercisesExplorer;
