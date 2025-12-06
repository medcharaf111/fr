import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Edit, Trash2, Eye, MapPin, BookOpen, School, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Inspector {
  id: number;
  username: string;
  name: string;
  email: string;
  active_assignments: number;
}

interface Assignment {
  id: number;
  inspector: number;
  inspector_info: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  assignment_type: 'region' | 'subject';
  assignment_type_display: string;
  assigned_region: string | null;
  assigned_subject: string | null;
  assigned_subject_display: string | null;
  school_level: 'primary' | 'middle' | 'secondary';
  school_level_display: string;
  is_active: boolean;
  total_schools: number;
  assigned_at: string;
  notes: string;
}

interface AssignmentOptions {
  regions: string[];
  subjects: Array<{ value: string; label: string }>;
  school_levels: Array<{ value: string; label: string }>;
  assignment_types: Array<{ value: string; label: string }>;
}

const InspectorAssignmentManager: React.FC = () => {
  const { toast } = useToast();
  const { t, dir } = useLanguage();
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [options, setOptions] = useState<AssignmentOptions>({
    regions: [],
    subjects: [],
    school_levels: [],
    assignment_types: []
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    inspector: '',
    assignment_type: 'region' as 'region' | 'subject',
    assigned_region: '',
    assigned_subject: '',
    school_level: 'primary' as 'primary' | 'middle' | 'secondary',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inspectorsRes, assignmentsRes, optionsRes] = await Promise.all([
        api.get('/inspector-assignments/available-inspectors/'),
        api.get('/inspector-assignments/'),
        api.get('/inspector-assignments/assignment-options/')
      ]);
      
      setInspectors(inspectorsRes.data.inspectors);
      setAssignments(assignmentsRes.data);
      setOptions(optionsRes.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.detail || t('inspector.assignments.error.load'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = {
      inspector: parseInt(formData.inspector),
      assignment_type: formData.assignment_type,
      school_level: formData.school_level,
      notes: formData.notes
    };

    // Add appropriate field based on assignment type
    if (formData.assignment_type === 'region') {
      payload.assigned_region = formData.assigned_region;
      payload.assigned_subject = null;
    } else {
      payload.assigned_subject = formData.assigned_subject;
      payload.assigned_region = null;
    }

    try {
      if (editingAssignment) {
        await api.put(`/inspector-assignments/${editingAssignment.id}/`, payload);
        toast({
          title: t('common.success'),
          description: t('inspector.assignments.success.updated')
        });
      } else {
        await api.post('/inspector-assignments/', payload);
        toast({
          title: t('common.success'),
          description: t('inspector.assignments.success.created')
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.detail || error.response?.data?.message || t('inspector.assignments.error.save'),
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      inspector: assignment.inspector.toString(),
      assignment_type: assignment.assignment_type,
      assigned_region: assignment.assigned_region || '',
      assigned_subject: assignment.assigned_subject || '',
      school_level: assignment.school_level,
      notes: assignment.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm(t('inspector.assignments.deactivateConfirm'))) return;
    
    try {
      await api.post(`/inspector-assignments/${id}/deactivate/`);
      toast({
        title: t('common.success'),
        description: t('inspector.assignments.success.deactivated')
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('inspector.assignments.error.deactivate'),
        variant: 'destructive'
      });
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await api.post(`/inspector-assignments/${id}/reactivate/`);
      toast({
        title: t('common.success'),
        description: t('inspector.assignments.success.reactivated')
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('inspector.assignments.error.reactivate'),
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      inspector: '',
      assignment_type: 'region',
      assigned_region: '',
      assigned_subject: '',
      school_level: 'primary',
      notes: ''
    });
    setEditingAssignment(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6" dir={dir}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('inspector.assignments.title')}</CardTitle>
              <CardDescription>
                {t('inspector.assignments.subtitle')}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('inspector.assignments.newAssignment')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingAssignment ? t('inspector.assignments.editTitle') : t('inspector.assignments.createTitle')}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAssignment ? t('inspector.assignments.editSubtitle') : t('inspector.assignments.createSubtitle')}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Inspector Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="inspector">{t('inspector.assignments.inspector')} *</Label>
                    <Select
                      value={formData.inspector}
                      onValueChange={(value) => setFormData({ ...formData, inspector: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('inspector.assignments.selectInspector')} />
                      </SelectTrigger>
                      <SelectContent>
                        {inspectors.map((inspector) => (
                          <SelectItem key={inspector.id} value={inspector.id.toString()}>
                            {inspector.name} ({inspector.active_assignments} active)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* School Level */}
                  <div className="space-y-2">
                    <Label htmlFor="school_level">{t('inspector.assignments.schoolLevel')} *</Label>
                    <Select
                      value={formData.school_level}
                      onValueChange={(value: any) => {
                        setFormData({ 
                          ...formData, 
                          school_level: value,
                          assignment_type: value === 'primary' ? 'region' : 'subject'
                        });
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">{t('inspector.assignments.schoolLevel.primary')}</SelectItem>
                        <SelectItem value="middle">{t('inspector.assignments.schoolLevel.middle')}</SelectItem>
                        <SelectItem value="secondary">{t('inspector.assignments.schoolLevel.secondary')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignment Type (auto-set based on school level) */}
                  <div className="space-y-2">
                    <Label>{t('inspector.assignments.assignmentType')}</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">
                        {formData.school_level === 'primary' 
                          ? `📍 ${t('inspector.assignments.regionalAssignment')}`
                          : `📚 ${t('inspector.assignments.subjectAssignment')}`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Region (for primary schools) */}
                  {formData.school_level === 'primary' && (
                    <div className="space-y-2">
                      <Label htmlFor="assigned_region">{t('inspector.assignments.assignedRegion')} *</Label>
                      <Select
                        value={formData.assigned_region}
                        onValueChange={(value) => setFormData({ ...formData, assigned_region: value })}
                        required={formData.school_level === 'primary'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('inspector.assignments.selectRegion')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {options.regions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Subject (for middle/secondary schools) */}
                  {(formData.school_level === 'middle' || formData.school_level === 'secondary') && (
                    <div className="space-y-2">
                      <Label htmlFor="assigned_subject">{t('inspector.assignments.assignedSubject')} *</Label>
                      <Select
                        value={formData.assigned_subject}
                        onValueChange={(value) => setFormData({ ...formData, assigned_subject: value })}
                        required={formData.school_level === 'middle' || formData.school_level === 'secondary'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('inspector.assignments.selectSubject')} />
                        </SelectTrigger>
                        <SelectContent>
                          {options.subjects.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('inspector.assignments.notes')}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t('inspector.assignments.notesPlaceholder')}
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      {t('inspector.assignments.cancel')}
                    </Button>
                    <Button type="submit">
                      {editingAssignment ? t('inspector.assignments.update') : t('inspector.assignments.create')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('inspector.assignments.loading')}</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('inspector.assignments.noAssignments')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inspector.assignments.tableInspector')}</TableHead>
                  <TableHead>{t('inspector.assignments.tableSchoolLevel')}</TableHead>
                  <TableHead>{t('inspector.assignments.tableAssignmentType')}</TableHead>
                  <TableHead>{t('inspector.assignments.tableAssignment')}</TableHead>
                  <TableHead>{t('inspector.assignments.tableSchools')}</TableHead>
                  <TableHead>{t('inspector.assignments.tableStatus')}</TableHead>
                  <TableHead className="text-right">{t('inspector.assignments.tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.inspector_info.first_name} {assignment.inspector_info.last_name}
                      <div className="text-xs text-muted-foreground">
                        @{assignment.inspector_info.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <School className="mr-1 h-3 w-3" />
                        {assignment.school_level_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.assignment_type === 'region' ? (
                        <Badge variant="secondary">
                          <MapPin className="mr-1 h-3 w-3" />
                          {t('inspector.assignments.regional')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <BookOpen className="mr-1 h-3 w-3" />
                          {t('inspector.assignments.subject')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {assignment.assigned_region || assignment.assigned_subject_display}
                      </div>
                      {assignment.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {assignment.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{assignment.total_schools} {t('inspector.assignments.schools')}</Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.is_active ? (
                        <Badge variant="default">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {t('inspector.assignments.active')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {t('inspector.assignments.inactive')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(assignment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {assignment.is_active ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeactivate(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReactivate(assignment.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inspector Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inspector.assignments.summaryTitle')}</CardTitle>
          <CardDescription>{t('inspector.assignments.summarySubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inspectors.map((inspector) => (
              <Card key={inspector.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{inspector.name}</p>
                      <p className="text-sm text-muted-foreground">@{inspector.username}</p>
                    </div>
                    <Badge variant="secondary">
                      {inspector.active_assignments} {t('inspector.assignments.activeCount')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectorAssignmentManager;
