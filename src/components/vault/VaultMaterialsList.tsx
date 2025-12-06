import React, { useState, useEffect } from 'react';
import { vaultAPI } from '@/lib/api';
import { VaultMaterial } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, FileText, Image, FileVideo, ExternalLink, Trash2, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VaultMaterialsListProps {
  lessonPlanId: number;
  onEdit?: (material: VaultMaterial) => void;
  canEdit?: boolean;
}

export const VaultMaterialsList: React.FC<VaultMaterialsListProps> = ({
  lessonPlanId,
  onEdit,
  canEdit = false
}) => {
  const [materials, setMaterials] = useState<VaultMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await vaultAPI.getMaterials({ vault_lesson_plan: lessonPlanId });
      setMaterials(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [lessonPlanId]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      await vaultAPI.deleteMaterial(id);
      await fetchMaterials();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete material');
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      const response = await vaultAPI.downloadMaterial(id);
      await vaultAPI.incrementMaterialDownload(id);
      
      // Open the file URL in a new tab
      if (response.data.file_url) {
        window.open(response.data.file_url, '_blank');
      }
      
      await fetchMaterials();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to download material');
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'doc':
      case 'ppt':
        return <FileText className="h-5 w-5" />;
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video_link':
        return <FileVideo className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getMaterialTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'pdf': 'PDF Document',
      'doc': 'Word Document',
      'ppt': 'PowerPoint',
      'image': 'Image',
      'video_link': 'Video Link',
      'other': 'Other'
    };
    return labels[type] || type.toUpperCase();
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading materials...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No materials available for this lesson plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {materials.map((material) => (
        <Card key={material.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {getMaterialIcon(material.material_type)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{material.title}</CardTitle>
                  {material.description && (
                    <CardDescription className="mt-2">{material.description}</CardDescription>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(material)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(material.id)}
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
                {getMaterialTypeLabel(material.material_type)}
              </Badge>
              {material.file_size && (
                <Badge variant="secondary">
                  {formatFileSize(material.file_size)}
                </Badge>
              )}
              <Badge variant="secondary">
                <Download className="h-3 w-3 mr-1" />
                {material.download_count} downloads
              </Badge>
            </div>
            
            {material.file_name && (
              <p className="text-sm text-gray-600 mb-2">
                File: {material.file_name}
              </p>
            )}
            
            <div className="text-sm text-gray-600">
              <p>Uploaded by: {material.created_by_name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(material.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              {material.file_url && (
                <Button
                  onClick={() => handleDownload(material.id, material.file_name || 'download')}
                  variant="default"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              {material.external_link && (
                <Button
                  onClick={() => window.open(material.external_link, '_blank')}
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
