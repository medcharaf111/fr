import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { authAPI, vaultAPI, lessonAPI } from '@/lib/api';
import { VaultLessonPlan, Lesson } from '@/types/api';
import DashboardHeader from '@/components/DashboardHeader';
import { VaultExercisesList, VaultMaterialsList } from '@/components/vault';
import { 
  Upload,
  Sparkles,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  BookOpen,
  Eye,
  Users,
  MessageSquare,
  Star,
  Award,
  Search,
  Filter,
  ArrowLeft,
  FileQuestion,
  Files
} from 'lucide-react';

const AdvisorVaultDashboard = () => {
  const user = authAPI.getCurrentUser();
  const navigate = useNavigate();

  // Browse vault state
  const [allPlans, setAllPlans] = useState<VaultLessonPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<VaultLessonPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<VaultLessonPlan | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Generate yearly state
  const [yearlySubject, setYearlySubject] = useState('');
  const [yearlyGrade, setYearlyGrade] = useState('');
  const [yearlyPdfFile, setYearlyPdfFile] = useState<File | null>(null);
  const [yearlyInstructions, setYearlyInstructions] = useState('');
  const [yearlyGenerating, setYearlyGenerating] = useState(false);
  const [yearlySuccess, setYearlySuccess] = useState<{ count: number; breakdownId: number } | null>(null);
  const [yearlyError, setYearlyError] = useState<string | null>(null);

  // Generate single state
  const [singleSubject, setSingleSubject] = useState('');
  const [singleGrade, setSingleGrade] = useState('');
  const [singlePdfFile, setSinglePdfFile] = useState<File | null>(null);
  const [singleCustomText, setSingleCustomText] = useState('');
  const [singleGenerating, setSingleGenerating] = useState(false);
  const [singleSuccess, setSingleSuccess] = useState<VaultLessonPlan | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

  // Import from teachers state
  const [teacherLessons, setTeacherLessons] = useState<Lesson[]>([]);
  const [loadingTeacherLessons, setLoadingTeacherLessons] = useState(false);
  const [importingLessonId, setImportingLessonId] = useState<number | null>(null);
  const [importSuccess, setImportSuccess] = useState<VaultLessonPlan | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchAllPlans();
  }, []);

  useEffect(() => {
    filterPlans();
  }, [searchQuery, subjectFilter, gradeFilter, allPlans]);

  const fetchAllPlans = async () => {
    try {
      setLoading(true);
      console.log('Fetching vault plans...');
      const response = await vaultAPI.getAll();
      console.log('Vault plans response:', response.data);
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

  // Handle yearly breakdown generation
  const handleGenerateYearly = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!yearlySubject || !yearlyGrade || !yearlyPdfFile) {
      setYearlyError('Please fill all required fields');
      return;
    }

    setYearlyGenerating(true);
    setYearlyError(null);
    setYearlySuccess(null);

    try {
      const formData = new FormData();
      formData.append('subject', yearlySubject);
      formData.append('grade_level', yearlyGrade);
      formData.append('input_pdf', yearlyPdfFile);
      formData.append('custom_instructions', yearlyInstructions);

      const response = await vaultAPI.generateYearly(formData);
      
      setYearlySuccess({ 
        count: response.data.plans_count, 
        breakdownId: response.data.breakdown_id 
      });
      
      // Reset form
      setYearlySubject('');
      setYearlyGrade('');
      setYearlyPdfFile(null);
      setYearlyInstructions('');
      
      // Refresh vault plans
      fetchAllPlans();
    } catch (error: any) {
      setYearlyError(error.response?.data?.error || 'Failed to generate yearly breakdown');
    } finally {
      setYearlyGenerating(false);
    }
  };

  // Handle single lesson generation
  const handleGenerateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!singleSubject || !singleGrade || !singlePdfFile || !singleCustomText) {
      setSingleError('Please fill all required fields');
      return;
    }

    setSingleGenerating(true);
    setSingleError(null);
    setSingleSuccess(null);

    try {
      const formData = new FormData();
      formData.append('subject', singleSubject);
      formData.append('grade_level', singleGrade);
      formData.append('teacher_guide', singlePdfFile);
      formData.append('custom_text', singleCustomText);

      const response = await vaultAPI.generateSingle(formData);
      
      setSingleSuccess(response.data.plan);
      
      // Reset form
      setSingleSubject('');
      setSingleGrade('');
      setSinglePdfFile(null);
      setSingleCustomText('');
      
      // Refresh vault plans
      fetchAllPlans();
    } catch (error: any) {
      setSingleError(error.response?.data?.error || 'Failed to generate lesson plan');
    } finally {
      setSingleGenerating(false);
    }
  };

  // Fetch teacher lessons for import
  const fetchTeacherLessons = async () => {
    setLoadingTeacherLessons(true);
    try {
      const response = await lessonAPI.getAllLessons();
      setTeacherLessons(response);
    } catch (error) {
      console.error('Failed to fetch teacher lessons:', error);
    } finally {
      setLoadingTeacherLessons(false);
    }
  };

  // Handle import from teacher
  const handleImportLesson = async (lessonId: number) => {
    setImportingLessonId(lessonId);
    setImportError(null);
    setImportSuccess(null);

    try {
      const response = await vaultAPI.importFromTeacher({ lesson_id: lessonId });
      setImportSuccess(response.data.plan);
      
      // Refresh vault plans
      fetchAllPlans();
    } catch (error: any) {
      setImportError(error.response?.data?.error || 'Failed to import lesson');
    } finally {
      setImportingLessonId(null);
    }
  };

  // Get source type badge
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

  // Handle view details
  const handleViewDetails = (plan: VaultLessonPlan) => {
    console.log('Opening details for plan:', plan.id, plan.title);
    setSelectedPlan(plan);
    setDetailsDialogOpen(true);
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Back Button and Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/advisor')}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Advisor Vault</h1>
            <p className="text-gray-600 mt-1">AI-powered lesson plan generation and storage</p>
          </div>

          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generate-yearly">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Yearly
              </TabsTrigger>
              <TabsTrigger value="generate-single">
                <FileText className="w-4 h-4 mr-2" />
                Generate Single
              </TabsTrigger>
              <TabsTrigger value="import">
                <Download className="w-4 h-4 mr-2" />
                Import Lessons
              </TabsTrigger>
              <TabsTrigger value="browse">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Vault
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Generate Yearly Breakdown */}
            <TabsContent value="generate-yearly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Yearly Breakdown</CardTitle>
                  <CardDescription>
                    Upload a curriculum PDF and generate 20-30 comprehensive lesson plans for the entire year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerateYearly} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Subject *</label>
                        <Select value={yearlySubject} onValueChange={setYearlySubject} required>
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

                      <div>
                        <label className="text-sm font-medium">Grade Level *</label>
                        <Select value={yearlyGrade} onValueChange={setYearlyGrade} required>
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

                    <div>
                      <label className="text-sm font-medium">Curriculum PDF *</label>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setYearlyPdfFile(e.target.files?.[0] || null)}
                        required
                      />
                      {yearlyPdfFile && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {yearlyPdfFile.name} ({(yearlyPdfFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium">Custom Instructions (Optional)</label>
                      <Textarea
                        value={yearlyInstructions}
                        onChange={(e) => setYearlyInstructions(e.target.value)}
                        placeholder="Any specific requirements or focus areas for the lesson plans..."
                        rows={4}
                      />
                    </div>

                    {yearlyError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{yearlyError}</AlertDescription>
                      </Alert>
                    )}

                    {yearlySuccess && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Successfully generated {yearlySuccess.count} lesson plans! Check the Browse Vault tab to view them.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={yearlyGenerating} className="w-full">
                      {yearlyGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating... This may take 1-2 minutes
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Yearly Breakdown
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Generate Single Lesson */}
            <TabsContent value="generate-single" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Single Lesson Plan</CardTitle>
                  <CardDescription>
                    Upload a teacher's guide PDF and provide custom instructions to generate a detailed lesson plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerateSingle} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Subject *</label>
                        <Select value={singleSubject} onValueChange={setSingleSubject} required>
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

                      <div>
                        <label className="text-sm font-medium">Grade Level *</label>
                        <Select value={singleGrade} onValueChange={setSingleGrade} required>
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

                    <div>
                      <label className="text-sm font-medium">Teacher's Guide PDF *</label>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSinglePdfFile(e.target.files?.[0] || null)}
                        required
                      />
                      {singlePdfFile && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {singlePdfFile.name} ({(singlePdfFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium">Custom Instructions *</label>
                      <Textarea
                        value={singleCustomText}
                        onChange={(e) => setSingleCustomText(e.target.value)}
                        placeholder="Describe what you want in this lesson plan (topic, objectives, activities, etc.)..."
                        rows={6}
                        required
                      />
                    </div>

                    {singleError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{singleError}</AlertDescription>
                      </Alert>
                    )}

                    {singleSuccess && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Successfully generated lesson plan: "{singleSuccess.title}"! Check the Browse Vault tab to view it.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={singleGenerating} className="w-full">
                      {singleGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating... Please wait
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Single Lesson Plan
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Import from Teachers */}
            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Import Lesson Plans from Teachers</CardTitle>
                  <CardDescription>
                    Browse lessons created by teachers and import them to the vault for sharing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherLessons.length === 0 && !loadingTeacherLessons && (
                    <div className="text-center py-8">
                      <Button onClick={fetchTeacherLessons}>
                        Load Teacher Lessons
                      </Button>
                    </div>
                  )}

                  {loadingTeacherLessons && (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                      <p className="text-gray-600 mt-2">Loading teacher lessons...</p>
                    </div>
                  )}

                  {importError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{importError}</AlertDescription>
                    </Alert>
                  )}

                  {importSuccess && (
                    <Alert className="bg-green-50 border-green-200 mb-4">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Successfully imported: "{importSuccess.title}"!
                      </AlertDescription>
                    </Alert>
                  )}

                  {teacherLessons.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teacherLessons.map((lesson) => (
                        <Card key={lesson.id}>
                          <CardHeader>
                            <CardTitle className="text-lg">{lesson.title}</CardTitle>
                            <CardDescription className="line-clamp-3">
                              {lesson.content.substring(0, 150)}...
                            </CardDescription>
                            <p className="text-xs text-gray-500 mt-1">
                              By {lesson.created_by_name || 'Unknown Teacher'}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex gap-2">
                              <Badge variant="outline">{lesson.subject}</Badge>
                              <Badge variant="outline">Grade {lesson.grade_level}</Badge>
                            </div>

                            <Button
                              onClick={() => handleImportLesson(lesson.id)}
                              disabled={importingLessonId === lesson.id}
                              className="w-full"
                            >
                              {importingLessonId === lesson.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Importing...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-2" />
                                  Import to Vault
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Browse Vault */}
            <TabsContent value="browse" className="space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Search & Filter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by title, description, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Loading lesson plans...</p>
                  </CardContent>
                </Card>
              ) : filteredPlans.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Lesson Plans Found</h3>
                    <p className="text-gray-600">Try adjusting your filters or generate new plans</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlans.map((plan) => (
                    <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex gap-2 mb-2">
                          {plan.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Award className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {getSourceBadge(plan)}
                        </div>
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

                        {/* Language-specific fields */}
                        {(plan.subject === 'english' || plan.subject === 'french' || plan.subject === 'arabic') && (
                          <div className="space-y-1 text-xs border-t pt-2">
                            {plan.grammar.length > 0 && (
                              <div>
                                <span className="font-semibold text-gray-700">Grammar: </span>
                                <span className="text-gray-600">{plan.grammar.slice(0, 2).join(', ')}</span>
                              </div>
                            )}
                            {plan.vocabulary.length > 0 && (
                              <div>
                                <span className="font-semibold text-gray-700">Vocabulary: </span>
                                <span className="text-gray-600">{plan.vocabulary.slice(0, 3).join(', ')}</span>
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

                        {plan.average_rating && plan.average_rating > 0 && (
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
                            onClick={() => navigate(`/advisor/vault/manage?planId=${plan.id}`)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvisorVaultDashboard;
