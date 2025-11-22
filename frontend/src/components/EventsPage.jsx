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
  const [organizations, setOrganizations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showCreatedEventsOnly, setShowCreatedEventsOnly] = useState(false);
  const [showRegisteredEventsOnly, setShowRegisteredEventsOnly] =
    useState(false);

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
    organization_id: '', 
    registration_required: false,
    members_only: false, 
    instructor_email: '',
  });

  // helper to format current time for <input type="date" /> min
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

    const PRIVILEGED_ORG_ROLES = [
    'admin_delegate',
    'lead_faculty',
    'coordinator',
    'event_manager',
  ];

const canCreateOrApprove =
  user.role === 'admin' ||
  organizations.some(
  (org) => PRIVILEGED_ORG_ROLES.includes(org?.current_org_role)
);
// Organizations where this user is allowed to create events
const eligibleOrganizations = organizations.filter((org) =>
  PRIVILEGED_ORG_ROLES.includes(org?.current_org_role)
);


  // ---------------- Fetch Events ----------------
  const fetchEvents = async () => {
    try {
        const res = await fetch(
          `http://localhost:5000/api/events?user_id=${user.user_id}`
        );
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        toast.error('Failed to fetch events');
      }
  };

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
  // ---------------- Fetch Favorite Events from backend ----------------
const fetchFavoriteEvents = async () => {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/favorites/user/${user.user_id}`
    );

    // keep only favorites where item_type = 'event'
    const favEventIds = res.data
      .filter((fav) => fav.item_type === 'event')
      .map((fav) => Number(fav.item_id));

    setFavoriteEvents(favEventIds);
  } catch (err) {
    console.error('Error fetching favorite events:', err);
  }
};


  useEffect(() => {
    fetchEvents();
    fetchRegisteredEvents();
    fetchFavoriteEvents();
    fetchOrganizations(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();

  const isPastEvent = (event) => {
    if (!event.end_datetime) return false;
    const end = new Date(event.end_datetime);
    return !Number.isNaN(end.getTime()) && end < now;
  };

  // ---------------- Filters ----------------
  const combinedEvents = events;
    // First decide the base list: upcoming/ongoing vs past
  let baseEvents;

  if (showPastEvents) {
    // 🔹 Only past events
    baseEvents = combinedEvents.filter((event) => isPastEvent(event));

    // Role-specific filtering for PAST view
    baseEvents = baseEvents.filter((event) => {
      if (user.role === 'student') {
        // Past events the student registered for
        return registeredEvents.includes(event.event_id);
      }

      if (user.role === 'faculty') {
        // Past events this faculty approved
        return (
          Number(event.approved_by) === Number(user.user_id) &&
          event.status === 'approved'
        );
      }

      // Admin: see all past events
      return true;
    });
  } else {
    // 🔹 Only upcoming/ongoing events
    baseEvents = combinedEvents.filter((event) => !isPastEvent(event));
  }

const filteredEvents = baseEvents.filter((event) => {
  const isCreator = Number(event.created_by) === Number(user.user_id);
  const isRegistered = registeredEvents.includes(event.event_id);

  // 🔹 Find this event's organization and membership
  const eventOrg = organizations.find(
  (org) => Number(org.id) === Number(event.org_id)
  );
  const isOrgMember = eventOrg ? Boolean(eventOrg.is_member) : false;
  const isMembersOnly = Boolean(event.members_only);

  // 🔒 Hide members-only events from non-members (except admin + creator)
  if (
    isMembersOnly &&
    !isOrgMember &&
    !isCreator &&
    user.role !== 'admin'
  ) {
    return false;
  }

  
  // View modes
  if (showCreatedEventsOnly && !isCreator) {
    return false;
  }

  if (showRegisteredEventsOnly && !isRegistered) {
    return false;
  }

  const matchesSearch =
    searchQuery === '' ||
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesCategory =
    !selectedCategory || event.category_id === selectedCategory;

  // We no longer filter by status here
  const matchesStatus = true;

  return matchesSearch && matchesCategory && matchesStatus;
});


// Fetch organizations for the Organization dropdown
const fetchOrganizations = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/organizations', {
      params: { user_id: user.user_id },
    });

    // Backend returns an array of orgs
    setOrganizations(res.data || []);
  } catch (err) {
    console.error('Error fetching organizations:', err);
    toast.error('Failed to load organizations');
  }
};

  // ---------------- RSVP (students + faculty) ----------------
  const handleRSVP = async (eventId) => {
    try {
      const alreadyRegistered = registeredEvents.includes(eventId);
      if (!alreadyRegistered) {
      const event = events.find((e) => e.event_id === eventId);
          if (!event) {
        toast.error('Event not found');
        return;
      }
      const currentCount = event.registered_count || 0;
      const capacity = event.capacity || 0;
      if (capacity && currentCount >= capacity) {
        toast.error('This event is full. You cannot register.');
        return;
      }
    }
      let res;

      if (registeredEvents.includes(eventId)) {
        // Cancel RSVP
        res = await fetch(`http://localhost:5000/api/events/${eventId}/rsvp`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.user_id }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to cancel RSVP');
        }

        const data = await res.json();

        setRegisteredEvents((prev) => prev.filter((id) => id !== eventId));

        setEvents((prev) =>
          prev.map((e) =>
            e.event_id === eventId
              ? { ...e, registered_count: data.registered_count }
              : e
          )
        );

        toast.success('RSVP cancelled successfully');
      } else {
        // Register
        res = await fetch(`http://localhost:5000/api/events/${eventId}/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.user_id }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to register');
        }

        const data = await res.json();

        setRegisteredEvents((prev) => [...prev, eventId]);

        setEvents((prev) =>
          prev.map((e) =>
            e.event_id === eventId
              ? { ...e, registered_count: data.registered_count }
              : e
          )
        );

        toast.success('RSVP confirmed!');
      }
    } catch (err) {
      console.error('RSVP error:', err);
      toast.error(err.message || 'Failed to process RSVP');
    }
  };

// ---------------- Favorite (with backend) ----------------
const toggleFavorite = async (eventId) => {
  const isFavorite = favoriteEvents.includes(eventId);

  if (!isFavorite) {
    // ADD to favorites: insert into DB
    try {
      await axios.post('http://localhost:5000/api/favorites', {
        user_id: user.user_id,
        item_type: 'event',
        item_id: eventId,
      });

      setFavoriteEvents((prev) => [...prev, eventId]);
      toast.success('Event added to favorites');
    } catch (err) {
      if (err.response?.status === 409) {
        // duplicate – already exists in DB
        toast.info('Already in favorites');
        if (!favoriteEvents.includes(eventId)) {
          setFavoriteEvents((prev) => [...prev, eventId]);
        }
      } else {
        console.error('Error adding favorite:', err);
        toast.error('Could not add favorite');
      }
    }
  } else {
    // REMOVE from favorites: delete from DB
    try {
      await axios.delete('http://localhost:5000/api/favorites', {
        data: {
          user_id: user.user_id,
          item_type: 'event',
          item_id: eventId,
        },
      });

      setFavoriteEvents((prev) => prev.filter((id) => id !== eventId));
      toast.info('Event removed from favorites');
    } catch (err) {
      console.error('Error removing favorite:', err);
      toast.error('Could not remove favorite');
    }
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

    const startDate = date_time;
    const endDate = end_time;

    const combinedStart =
      startDate && startTime ? `${startDate}T${startTime}` : '';
    const combinedEnd =
      endDate && endTime ? `${endDate}T${endTime}` : '';

      // --- NEW: Per-organization permission check ---
  const privilegedOrgIds = organizations
    .filter((org) => PRIVILEGED_ORG_ROLES.includes(org?.current_org_role))
    .map((org) => org.id);

  if (!newEvent.organization_id) {
    toast.error('Please select an organization for this event');
    return;
  }

  if (!privilegedOrgIds.includes(newEvent.organization_id)) {
    toast.error(
      'You can only create events for organizations where you are coordinator, event manager, lead faculty, or admin delegate.'
    );
    return;
  }

    if (
      !title ||
      !description ||
      !date_time ||
      !end_time ||
      !location ||
      !capacity ||
      !category_id ||
      !startTime ||
      !endTime
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    const capacityNum = parseInt(capacity, 10);

    if (
      Number.isNaN(capacityNum) ||
      capacityNum < 1 ||
      capacityNum > 1000
    ) {
      toast.error('Capacity must be between 1 and 1000');
      return;
    }

    const now = new Date();
    const start = new Date(combinedStart);
    const end = new Date(combinedEnd);

    const event = {
      ...newEvent,
      start_datetime: combinedStart,
      end_datetime: combinedEnd,
      capacity: capacityNum,
      created_by: user.user_id,
      registered_count: 0,
      status: 'approved',
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
      setEvents((prev) => [savedEvent, ...prev]);
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
        members_only: false,
        instructor_email: '',
      });
      setStartTime('');
      setEndTime('');

      toast.success('Event created successfully');

    } catch (err) {
      console.error('Error creating event:', err);
      toast.error(err.message || 'Failed to create event');
    }
  };
  // ---------------- Update Event (admin) ----------------
const handleUpdateEvent = async () => {
  if (!editingEvent) return;

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

  const startDate = date_time;
  const endDate = end_time;

  const combinedStart =
    startDate && startTime ? `${startDate}T${startTime}` : '';
  const combinedEnd =
    endDate && endTime ? `${endDate}T${endTime}` : '';

  if (
    !title ||
    !description ||
    !date_time ||
    !end_time ||
    !location ||
    !capacity ||
    !category_id ||
    !startTime ||
    !endTime
  ) {
    toast.error('Please fill in all required fields');
    return;
  }

  const capacityNum = parseInt(capacity, 10);

  if (Number.isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
    toast.error('Capacity must be between 1 and 1000');
    return;
  }

  const now = new Date();
  const start = new Date(combinedStart);
  const end = new Date(combinedEnd);

  const eventToSend = {
    title,
    description,
    location,
    capacity: capacityNum,
    category_id,
    registration_required: newEvent.registration_required,
    instructor_email,
    start_datetime: combinedStart,
    end_datetime: combinedEnd,
  };

  try {
    const res = await fetch(
      `http://localhost:5000/api/events/${editingEvent.event_id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventToSend),
      }
    );

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || 'Failed to update event');
    }

    const updatedEvent = await res.json();

    setEvents((prev) =>
      prev.map((e) =>
        e.event_id === updatedEvent.event_id ? updatedEvent : e
      )
    );

    // Reset dialog + form
    setEditingEvent(null);
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
    setStartTime('');
    setEndTime('');

    toast.success('Event updated successfully');
  } catch (err) {
    console.error('Update event error:', err);
    toast.error(err.message || 'Failed to update event');
  }
};

// ---------------- Cancel/Delete Event ----------------
const handleCancelEvent = async (eventId) => {
  const eventToCancel = events.find((e) => e.event_id === eventId);
  if (!eventToCancel) return;

  const isCreator =
    Number(eventToCancel.created_by) === Number(user.user_id);
  const isAdmin = user.role === 'admin';

  // ✅ Admin can cancel/delete ANY event
  // ✅ Non-admins can only cancel their own events
  if (!isAdmin && !isCreator) return;

  if (!window.confirm('Are you sure you want to delete/cancel this event?')) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/events/${eventId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.message || 'Failed to cancel event';
      throw new Error(message);
    }

    setEvents((prevEvents) =>
      prevEvents.filter((e) => e.event_id !== eventId)
    );

    // Also remove from registered list if it was there
    setRegisteredEvents((prev) =>
      prev.filter((id) => id !== eventId)
    );

    toast.success('Event deleted/cancelled successfully');
  } catch (err) {
    console.error('Cancel event error:', err);
    toast.error(err.message || 'Failed to cancel event');
  }
};

// ---------------- Admin: open edit dialog ----------------
const handleOpenEditDialog = (event) => {
  const isCreator =
    Number(event.created_by) === Number(user.user_id);
  const isAdmin = user.role === 'admin';

  if (!isAdmin && !isCreator) return;
  // Convert existing datetimes into date + time fields
  const parseDate = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseTime = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  setNewEvent({
    title: event.title || '',
    description: event.description || '',
    date_time: parseDate(event.start_datetime),
    end_time: parseDate(event.end_datetime),
    location: event.location || '',
    capacity: event.capacity || '',
    category_id: event.category_id || '',
    registration_required: !!event.registration_required,
    instructor_email: event.instructor_email || '',
  });

  setStartTime(parseTime(event.start_datetime));
  setEndTime(parseTime(event.end_datetime));

  setEditingEvent(event);
  setIsCreateDialogOpen(true);
};
  // ---------------- Helpers ----------------

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
    // ---------------- Stats for footer ----------------
    const totalEventsCount = combinedEvents.filter((event) => {
    return event.status === 'approved';
  }).length;

  const createdEventsCount = combinedEvents.filter(
    (event) => Number(event.created_by) === Number(user.user_id)
  ).length;

  // "My events" = events I'm registered for AND approved
  const registeredEventsCount = combinedEvents.filter(
    (event) =>
      registeredEvents.includes(event.event_id) &&
      event.status === 'approved'
  ).length;

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
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
                </DialogTitle>
                <DialogDescription>
                  {editingEvent
                  ? 'Update the details of this event'
                  : 'Fill in details to create a new event'}
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
                        setNewEvent({
                          ...newEvent,
                          date_time: e.target.value,
                        })
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
                        setNewEvent({
                          ...newEvent,
                          end_time: e.target.value,
                        })
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
                        setNewEvent({
                          ...newEvent,
                          capacity: e.target.value,
                        })
                      }
                    />
                 <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="registration_required"
                    checked={newEvent.registration_required}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        registration_required: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="registration_required" className="mb-0">
                    Registration Required
                  </Label>
                </div>
              </div>
                {/* RIGHT COLUMN → Organization + Members Only */}
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <select
                      className="border rounded-md w-full p-2"
                      value={newEvent.organization_id || ''}
                      onChange={(e) => {
                        const orgId = e.target.value ? Number(e.target.value) : '';
                        const selectedOrg = organizations.find((org) => org.id === orgId);
                        setNewEvent({
                          ...newEvent,
                          organization_id: orgId,  
                          category_id: selectedOrg ? selectedOrg.category_id : '',
                        });
                      }}
                    >
                      <option value="">Select Organization</option>
                      {eligibleOrganizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.title}
                        </option>
                      ))}
                    </select>
                <div className="flex items-center gap-2">
                  <input
                    id="members_only"
                    type="checkbox"
                    checked={newEvent.members_only}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        members_only: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="members_only" className="mb-0">
                    Members Only
                  </Label>
                </div>  
              </div>
            </div>


                <Button 
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent} className="w-full"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
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
            variant={
              !showCreatedEventsOnly &&
              !showRegisteredEventsOnly &&
              selectedCategory === null &&
              !showPastEvents
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() => {
              setShowCreatedEventsOnly(false);
              setShowRegisteredEventsOnly(false);
              setSelectedCategory(null);
              setShowPastEvents(false); // ✅ back to upcoming dashboard
            }}
          >
            All Events
          </Button>


          {/*Created Events*/}
          <Button
            variant={showCreatedEventsOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowCreatedEventsOnly(true);
              setShowRegisteredEventsOnly(false);
              setSelectedCategory(null);
              setShowPastEvents(false);
            }}
          >
          Created Events
          </Button>

          {/* My Events (registered) */}
          <Button
            variant={showRegisteredEventsOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowRegisteredEventsOnly(true);
              setShowCreatedEventsOnly(false);
              setSelectedCategory(null);
              setShowPastEvents(false);
            }}
          >
            Registered Events
          </Button>
          
          {/* Past Events */}
          <Button
            variant={showPastEvents ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowPastEvents(true);
              setShowCreatedEventsOnly(false);
              setShowRegisteredEventsOnly(false);
              // we keep selectedCategory so they can still filter by category in past view
            }}
          >
            Past Events
          </Button>

          {/* Category filters (only for All Events view visually, but we keep them active) */}
          {user.role !== 'admin' &&
          eventCategories.map((category) => (
            <Button
              key={category.id}
              variant={
                selectedCategory === category.id ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => {
                setSelectedCategory((prev) =>
                  prev === category.id ? null : category.id
                );
              }}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
   
      {/* Events list */}
      {showPastEvents && user.role === 'admin' ? (
        // -------- ADMIN PAST EVENTS: TABLE VIEW --------
        <div className="mt-4 space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Start</th>
                  <th className="px-4 py-2">End</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Reg / Cap</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const category = eventCategories.find(
                    (c) => c.id === event.category_id
                  );

                  return (
                    <tr
                      key={event.event_id}
                      className="border-t hover:bg-muted/50"
                    >
                      <td className="px-4 py-2 font-medium">
                        {event.title}
                      </td>
                      <td className="px-4 py-2">
                        {category ? category.name : '—'}
                      </td>
                      <td className="px-4 py-2">
                        {formatDateTime(event.start_datetime)}
                      </td>
                      <td className="px-4 py-2">
                        {formatDateTime(event.end_datetime)}
                      </td>
                      <td className="px-4 py-2">{event.location}</td>
                      <td className="px-4 py-2">
                        {(event.registered_count || 0)}/{event.capacity || 0}
                      </td>
                      <td className="px-4 py-2 capitalize">
                        {event.status || '—'}
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditDialog(event)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelEvent(event.event_id)}
                        >
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No past events found.
            </div>
          )}
        </div>
      ) : (
        // -------- DEFAULT: CARD GRID (students + faculty + admin for upcoming) --------
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const category = eventCategories.find(
                (c) => c.id === event.category_id
              );
              const isRegistered = registeredEvents.includes(event.event_id);
              const isFavorite = favoriteEvents.includes(event.event_id);
              const isFull = isEventFull(event);
              const isCreator =
                Number(event.created_by) === Number(user.user_id);
              const isApprover =
                Number(event.approved_by) === Number(user.user_id);
              const isAdmin = user.role === 'admin';

              const cardClasses = `overflow-hidden hover:shadow-lg transition-shadow border ${
                isRegistered ? 'border-green-500' : 'border-gray-200'
              }`;
              let statusLabel = '';
              if (isCreator) {
                statusLabel = `You created this event. Status: ${event.status}`;
              }
              return (
                <Card
                  key={event.event_id}
                  className={cardClasses}
                  style={
                    isRegistered ? { backgroundColor: '#ecfdf3' } : undefined
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-wrap gap-2">
                        {category && (
                          <Badge className={category.color}>
                            {category.name}
                          </Badge>
                        )}

                        {isRegistered && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white border border-green-600 shadow-sm">
                            You’re Registered
                          </span>
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

                    {!isCreator && statusLabel && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {statusLabel}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatDateTime(event.start_datetime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {event.registered_count || 0} /{' '}
                          {event.capacity || 0} registered
                        </span>
                      </div>
                    </div>

                    {(isAdmin || isCreator) ? (
                      <div className="w-full space-y-2">
                        <Button
                          size="sm"
                          onClick={() => handleOpenEditDialog(event)}
                          className="w-full"
                        >
                          Edit Event
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelEvent(event.event_id)}
                          className="w-full"
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Cancel Event
                        </Button>
                      </div>
                    ) : event.registration_required ? (
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={isFull}
                        onClick={() => handleRSVP(event.event_id)}
                      >
                        {isRegistered
                          ? 'Cancel RSVP'
                          : isFull
                          ? 'Event Full'
                          : 'RSVP Now'}
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="w-full justify-center"
                      >
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
        </>
      )}   

{/* Quick stats footer */}
<div className="w-full mt-2 border-t pt-4 pb-4">
  <div className="max-w-5xl mx-auto flex justify-between px-10">

    {/* Total Events */}
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="font-semibold" style={{ fontSize: '2rem', lineHeight: '1' }}>
        {totalEventsCount}
      </div>
      <div className="text-base text-muted-foreground mt-1">
        Total Events
      </div>
    </div>

    {/* Events Created */}
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="font-semibold" style={{ fontSize: '2rem', lineHeight: '1' }}>
        {createdEventsCount}
      </div>
      <div className="text-base text-muted-foreground mt-1">
        Events Created
      </div>
    </div>

    {/* Events Registered */}
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="font-semibold" style={{ fontSize: '2rem', lineHeight: '1' }}>
        {registeredEventsCount}
      </div>
      <div className="text-base text-muted-foreground mt-1">
        Events Registered
      </div>
    </div>

  </div>
</div>

    </div>

  );
}
