import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('campusPortalUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email, password, role) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      role,
      department:
        role === 'student'
          ? 'Computer Science'
          : role === 'faculty'
          ? 'Computer Science'
          : 'Administration',
      studentId: role === 'student' ? 'STU' + Math.floor(Math.random() * 10000) : undefined,
      facultyId: role === 'faculty' ? 'FAC' + Math.floor(Math.random() * 10000) : undefined,
      adminId: role === 'admin' ? 'ADM' + Math.floor(Math.random() * 10000) : undefined,
      joinDate: '2023-09-01',
    };

    setUser(mockUser);
    localStorage.setItem('campusPortalUser', JSON.stringify(mockUser));
  };

  const signup = async (email, password, name, role) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role,
      department:
        role === 'student'
          ? 'Computer Science'
          : role === 'faculty'
          ? 'Computer Science'
          : 'Administration',
      studentId: role === 'student' ? 'STU' + Math.floor(Math.random() * 10000) : undefined,
      joinDate: new Date().toISOString().split('T')[0],
    };

    setUser(mockUser);
    localStorage.setItem('campusPortalUser', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('campusPortalUser');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

