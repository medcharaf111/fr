import React, { useState, useEffect } from 'react';
import { vaultAPI } from '@/lib/api';
import { VaultExercise } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, FileQuestion, Trash2, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VaultExercisesListProps {
  lessonPlanId: number;
  onEdit?: (exercise: VaultExercise) => void;
  canEdit?: boolean;
}

export const VaultExercisesList: React.FC<VaultExercisesListProps> = ({
  lessonPlanId,
  onEdit,
  canEdit = false
}) => {
  const [exercises, setExercises] = useState<VaultExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await vaultAPI.getExercises({ vault_lesson_plan: lessonPlanId });
      setExercises(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [lessonPlanId]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    
    try {
      await vaultAPI.deleteExercise(id);
      await fetchExercises();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete exercise');
    }
  };

  const handleUse = async (id: number) => {
    try {
      await vaultAPI.incrementExerciseUsage(id);
      await fetchExercises();
    } catch (err: any) {
      console.error('Failed to increment usage:', err);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExerciseTypeLabel = (type: string) => {
    return type === 'mcq' ? 'Multiple Choice' : 'Q&A';
  };

  if (loading) {
    return <div className="text-center py-8">Loading exercises...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileQuestion className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No exercises available for this lesson plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise) => (
        <Card key={exercise.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{exercise.title}</CardTitle>
                {exercise.description && (
                  <CardDescription className="mt-2">{exercise.description}</CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(exercise)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(exercise.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">
                {getExerciseTypeLabel(exercise.exercise_type)}
              </Badge>
              {exercise.difficulty_level && (
                <Badge className={getDifficultyColor(exercise.difficulty_level)}>
                  {exercise.difficulty_level.charAt(0).toUpperCase() + exercise.difficulty_level.slice(1)}
                </Badge>
              )}
              <Badge variant="secondary">
                <FileQuestion className="h-3 w-3 mr-1" />
                {exercise.num_questions} Questions
              </Badge>
              {exercise.time_limit && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {exercise.time_limit} min
                </Badge>
              )}
              <Badge variant="secondary">
                Used {exercise.usage_count} times
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Created by: {exercise.created_by_name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(exercise.created_at).toLocaleDateString()}
              </p>
            </div>

            <Button
              onClick={() => handleUse(exercise.id)}
              className="mt-4"
              variant="default"
            >
              Use This Exercise
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
