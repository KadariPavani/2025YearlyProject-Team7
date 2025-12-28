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
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/add-trainer`, {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header
        title="Add Trainer"
        subtitle="Create trainer profile"
        showTitleInHeader={false}
        icon={GraduationCap}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onIconClick={() => navigate('/admin-dashboard')}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 pt-24 w-full">


      {/* Form Container - centered form only */}
      <div className="flex-1 w-full flex items-center justify-center p-1 md:p-8">
        <div className="w-full max-w-2xl mx-auto h-full md:h-auto">
          <div className="mb-4">
            <h1 className="text-base md:text-xl font-semibold text-gray-900">Add Trainer</h1>
            <p className="text-sm text-gray-600 mt-1">Create trainer profile</p>
          </div>
          {/* Mobile container - compact, 2 fields per row */}
          <div className="md:hidden px-1 pb-4">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-sm px-2 py-2 w-full"
            >
              {toast && (
                <ToastNotification
                  type={toast.type}
                  message={toast.message}
                  onClose={() => setToast(null)}
                />
              )}

              <div className="grid grid-cols-2 gap-2">
                {/* Full Name */}
                <div className="flex flex-col">
                  <label htmlFor="name" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Full Name</span>
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
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col">
                  <label htmlFor="email" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Mail className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Email Address</span>
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
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col">
                  <label htmlFor="phone" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Phone className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Phone Number</span>
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
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* Employee ID */}
                <div className="flex flex-col">
                  <label htmlFor="employeeId" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <BadgePercent className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Employee ID</span>
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
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* Experience */}
                <div className="flex flex-col">
                  <label htmlFor="experience" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Briefcase className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Experience (Years)</span>
                  </label>
                  <input
                    id="experience"
                    type="number"
                    name="experience"
                    min={0}
                    placeholder="Years of experience"
                    value={trainerData.experience}
                    onChange={handleChange}
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* LinkedIn */}
                <div className="flex flex-col">
                  <label htmlFor="linkedIn" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Linkedin className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">LinkedIn Profile</span>
                  </label>
                  <input
                    id="linkedIn"
                    type="url"
                    name="linkedIn"
                    placeholder="LinkedIn profile URL"
                    value={trainerData.linkedIn}
                    onChange={handleChange}
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* Subject Specialization */}
                <div className="flex flex-col">
                  <label htmlFor="subjectDealing" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Book className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Subject Specialization</span>
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
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-blue-900"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col">
                  <label htmlFor="category" className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full mr-2">
                      <Tag className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-xs">Category</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={trainerData.category}
                    onChange={handleChange}
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white text-blue-900"
                  >
                    <option value="">Select trainer category</option>
                    <option value="technical">Technical</option>
                    <option value="non-technical">Non-Technical</option>
                  </select>
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
                  {loading ? 'Adding Trainer...' : 'Add Trainer'}
                </button>
              </div>
            </form>
          </div>

          {/* Desktop form */}
          <form
            onSubmit={handleSubmit}
            className="hidden md:block bg-white rounded-2xl shadow-lg p-6 w-full"
          >
            {toast && (
              <ToastNotification
                type={toast.type}
                message={toast.message}
                onClose={() => setToast(null)}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="flex flex-col">
                <label htmlFor="name-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <User className="mr-2 h-4 w-4 text-blue-600" /> Full Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="name-desktop"
                  type="text"
                  name="name"
                  required
                  placeholder="Enter full name"
                  value={trainerData.name}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="email-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Mail className="mr-2 h-4 w-4 text-blue-600" /> Email Address <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="email-desktop"
                  type="email"
                  name="email"
                  required
                  placeholder="Enter email address"
                  value={trainerData.email}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="phone-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Phone className="mr-2 h-4 w-4 text-blue-600" /> Phone Number <span className="text-red-500 ml-1">*</span>
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
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="employeeId-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <BadgePercent className="mr-2 h-4 w-4 text-blue-600" /> Employee ID <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="employeeId-desktop"
                  type="text"
                  name="employeeId"
                  required
                  placeholder="Enter employee ID"
                  value={trainerData.employeeId}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
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
                  value={trainerData.experience}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="linkedIn-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Linkedin className="mr-2 h-4 w-4 text-blue-600" /> LinkedIn Profile
                </label>
                <input
                  id="linkedIn-desktop"
                  type="url"
                  name="linkedIn"
                  placeholder="LinkedIn profile URL"
                  value={trainerData.linkedIn}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              <div className="flex flex-col col-span-2">
                <label htmlFor="subjectDealing-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Book className="mr-2 h-4 w-4 text-blue-600" /> Subject Specialization <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="subjectDealing-desktop"
                  type="text"
                  name="subjectDealing"
                  required
                  placeholder="e.g. Python, Data Science"
                  value={trainerData.subjectDealing}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900"
                />
              </div>
              <div className="flex flex-col col-span-2">
                <label htmlFor="category-desktop" className="flex items-center text-sm font-semibold text-blue-800 mb-1">
                  <Tag className="mr-2 h-4 w-4 text-blue-600" /> Category <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="category-desktop"
                  name="category"
                  required
                  value={trainerData.category}
                  onChange={handleChange}
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-blue-900"
                >
                  <option value="">Select trainer category</option>
                  <option value="technical">Technical</option>
                  <option value="non-technical">Non-Technical</option>
                </select>
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
                {loading ? 'Adding...' : 'Add Trainer'}
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

export default AddTrainerPage;