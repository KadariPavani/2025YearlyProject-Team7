import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
      setMessage('All fields including start and end dates are required');
      return;
    }

    // Validate file type
    if (file && !file.name.match(/\.(xls|xlsx)$/)) {
      setMessage('Please upload only Excel files (.xls or .xlsx)');
      return;
    }

    // Validate date logic: endDate must be same or after startDate
    if (new Date(endDate) < new Date(startDate)) {
      setMessage('End Date cannot be before Start Date');
      return;
    }

    setLoading(true);
    setMessage(null);

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
        setMessage('Please login as admin first');
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/admin/crt-batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.data.success) {
        setMessage('CRT Batch created successfully!');
        setBatchNumber('');
        setColleges([]);
        setSelectedTpo('');
        setStartDate('');
        setEndDate('');
        setFile(null);
      } else {
        setMessage(response.data.message || 'Failed to create batch');
      }
    } catch (err) {
      console.error('Error creating batch:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        details: err.response?.data?.details
      });

      const errorMessage = err.response?.data?.details ||
        err.response?.data?.message ||
        'Server error while creating batch';
      setMessage(errorMessage);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">CRT Batch Management</h2>
      {message && (
        <div className={`mb-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text || message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-semibold">Batch Number (eg: 2025, 2026)</label>
        <input
          type="text"
          value={batchNumber}
          onChange={e => setBatchNumber(e.target.value)}
          required
          className="border px-3 py-2 mb-4 w-full rounded"
          placeholder="Batch number"
        />

        <label className="block mb-2 font-semibold">Select Colleges</label>
        <div className="flex flex-wrap gap-4 mb-4">
          {collegeOptions.map(college => (
            <label key={college} className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={colleges.includes(college)}
                onChange={() => toggleCollege(college)}
              />
              <span>{college}</span>
            </label>
          ))}
        </div>

        <label className="block mb-2 font-semibold">Assign TPO</label>
        <select
          value={selectedTpo}
          onChange={e => setSelectedTpo(e.target.value)}
          required
          className="border px-3 py-2 mb-4 w-full rounded"
        >
          <option value="">Select TPO</option>
          {tpos.map(tpo => (
            <option key={tpo._id} value={tpo._id}>{tpo.name} ({tpo.email})</option>
          ))}
        </select>

        <label className="block mb-2 font-semibold">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          required
          className="border px-3 py-2 mb-4 w-full rounded"
        />

        <label className="block mb-2 font-semibold">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          required
          className="border px-3 py-2 mb-4 w-full rounded"
        />

        <label className="block mb-2 font-semibold">Upload Student Excel</label>
        <div className="mb-2">
          <p className="text-sm text-gray-600">Excel file must contain the following columns:</p>
          <div className="mb-4">
            <p className="font-semibold mb-2">Required Excel columns:</p>
            <ul className="list-disc ml-5 text-sm text-gray-600">
              <li>name - Student's full name</li>
              <li>roll number - Student's roll number (will be used as initial password)</li>
              <li>branch - Must be one of: AID, CSM, CAI, CSD, CSC</li>
              <li>college - Must be one of the selected colleges: KIET, KIEK, or KIEW</li>
              <li>email - Valid email address</li>
              <li>phonenumber - Contact number</li>
            </ul>
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Column names must match exactly as shown above. 
                Make sure "roll number" has a space between words.
              </p>
            </div>
          </div>
        </div>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={onFileChange}
          required
          className="mb-2"
        />
        <p className="text-xs text-gray-500 mb-6">Upload an Excel file (.xls or .xlsx) with the required columns</p>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create CRT Batch'}
        </button>
      </form>
    </div>
  );
};

export default CrtManagementPage;
