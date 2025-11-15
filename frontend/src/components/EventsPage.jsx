import { useState, useEffect } from 'react';
import axios from 'axios';
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
  Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// Categories (ids MUST match event_categories + category_id in DB)
const eventCategories = [
  {
    id: 1,
    key: 'Library & Study Spaces',
    name: 'Library & Study Spaces',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 2,
    key: 'Academic Support',
    name: 'Academic Support',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 3,
    key: 'Career Services',
    name: 'Career Services',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    id: 4,
    key: 'Health & Wellness',
    name: 'Health & Wellness',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: 5,
    key: 'IT Services',
    name: 'IT Services',
    color: 'bg-red-100 text-red-800',
  },
  {
    id: 6,
    key: 'Activities',
    name: 'Activities',
    color: 'bg-pink-100 text-pink-800',
  },
];

// 12-hour time options – values stay in "HH:MM" (24h) format
const timeOptions = [
  { value: '00:00', label: '12:00 AM' },
  { value: '01:00', label: '1:00 AM' },
  { value: '02:00', label: '2:00 AM' },
  { value: '03:00', label: '3:00 AM' },
  { value: '04:00', label: '4:00 AM' },
  { value: '05:00', label: '5:00 AM' },
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '23:00', label: '11:00 PM' },
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
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
  // For faculty: events assigned to them for approval
  const [facultyPendingEvents, setFacultyPendingEvents] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');


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

  // helper to format current time for <input type="datetime-local" />
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
};
const [minDateTime] = useState(() => getCurrentDateTimeLocal());


  // You can keep this simple; everyone can create
  const canCreateOrApprove = true;

  // ---------------- Fetch Events ----------------
const fetchEvents = async () => {
  try {
    // 🧑‍🎓 STUDENT (and others that are not faculty)
    if (user.role !== 'faculty') {
      const res = await fetch(
        `http://localhost:5000/api/events?user_id=${user.user_id}`
      );
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setEvents(data);
      return;
    }

    // 👩‍🏫 FACULTY – combine:
    // 1) main events list (approved + own)
    // 2) events pending their approval
    const [allRes, pendingRes] = await Promise.all([
      fetch(
        `http://localhost:5000/api/events?user_id=${user.user_id}`
      ),
      fetch(
        `http://localhost:5000/api/events/faculty/${user.user_id}/pending`
      ),
    ]);

    if (!allRes.ok || !pendingRes.ok) throw new Error('Network error');

    const allEventsData = await allRes.json();
    const pendingEventsData = await pendingRes.json();

    // Merge pending + all, avoiding duplicates by event_id
    const combined = [
      ...pendingEventsData,
      ...allEventsData.filter(
        (e) => !pendingEventsData.some((p) => p.event_id === e.event_id)
      ),
    ];

    setEvents(combined);
  } catch (err) {
    console.error('Error fetching events:', err);
    toast.error('Failed to fetch events');
  }
};

  // ---------------- Fetch events that need this faculty's approval ----------------
  const fetchFacultyPendingEvents = async () => {
    if (user.role !== 'faculty') return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/events/faculty/${user.user_id}/pending`
      );
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setFacultyPendingEvents(data);
    } catch (err) {
      console.error('Error fetching faculty pending events:', err);
      toast.error('Failed to fetch events requiring your approval');
    }
  };

  // ---------------- Fetch Registered Events (all roles) ----------------
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
    fetchFacultyPendingEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Filters ----------------
  // Combine base events for faculty "My Events" view:
  // - events I created (from /api/events)
  // - events needing my approval (from /faculty/:id/pending)
  const combinedEvents = showMyEventsOnly && user.role === 'faculty'
    ? [
        // my created events
        ...events.filter(
          (e) => Number(e.created_by) === Number(user.user_id)
        ),
        // plus pending approvals that weren't already in events[]
        ...facultyPendingEvents.filter(
          (p) => !events.some((e) => e.event_id === p.event_id)
        ),
      ]
    : events;

  const filteredEvents = combinedEvents.filter((event) => {
    const isCreator = Number(event.created_by) === Number(user.user_id);
    const needsMyApproval =
      Number(event.approved_by) === Number(user.user_id) &&
      event.status === 'pending';

    // "My Events" behavior:
    // - Student: only events I created
    // - Faculty: events I created OR events needing my approval
    if (showMyEventsOnly) {
      if (user.role === 'faculty') {
        if (!isCreator && !needsMyApproval) return false;
      } else {
        if (!isCreator) return false;
      }
    }

    const matchesSearch =
      searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || event.category_id === selectedCategory;

    // In All Events view, show only approved events.
    // In My Events view, show all of MY events (any status).
    const matchesStatus = showMyEventsOnly
      ? event.status !== "cancelled"
      : event.status === 'approved';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ---------------- RSVP (students + faculty) ----------------
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


  // ---------------- Favorite (local only) ----------------
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

    const startDate = date_time;  // still using same variable
    const endDate = end_time;

    const combinedStart = startDate && startTime ? `${startDate}T${startTime}` : '';
    const combinedEnd = endDate && endTime ? `${endDate}T${endTime}` : '';

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

    // Capacity range check: 1–1000
  const capacityNum = parseInt(capacity, 10);

  if (
    Number.isNaN(capacityNum) ||
    capacityNum < 1 ||
    capacityNum > 1000
  ) {
    toast.error('Capacity must be between 1 and 1000');
    return;
  };

  // ---- Date/Time Validation ----
  const now = new Date();
  const start = new Date(date_time);
  const end = new Date(end_time);

  if (start < now) {
    toast.error('Start time must be in the future');
    return;
  }
  if (end <= start) {
    toast.error('End time must be after start time');
    return;
  }

  const event = {
    ...newEvent,
    capacity: capacityNum,
    created_by: user.user_id,
    registered_count: 0,
    status: user.role === 'student' ? 'pending' : 'approved',

  };

    try {
      const res = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || 'Failed to create event');
      }

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
      if (user.role === 'student') {
        toast.success('Event submitted for approval');
      } else {
        toast.success('Event created successfully');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      toast.error(err.message || 'Failed to create event');
    }
  };

  // ---------------- Approve & Reject (faculty) ----------------
  const handleApproveEvent = async (eventId) => {
    if (user.role !== 'faculty') return;

    try {
      await fetch(`http://localhost:5000/api/events/${eventId}/approve`, {
        method: 'PATCH',
      });

      // Remove from local list (since it's no longer pending)
      setEvents(events.filter((e) => e.event_id !== eventId));
      toast.success('Event approved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve event');
    }
  };

  const handleRejectEvent = async (eventId) => {
    if (user.role !== 'faculty') return;

    try {
      await fetch(`http://localhost:5000/api/events/${eventId}/reject`, {
        method: 'PATCH',
      });

      // Remove from local list (since it's no longer pending)
      setEvents(events.filter((e) => e.event_id !== eventId));
      toast.info('Event rejected');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject event');
    }
  };

  // ---------------- Cancel Event (creator only) ----------------

  const handleCancelEvent = async (eventId) => {
    // Find the event
    const eventToCancel = events.find((e) => e.event_id === eventId);
    if (!eventToCancel) return;

    // Only the creator AND role = faculty/admin can cancel
    const isCreator =
      Number(eventToCancel.created_by) === Number(user.user_id);
    const isFacultyOrAdmin =
      user.role === 'faculty' || user.role === 'admin';

    if (!isCreator || !isFacultyOrAdmin) return;

    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message || 'Failed to cancel event';
        throw new Error(message);
      }

      // Remove from local state
      setEvents((prevEvents) => prevEvents.filter((e) => e.event_id !== eventId));
      setEvents(events.filter((e) => e.event_id !== eventId));

    toast.info('Event cancelled');
  } catch (err) {
    console.error('Cancel event error:', err);
    toast.error('Failed to cancel event');
  }
};


  const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

  const isEventFull = (event) =>
    event.registered_count && event.capacity
      ? event.registered_count >= event.capacity
      : false;

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
                      setNewEvent({
                        ...newEvent,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newEvent.date_time}
                      min={minDateTime.slice(0, 10)}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date_time: e.target.value })
                      }
                      className="h-9 px-3 py-1 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <select
                      className="border rounded-md w-full p-2"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    >
                      <option value="">Select Time</option>   
                      {timeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input

                      type="date"
                      value={newEvent.end_time}
                      min={minDateTime.slice(0, 10)}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, end_time: e.target.value })
                      }
                      className="h-9 px-3 py-1 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <select
                      className="border rounded-md w-full p-2"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    >
                      <option value="">Select Time</option>   
                      {timeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
                      min={1}
                      max={1000}
                      step={1}
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
                        setNewEvent({
                          ...newEvent,
                          category_id: Number(e.target.value),
                        })
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
        {/* All Events */}
          <Button
            variant={!showMyEventsOnly && selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowMyEventsOnly(false);
              setSelectedCategory(null);
            }}
          >
            All Events
          </Button>

          {/* My Events (only events created by this user) */}
          <Button
            variant={showMyEventsOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowMyEventsOnly(true);
              setSelectedCategory(null); // when switching to My Events, ignore category filter
            }}
          >
            My Events
          </Button>

          {/* Category filters (only for All Events view) */}
          {eventCategories.map((category) => (
            <Button
              key={category.id}
              variant={
                !showMyEventsOnly && selectedCategory === category.id
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              onClick={() => {
                setShowMyEventsOnly(false); // selecting a category goes back to All Events view
                setSelectedCategory(category.id);
              }}
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
            (c) => c.id === event.category_id
          );
          const isRegistered = registeredEvents.includes(event.event_id);
          const isFavorite = favoriteEvents.includes(event.event_id);
          const isFull = isEventFull(event);
          const isCreator = Number(event.created_by) === Number(user.user_id);

          let statusLabel = null;
          if (isCreator) {
            if (event.status === 'pending') {
                // For creator: show department-style wording
                const departmentLabel = category
                  ? `${category.name} department`
                  : 'the department';

                statusLabel = `Sent for approval to ${departmentLabel}`;
              } 
             else if (event.status === 'approved') {
              if (event.approver_uid || event.approver_name) {
                statusLabel = `Approved by ${
                  event.approver_name || event.approver_uid
                }`;
              } else {
                statusLabel = 'Approved';
              }
            } else if (event.status === 'rejected') {
              statusLabel = 'Rejected';
            }
          } else if (event.status && event.status !== 'approved') {
            // For non-creators, we can still show simple status for pending/rejected
            statusLabel = event.status;
          }

          const canApproveThisEvent =
            user.role === 'faculty' &&
            event.status === 'pending' &&
            Number(event.approved_by) === Number(user.user_id);


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
                    {event.status === 'pending' && user.role === 'faculty' && (
                      <Badge variant="outline">Pending Approval</Badge>
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
                      {event.registered_count || 0} / {event.capacity || 0}{' '}
                      registered
                    </span>
                  </div>
                </div>

                {/* Faculty Approve/Reject OR RSVP */}
                {canApproveThisEvent ? (
                  // ---------- FACULTY APPROVE ----------
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
                ) : isCreator && (user.role === 'faculty' || user.role === 'admin') ? (
                  // ---------- CREATOR BADGE ----------
                  <div className="w-full space-y-2">
                  <Badge variant="secondary" className="w-full justify-center">
                    You created this event
                  </Badge>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancelEvent(event.event_id)}
                    className="w-full"
                  >
                    <XCircle className="h-0 w-4 mr-1" /> Cancel Event
                  </Button>
                </div>
                ) : event.registration_required ? (
                // ---------- RSVP for BOTH STUDENT + FACULTY ----------
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
                  // ---------- NO REGISTRATION REQUIRED ----------
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
