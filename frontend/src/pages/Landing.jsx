import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, BookOpen, GraduationCap, UserCheck, Shield } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const dashboards = [
    { name: 'Admin', icon: Shield, color: 'bg-red-500 hover:bg-red-600', path: '/admin-login' },
    { name: 'TPO', icon: Users, color: 'bg-blue-500 hover:bg-blue-600', path: '/tpo-login' },
    { name: 'Trainer', icon: BookOpen, color: 'bg-green-500 hover:bg-green-600', path: '/trainer-login' },
    { name: 'Student', icon: GraduationCap, color: 'bg-purple-500 hover:bg-purple-600', path: '/student-login' },
    { name: 'Coordinator', icon: UserCheck, color: 'bg-orange-500 hover:bg-orange-600', path: '/coordinator-login' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo/Title */}
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">InfoVerse</h1>
                <p className="text-sm text-gray-600">Dashboard Management System</p>
              </div>
            </div>

            {/* Super Admin Icon */}
            <button
              onClick={() => navigate('/super-admin-login')}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Super Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to InfoVerse
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive dashboard management system for educational institutions
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {dashboards.map((dashboard, index) => {
            const IconComponent = dashboard.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="p-8 text-center">
                  <div className={`w-16 h-16 ${dashboard.color} rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {dashboard.name}
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    Access {dashboard.name.toLowerCase()} dashboard
                  </p>
                  <button
                    onClick={() => navigate(dashboard.path)}
                    className={`w-full ${dashboard.color} text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105`}
                  >
                    Login
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Key Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Secure Access</h4>
              <p className="text-gray-600">Multi-level authentication with OTP verification for admin access</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">User Management</h4>
              <p className="text-gray-600">Comprehensive user management across all dashboard types</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Analytics</h4>
              <p className="text-gray-600">Real-time analytics and reporting for all user activities</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 InfoVerse Team 07. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;