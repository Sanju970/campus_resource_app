// src/components/HomePage.jsx
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Briefcase,
  Clock,
  Bell,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notificationCount, setNotificationCount] = useState(0);
  const [orgCount, setOrgCount] = useState(0);
  const [rsvpedCount, setRsvpedCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name}`
    : "User";

  // Quick links – updated
  const quickLinks = [
    {
      title: "Browse Events",
      icon: Calendar,
      path: "/events",
      color: "bg-blue-500",
    },
    {
      title: "Announcements",
      icon: Bell,
      path: "/announcements",
      color: "bg-red-500",
    },
    {
      title: "Schedule",
      icon: Clock,
      path: "/schedule",
      color: "bg-green-500",
    },
    {
      title: "Organizations",
      icon: Users,
      path: "/organizations",
      color: "bg-purple-500",
    },
  ];

  // Role-based hero + stats (now using live counts)
  const getRoleSpecificContent = () => {
    const role = user?.role || user?.role_id;

    // Student
    if (role === 1 || role === "1" || role === "student") {
      return {
        welcome: `Welcome back, ${userName}!`,
        subtitle: "Here's your personalized campus dashboard",
        stats: [
          {
            label: "Current Organizations",
            value: String(orgCount),
            icon: Users,
          },
          {
            label: "Upcoming Events",
            value: String(rsvpedCount),
            icon: Calendar,
          },
          {
            label: "Notifications",
            value: String(notificationCount),
            icon: Bell,
          },
        ],
      };
    }

    // Faculty
    if (role === 2 || role === "2" || role === "faculty") {
      return {
        welcome: `Welcome, Professor ${userName}`,
        subtitle: "Manage your classes and students",
        stats: [
          {
            label: "Current Organizations",
            value: String(orgCount),
            icon: Users,
          },
          {
            label: "Upcoming Events",
            value: String(rsvpedCount),
            icon: Calendar,
          },
          {
            label: "Notifications",
            value: String(notificationCount),
            icon: Bell,
          },
        ],
      };
    }

    // Admin
    if (role === 3 || role === "3" || role === "admin") {
      return {
        welcome: `Welcome, ${userName}`,
        subtitle: "Campus administration overview",
        stats: [
          {
            label: "Current Organizations",
            value: String(orgCount),
            icon: Users,
          },
          {
            label: "Upcoming Events",
            value: String(rsvpedCount),
            icon: Calendar,
          },
          {
            label: "Notifications",
            value: String(notificationCount),
            icon: Bell,
          },
        ],
      };
    }

    // Fallback
    return {
      welcome: `Welcome, ${userName}!`,
      subtitle: "Your campus portal",
      stats: [
        {
          label: "Notifications",
          value: String(notificationCount),
          icon: Bell,
        },
      ],
    };
  };

  const content = getRoleSpecificContent();

  // 1) Fetch notifications (for count + recent activity)
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/notifications/user/${user.user_id}`
        );
        const data = await res.json();

        // unread count
        const unread = (data || []).filter((n) => !n.is_read).length;
        setNotificationCount(unread);

        // recent activity = latest notifications
        const sorted = [...(data || [])].sort((a, b) => {
          const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
          const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
          return bTime - aTime;
        });

        const recent = sorted.slice(0, 5).map((n) => ({
          id: n.notification_id || n.id,
          title: n.title || "Notification",
          description: n.message || "",
          time: new Date(
            n.created_at || n.createdAt || Date.now()
          ).toLocaleString(),
        }));

        setRecentActivity(recent);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, [user?.user_id]);

  // 2) Fetch org + event stats
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchStats = async () => {
      try {
        // Organizations (same endpoint used on Organizations page)
        const orgRes = await api.get("/organizations", {
          params: { user_id: user.user_id },
        });
        const orgs = orgRes.data || [];
        // "My Organizations" = is_member === 1
        const myOrgsCount = orgs.filter(
          (org) => Number(org.is_member) === 1
        ).length;
        setOrgCount(myOrgsCount);
      } catch (err) {
        console.error("Failed to fetch organizations for stats:", err);
      }

      try {
        // Events user has registered for (same endpoint used in EventsPage)
        const regRes = await api.get(`/events/registrations/${user.user_id}`);
        const registrations = regRes.data || [];
        setRsvpedCount(registrations.length);
      } catch (err) {
        console.error("Failed to fetch registered events for stats:", err);
      }
    };

    fetchStats();
  }, [user?.user_id]);

  // Click handler to open the AI chat (AIChat listens for this event)
  const openAssistant = () => {
    window.dispatchEvent(new Event("open-ai-assistant"));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white p-8 md:p-12">
        <div className="relative z-10 space-y-4">
          <Badge className="bg-white/20 text-white border-white/30">
            {String(user?.role || user?.role_id || "").toUpperCase()}
          </Badge>
          <h1 className="text-3xl font-bold">{content.welcome}</h1>
          <p className="text-lg text-white/90">{content.subtitle}</p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/people")}
            >
              Explore Other Users
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => navigate("/schedule")}
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
          const isNotifications = stat.label === "Notifications";
          return (
            <Card
              key={index}
              className={
                isNotifications
                  ? "cursor-pointer hover:bg-blue-100/30 transition"
                  : ""
              }
              onClick={
                isNotifications ? () => navigate("/notifications") : undefined
              }
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
                  <div
                    className={`h-12 w-12 rounded-lg ${link.color} flex items-center justify-center`}
                  >
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


      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent activity yet.
              </p>
            )}
            {recentActivity.map((activity, index) => (
              <div
                key={activity.id || index}
                className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
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
            <CardDescription>
              Get instant help with campus resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Click the AI assistant button in the bottom-right corner, or use
              the button below, to get help with:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Finding and joining organizations
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Seeing what events are happening
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Checking announcements and updates
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Finding study spaces and support services
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
