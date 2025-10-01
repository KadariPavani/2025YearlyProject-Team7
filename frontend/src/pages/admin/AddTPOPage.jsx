import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, User, Phone, Briefcase, Linkedin, ArrowLeft, UserPlus } from 'lucide-react';
import ToastNotification from '../../components/ui/ToastNotification';

const AddTPOPage = () => {
  const navigate = useNavigate();

  const [tpoData, setTpoData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    linkedIn: ''
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setTpoData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-tpo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          ...tpoData,
          experience: parseInt(tpoData.experience) || 0,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('success', 'TPO added successfully! Credentials sent to their email.');
        setTimeout(() => navigate('/admin-dashboard'), 3000);
      } else {
        showToast('error', result.message);
      }
    } catch {
      showToast('error', 'Failed to add TPO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Mobile Header - Fixed at top for mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-4 shadow-lg" style={{ backgroundColor: '#eceafe' }}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center text-[#7c6ee7] hover:text-[#6f5ee7] transition-colors"
          >
            <ArrowLeft className="h-6 w-6 mr-2" />
            <span className="font-medium">Back</span>
          </button>
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-white/30 backdrop-blur-sm rounded-full p-3 mr-4">
            <Users
              size={32}
              className="text-[#7c6ee7]"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#7c6ee7]">Add New TPO</h1>
            <p className="text-[#6f5ee7] text-sm">Create TPO profile</p>
          </div>
        </div>
      </div>

      {/* Mobile Spacer - Pushes content below fixed header */}
      <div className="md:hidden h-32"></div>

      {/* Left side with icon - Only visible on desktop */}
      <div className="hidden md:flex md:w-1/3 flex-col items-center justify-center p-12 shadow-lg rounded-r-3xl" style={{ backgroundColor: '#eceafe' }}>
        <Users
          size={120}
          className="text-[#7c6ee7]"
          strokeWidth={1.5}
        />
        <h2 className="mt-6 text-2xl font-bold text-gray-900 text-center">
          Add TPO
        </h2>
        <p className="mt-2 text-center text-gray-800 max-w-xs">
          Fill in the details below to create a new TPO account.
        </p>
      </div>

      {/* Form Container - Scrollable area for mobile */}
      <div className="flex-1 md:w-2/3 flex items-center justify-center md:p-8">
        <div className="w-full max-w-3xl mx-auto h-full md:h-auto">
          {/* Mobile scrollable container */}
          <div className="md:hidden h-screen overflow-y-auto px-4 pb-6" style={{ height: 'calc(100vh - 8rem)' }}>
            <form
              onSubmit={handleSubmit}
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">TPO Details</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-[#7c6ee7] to-[#6f5ee7] mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Name */}
                <div className="flex flex-col">
                  <label htmlFor="name-mobile" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#eceafe] rounded-full mr-3">
                      <User className="h-4 w-4 text-[#7c6ee7]" />
                    </div>
                    <span>Full Name</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="name-mobile"
                    type="text"
                    name="name"
                    required
                    placeholder="Enter name"
                    value={tpoData.name}
                    onChange={handleChange}
                    className="border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#7c6ee7] focus:border-transparent transition-all"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col">
                  <label htmlFor="email-mobile" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#eceafe] rounded-full mr-3">
                      <Mail className="h-4 w-4 text-[#7c6ee7]" />
                    </div>
                    <span>Email Address</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="email-mobile"
                    type="email"
                    name="email"
                    required
                    placeholder="Enter email"
                    value={tpoData.email}
                    onChange={handleChange}
                    className="border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#7c6ee7] focus:border-transparent transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col">
                  <label htmlFor="phone-mobile" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#eceafe] rounded-full mr-3">
                      <Phone className="h-4 w-4 text-[#7c6ee7]" />
                    </div>
                    <span>Phone Number</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="phone-mobile"
                    type="tel"
                    name="phone"
                    required
                    maxLength={10}
                    placeholder="10-digit phone"
                    value={tpoData.phone}
                    onChange={handleChange}
                    className="border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#7c6ee7] focus:border-transparent transition-all"
                  />
                </div>

                {/* Experience */}
                <div className="flex flex-col">
                  <label htmlFor="experience-mobile" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#eceafe] rounded-full mr-3">
                      <Briefcase className="h-4 w-4 text-[#7c6ee7]" />
                    </div>
                    <span>Experience (Years)</span>
                  </label>
                  <input
                    id="experience-mobile"
                    type="number"
                    name="experience"
                    min={0}
                    placeholder="Years of experience"
                    value={tpoData.experience}
                    onChange={handleChange}
                    className="border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#7c6ee7] focus:border-transparent transition-all"
                  />
                </div>

                {/* LinkedIn */}
                <div className="flex flex-col">
                  <label htmlFor="linkedIn-mobile" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#eceafe] rounded-full mr-3">
                      <Linkedin className="h-4 w-4 text-[#7c6ee7]" />
                    </div>
                    <span>LinkedIn Profile</span>
                  </label>
                  <input
                    id="linkedIn-mobile"
                    type="url"
                    name="linkedIn"
                    placeholder="LinkedIn URL"
                    value={tpoData.linkedIn}
                    onChange={handleChange}
                    className="border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#7c6ee7] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-4 bg-gradient-to-r from-[#7c6ee7] to-[#6f5ee7] text-white rounded-lg font-semibold w-full flex items-center gap-2 justify-center transition hover:from-[#6f5ee7] hover:to-[#5a4bd4] shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:opacity-70"
                >
                  <UserPlus className="h-5 w-5" />
                  {loading ? 'Adding TPO...' : 'Add TPO'}
                </button>
              </div>
            </form>
          </div>

          {/* Desktop form */}
          <form
            onSubmit={handleSubmit}
            className="hidden md:block bg-white rounded-2xl shadow-2xl p-10 w-full"
          >
            {toast && (
              <ToastNotification
                type={toast.type}
                message={toast.message}
                onClose={() => setToast(null)}
              />
            )}

            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              {/* Name */}
              <div className="flex flex-col">
                <label htmlFor="name-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <User className="mr-2 h-4 w-4 text-[#7c6ee7]" /> Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="name-desktop"
                  type="text"
                  name="name"
                  required
                  placeholder="Enter name"
                  value={tpoData.name}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7c6ee7]"
                />
              </div>
              
              {/* Email */}
              <div className="flex flex-col">
                <label htmlFor="email-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Mail className="mr-2 h-4 w-4 text-[#7c6ee7]" /> Email <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="email-desktop"
                  type="email"
                  name="email"
                  required
                  placeholder="Enter email"
                  value={tpoData.email}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7c6ee7]"
                />
              </div>
              
              {/* Phone */}
              <div className="flex flex-col">
                <label htmlFor="phone-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Phone className="mr-2 h-4 w-4 text-[#7c6ee7]" /> Phone <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="phone-desktop"
                  type="tel"
                  name="phone"
                  required
                  maxLength={10}
                  placeholder="10-digit phone"
                  value={tpoData.phone}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7c6ee7]"
                />
              </div>
              
              {/* Experience */}
              <div className="flex flex-col">
                <label htmlFor="experience-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Briefcase className="mr-2 h-4 w-4 text-[#7c6ee7]" /> Experience (Years)
                </label>
                <input
                  id="experience-desktop"
                  type="number"
                  name="experience"
                  min={0}
                  placeholder="Years of experience"
                  value={tpoData.experience}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7c6ee7]"
                />
              </div>
              
              {/* LinkedIn */}
              <div className="flex flex-col col-span-2">
                <label htmlFor="linkedIn-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Linkedin className="mr-2 h-4 w-4 text-[#7c6ee7]" /> LinkedIn Profile
                </label>
                <input
                  id="linkedIn-desktop"
                  type="url"
                  name="linkedIn"
                  placeholder="LinkedIn URL"
                  value={tpoData.linkedIn}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7c6ee7]"
                />
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
                className="px-7 py-3 bg-gradient-to-r from-[#7c6ee7] to-[#6f5ee7] text-white rounded-lg font-semibold w-1/2 flex items-center gap-2 justify-center transition hover:from-[#6f5ee7] hover:to-[#5a4bd4]"
              >
                <UserPlus className="h-5 w-5" />
                {loading ? 'Adding...' : 'Add TPO'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTPOPage;