import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Search, Users, Award, TrendingUp, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const StudentActivity = () => {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [filteredData, setFilteredData] = useState([]);
  const [batches, setBatches] = useState([]);
  const [uniqueBatches, setUniqueBatches] = useState([]);

  useEffect(() => {
    fetchStudentActivity();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, batchFilter, activityData]);

  const fetchStudentActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/student-activity/tpo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActivityData(response.data.data || []);

      // ✅ FIXED: Extract unique batches from response data
      const uniqueBatchNames = new Set();
      (response.data.data || []).forEach(item => {
        if (item.student.batchName && item.student.batchName !== 'N/A') {
          uniqueBatchNames.add(item.student.batchName);
        }
      });

      setUniqueBatches(Array.from(uniqueBatchNames).sort());
      setError('');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student activity');
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...activityData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Batch filter
    if (batchFilter !== 'all') {
      filtered = filtered.filter(item =>
        item.student.batchName === batchFilter
      );
    }

    setFilteredData(filtered);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => ({
      'Rank': item.rank,
      'Name': item.student.name,
      'Roll Number': item.student.rollNo,
      'Email': item.student.email,
      'Branch': item.student.branch,
      'College': item.student.college,
      'Batch Name': item.student.batchName, // ✅ FIXED: Include batch name
      'Quiz Score': item.scores.totals.quizScore,
      'Quiz Total': item.scores.totals.quizTotalMarks,
      'Quiz %': item.scores.totals.quizPercentage,
      'Assignment Score': item.scores.totals.assignmentScore,
      'Assignment Total': item.scores.totals.assignmentTotalMarks,
      'Assignment %': item.scores.totals.assignmentPercentage,
      'Coding Score': item.scores.totals.codingScore,
      'Coding Total': item.scores.totals.codingTotalMarks,
      'Coding %': item.scores.totals.codingPercentage,
      'Overall Score': item.scores.totals.overallScore,
      'Overall Total': item.scores.totals.overallTotalMarks,
      'Overall %': item.scores.totals.overallPercentage
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // ✅ FIXED: Set column widths for better readability
    const columnWidths = [
      { wch: 8 },   // Rank
      { wch: 20 },  // Name
      { wch: 15 },  // Roll Number
      { wch: 25 },  // Email
      { wch: 12 },  // Branch
      { wch: 12 },  // College
      { wch: 30 },  // Batch Name
      { wch: 12 },  // Quiz Score
      { wch: 12 },  // Quiz Total
      { wch: 10 },  // Quiz %
      { wch: 15 },  // Assignment Score
      { wch: 15 },  // Assignment Total
      { wch: 12 },  // Assignment %
      { wch: 12 },  // Coding Score
      { wch: 12 },  // Coding Total
      { wch: 10 },  // Coding %
      { wch: 12 },  // Overall Score
      { wch: 12 },  // Overall Total
      { wch: 10 }   // Overall %
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Activity');

    const fileName = `TPO_Student_Activity_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <div>
          <h3 className="font-semibold text-red-800">Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const topPerformers = [...filteredData].sort(
    (a, b) => b.scores.totals.overallPercentage - a.scores.totals.overallPercentage
  ).slice(0, 3);

  const avgScore = filteredData.length > 0
    ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.overallPercentage), 0) / filteredData.length).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Activity - All Batches</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredData.length} of {activityData.length} students
            </p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-5 h-5" />
            <span>Export to Excel</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">{filteredData.length}</span>
            </div>
            <p className="text-sm text-blue-600 font-medium mt-2">Total Students</p>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-green-900">{avgScore}%</span>
            </div>
            <p className="text-sm text-green-600 font-medium mt-2">Average Score</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <Award className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">{uniqueBatches.length}</span>
            </div>
            <p className="text-sm text-purple-600 font-medium mt-2">Active Batches</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <Award className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-900">{topPerformers[0]?.scores.totals.overallPercentage || 0}%</span>
            </div>
            <p className="text-sm text-orange-600 font-medium mt-2">Top Score</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Batches</option>
            {uniqueBatches.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No students found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Roll No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Branch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Batch Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Quiz %</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Assignment %</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Overall %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={item.student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {item.rank <= 3 && (
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            item.rank === 1 ? 'bg-yellow-500' :
                            item.rank === 2 ? 'bg-gray-400' :
                            'bg-orange-600'
                          }`}>
                            {item.rank}
                          </span>
                        )}
                        {item.rank > 3 && <span className="text-gray-700">{item.rank}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.student.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.student.rollNo}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{item.student.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {item.student.branch}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                        {item.student.batchName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        parseFloat(item.scores.totals.quizPercentage) >= 80 ? 'bg-green-100 text-green-800' :
                        parseFloat(item.scores.totals.quizPercentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.scores.totals.quizPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        parseFloat(item.scores.totals.assignmentPercentage) >= 80 ? 'bg-green-100 text-green-800' :
                        parseFloat(item.scores.totals.assignmentPercentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.scores.totals.assignmentPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                        parseFloat(item.scores.totals.overallPercentage) >= 80 ? 'bg-green-100 text-green-800' :
                        parseFloat(item.scores.totals.overallPercentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.scores.totals.overallPercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentActivity;
