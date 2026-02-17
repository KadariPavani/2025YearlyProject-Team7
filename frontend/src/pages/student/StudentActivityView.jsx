import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, TrendingUp, BookOpen, FileText, Code, Target, RefreshCw } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';

const StudentActivityView = () => {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchStudentActivity();
  }, []);

  const fetchStudentActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      if (!token) console.warn('No auth token found when fetching student activity');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student-activity/student`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityData(response.data.data);
      setLoading(false);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to fetch activity');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!activityData) return null;

  const { student, scores, rank, totalStudentsInBatch } = activityData;

  const getScoreColor = (pct) =>
    pct >= 80 ? 'text-green-700' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      {toast && (
        <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">My Performance</h2>
          <p className="text-xs text-gray-500 mt-0.5">{student.name} &bull; {student.rollNo}</p>
        </div>
        <button
          onClick={fetchStudentActivity}
          className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center"><Award className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Batch Rank</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{rank}<span className="text-xs sm:text-sm font-normal text-gray-500">/{totalStudentsInBatch}</span></p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center"><Target className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Overall</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{scores.totals.meanPercentage}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center"><BookOpen className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Quizzes</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{scores.totals.quizPercentage}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-purple-50 items-center justify-center"><FileText className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Assignments</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{scores.totals.assignmentPercentage}%</p>
            </div>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-orange-50 items-center justify-center"><Code className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Coding</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{scores.totals.codingPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Results */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /></div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Quiz Results</h3>
          <span className="ml-auto text-xs text-gray-500">{scores.quizzes.length} quizzes</span>
        </div>
        {scores.quizzes.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">No quizzes completed</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Quiz</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Score</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scores.quizzes.map((quiz, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{idx + 1}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{quiz.quizTitle}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{quiz.subject}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 text-center whitespace-nowrap">{quiz.score}/{quiz.totalMarks}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${
                          quiz.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          quiz.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {quiz.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Results */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" /></div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Assignment Results</h3>
          <span className="ml-auto text-xs text-gray-500">{scores.assignments.length} assignments</span>
        </div>
        {scores.assignments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">No assignments graded</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Assignment</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Score</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scores.assignments.map((a, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{idx + 1}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{a.assignmentTitle}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{a.subject}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 text-center whitespace-nowrap">{a.score}/{a.totalMarks}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${
                          a.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          a.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {a.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Coding Results */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg"><Code className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" /></div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Coding Results</h3>
          <span className="ml-auto text-xs text-gray-500">{scores.coding.length} problems</span>
        </div>
        {scores.coding.length === 0 ? (
          <div className="text-center py-8">
            <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">No coding contest activity yet</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Contest</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Question</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Date</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Score</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scores.coding.map((c, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{idx + 1}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{c.contestName}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{c.questionTitle}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{c.completedAt ? new Date(c.completedAt).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 text-center whitespace-nowrap">{c.score}/{c.totalMarks}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${
                          c.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          c.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {c.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentActivityView;
