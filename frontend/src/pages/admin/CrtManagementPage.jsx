import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast'; // Toast library import

const CrtManagementPage = () => {
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
    // Fetch TPOs for dropdown
    const fetchTpos = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await axios.get('/api/admin/tpos', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (response.data.success) {
          setTpos(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching TPOs', err);
        setMessage('Failed to fetch TPOs. Please ensure you are logged in as an admin.');
        toast.error('Failed to fetch TPOs. Please ensure you are logged in as an admin.');
      }
    };
    fetchTpos();
  }, []);

  const toggleCollege = (college) => {
    if (colleges.includes(college)) {
      setColleges(colleges.filter(c => c !== college));
    } else {
      setColleges([...colleges, college]);
    }
  };

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validate required fields including startDate and endDate
    if (!batchNumber || colleges.length === 0 || !selectedTpo || !file || !startDate || !endDate) {
      const errorMsg = 'All fields including start and end dates are required';
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate file type
    if (file && !file.name.match(/\.(xls|xlsx)$/)) {
      const errorMsg = 'Please upload only Excel files (.xls or .xlsx)';
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate date logic: endDate must be same or after startDate
    if (new Date(endDate) < new Date(startDate)) {
      const errorMsg = 'End Date cannot be before Start Date';
      setMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    setMessage(null);

    // Show loading toast when process starts
    const loadingToastId = toast.loading('🔄 Creating CRT Batch... Please wait!', {
      duration: 0, // Keep it until we dismiss it
    });

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
        toast.dismiss(loadingToastId); // Dismiss loading toast
        const errorMsg = 'Please login as admin first';
        setMessage(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/admin/crt-batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      console.log('Batch creation response:', response.data);

      toast.dismiss(loadingToastId); // Dismiss loading toast

      if (response.data.success) {
        const successMsg = 'CRT Batch created successfully! 🎉';
        setMessage(successMsg);
        toast.success(successMsg, {
          duration: 4000,
        });
        
        // Reset form
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
      toast.dismiss(loadingToastId); // Dismiss loading toast
      
      console.error('Error creating batch:', err);
      
      const errorMessage = err.response?.data?.details ||
        err.response?.data?.message ||
        'Server error while creating batch';
      setMessage(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-4 px-4 sm:px-6 lg:px-8">
      {/* Toast Container - Add this for toast notifications */}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />
      
      <div className="max-w-4xl mx-auto">
        {/* Compact Header Section */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                CRT Batch Management
              </h1>
              <p className="text-sm text-gray-600">Create and manage batches with ease</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">New Batch Setup</h2>
            <p className="text-blue-100 text-sm mt-1">Fill in the details to create a new CRT batch</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Status Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl border-l-4 ${
                message.includes('successfully') || message.type === 'success'
                  ? 'bg-green-50 border-green-400 text-green-800'
                  : 'bg-red-50 border-red-400 text-red-800'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.includes('successfully') || message.type === 'success' ? (
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{message.text || message}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Batch Number Section */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Batch Number
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-800 placeholder-gray-400"
                  placeholder="e.g., 2025, 2026"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the batch year for this CRT program</p>
              </div>

              {/* Colleges Section */}
              <div className="space-y-4">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Select Colleges
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {collegeOptions.map(college => (
                    <label key={college} className="relative">
                      <input
                        type="checkbox"
                        checked={colleges.includes(college)}
                        onChange={() => toggleCollege(college)}
                        className="sr-only peer"
                      />
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-gray-300">
                        <span className="font-medium">{college}</span>
                        <svg className="w-5 h-5 ml-2 text-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* TPO Assignment Section */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Assign TPO
                </label>
                <select
                  value={selectedTpo}
                  onChange={e => setSelectedTpo(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-800"
                >
                  <option value="">Choose a TPO to assign</option>
                  {tpos.map(tpo => (
                    <option key={tpo._id} value={tpo._id}>{tpo.name} ({tpo.email})</option>
                  ))}
                </select>
              </div>

              {/* Date Range Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-800"
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-4">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Upload Student Excel File
                </label>

                {/* File Upload Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Required Excel Columns
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {[
                      { field: 'name', desc: "Student's full name" },
                      { field: 'roll number', desc: "Student's roll number (used as password)" },
                      { field: 'branch', desc: "Must be: AID, CSM, CAI, CSD, CSC" },
                      { field: 'college', desc: "Must be: KIET, KIEK, or KIEW" },
                      { field: 'email', desc: "Valid email address" },
                      { field: 'phonenumber', desc: "Contact number" }
                    ].map(item => (
                      <div key={item.field} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                        <div>
                          <span className="font-medium text-blue-900">{item.field}</span>
                          <p className="text-blue-700 text-xs">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-xs">
                      <strong>Important:</strong> Column names must match exactly as shown above. 
                      Make sure "roll number" has a space between words.
                    </p>
                  </div>
                </div>

                {/* File Input */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={onFileChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  />
                  {file && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Selected: {file.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Batch...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create CRT Batch
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Need help? Contact support or check the documentation for more information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CrtManagementPage;