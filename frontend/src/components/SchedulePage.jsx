import { useState, useEffect, useRef } from 'react';
import { addDays, subDays, startOfWeek, format, isSameWeek } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

import {
  Clock,
  MapPin,
  User,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function SchedulePage() {
  const { user } = useAuth();
  const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

  const [viewMode, setViewMode] = useState('calendar');
  const [isLoading, setIsLoading] = useState(false);

  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  );

  const handleNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const handlePreviousWeek = () => setCurrentWeekStart(subDays(currentWeekStart, 7));
  const handleToday = () =>
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Monday–Sunday
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [schedule, setSchedule] = useState([]);

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'class':
        return 'Class';
      case 'meeting':
        return 'Meeting';
      case 'event':
        return 'Event';
      case 'exam':
        return 'Exam';
      case 'office-hours':
        return 'Office Hours';
      default:
        return type;
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'class':
        return 'bg-blue-500';
      case 'meeting':
        return 'bg-purple-500';
      case 'event':
        return 'bg-green-500';
      case 'exam':
        return 'bg-red-500';
      case 'office-hours':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const generateHourlySlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const displayHour = ((hour + 11) % 12) + 1;
      const suffix = hour < 12 ? 'AM' : 'PM';

      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${displayHour} ${suffix}`
      });
    }
    return slots;
  };

  const hourlySlots = generateHourlySlots();

  const getEventsByDay = (dayName) => {
    return schedule.filter((event) => {
      if (!event.startDate) return false;
      const sameDay = format(event.startDate, 'EEEE') === dayName;
      const sameWeek = isSameWeek(event.startDate, currentWeekStart, {
        weekStartsOn: 1
      });
      return sameDay && sameWeek;
    });
  };

  const getEventStyle = (event) => {
    const [startHourStr, startMinuteStr] = event.startTime.split(':');
       const [endHourStr, endMinuteStr] = event.endTime.split(':');

    const startHour = parseInt(startHourStr, 10);
    const startMinute = parseInt(startMinuteStr, 10);
    const endHour = parseInt(endHourStr, 10);
    const endMinute = parseInt(endMinuteStr, 10);

    const startOffsetHours = startHour + startMinute / 60;
    const endOffsetHours = endHour + endMinute / 60;
    const durationHours = endOffsetHours - startOffsetHours;

    return {
      top: `${startOffsetHours * 4}rem`,
      height: `${durationHours * 4}rem`
    };
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      const ctxToken = user?.token || user?.jwt || user?.accessToken;
      const lsToken = localStorage.getItem('token');
      const token = ctxToken || lsToken;

      if (!token) {
        console.warn('No token found for schedule');
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/schedule/my`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.error('Schedule API error:', res.status, res.statusText);
          if (res.status === 401) {
            toast.error('Session expired. Please log in again.');
          } else {
            toast.error('Failed to load schedule from server.');
          }
          return;
        }

        const data = await res.json();
        const events = Array.isArray(data.events) ? data.events : [];

        const mapped = events.map((e) => {
          const start = new Date(e.start_datetime);
          const end = new Date(e.end_datetime);

          return {
            id: e.event_id,
            title: e.title,
            course: e.category || '',
            type: 'event',
            day: format(start, 'EEEE'),
            startTime: format(start, 'HH:mm'),
            endTime: format(end, 'HH:mm'),
            location: e.location || '',
            instructor: e.instructor_email || '',
            description: e.description || '',
            startDate: start
          };
        });

        setSchedule(mapped);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        toast.error('Something went wrong loading your schedule.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [user, API_BASE]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Top header bar */}
      <div
        className="fixed z-20"
        style={{ top: '4rem', left: '50%', transform: 'translateX(-50%)', width: '1500px' }}
      >
        <div className="px-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold">My Schedule</h1>
              {isLoading && (
                <p className="text-sm text-muted-foreground">Loading your events...</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <div className="font-medium">
                {format(weekDays[0], 'dd MMM yyyy')} - {format(weekDays[6], 'dd MMM yyyy')}
              </div>
              <Button variant="outline" onClick={handleNextWeek}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div
        className="fixed z-20"
        style={{ bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', width: '1500px' }}
      >
        <div className="px-4">
          <div className="flex items-center justify-center pt-4 border-t bg-background/80 backdrop-blur-sm rounded-t-lg">
            <div className="text-center space-y-1">
              <div className="text-3xl">{schedule.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
          </div>
        </div>
      </div>

      <ScheduleLayout
        viewMode={viewMode}
        weekDays={weekDays}
        days={days}
        hourlySlots={hourlySlots}
        getEventsByDay={getEventsByDay}
        getEventTypeColor={getEventTypeColor}
        getEventStyle={getEventStyle}
        getEventTypeLabel={getEventTypeLabel}
      />
    </div>
  );
}

function ScheduleLayout({
  viewMode,
  weekDays,
  days,
  hourlySlots,
  getEventsByDay,
  getEventTypeColor,
  getEventStyle,
  getEventTypeLabel
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (viewMode !== 'calendar') return;
    if (!scrollRef.current) return;

    const SLOT_HEIGHT_PX = 64;
    scrollRef.current.scrollTop = 8 * SLOT_HEIGHT_PX;
  }, [viewMode, weekDays]);

  return (
    <div
      className="fixed z-10"
      style={{
        top: '110px',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1500px'
      }}
    >
      <div className="h-full px-4">
        {/* Calendar view */}
        {viewMode === 'calendar' && (
          <Card className="h-full flex flex-col">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="overflow-x-auto h-full">
                <div className="min-w-[80px] flex flex-col h-full">
                  {/* Day headers */}
                  <div
                    className="flex border-b bg-muted/80 backdrop-blur-sm"
                    style={{ paddingRight: '16px' }}
                  >
                    {/* Time column */}
                    <div className="w-24 p-3 border-r">
                      <span className="text-sm text-muted-foreground">Time</span>
                    </div>

                    {/* Days header: Mon–Sun in one row */}
                    <div className="flex-1 flex">
                      {weekDays.map((date) => (
                        <div
                          key={date.toDateString()}
                          className="flex-1 p-3 border-r last:border-r-0 text-center"
                        >
                          <div>{format(date, 'EEEE')}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(date, 'dd MMM')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time slots + events */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto">
                    <div className="relative">
                      <div className="flex">
                        {/* Time labels */}
                        <div className="w-24 border-r">
                          {hourlySlots.map((slot) => (
                            <div
                              key={slot.time}
                              className="h-16 border-b flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground"
                            >
                              {slot.label}
                            </div>
                          ))}
                        </div>

                        {/* Columns for each day: Mon–Sun horizontally */}
                        <div className="flex-1 flex">
                          {days.map((dayName) => (
                            <div
                              key={dayName}
                              className="flex-1 border-r last:border-r-0 relative"
                            >
                              {/* Background hour slots */}
                              {hourlySlots.map((slot) => (
                                <div key={slot.time} className="h-16 border-b" />
                              ))}

                              {/* Events layer */}
                              <div className="absolute inset-0 pointer-events-none">
                                {getEventsByDay(dayName).map((event) => {
                                  const style = getEventStyle(event);
                                  return (
                                    <div
                                      key={event.id}
                                      className={`absolute left-1 right-1 ${getEventTypeColor(
                                        event.type
                                      )} text-white rounded-md p-2 overflow-hidden pointer-events-auto hover:shadow-lg transition-shadow`}
                                      style={style}
                                    >
                                      <div className="text-xs space-y-0.5">
                                        <div className="font-medium line-clamp-1">
                                          {event.title}
                                        </div>
                                        <div className="opacity-90">
                                          {event.startTime} - {event.endTime}
                                        </div>
                                        {event.location && (
                                          <div className="opacity-80 text-xs line-clamp-1">
                                            {event.location}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <Card className="h-full overflow-hidden">
            <CardContent className="p-4 space-y-4 h-full overflow-y-auto">
              {days.map((dayName) => {
                const events = getEventsByDay(dayName);
                return (
                  <Card key={dayName}>
                    <CardHeader>
                      <CardTitle>{dayName}</CardTitle>
                      <CardDescription>
                        {events.length} {events.length === 1 ? 'event' : 'events'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {events.length > 0 ? (
                        events.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div
                              className={`w-1 h-full ${getEventTypeColor(
                                event.type
                              )} rounded-full`}
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-base">{event.title}</h4>
                                  {event.course && (
                                    <p className="text-sm text-muted-foreground">
                                      {event.course}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary">
                                  {getEventTypeLabel(event.type)}
                                </Badge>
                              </div>

                              <div className="grid gap-2 text-sm md:grid-cols-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {event.startTime} - {event.endTime}
                                  </span>
                                </div>

                                {event.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{event.location}</span>
                                  </div>
                                )}

                                {event.instructor && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{event.instructor}</span>
                                  </div>
                                )}
                              </div>

                              {event.description && (
                                <p className="text-sm text-muted-foreground">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No events scheduled
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
