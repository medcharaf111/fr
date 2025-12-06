import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { vaultAPI, authAPI } from '@/lib/api';
import { VaultLessonPlan, VaultExercise, VaultMaterial } from '@/types/api';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardHeader from '@/components/DashboardHeader';
import { 
  VaultExercisesList, 
  VaultMaterialsList, 
  ExerciseForm, 
  MaterialUploadForm 
} from '@/components/vault';
import { ArrowLeft, Plus, FileQuestion, Files } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ManageVaultContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  
  const [lessonPlan, setLessonPlan] = useState<VaultLessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('exercises');
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<VaultExercise | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<VaultMaterial | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { t } = useLanguage();

  const user = authAPI.getCurrentUser();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!planId) {
      setError('No lesson plan selected');
      setLoading(false);
      return;
    }
    fetchLessonPlan();
  }, [planId]);

  const fetchLessonPlan = async () => {
    if (!planId) return;
    
    try {
      setLoading(true);
      const response = await vaultAPI.getById(parseInt(planId));
      setLessonPlan(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load lesson plan');
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseSuccess = () => {
    setShowExerciseForm(false);
    setEditingExercise(null);
    setRefreshKey(prev => prev + 1);
    fetchLessonPlan(); // Refresh to update counts
  };

  const handleMaterialSuccess = () => {
    setShowMaterialForm(false);
    setEditingMaterial(null);
    setRefreshKey(prev => prev + 1);
    fetchLessonPlan(); // Refresh to update counts
  };

  const handleEditExercise = (exercise: VaultExercise) => {
    setEditingExercise(exercise);
    setShowExerciseForm(true);
  };

  const handleEditMaterial = (material: VaultMaterial) => {
    setEditingMaterial(material);
    setShowMaterialForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user} onLogout={handleLogout} />
        <div className="text-center py-8">{t('common.loading')}</div>
      </div>
    );
  }

  if (error || !lessonPlan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertDescription>{error || 'Lesson plan not found'}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/advisor/vault')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/advisor/vault')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{lessonPlan.title}</CardTitle>
              <p className="text-gray-600">{lessonPlan.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-sm text-gray-500">
                  {lessonPlan.subject_display} • {lessonPlan.grade_level_display}
                </span>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="exercises" className="flex items-center gap-2">
              <FileQuestion className="w-4 h-4" />
              Exercises ({lessonPlan.exercises_count || 0})
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Files className="w-4 h-4" />
              Materials ({lessonPlan.materials_count || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="space-y-6 mt-6">
            {!showExerciseForm ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Exercises</h2>
                  <Button onClick={() => {
                    setEditingExercise(null);
                    setShowExerciseForm(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exercise
                  </Button>
                </div>
                <VaultExercisesList
                  key={`exercises-${refreshKey}`}
                  lessonPlanId={lessonPlan.id}
                  onEdit={handleEditExercise}
                  canEdit={true}
                />
              </>
            ) : (
              <ExerciseForm
                lessonPlanId={lessonPlan.id}
                exercise={editingExercise || undefined}
                onSuccess={handleExerciseSuccess}
                onCancel={() => {
                  setShowExerciseForm(false);
                  setEditingExercise(null);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-6 mt-6">
            {!showMaterialForm ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Course Materials</h2>
                  <Button onClick={() => {
                    setEditingMaterial(null);
                    setShowMaterialForm(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Material
                  </Button>
                </div>
                <VaultMaterialsList
                  key={`materials-${refreshKey}`}
                  lessonPlanId={lessonPlan.id}
                  onEdit={handleEditMaterial}
                  canEdit={true}
                />
              </>
            ) : (
              <MaterialUploadForm
                lessonPlanId={lessonPlan.id}
                material={editingMaterial || undefined}
                onSuccess={handleMaterialSuccess}
                onCancel={() => {
                  setShowMaterialForm(false);
                  setEditingMaterial(null);
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ManageVaultContent;
