import { useState } from 'react';
import { addDays, subDays, startOfWeek, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import {
  Clock,
  MapPin,
  User,
  Plus,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  sampleStudentSchedule,
  sampleFacultySchedule,
  sampleAdminSchedule
} from '../types/schedule';
import { toast } from 'sonner';

export default function SchedulePage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('calendar');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Week state for date navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const handleNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const handlePreviousWeek = () =>
    setCurrentWeekStart(subDays(currentWeekStart, 7));

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  const getScheduleForUser = () => {
    switch (user?.role) {
      case 'student':
        return sampleStudentSchedule;
      case 'faculty':
        return sampleFacultySchedule;
      case 'admin':
        return sampleAdminSchedule;
      default:
        return [];
    }
  };

  const [schedule, setSchedule] = useState(getScheduleForUser());

  const [newEvent, setNewEvent] = useState({
    title: '',
    course: '',
    type: 'class',
    startTime: '09:00',
    endTime: '10:00',
    day: 'Monday',
    location: '',
    instructor: '',
    description: ''
  });

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

  const getEventsByDay = (day) => {
    return schedule.filter((event) => event.day === day);
  };

  const handleCreateEvent = () => {
    const { title, type, startTime, endTime, day } = newEvent;
    if (!title || !type || !startTime || !endTime || !day) {
      toast.error('Please fill in all required fields (*)');
      return;
    }

    const event = {
      id: Math.random().toString(36).substr(2, 9),
      ...newEvent,
      color: getEventTypeColor(newEvent.type)
    };

    setSchedule([...schedule, event]);
    setIsCreateDialogOpen(false);
    setNewEvent({
      title: '',
      course: '',
      type: 'class',
      startTime: '09:00',
      endTime: '10:00',
      day: 'Monday',
      location: '',
      instructor: '',
      description: ''
    });
    toast.success('Event added to schedule!');
  };

  const getEventStyle = (event) => {
    const startHour = parseInt(event.startTime.split(':')[0]);
    const startMinute = parseInt(event.startTime.split(':')[1]);
    const endHour = parseInt(event.endTime.split(':')[0]);
    const endMinute = parseInt(event.endTime.split(':')[1]);

    const startOffset = ((startHour - 8) * 60 + startMinute) / 60;
    const duration =
      ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60;

    return {
      top: `${startOffset * 4}rem`,
      height: `${duration * 4}rem`
    };
  };

  const generateHourlySlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`
      });
    }
    return slots;
  };

  const hourlySlots = generateHourlySlots();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Schedule</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Week Navigation */}
          <Button variant="outline" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="font-medium">
            {format(weekDays[0], 'dd MMM yyyy')} -{' '}
            {format(weekDays[6], 'dd MMM yyyy')}
          </div>
          <Button variant="outline" onClick={handleNextWeek}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Calendar/List toggle */}
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

          {/* Add Event Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>
                  Create a new event for this week
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Event title"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course">Course/Code</Label>
                    <Input
                      id="course"
                      placeholder="e.g., CS101"
                      value={newEvent.course}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, course: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(value) =>
                        setNewEvent({ ...newEvent, type: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class">Class</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="office-hours">
                          Office Hours
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="day">Day *</Label>
                    <Select
                      value={newEvent.day}
                      onValueChange={(value) =>
                        setNewEvent({ ...newEvent, day: value })
                      }
                    >
                      <SelectTrigger id="day">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                          'Sunday'
                        ].map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Room 204, Science Building"
                      value={newEvent.location}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, location: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="instructor">Instructor/Organizer</Label>
                    <Input
                      id="instructor"
                      placeholder="e.g., Dr. Smith"
                      value={newEvent.instructor}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          instructor: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional notes..."
                      rows={3}
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          description: e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleCreateEvent} className="w-full">
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === 'calendar' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Days header */}
                <div className="grid grid-cols-6 border-b bg-muted/50">
                  <div className="p-3 border-r">
                    <span className="text-sm text-muted-foreground">Time</span>
                  </div>
                  {weekDays.slice(0, 5).map((date) => (
                    <div
                      key={date.toDateString()}
                      className="p-3 border-r last:border-r-0 text-center"
                    >
                      <div>{format(date, 'EEEE')}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(date, 'dd MMM')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="relative">
                  <div className="grid grid-cols-6">
                    <div className="border-r">
                      {hourlySlots.map((slot) => (
                        <div
                          key={slot.time}
                          className="h-16 border-b flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground"
                        >
                          {slot.label}
                        </div>
                      ))}
                    </div>

                    {days.map((day) => (
                      <div
                        key={day}
                        className="border-r last:border-r-0 relative"
                      >
                        {hourlySlots.map((slot) => (
                          <div key={slot.time} className="h-16 border-b" />
                        ))}

                        <div className="absolute inset-0 pointer-events-none">
                          {getEventsByDay(day).map((event) => {
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
          </CardContent>
        </Card>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {days.map((day) => {
            const events = getEventsByDay(day);
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle>{day}</CardTitle>
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
        </div>
      )}

      {/* Summary section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
        <div className="text-center space-y-1">
          <div className="text-3xl">{schedule.length}</div>
          <div className="text-sm text-muted-foreground">Total Events</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-3xl">
            {schedule.filter((e) => e.type === 'class').length}
          </div>
          <div className="text-sm text-muted-foreground">Classes</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-3xl">
            {schedule.filter((e) => e.type === 'meeting').length}
          </div>
          <div className="text-sm text-muted-foreground">Meetings</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-3xl">
            {schedule.filter((e) => e.type === 'exam').length}
          </div>
          <div className="text-sm text-muted-foreground">Exams</div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-3xl">{days.length}</div>
          <div className="text-sm text-muted-foreground">Days/Week</div>
        </div>
      </div>
    </div>
  );
}
