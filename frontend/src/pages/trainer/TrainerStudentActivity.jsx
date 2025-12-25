
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Search, Filter, Users, Award, TrendingUp, AlertCircle, X, BookOpen } from 'lucide-react';
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

      const response = await axios.get('/api/student-activity/trainer', {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Student Activity - My Subjects</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredData.length} students • {filterSubject || 'All Subjects'}
              </p>
            </div>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export to Excel</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{filteredData.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Class Average</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {filteredData.length > 0
                    ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.meanPercentage || 0), 0) / filteredData.length).toFixed(2)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Top Scorer</p>
                <p className="text-lg font-bold text-yellow-900 mt-1">
                  {filteredData.length > 0 ? [...filteredData].sort((a,b)=>parseFloat(b.scores.totals.meanPercentage||0)-parseFloat(a.scores.totals.meanPercentage||0))[0]?.student.name : 'N/A'}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Roll No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Branch</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Quiz %</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Assignment %</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Coding %</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Overall %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={item.student._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index + 1 <= 3 && (
                        <Award className={`w-5 h-5 mr-2 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-orange-400'
                        }`} />
                      )}
                      <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{item.student.rollNo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      {item.student.branch}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{item.student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      parseFloat(item.scores.totals.quizPercentage) >= 80 ? 'bg-green-100 text-green-800' :
                      parseFloat(item.scores.totals.quizPercentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.scores.totals.quizPercentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      parseFloat(item.scores.totals.assignmentPercentage) >= 80 ? 'bg-green-100 text-green-800' :
                      parseFloat(item.scores.totals.assignmentPercentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.scores.totals.assignmentPercentage}%
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      parseFloat(item.scores.totals.codingPercentage) >= 80 ? 'bg-green-100 text-green-800' :
                      parseFloat(item.scores.totals.codingPercentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.scores.totals.codingPercentage}%
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
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
    </div>
  );
};

export default TrainerStudentActivity;
