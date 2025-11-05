import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Search,
  Plus,
  Pin,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  Heart,
} from 'lucide-react';
import { sampleAnnouncements } from '../types/announcements';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [filterMine, setFilterMine] = useState(false);

  const [announcements, setAnnouncements] = useState(
    sampleAnnouncements.map((a) => ({ ...a, status: 'approved' }))
  );

  const [favoriteAnnouncements, setFavoriteAnnouncements] = useState(() => {
    try {
      const saved = localStorage.getItem('favorite_announcement_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
    expiry_date: '',
  });

  const canCreate = ['faculty', 'admin'].includes(user?.role || '');

  // ---- Create ----
  const handleCreateAnnouncement = () => {
  const { title, content, priority, expiry_date } = newAnnouncement;

  // Validate all fields are filled
  if (!title || !content || !priority || !expiry_date) {
    toast.error('Please fill in all fields');
    return;
  }

  const announcement = {
    id: Math.random().toString(36).substr(2, 9),
    ...newAnnouncement,
    created_by: user?.id || '',
    created_by_name: user?.name,
    created_date: new Date().toISOString(),
    is_active: true,
    is_pinned: false,
    status:
      user?.role === 'faculty' || user?.role === 'admin'
        ? 'approved'
        : 'pending',
  };

  setAnnouncements([announcement, ...announcements]);
  setIsCreateDialogOpen(false);
  setNewAnnouncement({
    title: '',
    content: '',
    priority: 'medium',
    expiry_date: '',
  });

  toast.success(
    user?.role === 'faculty' || user?.role === 'admin'
      ? 'Announcement published successfully!'
      : 'Announcement submitted for approval.'
  );
};


  // ---- Approve ----
  const handleApprove = (id) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' } : a))
    );
    toast.success('Announcement approved successfully!');
  };

  // ---- Favorite ----
  const toggleFavorite = (announcementId) => {
    let next;
    if (favoriteAnnouncements.includes(announcementId)) {
      next = favoriteAnnouncements.filter((id) => id !== announcementId);
      toast.info('Removed from favorites');
    } else {
      next = [...favoriteAnnouncements, announcementId];
      toast.success('Added to favorites');
    }
    setFavoriteAnnouncements(next);
    try {
      localStorage.setItem('favorite_announcement_ids', JSON.stringify(next));
    } catch {}
  };


  // ---- Priority helpers ----
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-blue-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ---- Filter and Sort ----
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      searchQuery === '' ||
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority =
      !selectedPriority || announcement.priority === selectedPriority;

    const matchesStatus =
      user?.role === 'student'
        ? announcement.status === 'approved'
        : true;

    const matchesOwner = filterMine
      ? announcement.created_by === user?.id
      : true;

    return matchesSearch && matchesPriority && matchesStatus && matchesOwner && announcement.is_active;
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
  });

  // ---- UI ----
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1>Announcements</h1>
          <p className="text-muted-foreground">
            Stay updated with important campus announcements
          </p>
        </div>

        {canCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Share important information with the campus community
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Library Hours Extended"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newAnnouncement.content}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        content: e.target.value,
                      })
                    }
                    placeholder="Announcement details..."
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newAnnouncement.priority}
                      onValueChange={(value) =>
                        setNewAnnouncement({
                          ...newAnnouncement,
                          priority: value,
                        })
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                    <Input
                      id="expiry"
                      type="datetime-local"
                      value={newAnnouncement.expiry_date}
                      onChange={(e) =>
                        setNewAnnouncement({
                          ...newAnnouncement,
                          expiry_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleCreateAnnouncement} className="w-full">
                  Publish Announcement
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedPriority === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPriority(null)}
          >
            All Priorities
          </Button>
          {['urgent', 'high', 'medium', 'low'].map((p) => (
            <Button
              key={p}
              variant={selectedPriority === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPriority(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
          {user?.role !== 'student' && (
            <Button
              variant={filterMine ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMine(!filterMine)}
            >
              My Announcements
            </Button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {sortedAnnouncements.map((announcement) => {
          const isFavorite = favoriteAnnouncements.includes(announcement.id);
          return (
            <Card
              key={announcement.id}
              className={announcement.is_pinned ? 'border-primary' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {announcement.is_pinned && (
                        <Pin className="h-4 w-4 text-primary" />
                      )}
                      <CardTitle className="text-lg">
                        {announcement.title}
                      </CardTitle>
                      {announcement.status === 'pending' && (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-500 text-white"
                        >
                          Pending Approval
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                      <span>Posted by {announcement.created_by_name}</span>
                      <span>•</span>
                      <span>{formatDate(announcement.created_date)}</span>
                      {announcement.expiry_date && (
                        <>
                          <span>•</span>
                          <span>
                            Expires: {formatDate(announcement.expiry_date)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Badge className={getPriorityColor(announcement.priority)}>
                      <span className="flex items-center gap-1">
                        {getPriorityIcon(announcement.priority)}
                        {announcement.priority.toUpperCase()}
                      </span>
                    </Badge>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(announcement.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isFavorite ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                    </Button>

                    {(user?.role === 'faculty' || user?.role === 'admin') &&
                      announcement.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(announcement.id)}
                        >
                          Approve
                        </Button>
                      )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm">{announcement.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedAnnouncements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No announcements found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
}
