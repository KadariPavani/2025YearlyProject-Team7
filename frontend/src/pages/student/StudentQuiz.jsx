// Updated StudentQuiz.jsx - Enhanced to work with placement training batch system
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Clock, CheckCircle, AlertTriangle, BookOpen, Calendar, User, BarChart3, Trophy } from "lucide-react";

// Main StudentQuiz component to manage the application's state and views.
export default function StudentQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [currentView, setCurrentView] = useState("list"); // 'list', 'quiz', 'review'
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('userToken');
        if (!token) {
          setError('Please log in to view quizzes');
          return;
        }

        // Fetch all quizzes for students (backend filters by batch automatically)
        const response = await axios.get('/api/quizzes/student/list', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setQuizzes(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch quizzes');
        console.error('Error fetching quizzes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (currentView === "quiz" && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz(); // Auto-submit when time runs out
            return 0;
          }
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
      if (!token) {
        setError('Please log in to take the quiz');
        return;
      }

      // Fetch full quiz details for taking
      const response = await axios.get(`/api/quizzes/student/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const quiz = response.data;
      setCurrentQuiz(quiz);
      setActiveQuizId(quizId);
      setCurrentQuestionIndex(0);
      setTimeRemaining(quiz.duration * 60); // Convert minutes to seconds
      
      // Initialize answers array
      const initialAnswers = quiz.questions.map(() => ({
        selectedOption: '',
        answer: ''
      }));
      setAnswers(initialAnswers);
      
      setCurrentView("quiz");
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start quiz');
      console.error('Error starting quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value, type = 'selectedOption') => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      ...newAnswers[currentQuestionIndex],
      [type]: value
    };
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('Please log in to submit quiz');
        return;
      }

      const timeSpent = (currentQuiz.duration * 60) - timeRemaining;

      const response = await axios.post(`/api/quizzes/${activeQuizId}/submit`, {
        answers,
        timeSpent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setQuizResult(response.data);
      setCurrentView("review");
      
      // Refresh quiz list to update submission status
      const updatedQuizzes = await axios.get('/api/quizzes/student/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(Array.isArray(updatedQuizzes.data) ? updatedQuizzes.data : []);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
      console.error('Error submitting quiz:', err);
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

    // Properly format scheduledDate to YYYY-MM-DD
    const scheduled = new Date(quiz.scheduledDate);
    const year = scheduled.getFullYear();
    const month = String(scheduled.getMonth() + 1).padStart(2, '0');
    const day = String(scheduled.getDate()).padStart(2, '0');
    const scheduledDateStr = `${year}-${month}-${day}`;

    // Assume startTime and endTime are in 'HH:MM' format, add :00 for seconds
    const startTime = new Date(`${scheduledDateStr}T${quiz.startTime}:00`);
    const endTime = new Date(`${scheduledDateStr}T${quiz.endTime}:00`);

    if (quiz.hasSubmitted) {
      return { status: 'completed', color: 'bg-green-100 text-green-800', text: 'Completed' };
    } else if (now > endTime) {
      return { status: 'missed', color: 'bg-red-100 text-red-800', text: 'Missed' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'active', color: 'bg-blue-100 text-blue-800', text: 'Active Now' };
    } else if (now < startTime) {
      return { status: 'upcoming', color: 'bg-yellow-100 text-yellow-800', text: 'Upcoming' };
    } else {
      return { status: 'inactive', color: 'bg-gray-100 text-gray-800', text: 'Inactive' };
    }
  };

  const getBatchTypeDisplay = (quiz) => {
    if (quiz.batchType === 'placement' && quiz.assignedPlacementBatches?.length > 0) {
      return {
        type: 'Placement Training',
        batches: quiz.assignedPlacementBatches.map(b => `${b.batchNumber} - ${b.techStack} (${b.year})`).join(', '),
        color: 'bg-green-100 text-green-800'
      };
    } else if ((quiz.batchType === 'regular' || quiz.batchType === 'noncrt') && quiz.assignedBatches?.length > 0) {
      return {
        type: 'Non-CRT Batch',
        batches: quiz.assignedBatches.map(b => b.name).join(', '),
        color: 'bg-blue-100 text-blue-800'
      };
    } else if (quiz.batchType === 'both') {
      const regularBatches = quiz.assignedBatches?.map(b => b.name) || [];
      const placementBatches = quiz.assignedPlacementBatches?.map(b => `${b.batchNumber} - ${b.techStack}`) || [];
      return {
        type: 'Mixed Batches',
        batches: [...regularBatches, ...placementBatches].join(', '),
        color: 'bg-purple-100 text-purple-800'
      };
    }
    return { type: 'Unknown', batches: '', color: 'bg-gray-100 text-gray-800' };
  };

  // Render quiz list
  if (currentView === "list") {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
                Available Quizzes
              </h1>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading quizzes...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Quizzes Available</h3>
                <p className="text-gray-600">No quizzes have been assigned to your batch yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz) => {
                  const status = getQuizStatus(quiz);
                  const batchInfo = getBatchTypeDisplay(quiz);

                  return (
                    <div key={quiz._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex-1">{quiz.title}</h2>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-2" />
                          <span>{quiz.subject}</span>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{new Date(quiz.scheduledDate).toLocaleDateString()} • {quiz.startTime} - {quiz.endTime}</span>
                        </div>

                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{quiz.duration} minutes • {quiz.totalMarks} marks</span>
                        </div>

                        {/* Batch Information */}
                        <div className="mt-3">
                          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${batchInfo.color}`}>
                            <User className="w-3 h-3 mr-1" />
                            {batchInfo.type}
                          </div>
                          {batchInfo.batches && (
                            <p className="text-xs text-gray-500 mt-1">{batchInfo.batches}</p>
                          )}
                        </div>

                        {/* Quiz Results if submitted */}
                        {quiz.hasSubmitted && (
                          <div className="bg-green-50 p-3 rounded-lg mt-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-green-800">Score: {quiz.score}/{quiz.totalMarks}</span>
                              <span className="text-green-600">{quiz.percentage?.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Trophy className="w-4 h-4 mr-1 text-green-600" />
                              <span className="text-sm text-green-700">
                                {quiz.percentage >= 80 ? 'Excellent' : quiz.percentage >= 60 ? 'Good' : 'Needs Improvement'}
                              </span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              Submitted: {new Date(quiz.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-6">
                        {quiz.hasSubmitted ? (
                          <button
                            disabled
                            className="w-full py-2 px-4 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
                          >
                            Already Submitted
                          </button>
                        ) : status.status === 'active' ? (
                          <button
                            onClick={() => startQuiz(quiz._id)}
                            disabled={loading}
                            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Start Quiz
                          </button>
                        ) : status.status === 'upcoming' ? (
                          <button
                            disabled
                            className="w-full py-2 px-4 bg-yellow-100 text-yellow-700 rounded-md cursor-not-allowed"
                          >
                            Quiz Not Started Yet
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-md cursor-not-allowed"
                          >
                            Quiz Unavailable
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render quiz interface
  if (currentView === "quiz" && currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quiz Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h1>
              <div className="flex items-center text-red-600 font-mono text-lg">
                <Clock className="w-5 h-5 mr-2" />
                {formatTime(timeRemaining)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</span>
              <span>{currentQuiz.subject}</span>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Q{currentQuestionIndex + 1}. {currentQuestion.questionText}
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  <span>{currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Question Type Indicator */}
              <div className="mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  currentQuestion.questionType === 'mcq' ? 'bg-blue-100 text-blue-800' :
                  currentQuestion.questionType === 'true-false' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {currentQuestion.questionType === 'mcq' ? 'Multiple Choice' :
                   currentQuestion.questionType === 'true-false' ? 'True/False' : 'Fill in the Blank'}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ml-2 ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                </span>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.questionType === 'mcq' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestionIndex}`}
                          value={option.text}
                          checked={answers[currentQuestionIndex]?.selectedOption === option.text}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          className="mr-3 h-4 w-4 text-blue-600"
                        />
                        <span className="text-gray-900">{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.questionType === 'true-false' && (
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestionIndex}`}
                        value="true"
                        checked={answers[currentQuestionIndex]?.selectedOption === "true"}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-gray-900">True</span>
                    </label>
                    <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestionIndex}`}
                        value="false"
                        checked={answers[currentQuestionIndex]?.selectedOption === "false"}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-gray-900">False</span>
                    </label>
                  </div>
                )}

                {currentQuestion.questionType === 'fill-blank' && (
                  <div>
                    <input
                      type="text"
                      value={answers[currentQuestionIndex]?.answer || ''}
                      onChange={(e) => handleAnswerChange(e.target.value, 'answer')}
                      placeholder="Enter your answer"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {currentQuiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : answers[index]?.selectedOption || answers[index]?.answer
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to submit the quiz? You cannot change your answers after submission.')) {
                      handleSubmitQuiz();
                    }
                  }}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render results
  if (currentView === "review" && quizResult) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                quizResult.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Trophy className={`w-10 h-10 ${quizResult.passed ? 'text-green-600' : 'text-red-600'}`} />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
              <p className="text-gray-600">Here are your results</p>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{quizResult.score}</p>
                <p className="text-sm text-gray-600">Score</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{quizResult.totalMarks}</p>
                <p className="text-sm text-gray-600">Total Marks</p>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{quizResult.percentage.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Percentage</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className={`text-2xl font-bold ${quizResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {quizResult.passed ? 'PASS' : 'FAIL'}
                </p>
                <p className="text-sm text-gray-600">Result</p>
              </div>
            </div>

            {/* Performance Category */}
            <div className="mb-8 text-center">
              <div className={`inline-flex px-4 py-2 rounded-full text-lg font-semibold ${
                quizResult.performanceCategory === 'green' ? 'bg-green-100 text-green-800' :
                quizResult.performanceCategory === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Performance: {
                  quizResult.performanceCategory === 'green' ? 'Excellent' :
                  quizResult.performanceCategory === 'yellow' ? 'Good' : 'Needs Improvement'
                }
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Passing Marks: {quizResult.passingMarks} | Attempt #{quizResult.attemptNumber}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              <button
                onClick={() => {
                  setCurrentView("list");
                  setCurrentQuiz(null);
                  setActiveQuizId(null);
                  setQuizResult(null);
                  setAnswers([]);
                  setCurrentQuestionIndex(0);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-4"
              >
                Back to Quiz List
              </button>

              {/* Show retake option if allowed and failed */}
              {currentQuiz?.allowRetake && !quizResult.passed && (
                <button
                  onClick={() => startQuiz(activeQuizId)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Retake Quiz
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