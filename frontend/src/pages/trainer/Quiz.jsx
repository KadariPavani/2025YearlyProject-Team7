import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import { PlusCircle, Users, BarChart, Trash2, CheckSquare, BookOpen, Calendar, ChevronLeft, RefreshCw } from 'lucide-react';

const Quiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subject, setSubject] = useState(''); // Modified: Single subject string
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '', // Will be set to subjectDealing
    scheduledDate: '',
    startTime: '',
    endTime: '',
    duration: '',
    totalMarks: '',
    passingMarks: '',
    assignedPlacementBatches: [],
    shuffleQuestions: false,
    showResultsImmediately: true,
    allowRetake: false,
    questions: [{
      questionText: '',
      questionType: 'mcq',
      options: [{ text: '', isCorrect: false }],
      correctAnswer: '',
      marks: 1,
      difficulty: 'medium',
      explanation: ''
    }]
  });
  const [activeTab, setActiveTab] = useState('list');
  const [batchProgress, setBatchProgress] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    fetchBatches();
    fetchSubject(); // Modified: Fetch single subject
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes`, {
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

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/batches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBatches(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batches');
      console.error('Error fetching batches:', err);
    }
  };

  // Modified: Fetch single subject
  const fetchSubject = async () => {
    try {
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedSubject = Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : '';
      setSubject(fetchedSubject);
      setFormData(prev => ({ ...prev, subject: fetchedSubject }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subject');
      console.error('Error fetching subject:', err);
    }
  };

  const handleInputChange = (e, index, optionIndex) => {
    const { name, value, type, checked } = e.target;

    try {
      if (index !== undefined && optionIndex !== undefined) {
        // Option-level changes
        const newQuestions = [...formData.questions];
        newQuestions[index].options[optionIndex][name] = type === 'checkbox' ? checked : value;
        setFormData({ ...formData, questions: newQuestions });
      } else if (index !== undefined) {
        // Question-level changes
        const newQuestions = [...formData.questions];
        newQuestions[index][name] = type === 'checkbox' ? checked : value;
        setFormData({ ...formData, questions: newQuestions });
      } else if (name !== 'subject') { // Prevent manual subject changes
        // Form-level changes
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
      }
    } catch (err) {
      setError('Error updating form data');
      console.error('Error in handleInputChange:', err);
    }
  };

  const handleToggleBatch = (batchId) => {
    setFormData(prev => ({
      ...prev,
      assignedPlacementBatches: prev.assignedPlacementBatches.includes(batchId)
        ? prev.assignedPlacementBatches.filter(id => id !== batchId)
        : [...prev.assignedPlacementBatches, batchId]
    }));
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, {
        questionText: '',
        questionType: 'mcq',
        options: [{ text: '', isCorrect: false }],
        correctAnswer: '',
        marks: 1,
        difficulty: 'medium',
        explanation: ''
      }]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options.push({ text: '', isCorrect: false });
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      // Calculate total marks
      const totalMarks = formData.questions.reduce((sum, q) => sum + (parseInt(q.marks) || 1), 0);
      
      // Compute explicit scheduled start / end datetimes (frontend local time -> convert to ISO UTC)
      const payload = {
        ...formData,
        totalMarks,
        passingMarks: formData.passingMarks || Math.ceil(totalMarks * 0.4) // Default 40% passing
      };

      if (formData.scheduledDate && formData.startTime) {
        const [y, m, d] = formData.scheduledDate.split('-').map(Number);
        const [sh, sm] = (formData.startTime || '00:00').split(':').map(Number);
        const [eh, em] = (formData.endTime || '00:00').split(':').map(Number);
        const scheduledStartISO = new Date(y, m - 1, d, sh, sm, 0).toISOString();
        let scheduledEndISO = new Date(y, m - 1, d, eh, em, 0).toISOString();
        // If end-time precedes or equals start-time, assume next day
        if (new Date(scheduledEndISO) <= new Date(scheduledStartISO)) {
          scheduledEndISO = new Date(new Date(scheduledEndISO).getTime() + 24 * 60 * 60 * 1000).toISOString();
        }
        payload.scheduledStart = scheduledStartISO;
        payload.scheduledEnd = scheduledEndISO;
      }

      // DEBUG: Show payload batches so we can verify regular vs placement assignment
      console.log('DEBUG creating quiz payload', {
        assignedBatches: payload.assignedBatches,
        assignedPlacementBatches: payload.assignedPlacementBatches,
        batchType: payload.batchType
      });

      await axios.post('/api/quizzes', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        subject: subject, // Keep subject as fetched
        scheduledDate: '',
        startTime: '',
        endTime: '',
        duration: '',
        totalMarks: '',
        passingMarks: '',
        assignedPlacementBatches: [],
        shuffleQuestions: false,
        showResultsImmediately: true,
        allowRetake: false,
        questions: [{
          questionText: '',
          questionType: 'mcq',
          options: [{ text: '', isCorrect: false }],
          correctAnswer: '',
          marks: 1,
          difficulty: 'medium',
          explanation: ''
        }]
      });

      setActiveTab('list');
      await fetchQuizzes();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz');
      console.error('Error creating quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchProgress = async (quizId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`/api/quizzes/${quizId}/batch-progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBatchProgress(response.data);
      setSelectedQuizId(quizId);
      setActiveTab('progress');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batch progress');
      console.error('Error fetching batch progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      await axios.delete(`/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete quiz');
      console.error('Error deleting quiz:', err);
    } finally {
      setLoading(false);
    }
  };



  const renderQuizForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Section: Basic Information */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Basic Information</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quiz Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              placeholder="Subject (auto-filled)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter quiz description"
          />
        </div>
        </div>
      </div>

      {/* Section: Schedule & Duration */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Schedule & Duration</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date *
            </label>
            <input
              type="date"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes) *
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter duration"
            />
          </div>
        </div>
        </div>
      </div>

      {/* Section: Batch Assignment */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Batch Assignment</h3>
        </div>
        <div className="p-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Select Batches *
          </label>
          <div className="max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-md bg-white">
            {batches.map((batch) => {
              const id = batch._id;
              const checked = formData.assignedPlacementBatches.includes(id);
              return (
                <label key={id} className="flex items-center gap-3 text-sm mb-1">
                  <input type="checkbox" checked={checked} onChange={() => handleToggleBatch(id)} className="w-4 h-4" />
                  <span>{batch.batchNumber} - {batch.techStack}{batch.studentCount ? ` (${batch.studentCount} students)` : ''}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-1">Click checkboxes to select multiple batches</p>
        </div>
      </div>

      {/* Section: Quiz Settings */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Settings</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="shuffleQuestions"
              checked={formData.shuffleQuestions}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Shuffle Questions
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="showResultsImmediately"
              checked={formData.showResultsImmediately}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Show Results Immediately
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="allowRetake"
              checked={formData.allowRetake}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Allow Retake
            </label>
          </div>
        </div>
        </div>
      </div>

      {/* Section: Questions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Questions</h3>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Question
          </button>
        </div>
        <div className="p-4 space-y-4">

          {formData.questions.map((question, questionIndex) => (
            <div key={questionIndex} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs sm:text-sm font-medium">Question {questionIndex + 1}</h4>
                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text *
                  </label>
                  <textarea
                    name="questionText"
                    value={question.questionText}
                    onChange={(e) => handleInputChange(e, questionIndex)}
                    required
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter question text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="questionType"
                    value={question.questionType}
                    onChange={(e) => handleInputChange(e, questionIndex)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="fill-blank">Fill in the Blank</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    name="marks"
                    value={question.marks}
                    onChange={(e) => handleInputChange(e, questionIndex)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={question.difficulty}
                    onChange={(e) => handleInputChange(e, questionIndex)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {question.questionType === 'fill-blank' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer
                    </label>
                    <input
                      type="text"
                      name="correctAnswer"
                      value={question.correctAnswer}
                      onChange={(e) => handleInputChange(e, questionIndex)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter correct answer"
                    />
                  </div>
                )}
              </div>

              {/* Options for MCQ and True/False */}
              {question.questionType === 'mcq' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Options
                    </label>
                    <button
                      type="button"
                      onClick={() => addOption(questionIndex)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Option
                    </button>
                  </div>

                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2 mb-2 min-w-0">
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={option.isCorrect}
                        onChange={() => {
                          const newQuestions = [...formData.questions];
                          newQuestions[questionIndex].options.forEach((opt, i) => {
                            opt.isCorrect = i === optionIndex;
                          });
                          setFormData({ ...formData, questions: newQuestions });
                        }}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <input
                          type="text"
                          name="text"
                          value={option.text}
                          onChange={(e) => handleInputChange(e, questionIndex, optionIndex)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1 min-w-0 px-3 py-2 text-sm border-none focus:outline-none focus:ring-0"
                        />
                        {question.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                            className="flex-shrink-0 px-2.5 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {question.questionType === 'true-false' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`truefalse-${questionIndex}`}
                        value="true"
                        checked={question.correctAnswer === 'true'}
                        onChange={(e) => {
                          const newQuestions = [...formData.questions];
                          newQuestions[questionIndex].correctAnswer = 'true';
                          setFormData({ ...formData, questions: newQuestions });
                        }}
                        className="mr-2"
                      />
                      True
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`truefalse-${questionIndex}`}
                        value="false"
                        checked={question.correctAnswer === 'false'}
                        onChange={(e) => {
                          const newQuestions = [...formData.questions];
                          newQuestions[questionIndex].correctAnswer = 'false';
                          setFormData({ ...formData, questions: newQuestions });
                        }}
                        className="mr-2"
                      />
                      False
                    </label>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation (Optional)
                </label>
                <textarea
                  name="explanation"
                  value={question.explanation}
                  onChange={(e) => handleInputChange(e, questionIndex)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter explanation for this question"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs sm:text-sm transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !subject}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm transition"
        >
          {loading ? 'Creating...' : 'Create Quiz'}
        </button>
      </div>
    </form>
  );

  const renderQuizList = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {loading ? (
        <LoadingSkeleton />
      ) : quizzes.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm sm:text-base">No quizzes found</p>
          <p className="text-gray-400">Create your first quiz to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Title</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Date</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Duration</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Qs</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Marks</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batches</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quizzes.map((quiz, idx) => (
                <tr key={quiz._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{quiz.title}</div>
                  </td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{quiz.subject}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                    {new Date(quiz.scheduledDate).toLocaleDateString()}{quiz.startTime ? ` ${quiz.startTime}` : ''}
                  </td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{quiz.duration}m</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{quiz.questions?.length || 0}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{quiz.totalMarks}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {quiz.assignedPlacementBatches?.map(b => (
                        <span key={b._id || b.batchNumber} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">{b.batchNumber}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => fetchBatchProgress(quiz._id)}
                        className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
                      >
                        <BarChart className="h-3 w-3" /><span className="hidden sm:inline">Progress</span>
                      </button>
                      <button
                        onClick={() => deleteQuiz(quiz._id)}
                        className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /><span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBatchProgress = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">

      {batchProgress && (
        <div>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-lg sm:text-xl font-bold text-blue-600">{batchProgress.stats.totalSubmissions}</p>
              <p className="text-xs sm:text-sm text-gray-600">Total Submissions</p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg text-center">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mx-auto mb-2" />
              <p className="text-lg sm:text-xl font-bold text-green-600">{batchProgress.stats.passedCount}</p>
              <p className="text-xs sm:text-sm text-gray-600">Passed</p>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mx-auto mb-2" />
              <p className="text-lg sm:text-xl font-bold text-yellow-600">{batchProgress.stats.averagePercentage.toFixed(1)}%</p>
              <p className="text-xs sm:text-sm text-gray-600">Average Score</p>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <BarChart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mx-auto mb-2" />
              <p className="text-lg sm:text-xl font-bold text-purple-600">{batchProgress.stats.averageScore.toFixed(1)}</p>
              <p className="text-xs sm:text-sm text-gray-600">Average Marks</p>
            </div>
          </div>

          {/* Average Percentage Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Average Completion</div>
              <div className="text-xs text-gray-500">{batchProgress.stats.averagePercentage.toFixed(1)}%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-400" style={{ width: `${Math.max(0, Math.min(100, batchProgress.stats.averagePercentage))}%` }} />
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="mb-8">
            <h3 className="text-sm sm:text-lg font-semibold mb-3">Performance Distribution</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-green-100 p-3 rounded-lg text-center">
                <p className="text-xl font-bold text-green-600">{batchProgress.stats.performanceDistribution.green}</p>
                <p className="text-xs text-green-800">Excellent (80%+)</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg text-center">
                <p className="text-xl font-bold text-yellow-600">{batchProgress.stats.performanceDistribution.yellow}</p>
                <p className="text-xs text-yellow-800">Good (60-79%)</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg text-center">
                <p className="text-xl font-bold text-red-600">{batchProgress.stats.performanceDistribution.red}</p>
                <p className="text-xs text-red-800">Needs Improvement (0-60%)</p>
              </div>
            </div>
          </div>

          {/* Student Submissions */}
          <div>
            <h3 className="text-sm sm:text-lg font-semibold mb-4">Student Submissions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batchProgress.progress.map((submission, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-8 rounded ${submission.performanceCategory === 'green' ? 'bg-green-500' : submission.performanceCategory === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.studentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.rollNo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.college}</div>
                        <div className="text-sm text-gray-500">{submission.branch}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.score} / {batchProgress.stats.totalMarks || 100}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.percentage.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          submission.performanceCategory === 'green' 
                            ? 'bg-green-100 text-green-800'
                            : submission.performanceCategory === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {submission.performanceCategory === 'green' 
                            ? 'Excellent' 
                            : submission.performanceCategory === 'yellow'
                            ? 'Good'
                            : 'Needs Improvement'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.submittedAt).toLocaleDateString()} {new Date(submission.submittedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked list fallback */}
            <div className="sm:hidden space-y-3 mt-4">
              {batchProgress.progress.map((submission, idx) => (
                <div key={idx} className={`bg-white border rounded-lg p-3 border-l-4 ${submission.performanceCategory === 'green' ? 'border-green-400' : submission.performanceCategory === 'yellow' ? 'border-yellow-400' : 'border-red-400'}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{submission.studentName}</div>
                      <div className="text-xs text-gray-500 truncate">{submission.college} • {submission.branch}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{submission.score} / {batchProgress.stats.totalMarks || 100}</div>
                      <div className="text-xs text-gray-500">{submission.percentage.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      submission.performanceCategory === 'green' ? 'bg-green-100 text-green-800' : submission.performanceCategory === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {submission.performanceCategory === 'green' ? 'Excellent' : submission.performanceCategory === 'yellow' ? 'Good' : 'Needs Improvement'}
                    </span>
                    <div className="text-xs text-gray-500">{new Date(submission.submittedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Shared Header */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
                {activeTab === 'create' ? 'Create Quiz' : activeTab === 'progress' ? 'Quiz Progress' : 'Quizzes'}
              </h2>
              <p className="text-xs text-gray-500">{quizzes.length} quizzes created</p>
            </div>
          </div>
          {activeTab === 'list' ? (
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create Quiz</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('list')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to List</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      {activeTab === 'list' && renderQuizList()}
      {activeTab === 'create' && renderQuizForm()}
      {activeTab === 'progress' && renderBatchProgress()}
    </div>
  );
};

export default Quiz;