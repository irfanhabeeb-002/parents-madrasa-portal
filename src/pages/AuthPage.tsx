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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    // Navigation will be handled by the Navigate component above
    // when user state updates
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <PhoneAuthForm onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
};