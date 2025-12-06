import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { authAPI, vaultAPI } from '@/lib/api';
import { VaultBySubject, VaultLessonPlan, User } from '@/types/api';
import DashboardHeader from '@/components/DashboardHeader';
import { VaultExercisesList, VaultMaterialsList, VaultExercisesExplorer, VaultMaterialsExplorer } from '@/components/vault';
import { 
  BookOpen, 
  Star, 
  Eye, 
  Users, 
  MessageSquare,
  Search,
  Clock,
  Award,
  Sparkles,
  Download,
  FileText,
  ArrowLeft,
  FileQuestion,
  Files,
  Library
} from 'lucide-react';

const TeacherVaultDashboard = () => {
  const [vaultBySubject, setVaultBySubject] = useState<VaultBySubject>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<VaultLessonPlan | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [usingPlanId, setUsingPlanId] = useState<number | null>(null);
  const [generatingLessonId, setGeneratingLessonId] = useState<number | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [activeTab, setActiveTab] = useState<string>('lesson-plans');
  
  const user = authAPI.getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVaultBySubject();
  }, []);

  const fetchVaultBySubject = async () => {
    try {
      setLoading(true);
      const response = await vaultAPI.getBySubject();
      setVaultBySubject(response.data);
    } catch (error) {
      console.error('Failed to fetch vault:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  const handleViewDetails = (plan: VaultLessonPlan) => {
    console.log('Opening details for plan:', plan.id, plan.title);
    setSelectedPlan(plan);
    setDetailsDialogOpen(true);
  };

  const handleUsePlan = async (planId: number) => {
    setUsingPlanId(planId);
    try {
      await vaultAPI.usePlan(planId, {});
      // Increment the view count locally for immediate feedback
      setVaultBySubject(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(subject => {
          updated[subject].plans = updated[subject].plans.map(plan => 
            plan.id === planId 
              ? { ...plan, use_count: plan.use_count + 1 }
              : plan
          );
        });
        return updated;
      });
      
      // Show success feedback (optional - could use a toast notification)
      console.log('Plan marked as used successfully');
    } catch (error) {
      console.error('Failed to mark plan as used:', error);
    } finally {
      setUsingPlanId(null);
    }
  };

  const handleGenerateLesson = async (planId: number, withSchedule = false) => {
    if (withSchedule) {
      // Open schedule dialog
      setSelectedPlan(vaultBySubject[Object.keys(vaultBySubject)[0]]?.plans.find(p => p.id === planId) || null);
      setScheduleDialogOpen(true);
      return;
    }

    setGeneratingLessonId(planId);
    try {
      const response = await vaultAPI.generateLesson(planId, {});
      
      // Increment use count locally
      setVaultBySubject(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(subject => {
          updated[subject].plans = updated[subject].plans.map(plan => 
            plan.id === planId 
              ? { ...plan, use_count: plan.use_count + 1 }
              : plan
          );
        });
        return updated;
      });
      
      const aiEnhanced = response.data.ai_enhanced;
      const message = aiEnhanced 
        ? '✨ AI-enhanced lesson generated successfully! The content has been customized and expanded. You can find it in your lessons list and timeline.'
        : '✓ Lesson generated successfully! You can find it in your lessons list and timeline.';
      
      alert(message);
      console.log('Lesson generated:', response.data);
    } catch (error) {
      console.error('Failed to generate lesson:', error);
      alert('❌ Failed to generate lesson. Please try again.');
    } finally {
      setGeneratingLessonId(null);
    }
  };

  const handleScheduleLesson = async () => {
    if (!selectedPlan || !scheduledDate) {
      alert('Please select a date');
      return;
    }

    setGeneratingLessonId(selectedPlan.id);
    try {
      const response = await vaultAPI.generateLesson(selectedPlan.id, {
        scheduled_date: scheduledDate,
      });
      
      // Increment use count locally
      setVaultBySubject(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(subject => {
          updated[subject].plans = updated[subject].plans.map(plan => 
            plan.id === selectedPlan.id 
              ? { ...plan, use_count: plan.use_count + 1 }
              : plan
          );
        });
        return updated;
      });
      
      setScheduleDialogOpen(false);
      setScheduledDate('');
      
      const aiEnhanced = response.data.ai_enhanced;
      const message = aiEnhanced 
        ? `✨ AI-enhanced lesson generated and scheduled for ${scheduledDate}! The content has been customized and expanded.`
        : `✓ Lesson generated and scheduled for ${scheduledDate}!`;
      
      alert(message);
      console.log('Lesson generated and scheduled:', response.data);
    } catch (error) {
      console.error('Failed to generate and schedule lesson:', error);
      alert('❌ Failed to generate lesson. Please try again.');
    } finally {
      setGeneratingLessonId(null);
    }
  };

  const getSourceBadge = (plan: VaultLessonPlan) => {
    if (plan.source_type === 'ai_yearly') {
      return <Badge className="bg-amber-100 text-amber-800"><Sparkles className="w-3 h-3 mr-1" />AI Yearly</Badge>;
    } else if (plan.source_type === 'ai_single') {
      return <Badge className="bg-purple-100 text-purple-800"><Sparkles className="w-3 h-3 mr-1" />AI Single</Badge>;
    } else if (plan.source_type === 'imported') {
      return <Badge className="bg-blue-100 text-blue-800"><Download className="w-3 h-3 mr-1" />Imported from {plan.source_teacher_name}</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800"><FileText className="w-3 h-3 mr-1" />Manual</Badge>;
    }
  };

  const filterPlans = (plans: VaultLessonPlan[]) => {
    if (!searchQuery) return plans;
    
    return plans.filter(plan =>
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  if (!user) return null;

  const subjects = Object.keys(vaultBySubject);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Back Button and Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/teacher')}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Lesson Plan Vault</h1>
            <p className="text-gray-600 mt-1">Browse lesson plans, exercises, and materials</p>
          </div>

          {/* Main Tabs: Lesson Plans vs Exercises vs Materials */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="lesson-plans" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Lesson Plans
              </TabsTrigger>
              <TabsTrigger value="exercises" className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4" />
                Exercises
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-2">
                <Files className="w-4 h-4" />
                Materials
              </TabsTrigger>
            </TabsList>

            {/* Lesson Plans Tab */}
            <TabsContent value="lesson-plans" className="space-y-6"
            >
              {/* Search */}
              <Card>
                <CardContent className="py-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search lesson plans across all subjects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Loading vault...</p>
                  </CardContent>
                </Card>
              ) : subjects.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Lesson Plans Available</h3>
                    <p className="text-gray-600">Check back later for new lesson plans</p>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue={subjects[0]} className="space-y-6">
                  <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                    {subjects.map((subject) => {
                      const subjectData = vaultBySubject[subject];
                      const filteredCount = filterPlans(subjectData.plans).length;
                      
                      return (
                        <TabsTrigger 
                          key={subject} 
                          value={subject}
                          className="flex items-center gap-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          {subjectData.subject_display}
                          <Badge variant="secondary" className="ml-1">
                            {filteredCount}
                          </Badge>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {subjects.map((subject) => {
                const subjectData = vaultBySubject[subject];
                const filteredPlans = filterPlans(subjectData.plans);

                return (
                  <TabsContent key={subject} value={subject}>
                    {filteredPlans.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">
                            {searchQuery ? 'No Matching Lesson Plans' : 'No Lesson Plans Available'}
                          </h3>
                          <p className="text-gray-600">
                            {searchQuery 
                              ? 'Try adjusting your search query' 
                              : `No lesson plans for ${subjectData.subject_display} yet`
                            }
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlans.map((plan) => (
                          <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                              <CardTitle className="text-lg">{plan.title}</CardTitle>
                              <CardDescription className="line-clamp-2">
                                {plan.description}
                              </CardDescription>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                <span>By {plan.created_by_full_name}</span>
                                <span>•</span>
                                <span>{plan.school_name}</span>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex gap-2">
                                <Badge variant="outline">{plan.grade_level_display}</Badge>
                                {plan.duration_minutes && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {plan.duration_minutes} min
                                  </Badge>
                                )}
                              </div>

                              {plan.objectives.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-gray-700">Learning Objectives:</p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {plan.objectives.slice(0, 2).map((obj, idx) => (
                                      <li key={idx} className="line-clamp-1">• {obj}</li>
                                    ))}
                                    {plan.objectives.length > 2 && (
                                      <li className="text-gray-500 italic">
                                        +{plan.objectives.length - 2} more
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}

                              {plan.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {plan.tags.slice(0, 3).map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {plan.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{plan.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 pt-2 border-t">
                                <div className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  <span>{plan.view_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{plan.use_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  <span>{plan.comments_count}</span>
                                </div>
                              </div>

                              {(plan.exercises_count > 0 || plan.materials_count > 0) && (
                                <div className="flex gap-2 text-xs">
                                  {plan.exercises_count > 0 && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <FileQuestion className="w-3 h-3" />
                                      {plan.exercises_count} Exercise{plan.exercises_count !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {plan.materials_count > 0 && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Files className="w-3 h-3" />
                                      {plan.materials_count} Material{plan.materials_count !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {plan.average_rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-semibold">{plan.average_rating.toFixed(1)}</span>
                                  <span className="text-sm text-gray-600">/ 5</span>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1" 
                                  variant="outline"
                                  onClick={() => handleViewDetails(plan)}
                                >
                                  View Details
                                </Button>
                              <Button 
                                className="flex-1"
                                onClick={() => handleGenerateLesson(plan.id)}
                                disabled={generatingLessonId === plan.id}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                {generatingLessonId === plan.id ? 'Generating with AI...' : 'Generate with AI'}
                              </Button>
                              </div>
                              <Button 
                                className="w-full"
                                variant="outline"
                                onClick={() => handleGenerateLesson(plan.id, true)}
                                disabled={generatingLessonId === plan.id}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Schedule Lesson
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
            </TabsContent>

            {/* Exercises Library Tab */}
            <TabsContent value="exercises">
              <VaultExercisesExplorer />
            </TabsContent>

            {/* Materials Library Tab */}
            <TabsContent value="materials">
              <VaultMaterialsExplorer />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Lesson Plan Details Modal */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedPlan && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedPlan.title}</DialogTitle>
                <div className="flex gap-2 mt-2">
                  {selectedPlan.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Award className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {getSourceBadge(selectedPlan)}
                  <Badge variant="outline">{selectedPlan.subject_display}</Badge>
                  <Badge variant="outline">{selectedPlan.grade_level_display}</Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-700">{selectedPlan.description}</p>
                </div>

                {/* Objectives */}
                {selectedPlan.objectives.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Learning Objectives</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedPlan.objectives.map((obj, idx) => (
                        <li key={idx} className="text-gray-700">{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Content */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Lesson Content</h3>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                      {selectedPlan.content}
                    </pre>
                  </div>
                </div>

                {/* Language-specific fields for English, French, Arabic */}
                {(selectedPlan.subject === 'english' || selectedPlan.subject === 'french' || selectedPlan.subject === 'arabic') && (
                  <>
                    {selectedPlan.grammar.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Grammar Points</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedPlan.grammar.map((item, idx) => (
                            <li key={idx} className="text-gray-700">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedPlan.vocabulary.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Vocabulary</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlan.vocabulary.map((word, idx) => (
                            <Badge key={idx} variant="secondary">{word}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPlan.life_skills_and_values.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Life Skills & Values</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedPlan.life_skills_and_values.map((skill, idx) => (
                            <li key={idx} className="text-gray-700">{skill}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Materials Needed */}
                {selectedPlan.materials_needed.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Materials Needed</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedPlan.materials_needed.map((material, idx) => (
                        <li key={idx} className="text-gray-700">{material}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Duration */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Duration</h3>
                  <p className="text-gray-700">{selectedPlan.duration_minutes} minutes</p>
                </div>

                {/* Tags */}
                {selectedPlan.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlan.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Eye className="w-4 h-4" />
                        <span>Views</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedPlan.view_count}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Uses</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedPlan.use_count}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MessageSquare className="w-4 h-4" />
                        <span>Comments</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedPlan.comments_count}</p>
                    </div>
                  </div>
                  {selectedPlan.average_rating && selectedPlan.average_rating > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xl font-bold">{selectedPlan.average_rating.toFixed(1)}</span>
                        <span className="text-gray-600">/ 5</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exercises */}
                {selectedPlan.exercises_count > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FileQuestion className="w-5 h-5" />
                      <h3 className="font-semibold text-lg">Exercises ({selectedPlan.exercises_count})</h3>
                    </div>
                    <VaultExercisesList 
                      lessonPlanId={selectedPlan.id} 
                      canEdit={false}
                    />
                  </div>
                )}

                {/* Materials */}
                {selectedPlan.materials_count > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Files className="w-5 h-5" />
                      <h3 className="font-semibold text-lg">Course Materials ({selectedPlan.materials_count})</h3>
                    </div>
                    <VaultMaterialsList 
                      lessonPlanId={selectedPlan.id} 
                      canEdit={false}
                    />
                  </div>
                )}

                {/* Creator Info */}
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">
                    Created by <span className="font-semibold">{selectedPlan.created_by_full_name}</span>
                  </p>
                  {selectedPlan.source_type === 'imported' && selectedPlan.source_teacher_name && (
                    <p className="text-sm text-gray-600 mt-1">
                      Originally created by <span className="font-semibold">{selectedPlan.source_teacher_name}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(selectedPlan.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 space-y-2">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => {
                      handleGenerateLesson(selectedPlan.id);
                      setDetailsDialogOpen(false);
                    }}
                    disabled={generatingLessonId === selectedPlan.id}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generatingLessonId === selectedPlan.id ? 'Generating with AI...' : 'Generate with AI'}
                  </Button>
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleGenerateLesson(selectedPlan.id, true);
                    }}
                    disabled={generatingLessonId === selectedPlan.id}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule Lesson
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lesson: {selectedPlan?.title}</label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => {
                  setScheduleDialogOpen(false);
                  setScheduledDate('');
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleScheduleLesson}
                disabled={!scheduledDate || generatingLessonId === selectedPlan?.id}
              >
                {generatingLessonId === selectedPlan?.id ? 'Generating...' : 'Generate & Schedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherVaultDashboard;
