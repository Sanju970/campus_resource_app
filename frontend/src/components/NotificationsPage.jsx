import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Check, Info, AlertTriangle, CheckCircle, XCircle, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch notifications for this user
    fetch(`http://localhost:5000/api/notifications/user/${user.user_id}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(console.error);
  }, [user.user_id]);

  const markAsRead = async (notificationId) => {
    await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, { method: 'PUT' });
    setNotifications(notifications.map(notif =>
      notif.notification_id === notificationId
        ? { ...notif, is_read: 1 }
        : notif
    ));
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    // Mark all on backend in parallel
    await Promise.all(unreadNotifications.map(n =>
      fetch(`http://localhost:5000/api/notifications/${n.notification_id}/read`, { method: 'PUT' })
    ));
    // Update state once after all are marked read
    setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
  };

  const deleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');
      setNotifications(notifications.filter(notif => notif.notification_id !== notificationId));
    } catch (error) {
      console.error(error);
      // Optionally show toast or alert for failure
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'announcement':
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1>Notifications</h1>
        <p className="text-muted-foreground">Stay updated with your campus activities</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No notifications
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`p-4 rounded-lg border ${
                  notification.is_read ? 'bg-background' : 'bg-muted/50'
                } hover:bg-muted/70 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={notification.is_read ? '' : 'font-medium'}>
                        {notification.message}
                      </p>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.notification_id)}
                        >
                          Mark as read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.notification_id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
