// frontend/src/components/HomePage.jsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Briefcase,
  Clock,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notificationCount, setNotificationCount] = useState(0);
  const [orgCount, setOrgCount] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  const userName = user?.first_name ? `${user.first_name} ${user.last_name}` : 'User';

  // Updated quick links
  const quickLinks = [
    { title: 'Campus Events', icon: Calendar, path: '/events', color: 'bg-blue-500' },
    { title: 'Announcements', icon: Bell, path: '/announcements', color: 'bg-green-500' },
    { title: 'Schedule', icon: Clock, path: '/schedule', color: 'bg-purple-500' },
    { title: 'Browse Organizations', icon: BookOpen, path: '/organizations', color: 'bg-orange-500' },
  ];

  // Role-specific content; student stats now use org + event counts
  const getRoleSpecificContent = () => {
    const role = user?.role || user?.role_id;

    if (role === 1 || role === '1' || role === 'student') {
      return {
        welcome: `Welcome back, ${userName}!`,
        subtitle: "Here's your personalized dashboard",
        stats: [
          { label: 'Current Organizations', value: orgCount, icon: BookOpen },
          { label: 'Upcoming Events', value: upcomingEventsCount, icon: Calendar },
          { label: 'Notifications', value: notificationCount, icon: Bell },
        ],
      };
    }

    if (role === 2 || role === '2' || role === 'faculty') {
      return {
        welcome: `Welcome, Professor ${userName}`,
        subtitle: 'Manage your classes and students',
        stats: [
          { label: 'Active Courses', value: '3', icon: BookOpen },
          { label: 'Students Enrolled', value: '87', icon: GraduationCap },
          { label: 'Office Hours Today', value: '2', icon: Clock },
        ],
      };
    }

    if (role === 3 || role === '3' || role === 'admin') {
      return {
        welcome: `Welcome, ${userName}`,
        subtitle: 'Campus administration overview',
        stats: [
          { label: 'Total Students', value: '2,543', icon: GraduationCap },
          { label: 'Faculty Members', value: '187', icon: Briefcase },
          { label: 'Active Events', value: '12', icon: Calendar },
        ],
      };
    }

    return {
      welcome: `Welcome, ${userName}!`,
      subtitle: 'Your campus portal',
      stats: [],
    };
  };

  const content = getRoleSpecificContent();

  // Notifications count (already wired)
  useEffect(() => {
    async function fetchNotificationCount() {
      if (!user?.user_id) return;
      try {
        const res = await fetch(`http://localhost:5000/api/notifications/user/${user.user_id}`);
        const data = await res.json();
        const unread = data.filter((n) => !n.is_read).length;
        setNotificationCount(unread);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    }
    fetchNotificationCount();
  }, [user?.user_id]);

  // New: fetch organizations & upcoming events counts + recent activity
  useEffect(() => {
    if (!user?.user_id) return;

    async function fetchDashboardData() {
      try {
        // Adjust endpoints to match your backend routes
        const [orgRes, eventsRes, activityRes] = await Promise.all([
          fetch(`http://localhost:5000/api/organizations/user/${user.user_id}`),
          fetch(`http://localhost:5000/api/events/user/${user.user_id}?upcoming=true`),
          fetch(`http://localhost:5000/api/activity/user/${user.user_id}`),
        ]);

        const orgData = await orgRes.json();
        const eventsData = await eventsRes.json();
        const activityData = await activityRes.json();

        setOrgCount(Array.isArray(orgData) ? orgData.length : 0);
        setUpcomingEventsCount(Array.isArray(eventsData) ? eventsData.length : 0);

        // Expecting activity objects like: { title, description, timeAgo }
        setRecentActivity(
          Array.isArray(activityData)
            ? activityData
            : []
        );
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    }

    fetchDashboardData();
  }, [user?.user_id]);

  // Handler for AI button: tell AIChat to open
  const openAssistant = () => {
    window.dispatchEvent(new Event('open-ai-assistant'));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white p-8 md:p-12">
        <div className="relative z-10 space-y-4">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {String(user?.role || user?.role_id || '').toUpperCase()}
          </Badge>
          <h1 className="text-3xl font-bold">{content.welcome}</h1>
          <p className="text-lg text-white/90">{content.subtitle}</p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/people')}
            >
              Explore Other Users
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => navigate('/schedule')}
            >
              View Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {content.stats.map((stat, index) => {
          const Icon = stat.icon;
          const isNotifications = stat.label === 'Notifications';
          return (
            <Card
              key={index}
              className={isNotifications ? 'cursor-pointer hover:bg-blue-100/30 transition' : ''}
              onClick={isNotifications ? () => navigate('/notifications') : undefined}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(link.path)}
              >
                <div className="h-24 flex items-center justify-center px-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-lg ${link.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-base font-medium m-0 leading-none">
                      {link.title}
                    </CardTitle>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            )}
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {activity.timeAgo || activity.time || ''}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Assistant Info */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardHeader>
            <CardTitle>AI Campus Assistant</CardTitle>
            <CardDescription>Get instant help with campus resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Click the AI assistant button in the bottom-right corner or use the button below to get help with:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Finding resources and services
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Getting directions on campus
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Answering common questions
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                Finding study spaces and hours
              </li>
            </ul>
            <Button variant="outline" className="w-full" onClick={openAssistant}>
              Try AI Assistant
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
