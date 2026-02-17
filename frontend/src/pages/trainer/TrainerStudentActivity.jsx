import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Search, Filter, Users, Award, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import * as XLSX from 'xlsx';

const TrainerStudentActivity = () => {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetchStudentActivity();
  }, [filterSubject]);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, activityData]);

  const fetchStudentActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = filterSubject ? { subject: filterSubject } : {};

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student-activity/trainer`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setActivityData(response.data.data || []);
      setSubjects(response.data.subjects || []);
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
        item.student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.email.toLowerCase().includes(searchTerm.toLowerCase())
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
      'Quiz Score': item.scores.totals.quizScore,
      'Quiz Total': item.scores.totals.quizTotalMarks,
      'Quiz %': item.scores.totals.quizPercentage,
      'Assignment Score': item.scores.totals.assignmentScore,
      'Assignment Total': item.scores.totals.assignmentTotalMarks,
      'Assignment %': item.scores.totals.assignmentPercentage,
      'Coding Score': item.scores.totals.codingScore,
      'Coding Total': item.scores.totals.codingTotalMarks,
      'Coding %': item.scores.totals.codingPercentage,
      'Mean %': item.scores.totals.meanPercentage,
      'Overall Score': item.scores.totals.overallScore,
      'Overall Total': item.scores.totals.overallTotalMarks,
      'Overall %': item.scores.totals.overallPercentage
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Activity');

    worksheet['!cols'] = [
      { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 25 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 13 }, { wch: 13 }, { wch: 11 }, { wch: 13 },
      { wch: 13 }, { wch: 11 }
    ];

    const subjectPrefix = filterSubject ? `${filterSubject}_` : '';
    const fileName = `${subjectPrefix}Student_Activity_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const topPerformers = [...filteredData].sort((a, b) => parseFloat(b.scores.totals.meanPercentage || 0) - parseFloat(a.scores.totals.meanPercentage || 0)).slice(0, 3);
  const avgScore = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.meanPercentage || 0), 0) / filteredData.length).toFixed(2) : 0;
  const avgCoding = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.codingPercentage || 0), 0) / filteredData.length).toFixed(2) : 0;
  const activeSubjectsCount = subjects.length;

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Student Activity - My Subjects</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{filteredData.length} students • {filterSubject || 'All Subjects'}</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Statistics Cards - matches TPO grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-2 sm:p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <span className="text-sm sm:text-xl font-semibold text-blue-900">{filteredData.length}</span>
            </div>
            <p className="text-xs sm:text-sm text-blue-600 font-medium mt-1">Total Students</p>
          </div>

          <div className="bg-green-50 rounded-lg p-2 sm:p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <span className="text-sm sm:text-xl font-semibold text-green-900">{avgScore}%</span>
            </div>
            <p className="text-xs sm:text-sm text-green-600 font-medium mt-1">Average Score</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-2 sm:p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              <span className="text-sm sm:text-xl font-semibold text-purple-900">{activeSubjectsCount}</span>
            </div>
            <p className="text-xs sm:text-sm text-purple-600 font-medium mt-1">Active Subjects</p>
          </div>

          <div className="bg-sky-50 rounded-lg p-2 sm:p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
              <span className="text-sm sm:text-xl font-semibold text-sky-900">{avgCoding}%</span>
            </div>
            <p className="text-xs sm:text-sm text-sky-600 font-medium mt-1">Coding Avg</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-2 sm:p-3 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <Award className="w-5 h-5 sm:w-8 sm:h-8 text-orange-600" />
              <div className="text-right">
                <div className="text-xs sm:text-base text-gray-700 font-medium truncate">{topPerformers[0]?.student?.name || 'N/A'}</div>
                <div className="text-sm sm:text-2xl font-semibold text-orange-900">{topPerformers[0]?.scores?.totals?.meanPercentage || 0}%</div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-orange-600 font-medium mt-1">Top Score</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Data Table - single table for both desktop and mobile */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-xs sm:text-sm font-medium">No students found</p>
            <p className="text-xs sm:text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Branch</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Quiz %</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Assign %</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Coding %</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Mean %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((item, idx) => (
                  <tr key={item.student._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{item.student.name}</div>
                      <div className="text-xs text-gray-500">{item.student.email}</div>
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm font-mono text-gray-700 whitespace-nowrap">{item.student.rollNo}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{item.student.branch}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{item.scores.totals.quizPercentage}%</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{item.scores.totals.assignmentPercentage}%</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{item.scores.totals.codingPercentage}%</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-center font-semibold text-gray-900">{item.scores.totals.meanPercentage}%</td>
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

export default TrainerStudentActivity;
