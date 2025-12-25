
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Search, Users, Award, TrendingUp, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const CoordinatorStudentActivity = () => {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchStudentActivity();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, activityData]);

  const fetchStudentActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/student-activity/coordinator', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityData(response.data.data || []);
      setBatches(response.data.batches || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student activity');
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...activityData];
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredData(filtered);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => ({
      'Rank': index + 1,
      'Name': item.student.name,
      'Roll Number': item.student.rollNo,
      'Branch': item.student.branch,
      'Email': item.student.email,
      'Batch': batches.find(b => b._id === item.student.placementTrainingBatchId)?.batchNumber || 'N/A',
      'Quiz %': item.scores.totals.quizPercentage,
      'Assignment %': item.scores.totals.assignmentPercentage,
      'Coding %': item.scores.totals.codingPercentage,
      'Mean %': item.scores.totals.meanPercentage,
      'Overall %': item.scores.totals.overallPercentage
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Activity');

    const fileName = `Coordinator_Student_Activity_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Activity - My Batches</h2>
            <p className="text-sm text-gray-600 mt-1">{filteredData.length} students in assigned batches</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600 font-medium">Total Students</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{filteredData.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-600 font-medium">Average</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {filteredData.length > 0
                ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.meanPercentage||0), 0) / filteredData.length).toFixed(2)
                : 0}%
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-purple-600 font-medium">Batches</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{batches.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Rank</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Roll No</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Branch</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Coding %</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Overall %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item, index) => (
              <tr key={item.student._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4 font-medium">{item.student.name}</td>
                <td className="px-6 py-4">{item.student.rollNo}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {item.student.branch}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    parseFloat(item.scores.totals.codingPercentage) >= 80 ? 'bg-green-100 text-green-800' :
                    parseFloat(item.scores.totals.codingPercentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.scores.totals.codingPercentage}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                    parseFloat(item.scores.totals.meanPercentage) >= 80 ? 'bg-green-100 text-green-800' :
                    parseFloat(item.scores.totals.meanPercentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.scores.totals.meanPercentage}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoordinatorStudentActivity;
