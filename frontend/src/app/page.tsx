'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import FileUpload from '@/components/FileUpload';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on component mount
    setAuthenticated(isAuthenticated());
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <main>
      {authenticated ? (
        <FileUpload onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </main>
  );
}