import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Home, Info, Calendar, User, LogOut, GraduationCap, Bell, Heart, CalendarDays } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children, notificationCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'events', label: 'Events', icon: CalendarDays, path: '/events' },
    { id: 'announcements', label: 'Announcements', icon: Bell, path: '/announcements' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/schedule' },
    { id: 'resources', label: 'About us', icon: Info, path: '/resources' },

  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'student':
        return 'bg-blue-500';
      case 'faculty':
        return 'bg-green-500';
      case 'admin':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background dark:bg-slate-900 sticky top-0 z-50 h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Campus Portal</span>
          </div>
          

          {/* Desktop Navigation - solid bg */}
          <nav className="hidden md:flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative cursor-pointer rounded-full hover:ring-2 hover:ring-primary/40 transition-all">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`${getRoleBadgeColor(user?.role || '')} text-white font-semibold`}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'user@email.com'}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Role: {user?.role || 'student'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/notifications')}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                {notificationCount > 0 && (
                  <Badge variant="destructive" className="ml-auto h-5 px-1.5">
                    {notificationCount}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/favorites')}>
                <Heart className="mr-2 h-4 w-4" />
                Favorites
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Users className="mr-2 h-4 w-4" />
                  User Data
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Navigation - solid bg */}
      <nav className="md:hidden border-b bg-white dark:bg-slate-900 p-2">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-16 px-2 md:px-4">
        {children}
      </main>
    </div>
  );
}
