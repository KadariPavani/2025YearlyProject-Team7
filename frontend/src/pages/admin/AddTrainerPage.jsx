import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  User,
  Phone,
  BadgePercent,
  Briefcase,
  Linkedin,
  Book,
  Tag,
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import ToastNotification from '../../components/ui/ToastNotification';

const AddTrainerPage = () => {
  const navigate = useNavigate();

  const [trainerData, setTrainerData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    experience: '',
    linkedIn: '',
    subjectDealing: '',
    category: ''
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setTrainerData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-trainer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          ...trainerData,
          experience: parseInt(trainerData.experience) || 0,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('success', 'Trainer added successfully! Credentials sent to their email.');
        setTimeout(() => navigate('/admin-dashboard'), 3000);
      } else {
        showToast('error', result.message);
      }
    } catch {
      showToast('error', 'Failed to add trainer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Mobile Header - Fixed at top for mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-4 shadow-lg" style={{ backgroundColor: '#c1e2bf' }}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center text-green-900 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 mr-2 text-green-900" />
            <span className="font-medium">Back</span>
          </button>
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-white/30 backdrop-blur-sm rounded-full p-3 mr-4">
            <GraduationCap
              size={32}
              className="text-green-900"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-green-900">Add New Trainer</h1>
            <p className="text-green-700 text-sm">Create trainer profile</p>
          </div>
        </div>
      </div>

      {/* Mobile Spacer - Pushes content below fixed header */}
      <div className="md:hidden h-32"></div>

      {/* Left side with icon - Only visible on desktop */}
      <div className="hidden md:flex md:w-1/3 flex-col items-center justify-center p-12 shadow-lg rounded-r-3xl" style={{ backgroundColor: '#c1e2bf' }}>
        <GraduationCap
          size={120}
          className="text-green-900"
          strokeWidth={1.5}
        />
        <h2 className="mt-6 text-2xl font-bold text-gray-900 text-center">
          Add Trainer
        </h2>
        <p className="mt-2 text-center text-gray-800 max-w-xs">
          Fill in the details below to create a new trainer account.
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">Trainer Details</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Full Name */}
                <div className="flex flex-col">
                  <label htmlFor="name" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Full Name</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    placeholder="Enter full name"
                    value={trainerData.name}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col">
                  <label htmlFor="email" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Email Address</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    placeholder="Enter email address"
                    value={trainerData.email}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col">
                  <label htmlFor="phone" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Phone Number</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    required
                    maxLength={10}
                    placeholder="10-digit phone"
                    value={trainerData.phone}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  />
                </div>

                {/* Employee ID */}
                <div className="flex flex-col">
                  <label htmlFor="employeeId" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                      <BadgePercent className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Employee ID</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="employeeId"
                    type="text"
                    name="employeeId"
                    required
                    placeholder="Enter employee ID"
                    value={trainerData.employeeId}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  />
                </div>

                {/* Experience */}
                <div className="flex flex-col">
                  <label htmlFor="experience" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                      <Briefcase className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Experience (Years)</span>
                  </label>
                  <input
                    id="experience"
                    type="number"
                    name="experience"
                    min={0}
                    placeholder="Years of experience"
                    value={trainerData.experience}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  />
                </div>

                {/* LinkedIn */}
                <div className="flex flex-col">
                  <label htmlFor="linkedIn" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                      <Linkedin className="h-4 w-4 text-green-600" />
                    </div>
                    <span>LinkedIn Profile</span>
                  </label>
                  <input
                    id="linkedIn"
                    type="url"
                    name="linkedIn"
                    placeholder="LinkedIn profile URL"
                    value={trainerData.linkedIn}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  />
                </div>

                {/* Subject Specialization */}
                <div className="flex flex-col">
                  <label htmlFor="subjectDealing" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                      <Book className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Subject Specialization</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="subjectDealing"
                    type="text"
                    name="subjectDealing"
                    required
                    placeholder="e.g. Python, Data Science"
                    value={trainerData.subjectDealing}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col">
                  <label htmlFor="category" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                      <Tag className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Category</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={trainerData.category}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select trainer category</option>
                    <option value="technical">Technical</option>
                    <option value="non-technical">Non-Technical</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg font-semibold w-full flex items-center gap-2 justify-center transition hover:from-green-500 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:opacity-70"
                >
                  <UserPlus className="h-5 w-5" />
                  {loading ? 'Adding Trainer...' : 'Add Trainer'}
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
              {/* Full Name */}
              <div className="flex flex-col">
                <label htmlFor="name-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <User className="mr-2 h-4 w-4 text-green-600" /> Full Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="name-desktop"
                  type="text"
                  name="name"
                  required
                  placeholder="Enter full name"
                  value={trainerData.name}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="email-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Mail className="mr-2 h-4 w-4 text-green-600" /> Email Address <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="email-desktop"
                  type="email"
                  name="email"
                  required
                  placeholder="Enter email address"
                  value={trainerData.email}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="phone-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Phone className="mr-2 h-4 w-4 text-green-600" /> Phone Number <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="phone-desktop"
                  type="tel"
                  name="phone"
                  required
                  maxLength={10}
                  placeholder="10-digit phone"
                  value={trainerData.phone}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="employeeId-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <BadgePercent className="mr-2 h-4 w-4 text-green-600" /> Employee ID <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="employeeId-desktop"
                  type="text"
                  name="employeeId"
                  required
                  placeholder="Enter employee ID"
                  value={trainerData.employeeId}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="experience-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Briefcase className="mr-2 h-4 w-4 text-green-600" /> Experience (Years)
                </label>
                <input
                  id="experience-desktop"
                  type="number"
                  name="experience"
                  min={0}
                  placeholder="Years of experience"
                  value={trainerData.experience}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="linkedIn-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Linkedin className="mr-2 h-4 w-4 text-green-600" /> LinkedIn Profile
                </label>
                <input
                  id="linkedIn-desktop"
                  type="url"
                  name="linkedIn"
                  placeholder="LinkedIn profile URL"
                  value={trainerData.linkedIn}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex flex-col col-span-2">
                <label htmlFor="subjectDealing-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Book className="mr-2 h-4 w-4 text-green-600" /> Subject Specialization <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="subjectDealing-desktop"
                  type="text"
                  name="subjectDealing"
                  required
                  placeholder="e.g. Python, Data Science"
                  value={trainerData.subjectDealing}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="flex flex-col col-span-2">
                <label htmlFor="category-desktop" className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <Tag className="mr-2 h-4 w-4 text-green-600" /> Category <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="category-desktop"
                  name="category"
                  required
                  value={trainerData.category}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                >
                  <option value="">Select trainer category</option>
                  <option value="technical">Technical</option>
                  <option value="non-technical">Non-Technical</option>
                </select>
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
                className="px-7 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg font-semibold w-1/2 flex items-center gap-2 justify-center transition hover:from-green-500 hover:to-green-700"
              >
                <UserPlus className="h-5 w-5" />
                {loading ? 'Adding...' : 'Add Trainer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTrainerPage;