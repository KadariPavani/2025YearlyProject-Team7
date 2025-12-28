
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

  // UI-only derived metrics for display (no logic changes)
  const topPerformers = [...filteredData].sort((a,b)=>parseFloat(b.scores.totals.meanPercentage||0) - parseFloat(a.scores.totals.meanPercentage||0)).slice(0,3);
  const avgScore = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.meanPercentage || 0), 0) / filteredData.length).toFixed(2) : 0;
  const avgCoding = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.codingPercentage || 0), 0) / filteredData.length).toFixed(2) : 0;
  const activeSubjectsCount = subjects.length;

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
            <div className="p-2 bg-blue-50 rounded-xl">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Student Activity - My Subjects</h2>
              <p className="text-xs text-gray-600 mt-1">{filteredData.length} students • {filterSubject || 'All Subjects'}</p>
            </div>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 items-stretch">
          <div className="bg-blue-50 rounded-xl p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-xl md:text-2xl font-semibold text-blue-900">{filteredData.length}</span>
            </div>
            <p className="text-sm md:text-sm text-blue-600 font-medium mt-1">Total Students</p>
          </div>

          <div className="bg-green-50 rounded-xl p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <span className="text-xl md:text-2xl font-semibold text-green-900">{avgScore}%</span>
            </div>
            <p className="text-sm md:text-sm text-green-600 font-medium mt-1">Average Score</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <BookOpen className="w-6 h-6 text-purple-600" />
              <span className="text-xl md:text-2xl font-semibold text-purple-900">{activeSubjectsCount}</span>
            </div>
            <p className="text-sm md:text-sm text-purple-600 font-medium mt-1">Active Subjects</p>
          </div>

          <div className="bg-sky-50 rounded-xl p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-6 h-6 text-sky-600" />
              <span className="text-xl md:text-2xl font-semibold text-sky-900">{avgCoding}%</span>
            </div>
            <p className="text-sm md:text-sm text-sky-600 font-medium mt-1">Coding Avg</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <Award className="w-8 h-8 text-orange-600" />
              <div className="text-right">
                <div className="text-sm md:text-base text-gray-700 font-medium truncate">{topPerformers[0]?.student?.name || 'N/A'}</div>
                <div className="text-2xl md:text-3xl font-semibold text-orange-900">{topPerformers[0]?.scores?.totals?.meanPercentage || 0}%</div>
              </div>
            </div>
            <p className="text-sm md:text-sm text-orange-600 font-medium mt-2">Top Score</p>
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
        {filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No students found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            {/* Desktop table styled like TPO */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                    <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-600 uppercase">Roll</th>
                    <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-600 uppercase">Branch</th>
                    <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-600 uppercase">Email</th>
                    <th className="px-3 py-2 text-center text-xs md:text-sm font-medium text-gray-600 uppercase">Quiz %</th>
                    <th className="px-3 py-2 text-center text-xs md:text-sm font-medium text-gray-600 uppercase">Assignment %</th>
                    <th className="px-3 py-2 text-center text-xs md:text-sm font-medium text-gray-600 uppercase">Coding %</th>
                    <th className="px-3 py-2 text-center text-xs md:text-sm font-medium text-gray-600 uppercase">Mean %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredData.map((item, idx) => (
                    <tr key={item.student._id} className={`${idx%2===0?'bg-white':'bg-gray-50'}`}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">{item.student.name.charAt(0)}</div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{item.student.name}</div>
                            <div className="text-xs text-gray-500 truncate">{item.student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs md:text-sm font-mono">{item.student.rollNo}</td>
                      <td className="px-3 py-2 text-xs md:text-sm">{item.student.branch}</td>
                      <td className="px-3 py-2 text-xs md:text-sm">{item.student.email}</td>
                      <td className="px-3 py-2 text-center text-xs md:text-sm">{item.scores.totals.quizPercentage}%</td>
                      <td className="px-3 py-2 text-center text-xs md:text-sm">{item.scores.totals.assignmentPercentage}%</td>
                      <td className="px-3 py-2 text-center text-xs md:text-sm">{item.scores.totals.codingPercentage}%</td>
                      <td className="px-3 py-2 text-center text-xs md:text-sm">{item.scores.totals.meanPercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked list (two columns: details | scores) */}
            <div className="sm:hidden divide-y divide-gray-200">
              {filteredData.map((item, idx) => (
                <div key={item.student._id} className={`p-3 flex items-center justify-between ${idx%2===0?'bg-white':'bg-gray-50'}`}>
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{item.student.name?.charAt(0)}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{item.student.name}</div>
                      <div className="text-xs text-gray-500 truncate">{item.student.email}</div>
                      <div className="text-xs text-gray-500 truncate">{item.student.batchName || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="w-28 flex flex-col items-end text-right">
                    <div className="text-sm font-semibold">{item.scores.totals.meanPercentage}%</div>
                    <div className="text-xs text-gray-500">Coding {item.scores.totals.codingPercentage}%</div>
                    <div className="text-xs text-gray-600 font-mono mt-1">{item.student.rollNo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrainerStudentActivity;
