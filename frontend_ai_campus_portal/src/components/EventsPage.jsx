import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Calendar, MapPin, Users, Plus, CheckCircle, XCircle, Clock, Heart } from 'lucide-react';
import { sampleEvents, eventCategories } from '../types/events';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function EventsPage() {
  const { user } = useAuth();

  if (!user) {
    throw new Error('EventsPage must be used within an AuthProvider');
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [events, setEvents] = useState(sampleEvents);
  const [registeredEvents, setRegisteredEvents] = useState(['1', '2']);
  const [favoriteEvents, setFavoriteEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('favorite_event_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date_time: '',
    end_time: '',
    location: '',
    capacity: '',
    category_id: '',
    registration_required: false,
    instructor_email: '',
  });

  // Everyone can create events
  const canCreateOrApprove = true;

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || event.category_id === selectedCategory;
    const matchesStatus = user?.role === 'student' ? event.is_active : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleRSVP = (eventId) => {
    if (registeredEvents.includes(eventId)) {
      setRegisteredEvents(registeredEvents.filter(id => id !== eventId));
      toast.success('RSVP cancelled successfully');
    } else {
      setRegisteredEvents([...registeredEvents, eventId]);
      toast.success('RSVP confirmed! Check your notifications for details.');
    }
  };

  const toggleFavorite = (eventId) => {
    let next;
    if (favoriteEvents.includes(eventId)) {
      next = favoriteEvents.filter((id) => id !== eventId);
      toast.info('Removed from favorites');
    } else {
      next = [...favoriteEvents, eventId];
      toast.success('Added to favorites');
    }
    setFavoriteEvents(next);
    try {
      localStorage.setItem('favorite_event_ids', JSON.stringify(next));
    } catch {}
  };


  const handleCreateEvent = () => {
    const { title, description, date_time, end_time, location, capacity, category_id, instructor_email } = newEvent;

    // Validate required fields
    if (!title || !description || !date_time || !end_time || !location || !capacity || !category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Students must provide instructor email
    if (user?.role === 'student' && !instructor_email) {
      toast.error('Instructor email is required for student-created events');
      return;
    }

    const event = {
      id: Math.random().toString(36).substr(2, 9),
      ...newEvent,
      capacity: parseInt(newEvent.capacity),
      created_by: user?.id || '',
      created_by_name: user?.name,
      created_date: new Date().toISOString(),
      is_active: user?.role === 'admin', 
      registered_count: 0,
    };

    setEvents([event, ...events]);
    setIsCreateDialogOpen(false);
    setNewEvent({
      title: '',
      description: '',
      date_time: '',
      end_time: '',
      location: '',
      capacity: '',
      category_id: '',
      registration_required: false,
      instructor_email: '',
    });

    toast.success(user?.role === 'admin' ? 'Event created and published!' : 'Event submitted for approval');
  };

  const handleApproveEvent = (eventId) => {
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, is_active: true } : event
    ));
    toast.success('Event approved and published');
  };

  const handleRejectEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
    toast.info('Event rejected');
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEventFull = (event) => {
    return event.registered_count && event.registered_count >= event.capacity;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1>Campus Events</h1>
          <p className="text-muted-foreground">Discover and register for upcoming campus events</p>
        </div>
        {canCreateOrApprove && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>Fill in all required details to create a new campus event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g., Career Fair 2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_time">Start Date & Time</Label>
                    <Input
                      id="date_time"
                      type="datetime-local"
                      value={newEvent.date_time}
                      onChange={(e) => setNewEvent({ ...newEvent, date_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Date & Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="e.g., Student Union, Main Hall"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newEvent.capacity}
                      onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newEvent.category_id}
                      onValueChange={(value) => setNewEvent({ ...newEvent, category_id: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Instructor Email for students */}
                {user?.role === 'student' && (
                  <div className="space-y-2">
                    <Label htmlFor="instructor_email">Instructor Email</Label>
                    <Input
                      id="instructor_email"
                      type="email"
                      value={newEvent.instructor_email}
                      onChange={(e) => setNewEvent({ ...newEvent, instructor_email: e.target.value })}
                      placeholder="Instructor email for approval"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="registration"
                    checked={newEvent.registration_required}
                    onChange={(e) => setNewEvent({ ...newEvent, registration_required: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="registration">Registration Required</Label>
                </div>

                <Button onClick={handleCreateEvent} className="w-full">Create Event</Button>
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
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Events
          </Button>
          {eventCategories.map((category) => (
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

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const category = eventCategories.find(c => c.id === event.category_id);
          const isRegistered = registeredEvents.includes(event.id);
          const isFull = isEventFull(event);
          const isFavorite = favoriteEvents.includes(event.id);
          
          return (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2">
                    {category && <Badge className={category.color}>{category.name}</Badge>}
                    {!event.is_active && canCreateOrApprove && <Badge variant="outline">Pending Approval</Badge>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => toggleFavorite(event.id)}>
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(event.date_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{event.registered_count || 0} / {event.capacity} registered</span>
                  </div>
                  {event.created_by_name && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">By {event.created_by_name}</span>
                    </div>
                  )}
                  {event.instructor_email && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Instructor: {event.instructor_email}</span>
                    </div>
                  )}
                </div>

                {!event.is_active && canCreateOrApprove ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApproveEvent(event.id)} className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRejectEvent(event.id)} className="flex-1">
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                ) : event.registration_required ? (
                  <Button className="w-full" variant={isRegistered ? 'outline' : 'default'} onClick={() => handleRSVP(event.id)} disabled={isFull && !isRegistered}>
                    {isFull && !isRegistered ? 'Event Full' : isRegistered ? 'Cancel RSVP' : 'RSVP Now'}
                  </Button>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center">No Registration Required</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No events found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
