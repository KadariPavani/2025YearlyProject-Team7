import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, TrendingUp, BookOpen, FileText, Code, Target, AlertCircle } from 'lucide-react';

const StudentActivityView = () => {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentActivity();
  }, []);

  const fetchStudentActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/student-activity/student', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityData(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch activity');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!activityData) return null;

  const { student, scores, rank, totalStudentsInBatch } = activityData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Performance</h1>
            <p className="text-blue-100">{student.name} • {student.rollNo}</p>
          </div>
          <div className="text-center bg-white bg-opacity-20 rounded-xl p-6">
            <Award className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm opacity-90">Batch Rank</p>
            <p className="text-4xl font-bold">{rank}</p>
            <p className="text-sm opacity-75">out of {totalStudentsInBatch}</p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              {scores.totals.overallPercentage}%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Overall Score</p>
          <p className="text-xs text-gray-500 mt-1">
            {scores.totals.overallScore} / {scores.totals.overallTotalMarks}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">
              {scores.totals.quizPercentage}%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Quiz Performance</p>
          <p className="text-xs text-gray-500 mt-1">
            {scores.totals.quizScore} / {scores.totals.quizTotalMarks}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">
              {scores.totals.assignmentPercentage}%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Assignments</p>
          <p className="text-xs text-gray-500 mt-1">
            {scores.totals.assignmentScore} / {scores.totals.assignmentTotalMarks}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Code className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">
              {scores.totals.codingPercentage}%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Coding</p>
          <p className="text-xs text-gray-500 mt-1">
            {scores.totals.codingScore} / {scores.totals.codingTotalMarks}
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quizzes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-green-600" />
            Quiz Results
          </h3>
          <div className="space-y-3">
            {scores.quizzes.length > 0 ? (
              scores.quizzes.map((quiz, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{quiz.quizTitle}</p>
                    <p className="text-xs text-gray-500">{quiz.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      quiz.percentage >= 80 ? 'text-green-600' :
                      quiz.percentage >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {quiz.percentage}%
                    </p>
                    <p className="text-xs text-gray-500">{quiz.score}/{quiz.totalMarks}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No quizzes completed</p>
            )}
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-purple-600" />
            Assignment Results
          </h3>
          <div className="space-y-3">
            {scores.assignments.length > 0 ? (
              scores.assignments.map((assignment, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{assignment.assignmentTitle}</p>
                    <p className="text-xs text-gray-500">{assignment.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      assignment.percentage >= 80 ? 'text-green-600' :
                      assignment.percentage >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {assignment.percentage}%
                    </p>
                    <p className="text-xs text-gray-500">{assignment.score}/{assignment.totalMarks}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No assignments graded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentActivityView;