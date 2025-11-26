import { useState, useEffect } from 'react';
import api from "../api/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Pin,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

// Categories (ids MUST match organization_categories.category_id in DB)
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
    color: "bg-pink-100 text-pink-800",
  },
  {
    id: 5,
    key: "IT Services",
    name: "IT Services",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: 6,
    key: "Activities",
    name: "Activities & Student Life",
    color: "bg-red-100 text-red-800",
  },
];

function getCategoryById(id) {
  return eventCategories.find((c) => c.id === Number(id));
}

export default function FavoritesPage() {
  const { user } = useAuth();

  if (!user) {
    throw new Error('FavoritesPage must be used within an AuthProvider');
  }

  const [favoriteEventIds, setFavoriteEventIds] = useState([]);
  const [events, setEvents] = useState([]);
  const [favoriteAnnouncements, setFavoriteAnnouncements] = useState([]);
  const [favoriteAnnouncementIds, setFavoriteAnnouncementIds] = useState([]);
  const [favoriteMaterialIds, setFavoriteMaterialIds] = useState(() => {
    try {
      const saved = localStorage.getItem('favorite_material_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDescriptionOpen, setIsEventDescriptionOpen] = useState(false);

  // Derive favorite events from all events + favoriteEventIds
  const favoriteEvents = events.filter((event) =>
    favoriteEventIds.includes(event.event_id)
  );

  useEffect(() => {
    const fetchFavoritesAndEventsAndAnnouncements = async () => {
      try {
        // 1) Get favorites for this user from backend
        const favoritesRes = await api.get(`/favorites/user/${user.user_id}`);

        const favEvents = favoritesRes.data
          .filter((fav) => fav.item_type === 'event')
          .map((fav) => Number(fav.item_id));

        const favAnnouncements = favoritesRes.data
          .filter((fav) => fav.item_type === 'announcement')
          .map((fav) => Number(fav.item_id));

        setFavoriteEventIds(favEvents);
        setFavoriteAnnouncementIds(favAnnouncements);

        // 2) Get all events
        const eventsRes = await api.get(`/events`, {
          params: { user_id: user.user_id },
        });
        setEvents(eventsRes.data);

        // 3) Fetch favorite announcements details from backend
        if (favAnnouncements.length > 0) {
          const announcementPromises = favAnnouncements.map((id) =>
            api.get(`/announcements/${id}`).then(res => res.data).catch(() => null)
          );
          const announcementsData = await Promise.all(announcementPromises);
          setFavoriteAnnouncements(announcementsData.filter(Boolean));
        } else {
          setFavoriteAnnouncements([]);
        }
      } catch (err) {
        console.error('Error loading favorites page:', err);
        toast.error('Failed to load favorites');
      }
    };
    fetchFavoritesAndEventsAndAnnouncements();
  }, [user.user_id]);

  // Remove favorite event
  const removeFavoriteEvent = async (eventId) => {
    try {
      await api.delete('/favorites', {
        data: {
          user_id: user.user_id,
          item_type: 'event',
          item_id: eventId,
        },
      });
      setFavoriteEventIds((prev) => prev.filter((id) => id !== eventId));
      toast.info('Event removed from favorites');
    } catch (err) {
      console.error('Error removing favorite:', err);
      toast.error('Could not remove favorite');
    }
  };

  // Remove favorite announcement
  const removeFavoriteAnnouncement = (announcementId) => {
    setFavoriteAnnouncementIds((prev) =>
      prev.filter((id) => id !== announcementId)
    );
    setFavoriteAnnouncements((prev) =>
      prev.filter((a) => (a.announcement_id || a.id) !== announcementId)
    );
    toast.info('Announcement removed from favorites');
  };

  // Date formatting helper
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

  // Priority icon helper for announcements
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Priority color helper for announcements
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1>Favorites</h1>
        <p className="text-muted-foreground">Your saved events and announcements</p>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">
            Events ({favoriteEvents.length})
          </TabsTrigger>
          <TabsTrigger value="announcements">
            Announcements ({favoriteAnnouncements.length})
          </TabsTrigger>
        </TabsList>

        {/* Favorite Events */}
        <TabsContent value="events" className="space-y-4 mt-6">
          {favoriteEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No favorite events yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the heart icon on events to save them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteEvents.map((event) => {
                const fullDescription = event.description || '';
                const MAX_PREVIEW_CHARS = 30;
                const shouldShowMore = fullDescription.length > MAX_PREVIEW_CHARS;
                const previewDescription = shouldShowMore
                  ? fullDescription.slice(0, MAX_PREVIEW_CHARS).trimEnd() + '...'
                  : fullDescription;
                const cat = getCategoryById(event.category_id);
                return (
                  <Card
                    key={event.event_id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          className={`px-3 py-1 text-sm font-semibold rounded-md ${
                            cat ? cat.color : ''
                          }`}
                        >
                          {cat ? cat.name : `Category ${event.category_id}`}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFavoriteEvent(event.event_id)}
                        >
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>

                      {/* DESCRIPTION LINE WITH SHOW MORE */}
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-1 max-w-full">
                          <span className="truncate flex-1 min-w-0">{previewDescription}</span>
                          {shouldShowMore && (
                            <button
                              type="button"
                              className="text-xs text-blue-600 hover:underline flex-shrink-0"
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsEventDescriptionOpen(true);
                              }}
                            >
                              Show more
                            </button>
                          )}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(event.start_datetime || event.date_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {event.registered_count || 0} / {event.capacity || 0} registered
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Favorite Announcements */}
        <TabsContent value="announcements" className="space-y-4 mt-6">
          {favoriteAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No favorite announcements yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the heart icon on announcements to save them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {favoriteAnnouncements.map((announcement) => (
                <Card key={announcement.announcement_id || announcement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {announcement.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                          <span>Posted by {announcement.created_by_name || announcement.created_by}</span>
                          <span>•</span>
                          <span>
                            {announcement.created_date
                              ? new Date(announcement.created_date).toLocaleString()
                              : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={'bg-gray-500 text-white'}>
                          <span className="flex items-center gap-1">
                            <Info className="h-4 w-4" /> Info
                          </span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeFavoriteAnnouncement(
                              announcement.announcement_id || announcement.id
                            )
                          }
                          aria-label="Remove announcement from favorites"
                          title="Remove announcement from favorites"
                        >
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick stats */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-22 pt-8 border-t">
        <div className="text-center space-y-1 w-56 min-w-[30rem]">
          <div className="text-3xl font-semibold">{favoriteEvents.length}</div>
          <div className="text-sm text-muted-foreground">Favorite Events</div>
        </div>
        <div className="text-center space-y-1 w-56 min-w-[30rem]">
          <div className="text-3xl font-semibold">{favoriteAnnouncements.length}</div>
          <div className="text-sm text-muted-foreground">Favorite Announcements</div>
        </div>
      </div>

      {/* FULL DESCRIPTION POPUP FOR EVENTS */}
      <Dialog
        open={isEventDescriptionOpen}
        onOpenChange={(open) => {
          setIsEventDescriptionOpen(open);
          if (!open) setSelectedEvent(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              <span className="whitespace-pre-wrap">{selectedEvent?.description}</span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
