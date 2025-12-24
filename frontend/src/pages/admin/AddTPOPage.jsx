import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, User, Phone, Briefcase, Linkedin, ArrowLeft, UserPlus } from 'lucide-react';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header
        title="Add TPO"
        subtitle="Create TPO profile"
        showTitleInHeader={false}
        icon={Users}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onIconClick={() => navigate('/admin-dashboard')}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 pt-24 w-full">


      {/* Form Container - Scrollable area for mobile */}
      <div className="flex-1 w-full flex items-center justify-center p-1 md:p-8">
        <div className="w-full max-w-2xl mx-auto h-full md:h-auto">
          <div className="mb-4">
            <h1 className="text-base md:text-xl font-semibold text-gray-900">Add TPO</h1>
            <p className="text-sm text-gray-600 mt-1">Create TPO profile</p>
          </div>
          {/* Mobile container - no scroll, 2 fields per row - compact */}
          <div className="md:hidden px-1 pb-4">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-sm px-2 py-2 w-full"
            >              {toast && (
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
                {/* Name */}
                <div className="flex flex-col">
                  <label htmlFor="name-mobile" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Full Name</span>
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
                    className="border border-blue-200 bg-blue-50 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

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
                    placeholder="Enter email"
                    value={tpoData.email}
                    onChange={handleChange}
                    className="border border-blue-200 bg-blue-50 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col">
                  <label htmlFor="phone-mobile" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Phone className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Phone Number</span>
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
                    className="border border-blue-200 bg-blue-50 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* Experience */}
                <div className="flex flex-col">
                  <label htmlFor="experience-mobile" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Briefcase className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Experience (Years)</span>
                  </label>
                  <input
                    id="experience-mobile"
                    type="number"
                    name="experience"
                    min={0}
                    placeholder="Years of experience"
                    value={tpoData.experience}
                    onChange={handleChange}
                    className="border border-blue-200 bg-blue-50 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* LinkedIn */}
                <div className="flex flex-col">
                  <label htmlFor="linkedIn-mobile" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Linkedin className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">LinkedIn Profile</span>
                  </label>
                  <input
                    id="linkedIn-mobile"
                    type="url"
                    name="linkedIn"
                    placeholder="LinkedIn URL"
                    value={tpoData.linkedIn}
                    onChange={handleChange}
                    className="border border-blue-200 bg-blue-50 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded-md font-medium w-full flex items-center gap-2 justify-center transition hover:bg-blue-700 disabled:opacity-70"
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? 'Adding TPO...' : 'Add TPO'}
                </button>
              </div>
            </form>
          </div>

          {/* Desktop form */}
          <form
            onSubmit={handleSubmit}
            className="hidden md:block bg-white rounded-2xl shadow-lg p-6 w-full"
          >

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {toast && (
                <ToastNotification
                  type={toast.type}
                  message={toast.message}
                  onClose={() => setToast(null)}
                />
              )}
              {/* Name */}
              <div className="flex flex-col">
                <label htmlFor="name-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <User className="mr-2 h-4 w-4 text-blue-600" /> Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="name-desktop"
                  type="text"
                  name="name"
                  required
                  placeholder="Enter name"
                  value={tpoData.name}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              
              {/* Email */}
              <div className="flex flex-col">
                <label htmlFor="email-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Mail className="mr-2 h-4 w-4 text-blue-600" /> Email <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="email-desktop"
                  type="email"
                  name="email"
                  required
                  placeholder="Enter email"
                  value={tpoData.email}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              
              {/* Phone */}
              <div className="flex flex-col">
                <label htmlFor="phone-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Phone className="mr-2 h-4 w-4 text-blue-600" /> Phone <span className="text-red-500 ml-1">*</span>
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
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              
              {/* Experience */}
              <div className="flex flex-col">
                <label htmlFor="experience-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Briefcase className="mr-2 h-4 w-4 text-blue-600" /> Experience (Years)
                </label>
                <input
                  id="experience-desktop"
                  type="number"
                  name="experience"
                  min={0}
                  placeholder="Years of experience"
                  value={tpoData.experience}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              
              {/* LinkedIn */}
              <div className="flex flex-col col-span-2">
                <label htmlFor="linkedIn-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Linkedin className="mr-2 h-4 w-4 text-blue-600" /> LinkedIn Profile
                </label>
                <input
                  id="linkedIn-desktop"
                  type="url"
                  name="linkedIn"
                  placeholder="LinkedIn URL"
                  value={tpoData.linkedIn}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
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
                {loading ? 'Adding...' : 'Add TPO'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </main>
      <Footer />
    </div> 
  );
};

export default AddTPOPage;