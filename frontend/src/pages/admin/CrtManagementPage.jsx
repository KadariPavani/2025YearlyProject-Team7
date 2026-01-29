// frontend/src/pages/admin/CrtManagementPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Plus, X, GraduationCap } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/common/Header';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import { Skeleton } from '../../components/ui/skeleton';
const CrtManagementPage = () => {
  const navigate = useNavigate();
  const [batchNumber, setBatchNumber] = useState('');
  const [colleges, setColleges] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [selectedTpo, setSelectedTpo] = useState('');
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // NEW: Tech stack management
  const [allowedTechStacks, setAllowedTechStacks] = useState([]);
  const [newTechStack, setNewTechStack] = useState('');
  const [showTechStackInput, setShowTechStackInput] = useState(false);

  // Predefined common tech stacks (suggestions)
  const commonTechStacks = ['Java', 'Python', 'AIML', 'React', 'Node.js', 'Data Science', 'DevOps', 'Flutter'];

  const collegeOptions = ['KIET', 'KIEK', 'KIEW'];

  useEffect(() => {
    const fetchTpos = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tpos`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (response.data.success) {
          setTpos(response.data.data);
        }
      } catch {
        const errorMsg = 'Failed to fetch TPOs. Please ensure you are logged in as an admin.';
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    };
    fetchTpos();
  }, []);

  const toggleCollege = (college) => {
    setColleges((prev) =>
      prev.includes(college) ? prev.filter((c) => c !== college) : [...prev, college]
    );
  };

  // NEW: Add tech stack from predefined list
  const addPredefinedTechStack = (techStack) => {
    if (!allowedTechStacks.includes(techStack)) {
      setAllowedTechStacks([...allowedTechStacks, techStack]);
      toast.success(`Added ${techStack}`);
    } else {
      toast.error(`${techStack} already added`);
    }
  };

  // NEW: Add custom tech stack
  const addCustomTechStack = () => {
    const trimmed = newTechStack.trim();
    if (!trimmed) {
      toast.error('Please enter a tech stack name');
      return;
    }
    if (allowedTechStacks.includes(trimmed)) {
      toast.error(`${trimmed} already added`);
      return;
    }
    setAllowedTechStacks([...allowedTechStacks, trimmed]);
    setNewTechStack('');
    setShowTechStackInput(false);
    toast.success(`Added ${trimmed}`);
  };

  // NEW: Remove tech stack
  const removeTechStack = (techStack) => {
    setAllowedTechStacks(allowedTechStacks.filter(ts => ts !== techStack));
    toast.info(`Removed ${techStack}`);
  };

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!batchNumber || colleges.length === 0 || !selectedTpo || !file || !startDate || !endDate) {
      const errorMsg = 'All fields including start and end dates are required';
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // NEW: Validate tech stacks
    if (allowedTechStacks.length === 0) {
      const errorMsg = 'Please add at least one tech stack for this batch';
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!file.name.match(/\.(xls|xlsx)$/)) {
      const errorMsg = 'Please upload only Excel files (.xls or .xlsx)';
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      const errorMsg = 'End Date cannot be before Start Date';
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('batchNumber', batchNumber);
      formData.append('colleges', JSON.stringify(colleges));
      formData.append('tpoId', selectedTpo);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('file', file);
      // NEW: Include allowed tech stacks
      formData.append('allowedTechStacks', JSON.stringify(allowedTechStacks));

      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        const errorMsg = 'Please login as admin first';
        setMessage(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/crt-batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.data.success) {
        const successMsg = `CRT Batch created successfully with ${allowedTechStacks.length} tech stack(s)! 🎉`;
        setMessage(successMsg);
        toast.success(successMsg, { duration: 4000 });

        // Reset form
        setBatchNumber('');
        setColleges([]);
        setSelectedTpo('');
        setStartDate('');
        setEndDate('');
        setFile(null);
        setAllowedTechStacks([]);
      } else {
        const errorMsg = response.data.message || 'Failed to create batch';
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.details || err.response?.data?.message || 'Server error while creating batch';
      setMessage(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
    }

    setLoading(false);
  };

  const handleReset = () => {
    setBatchNumber('');
    setColleges([]);
    setSelectedTpo('');
    setStartDate('');
    setEndDate('');
    setFile(null);
    setMessage(null);
    setAllowedTechStacks([]);
    setNewTechStack('');
    setShowTechStackInput(false);
  };

  const truncateLabel = (label, maxLen = 32) =>
    label.length > maxLen ? label.slice(0, maxLen - 3) + '...' : label;

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
            <Header
        title="Add Trainer"
        subtitle="Create trainer profile"
        showTitleInHeader={false}
        icon={GraduationCap}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onIconClick={() => navigate('/admin-dashboard')}
      />
      <Toaster position="top-center" reverseOrder={false} />

      <div className="max-w-3xl sm:max-w-4xl mx-auto px-2 sm:px-0">
        {/* Unified Card (Header + Form) */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-full">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Create CRT Batch</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 ">
                  Configure batch details and allowed training tech stacks
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Batch Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch Number / Year *
              </label>
              <input
                type="text"
                placeholder="e.g., 2025"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Colleges */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Colleges *
              </label>
              <div className="flex flex-wrap gap-2">
                {collegeOptions.map((college) => (
                  <button
                    key={college}
                    type="button"
                    onClick={() => toggleCollege(college)}
                    className={`px-3 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all ${
                      colleges.includes(college)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {college}
                  </button>
                ))}
              </div>
            </div>

            {/* NEW: Tech Stacks Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Allowed Training Tech Stacks * (Students will choose from these)
              </label>
              
              {/* Quick Add Predefined */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Quick add common tech stacks:</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {commonTechStacks.map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => addPredefinedTechStack(tech)}
                      disabled={allowedTechStacks.includes(tech)}
                      className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                        allowedTechStacks.includes(tech)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {allowedTechStacks.includes(tech) ? '✓ ' : '+ '}{tech}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Tech Stack Input */}
              {!showTechStackInput ? (
                <button
                  type="button"
                  onClick={() => setShowTechStackInput(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Plus size={16} />
                  Add Custom Tech Stack
                </button>
              ) : (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTechStack}
                    onChange={(e) => setNewTechStack(e.target.value)}
                    placeholder="Enter custom tech stack name"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTechStack())}
                  />
                  <button
                    type="button"
                    onClick={addCustomTechStack}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTechStackInput(false);
                      setNewTechStack('');
                    }}
                    className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Selected Tech Stacks */}
              {allowedTechStacks.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Selected Tech Stacks ({allowedTechStacks.length}):
                  </p>
                  <div className="flex flex-wrap gap-2 items-center justify-start">
                    {allowedTechStacks.map((tech) => (
                      <div
                        key={tech}
                        className="flex items-center gap-2 px-2 py-1 bg-blue-600 text-white rounded-md text-sm shadow-sm min-w-max"
                      >
                        <span className="font-medium">{tech}</span>
                        <button
                          type="button"
                          onClick={() => removeTechStack(tech)}
                          className="hover:bg-blue-700 rounded-full p-1 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    💡 Students will be able to choose from these options + "NonCRT" (always available)
                  </p>
                </div>
              )}
            </div>

            {/* TPO Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign TPO *
              </label>
              <select
                value={selectedTpo}
                onChange={(e) => setSelectedTpo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select TPO</option>
                {tpos.map((tpo) => (
                  <option key={tpo._id} value={tpo._id}>
                    {truncateLabel(`${tpo.name} (${tpo.email})`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Student Excel File *
              </label>
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={onFileChange}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Required columns: name, roll number, branch, college, email, phonenumber
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 items-stretch">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                {loading ? 'Creating Batch...' : 'Create Batch'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto sm:px-6 sm:py-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  );
} ;

export default CrtManagementPage;