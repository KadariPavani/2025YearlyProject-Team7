import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Clock,
  BookOpen, Award, Activity, GraduationCap, Phone, Mail,
  CheckCircle, AlertCircle, UserCheck, Briefcase, School, Monitor, Building2, X,
  PlusCircle, CheckSquare, FileText, User, Menu, Target, TrendingUp, MessageSquare, ChevronLeft, Bell, Settings, LogOut, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import StudentPlacementCalendar from './StudentCalender';
// Import enhanced student components from the second code
import StudentQuiz from './StudentQuiz';
import StudentAssignment from './StudentAssignment';
import StudentResources from './StudentResources';
import StudentAttendanceView from './StudentAttendanceView';
import StudentFeedback from '../student/StudentFeedback';
import StudentActivityView from './StudentActivityView';

import FeedbackPreview from '../../components/feedbackPreview'; // Import feedback preview component
import Header from '../../components/common/Header';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
// Keep placeholder components for the rest as in the first code


const StudentSyllabus = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <BookOpen className="h-6 w-6 text-blue-600" />
      Course Syllabus
    </h3>
    <div className="text-center py-12 bg-gray-50 rounded-xl">
      <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">No syllabus available</p>
      <p className="text-gray-400 text-sm">Course syllabus will appear here once uploaded by trainers</p>
    </div>
  </div>
);

const StudentProgress = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <TrendingUp className="h-6 w-6 text-blue-600" />
      My Progress
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">Assignments</h4>
            <p className="text-blue-700 text-sm">Completed Tasks</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-blue-900 mb-2">0/0</div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>

      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-600 p-2 rounded-lg">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900">Quizzes</h4>
            <p className="text-green-700 text-sm">Test Scores</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-green-900 mb-2">0/0</div>
        <div className="w-full bg-green-200 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>

      <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-purple-900">Attendance</h4>
            <p className="text-purple-700 text-sm">Class Participation</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-purple-900 mb-2">0%</div>
        <div className="w-full bg-purple-200 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>
    </div>

    <div className="bg-gray-50 rounded-xl p-6">
      <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No recent activity</p>
        <p className="text-gray-400 text-sm">Your learning progress will appear here</p>
      </div>
    </div>
  </div>
);

const StudentContests = ({ contests }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('live');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'

  // Calculate stats
  const now = new Date();
  const liveContests = contests?.filter(c => 
    new Date(c.startTime) <= now && new Date(c.endTime) >= now && !c.myFinalized
  ) || [];
  
  const upcomingContests = contests?.filter(c => 
    new Date(c.startTime) > now
  ) || [];
  
  const completedContests = contests?.filter(c => 
    c.myFinalized || new Date(c.endTime) < now
  ) || [];

  const totalQuestions = contests?.reduce((sum, c) => sum + (c.questions?.length || 0), 0) || 0;

  // Get contests for current tab
  const getFilteredContests = () => {
    switch(activeTab) {
      case 'live':
        return liveContests;
      case 'upcoming':
        return upcomingContests;
      case 'completed':
        return completedContests;
      default:
        return contests || [];
    }
  };

  const filteredContests = getFilteredContests();

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Active Contests */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">{liveContests.length}</div>
          <div className="text-blue-100 text-sm">Active Contests</div>
        </div>

        {/* Total Questions */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">{totalQuestions}</div>
          <div className="text-green-100 text-sm">Total Questions</div>
        </div>

        {/* Live Now */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">{liveContests.length}</div>
          <div className="text-purple-100 text-sm">Live Now</div>
        </div>
      </div>

      {/* Tabs and View Toggle */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'live'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Live
              <span className="bg-white px-2 py-0.5 rounded-full text-xs">{liveContests.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Upcoming
              <span className="bg-white px-2 py-0.5 rounded-full text-xs">{upcomingContests.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'completed'
                  ? 'bg-gray-200 text-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completed
              <span className="bg-white px-2 py-0.5 rounded-full text-xs">{completedContests.length}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Table Header */}
        {viewMode === 'list' && (
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase">
            <div className="col-span-3">Contest Details</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Schedule</div>
            <div className="col-span-2">Questions</div>
            <div className="col-span-1">Languages</div>
            <div className="col-span-1">Duration</div>
            <div className="col-span-1">Action</div>
          </div>
        )}

        {/* Contest List */}
        <div className="divide-y divide-gray-200">
          {filteredContests.length > 0 ? (
            filteredContests.map(c => {
              const startTime = new Date(c.startTime);
              const endTime = new Date(c.endTime);
              const duration = Math.floor((endTime - startTime) / (1000 * 60));
              const isActive = startTime <= now && endTime >= now && !c.myFinalized;
              
              return (
                <div key={c._id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center">
                  {/* Contest Details */}
                  <div className="col-span-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-lg p-2 mt-1">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{c.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{c.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      isActive ? 'bg-green-100 text-green-700' :
                      c.myFinalized || endTime < now ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-green-500' :
                        c.myFinalized || endTime < now ? 'bg-gray-500' :
                        'bg-blue-500'
                      }`}></span>
                      {isActive ? 'Active' : c.myFinalized || endTime < now ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>

                  {/* Schedule */}
                  <div className="col-span-2 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {startTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ends: {endTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="col-span-2 text-sm">
                    <div className="flex items-center gap-1.5 text-purple-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {c.questions?.length || 0} Problems
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Max Attempts: {c.maxAttempts || 1}
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="col-span-1 text-xs text-gray-600">
                    {c.allowedLanguages?.length > 0 ? c.allowedLanguages.join(', ') : 'No languages specified'}
                  </div>

                  {/* Duration */}
                  <div className="col-span-1 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {duration} min
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.floor(duration / 60)}h {duration % 60}m
                    </div>
                  </div>

                  {/* Action */}
                  <div className="col-span-1">
                    {c.myFinalized || endTime < now ? (
                      <button 
                        onClick={() => navigate(`/student/contests/${c._id}/leaderboard`)}
                        className="w-full px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        Results
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/student/contests/${c._id}`)}
                        className="w-full px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        Enter
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No contests available in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const StudentCertificates = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <Award className="h-6 w-6 text-blue-600" />
      My Certificates
    </h3>
    <div className="text-center py-12 bg-gray-50 rounded-xl">
      <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">No certificates earned yet</p>
      <p className="text-gray-400 text-sm">Complete assignments and quizzes to earn certificates</p>
    </div>
  </div>
);

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null);
  const [placementBatchInfo, setPlacementBatchInfo] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [resources, setResources] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    quizzes: { total: 0, completed: 0, upcoming: 0, average: 0 },
    assignments: { total: 0, completed: 0, pending: 0, overdue: 0 },
    resources: { total: 0, viewed: 0 },
    performance: { totalQuizzes: 0, averageScore: 0, passRate: 0 }
  });
const [categoryUnread, setCategoryUnread] = useState({
  Placement: 0,
  "Weekly Class Schedule": 0,
  "My Assignments": 0,
  "Available Quizzes": 0,
  "Learning Resources": 0,
});

  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const [formData, setFormData] = useState({
    crtInterested: false,
    crtBatchChoice: '',
    // other profile fields...
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
// 🔔 Notifications
const [showNotifications, setShowNotifications] = useState(false);
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [selectedCategory, setSelectedCategory] = useState(null);
const [contests, setContests] = useState([]);
// 🔔 Close notification when clicking outside
const notificationRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
    fetchBatchInfo();
    fetchPlacementBatchInfo();
    fetchTodaySchedule();
    fetchAssignments();
    fetchQuizzes();
    fetchResources();
    fetchSyllabi();
    fetchPendingApprovals();
    fetchContests();
  }, []);

  // Fetch active contests for student
  const fetchContests = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get('/api/contests', { headers: { Authorization: `Bearer ${token}` } });
      setContests(res.data.contests || []);
    } catch (err) {
      console.error('Error fetching contests:', err);
    }
  };

  useEffect(() => {
    if (assignments.length > 0 || quizzes.length > 0 || resources.length > 0) {
      calculateDashboardStats();
    }
  }, [assignments, quizzes, resources]);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/auth/dashboard/student', {
        headers:
         {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setStudentData(result.data);
        setFormData(prev => ({
          ...prev,
          crtInterested: result.data.crtInterested || false,
          crtBatchChoice: result.data.crtBatchChoice || ''
        }));
      } else {
        setError('Failed to fetch student data');
      }
    } catch (err) {
      setError('Failed to fetch student data');
    }
  };
const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem("userToken");
    const res = await axios.get("/api/notifications/student", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("🔔 Notifications fetched:", res.data);

    const notifications = res.data.data || [];
    const unreadByCategory = res.data.unreadByCategory || {
      Placement: 0,
      "Weekly Class Schedule": 0,
      "My Assignments": 0,
      "Available Quizzes": 0,
      "Learning Resources": 0,
    };

    const totalUnread = Object.values(unreadByCategory).reduce((a, b) => a + b, 0);

    setNotifications(notifications);
    setCategoryUnread(unreadByCategory);
    setUnreadCount(totalUnread);
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }
};

// ✅ Initial fetch only - polling is handled by Header component
useEffect(() => {
  fetchNotifications();
}, []);

const markAsRead = async (id) => {
  try {
    const token = localStorage.getItem("userToken");
    await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/mark-read/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchNotifications(); // ✅ works fine now
  } catch (err) {
    console.error("Error marking notification as read:", err);
  }
};



  const fetchBatchInfo = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/student/my-batch', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setBatchInfo(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch batch info:', err);
    }
  };

  const fetchPlacementBatchInfo = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/student/placement-training-batch-info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setPlacementBatchInfo(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch placement batch info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/student/my-trainers-schedule', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setTodaySchedule(result.data.todaySchedule);
      }
    } catch (err) {
      console.error('Failed to fetch today schedule:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get('/api/assignments/student/list', {  // Using path from second code for functionality
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAssignments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
      setAssignments([]);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get('/api/quizzes/student/list', {  // Using path from second code for functionality
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuizzes(response.data || []);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      setQuizzes([]);
    }
  };

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get('/api/references/student/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setResources(response.data.references || []);
    } catch (err) {
      // Handle 404 gracefully
      if (err.response?.status === 404) {
        setResources([]);
      } else {
        console.error('Failed to fetch resources:', err);
        setResources([]);
      }
    }
  };

  const fetchSyllabi = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get('/api/syllabi/student/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyllabi(response.data || []);
    } catch (err) {
      setSyllabi([]);
    }
  };

  // Add this new function
  const fetchPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/student/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingApprovals(data.data);
      }
    } catch (err) {
      console.error('Error fetching approvals:', err);
    }
  };

  const calculateDashboardStats = () => {
    // Calculations from the second code
    const completedQuizzes = quizzes.filter(q => q.hasSubmitted);
    const upcomingQuizzes = quizzes.filter(q => {
      const now = new Date();
      const startTime = new Date(`${q.scheduledDate} ${q.startTime}`);
      const endTime = new Date(`${q.scheduledDate} ${q.endTime}`);
      return now < endTime && !q.hasSubmitted;
    });
    const averageQuizScore = completedQuizzes.length > 0
      ? completedQuizzes.reduce((acc, q) => acc + (q.percentage || 0), 0) / completedQuizzes.length
      : 0;

    const completedAssignments = assignments.filter(a => a.hasSubmitted);
    const pendingAssignments = assignments.filter(a => !a.hasSubmitted && !a.isOverdue);
    const overdueAssignments = assignments.filter(a => a.isOverdue && !a.hasSubmitted);

    const totalQuizzesTaken = completedQuizzes.length;
    const passedQuizzes = completedQuizzes.filter(q => q.percentage >= 60).length;
    const passRate = totalQuizzesTaken > 0 ? (passedQuizzes / totalQuizzesTaken) * 100 : 0;

    setDashboardStats({
      quizzes: {
        total: quizzes.length,
        completed: completedQuizzes.length,
        upcoming: upcomingQuizzes.length,
        average: averageQuizScore
      },
      assignments: {
        total: assignments.length,
        completed: completedAssignments.length,
        pending: pendingAssignments.length,
        overdue: overdueAssignments.length
      },
      resources: {
        total: resources.length,
        viewed: resources.filter(r => r.hasViewed).length || 0
      },
      performance: {
        totalQuizzes: totalQuizzesTaken,
        averageScore: averageQuizScore,
        passRate: passRate
      }
    });

    // Upcoming deadlines from second code
    const deadlines = [
      ...assignments.filter(a => !a.hasSubmitted && !a.isOverdue).map(a => ({
        type: 'assignment',
        title: a.title,
        dueDate: a.dueDate,
        subject: a.subject,
        trainer: a.trainer
      })),
      ...upcomingQuizzes.map(q => ({
        type: 'quiz',
        title: q.title,
        dueDate: `${q.scheduledDate} ${q.endTime}`,
        subject: q.subject,
        trainer: q.trainer
      }))
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);

    setUpcomingDeadlines(deadlines);

    // Recent activity from second code
    const activities = [
      ...completedQuizzes.slice(-3).map(q => ({
        type: 'quiz',
        title: `Completed quiz: ${q.title}`,
        date: q.submittedAt,
        score: q.percentage,
        subject: q.subject
      })),
      ...completedAssignments.slice(-3).map(a => ({
        type: 'assignment',
        title: `Submitted assignment: ${a.title}`,
        date: a.lastSubmission?.submittedAt,
        score: a.lastSubmission?.percentage,
        subject: a.subject
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    setRecentActivity(activities);
  };

  const getTimeSlotColor = (timeSlot) => {
    const colors = {
      morning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      afternoon: 'bg-blue-100 text-blue-800 border-blue-200',
      evening: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[timeSlot] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTimeSlotIcon = (timeSlot) => {
    const icons = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌙'
    };
    return icons[timeSlot] || '⏰';
  };

  const getCurrentTimeStatus = (startTime, endTime) => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    if (currentTime >= startTime && currentTime <= endTime) {
      return { status: 'ongoing', color: 'bg-green-100 text-green-800 border-green-200', text: '🔴 Live Now' };
    } else if (currentTime < startTime) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800 border-blue-200', text: '⏰ Upcoming' };
    } else {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800 border-gray-200', text: '✅ Completed' };
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('userToken');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      navigate('/student-login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for CRT-related changes
    if (name === 'crtInterested' || name === 'crtBatchChoice') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        requiresApproval: true
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Update the save function to handle approvals
  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('userToken');
      const response = await axios.put('/api/student/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.requiresApproval) {
        setMessage('Profile updated. CRT-related changes have been sent for TPO approval.');
      } else {
        setMessage('Profile updated successfully');
      }

      setProfile(response.data.data);
      setIsEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error && !studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }
// ✅ Safe student ID for notification matching
const studentId = studentData?.user?._id || studentData?._id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Student Dashboard"
        subtitle="Placement Training Portal"
        icon={GraduationCap}
        userData={studentData?.user || studentData}
        profileRoute="/student-profile"
        changePasswordRoute="/student-change-password"
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        fetchNotifications={fetchNotifications}
        categoryUnread={categoryUnread}
        unreadCount={unreadCount}
        userType="student"
        userId={studentId}
        onIconClick={() => {
          if (window.location.pathname === '/student-dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/student-dashboard');
          }
        }}
      />

      <div className="max-w-7xl mx-auto pt-20">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-blue-700">
                  Welcome, {studentData?.user?.name || 'Student'}!
                </h1>
                <p className="text-gray-600 mt-2">{studentData?.message || 'Welcome to your placement training portal'}</p>

              </div>

              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live Data</span>
              </div>
            </div>
          </div>

          {/* Info Cards Row - Merged with stats from second code */}
          <div className="px-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Last Login</p>
                    <p className="text-lg font-bold text-green-900">{studentData?.lastLogin ? new Date(studentData.lastLogin).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs text-green-700 mt-1">Welcome Back!</p>
                  </div>
                </div>
              </div>

              <div className="bg-pink-50 rounded-2xl p-5 border border-pink-200">
                <div className="flex items-start gap-3">
                  <div className="bg-pink-500 p-2 rounded-lg">
                    <PlusCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-1">Assignments</p>
                    <p className="text-lg font-bold text-pink-900">{dashboardStats.assignments.completed}/{dashboardStats.assignments.total}</p>
                    <p className="text-xs text-pink-700 mt-1">Completed</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <CheckSquare className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Quizzes</p>
                    <p className="text-lg font-bold text-blue-900">{dashboardStats.quizzes.completed}/{dashboardStats.quizzes.total}</p>
                    <p className="text-xs text-blue-700 mt-1">Completed</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Average Score</p>
                    <p className="text-lg font-bold text-amber-900">{dashboardStats.quizzes.average.toFixed(1)}%</p>
                    <p className="text-xs text-amber-700 mt-1">Quiz Performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Approval Status Banner */}
          {pendingApprovals && pendingApprovals.totalPending > 0 && (
            <div className="px-8 pb-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      You have {pendingApprovals.totalPending} pending approval request{pendingApprovals.totalPending !== 1 ? 's' : ''} awaiting TPO review
                    </p>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="mt-2 text-sm text-yellow-700 hover:text-yellow-900 font-semibold underline"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rejected Approvals Banner */}
          {pendingApprovals && pendingApprovals.rejected && pendingApprovals.rejected.length > 0 && (
            <div className="px-8 pb-4">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-start">
                  <X className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Some of your requests were rejected
                    </p>
                    {pendingApprovals.rejected.slice(0, 2).map((approval, index) => (
                      <p key={index} className="text-sm text-red-700 mt-1">
                        • {approval.rejectionReason}
                      </p>
                    ))}
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="mt-2 text-sm text-red-700 hover:text-red-900 font-semibold underline"
                    >
                      View All →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="px-8">
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Overview
              </button>

              <button
                onClick={() => setActiveTab('trainers')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'trainers'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                My Trainers
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'schedule'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Class Schedule
              </button>

              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'attendance'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('syllabus')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'syllabus'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Syllabus
              </button>

              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'assignments'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <PlusCircle className="h-4 w-4 inline mr-1" />
                Assignments
              </button>

              <button
                onClick={() => setActiveTab('student-activity')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'student-activity'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Student Activity
              </button>

              <button
                onClick={() => setActiveTab('contests')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'contests'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Contests
              </button>

              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'quizzes'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <CheckSquare className="h-4 w-4 inline mr-1" />
                Quizzes
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'resources'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1" />
                Resources
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-1" />
                Placement Calendar
              </button>

              <button
                onClick={() => navigate('/student/feedback')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'feedback'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Feedback
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {/* Overview Tab - Merged with content from both codes */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Overdue Alert from second code */}
              {dashboardStats.assignments.overdue > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-red-800">
                        You have {dashboardStats.assignments.overdue} overdue assignment{dashboardStats.assignments.overdue !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-red-600">
                        Please contact your trainer if you need assistance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Batch & TPO Information from first code */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                  Batch & TPO Information
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Non-CRT Batch Info */}
                  {batchInfo && (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                        <School className="h-5 w-5" />
                        Your Batch
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-blue-800">Batch Number:</span>
                          <span className="ml-2 text-blue-700">{batchInfo.batch.batchNumber}</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Colleges:</span>
                          <span className="ml-2 text-blue-700">{batchInfo.batch.colleges.join(', ')}</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Duration:</span>
                          <span className="ml-2 text-blue-700">
                            {new Date(batchInfo.batch.startDate).toLocaleDateString()} - {new Date(batchInfo.batch.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TPO Info */}
                  {batchInfo?.tpo && (
                    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Your TPO
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-green-800">Name:</span>
                          <span className="ml-2 text-green-700">{batchInfo.tpo.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span className="text-green-700">{batchInfo.tpo.phone}</span>
                        </div>
                        <p className="text-xs text-green-600 mt-3 bg-green-100 p-2 rounded">
                          Contact your TPO for any queries related to placements and training
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Placement Training Batch Info */}
                {placementBatchInfo && (
                  <div className="mt-6 bg-purple-50 rounded-xl p-6 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Placement Training Batch
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <span className="font-medium text-purple-800">Batch:</span>
                        <span className="ml-2 text-purple-700">{placementBatchInfo.placementBatch.batchNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">Tech Stack:</span>
                        <span className="ml-2 text-purple-700">{placementBatchInfo.placementBatch.techStack}</span>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">Year:</span>
                        <span className="ml-2 text-purple-700">{placementBatchInfo.placementBatch.year}</span>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">Trainers:</span>
                        <span className="ml-2 text-purple-700">{placementBatchInfo.totalTrainers} Assigned</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Today's Classes from first code */}
              {todaySchedule.length > 0 && (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Clock className="h-6 w-6 text-blue-600" />
                    Today's Classes ({todaySchedule.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todaySchedule.map((session, index) => {
                      const timeStatus = getCurrentTimeStatus(session.startTime, session.endTime);
                      return (
                        <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h5 className="font-semibold text-gray-900">{session.trainer.name}</h5>
                              <p className="text-sm text-gray-600">{session.subject}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${timeStatus.color}`}>
                              {timeStatus.text}
                            </span>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{session.startTime} - {session.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{session.trainer.email}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTimeSlotColor(session.timeSlot)}`}>
                            {getTimeSlotIcon(session.timeSlot)} {session.timeSlot}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activity from second code */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="h-6 w-6 text-blue-600" />
                  Recent Activity
                </h3>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No recent activity</p>
                    <p className="text-gray-400 text-sm">Your learning progress will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {activity.type === 'quiz' ? (
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                              <FileText className="w-4 h-4 text-green-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-500">{activity.subject}</p>
                          </div>
                        </div>
                        {activity.score !== undefined && (
                          <div className={`text-sm font-medium ${
                            activity.score >= 80 ? 'text-green-600' :
                            activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {activity.score.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Deadlines from second code */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  Upcoming Deadlines
                </h3>
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No upcoming deadlines</p>
                    <p className="text-gray-400 text-sm">Assignments and quizzes will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingDeadlines.map((deadline, index) => {
                      const isUrgent = new Date(deadline.dueDate) - new Date() < 24 * 60 * 60 * 1000;
                      return (
                        <div key={index} className={`p-3 rounded-lg ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {deadline.type === 'quiz' ? (
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-blue-100'}`}>
                                  <CheckSquare className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
                                </div>
                              ) : (
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-green-100'}`}>
                                  <FileText className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-green-600'}`} />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{deadline.title}</p>
                                <p className="text-sm text-gray-500">{deadline.subject}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
                                {new Date(deadline.dueDate).toLocaleDateString()}
                              </p>
                              <p className={`text-xs ${isUrgent ? 'text-red-500' : 'text-gray-500'}`}>
                                {new Date(deadline.dueDate).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trainers Tab from first code */}
          {activeTab === 'trainers' && (
            <div className="space-y-6">
              {placementBatchInfo ? (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    Your Training Team ({placementBatchInfo.totalTrainers} Trainers)
                  </h3>

                  {Object.entries(placementBatchInfo.trainerSchedule).map(([timeSlot, trainers]) => (
                    trainers.length > 0 && (
                      <div key={timeSlot} className="mb-8">
                        <h4 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                          timeSlot === 'morning' ? 'text-yellow-700' :
                          timeSlot === 'afternoon' ? 'text-blue-700' : 'text-purple-700'
                        }`}>
                          <span className="text-2xl">{getTimeSlotIcon(timeSlot)}</span>
                          {timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)} Session
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {trainers.map((assignment, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {assignment.trainer.name.charAt(0)}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900">{assignment.trainer.name}</h5>
                                  <p className="text-sm text-gray-600">{assignment.trainer.category} Trainer</p>
                                </div>
                              </div>

                              <div className="space-y-3 mb-4">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Subject:</span>
                                  <span className="ml-2 text-sm text-gray-600">{assignment.subject}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Experience:</span>
                                  <span className="ml-2 text-sm text-gray-600">{assignment.trainer.experience} years</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{assignment.trainer.email}</span>
                                </div>
                                {assignment.trainer.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">{assignment.trainer.phone}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTimeSlotColor(timeSlot)}`}>
                                  {assignment.schedule?.length || 0} Classes/Week
                                </span>
                                <button
                                  onClick={() => setSelectedTrainer(assignment)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  View Schedule →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
                  <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No trainers assigned yet</p>
                  <p className="text-gray-400 text-sm">Complete your profile to get assigned to a training batch</p>
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab from first code */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {placementBatchInfo ? (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    Weekly Class Schedule
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                    {Object.entries(placementBatchInfo.weeklySchedule).map(([day, sessions]) => (
                      <div key={day} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 text-center border-b border-gray-200 pb-2">
                          {day}
                        </h4>
                        <div className="space-y-2">
                          {sessions.length > 0 ? sessions.map((session, index) => (
                            <div key={index} className="bg-white rounded-md p-3 border border-gray-200 hover:shadow-md transition-shadow">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                {session.startTime} - {session.endTime}
                              </div>
                              <div className="text-sm font-semibold text-gray-900 mb-1">
                                {session.trainer.name}
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                {session.subject}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getTimeSlotColor(session.timeSlot)}`}>
                                {getTimeSlotIcon(session.timeSlot)} {session.timeSlot}
                              </span>
                            </div>
                          )) : (
                            <div className="text-center py-4 text-gray-400 text-sm">
                              No classes
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No schedule available</p>
                  <p className="text-gray-400 text-sm">Complete your profile to see your class schedule</p>
                </div>
              )}
            </div>
          )}

          {/* Use enhanced components from second code for these tabs */}
          {activeTab === 'assignments' && <StudentAssignment />}
          {activeTab === 'quizzes' && <StudentQuiz />}
          {activeTab === 'resources' && <StudentResources />}
{activeTab === 'syllabus' && (
  <div className="space-y-12">

    {/* ---------- No Syllabus ---------- */}
    {syllabi.length === 0 ? (
      <section className="bg-white rounded-2xl shadow border border-gray-200 p-10">
        <header className="flex items-center gap-3 mb-6">
          <BookOpen className="h-7 w-7 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Course Syllabus</h2>
        </header>

        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <BookOpen className="h-24 w-24 text-gray-400 mx-auto mb-5" />
          <p className="text-lg font-medium text-gray-600">No syllabus available yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Your trainers will upload the syllabus soon.
          </p>
        </div>
      </section>
    ) : (
      /* ---------- Syllabus Cards ---------- */
      syllabi.map((syllabus) => (
        <section
          key={syllabus._id}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 print:shadow-none print:border print:p-8 print:break-inside-avoid"
        >
          {/* ---- Print button for THIS syllabus only        */}
          <div className="flex justify-end mb-4 print:hidden">
            <button
              onClick={() => {
                const area = document.getElementById(`print-${syllabus._id}`);
                const original = document.body.innerHTML;

                document.body.innerHTML = area?.innerHTML ?? '';
                window.print();

                document.body.innerHTML = original;
                window.location.reload(); // re-mount React
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <FileText className="h-4 w-4" />
              Print This Syllabus
            </button>
          </div>

          {/* ---- Printable wrapper (unique id) ---- */}
          <div id={`print-${syllabus._id}`} className="space-y-6">

            {/* ---- Header ---- */}
            <header className="border-b border-gray-300 pb-5">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                {syllabus.title}
              </h2>
              {syllabus.description && (
                <p className="mt-3 text-base text-gray-600 leading-relaxed">
                  {syllabus.description}
                </p>
              )}
            </header>

            {/* ---- Topics Table ---- */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                  <tr>
                    {['#', 'Topic', 'Description', 'Duration'].map((th) => (
                      <th
                        key={th}
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider"
                      >
                        {th}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(syllabus.topics) && syllabus.topics.length > 0 ? (
                    syllabus.topics.map((topic, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {topic.topicName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                          {topic.description || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            <Clock className="h-3.5 w-3.5" />
                            {topic.duration}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                        No topics listed for this syllabus.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </section>
      ))
    )}
  </div>
)}


          {activeTab === 'contests' && <StudentContests contests={contests} />}
          {activeTab === 'progress' && <StudentProgress />}
          {activeTab === 'certificates' && <StudentCertificates />}
          {activeTab === 'attendance' && <StudentAttendanceView />}
          {activeTab === "calendar" && <StudentPlacementCalendar />}
          {activeTab === 'student-activity' && <StudentActivityView />}
          {activeTab === 'feedback' && <StudentFeedback />}
        </div>
      </div>

      {/* Trainer Detail Modal from first code */}
      {selectedTrainer && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
            <div className="bg-blue-700 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <UserCheck className="h-7 w-7" />
                  {selectedTrainer.trainer.name}
                </h3>
                <p className="text-blue-200 text-sm mt-1">{selectedTrainer.subject} - {selectedTrainer.trainer.category} Trainer</p>
              </div>
              <button
                onClick={() => setSelectedTrainer(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-xs font-medium text-blue-600 mb-1">Experience</p>
                  <p className="text-lg font-bold text-blue-900">{selectedTrainer.trainer.experience} Years</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-xs font-medium text-green-600 mb-1">Classes/Week</p>
                  <p className="text-lg font-bold text-green-900">{selectedTrainer.schedule?.length || 0}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{selectedTrainer.trainer.email}</span>
                  </div>
                  {selectedTrainer.trainer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{selectedTrainer.trainer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedTrainer.schedule && selectedTrainer.schedule.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Weekly Schedule</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedTrainer.schedule.map((slot, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{slot.day}</div>
                            <div className="text-sm text-gray-600">{slot.startTime} - {slot.endTime}</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTimeSlotColor(selectedTrainer.timeSlot)}`}>
                            {selectedTrainer.subject}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;