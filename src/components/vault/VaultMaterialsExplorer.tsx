import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { vaultAPI } from '@/lib/api';
import { VaultMaterial } from '@/types/api';
import { 
  Files,
  Search,
  Filter,
  Download,
  Eye,
  BookOpen,
  FileText,
  FileImage,
  FileVideo,
  Link as LinkIcon,
  File
} from 'lucide-react';

const VaultMaterialsExplorer = () => {
  const [materials, setMaterials] = useState<VaultMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      // Fetch all materials (no vault_lesson_plan filter)
      const response = await vaultAPI.getMaterials();
      setMaterials(response.data);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    return materials.filter(material => {
      const matchesSearch = 
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || material.material_type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  };

  const handleDownload = async (material: VaultMaterial) => {
    try {
      await vaultAPI.incrementMaterialDownload(material.id);
      // Update local state
      setMaterials(prev => 
        prev.map(mat => 
          mat.id === material.id 
            ? { ...mat, download_count: mat.download_count + 1 }
            : mat
        )
      );
      
      // Open file or external link
      if (material.file_url) {
        window.open(material.file_url, '_blank');
      } else if (material.external_link) {
        window.open(material.external_link, '_blank');
      }
    } catch (error) {
      console.error('Failed to download material:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="w-5 h-5 text-orange-500" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-green-500" />;
      case 'video_link':
        return <FileVideo className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredMaterials = filterMaterials();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Files className="w-6 h-6" />
          Course Materials Library
        </h2>
        <p className="text-gray-600 mt-1">
          Browse and download PDFs, documents, presentations, and other teaching materials
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search materials by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex gap-4 items-center">
            <Filter className="w-4 h-4 text-gray-400" />
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Material Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF Documents</SelectItem>
                <SelectItem value="doc">Word Documents</SelectItem>
                <SelectItem value="ppt">Presentations</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video_link">Video Links</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {(typeFilter !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('all');
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
          {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex gap-2">
          <Badge variant="outline">
            {materials.filter(m => m.material_type === 'pdf').length} PDFs
          </Badge>
          <Badge variant="outline">
            {materials.filter(m => m.material_type === 'doc' || m.material_type === 'docx').length} Docs
          </Badge>
          <Badge variant="outline">
            {materials.filter(m => m.material_type === 'ppt' || m.material_type === 'pptx').length} Presentations
          </Badge>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading materials...</p>
          </CardContent>
        </Card>
      ) : filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Files className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Materials Found</h3>
            <p className="text-gray-600">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No materials available in the vault yet'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  {getMaterialIcon(material.material_type)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{material.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {material.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Metadata */}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    {material.material_type_display}
                  </Badge>
                  {material.file_size > 0 && (
                    <Badge variant="outline">
                      {formatFileSize(material.file_size)}
                    </Badge>
                  )}
                  {material.external_link && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      Link
                    </Badge>
                  )}
                </div>

                {/* Lesson Plan Info */}
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium truncate">{material.vault_lesson_plan_title}</span>
                  </div>
                  <p className="text-xs mt-1">
                    {material.vault_lesson_plan_subject} • {material.vault_lesson_plan_grade}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                  <Download className="w-4 h-4" />
                  <span>{material.download_count} download{material.download_count !== 1 ? 's' : ''}</span>
                </div>

                {/* Actions */}
                <Button 
                  className="w-full"
                  onClick={() => handleDownload(material)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {material.external_link ? 'Open Link' : 'Download'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VaultMaterialsExplorer;
