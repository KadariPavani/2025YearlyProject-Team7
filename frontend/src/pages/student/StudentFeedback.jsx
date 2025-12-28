import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, Eye, CheckCircle, Clock, User, X, AlertCircle, Trash2 } from 'lucide-react';
import axios from 'axios';

const StudentFeedback = () => {
  const [activeView, setActiveView] = useState('submit');
  const [trainers, setTrainers] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 5,
    category: 'training',
    toTrainer: '',
    isAnonymous: false,
    suggestions: ''
  });

  useEffect(() => {
    fetchTrainers();
    fetchMyFeedbacks();
  }, []);

  const fetchTrainers = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        console.error('No token found');
        return;
      }

      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/student/trainers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setTrainers(res.data.data || []);
      } else {
        console.warn('Unexpected trainers payload:', res.data);
        setError('Failed to fetch trainers');
      }
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('Could not load trainers. Please try again.');
      setTrainers([]);
    }
  };

  const fetchMyFeedbacks = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/student/my-feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyFeedbacks(response.data.data || []);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('userToken');
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/submit`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Feedback submitted successfully!');
      setFormData({
        title: '',
        content: '',
        rating: 5,
        category: 'training',
        toTrainer: '',
        isAnonymous: false,
        suggestions: ''
      });
      fetchMyFeedbacks();
      setTimeout(() => setActiveView('history'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDelete = async (feedbackId) => {
    try {
      if (!feedbackId) {
        console.error('No feedback ID provided');
        return;
      }

      console.log('Deleting feedback with ID:', feedbackId); // Debug log

      const token = localStorage.getItem('userToken');
      const response = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/${feedbackId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response:', response); // Debug log

      if (response.data.success) {
        setMessage('Feedback deleted successfully');
        setMyFeedbacks(prev => prev.filter(f => f._id !== feedbackId));
        setShowDeleteConfirm(false);
        setFeedbackToDelete(null);
      } else {
        setError(response.data.message || 'Failed to delete feedback');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete feedback');
      setShowDeleteConfirm(false);
      setFeedbackToDelete(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'responded': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      training: 'Training',
      placement: 'Placement',
      facilities: 'Facilities',
      coordinator: 'Coordinator',
      general: 'General'
    };
    return labels[category] || category;
  };

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Delete Feedback?</h4>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this feedback? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowDeleteConfirm(false);
              setFeedbackToDelete(null);
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDelete(feedbackToDelete)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-7 w-7 text-blue-600" />
              Feedback System
            </h3>
            <p className="text-gray-600 mt-1">Share your experience and help us improve</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveView('submit')}
            className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
              activeView === 'submit'
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Submit Feedback
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
              activeView === 'history'
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            My Feedback History
          </button>
        </div>
      </div>

      {/* Submit Feedback Form */}
      {activeView === 'submit' && (
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </p>
            </div>
          )}

          {message && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-700 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Feedback Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief title for your feedback"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="training">Training</option>
                  <option value="placement">Placement</option>
                  <option value="facilities">Facilities</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Trainer *
                </label>
                <select
                  name="toTrainer"
                  value={formData.toTrainer}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a trainer</option>
                  {trainers.map(trainer => (
                    <option key={trainer._id} value={trainer._id}>
                      {trainer.name} - {trainer.subjectDealing}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {formData.rating}/5
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Feedback Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your detailed feedback..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/2000 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Suggestions (Optional)
              </label>
              <textarea
                name="suggestions"
                value={formData.suggestions}
                onChange={handleInputChange}
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any suggestions for improvement..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.suggestions.length}/1000 characters
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isAnonymous"
                id="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isAnonymous" className="text-sm text-gray-700">
                Submit as anonymous (Your identity will be hidden)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      )}

      {/* Feedback History */}
      {activeView === 'history' && (
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            My Feedback History ({myFeedbacks.length})
          </h4>

          {myFeedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No feedback submitted yet</p>
              <button
                onClick={() => setActiveView('submit')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Submit your first feedback →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myFeedbacks.map(feedback => (
                <div
                  key={feedback._id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="text-lg font-semibold text-gray-900 mb-1">
                        {feedback.title}
                      </h5>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < feedback.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </span>
                        <span>•</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {getCategoryLabel(feedback.category)}
                        </span>
                        <span>•</span>
                        <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(feedback.status)}`}>
                        {feedback.status === 'pending' && <Clock className="h-3 w-3 inline mr-1" />}
                        {feedback.status === 'responded' && <CheckCircle className="h-3 w-3 inline mr-1" />}
                        {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                      </span>
                      {feedback.status === 'pending' && (
                        <button
                          onClick={() => {
                            setFeedbackToDelete(feedback._id);  // Pass just the ID
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete feedback"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3 line-clamp-2">{feedback.content}</p>

                  {feedback.toTrainer && (
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>To:</strong> {feedback.toTrainer.name} ({feedback.toTrainer.subjectDealing})
                    </p>
                  )}

                  {feedback.response && (
                    <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                      <p className="text-sm font-semibold text-green-800 mb-2">Response:</p>
                      <p className="text-sm text-green-700">{feedback.response.content}</p>
                      <p className="text-xs text-green-600 mt-2">
                        Responded on {new Date(feedback.response.respondedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedFeedback(feedback)}
                    className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-bold text-white">Feedback Details</h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{selectedFeedback.title}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {getCategoryLabel(selectedFeedback.category)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${
                      i < selectedFeedback.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {selectedFeedback.rating}/5
                </span>
              </div>

              {selectedFeedback.toTrainer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">Addressed To:</h5>
                  <p className="text-sm text-blue-700">
                    Trainer: {selectedFeedback.toTrainer.name} ({selectedFeedback.toTrainer.subjectDealing})
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-semibold text-gray-900 mb-2">Content:</h5>
                <p className="text-gray-700">{selectedFeedback.content}</p>
              </div>

              {selectedFeedback.suggestions && (
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Suggestions:</h5>
                  <p className="text-gray-700">{selectedFeedback.suggestions}</p>
                </div>
              )}

              {selectedFeedback.response && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <h5 className="font-semibold text-green-800 mb-2">Response:</h5>
                    <p className="text-green-700">{selectedFeedback.response.content}</p>
                    <p className="text-sm text-green-600 mt-2">
                      Responded on {new Date(selectedFeedback.response.respondedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
                Submitted on {new Date(selectedFeedback.createdAt).toLocaleDateString()} at{' '}
                {new Date(selectedFeedback.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && <DeleteConfirmationModal />}
    </div>
  );
};

export default StudentFeedback;