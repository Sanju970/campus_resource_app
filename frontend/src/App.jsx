import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import EventsPage from './components/EventsPage';
import AnnouncementsPage from './components/AnnouncementsPage';
import OrganizationsPage from './components/OrganizationsPage';
import SchedulePage from './components/SchedulePage';
import ProfilePage from './components/ProfilePage';
import NotificationsPage from './components/NotificationsPage';
import FavoritesPage from './components/FavoritesPage';
import AdminPage from './components/AdminPage';
import AIChat from './components/AIChat';
import { Toaster } from './components/ui/sonner';
import { useEffect, useState as useReactState } from 'react';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import OrganizationDetails from './components/OrganizationDetails';
import UserPublicProfile from "./components/UserPublicProfile";
import AllUsersPage from "./components/AllUsersPage";
import LocationsPage from "./components/LocationsPage";
import EventMembersPage from "./components/EventMembersPage";
import AboutPage from './components/AboutPage'; 
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useReactState(true);

  // Restore user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && !user) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user:", err);
      }
    }
    setLoading(false);
  }, [user, setUser]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>

      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route element={<Layout />}>
        <Route path="/about" element={<AboutPage />} />
      </Route>


      {/* ALL PRIVATE ROUTES */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:eventId/members" element={<EventMembersPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="organizations/:orgId" element={<OrganizationDetails />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="my-events" element={<EventsPage />} />
        <Route path="users/:userId" element={<UserPublicProfile />} />
        <Route path="people" element={<AllUsersPage />} />

        {/* Admin-only */}
        <Route
          path="admin"
          element={
            user?.role === 3 || user?.role === "3" || user?.role === "admin"
              ? <AdminPage />
              : <Navigate to="/" replace />
          }
        />

        <Route
          path="locations"
          element={
            user?.role === 3 || user?.role === "3" || user?.role === "admin"
              ? <LocationsPage />
              : <Navigate to="/" replace />
          }
        />
      </Route>

      {/* CATCH-ALL */}
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
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
