import React, { useState, useRef } from 'react';
import { vaultAPI } from '@/lib/api';
import { VaultMaterial } from '@/types/api';
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
import { Upload, FileText, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MaterialUploadFormProps {
  lessonPlanId: number;
  material?: VaultMaterial;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const MaterialUploadForm: React.FC<MaterialUploadFormProps> = ({
  lessonPlanId,
  material,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState(material?.title || '');
  const [description, setDescription] = useState(material?.description || '');
  const [materialType, setMaterialType] = useState(material?.material_type || 'pdf');
  const [externalLink, setExternalLink] = useState(material?.external_link || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('vault_lesson_plan', lessonPlanId.toString());
      formData.append('title', title);
      formData.append('description', description);
      formData.append('material_type', materialType);
      
      if (externalLink) {
        formData.append('external_link', externalLink);
      }
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      if (material) {
        await vaultAPI.updateMaterial(material.id, formData);
      } else {
        await vaultAPI.createMaterial(formData);
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save material');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-12 w-12 text-gray-400" />;
    return <FileText className="h-12 w-12 text-blue-500" />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{material ? 'Edit Material' : 'Upload New Material'}</CardTitle>
          <CardDescription>
            Upload PDFs, documents, images, or add links to videos and other resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter material title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this material"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">Material Type</Label>
            <Select value={materialType} onValueChange={(v) => setMaterialType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="doc">Word Document</SelectItem>
                <SelectItem value="ppt">PowerPoint</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video_link">Video Link</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {materialType === 'video_link' ? (
            <div>
              <Label htmlFor="link">Video Link *</Label>
              <Input
                id="link"
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                required={materialType === 'video_link'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a YouTube, Vimeo, or other video link
              </p>
            </div>
          ) : (
            <div>
              <Label>Upload File {!material && '*'}</Label>
              <div
                className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept={
                    materialType === 'pdf' ? '.pdf' :
                    materialType === 'doc' ? '.doc,.docx' :
                    materialType === 'ppt' ? '.ppt,.pptx' :
                    materialType === 'image' ? 'image/*' :
                    '*'
                  }
                />
                
                <div className="flex flex-col items-center">
                  {getFileIcon()}
                  
                  {selectedFile ? (
                    <div className="mt-4">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Drag and drop your file here, or
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Browse Files
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {material && !selectedFile && (
                <p className="text-xs text-gray-500 mt-2">
                  Current file: {material.file_name || 'Uploaded'}
                </p>
              )}
            </div>
          )}

          {materialType !== 'video_link' && (
            <div>
              <Label htmlFor="external-link">External Link (Optional)</Label>
              <Input
                id="external-link"
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a link to an online version or related resource
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || (!selectedFile && !externalLink && !material)}>
          {loading ? 'Uploading...' : material ? 'Update Material' : 'Upload Material'}
        </Button>
      </div>
    </form>
  );
};
