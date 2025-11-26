// src/pages/EventsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Plus,
  CheckCircle,
  XCircle,
  Heart,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

// Categories (ids MUST match event_categories + category_id in DB)
const eventCategories = [
  {
    id: 1,
    key: "Library & Study Spaces",
    name: "Library & Study Spaces",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: 2,
    key: "Academic Support",
    name: "Academic Support",
    color: "bg-green-100 text-green-800",
  },
  {
    id: 3,
    key: "Career Services",
    name: "Career Services",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: 4,
    key: "Health & Wellness",
    name: "Health & Wellness",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: 5,
    key: "IT Services",
    name: "IT Services",
    color: "bg-red-100 text-red-800",
  },
  {
    id: 6,
    key: "Activities",
    name: "Activities",
    color: "bg-pink-100 text-pink-800",
  },
];

// 12-hour time options – values stay in "HH:MM" (24h) format
const timeOptions = [
  { value: "00:00", label: "12:00 AM" },
  { value: "01:00", label: "1:00 AM" },
  { value: "02:00", label: "2:00 AM" },
  { value: "03:00", label: "3:00 AM" },
  { value: "04:00", label: "4:00 AM" },
  { value: "05:00", label: "5:00 AM" },
  { value: "06:00", label: "6:00 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
  { value: "22:00", label: "10:00 PM" },
  { value: "23:00", label: "11:00 PM" },
];

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    throw new Error("EventsPage must be used within an AuthProvider");
  }
  // Add this to EventsPage component's state area
  const [rsvpLoading, setRsvpLoading] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [locations, setLocations] = useState([]); // 🔹 campus locations
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showCreatedEventsOnly, setShowCreatedEventsOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showRegisteredEventsOnly, setShowRegisteredEventsOnly] =
    useState(false);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Registered Members Modal
  const [membersModalEvent, setMembersModalEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);

  // Cancel confirmation dialog state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [eventToCancel, setEventToCancel] = useState(null);

  // Description popup dialog state
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] =
    useState(false);
  const [descriptionEvent, setDescriptionEvent] = useState(null);

  const initialNewEventState = {
    title: "",
    description: "",
    date_time: "",
    end_time: "",
    location_id: "", // 🔹 use location_id instead of free-text location
    capacity: "",
    category_id: "",
    organization_id: "",
    registration_required: false,
    members_only: false,
    instructor_email: "",
  };

  // New event form state
  const [newEvent, setNewEvent] = useState(initialNewEventState);

  // Handles dialog open/close reset logic (must exist for Dialog onOpenChange)
  const handleDialogOpenChange = (open) => {
    setIsCreateDialogOpen(open);

    if (!open) {
      setEditingEvent(null);
      setNewEvent(initialNewEventState);
      setStartTime("");
      setEndTime("");
    }
  };

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };
  const [minDateTime] = useState(() => getCurrentDateTimeLocal());

  const PRIVILEGED_ORG_ROLES = [
    "admin_delegate",
    "lead_faculty",
    "coordinator",
    "event_manager",
  ];

  const canCreateOrApprove =
    user.role === "admin" ||
    organizations.some((org) =>
      PRIVILEGED_ORG_ROLES.includes(org?.current_org_role)
    );

  const eligibleOrganizations =
    user.role === "admin"
      ? organizations
      : organizations.filter((org) =>
          PRIVILEGED_ORG_ROLES.includes(org?.current_org_role)
        );

  // --------------- Helper: detect non-json HTML responses ---------------
  const logNonJson = async (err) => {
    try {
      const text = err?.response?.data;
      if (typeof text === "string" && text.trim().startsWith("<")) {
        console.error("Server returned HTML (not JSON):", text.slice(0, 1000));
      } else {
        console.error("Server response error:", err.response || err.message || err);
      }
    } catch (e) {
      console.error("Error reading non-json response:", e);
    }
  };

  // ---------------- Fetch Events ----------------
  const fetchEvents = async () => {
    try {
      const res = await api.get("/events", { params: { user_id: user.user_id } });
      setEvents(res.data || []);
    } catch (err) {
      await logNonJson(err);
      console.error("Error fetching events:", err);
      toast.error("Failed to fetch events");
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const res = await api.get(`/events/registrations/${user.user_id}`);
      setRegisteredEvents((res.data || []).map((r) => Number(r.event_id)));
    } catch (err) {
      await logNonJson(err);
      console.error("Error fetching registrations:", err);
    }
  };

  const fetchFavoriteEvents = async () => {
    try {
      const res = await api.get(`/favorites/user/${user.user_id}`);
      const favEventIds = res.data
        .filter((fav) => fav.item_type === "event")
        .map((fav) => Number(fav.item_id));
      setFavoriteEvents(favEventIds);
    } catch (err) {
      await logNonJson(err);
      console.error("Error fetching favorite events:", err);
    }
  };

  // Fetch organizations for dropdown
  const fetchOrganizations = async () => {
    try {
      const res = await api.get("/organizations", {
        params: { user_id: user.user_id },
      });

      setOrganizations(res.data || []);
    } catch (err) {
      await logNonJson(err);
      console.error("Error fetching organizations:", err);
      toast.error("Failed to load organizations");
    }
  };

  // 🔹 Fetch campus locations for dropdown (same as orgs page style)
  const fetchLocations = async () => {
    try {
      const res = await api.get("/locations");
      setLocations(res.data || []);
    } catch (err) {
      await logNonJson(err);
      console.error("Error fetching locations:", err);
      toast.error("Failed to load locations");
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchRegisteredEvents();
    fetchFavoriteEvents();
    fetchOrganizations();
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
  // If the user loses/create privilege (or never had it), make sure the Created Events filter is not stuck on.
  if (!canCreateOrApprove && showCreatedEventsOnly) {
    setShowCreatedEventsOnly(false);
  }
}, [canCreateOrApprove, showCreatedEventsOnly]);

  const now = new Date();

  const getEventStatus = (event) => {
    if (!event?.start_datetime || !event?.end_datetime) return "all";

    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "all";
    }

    if (end < now) return "completed";
    if (start > now) return "upcoming";
    return "ongoing";
  };

  // helper to construct location label from event
  const buildLocationLabel = (event) => {
    const parts = [];
    if (event.location_name) parts.push(event.location_name);
    if (event.building) parts.push(event.building);
    if (event.room) parts.push(`Room ${event.room}`);
    return parts.join(" · ") || "";
  };

  const combinedEvents = events;

  const filteredEvents = combinedEvents.filter((event) => {
    const isCreator = Number(event.created_by) === Number(user.user_id);
    const isRegistered = registeredEvents.includes(event.event_id);

    const eventOrg = organizations.find(
      (org) => Number(org.id) === Number(event.org_id)
    );
    const isOrgMember = eventOrg ? Boolean(eventOrg.is_member) : false;
    const isMembersOnly = Boolean(event.members_only);

    if (isMembersOnly && !isOrgMember && !isCreator && user.role !== "admin") {
      return false;
    }

    if (showCreatedEventsOnly && !isCreator) {
      return false;
    }

    if (showRegisteredEventsOnly && !isRegistered) {
      return false;
    }

    const locationLabel = buildLocationLabel(event);

    const matchesSearch =
      searchQuery === "" ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      locationLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || event.category_id === selectedCategory;

    const eventStatus = getEventStatus(event);

    const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let matchesStatus = true;

    if (statusFilter === "upcoming") {
      matchesStatus = eventStatus === "upcoming";
    } else if (statusFilter === "ongoing") {
      matchesStatus = eventStatus === "ongoing";
    } else if (statusFilter === "completed") {
      matchesStatus =
        eventStatus === "completed" &&
        endDate &&
        endDate <= now &&
        endDate >= thirtyDaysAgo;
    } else if (statusFilter === "all") {
      matchesStatus =
        eventStatus === "upcoming" || eventStatus === "ongoing";
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const allEventsForStats = combinedEvents.filter((event) => {
    const isCreator = Number(event.created_by) === Number(user.user_id);

    const eventOrg = organizations.find(
      (org) => Number(org.id) === Number(event.org_id)
    );
    const isOrgMember = eventOrg ? Boolean(eventOrg.is_member) : false;
    const isMembersOnly = Boolean(event.members_only);

    if (isMembersOnly && !isOrgMember && !isCreator && user.role !== "admin") {
      return false;
    }

    const locationLabel = buildLocationLabel(event);

    const matchesSearch =
      searchQuery === "" ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      locationLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || event.category_id === selectedCategory;

    const eventStatus = getEventStatus(event);
    const matchesStatus =
      eventStatus === "upcoming" || eventStatus === "ongoing";

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ---------------- RSVP ----------------
  const isEventFull = (event) =>
    event.registered_count && event.capacity
      ? event.registered_count >= event.capacity
      : false;

  const handleRSVP = async (eventId) => {
     setRsvpLoading((prev) => new Set(prev).add(eventId));
    try {
      const alreadyRegistered = registeredEvents.includes(eventId);
      if (!alreadyRegistered) {
        const event = events.find((e) => e.event_id === eventId);
        if (!event) {
          toast.error("Event not found");
          return;
        }
        const currentCount = event.registered_count || 0;
        const capacity = event.capacity || 0;
        if (capacity && currentCount >= capacity) {
          toast.error("This event is full. You cannot register.");
          return;
        }
      }
      let res;

      if (registeredEvents.includes(eventId)) {
        res = await api.delete(`/events/${eventId}/rsvp`, {
          data: { user_id: user.user_id },
        });

        const data = res.data || {};

        setRegisteredEvents((prev) => prev.filter((id) => id !== eventId));

        setEvents((prev) =>
          prev.map((e) =>
            e.event_id === eventId
              ? { ...e, registered_count: data.registered_count }
              : e
          )
        );

        toast.success("RSVP cancelled successfully");
      } else {
        res = await api.post(`/events/${eventId}/rsvp`, {
          user_id: user.user_id,
        });

        const data = res.data || {};

        setRegisteredEvents((prev) => [...prev, eventId]);

        setEvents((prev) =>
          prev.map((e) =>
            e.event_id === eventId
              ? { ...e, registered_count: data.registered_count }
              : e
          )
        );

        toast.success("RSVP confirmed!");
      }
    } catch (err) {
      await logNonJson(err);
      console.error("RSVP error:", err);
      toast.error(err.message || "Failed to process RSVP");
    }
  };

  // ---------------- Favorite ----------------
  const toggleFavorite = async (eventId) => {
    const isFavorite = favoriteEvents.includes(eventId);

    if (!isFavorite) {
      try {
        await api.post("/favorites", {
          user_id: user.user_id,
          item_type: "event",
          item_id: eventId,
        });

        setFavoriteEvents((prev) => [...prev, eventId]);
        toast.success("Event added to favorites");
      } catch (err) {
        await logNonJson(err);
        if (err.response?.status === 409) {
          toast.info("Already in favorites");
          if (!favoriteEvents.includes(eventId)) {
            setFavoriteEvents((prev) => [...prev, eventId]);
          }
        } else {
          console.error("Error adding favorite:", err);
          toast.error("Could not add favorite");
        }
      }
    } else {
      try {
        await api.delete("/favorites", {
          data: {
            user_id: user.user_id,
            item_type: "event",
            item_id: eventId,
          },
        });

        setFavoriteEvents((prev) => prev.filter((id) => id !== eventId));
        toast.info("Event removed from favorites");
      } catch (err) {
        await logNonJson(err);
        console.error("Error removing favorite:", err);
        toast.error("Could not remove favorite");
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
      location_id,
      capacity,
      category_id,
      instructor_email,
    } = newEvent;

    const startDate = date_time;
    const endDate = end_time;

    const combinedStart =
      startDate && startTime ? `${startDate}T${startTime}` : "";
    const combinedEnd = endDate && endTime ? `${endDate}T${endTime}` : "";

    const privilegedOrgIds =
      user.role === "admin"
        ? organizations.map((org) => org.id)
        : organizations
            .filter((org) =>
              PRIVILEGED_ORG_ROLES.includes(org?.current_org_role)
            )
            .map((org) => org.id);

    if (!newEvent.organization_id) {
      toast.error("Please select an organization for this event");
      return;
    }

    if (
      user.role !== "admin" &&
      !privilegedOrgIds.includes(newEvent.organization_id)
    ) {
      toast.error(
        "You can only create events for organizations where you are coordinator, event manager, lead faculty, or admin delegate."
      );
      return;
    }

    if (
      !title ||
      !description ||
      !date_time ||
      !end_time ||
      !location_id ||
      !capacity ||
      !category_id ||
      !startTime ||
      !endTime
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const capacityNum = parseInt(capacity, 10);

    if (Number.isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
      toast.error("Capacity must be between 1 and 1000");
      return;
    }

    const start = new Date(combinedStart);
    const end = new Date(combinedEnd);
    const nowCreate = new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Invalid start or end time");
      return;
    }

    if (start <= nowCreate) {
      toast.error("Start time must be in the future");
      return;
    }
    const diffMs = end.getTime() - start.getTime();
    const minDurationMs = 30 * 60 * 1000;
    if (diffMs < minDurationMs) {
      toast.error(
        "End time must be at least 30 minutes after the start time"
      );
      return;
    }

    const event = {
      ...newEvent,
      location_id: Number(location_id),
      start_datetime: combinedStart,
      end_datetime: combinedEnd,
      capacity: capacityNum,
      created_by: user.user_id,
      registered_count: 0,
      status: "approved",
    };

    try {
      const res = await api.post("/events", event);

      const savedEvent = res.data;
      setEvents((prev) => [savedEvent, ...prev]);
      setIsCreateDialogOpen(false);

      setNewEvent(initialNewEventState);
      setStartTime("");
      setEndTime("");

      toast.success("Event created successfully");
    } catch (err) {
      await logNonJson(err);
      console.error("Error creating event:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to create event");
    }
  };

  // ---------------- Update Event ----------------
  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    const {
      title,
      description,
      date_time,
      end_time,
      location_id,
      capacity,
      category_id,
      instructor_email,
    } = newEvent;

    const startDate = date_time;
    const endDate = end_time;

    const combinedStart =
      startDate && startTime ? `${startDate}T${startTime}` : "";
    const combinedEnd = endDate && endTime ? `${endDate}T${endTime}` : "";

    if (
      !title ||
      !description ||
      !date_time ||
      !end_time ||
      !location_id ||
      !capacity ||
      !category_id ||
      !startTime ||
      !endTime
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const capacityNum = parseInt(capacity, 10);

    if (Number.isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
      toast.error("Capacity must be between 1 and 1000");
      return;
    }

    const eventToSend = {
      title,
      description,
      location_id: Number(location_id),
      capacity: capacityNum,
      category_id,
      registration_required: newEvent.registration_required,
      instructor_email,
      start_datetime: combinedStart,
      end_datetime: combinedEnd,
    };

    try {
      const res = await api.put(
        `/events/${editingEvent.event_id}`,
        eventToSend
      );

      const updatedEvent = res.data;

      setEvents((prev) =>
        prev.map((e) =>
          e.event_id === updatedEvent.event_id ? updatedEvent : e
        )
      );

      setEditingEvent(null);
      setIsCreateDialogOpen(false);
      setNewEvent(initialNewEventState);
      setStartTime("");
      setEndTime("");

      toast.success("Event updated successfully");
    } catch (err) {
      await logNonJson(err);
      console.error("Update event error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to update event");
    }
  };

  // ---------------- Cancel/Delete Event: OPEN dialog ----------------
  const handleCancelClick = (event) => {
    const isCreator = Number(event.created_by) === Number(user.user_id);
    const isAdmin = user.role === "admin";

    if (!isAdmin && !isCreator) return;

    setEventToCancel(event);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelEvent = async () => {
    if (!eventToCancel) return;

    const eventId = eventToCancel.event_id;

    try {
      const response = await api.delete(`/events/${eventId}`);

      setEvents((prevEvents) =>
        prevEvents.filter((e) => e.event_id !== eventId)
      );

      setRegisteredEvents((prev) => prev.filter((id) => id !== eventId));

      toast.success("Event deleted/cancelled successfully");
    } catch (err) {
      await logNonJson(err);
      console.error("Cancel event error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to cancel event");
    } finally {
      setIsCancelDialogOpen(false);
      setEventToCancel(null);
    }
  };

  // ---------------- Admin/creator: open edit dialog ----------------
  const handleOpenEditDialog = (event) => {
    const isCreator = Number(event.created_by) === Number(user.user_id);
    const isAdmin = user.role === "admin";

    if (!isAdmin && !isCreator) return;

    const parseDate = (dt) => {
      if (!dt) return "";
      const d = new Date(dt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const parseTime = (dt) => {
      if (!dt) return "";
      const d = new Date(dt);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    setNewEvent({
      title: event.title || "",
      description: event.description || "",
      date_time: parseDate(event.start_datetime),
      end_time: parseDate(event.end_datetime),
      location_id: event.location_id || "",
      capacity: event.capacity || "",
      category_id: event.category_id || "",
      registration_required: !!event.registration_required,
      instructor_email: event.instructor_email || "",
      organization_id: event.org_id || "",
      members_only: !!event.members_only,
    });

    setStartTime(parseTime(event.start_datetime));
    setEndTime(parseTime(event.end_datetime));

    setEditingEvent(event);
    setIsCreateDialogOpen(true);
  };

  // ---------------- Helpers ----------------
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalEventsCount = allEventsForStats.length;

  const createdEventsCount = allEventsForStats.filter(
    (event) => Number(event.created_by) === Number(user.user_id)
  ).length;

  const registeredEventsCount = allEventsForStats.filter((event) =>
    registeredEvents.includes(event.event_id)
  ).length;
  // Events happening today (local date). This does not change any business logic — it just derives a count.
const eventsTodayCount = allEventsForStats.filter((event) => {
  if (!event.start_datetime) return false;
  const start = new Date(event.start_datetime);
  const nowLocal = new Date();
  return (
    start.getFullYear() === nowLocal.getFullYear() &&
    start.getMonth() === nowLocal.getMonth() &&
    start.getDate() === nowLocal.getDate()
  );
}).length;

  // ---------------- Members modal fetch ----------------
  const openMembersModal = async (event) => {
    setMembersModalEvent(event);
    setIsMembersLoading(true);
    setMembers([]);
    setMembersError(null);

    try {
      // backend endpoint: GET /events/:id/registrations (adjust if your route differs)
      const res = await api.get(`/events/${event.event_id}/registrations`);
      setMembers(res.data || []);
    } catch (err) {
      await logNonJson(err);
      console.error("Error fetching members:", err);
      setMembersError(err.response?.data?.message || err.message || "Failed to load members");
    } finally {
      setIsMembersLoading(false);
    }
  };

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
            onOpenChange={handleDialogOpenChange}
          >
            <DialogTrigger asChild>
              <Button type="button">
                <Plus className="h-4 w-4 mr-2" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </DialogTitle>
                <DialogDescription>
                  {editingEvent
                    ? "Update the details of this event"
                    : "Fill in details to create a new event"}
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

                {/* Location dropdown (campus_locations) */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <select
                    className="border rounded-md w-full p-2"
                    value={newEvent.location_id || ""}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        location_id: e.target.value
                          ? Number(e.target.value)
                          : "",
                      })
                    }
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc.location_id} value={loc.location_id}>
                        {loc.location_name}
                        {loc.building ? ` – ${loc.building}` : ""}
                        {loc.room ? `, Room ${loc.room}` : ""}
                      </option>
                    ))}
                  </select>
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
                      value={newEvent.organization_id || ""}
                      onChange={(e) => {
                        const orgId = e.target.value
                          ? Number(e.target.value)
                          : "";
                        const selectedOrg = organizations.find(
                          (org) => org.id === orgId
                        );
                        setNewEvent({
                          ...newEvent,
                          organization_id: orgId,
                          category_id: selectedOrg
                            ? selectedOrg.category_id
                            : "",
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
                  type="button"
                  onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                  className="w-full"
                >
                  {editingEvent ? "Save Changes" : "Create Event"}
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
            type="button"
            variant={
              !showCreatedEventsOnly &&
              !showRegisteredEventsOnly &&
              selectedCategory === null &&
              statusFilter === "all"
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => {
              setShowCreatedEventsOnly(false);
              setShowRegisteredEventsOnly(false);
              setSelectedCategory(null);
              setStatusFilter("all");
            }}
          >
            All Events
          </Button>
        {canCreateOrApprove && (
          <Button
            type="button"
            variant={showCreatedEventsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowCreatedEventsOnly(true);
              setShowRegisteredEventsOnly(false);
              setSelectedCategory(null);
              setStatusFilter("all");
            }}
          >
            Created Events
          </Button>)}

          <Button
            type="button"
            variant={showRegisteredEventsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowRegisteredEventsOnly(true);
              setShowCreatedEventsOnly(false);
              setSelectedCategory(null);
              setStatusFilter("all");
            }}
          >
            Registered Events
          </Button>

          <Button
            type="button"
            variant={statusFilter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("upcoming");
              setShowCreatedEventsOnly(false);
              setShowRegisteredEventsOnly(false);
            }}
          >
            Upcoming Events
          </Button>

          <Button
            type="button"
            variant={statusFilter === "ongoing" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("ongoing");
              setShowCreatedEventsOnly(false);
              setShowRegisteredEventsOnly(false);
            }}
          >
            Ongoing Events
          </Button>

          <Button
            type="button"
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("completed");
              setShowCreatedEventsOnly(false);
              setShowRegisteredEventsOnly(false);
            }}
          >
            Completed Events
          </Button>
        </div>

        <div className="hidden" />
      </div>

      {/* Events list */}
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const category = eventCategories.find(
              (c) => c.id === event.category_id
            );
            const isRegistered = registeredEvents.includes(event.event_id);
            const isFavorite = favoriteEvents.includes(event.event_id);
            const isFull = isEventFull(event);
            const isCreator = Number(event.created_by) === Number(user.user_id);
            const isAdmin = user.role === "admin";
            const showRSVP = !isCreator;

            const eventStatus = getEventStatus(event);
            const isCompleted = eventStatus === "completed";

            const fullDescription = event.description || "";
            const MAX_PREVIEW_CHARS = 35;
            const shouldShowMore =
              fullDescription.length > MAX_PREVIEW_CHARS;

            const previewDescription = shouldShowMore
              ? fullDescription.slice(0, MAX_PREVIEW_CHARS).trimEnd() + "..."
              : fullDescription;

            const cardClasses = `overflow-hidden hover:shadow-lg transition-shadow border ${
              isRegistered ? "border-green-500" : "border-gray-200"
            }`;

            const locationLabel = buildLocationLabel(event);

            return (
              <Card
                key={event.event_id}
                className={cardClasses}
                style={
                  isRegistered ? { backgroundColor: "#ecfdf3" } : undefined
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-col gap-1">
                      {category && (
                        <div className="text-sm font-semibold text-foreground">
                          {category.name}
                        </div>
                      )}

                      {isRegistered && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white border border-green-600 shadow-sm">
                          You’re Registered
                        </span>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(event.event_id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isFavorite ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                    </Button>
                  </div>

                  <CardTitle className="text-lg">{event.title}</CardTitle>

                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-1 max-w-full">
                      <span className="truncate flex-1 min-w-0">
                        {previewDescription}
                      </span>
                      {shouldShowMore && (
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:underline flex-shrink-0"
                          onClick={() => {
                            setDescriptionEvent(event);
                            setIsDescriptionDialogOpen(true);
                          }}
                        >
                          Show more
                        </button>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatDateTime(event.start_datetime)}
                        {event.end_datetime && (
                          <>
                            {" - "}
                            {formatDateTime(event.end_datetime)}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{locationLabel}</span>
                    </div>

                    <div
                      className="flex items-center gap-2 cursor-pointer hover:underline text-sm text-primary"
                      onClick={() => openMembersModal(event)}
                    >
                      <Users className="h-4 w-4" />
                      <span>
                        {event.registered_count || 0} / {event.capacity || 0}{" "}
                        registered
                      </span>
                    </div>
                  </div>

                  {showRSVP && !isCompleted && (
                    <Button
                      type="button"
                      size="sm"
                      variant={isRegistered ? "outline" : "default"}
                      disabled={isFull && !isRegistered}
                      onClick={() => handleRSVP(event.event_id)}
                      className="w-full"
                    >
                      {isRegistered ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Cancel RSVP
                        </>
                      ) : isFull ? (
                        "Event Full"
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          RSVP
                        </>
                      )}
                    </Button>
                  )}

                  {(isAdmin || isCreator) && (
                    <div className="w-full space-y-2">
                      {isCompleted ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled
                          className="w-full cursor-default select-none disabled:opacity-100 disabled:pointer-events-none"
                        >
                          Event completed
                        </Button>
                      ) : (
                        <>
                          {isCreator && (
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              disabled
                              className="w-full cursor-default select-none disabled:opacity-100 disabled:pointer-events-none"
                            >
                              You created this event.
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenEditDialog(event)}
                            className="w-full"
                          >
                            Edit Event
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelClick(event)}
                            className="w-full"
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Cancel Event
                          </Button>
                        </>
                      )}
                    </div>
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

      {/* Description Dialog */}
      <Dialog
        open={isDescriptionDialogOpen}
        onOpenChange={(open) => {
          setIsDescriptionDialogOpen(open);
          if (!open) setDescriptionEvent(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{descriptionEvent?.title}</DialogTitle>
            <DialogDescription>
              <span className="whitespace-pre-wrap">
                {descriptionEvent?.description}
              </span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Cancel Event Confirmation Dialog */}
      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          setIsCancelDialogOpen(open);
          if (!open) setEventToCancel(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this event?</DialogTitle>
            <DialogDescription>
              {eventToCancel
                ? `Are you sure you want to cancel "${eventToCancel.title}"? This action cannot be undone.`
                : "Are you sure you want to cancel this event? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCancelDialogOpen(false);
                setEventToCancel(null);
              }}
            >
              Keep Event
            </Button>
            <Button 
              type="button"
              variant="destructive" onClick={confirmCancelEvent}>
              Yes, Cancel Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick stats footer */}
      <div className="w-full mt-2 border-t pt-4 pb-4">
        <div className="max-w-5xl mx-auto flex justify-between px-10">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="font-semibold"
              style={{ fontSize: "2rem", lineHeight: "1" }}
            >
              {totalEventsCount}
            </div>
            <div className="text-base text-muted-foreground mt-1">
              Total Events
            </div>
          </div>
          {canCreateOrApprove ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="font-semibold"
              style={{ fontSize: "2rem", lineHeight: "1" }}
            >
              {createdEventsCount}
            </div>
            <div className="text-base text-muted-foreground mt-1">
              Events Created
            </div>
          </div>
          ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="font-semibold"
              style={{ fontSize: "2rem", lineHeight: "1" }}
            >
              {eventsTodayCount}
            </div>
            <div className="text-base text-muted-foreground mt-1">
              Events Today
            </div>
          </div>

          )}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="font-semibold"
              style={{ fontSize: "2rem", lineHeight: "1" }}
            >
              {registeredEventsCount}
            </div>
            <div className="text-base text-muted-foreground mt-1">
              Events Registered
            </div>
          </div>
        </div>
      </div>

      {/* Registered Members Modal */}
      <Dialog
        open={!!membersModalEvent}
        onOpenChange={(open) => {
          if (!open) {
            setMembersModalEvent(null);
            setMembers([]);
            setMembersError(null);
            setIsMembersLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh] overflow-hidden">
          <DialogHeader className="space-y-1">
            <DialogTitle>Registered Members</DialogTitle>
            {membersModalEvent && (
              <DialogDescription>
                <span className="font-medium text-foreground">
                  {membersModalEvent.title}
                </span>{" "}
                ·{" "}
                {buildLocationLabel(membersModalEvent) && (
                  <span className="text-muted-foreground">
                    {buildLocationLabel(membersModalEvent)}
                  </span>
                )}
                <br />
                <span className="text-muted-foreground text-xs">
                  {membersModalEvent.start_datetime &&
                    new Date(
                      membersModalEvent.start_datetime
                    ).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                  {membersModalEvent.end_datetime && " – "}
                  {membersModalEvent.end_datetime &&
                    new Date(
                      membersModalEvent.end_datetime
                    ).toLocaleString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex items-center gap-3 mb-3 text-sm">
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {members.length} member{members.length === 1 ? "" : "s"}
            </span>
            {membersModalEvent && (
              <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Capacity: {membersModalEvent.capacity || 0}
              </span>
            )}
          </div>

          <div className="border rounded-xl bg-muted/40 overflow-hidden">
            {isMembersLoading ? (
              <div className="p-6 text-sm text-muted-foreground">
                Loading members…
              </div>
            ) : membersError ? (
              <div className="p-6 text-sm text-destructive">
                {membersError}
              </div>
            ) : members.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No members have registered for this event yet.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2">User UID</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr
                        key={m.user_id}
                        className="border-t bg-background/60 hover:bg-muted/60"
                      >
                        <td className="px-4 py-2">{m.user_uid}</td>
                        <td className="px-4 py-2">
                          {m.first_name} {m.last_name}
                        </td>
                        <td className="px-4 py-2">{m.email}</td>
                        <td className="px-4 py-2 capitalize">
                          {m.role_name || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
