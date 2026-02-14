import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/common/Header';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const CrtManagementPage = () => {
  const navigate = useNavigate();
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/super-admin-login");
  };

  const [batchNumber, setBatchNumber] = useState('');
  const [colleges, setColleges] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [selectedTpo, setSelectedTpo] = useState('');
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [allowedTechStacks, setAllowedTechStacks] = useState([]);
  const [newTechStack, setNewTechStack] = useState('');
  const [showTechStackInput, setShowTechStackInput] = useState(false);

  const commonTechStacks = ['Java', 'Python', 'AIML', 'React', 'Node.js', 'Data Science', 'DevOps', 'Flutter'];
  const collegeOptions = ['KIET', 'KIEK', 'KIEW'];

  useEffect(() => {
    const fetchTpos = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tpos`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (response.data.success) setTpos(response.data.data);
      } catch {
        toast.error('Failed to fetch TPOs');
      }
    };
    fetchTpos();
  }, []);

  const toggleCollege = (college) => {
    setColleges((prev) =>
      prev.includes(college) ? prev.filter((c) => c !== college) : [...prev, college]
    );
  };

  const addPredefinedTechStack = (techStack) => {
    if (!allowedTechStacks.includes(techStack)) {
      setAllowedTechStacks([...allowedTechStacks, techStack]);
    }
  };

  const addCustomTechStack = () => {
    const trimmed = newTechStack.trim();
    if (!trimmed || allowedTechStacks.includes(trimmed)) return;
    setAllowedTechStacks([...allowedTechStacks, trimmed]);
    setNewTechStack('');
    setShowTechStackInput(false);
  };

  const removeTechStack = (techStack) => {
    setAllowedTechStacks(allowedTechStacks.filter(ts => ts !== techStack));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!batchNumber || colleges.length === 0 || !selectedTpo || !file || !startDate || !endDate) {
      toast.error('All fields are required');
      return;
    }
    if (allowedTechStacks.length === 0) {
      toast.error('Please add at least one tech stack');
      return;
    }
    if (!file.name.match(/\.(xls|xlsx)$/)) {
      toast.error('Please upload only Excel files (.xls or .xlsx)');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date');
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
      formData.append('allowedTechStacks', JSON.stringify(allowedTechStacks));

      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Please login as admin first');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/crt-batch`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${adminToken}` },
      });

      if (response.data.success) {
        toast.success('CRT Batch created successfully!');
        handleReset();
      } else {
        toast.error(response.data.message || 'Failed to create batch');
      }
    } catch (err) {
      toast.error(err.response?.data?.details || err.response?.data?.message || 'Server error');
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
    setAllowedTechStacks([]);
    setNewTechStack('');
    setShowTechStackInput(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title="CRT Batch Management"
        subtitle="Manage CRT batches"
        showTitleInHeader={false}
        userData={adminData}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onLogout={handleLogout}
        onIconClick={() => navigate('/admin-dashboard')}
      />
      <Toaster position="top-center" reverseOrder={false} />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 pt-24 w-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-sm sm:text-lg font-semibold text-gray-900">Create CRT Batch</h1>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Batch Number */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Batch Number / Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2025"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Colleges */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Colleges <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {collegeOptions.map((college) => (
                    <button
                      key={college}
                      type="button"
                      onClick={() => toggleCollege(college)}
                      className={`px-3 py-1.5 rounded text-xs font-medium ${
                        colleges.includes(college)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {college}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tech Stacks */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Allowed Tech Stacks <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Quick add common stacks:</p>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {commonTechStacks.map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => addPredefinedTechStack(tech)}
                      disabled={allowedTechStacks.includes(tech)}
                      className={`px-2 py-1 rounded text-xs ${
                        allowedTechStacks.includes(tech)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {allowedTechStacks.includes(tech) ? '✓' : '+'} {tech}
                    </button>
                  ))}
                </div>

                {!showTechStackInput ? (
                  <button
                    type="button"
                    onClick={() => setShowTechStackInput(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 bg-white border border-blue-300 rounded hover:bg-blue-50"
                  >
                    <Plus className="h-3 w-3" /> Add Custom
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTechStack}
                      onChange={(e) => setNewTechStack(e.target.value)}
                      placeholder="Custom tech stack"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTechStack())}
                    />
                    <button type="button" onClick={addCustomTechStack} className="px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Add</button>
                    <button type="button" onClick={() => { setShowTechStackInput(false); setNewTechStack(''); }} className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-50">Cancel</button>
                  </div>
                )}

                {allowedTechStacks.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {allowedTechStacks.map((tech) => (
                      <span key={tech} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs">
                        {tech}
                        <button type="button" onClick={() => removeTechStack(tech)} className="hover:bg-blue-700 rounded p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* TPO + Dates in grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Assign TPO <span className="text-red-500">*</span>
                  </label>
                  <select value={selectedTpo} onChange={(e) => setSelectedTpo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" required>
                    <option value="">Select TPO</option>
                    {tpos.map((tpo) => (
                      <option key={tpo._id} value={tpo._id}>{tpo.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Upload Student Excel File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-xs hover:file:bg-blue-700"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Required columns: name, roll number, branch, college, email, phonenumber</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs sm:text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrtManagementPage;
