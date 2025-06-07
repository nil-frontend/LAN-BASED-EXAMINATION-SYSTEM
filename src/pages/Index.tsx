
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/auth/AuthPage';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  // Super admin and admin both use the same dashboard
  if (profile.is_super_admin || profile.is_admin) {
    return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  if (profile.is_student) {
    return <StudentDashboard />;
  }

  return <AuthPage />;
};

export default Index;
