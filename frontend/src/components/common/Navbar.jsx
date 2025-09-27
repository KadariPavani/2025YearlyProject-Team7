// Navbar.js
import React, { useState, useRef, useEffect } from "react";
import { LogOut, Bell, Menu } from "lucide-react";

export default function Navbar({ onLogoClick, onLoginClick, isAdmin }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const profile = {
    name: "Admin", // Changed from Student to Admin
    email: "Admin@college.com", // Changed from Student to Admin
    avatar:
      "https://png.pngtree.com/png-clipart/20230102/original/pngtree-business-man-avatar-png-image_8855195.png",
  };

  return (
    <header className="h-16 bg-gradient-to-r from-[#E1DBFF] to-[#1745DA] flex items-center justify-between px-4 md:px-6 text-white shadow relative">
      {/* Left Section - Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
          <img
            src="/logo.svg"
            alt="Infoverse Logo"
            className="h-8 w-auto object-contain"
          />
          <span className="font-semibold text-lg hidden sm:block">INFOVERSE</span>
        </div>
      </div>

      {/* Right Section - Notifications + Profile */}
      <div className="flex items-center gap-5 relative">
        {/* Notification Bell (optional based on usage) */}
        {/* You can show this for authenticated users or hide it based on props */}
        {isAdmin && (
          <div className="relative cursor-pointer">
            <Bell size={22} />
            <span className="absolute -top-1 -right-2 bg-red-600 text-xs rounded-full px-1">
              3
            </span>
          </div>
        )}

        {/* Profile/Login section */}
        {isAdmin ? (
          <>
            {/* Desktop Profile */}
            <div className="hidden md:flex items-center gap-3">
              <img
                src={profile.avatar}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="flex flex-col text-white text-sm">
                <span className="font-semibold">{profile.name}</span>
                <span className="text-xs">{profile.email}</span>
              </div>
            </div>

            {/* Mobile Profile with Dropdown */}
            <div className="md:hidden relative" ref={dropdownRef}>
              <button onClick={() => setProfileOpen(!profileOpen)}>
                <img
                  src={profile.avatar}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover"
                />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-50 flex flex-col">
                  <div className="p-3 border-b">
                    <span className="block font-semibold">{profile.name}</span>
                    <span className="block text-xs text-gray-500">{profile.email}</span>
                  </div>
                  <button
                    className="flex items-center gap-2 p-3 hover:bg-gray-100 text-red-600 font-medium"
                    onClick={onLoginClick}
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={onLoginClick}
            className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg text-sm transition-colors duration-200 hover:bg-red-700"
          >
            LOGIN
          </button>
        )}
      </div>
    </header>
  );
}