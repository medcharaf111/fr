import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authAPI, vaultAPI, lessonsAPI } from '@/lib/api';
import { VaultLessonPlan, Lesson } from '@/types/api';
import DashboardHeader from '@/components/DashboardHeader';
import { 
  Plus, 
  BookOpen, 
  Star, 
  Eye, 
  Users, 
  MessageSquare,
  TrendingUp,
  Award,
  Search,
  Filter,
  X,
  Upload,
  Sparkles,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';

const AdvisorVaultDashboard = () => {
  const [myPlans, setMyPlans] = useState<VaultLessonPlan[]>([]);
  const [allPlans, setAllPlans] = useState<VaultLessonPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<VaultLessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<VaultLessonPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    subject: '',
    grade_level: '',
    objectives: [''],
    materials_needed: [''],
    duration_minutes: 45,
    tags: [''],
    // Language-specific fields (for English, French, Arabic)
    grammar: [''],
    vocabulary: [''],
    life_skills_and_values: ['']
  });
  
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    fetchMyContributions();
    fetchAllPlans();
  }, []);

  useEffect(() => {
    filterPlans();
  }, [searchQuery, subjectFilter, gradeFilter, allPlans]);

  const fetchMyContributions = async () => {
    try {
      const response = await vaultAPI.getMyContributions();
      setMyPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
    }
  };

  const fetchAllPlans = async () => {
    try {
      setLoading(true);
      const response = await vaultAPI.getAll();
      setAllPlans(response.data);
      setFilteredPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch vault plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlans = () => {
    let filtered = allPlans;

    if (searchQuery) {
      filtered = filtered.filter(plan =>
        plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (subjectFilter !== 'all') {
      filtered = filtered.filter(plan => plan.subject === subjectFilter);
    }

    if (gradeFilter !== 'all') {
      filtered = filtered.filter(plan => plan.grade_level === gradeFilter);
    }

    setFilteredPlans(filtered);
  };

  const handleCreatePlan = async () => {
    try {
      const data = {
        ...formData,
        objectives: formData.objectives.filter(o => o.trim() !== ''),
        materials_needed: formData.materials_needed.filter(m => m.trim() !== ''),
        tags: formData.tags.filter(t => t.trim() !== ''),
        grammar: formData.grammar.filter(g => g.trim() !== ''),
        vocabulary: formData.vocabulary.filter(v => v.trim() !== ''),
        life_skills_and_values: formData.life_skills_and_values.filter(l => l.trim() !== '')
      };

      await vaultAPI.create(data);
      setCreateDialogOpen(false);
      resetForm();
      fetchMyContributions();
      fetchAllPlans();
    } catch (error) {
      console.error('Failed to create lesson plan:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      subject: '',
      grade_level: '',
      objectives: [''],
      materials_needed: [''],
      duration_minutes: 45,
      tags: [''],
      grammar: [''],
      vocabulary: [''],
      life_skills_and_values: ['']
    });
  };

  const addObjective = () => {
    setFormData({ ...formData, objectives: [...formData.objectives, ''] });
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter((_, i) => i !== index)
    });
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, objectives: newObjectives });
  };

  const addMaterial = () => {
    setFormData({ ...formData, materials_needed: [...formData.materials_needed, ''] });
  };

  const removeMaterial = (index: number) => {
    setFormData({
      ...formData,
      materials_needed: formData.materials_needed.filter((_, i) => i !== index)
    });
  };

  const updateMaterial = (index: number, value: string) => {
    const newMaterials = [...formData.materials_needed];
    newMaterials[index] = value;
    setFormData({ ...formData, materials_needed: newMaterials });
  };

  const addTag = () => {
    setFormData({ ...formData, tags: [...formData.tags, ''] });
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index)
    });
  };

  const updateTag = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  // Grammar field helpers
  const addGrammar = () => {
    setFormData({ ...formData, grammar: [...formData.grammar, ''] });
  };

  const removeGrammar = (index: number) => {
    setFormData({
      ...formData,
      grammar: formData.grammar.filter((_, i) => i !== index)
    });
  };

  const updateGrammar = (index: number, value: string) => {
    const newGrammar = [...formData.grammar];
    newGrammar[index] = value;
    setFormData({ ...formData, grammar: newGrammar });
  };

  // Vocabulary field helpers
  const addVocabulary = () => {
    setFormData({ ...formData, vocabulary: [...formData.vocabulary, ''] });
  };

  const removeVocabulary = (index: number) => {
    setFormData({
      ...formData,
      vocabulary: formData.vocabulary.filter((_, i) => i !== index)
    });
  };

  const updateVocabulary = (index: number, value: string) => {
    const newVocabulary = [...formData.vocabulary];
    newVocabulary[index] = value;
    setFormData({ ...formData, vocabulary: newVocabulary });
  };

  // Life Skills and Values field helpers
  const addLifeSkill = () => {
    setFormData({ ...formData, life_skills_and_values: [...formData.life_skills_and_values, ''] });
  };

  const removeLifeSkill = (index: number) => {
    setFormData({
      ...formData,
      life_skills_and_values: formData.life_skills_and_values.filter((_, i) => i !== index)
    });
  };

  const updateLifeSkill = (index: number, value: string) => {
    const newLifeSkills = [...formData.life_skills_and_values];
    newLifeSkills[index] = value;
    setFormData({ ...formData, life_skills_and_values: newLifeSkills });
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  if (!user) return null;

  const subjects = [
    { value: 'math', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'French' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'social_studies', label: 'Social Studies' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
    { value: 'physical_education', label: 'Physical Education' },
    { value: 'computer_science', label: 'Computer Science' },
    { value: 'religious_studies', label: 'Religious Studies' }
  ];

  const grades = [
    { value: '1', label: '1st Grade' },
    { value: '2', label: '2nd Grade' },
    { value: '3', label: '3rd Grade' },
    { value: '4', label: '4th Grade' },
    { value: '5', label: '5th Grade' },
    { value: '6', label: '6th Grade' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advisor Vault</h1>
              <p className="text-gray-600 mt-1">Create and share lesson plans with teachers</p>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lesson Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Lesson Plan</DialogTitle>
                  <DialogDescription>
                    Share a lesson plan with teachers in your subject area
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Basic Info */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      placeholder="e.g., Introduction to Fractions"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea
                      placeholder="Brief description of the lesson plan"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject *</label>
                      <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Grade Level *</label>
                      <Select value={formData.grade_level} onValueChange={(value) => setFormData({ ...formData, grade_level: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map(g => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    />
                  </div>

                  {/* Objectives */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Learning Objectives</label>
                      <Button size="sm" variant="outline" onClick={addObjective}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {formData.objectives.map((obj, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Objective ${index + 1}`}
                          value={obj}
                          onChange={(e) => updateObjective(index, e.target.value)}
                        />
                        {formData.objectives.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() => removeObjective(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Materials */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Materials Needed</label>
                      <Button size="sm" variant="outline" onClick={addMaterial}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {formData.materials_needed.map((material, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Material ${index + 1}`}
                          value={material}
                          onChange={(e) => updateMaterial(index, e.target.value)}
                        />
                        {formData.materials_needed.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() => removeMaterial(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Tags</label>
                      <Button size="sm" variant="outline" onClick={addTag}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Tag ${index + 1}`}
                          value={tag}
                          onChange={(e) => updateTag(index, e.target.value)}
                        />
                        {formData.tags.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() => removeTag(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Language-specific fields (English, French, Arabic) */}
                  {(formData.subject === 'english' || formData.subject === 'french' || formData.subject === 'arabic') && (
                    <>
                      {/* Grammar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Grammar Points</label>
                          <Button size="sm" variant="outline" onClick={addGrammar}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                        {formData.grammar.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Grammar point ${index + 1}`}
                              value={item}
                              onChange={(e) => updateGrammar(index, e.target.value)}
                            />
                            {formData.grammar.length > 1 && (
                              <Button size="icon" variant="ghost" onClick={() => removeGrammar(index)}>
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Vocabulary */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Vocabulary</label>
                          <Button size="sm" variant="outline" onClick={addVocabulary}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                        {formData.vocabulary.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Vocabulary word/phrase ${index + 1}`}
                              value={item}
                              onChange={(e) => updateVocabulary(index, e.target.value)}
                            />
                            {formData.vocabulary.length > 1 && (
                              <Button size="icon" variant="ghost" onClick={() => removeVocabulary(index)}>
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Life Skills and Values */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Life Skills and Values</label>
                          <Button size="sm" variant="outline" onClick={addLifeSkill}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                        {formData.life_skills_and_values.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Life skill or value ${index + 1}`}
                              value={item}
                              onChange={(e) => updateLifeSkill(index, e.target.value)}
                            />
                            {formData.life_skills_and_values.length > 1 && (
                              <Button size="icon" variant="ghost" onClick={() => removeLifeSkill(index)}>
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Content */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Lesson Plan Content *</label>
                    <Textarea
                      placeholder="Write the full lesson plan here. Include procedures, activities, assessments, etc."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={10}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreatePlan}
                      disabled={!formData.title || !formData.description || !formData.content || !formData.subject || !formData.grade_level}
                    >
                      Create Lesson Plan
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="my-plans" className="space-y-6">
            <TabsList>
              <TabsTrigger value="my-plans">
                <BookOpen className="w-4 h-4 mr-2" />
                My Contributions ({myPlans.length})
              </TabsTrigger>
              <TabsTrigger value="browse">
                <Search className="w-4 h-4 mr-2" />
                Browse All Plans
              </TabsTrigger>
            </TabsList>

            {/* My Contributions Tab */}
            <TabsContent value="my-plans">
              {myPlans.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Lesson Plans Yet</h3>
                    <p className="text-gray-600 mb-4">Start creating lesson plans to share with teachers</p>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Plan
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPlans.map((plan) => (
                    <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        {plan.is_featured && (
                          <Badge className="w-fit mb-2 bg-yellow-100 text-yellow-800">
                            <Award className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Badge variant="outline">{plan.subject_display}</Badge>
                          <Badge variant="outline">{plan.grade_level_display}</Badge>
                        </div>

                        {plan.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {plan.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Language-specific fields for English, French, Arabic */}
                        {(plan.subject === 'english' || plan.subject === 'french' || plan.subject === 'arabic') && (
                          <div className="space-y-1 text-xs border-t pt-2">
                            {plan.grammar.length > 0 && (
                              <div>
                                <span className="font-semibold text-gray-700">Grammar: </span>
                                <span className="text-gray-600">{plan.grammar.slice(0, 2).join(', ')}{plan.grammar.length > 2 && '...'}</span>
                              </div>
                            )}
                            {plan.vocabulary.length > 0 && (
                              <div>
                                <span className="font-semibold text-gray-700">Vocabulary: </span>
                                <span className="text-gray-600">{plan.vocabulary.slice(0, 3).join(', ')}{plan.vocabulary.length > 3 && '...'}</span>
                              </div>
                            )}
                            {plan.life_skills_and_values.length > 0 && (
                              <div>
                                <span className="font-semibold text-gray-700">Life Skills: </span>
                                <span className="text-gray-600">{plan.life_skills_and_values.slice(0, 2).join(', ')}{plan.life_skills_and_values.length > 2 && '...'}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
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

                        {plan.average_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold">{plan.average_rating}</span>
                            <span className="text-sm text-gray-600">/ 5</span>
                          </div>
                        )}

                        <Button className="w-full" variant="outline">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Browse All Plans Tab */}
            <TabsContent value="browse">
              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search lesson plans..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {grades.map(g => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">Loading lesson plans...</p>
                  </CardContent>
                </Card>
              ) : filteredPlans.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Lesson Plans Found</h3>
                    <p className="text-gray-600">Try adjusting your filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlans.map((plan) => (
                    <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        {plan.is_featured && (
                          <Badge className="w-fit mb-2 bg-yellow-100 text-yellow-800">
                            <Award className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {plan.description}
                        </CardDescription>
                        <p className="text-xs text-gray-500 mt-2">
                          By {plan.created_by_full_name}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Badge variant="outline">{plan.subject_display}</Badge>
                          <Badge variant="outline">{plan.grade_level_display}</Badge>
                        </div>

                        {plan.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {plan.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Language-specific fields for English, French, Arabic */}
                        {(plan.subject === 'english' || plan.subject === 'french' || plan.subject === 'arabic') && (
                          <div className="space-y-1 text-xs border-t pt-2">
                            {plan.grammar.length > 0 && (
                              <div>
                                <span className="font-semibold text-gray-700">Grammar: </span>
                                <span className="text-gray-600">{plan.grammar.slice(0, 2).join(', ')}{plan.grammar.length > 2 && '...'}</span>
                              </div>
                            )}
                            {plan.vocabulary.length > 0 && (
                              <div>
                                <span className="font-semibold text-gray-700">Vocabulary: </span>
                                <span className="text-gray-600">{plan.vocabulary.slice(0, 3).join(', ')}{plan.vocabulary.length > 3 && '...'}</span>
                              </div>
                            )}
                            {plan.life_skills_and_values.length > 0 && (
                              <div>
                                <span className="font-semibold text-gray-700">Life Skills: </span>
                                <span className="text-gray-600">{plan.life_skills_and_values.slice(0, 2).join(', ')}{plan.life_skills_and_values.length > 2 && '...'}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
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

                        {plan.average_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold">{plan.average_rating}</span>
                            <span className="text-sm text-gray-600">/ 5</span>
                          </div>
                        )}

                        <Button className="w-full" variant="outline">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdvisorVaultDashboard;
