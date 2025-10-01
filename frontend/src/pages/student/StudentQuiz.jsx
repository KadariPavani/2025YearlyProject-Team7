// This is your StudentQuiz.jsx - Updated to handle different question types, fetch full quiz on start, use hasSubmitted/score from backend, handle answers correctly.
// Also, added timeSpent mock (you can add timer), and adjusted UI for true-false and fill-blank.

import React, { useState, useEffect } from "react";
import axios from "axios";

// Main StudentQuiz component to manage the application's state and views.
export default function StudentQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [currentView, setCurrentView] = useState("list"); // 'list', 'quiz', 'review'
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem('userToken');
        if (!token) return;
        // Fetch all quizzes for students (no batch filter)
        const response = await axios.get('/api/quizzes/student/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuizzes(response.data.map(q => ({
          ...q,
          id: q._id,
          status: q.hasSubmitted ? 'submitted' : 'pending',
          userScore: q.score,
          maxScore: q.totalMarks
        })));
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      }
    };
    fetchQuizzes();
  }, []);

  // --- Utility Functions ---

  const totalQuizzes = quizzes.length;
  const submittedQuizzes = quizzes.filter(q => q.status === "submitted").length;
  const pendingQuizzes = quizzes.filter(q => q.status === "pending").length;

  const handleStartQuiz = async (id) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`/api/quizzes/student/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentQuiz(response.data);
      setActiveQuizId(id);
      setCurrentView("quiz");
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert(error.response?.data?.message || 'Failed to start quiz');
    }
  };

  const handleReviewQuiz = (id) => {
    setActiveQuizId(id);
    setCurrentView("review");
  };

  const handleSubmitQuiz = async (answers, quizId, score) => {
    try {
      const token = localStorage.getItem('userToken');
      const userData = JSON.parse(localStorage.getItem('userData'));
      const response = await axios.post(`/api/quizzes/${quizId}/submit`, {
        answers,
        studentId: userData._id,
        timeSpent: 0 // Add a timer to track actual time if needed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local quizzes with new score
      setQuizzes(quizzes.map(quiz =>
        quiz.id === quizId ? { ...quiz, status: "submitted", userScore: response.data.score } : quiz
      ));
      setCurrentView("list");
    } catch (err) {
      console.error('Error submitting quiz:', err);
    }
  };

  const handleGoBack = () => {
    setCurrentView("list");
  };

  const getActiveQuiz = () => quizzes.find(q => q.id === activeQuizId);

  // --- View Components ---

  const QuizListView = () => (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 sm:mb-10 text-gray-800">Quiz Dashboard</h1>
      {/* Quiz Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-500 transform transition-transform hover:scale-105">
          <h2 className="text-xl font-semibold text-gray-600">Total Quizzes</h2>
          <p className="text-4xl sm:text-5xl font-bold text-blue-600 mt-2">{totalQuizzes}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-green-500 transform transition-transform hover:scale-105">
          <h2 className="text-xl font-semibold text-gray-600">Submitted</h2>
          <p className="text-4xl sm:text-5xl font-bold text-green-600 mt-2">{submittedQuizzes}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-yellow-500 transform transition-transform hover:scale-105">
          <h2 className="text-xl font-semibold text-gray-600">Pending</h2>
          <p className="text-4xl sm:text-5xl font-bold text-yellow-600 mt-2">{pendingQuizzes}</p>
        </div>
      </div>
      {/* Quiz List */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">All Quizzes</h2>
        <div className="space-y-4">
          {quizzes.map(quiz => (
            <div
              key={quiz.id}
              className={`bg-white p-4 sm:p-6 rounded-xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between ${quiz.status === 'pending' ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
              onClick={() => quiz.status === 'pending' ? handleStartQuiz(quiz.id) : handleReviewQuiz(quiz.id)}
            >
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg font-bold text-gray-800">{quiz.title}</h3>
                <p className={`text-sm font-medium ${quiz.status === 'submitted' ? 'text-green-500' : 'text-yellow-500'}`}>
                  Status: {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                </p>
                {/* Show marks if submitted */}
                {quiz.status === "submitted" && (
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    Your Score: {quiz.userScore} / {quiz.maxScore}
                  </p>
                )}
              </div>
              <div className="w-full sm:w-auto">
                {quiz.status === "submitted" ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReviewQuiz(quiz.id); }}
                    className="w-full sm:w-auto py-2 px-4 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors duration-200 shadow-md"
                  >
                    View Score
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartQuiz(quiz.id); }}
                    className="w-full sm:w-auto py-2 px-4 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 transition-colors duration-200 shadow-md"
                  >
                    Start Quiz
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const QuizActiveView = () => {
    if (!currentQuiz) return null;
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState(Array(currentQuiz.questions.length).fill(null));
    const [fillAnswer, setFillAnswer] = useState('');
    const [showSubmit, setShowSubmit] = useState(false);

    const handleAnswer = (isCorrect, selected) => {
      const question = currentQuiz.questions[currentQuestion];
      const updatedAnswers = [...answers];
      if (question.questionType === 'fill-blank') {
        updatedAnswers[currentQuestion] = { answer: selected };
      } else {
        updatedAnswers[currentQuestion] = { selectedOption: selected };
      }
      setAnswers(updatedAnswers);

      if (isCorrect) {
        setScore(score + question.marks);
      }

      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < currentQuiz.questions.length) {
        setCurrentQuestion(nextQuestion);
        setFillAnswer('');
      } else {
        setShowSubmit(true); // Show submit button after last question
      }
    };

    const handleFinalSubmit = () => {
      handleSubmitQuiz(answers, currentQuiz._id, score);
    };

    // Prevent copy/paste/tab etc.
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
      }
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
    };

    const question = currentQuiz.questions[currentQuestion];
    return (
      <div
        className="p-4 sm:p-8 min-h-screen bg-gray-100 flex items-center justify-center"
        onKeyDown={handleKeyDown}
        onCopy={handleCopyPaste}
        onCut={handleCopyPaste}
        onContextMenu={handleCopyPaste}
      >
        <div className="w-full max-w-md md:max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 transform transition-transform duration-300 hover:scale-105">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{currentQuiz.title}</h2>
            <button onClick={handleGoBack} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Question Section */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-500 mb-2">
              Question {currentQuestion + 1}/{currentQuiz.questions.length}
            </div>
            <div className="text-lg sm:text-xl font-semibold text-gray-700">
              {question.questionText}
            </div>
          </div>
          {/* Answer Section */}
          <div className="grid gap-3">
            {question.questionType === 'mcq' && question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.isCorrect, option.text)}
                className="w-full py-3 sm:py-4 px-6 bg-blue-500 text-white rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 shadow-sm"
              >
                {option.text}
              </button>
            ))}
            {question.questionType === 'true-false' && (
              <>
                <button
                  onClick={() => handleAnswer('true' === question.correctAnswer.toLowerCase(), 'true')}
                  className="w-full py-3 sm:py-4 px-6 bg-blue-500 text-white rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                >
                  True
                </button>
                <button
                  onClick={() => handleAnswer('false' === question.correctAnswer.toLowerCase(), 'false')}
                  className="w-full py-3 sm:py-4 px-6 bg-blue-500 text-white rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                >
                  False
                </button>
              </>
            )}
            {question.questionType === 'fill-blank' && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={fillAnswer}
                  onChange={(e) => setFillAnswer(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-lg"
                  placeholder="Type your answer here"
                />
                <button
                  onClick={() => handleAnswer(fillAnswer.toLowerCase() === question.correctAnswer.toLowerCase(), fillAnswer)}
                  disabled={!fillAnswer.trim()}
                  className="w-full py-3 px-6 bg-green-500 text-white rounded-lg text-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors duration-200 shadow-sm"
                >
                  Submit Answer
                </button>
              </div>
            )}
          </div>
          {!showSubmit ? (
            <div className="grid gap-3">
              {question.questionType === 'mcq' && question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option.isCorrect, option.text)}
                  className="w-full py-3 sm:py-4 px-6 bg-blue-500 text-white rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                >
                  {option.text}
                </button>
              ))}
              {question.questionType === 'true-false' && (
                <>
                  <button
                    onClick={() => handleAnswer('true' === question.correctAnswer.toLowerCase(), 'true')}
                    className="w-full py-3 sm:py-4 px-6 bg-blue-500 text-white rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                  >
                    True
                  </button>
                  <button
                    onClick={() => handleAnswer('false' === question.correctAnswer.toLowerCase(), 'false')}
                    className="w-full py-3 sm:py-4 px-6 bg-blue-500 text-white rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                  >
                    False
                  </button>
                </>
              )}
              {question.questionType === 'fill-blank' && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={fillAnswer}
                    onChange={(e) => setFillAnswer(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg text-lg"
                    placeholder="Type your answer here"
                  />
                  <button
                    onClick={() => handleAnswer(fillAnswer.toLowerCase() === question.correctAnswer.toLowerCase(), fillAnswer)}
                    disabled={!fillAnswer.trim()}
                    className="w-full py-3 px-6 bg-green-500 text-white rounded-lg text-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors duration-200 shadow-sm"
                  >
                    Submit Answer
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleFinalSubmit}
              className="w-full py-3 px-6 bg-green-500 text-white rounded-lg text-lg font-bold hover:bg-green-600 transition-colors duration-200 shadow-lg mt-4"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    );
  };

  const QuizReviewView = () => {
    const quiz = getActiveQuiz();
    if (!quiz) return null;

    return (
      <div className="p-4 sm:p-8 min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-md md:max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 transform transition-transform duration-300 hover:scale-105">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{quiz.title}</h2>
            <button onClick={handleGoBack} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700">Quiz Results</h3>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-medium">Total Questions</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-600">{quiz.questions ? quiz.questions.length : 'N/A'}</p>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-medium">Your Score</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-green-600">{quiz.userScore} <span className="text-xl font-semibold text-gray-400">out of {quiz.maxScore}</span></p>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={handleGoBack}
              className="w-full sm:w-auto py-3 px-8 bg-purple-500 text-white rounded-lg text-lg font-bold hover:bg-purple-600 transition-colors duration-200 shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render Logic ---
  let content;
  switch (currentView) {
    case "list":
      content = <QuizListView />;
      break;
    case "quiz":
      content = <QuizActiveView />;
      break;
    case "review":
      content = <QuizReviewView />;
      break;
    default:
      content = <QuizListView />;
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
      <div className="font-sans antialiased text-gray-900 bg-gray-100">
        {content}
      </div>
    </>
  );
}