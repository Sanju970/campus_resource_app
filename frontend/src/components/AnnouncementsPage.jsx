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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import { Search, Plus, Heart, Info, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnouncementsEventsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [filterMine, setFilterMine] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [favoriteAnnouncements, setFavoriteAnnouncements] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userMap, setUserMap] = useState({}); // user_id -> {first_name, last_name}

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
  });

  const [events, setEvents] = useState([]);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    capacity: '',
    category: '',
    instructor_email: '',
    registration_required: false,
  });

  const canCreate = user?.role === 'faculty' || user?.role === 'admin';

  // Fetch users for announcements in batch
  useEffect(() => {
    const fetchAnnouncementUsers = async () => {
      const uniqueUserIds = [
        ...new Set(announcements.map(a => a.created_by)),
      ].filter(Boolean);

      // Skip if unchanged or already mapped.
      const notFetched = uniqueUserIds.filter(id => !userMap[id]);
      if (notFetched.length === 0) return;

      // Fetch details for each user
      const promises = notFetched.map(id =>
        fetch(`http://localhost:5000/api/user/${id}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );
      const results = await Promise.all(promises);
      // Build new user map
      const newMap = {};
      notFetched.forEach((id, idx) => {
        if (results[idx]) newMap[id] = results[idx];
      });
      setUserMap(current => ({ ...current, ...newMap }));
    };
    if (announcements.length > 0) fetchAnnouncementUsers();
  }, [announcements]);

  // Fetch announcements and events
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/announcements');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      toast.error('Failed to fetch announcements');
    }
  };
  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/events');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      toast.error('Failed to fetch events');
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchEvents();
  }, []);

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
      setAnnouncements([savedAnnouncement, ...announcements]);
      setIsCreateDialogOpen(false);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'medium',
      });
      toast.success('Announcement published successfully!');
    } catch (err) {
      toast.error('Failed to create announcement');
    }
  };

  const toggleFavorite = (announcementId) => {
    if (favoriteAnnouncements.includes(announcementId)) {
      setFavoriteAnnouncements(
        favoriteAnnouncements.filter((id) => id !== announcementId)
      );
      toast.info('Removed from favorites');
    } else {
      setFavoriteAnnouncements([...favoriteAnnouncements, announcementId]);
      toast.success('Added to favorites');
    }
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

  // ---- Filter and Sort Announcements ----
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      searchQuery === '' ||
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority =
      !selectedPriority || announcement.priority === selectedPriority;
    const matchesOwner = filterMine
      ? announcement.created_by === user?.user_id
      : true;
    // Only show announcements less than 24hrs old
    const isNotExpired = new Date(announcement.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    return matchesSearch && matchesPriority && matchesOwner && isNotExpired;
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Events
  const handleCreateEvent = async () => {
    const { title, description, start_datetime, end_datetime, location } = newEvent;
    if (!title || !description || !start_datetime || !end_datetime || !location) {
      toast.error('Please enter required fields');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEvent, created_by: user.user_id }),
      });
      if (!res.ok) throw new Error('Create failed');
      const savedEvent = await res.json();
      setEvents([savedEvent, ...events]);
      setIsCreateEventDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        start_datetime: '',
        end_datetime: '',
        location: '',
        capacity: '',
        category: '',
        instructor_email: '',
        registration_required: false,
      });
      toast.success('Event created!');
    } catch (err) {
      toast.error('Failed to create event');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      {/* Announcement Header & Create */}
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
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
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
                      setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
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
                        setNewAnnouncement({ ...newAnnouncement, priority: value })
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
                </div>
                <Button onClick={handleCreateAnnouncement} className="w-full">
                  Publish Announcement
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcement Search and Filter */}
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

      {/* Announcements List */}
      <div className="space-y-4">
        {sortedAnnouncements.map((announcement) => {
          const isFavorite = favoriteAnnouncements.includes(announcement.announcement_id);
          const poster = userMap[announcement.created_by];
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(announcement.announcement_id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                      />
                    </Button>
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
            <p className="text-muted-foreground">
              No announcements found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Events Section */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1>Events</h1>
            <p className="text-muted-foreground">
              Discover and participate in campus events
            </p>
          </div>
          {canCreate && (
            <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
              {/* <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger> */}
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-title">Title</Label>
                    <Input
                      id="event-title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="e.g., Career Fair 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-description">Description</Label>
                    <Textarea
                      id="event-description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Event details..."
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-location">Location</Label>
                    <Input
                      id="event-location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Venue"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_datetime">Start Date & Time</Label>
                      <Input
                        type="datetime-local"
                        id="start_datetime"
                        value={newEvent.start_datetime}
                        onChange={(e) => setNewEvent({ ...newEvent, start_datetime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_datetime">End Date & Time</Label>
                      <Input
                        type="datetime-local"
                        id="end_datetime"
                        value={newEvent.end_datetime}
                        onChange={(e) => setNewEvent({ ...newEvent, end_datetime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-category">Category</Label>
                    <Input
                      id="event-category"
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      placeholder="Category"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-capacity">Capacity</Label>
                    <Input
                      type="number"
                      id="event-capacity"
                      value={newEvent.capacity}
                      onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                      placeholder="Max Participants"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-instructor">Instructor Email</Label>
                    <Input
                      id="event-instructor"
                      value={newEvent.instructor_email}
                      onChange={(e) => setNewEvent({ ...newEvent, instructor_email: e.target.value })}
                      placeholder="Instructor Email (optional)"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="registration"
                      checked={newEvent.registration_required}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, registration_required: e.target.checked })
                      }
                    />
                    <Label htmlFor="registration">Registration Required</Label>
                  </div>
                  <Button onClick={handleCreateEvent} className="w-full">
                    Publish Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.event_id}>
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{event.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatDate(event.start_datetime)} - {formatDate(event.end_datetime)}</span>
                  <span>•</span>
                  <span>{event.location}</span>
                  <span>•</span>
                  <span>Capacity: {event.capacity}</span>
                  {event.instructor_email && (
                    <>
                      <span>•</span>
                      <span>Instructor: {event.instructor_email}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>Category: {event.category}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {events.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No events found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
