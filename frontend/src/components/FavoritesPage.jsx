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
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Pin,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { sampleAnnouncements } from '../types/announcements';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function FavoritesPage() {
  const { user } = useAuth();

  if (!user) {
    throw new Error('FavoritesPage must be used within an AuthProvider');
  }

  // IDs of favorite events from DB
  const [favoriteEventIds, setFavoriteEventIds] = useState([]);

  // still using sample announcements for now
  const [favoriteAnnouncementIds, setFavoriteAnnouncementIds] = useState([
    '1',
    '3',
  ]);

  const [favoriteMaterialIds, setFavoriteMaterialIds] = useState(() => {
    try {
      const saved = localStorage.getItem('favorite_material_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // all events fetched from backend
  const [events, setEvents] = useState([]);

  // derive favorite events from events + favoriteEventIds
  const favoriteEvents = events.filter((event) =>
    favoriteEventIds.includes(event.event_id)
  );

  const favoriteAnnouncements = sampleAnnouncements.filter((announcement) =>
    favoriteAnnouncementIds.includes(announcement.id)
  );

  // ---------------- Fetch favorites + events ----------------
  useEffect(() => {
    const fetchFavoritesAndEvents = async () => {
      try {
        // 1) get favorites for this user
        const favoritesRes = await axios.get(
          `http://localhost:5000/api/favorites/user/${user.user_id}`
        );

        const favEventIds = favoritesRes.data
          .filter((fav) => fav.item_type === 'event')
          .map((fav) => Number(fav.item_id));

        setFavoriteEventIds(favEventIds);

        // 2) get all events (same endpoint as EventsPage)
        const eventsRes = await axios.get(
          `http://localhost:5000/api/events?user_id=${user.user_id}`
        );

        setEvents(eventsRes.data);
      } catch (err) {
        console.error('Error loading favorites page:', err);
        toast.error('Failed to load favorites');
      }
    };

    fetchFavoritesAndEvents();
  }, [user.user_id]);

  const removeFavoriteEvent = async (eventId) => {
  try {
    // 1️⃣ Remove from database
    await axios.delete('http://localhost:5000/api/favorites', {
      data: {
        user_id: user.user_id,
        item_type: 'event',
        item_id: eventId,
      },
    });

    // 2️⃣ Update UI state → event disappears from Favorites page
    setFavoriteEventIds((prev) => prev.filter((id) => id !== eventId));

    toast.info('Event removed from favorites');
  } catch (err) {
    console.error('Error removing favorite:', err);
    toast.error('Could not remove favorite');
  }
};





  const removeFavoriteAnnouncement = (announcementId) => {
    setFavoriteAnnouncementIds((prev) =>
      prev.filter((id) => id !== announcementId)
    );
    toast.info('Announcement removed from favorites');
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
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
        <p className="text-muted-foreground">
          Your saved events and announcements
        </p>
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
              {favoriteEvents.map((event) => (
                <Card
                  key={event.event_id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge>Category {event.category_id}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFavoriteEvent(event.event_id)}
                      >
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatDateTime(
                          event.start_datetime || event.date_time
                        )}
                      </span>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Favorite Announcements (still using sample data) */}
        <TabsContent value="announcements" className="space-y-4 mt-6">
          {favoriteAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No favorite announcements yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the heart icon on announcements to save them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {favoriteAnnouncements.map((announcement) => (
                <Card key={announcement.id}>
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
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                          <span>Posted by {announcement.created_by_name}</span>
                          <span>•</span>
                          <span>
                            {formatDateTime(announcement.created_date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          className={getPriorityColor(
                            announcement.priority
                          )}
                        >
                          <span className="flex items-center gap-1">
                            {getPriorityIcon(announcement.priority)}
                            {announcement.priority.toUpperCase()}
                          </span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeFavoriteAnnouncement(announcement.id)
                          }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t">
        <div className="text-center space-y-1">
          <div className="text-3xl font-semibold">{favoriteEvents.length}</div>
          <div className="text-sm text-muted-foreground">Favorite Events</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-3xl font-semibold">
            {favoriteAnnouncements.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Favorite Announcements
          </div>
        </div>
      </div>
    </div>
  );
}
