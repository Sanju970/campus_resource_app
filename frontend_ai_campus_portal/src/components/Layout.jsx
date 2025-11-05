import React from 'react';
import { Users } from 'lucide-react';
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
import { Home, BookOpen, Calendar, User, LogOut, GraduationCap, Bell, FileText, CalendarDays, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children, currentPage, onNavigate, notificationCount = 0 }) {
  const { user, logout } = useAuth();

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
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
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Campus Portal</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate(item.id)}
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

              <DropdownMenuItem onClick={() => onNavigate('profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onNavigate('notifications')}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                {notificationCount > 0 && (
                  <Badge variant="destructive" className="ml-auto h-5 px-1.5">
                    {notificationCount}
                  </Badge>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onNavigate('favorites')}>
                <Heart className="mr-2 h-4 w-4" />
                Favorites
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => onNavigate('admin')}>
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

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-background p-2">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onNavigate(item.id)}
                className="flex-1"
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
