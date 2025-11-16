import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Search, Plus, Info, AlertCircle, AlertTriangle, CheckCircle, Heart,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AnnouncementsEventsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [filterMine, setFilterMine] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
  });

  const [favoriteAnnouncements, setFavoriteAnnouncements] = useState([]);
  const [favoriteObjects, setFavoriteObjects] = useState({});

  const canCreate = user?.role === 'faculty' || user?.role === 'admin';

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/announcements');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setAnnouncements(data);
    } catch {
      toast.error('Failed to fetch announcements');
    }
  };

  useEffect(() => {
    const fetchAnnouncementUsers = async () => {
      const uniqueUserIds = [
        ...new Set(announcements.map(a => a.created_by)),
      ].filter(Boolean);
      const notFetched = uniqueUserIds.filter(id => !userMap[id]);
      if (!notFetched.length) return;
      const promises = notFetched.map(id =>
        fetch(`http://localhost:5000/api/user/${id}`)
          .then(res => (res.ok ? res.json() : null))
          .catch(() => null),
      );
      const results = await Promise.all(promises);
      const newMap = {};
      notFetched.forEach((id, idx) => {
        if (results[idx]) newMap[id] = results[idx];
      });
      setUserMap(curr => ({ ...curr, ...newMap }));
    };
    if (announcements.length > 0) fetchAnnouncementUsers();
  }, [announcements]);

  const fetchFavorites = async () => {
    try {
      if (!user?.user_id) return;
      const res = await fetch(`http://localhost:5000/api/favorites/user/${user.user_id}`);
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      const announcementFavs = data.filter(fav => fav.item_type === 'announcement');
      setFavoriteAnnouncements(announcementFavs.map(fav => fav.item_id));
      const favObjMap = {};
      announcementFavs.forEach(fav => {
        favObjMap[fav.item_id] = fav;
      });
      setFavoriteObjects(favObjMap);
    } catch {
      toast.error('Failed to load favorites');
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (user?.user_id) fetchFavorites();
  }, [user]);

  const handleCreateAnnouncement = async () => {
    const { title, content, priority } = newAnnouncement;
    if (!title || !content || !priority) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAnnouncement, created_by: user.user_id }),
      });
      if (!res.ok) throw new Error('Failed to create announcement');
      const savedAnnouncement = await res.json();
      setAnnouncements(prev => [savedAnnouncement, ...prev]);
      setIsCreateDialogOpen(false);
      setNewAnnouncement({ title: '', content: '', priority: 'medium' });
      toast.success('Announcement published!');
    } catch {
      toast.error('Could not create announcement');
    }
  };

  const handleAddFavorite = async (announcementId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          item_type: 'announcement',
          item_id: announcementId,
        }),
      });
      if (res.status === 409) {
        toast.info('Already favorited');
      } else if (!res.ok) {
        throw new Error('API error');
      } else {
        toast.success('Added to favorites');
      }
      await fetchFavorites();
    } catch {
      toast.error('Could not favorite item');
    }
  };

  const handleRemoveFavorite = async (announcementId) => {
    try {
      const favObj = favoriteObjects[announcementId];
      if (!favObj) {
        toast.error('Not in favorites');
        return;
      }
      const delRes = await fetch(`http://localhost:5000/api/favorites/${favObj.favorite_id}`, { method: 'DELETE' });
      if (!delRes.ok) throw new Error('API error');
      toast.success('Removed from favorites');
      await fetchFavorites();
    } catch {
      toast.error('Could not remove favorite');
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch =
      searchQuery === '' ||
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = selectedPriority ? announcement.priority === selectedPriority : true;

    const matchesOwner = filterMine ? announcement.created_by === user?.user_id : true;

    // Show only favorites when checkbox is checked
    const matchesFavorite = filterFavorites ? favoriteAnnouncements.includes(announcement.announcement_id) : true;

    const isNotExpired = new Date(announcement.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    return matchesSearch && matchesPriority && matchesOwner && matchesFavorite && isNotExpired;
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1>Announcements</h1>
          <p className="text-muted-foreground">Stay updated with important campus announcements</p>
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
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newAnnouncement.title}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="e.g., Library Hours Extended"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newAnnouncement.content}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    placeholder="Announcement details..."
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <div className="flex flex-wrap gap-2">
                      {['urgent', 'high', 'medium', 'low'].map(p => (
                        <Button
                          key={p}
                          variant={selectedPriority === p ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedPriority(selectedPriority === p ? null : p)}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Button>
                      ))}
                    </div>
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

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Priority Buttons */}
          <Button
            variant={selectedPriority === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPriority(null)}
          >
            All Priorities
          </Button>
          {['urgent', 'high', 'medium', 'low'].map(p => (
            <Button
              key={p}
              variant={selectedPriority === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPriority(selectedPriority === p ? null : p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}

          {/* My Favorites Checkbox */}
          <Label htmlFor="favorites-checkbox" className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="favorites-checkbox"
              type="checkbox"
              checked={filterFavorites}
              onChange={() => setFilterFavorites(!filterFavorites)}
              className="cursor-pointer"
            />
            Show My Favorites Only
          </Label>

          {user?.role === 'admin' && (
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

      <div className="space-y-4">
        {sortedAnnouncements.map(announcement => {
          const poster = userMap[announcement.created_by];
          const isFavorite = favoriteAnnouncements.includes(announcement.announcement_id);
          return (
            <Card key={announcement.announcement_id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                      <span>
                        Posted by {poster ? `${poster.first_name} ${poster.last_name}` : announcement.created_by}
                      </span>
                      <span>•</span>
                      <span>{formatDate(announcement.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge className={getPriorityColor(announcement.priority)}>
                      <span className="flex items-center gap-1">
                        {getPriorityIcon(announcement.priority)}
                        {announcement.priority.toUpperCase()}
                      </span>
                    </Badge>
                  </div>
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      isFavorite
                        ? handleRemoveFavorite(announcement.announcement_id)
                        : handleAddFavorite(announcement.announcement_id)
                    }
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={24} fill={isFavorite ? 'red' : 'none'} stroke={isFavorite ? 'red' : 'gray'} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{announcement.content}</p>
              </CardContent>
            </Card>
          );
        })}
        {sortedAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No announcements found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
