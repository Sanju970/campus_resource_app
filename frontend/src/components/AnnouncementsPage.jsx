import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import {
  Search, Plus, Info, AlertTriangle, CheckCircle, Heart, Pencil, Trash,
} from 'lucide-react';
import { toast } from 'sonner';
import api from "../api/api";

const ORG_CREATOR_ROLES = [
  'coordinator',
  'event_manager',
  'lead_faculty',
  'admin_delegate',
];

export default function AnnouncementsEventsPage() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [filterMine, setFilterMine] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [orgMap, setOrgMap] = useState({});
  const [myCreatorOrgs, setMyCreatorOrgs] = useState([]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
    org_id: null,
  });

  const [favoriteAnnouncements, setFavoriteAnnouncements] = useState([]);
  const [favoriteObjects, setFavoriteObjects] = useState({});

  // Permission to create announcement
  const canCreate = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return myCreatorOrgs.length > 0;
  }, [user, myCreatorOrgs]);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      toast.error('Failed to fetch announcements');
    }
  };

  // Fetch users who created announcements
  useEffect(() => {
    const fetchAnnouncementUsers = async () => {
      const uniqueUserIds = [...new Set(announcements.map(a => a.created_by))].filter(Boolean);
      const notFetched = uniqueUserIds.filter(id => !userMap[id]);
      if (!notFetched.length) return;

      const promises = notFetched.map(id =>
        api.get(`/user/${id}`)
          .then(res => res.data)
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
  }, [announcements, userMap]);

  // Fetch organizations with current user's org roles
  const fetchOrganizations = async () => {
    if (!user?.user_id) return;
    try {
      const res = await api.get(`/organizations`, { params: { user_id: user.user_id } })
      const data = res.data;

      const map = {};
      data.forEach(org => {
        map[org.id] = org;
      });
      setOrgMap(map);

      // Orgs where user can create announcements
      const creatorOrgs = data.filter(org =>
        org.current_org_role && ORG_CREATOR_ROLES.includes(org.current_org_role)
      );
      setMyCreatorOrgs(creatorOrgs);
    } catch {
      toast.error('Failed to load organizations');
    }
  };

  // Fetch favorites for user
  const fetchFavorites = async () => {
    try {
      if (!user?.user_id) return;
      const res = await api.get(`/favorites/user/${user.user_id}`);
      const data = res.data;
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

  // Initial fetch calls
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (user?.user_id) {
      fetchFavorites();
      fetchOrganizations();
    }
  }, [user]);

  // Reset announcement form
  const resetAnnouncementForm = () => {
    setNewAnnouncement({
      title: '',
      content: '',
      priority: 'medium',
      org_id: myCreatorOrgs.length === 1 ? myCreatorOrgs[0].id : null,
    });
  };

  // Create new announcement
  const handleCreateAnnouncement = async () => {
    const { title, content, priority, org_id } = newAnnouncement;
    if (!title || !content || !priority || !org_id) {
      toast.error('Please fill in all required fields, including organization');
      return;
    }
    if (!user?.user_id) {
      toast.error('User not found in session');
      return;
    }

    try {
      const res = await api.post('/announcements', {
          title, content, priority, created_by: user.user_id, org_id,
      });
      const savedAnnouncement = res.data;
      setAnnouncements(prev => [savedAnnouncement, ...prev]);
      setIsCreateDialogOpen(false);
      resetAnnouncementForm();
      toast.success('Announcement published!');
    } catch {
      toast.error('Could not create announcement');
    }
  };

  // Edit announcement: open dialog and set form defaults
  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setIsCreateDialogOpen(true);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      org_id: announcement.org_id,
    });
  };

  // Update announcement
  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;
    const { title, content, priority, org_id } = newAnnouncement;
    if (!title || !content || !priority || !org_id) {
      toast.error('Please fill in all required fields, including organization');
      return;
    }
    try {
      const res = await api.patch(`/announcements/${editingAnnouncement.announcement_id}`, { title, content, priority, org_id });
      setAnnouncements(prev =>
        prev.map(a => a.announcement_id === editingAnnouncement.announcement_id
          ? { ...a, title, content, priority, org_id } : a));
      setEditingAnnouncement(null);
      setIsCreateDialogOpen(false);
      resetAnnouncementForm();
      toast.success('Announcement updated!');
    } catch {
      toast.error('Could not update announcement');
    }
  };

  // Favorites handlers
  const handleAddFavorite = async (announcementId) => {
    try {
      if (!user?.user_id) {
        toast.error('User not found');
        return;
      }
      const res = await api.post('/favorites', {
          user_id: user.user_id,
          item_type: 'announcement',
          item_id: announcementId,
      });
      if (res.status === 409) {
        toast.info('Already favorited');
      } else if (res.status !== 200 && res.status !== 201) {
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
      await api.delete(`/favorites/${favObj.favorite_id}`);
      toast.success('Removed from favorites');
      await fetchFavorites();
    } catch {
      toast.error('Could not remove favorite');
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      await api.delete(`/announcements/${announcementId}`);
      setAnnouncements(prev => prev.filter(a => a.announcement_id !== announcementId));
      toast.success('Announcement deleted');
    } catch {
      toast.error('Could not delete announcement');
    }
  };

  // UI helpers
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-700" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      case 'urgent': return 'bg-red-700 text-white';
      default: return 'bg-gray-500 text-white';
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

  // Filtering announcements by search, priority, and mine
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      searchQuery === '' ||
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = selectedPriority ? announcement.priority === selectedPriority : true;

    const matchesMine = filterMine ? announcement.created_by === user?.user_id : true;

    return matchesSearch && matchesPriority && matchesMine;
  });

  // Sort by newest
  const sortedAnnouncements = [...filteredAnnouncements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="space-y-1 flex-1">
          <h1 className="text-2xl font-semibold">Announcements</h1>
          <p className="text-muted-foreground">Stay updated with important campus announcements</p>
        </div>

        {canCreate && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) {
                setEditingAnnouncement(null);
                resetAnnouncementForm();
              } else if (!editingAnnouncement && myCreatorOrgs.length === 1) {
                setNewAnnouncement(prev => ({
                  ...prev,
                  org_id: myCreatorOrgs[0].id,
                }));
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {/* Organization */}
                <div className="space-y-2">
                  <Label htmlFor="org">Organization</Label>
                  <select
                    id="org"
                    className="border rounded-md px-3 py-2 w-full bg-background"
                    value={newAnnouncement.org_id ?? ''}
                    onChange={(e) =>
                      setNewAnnouncement({
                        ...newAnnouncement,
                        org_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">Select organization</option>
                    {user?.role === 'admin' &&
                      Object.values(orgMap).map(org => (
                        <option key={org.id} value={org.id}>
                          {org.title}
                        </option>
                      ))}
                    {user?.role !== 'admin' &&
                      myCreatorOrgs.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.title} ({org.current_org_role})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="e.g., Library Hours Extended"
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    placeholder="Announcement details..."
                    rows={5}
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="priority">Priority</Label>
                  <div className="flex flex-wrap gap-2">
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <Button
                        key={p}
                        variant={newAnnouncement.priority === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewAnnouncement({ ...newAnnouncement, priority: p })}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
                  className="w-full mt-6"
                >
                  {editingAnnouncement ? 'Update Announcement' : 'Publish Announcement'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search bar */}
      <div className="relative w-full mb-4 mx-auto md:mx-0 max-w-full md:max-w-none">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search announcements..."
          className="w-full pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 pb-6 border-b justify-start">
        <Button
          variant={filterMine ? 'outline' : 'default'}
          size="sm"
          onClick={() => setFilterMine(false)}
        >
          All Announcements
        </Button>
        <Button
          variant={filterMine ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterMine(true)}
        >
          My Announcements
        </Button>

        {['high', 'medium', 'low', 'urgent'].map((p) => (
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

      {/* Announcements List */}
      <div className="space-y-5">
        {sortedAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No announcements found matching your criteria.</p>
          </div>
        )}
        {sortedAnnouncements.map((announcement) => {
          const poster = userMap[announcement.created_by];
          const org = orgMap[announcement.org_id];
          const isFavorite = favoriteAnnouncements.includes(announcement.announcement_id);

          const isAdminPoster =
            user?.role === 'admin' && announcement.created_by === user.user_id;

          const isOrgCreator =
            user &&
            announcement.org_id &&
            myCreatorOrgs.some(orgRole => orgRole.id === announcement.org_id) &&
            announcement.created_by === user.user_id;

          const canEditDelete = isAdminPoster || isOrgCreator;

          return (
            <Card key={announcement.announcement_id} className="shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CardTitle className="text-lg truncate">{announcement.title}</CardTitle>
                      <Badge className={getPriorityColor(announcement.priority)}>
                        <span className="flex items-center gap-1">
                          {getPriorityIcon(announcement.priority)}
                          {announcement.priority.toUpperCase()}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                      <span>
                        Posted by{' '}
                        {org ? org.title : 'Unknown Organization'} (
                        {poster ? `${poster.first_name} ${poster.last_name}` : announcement.created_by}
                        )
                      </span>
                      <span>•</span>
                      <span>{formatDate(announcement.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
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
                      <Heart size={22} fill={isFavorite ? 'red' : 'none'} stroke={isFavorite ? 'red' : 'gray'} />
                    </div>
                    {canEditDelete && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="p-2"
                          onClick={() => handleEditAnnouncement(announcement)}
                          title="Edit announcement"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="p-2"
                          onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                          title="Delete announcement"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base mt-1 mb-2 whitespace-pre-line">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
