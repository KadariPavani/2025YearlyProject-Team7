import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  UserCheck, 
  Shield,
  LogIn,
  ChevronDown
} from 'lucide-react';
import Footer from '../components/common/Footer';

const Landing = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const userTypes = [
    { name: 'TPO', icon: Users, path: '/tpo-login', color: 'text-blue-600', bgColor: 'bg-blue-600' },
    { name: 'Trainer', icon: BookOpen, path: '/trainer-login', color: 'text-green-600', bgColor: 'bg-green-600' },
    { name: 'Student', icon: GraduationCap, path: '/student-login', color: 'text-purple-600', bgColor: 'bg-purple-600' },
    { name: 'Coordinator', icon: UserCheck, path: '/coordinator-login', color: 'text-orange-600', bgColor: 'bg-orange-600' }
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header/Navbar */}
<header className="bg-white shadow-sm fixed w-full top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Navbar row */}
    <div className="flex justify-between items-center py-1">   {/* reduced padding */}
    
            {/* LEFT: Logo (Super Admin redirect) */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => navigate('/super-admin-login')}
          aria-label="Super Admin Login"
        >
<img
  src="/Logo.png"  // or use import if from src folder
  alt="InfoVerse Logo"
  className="h-16 w-16 object-contain cursor-pointer"
/>
              </button>
            </div>

            {/* RIGHT: Login dropdown */}
            <div className="flex items-center" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown((s) => !s)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base"
                  aria-haspopup="true"
                  aria-expanded={showDropdown}
                >
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-medium">Login</span>
                  <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-fadeIn">
                    {userTypes.map((type, index) => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            navigate(type.path);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 transition-all duration-200 text-sm sm:text-base"
                        >
                          <div className={`p-2 rounded-lg ${type.bgColor} bg-opacity-10`}>
                            <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${type.color}`} />
                          </div>
                          <span className="font-medium">{type.name} Login</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Centered Welcome Section */}
      <main className="flex-grow flex flex-col justify-center items-center pt-16 pb-10 px-4">
        <div className="text-center w-full max-w-3xl mx-auto flex flex-col justify-center items-center">
          {/* Hero Section - Centered both vertically and horizontally */}
          <div className="flex flex-col justify-center items-center h-full py-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-indigo-600">InfoVerse</span>
            </h1>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl">
              Your comprehensive dashboard management system for educational institutions
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
