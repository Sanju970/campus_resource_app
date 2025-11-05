import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import EventsPage from './components/EventsPage';
import AnnouncementsPage from './components/AnnouncementsPage';
import MaterialsPage from './components/MaterialsPage';
import ResourcesPage from './components/ResourcesPage';
import SchedulePage from './components/SchedulePage';
import ProfilePage from './components/ProfilePage';
import NotificationsPage from './components/NotificationsPage';
import FavoritesPage from './components/FavoritesPage';
import AIChat from './components/AIChat';
import { Toaster } from './components/ui/sonner';
import { sampleNotifications } from './types/notifications';
import AdminPage from './components/AdminPage';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage('home');
    }
  }, [isAuthenticated]);
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const unreadNotificationCount = sampleNotifications.filter(n => !n.is_read).length;

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onNavigate={setCurrentPage} />;
      case 'events': return <EventsPage />;
      case 'announcements': return <AnnouncementsPage />;
      case 'materials': return <MaterialsPage />;
      case 'resources': return <ResourcesPage />;
      case 'schedule': return <SchedulePage />;
      case 'profile': return <ProfilePage />;
      case 'notifications': return <NotificationsPage />;
      case 'favorites': return <FavoritesPage />;
      case 'admin': return <AdminPage />;
      default: return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      notificationCount={unreadNotificationCount}
    >
      {renderPage()}
      <AIChat />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}
