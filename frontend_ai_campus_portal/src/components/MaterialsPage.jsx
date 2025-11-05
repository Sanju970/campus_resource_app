import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Search,
  Download,
  FileText,
  Video,
  Link as LinkIcon,
  Presentation,
  Database,
  Heart,
  Upload,
} from 'lucide-react';
import {
  sampleMaterials,
  materialCategories,
} from '../types/materials';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';

export default function MaterialsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('favorite_material_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem('favorite_material_ids', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const [materials, setMaterials] = useState(sampleMaterials);

  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    category_id: '',
    resource_type: 'document',
    file: null,
  });

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      searchQuery === '' ||
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || material.category_id === selectedCategory;
    const matchesType = !selectedType || material.resource_type === selectedType;

    return matchesSearch && matchesCategory && matchesType && material.is_active;
  });

  const handleDownload = (material) => {
    toast.success(`Downloading ${material.title}...`);
  };

  const toggleFavorite = (materialId) => {
    if (favorites.includes(materialId)) {
      setFavorites(favorites.filter((id) => id !== materialId));
      toast.info('Removed from favorites');
    } else {
      setFavorites([...favorites, materialId]);
      toast.success('Added to favorites');
    }
  };

  const handleUploadMaterial = () => {
    if (!newMaterial.title || !newMaterial.category_id) {
      toast.error('Please fill in required fields');
      return;
    }

    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      title: newMaterial.title,
      description: newMaterial.description,
      category_id: newMaterial.category_id,
      resource_type: newMaterial.resource_type,
      file_size: newMaterial.file ? newMaterial.file.size : undefined,
      download_count: 0,
      created_by_name: user?.name || 'Faculty',
      created_by: user?.id || '',
      created_date: new Date().toISOString(),
      is_active: true,
    };
    setMaterials([newEntry, ...materials]);
    setIsUploadDialogOpen(false);
    setNewMaterial({
      title: '',
      description: '',
      category_id: '',
      resource_type: 'document',
      file: null,
    });
    toast.success('Material uploaded successfully!');
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'link':
        return <LinkIcon className="h-5 w-5" />;
      case 'presentation':
        return <Presentation className="h-5 w-5" />;
      case 'dataset':
        return <Database className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
  };
  const resourceTypes = [
    { id: 'document', name: 'Documents' },
    { id: 'video', name: 'Videos' },
    { id: 'presentation', name: 'Presentations' },
    { id: 'dataset', name: 'Datasets' },
    { id: 'link', name: 'Links' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1>Learning Materials</h1>
          <p className="text-muted-foreground">
            Access course materials, videos, and educational resources
          </p>
        </div>

        {/* Upload Button for Faculty/Admin */}
        {isFaculty && (
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload New Material</DialogTitle>
                <DialogDescription>
                  Add new learning resources for students
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newMaterial.title}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, title: e.target.value })
                    }
                    placeholder="e.g., Linear Algebra Notes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newMaterial.description}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, description: e.target.value })
                    }
                    placeholder="Brief description of the material"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newMaterial.category_id}
                      onValueChange={(value) =>
                        setNewMaterial({ ...newMaterial, category_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resource Type</Label>
                    <Select
                      value={newMaterial.resource_type}
                      onValueChange={(value) =>
                        setNewMaterial({ ...newMaterial, resource_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) =>
                      setNewMaterial({
                        ...newMaterial,
                        file: e.target.files?.[0] || null,
                      })
                    }
                  />
                </div>

                <Button onClick={handleUploadMaterial} className="w-full">
                  Upload
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div>
          <h3 className="mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {materialCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3">Resource Type</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              All Types
            </Button>
            {resourceTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedType === type.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type.id)}
              >
                {type.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMaterials.map((material) => {
          const isFavorite = favorites.includes(material.id);

          return (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 text-primary">
                      {getResourceIcon(material.resource_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{material.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {material.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(material.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isFavorite ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary" className="capitalize">
                    {material.resource_type}
                  </Badge>
                  {material.file_size && (
                    <Badge variant="outline">
                      {formatFileSize(material.file_size)}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    {material.download_count}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Uploaded by {material.created_by_name}</p>
                  <p>{new Date(material.created_date).toLocaleDateString()}</p>
                </div>

                <Button className="w-full" onClick={() => handleDownload(material)}>
                  <Download className="h-4 w-4 mr-2" />
                  {material.resource_type === 'link' ? 'Open Link' : 'Download'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No materials found matching your criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
              setSelectedType(null);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}