import React, { useState, useEffect } from 'react';
import {
  Users, Search, ChevronDown, ChevronRight, Filter,
  Download, Eye, Edit2, Trash2, Plus
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

const AdminBatchStudents = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    branch: '',
    year: '',
    college: ''
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchBatchStudents(selectedBatch._id);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/batches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBatches(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchStudents = async (batchId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/batches/${batchId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = (!filters.branch || student.branch === filters.branch) &&
                          (!filters.year || student.year === filters.year) &&
                          (!filters.college || student.college === filters.college);

    return matchesSearch && matchesFilters;
  });

  const handleExport = () => {
    const csvData = [
      ['Name', 'Roll No', 'Email', 'Phone', 'Branch', 'Year', 'College'],
      ...filteredStudents.map(student => [
        student.name,
        student.rollNo,
        student.email,
        student.phonenumber,
        student.branch,
        student.year,
        student.college
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBatch?.name || 'batch'}-students.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading && !selectedBatch) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-2 text-blue-600" />
            Batch Students Management
          </h1>
          <button
            onClick={handleExport}
            disabled={!selectedBatch}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Batch Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Batch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {batches.map(batch => (
              <button
                key={batch._id}
                onClick={() => setSelectedBatch(batch)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedBatch?._id === batch._id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-600'
                }`}
              >
                <h3 className="font-semibold">{batch.name}</h3>
                <p className="text-sm text-gray-600">{batch.description}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedBatch && (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, or roll number..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <select
                    value={filters.branch}
                    onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                    className="border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">All Branches</option>
                    <option value="AID">AID</option>
                    <option value="CSM">CSM</option>
                    <option value="CAI">CAI</option>
                    <option value="CSD">CSD</option>
                    <option value="CSC">CSC</option>

                  </select>
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    className="border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                  <select
                    value={filters.college}
                    onChange={(e) => setFilters({ ...filters, college: e.target.value })}
                    className="border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">All Colleges</option>
                    {/* Add college options dynamically */}
                  </select>
                </div>
              )}
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => (
                        <tr key={student._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {student.name.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.branch}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.rollNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.phonenumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.branch}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="text-indigo-600 hover:text-indigo-900">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBatchStudents;