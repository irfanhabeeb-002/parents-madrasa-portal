import React from 'react';
import { Navigate } from 'react-router-dom';
import { PhoneAuthForm } from '../components/auth/PhoneAuthForm';
import { useAuth } from '../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { user, loading } = useAuth();

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    // Navigation will be handled by the Navigate component above
    // when user state updates
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full">
        <PhoneAuthForm onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
};