import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, UserCog, ArrowLeft, UserPlus } from 'lucide-react';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/add-admin`, {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header
        title="Add Admin"
        subtitle="Create admin profile"
        showTitleInHeader={false}
        icon={Shield}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onIconClick={() => navigate('/admin-dashboard')}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 pt-24 w-full">


      {/* Form Container - Scrollable area for mobile */}
      <div className="flex-1 w-full flex items-center justify-center p-1 md:p-8">
        <div className="w-full max-w-2xl mx-auto h-full md:h-auto">
          <div className="mb-4">
            <h1 className="text-base md:text-xl font-semibold text-gray-900">Add Admin</h1>
            <p className="text-sm text-gray-600 mt-1">Create admin profile</p>
          </div>
          {/* Mobile container - non-scrollable, wider form, 2 fields per row - compact */}
          <div className="md:hidden px-1 pb-4">
            <form
              onSubmit={submitHandler}
              className="bg-white rounded-xl shadow-sm px-2 py-2 w-full"
            >
              {toast && (
                <ToastNotification
                  type={toast.type}
                  message={toast.message}
                  onClose={() => setToast(null)}
                />
              )}
              {/* Mobile Form Title */}
              {/* <div className="mb-1 text-center">
                <h2 className="text-sm font-medium text-gray-900 mb-1">Enter Details</h2>
                <div className="w-8 h-0.5 bg-blue-600 mx-auto rounded-full mb-1"></div>
              </div> */}
              <div className="grid grid-cols-2 gap-2">
                {/* Email */}
                <div className="flex flex-col">
                  <label htmlFor="email-mobile" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Mail className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Email Address</span>
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
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>
                {/* Role */}
                <div className="flex flex-col">
                  <label htmlFor="role-mobile" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <UserCog className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Admin Role & Permissions</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="role-mobile"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white text-blue-900"
                    aria-label="Select Admin Role"
                  >
                    {AdminLevels.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                {/* Role Description */}
                {/* <div className="bg-blue-50 p-3 rounded-md">
                  <h3 className="font-medium text-blue-700 mb-1 text-sm">Selected Role Permissions:</h3>
                  <p className="text-xs text-blue-600">
                    {AdminLevels.find(level => level.value === role)?.label}
                  </p>
                </div> */}
              </div>
              {/* Submit Button */}
              <div className="mt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded-md font-medium w-full flex items-center gap-2 justify-center transition hover:bg-blue-700 disabled:opacity-70"
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? 'Adding Admin...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
          {/* Desktop form */}
          <form
            onSubmit={submitHandler}
            className="hidden md:block bg-white rounded-2xl shadow-lg p-6 w-full"
          >
            {toast && (
              <ToastNotification
                type={toast.type}
                message={toast.message}
                onClose={() => setToast(null)}
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex flex-col">
                <label htmlFor="email-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Mail className="mr-2 h-4 w-4 text-blue-600" /> Email Address <span className="text-red-500 ml-1">*</span>
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
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              {/* Role */}
              <div className="flex flex-col">
                <label htmlFor="role-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <UserCog className="mr-2 h-4 w-4 text-blue-600" /> Admin Role & Permissions <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="role-desktop"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-900"
                  aria-label="Select Admin Role"
                >
                  {AdminLevels.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              {/* Role Description */}
              {/* <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2">Selected Role Permissions:</h3>
                <p className="text-sm text-blue-600">
                  {AdminLevels.find(level => level.value === role)?.label}
                </p>
              </div> */}
            </div>
            {/* Action Buttons */}
            <div className="flex flex-row justify-between mt-6 gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin-dashboard')}
                disabled={loading}
                className="px-4 py-2 text-sm bg-black text-white rounded-md font-semibold w-1/2 transition hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md font-semibold w-1/2 flex items-center gap-2 justify-center transition hover:bg-blue-700"
              >
                <UserPlus className="h-5 w-5" />
                {loading ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </main>
      <Footer />
    </div> 
  );
}

export default AddAdmin;