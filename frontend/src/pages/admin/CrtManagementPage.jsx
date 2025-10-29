import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

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

  const collegeOptions = ['KIET', 'KIEK', 'KIEW'];

  useEffect(() => {
    const fetchTpos = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await axios.get('/api/admin/tpos', {
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
    const loadingToastId = toast.loading('🔄 Creating CRT Batch... Please wait!', { duration: 0 });

    try {
      const formData = new FormData();
      formData.append('batchNumber', batchNumber);
      formData.append('colleges', JSON.stringify(colleges));
      formData.append('tpoId', selectedTpo);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('file', file);

      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.dismiss(loadingToastId);
        const errorMsg = 'Please login as admin first';
        setMessage(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/admin/crt-batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${adminToken}`,
        },
      });

      toast.dismiss(loadingToastId);

      if (response.data.success) {
        const successMsg = 'CRT Batch created successfully! 🎉';
        setMessage(successMsg);
        toast.success(successMsg, { duration: 4000 });
        setBatchNumber('');
        setColleges([]);
        setSelectedTpo('');
        setStartDate('');
        setEndDate('');
        setFile(null);
      } else {
        const errorMsg = response.data.message || 'Failed to create batch';
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
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
  };

  // Helper to truncate long TPO labels
  const truncateLabel = (label, maxLen = 32) =>
    label.length > maxLen ? label.slice(0, maxLen - 3) + '...' : label;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" />

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-4 shadow-lg bg-blue-100">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center text-blue-800 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 mr-2 text-blue-800" />
            <span className="font-medium">Back</span>
          </button>
        </div>
        <div className="flex items-center justify-center">
          <div className="bg-white/30 backdrop-blur-sm rounded-full p-3 mr-4">
            <Layers size={32} className="text-blue-800" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900">Add CRT Batch</h1>
            <p className="text-blue-700 text-sm">Create new CRT batch</p>
          </div>
        </div>
      </div>

      {/* Spacer for mobile header */}
      <div className="md:hidden h-32"></div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex md:w-1/3 flex-col items-center justify-center p-12 shadow-lg rounded-r-3xl bg-blue-100">
        <Layers size={120} className="text-blue-800" strokeWidth={1.5} />
        <h2 className="mt-6 text-2xl font-bold text-blue-900 text-center">Add CRT Batch</h2>
        <p className="mt-2 text-center text-blue-800 max-w-xs">
          Fill in the details to create a new CRT batch for your college.
          <br />
          <span className="font-medium text-blue-800 block mt-3">Required Excel columns:</span>
          <span className="block text-blue-900 text-opacity-90 mt-1 text-sm">
            name, roll number, branch, college, email, phonenumber
          </span>
          <span className="block text-xs text-blue-900 mt-2">
            <b>Note:</b> Column names must match exactly.
            <br />
            Use space in "roll number".
          </span>
        </p>
      </div>

      {/* MAIN FORM SECTION */}
      <div className="flex-1 md:w-2/3 flex items-center justify-center md:p-8">
        <div className="w-full max-w-3xl mx-auto h-full md:h-auto">
          {/* MOBILE FORM */}
          <div className="md:hidden h-screen overflow-y-auto px-4 pb-6" style={{ height: 'calc(100vh - 8rem)' }}>
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 w-full">
              {message && (
                <div
                  className={`p-4 rounded-xl border-l-4 mb-6 ${
                    message.includes('successfully') ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-red-50 border-red-400 text-red-800'
                  }`}
                >
                  <span className="font-medium text-sm">{message.text || message}</span>
                </div>
              )}

              {/* Batch Number */}
              <div>
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Batch Number *</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  required
                  placeholder="e.g., 2025, 2026"
                  className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-blue-900 placeholder-blue-400 text-sm"
                />
              </div>

              {/* Assign TPO */}
              <div className="mt-4">
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Assign TPO *</label>
                <select
                  value={selectedTpo}
                  onChange={(e) => setSelectedTpo(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-blue-900 text-sm"
                  style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}
                >
                  <option value="">Choose a TPO</option>
                  {tpos.map((tpo) => {
                    const label = `${tpo.name} (${tpo.email})`;
                    return (
                      <option key={tpo._id} value={tpo._id} title={label}>
                        {truncateLabel(label, 32)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Colleges */}
              <div className="mt-4">
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Select Colleges *</label>
                <div className="grid grid-cols-2 gap-2">
                  {collegeOptions.map((college) => (
                    <label
                      key={college}
                      className="flex items-center cursor-pointer px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      <input
                        type="checkbox"
                        checked={colleges.includes(college)}
                        onChange={() => toggleCollege(college)}
                        className="mr-2 accent-blue-600 w-4 h-4"
                      />
                      <span className="text-sm font-medium">{college}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-blue-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1.5 text-blue-800 text-sm">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-blue-900 text-sm"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="mt-4">
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Upload Student Excel File *</label>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={onFileChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-200 file:text-blue-900 hover:file:bg-blue-300 text-sm cursor-pointer"
                />
                {file && (
                  <span className="block mt-1.5 text-blue-800 text-xs font-medium">✓ Selected: {file.name}</span>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleReset}
                  className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && (
                    <svg
                      className="animate-spin mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  Add CRT Batch
                </button>
              </div>
            </form>
          </div>

          {/* DESKTOP FORM */}
          <form onSubmit={handleSubmit} className="hidden md:block bg-white rounded-2xl shadow-2xl p-10 w-full">
            {message && (
              <div
                className={`p-4 rounded-xl border-l-4 mb-6 ${
                  message.includes('successfully') ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-red-50 border-red-400 text-red-800'
                }`}
              >
                <span className="font-medium text-sm">{message.text || message}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Batch Number */}
              <div>
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Batch Number *</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  required
                  placeholder="e.g., 2025, 2026"
                  className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-blue-900 placeholder-blue-400 text-sm"
                />
              </div>

              {/* Assign TPO */}
              <div>
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Assign TPO *</label>
                <select
                  value={selectedTpo}
                  onChange={(e) => setSelectedTpo(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-blue-900 text-sm"
                  style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}
                >
                  <option value="">Choose a TPO</option>
                  {tpos.map((tpo) => {
                    const label = `${tpo.name} (${tpo.email})`;
                    return (
                      <option key={tpo._id} value={tpo._id} title={label}>
                        {truncateLabel(label, 32)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Colleges */}
              <div className="col-span-2">
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Select Colleges *</label>
                <div className="flex gap-3">
                  {collegeOptions.map((college) => (
                    <label
                      key={college}
                      className="flex items-center cursor-pointer px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      <input
                        type="checkbox"
                        checked={colleges.includes(college)}
                        onChange={() => toggleCollege(college)}
                        className="mr-2 accent-blue-600 w-4 h-4"
                      />
                      <span className="text-sm font-medium">{college}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-blue-900 text-sm"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-blue-900 text-sm"
                />
              </div>

              {/* File Upload */}
              <div className="col-span-2 mt-1">
                <label className="block font-semibold mb-1.5 text-blue-800 text-sm">Upload Student Excel File *</label>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={onFileChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-200 file:text-blue-900 hover:file:bg-blue-300 text-sm cursor-pointer"
                />
                {file && (
                  <span className="block mt-1.5 text-blue-800 text-xs font-medium">✓ Selected: {file.name}</span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && (
                  <svg
                    className="animate-spin mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                Add CRT Batch
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrtManagementPage;
