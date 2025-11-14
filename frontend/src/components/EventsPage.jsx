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
  Search,
  Calendar,
  MapPin,
  Users,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

//categories
  const eventCategories = [
  { id: 1, key: 'Library $Study Spaces', name: "Library & Study Spaces", color: 'bg-blue-100 text-blue-800' },
  { id: 2, key: 'Academic Support', name: "Academic Support", color: 'bg-green-100 text-green-800' },
  { id: 3, key: 'Career Services', name: "Career Services", color: 'bg-purple-100 text-purple-800' },
  { id: 4, key: 'Health & Wellness', name: "Health & Wellness", color: 'bg-yellow-100 text-yellow-800' },
  { id: 5, key: 'IT Services', name: "IT Services", color: 'bg-red-100 text-red-800' }, 
  { id: 6, key: 'Activities', name: "Activities", color: 'bg-pink-100 text-pink-800' },
];

export default function EventsPage() {
  const { user } = useAuth();

  if (!user) {
    throw new Error('EventsPage must be used within an AuthProvider');
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);
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

  // Everyone can create events for simplicity
  const canCreateOrApprove = true;

  // ---------------- Fetch Events ----------------
  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/events');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      toast.error('Failed to fetch events');
    }
  };

  // ---------------- Fetch Registered Events ----------------
  const fetchRegisteredEvents = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/events/registrations/${user.user_id}`
      );
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setRegisteredEvents(data.map((r) => r.event_id));
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  // ---------------- Use Effect ----------------
  useEffect(() => {
    fetchEvents();
    fetchRegisteredEvents();
  }, []);

  // ---------------- Filters ----------------
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || event.category === selectedCategory;
    const matchesStatus =
      user?.role === 'student' ? event.status === 'active' : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ---------------- RSVP ----------------
  const handleRSVP = async (eventId) => {
    try {
      if (registeredEvents.includes(eventId)) {
        // Cancel RSVP
        await fetch(`http://localhost:5000/api/events/${eventId}/rsvp`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.user_id }),
        });
        setRegisteredEvents(registeredEvents.filter((id) => id !== eventId));
        toast.success('RSVP cancelled successfully');
      } else {
        // Register
        await fetch(`http://localhost:5000/api/events/${eventId}/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.user_id }),
        });
        setRegisteredEvents([...registeredEvents, eventId]);
        toast.success('RSVP confirmed!');
      }
    } catch (err) {
      console.error('RSVP error:', err);
      toast.error('Failed to process RSVP');
    }
  };

  // ---------------- Favorite ----------------
  const toggleFavorite = (eventId) => {
    if (favoriteEvents.includes(eventId)) {
      setFavoriteEvents(favoriteEvents.filter((id) => id !== eventId));
      toast.info('Removed from favorites');
    } else {
      setFavoriteEvents([...favoriteEvents, eventId]);
      toast.success('Added to favorites');
    }
  };

  // ---------------- Create Event ----------------
  const handleCreateEvent = async () => {
    const {
      title,
      description,
      date_time,
      end_time,
      location,
      capacity,
      category_id,
      instructor_email,
    } = newEvent;

    if (
      !title ||
      !description ||
      !date_time ||
      !end_time ||
      !location ||
      !capacity ||
      !category_id
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    const event = {
      ...newEvent,
      capacity: parseInt(capacity),
      created_by: user.user_id,
      created_by_name: `${user.first_name} ${user.last_name}`,
      status: user.role === 'student' ? 'pending' : 'active',
      registered_count: 0,
    };

    try {
      const res = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      const savedEvent = await res.json();
      setEvents([savedEvent, ...events]);
      setIsCreateDialogOpen(false);

      // Reset form
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

      toast.success(
        user.role === 'admin'
          ? 'Event created successfully!'
          : 'Event submitted for approval'
      );
    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('Failed to create event');
    }
  };

  // ---------------- Approve & Reject ----------------
  const handleApproveEvent = async (eventId) => {
    try {
      await fetch(`http://localhost:5000/api/events/${eventId}/approve`, {
        method: 'PATCH',
      });
      setEvents(
        events.map((e) =>
          e.event_id === eventId ? { ...e, status: 'active' } : e
        )
      );
      toast.success('Event approved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve event');
    }
  };

  const handleRejectEvent = async (eventId) => {
    try {
      await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
      });
      setEvents(events.filter((e) => e.event_id !== eventId));
      toast.info('Event rejected');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject event');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isEventFull = (event) =>
    event.registered_count && event.registered_count >= event.capacity;

  // ---------------- JSX ----------------
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1>Campus Events</h1>
          <p className="text-muted-foreground">
            Discover and register for upcoming campus events
          </p>
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
                <DialogDescription>
                  Fill in details to create a new event
                </DialogDescription>
              </DialogHeader>

              {/* Form */}
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.date_time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date_time: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.end_time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, end_time: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      value={newEvent.capacity}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, capacity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      className="border rounded-md w-full p-2"
                      value={newEvent.category_id}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, category_id: e.target.value })
                      }
                    >
                      <option value="">Select Category</option>
                      {eventCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="registration"
                    checked={newEvent.registration_required}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        registration_required: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="registration">Registration Required</Label>
                </div>

                <Button onClick={handleCreateEvent} className="w-full">
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search & Filters */}
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
              variant={
                selectedCategory === category.id ? 'default' : 'outline'
              }
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
          const category = eventCategories.find(
            (c) => c.id === event.category
          );
          const isRegistered = registeredEvents.includes(event.event_id);
          const isFavorite = favoriteEvents.includes(event.event_id);
          const isFull = isEventFull(event);

          return (
            <Card
              key={event.event_id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2">
                    {category && (
                      <Badge className={category.color}>{category.name}</Badge>
                    )}
                    {event.status !== 'active' && user.role === 'admin' && (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(event.event_id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isFavorite ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </Button>
                </div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(event.start_datetime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.registered_count || 0} / {event.capacity} registered
                    </span>
                  </div>
                </div>

                {/* Admin Approve/Reject or RSVP */}
                {event.status !== 'active' && user.role === 'admin' ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveEvent(event.event_id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectEvent(event.event_id)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                ) : event.registration_required ? (
                  <Button
                    className="w-full"
                    variant={isRegistered ? 'outline' : 'default'}
                    onClick={() => handleRSVP(event.event_id)}
                    disabled={isFull && !isRegistered}
                  >
                    {isFull && !isRegistered
                      ? 'Event Full'
                      : isRegistered
                      ? 'Cancel RSVP'
                      : 'RSVP Now'}
                  </Button>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center">
                    No Registration Required
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No events found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
}
