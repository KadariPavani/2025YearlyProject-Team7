import React, { useState, useEffect } from "react";
import axios from "axios";
import { Clock, CheckCircle, AlertTriangle, BookOpen, Calendar, User, BarChart3, Trophy, RefreshCw, ChevronLeft, XCircle } from "lucide-react";
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';

export default function StudentQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [currentView, setCurrentView] = useState("list");
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) { setLoading(false); showToast('error', 'Please log in to view quizzes'); return; }
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/student/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuizzes(); }, []);

  useEffect(() => {
    let interval;
    if (currentView === "quiz" && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) { handleSubmitQuiz(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentView, timeRemaining]);

  const startQuiz = async (quizId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) { setLoading(false); showToast('error', 'Please log in to take the quiz'); return; }
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/studenT/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const quiz = response.data;
      const statusCheck = getQuizStatus(quiz);
      if (statusCheck.status !== 'active') { showToast('error', 'Quiz is not active at the moment.'); return; }
      setCurrentQuiz(quiz);
      setActiveQuizId(quizId);
      setCurrentQuestionIndex(0);
      setTimeRemaining(quiz.duration * 60);
      setAnswers(quiz.questions.map(() => ({ selectedOption: '', answer: '' })));
      setCurrentView("quiz");
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to start quiz';
      const reason = err.response?.data?.reason ? ` (${err.response?.data?.reason})` : '';
      showToast('error', `${message}${reason}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value, type = 'selectedOption') => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = { ...newAnswers[currentQuestionIndex], [type]: value };
    setAnswers(newAnswers);
  };

  const nextQuestion = () => { if (currentQuestionIndex < currentQuiz.questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1); };
  const previousQuestion = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1); };

  const handleSubmitQuiz = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) { setLoading(false); showToast('error', 'Please log in to submit quiz'); return; }
      const timeSpent = (currentQuiz.duration * 60) - timeRemaining;
      const response = await axios.post(`/api/quizzes/${activeQuizId}/submit`, { answers, timeSpent }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizResult(response.data);
      setCurrentView("review");
      showToast('success', 'Quiz submitted successfully!');
      const updatedQuizzes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/student/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(Array.isArray(updatedQuizzes.data) ? updatedQuizzes.data : []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit quiz';
      const reason = err.response?.data?.reason ? ` (${err.response?.data?.reason})` : '';
      showToast('error', `${message}${reason}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuizStatus = (quiz) => {
    const now = new Date();
    if (quiz.scheduledStart && quiz.scheduledEnd) {
      const start = new Date(quiz.scheduledStart);
      let end = new Date(quiz.scheduledEnd);
      if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      if (quiz.hasSubmitted) return { status: 'completed', color: 'bg-green-100 text-green-800', text: 'Completed' };
      if (now > end) return { status: 'missed', color: 'bg-red-100 text-red-800', text: 'Missed' };
      if (now >= start && now <= end) return { status: 'active', color: 'bg-blue-100 text-blue-800', text: 'Active' };
      if (now < start) return { status: 'upcoming', color: 'bg-yellow-100 text-yellow-800', text: 'Upcoming' };
      return { status: 'inactive', color: 'bg-gray-100 text-gray-800', text: 'Unavailable' };
    }
    const scheduledDateRaw = quiz.scheduledDate;
    let datePart = '';
    if (typeof scheduledDateRaw === 'string' && scheduledDateRaw.length >= 10) {
      datePart = scheduledDateRaw.slice(0, 10);
    } else {
      const sd = new Date(scheduledDateRaw);
      if (isNaN(sd)) return { status: 'inactive', color: 'bg-gray-100 text-gray-800', text: 'Unavailable' };
      datePart = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`;
    }
    const normalizeTimeToDate = (timeStr) => {
      if (!timeStr) return null;
      const parts = timeStr.split(':');
      if (parts.length < 2) return null;
      return new Date(`${datePart}T${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`);
    };
    let startTime = normalizeTimeToDate(quiz.startTime);
    let endTime = normalizeTimeToDate(quiz.endTime);
    if (!startTime || isNaN(startTime) || !endTime || isNaN(endTime)) return { status: 'inactive', color: 'bg-gray-100 text-gray-800', text: 'Unavailable' };
    if (endTime <= startTime) { endTime = new Date(endTime); endTime.setDate(endTime.getDate() + 1); }
    if (quiz.hasSubmitted) return { status: 'completed', color: 'bg-green-100 text-green-800', text: 'Completed' };
    if (now > endTime) return { status: 'missed', color: 'bg-red-100 text-red-800', text: 'Missed' };
    if (now >= startTime && now <= endTime) return { status: 'active', color: 'bg-blue-100 text-blue-800', text: 'Active' };
    if (now < startTime) return { status: 'upcoming', color: 'bg-yellow-100 text-yellow-800', text: 'Upcoming' };
    return { status: 'inactive', color: 'bg-gray-100 text-gray-800', text: 'Unavailable' };
  };

  const getScheduleText = (quiz) => {
    if (quiz.scheduledStart) {
      const s = new Date(quiz.scheduledStart);
      const e = new Date(quiz.scheduledEnd);
      return `${s.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, ${s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    return `${new Date(quiz.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, ${quiz.startTime} - ${quiz.endTime}`;
  };

  // ============ LIST VIEW ============
  if (currentView === "list") {
    if (loading) return <LoadingSkeleton />;

    const completed = quizzes.filter(q => q.hasSubmitted).length;
    const active = quizzes.filter(q => getQuizStatus(q).status === 'active').length;
    const upcoming = quizzes.filter(q => getQuizStatus(q).status === 'upcoming').length;

    return (
      <div className="space-y-4">
        {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Available Quizzes</h2>
            <p className="text-xs text-gray-500 mt-0.5">{quizzes.length} quizzes</p>
          </div>
          <button onClick={fetchQuizzes} className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center"><BookOpen className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-sm sm:text-xl font-bold text-blue-600">{active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-yellow-50 items-center justify-center"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Upcoming</p>
                <p className="text-sm sm:text-xl font-bold text-yellow-600">{upcoming}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-sm sm:text-xl font-bold text-green-700">{completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quizzes Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700">All Quizzes</h3>
            <span className="ml-auto text-xs text-gray-500">{quizzes.length} total</span>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-8 p-3 sm:p-4">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-xs sm:text-sm font-medium text-gray-500">No quizzes available</p>
              <p className="text-xs text-gray-400 mt-1">Quizzes will appear here once assigned by trainers</p>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-blue-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Quiz</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Schedule</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Duration</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Marks</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Score</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quizzes.map((quiz, idx) => {
                      const status = getQuizStatus(quiz);
                      return (
                        <tr key={quiz._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{quiz.title}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-600">{quiz.subject}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-700">{getScheduleText(quiz)}</div>
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              <Clock className="h-3 w-3" />{quiz.duration}m
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 text-center whitespace-nowrap">{quiz.totalMarks}</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {quiz.hasSubmitted ? (
                              <span className={`text-xs sm:text-sm font-bold ${
                                quiz.percentage >= 80 ? 'text-green-700' : quiz.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>{quiz.score}/{quiz.totalMarks}</span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {quiz.hasSubmitted ? (
                              <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full bg-green-100 text-green-700">Done</span>
                            ) : status.status === 'active' ? (
                              <button onClick={() => startQuiz(quiz._id)} disabled={loading}
                                className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                                Start
                              </button>
                            ) : status.status === 'upcoming' ? (
                              <span className="text-xs text-yellow-600 font-medium">Not yet</span>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ QUIZ VIEW ============
  if (currentView === "quiz" && currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    const answered = answers.filter(a => a.selectedOption || a.answer).length;

    return (
      <div className="space-y-3 sm:space-y-4">
        {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        {/* Quiz Header */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 truncate">{currentQuiz.title}</h3>
              <p className="text-[10px] sm:text-xs text-gray-500">{currentQuiz.subject}</p>
            </div>
            <div className={`shrink-0 px-2.5 py-1 rounded font-mono text-xs sm:text-sm font-bold ${timeRemaining <= 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />{formatTime(timeRemaining)}
            </div>
          </div>
          <div className="px-3 sm:px-4 py-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
              <span>Q {currentQuestionIndex + 1} of {currentQuiz.questions.length}</span>
              <span>{answered}/{currentQuiz.questions.length} answered</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h4 className="text-xs sm:text-sm font-medium text-gray-900">
              Q{currentQuestionIndex + 1}. {currentQuestion.questionText}
            </h4>
            <span className="shrink-0 text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {currentQuestion.marks} mk{currentQuestion.marks !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              currentQuestion.questionType === 'mcq' ? 'bg-blue-100 text-blue-800' :
              currentQuestion.questionType === 'true-false' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {currentQuestion.questionType === 'mcq' ? 'MCQ' : currentQuestion.questionType === 'true-false' ? 'True/False' : 'Fill Blank'}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
            </span>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQuestion.questionType === 'mcq' && currentQuestion.options.map((option, index) => (
              <label key={index} className={`flex items-center p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                answers[currentQuestionIndex]?.selectedOption === option.text ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input type="radio" name={`question-${currentQuestionIndex}`} value={option.text}
                  checked={answers[currentQuestionIndex]?.selectedOption === option.text}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="mr-2.5 h-4 w-4 text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-900">{option.text}</span>
              </label>
            ))}
            {currentQuestion.questionType === 'true-false' && ['true', 'false'].map(val => (
              <label key={val} className={`flex items-center p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                answers[currentQuestionIndex]?.selectedOption === val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input type="radio" name={`question-${currentQuestionIndex}`} value={val}
                  checked={answers[currentQuestionIndex]?.selectedOption === val}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="mr-2.5 h-4 w-4 text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-900">{val.charAt(0).toUpperCase() + val.slice(1)}</span>
              </label>
            ))}
            {currentQuestion.questionType === 'fill-blank' && (
              <input type="text" value={answers[currentQuestionIndex]?.answer || ''}
                onChange={(e) => handleAnswerChange(e.target.value, 'answer')}
                placeholder="Enter your answer"
                className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
          {/* Question dots */}
          <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
            {currentQuiz.questions.map((_, index) => (
              <button key={index} onClick={() => setCurrentQuestionIndex(index)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                  index === currentQuestionIndex ? 'bg-blue-600 text-white' :
                  answers[index]?.selectedOption || answers[index]?.answer ? 'bg-green-100 text-green-800 border border-green-300' :
                  'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                {index + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <button onClick={previousQuestion} disabled={currentQuestionIndex === 0}
              className="px-3 py-1.5 text-xs sm:text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
              Previous
            </button>
            {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
              <button onClick={() => { if (window.confirm('Submit quiz? You cannot change answers after submission.')) handleSubmitQuiz(); }}
                disabled={loading}
                className="px-3 sm:px-4 py-1.5 bg-green-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button onClick={nextQuestion}
                className="px-3 sm:px-4 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700">
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============ REVIEW VIEW ============
  if (currentView === "review" && quizResult) {
    return (
      <div className="space-y-4">
        {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        {/* Result Header */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Quiz Results</h3>
          </div>
          <div className="p-3 sm:p-4 text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full mb-2 ${
              quizResult.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Trophy className={`w-6 h-6 sm:w-7 sm:h-7 ${quizResult.passed ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Quiz Completed!</h2>
            <p className="text-xs text-gray-500 mt-0.5">Here are your results</p>
          </div>
        </div>

        {/* Result Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Score</p>
                <p className="text-sm sm:text-xl font-bold text-blue-600">{quizResult.score}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-purple-50 items-center justify-center"><BookOpen className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm sm:text-xl font-bold text-purple-600">{quizResult.totalMarks}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-yellow-50 items-center justify-center"><Trophy className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Percentage</p>
                <p className="text-sm sm:text-xl font-bold text-yellow-600">{quizResult.percentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`hidden sm:flex w-10 h-10 rounded-md items-center justify-center ${quizResult.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                {quizResult.passed ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
              </div>
              <div>
                <p className="text-xs text-gray-500">Result</p>
                <p className={`text-sm sm:text-xl font-bold ${quizResult.passed ? 'text-green-700' : 'text-red-600'}`}>
                  {quizResult.passed ? 'PASS' : 'FAIL'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance + Actions */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${
                quizResult.performanceCategory === 'green' ? 'bg-green-100 text-green-800' :
                quizResult.performanceCategory === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {quizResult.performanceCategory === 'green' ? 'Excellent' :
                 quizResult.performanceCategory === 'yellow' ? 'Good' : 'Needs Improvement'}
              </span>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                Passing: {quizResult.passingMarks} marks &bull; Attempt #{quizResult.attemptNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCurrentView("list"); setCurrentQuiz(null); setActiveQuizId(null); setQuizResult(null); setAnswers([]); setCurrentQuestionIndex(0); }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-1.5">
                <ChevronLeft className="w-3.5 h-3.5" />Back to Quizzes
              </button>
              {currentQuiz?.allowRetake && !quizResult.passed && (
                <button onClick={() => startQuiz(activeQuizId)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-green-700">
                  Retake
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
