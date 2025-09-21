// src/components/trainer/Quiz.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Users, BarChart, Trash2, CheckSquare } from 'lucide-react';

const Quiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    duration: '',
    totalMarks: '',
    passingMarks: '',
    assignedBatches: [],
    shuffleQuestions: false,
    showResultsImmediately: true,
    allowRetake: false,
    questions: [{ questionText: '', questionType: 'mcq', options: [{ text: '', isCorrect: false }], correctAnswer: '', marks: 1, difficulty: 'medium', explanation: '' }],
  });
  const [activeTab, setActiveTab] = useState('list');
  const [batchProgress, setBatchProgress] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    fetchBatches();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      const response = await axios.get('/api/quizzes', {
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
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      const response = await axios.get('/api/quizzes/batches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batches');
      console.error('Error fetching batches:', err);
    }
  };

  const handleInputChange = (e, index, optionIndex) => {
    const { name, value, type, checked } = e.target;
    try {
      if (index !== undefined && optionIndex !== undefined) {
        const newQuestions = [...formData.questions];
        newQuestions[index].options[optionIndex][name] = type === 'checkbox' ? checked : value;
        setFormData({ ...formData, questions: newQuestions });
      } else if (index !== undefined) {
        const newQuestions = [...formData.questions];
        newQuestions[index][name] = type === 'checkbox' ? checked : value;
        setFormData({ ...formData, questions: newQuestions });
      } else {
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
      }
    } catch (err) {
      setError('Error updating form data');
      console.error('Error in handleInputChange:', err);
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { questionText: '', questionType: 'mcq', options: [{ text: '', isCorrect: false }], correctAnswer: '', marks: 1, difficulty: 'medium', explanation: '' }],
    });
  };

  const addOption = (index) => {
    const newQuestions = [...formData.questions];
    newQuestions[index].options.push({ text: '', isCorrect: false });
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      const response = await axios.post('/api/quizzes', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({
        title: '',
        description: '',
        subject: '',
        scheduledDate: '',
        startTime: '',
        endTime: '',
        duration: '',
        totalMarks: '',
        passingMarks: '',
        assignedBatches: [],
        shuffleQuestions: false,
        showResultsImmediately: true,
        allowRetake: false,
        questions: [{ questionText: '', questionType: 'mcq', options: [{ text: '', isCorrect: false }], correctAnswer: '', marks: 1, difficulty: 'medium', explanation: '' }],
      });
      setActiveTab('list');
      await fetchQuizzes();
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
      const token = localStorage.getItem('trainerToken');
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
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Management</h2>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
      {loading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>}

      <div className="mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`mr-4 px-4 py-2 rounded ${activeTab === 'list' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Quiz List
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded ${activeTab === 'create' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Create Quiz
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Your Quizzes</h3>
          {quizzes.length === 0 ? (
            <p className="text-gray-600">No quizzes found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="border rounded-lg p-4">
                  <h4 className="font-semibold">{quiz.title}</h4>
                  <p className="text-sm text-gray-600">{quiz.subject}</p>
                  <p className="text-sm text-gray-600">
                    Scheduled: {new Date(quiz.scheduledDate).toLocaleDateString()} {quiz.startTime}
                  </p>
                  <p className="text-sm text-gray-600">
                    Batches: {(quiz.assignedBatches || []).map((b) => b.name).join(', ') || 'None'}
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => fetchBatchProgress(quiz._id)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <BarChart className="h-5 w-5 mr-1" /> Progress
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz._id)}
                      className="flex items-center text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5 mr-1" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Quiz</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 p-2 border rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="mt-1 p-2 border rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                className="mt-1 p-2 border rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="mt-1 p-2 border rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="mt-1 p-2 border rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="mt-1 p-2 border rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Marks</label>
              <input
                type="number"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleInputChange}
                className="mt-1 p-2 border rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passing Marks</label>
              <input
                type="number"
                name="passingMarks"
                value={formData.passingMarks}
                onChange={handleInputChange}
                className="mt-1 p-2 border rounded w-full"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Assign Batches</label>
            <select
              multiple
              name="assignedBatches"
              value={formData.assignedBatches}
              onChange={(e) => setFormData({ ...formData, assignedBatches: Array.from(e.target.selectedOptions, (option) => option.value) })}
              className="mt-1 p-2 border rounded w-full"
            >
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="shuffleQuestions"
                checked={formData.shuffleQuestions}
                onChange={handleInputChange}
                className="mr-2"
              />
              Shuffle Questions
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="showResultsImmediately"
                checked={formData.showResultsImmediately}
                onChange={handleInputChange}
                className="mr-2"
              />
              Show Results Immediately
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="allowRetake"
                checked={formData.allowRetake}
                onChange={handleInputChange}
                className="mr-2"
              />
              Allow Retake
            </label>
          </div>
          <h4 className="text-lg font-semibold mb-4">Questions</h4>
          {formData.questions.map((question, qIndex) => (
            <div key={qIndex} className="border p-4 rounded mb-4">
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Question {qIndex + 1}</label>
                <input
                  type="text"
                  name="questionText"
                  value={question.questionText}
                  onChange={(e) => handleInputChange(e, qIndex)}
                  className="mt-1 p-2 border rounded w-full"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Question Type</label>
                <select
                  name="questionType"
                  value={question.questionType}
                  onChange={(e) => handleInputChange(e, qIndex)}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="fill-blank">Fill in the Blank</option>
                </select>
              </div>
              {question.questionType === 'mcq' && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center mb-2">
                      <input
                        type="text"
                        name="text"
                        value={option.text}
                        onChange={(e) => handleInputChange(e, qIndex, oIndex)}
                        className="mt-1 p-2 border rounded w-full mr-2"
                        required
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isCorrect"
                          checked={option.isCorrect}
                          onChange={(e) => handleInputChange(e, qIndex, oIndex)}
                          className="mr-2"
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Add Option
                  </button>
                </div>
              )}
              {(question.questionType === 'true-false' || question.questionType === 'fill-blank') && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                  <input
                    type="text"
                    name="correctAnswer"
                    value={question.correctAnswer}
                    onChange={(e) => handleInputChange(e, qIndex)}
                    className="mt-1 p-2 border rounded w-full"
                    required
                  />
                </div>
              )}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Marks</label>
                <input
                  type="number"
                  name="marks"
                  value={question.marks}
                  onChange={(e) => handleInputChange(e, qIndex)}
                  className="mt-1 p-2 border rounded w-full"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                <select
                  name="difficulty"
                  value={question.difficulty}
                  onChange={(e) => handleInputChange(e, qIndex)}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Explanation</label>
                <textarea
                  name="explanation"
                  value={question.explanation}
                  onChange={(e) => handleInputChange(e, qIndex)}
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addQuestion}
            className="text-green-600 hover:text-green-800 mb-4"
          >
            Add Question
          </button>
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Create Quiz
          </button>
        </form>
      )}

      {activeTab === 'progress' && batchProgress && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Batch Progress</h3>
          <div className="mb-4">
            <button
              onClick={() => setActiveTab('list')}
              className="text-green-600 hover:text-green-800"
            >
              Back to Quizzes
            </button>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold">Batch Members</h4>
            <ul className="list-disc pl-5">
              {batchProgress.progress.map((student) => (
                <li key={student.studentId} className="text-gray-600">
                  {student.studentName} - Score: {student.score} ({student.percentage}%) -{' '}
                  <span
                    className={`inline-block px-2 py-1 rounded ${
                      student.performanceCategory === 'green'
                        ? 'bg-green-100 text-green-800'
                        : student.performanceCategory === 'yellow'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {student.performanceCategory.charAt(0).toUpperCase() + student.performanceCategory.slice(1)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Progress Summary</h4>
            <p className="text-gray-600">
              Total Students: {batchProgress.progress.length} | Green:{' '}
              {batchProgress.progress.filter((p) => p.performanceCategory === 'green').length} | Yellow:{' '}
              {batchProgress.progress.filter((p) => p.performanceCategory === 'yellow').length} | Red:{' '}
              {batchProgress.progress.filter((p) => p.performanceCategory === 'red').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;