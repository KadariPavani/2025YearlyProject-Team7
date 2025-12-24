import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const ViewStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    college: '',
    branch: '',
    batch: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/students');
      setStudents(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch students data');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = (
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesFilters = (
      (!filters.college || student.college === filters.college) &&
      (!filters.branch || student.branch === filters.branch) &&
      (!filters.batch || student.batch === filters.batch)
    );

    return matchesSearch && matchesFilters;
  });

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Roll Number', 'College', 'Branch', 'Batch'];
    const csvData = filteredStudents.map(student => [
      student.name,
      student.email,
      student.rollNumber,
      student.college,
      student.branch,
      student.batch
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and view all student records
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filters.college}
            onChange={(e) => setFilters({ ...filters, college: e.target.value })}
            className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Colleges</option>
            <option value="KIET">KIET</option>
            <option value="KIEK">KIEK</option>
            <option value="KIEW">KIEW</option>
          </select>

          <select
            value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            <option value="AID">AID</option>
            <option value="CSM">CSM</option>
            <option value="CAI">CAI</option>
            <option value="CSD">CSD</option>
            <option value="CSC">CSC</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
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
                  Roll Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {student.rollNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {student.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {student.college}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {student.branch}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {student.batch}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.status === 'active' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewStudentsPage;