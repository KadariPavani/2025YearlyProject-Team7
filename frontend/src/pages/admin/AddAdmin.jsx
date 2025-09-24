import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, UserCog, ArrowLeft, UserPlus } from 'lucide-react';
import ToastNotification from '../../components/ui/ToastNotification';

const AdminLevels = [
  { value: "super_admin", label: "Super Admin (All Access)" },
  { value: "admin_level_1", label: "Admin Level 1 (Add Trainer/TPO/Activity)" },
  { value: "admin_level_2", label: "Admin Level 2 (Add Trainer/Activity)" },
  { value: "admin_level_3", label: "Admin Level 3 (View Activity Only)" }
];

function AddAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin_level_3");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("adminToken");

    try {
      const response = await fetch('/api/admin/add-admin', {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ email, role })
      });

      const data = await response.json();

      if (data.success) {
        showToast('success', 'Admin added successfully! Login credentials sent via email.');
        setEmail("");
        setRole("admin_level_3");
        setTimeout(() => navigate('/admin-dashboard'), 3000);
      } else {
        showToast('error', data.message || 'Failed to add admin');
      }
    } catch {
      showToast('error', 'Request failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Mobile Header - Fixed at top for mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-4 shadow-lg" style={{ backgroundColor: '#e9d5ff' }}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center text-purple-700 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 mr-2" />
            <span className="font-medium">Back</span>
          </button>
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-white/30 backdrop-blur-sm rounded-full p-3 mr-4">
            <Shield
              size={32}
              className="text-purple-700"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-purple-700">Add New Admin</h1>
            <p className="text-purple-600 text-sm">Create admin profile</p>
          </div>
        </div>
      </div>

      {/* Mobile Spacer - Pushes content below fixed header */}
      <div className="md:hidden h-32"></div>

      {/* Left side with icon - Only visible on desktop */}
      <div className="hidden md:flex md:w-1/3 flex-col items-center justify-center p-12 shadow-lg rounded-r-3xl" style={{ backgroundColor: '#e9d5ff' }}>
        <Shield
          size={120}
          className="text-purple-700"
          strokeWidth={1.5}
        />
        <h2 className="mt-6 text-2xl font-bold text-gray-900 text-center">
          Add Admin
        </h2>
        <p className="mt-2 text-center text-gray-800 max-w-xs">
          Create a new admin account with specified access level and permissions.
        </p>
      </div>

      {/* Form Container - Scrollable area for mobile */}
      <div className="flex-1 md:w-2/3 flex items-center justify-center md:p-8">
        <div className="w-full max-w-3xl mx-auto h-full md:h-auto">
          {/* Mobile scrollable container */}
          <div className="md:hidden h-screen overflow-y-auto px-4 pb-6" style={{ height: 'calc(100vh - 8rem)' }}>
            <form
              onSubmit={submitHandler}
              className="bg-white rounded-xl shadow-lg p-6 w-full"
            >
              {toast && (
                <ToastNotification
                  type={toast.type}
                  message={toast.message}
                  onClose={() => setToast(null)}
                />
              )}

              {/* Mobile Form Title */}
              <div className="mb-8 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Details</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-purple-600 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Email */}
                <div className="flex flex-col">
                  <label htmlFor="email-mobile" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mr-3">
                      <Mail className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Email Address</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="email-mobile"
                    type="email"
                    name="email"
                    required
                    placeholder="Enter admin email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="username"
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  />
                </div>

                {/* Role */}
                <div className="flex flex-col">
                  <label htmlFor="role-mobile" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mr-3">
                      <UserCog className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Admin Role & Permissions</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="role-mobile"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all bg-white"
                    aria-label="Select Admin Role"
                  >
                    {AdminLevels.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Role Description */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-700 mb-2">Selected Role Permissions:</h3>
                  <p className="text-sm text-purple-600">
                    {AdminLevels.find(level => level.value === role)?.label}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold w-full flex items-center gap-2 justify-center transition hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:opacity-70"
                >
                  <UserPlus className="h-5 w-5" />
                  {loading ? 'Adding Admin...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>

          {/* Desktop form */}
          <form
            onSubmit={submitHandler}
            className="hidden md:block bg-white rounded-2xl shadow-2xl p-10 w-full"
          >
            {toast && (
              <ToastNotification
                type={toast.type}
                message={toast.message}
                onClose={() => setToast(null)}
              />
            )}

            <div className="space-y-6">
              {/* Email */}
              <div className="flex flex-col">
                <label htmlFor="email-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Mail className="mr-2 h-4 w-4 text-purple-600" /> Email Address <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="email-desktop"
                  type="email"
                  name="email"
                  required
                  placeholder="Enter admin email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Role */}
              <div className="flex flex-col">
                <label htmlFor="role-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <UserCog className="mr-2 h-4 w-4 text-purple-600" /> Admin Role & Permissions <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="role-desktop"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  aria-label="Select Admin Role"
                >
                  {AdminLevels.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Role Description */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-700 mb-2">Selected Role Permissions:</h3>
                <p className="text-sm text-purple-600">
                  {AdminLevels.find(level => level.value === role)?.label}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row justify-between mt-10 gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin-dashboard')}
                disabled={loading}
                className="px-7 py-3 bg-black text-white rounded-lg font-semibold w-1/2 transition hover:bg-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-7 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold w-1/2 flex items-center gap-2 justify-center transition hover:from-purple-600 hover:to-purple-700"
              >
                <UserPlus className="h-5 w-5" />
                {loading ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddAdmin;