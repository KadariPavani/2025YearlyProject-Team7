
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Search, Users, Award, TrendingUp, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const CoordinatorStudentActivity = () => {
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper to safely parse percentage values
  const safePercent = (val) => {
    const n = parseFloat(val);
    if (isNaN(n)) return '0';
    // trim trailing .00 when integer
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  };

  const getBadgeColor = (val) => {
    const n = parseFloat(val) || 0;
    if (n >= 80) return 'bg-green-100 text-green-800';
    if (n >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [filteredData, setFilteredData] = useState([]);
  const [batches, setBatches] = useState([]);
  const [uniqueBranches, setUniqueBranches] = useState([]);

  useEffect(() => {
    fetchStudentActivity();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, branchFilter, activityData]);

  const fetchStudentActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/student-activity/coordinator', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityData(response.data.data || []);
      setBatches(response.data.batches || []);

      // extract unique branches for the filter
      const branchSet = new Set();
      (response.data.data || []).forEach(item => {
        const branchName = item.student?.branch || '';
        if (branchName) branchSet.add(branchName);
      });
      setUniqueBranches(Array.from(branchSet).sort());

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
        (item.student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (branchFilter !== 'all') {
      filtered = filtered.filter(item => {
        const branchName = item.student?.branch || '';
        return branchName === branchFilter;
      });
    }

    setFilteredData(filtered);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => ({
      'Rank': index + 1,
      'Name': item.student.name,
      'Roll Number': item.student.rollNo,
      'Email': item.student.email,
      'Branch': item.student.branch,
      'College': item.student.college || '',
      'Batch Name': item.student?.batchName || item.student?.placementTrainingBatchName || batches.find(b => b._id === item.student.placementTrainingBatchId)?.batchNumber || 'N/A',
      'Quiz Score': item.scores.totals.quizScore || '',
      'Quiz Total': item.scores.totals.quizTotalMarks || '',
      'Quiz %': item.scores.totals.quizPercentage,
      'Assignment Score': item.scores.totals.assignmentScore || '',
      'Assignment Total': item.scores.totals.assignmentTotalMarks || '',
      'Assignment %': item.scores.totals.assignmentPercentage,
      'Coding Score': item.scores.totals.codingScore || '',
      'Coding Total': item.scores.totals.codingTotalMarks || '',
      'Coding %': item.scores.totals.codingPercentage,
      'Mean %': item.scores.totals.meanPercentage,
      'Overall Score': item.scores.totals.overallScore || '',
      'Overall Total': item.scores.totals.overallTotalMarks || '',
      'Overall %': item.scores.totals.overallPercentage
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    // set reasonable column widths similar to TPO (optional)
    worksheet['!cols'] = [{wch:8},{wch:20},{wch:15},{wch:25},{wch:12},{wch:12},{wch:20},{wch:12},{wch:12},{wch:10},{wch:12},{wch:12},{wch:10},{wch:12},{wch:12},{wch:10},{wch:10},{wch:12},{wch:12},{wch:10}];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Activity');

    const fileName = `Coordinator_Student_Activity_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) return <LoadingSkeleton />;

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

  const topPerformers = [...filteredData].sort((a,b) => parseFloat(b.scores.totals.meanPercentage) - parseFloat(a.scores.totals.meanPercentage)).slice(0,3);

  const avgScore = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.meanPercentage || 0),0) / filteredData.length).toFixed(2) : 0;

  const avgCoding = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.codingPercentage || 0),0) / filteredData.length).toFixed(2) : 0;

  const avgQuiz = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.quizPercentage || 0),0) / filteredData.length).toFixed(2) : 0;

  const avgAssignment = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + parseFloat(item.scores.totals.assignmentPercentage || 0),0) / filteredData.length).toFixed(2) : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-24">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Student Activity - My Batches</h2>
            <p className="text-xs text-gray-600 mt-1">{filteredData.length} of {activityData.length} students</p>
          </div>
          <button onClick={exportToExcel} className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>



        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch mb-6">
          <div className="bg-blue-50 rounded-lg p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-xl md:text-2xl font-semibold text-blue-900">{filteredData.length}</span>
            </div>
            <p className="text-sm md:text-sm text-blue-600 font-medium mt-1">Total Students</p>
          </div>

          <div className="bg-green-50 rounded-lg p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <span className="text-xl md:text-2xl font-semibold text-green-900">{avgScore}%</span>
            </div>
            <p className="text-sm md:text-sm text-green-600 font-medium mt-1">Average Score</p>
          </div>

          {/* <div className="bg-purple-50 rounded-lg p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <Award className="w-6 h-6 text-purple-600" />
              <span className="text-xl md:text-2xl font-semibold text-purple-900">{uniqueBatches.length}</span>
            </div>
            <p className="text-sm md:text-sm text-purple-600 font-medium mt-1">Active Batches</p>
          </div> */}

          <div className="bg-sky-50 rounded-lg p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <Award className="w-6 h-6 text-sky-600" />
              <span className="text-xl md:text-2xl font-semibold text-sky-900">{avgCoding}%</span>
            </div>
            <p className="text-sm md:text-sm text-sky-600 font-medium mt-1">Coding Avg</p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-3 flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center justify-between">
              <Award className="w-6 h-6 text-indigo-600" />
              <div className="text-right">
                <div className="text-sm md:text-base text-gray-700 font-medium truncate">Quiz Avg</div>
                <div className="text-2xl md:text-3xl font-semibold text-indigo-900">{avgQuiz}%</div>
              </div>
            </div>
            <p className="text-sm md:text-sm text-indigo-600 font-medium mt-2">Quiz Avg</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 flex flex-col justify-between min-h-[80px]">
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

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
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
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Branches</option>
              {uniqueBranches.map((branch) => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
            {/* Desktop table styled like batch students table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                    <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-600 uppercase">Roll</th>
                    <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-600 uppercase">Batch</th>
                    <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-600 uppercase">Branch</th>
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
                      <td className="px-3 py-2 text-xs md:text-sm">{item.student?.batchName || item.student?.placementTrainingBatchName || 'N/A'}</td>
                      <td className="px-3 py-2 text-xs md:text-sm">{item.student.branch}</td>
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
                      <div className="text-xs text-gray-500 truncate">{item.student?.batchName || item.student?.placementTrainingBatchName || 'N/A'}</div>
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

export default CoordinatorStudentActivity;
