import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, BookOpen, GraduationCap, Briefcase, Heart, Laptop, Calendar } from 'lucide-react';
import ResourceCard from './ResourceCard';
import { campusResources, resourceCategories } from '../types/resources';

const iconMap = {
  BookOpen,
  GraduationCap,
  Briefcase,
  Heart,
  Laptop,
  Calendar,
};

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredResources = campusResources.filter((resource) => {
    const matchesSearch =
      searchQuery === '' ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (resource.tags && resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = !selectedCategory || resource.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1>Campus Resources</h1>
        <p className="text-muted-foreground">
          Find everything you need to succeed on campus. Use the AI assistant for personalized help.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search resources, services, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filters */}
      <div className="space-y-4">
        <h3>Categories</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Resources
          </Button>
          {resourceCategories.map((category) => {
            const Icon = iconMap[category.icon];
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'}
          {selectedCategory && (
            <Badge variant="secondary" className="ml-2">
              {resourceCategories.find((c) => c.id === selectedCategory)?.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No resources found matching your criteria.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t">
        <div className="text-center space-y-1">
          <div className="text-3xl">{campusResources.length}</div>
          <div className="text-sm text-muted-foreground">Total Resources</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-3xl">{resourceCategories.length}</div>
          <div className="text-sm text-muted-foreground">Categories</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-3xl">24/7</div>
          <div className="text-sm text-muted-foreground">AI Support</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-3xl">Free</div>
          <div className="text-sm text-muted-foreground">For All Students</div>
        </div>
      </div>
    </div>
  );
}
