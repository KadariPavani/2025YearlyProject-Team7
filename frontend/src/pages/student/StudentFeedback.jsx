import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, RefreshCw, Trash2, User, Calendar } from 'lucide-react';
import axios from 'axios';
import ToastNotification from '../../components/ui/ToastNotification';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const StudentFeedback = () => {
  const [activeView, setActiveView] = useState('submit');
  const [trainers, setTrainers] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const [formData, setFormData] = useState({
    title: '', content: '', rating: 5, category: 'training',
    toTrainer: '', otherTrainerName: '', isAnonymous: false, suggestions: ''
  });

  useEffect(() => { fetchTrainers(); fetchMyFeedbacks(); }, []);

  const fetchTrainers = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/student/trainers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) setTrainers(res.data.data || []);
      else showToast('error', 'Failed to fetch trainers');
    } catch (err) {
      showToast('error', 'Could not load trainers');
      setTrainers([]);
    }
  };

  const fetchMyFeedbacks = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('userToken');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/student/my-feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyFeedbacks(res.data.data || []);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      if (formData.category === 'training') {
        if (!formData.toTrainer) { showToast('error', 'Please select a trainer'); setLoading(false); return; }
        if (formData.toTrainer === 'other' && !formData.otherTrainerName?.trim()) { showToast('error', 'Please enter the trainer name'); setLoading(false); return; }
      }
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/submit`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('success', 'Feedback submitted successfully!');
      setFormData({ title: '', content: '', rating: 5, category: 'training', toTrainer: '', otherTrainerName: '', isAnonymous: false, suggestions: '' });
      fetchMyFeedbacks();
      setTimeout(() => setActiveView('history'), 1500);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDelete = async (feedbackId) => {
    try {
      if (!feedbackId) return;
      const token = localStorage.getItem('userToken');
      const res = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/${feedbackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast('success', 'Feedback deleted');
        setMyFeedbacks(prev => prev.filter(f => f._id !== feedbackId));
      } else {
        showToast('error', res.data.message || 'Failed to delete');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete');
    } finally {
      setShowDeleteConfirm(false);
      setFeedbackToDelete(null);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = { training: 'Training', placement: 'Placement', facilities: 'Facilities', coordinator: 'Coordinator', general: 'General' };
    return labels[category] || category;
  };

  return (
    <div className="space-y-4">
      {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Feedback</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{myFeedbacks.length} feedback submitted</p>
        </div>
        <button onClick={() => { fetchMyFeedbacks(); fetchTrainers(); }} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'submit', label: 'Submit Feedback' },
            { key: 'history', label: `History (${myFeedbacks.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeView === tab.key
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Submit Form */}
        {activeView === 'submit' && (
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief title for your feedback" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="training">Training</option>
                    <option value="placement">Placement</option>
                    <option value="facilities">Facilities</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  {formData.category === 'training' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Trainer *</label>
                      <select name="toTrainer" value={formData.toTrainer} onChange={handleInputChange} required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select a trainer</option>
                        {trainers.map(t => <option key={t._id} value={t._id}>{t.name} - {t.subjectDealing}</option>)}
                        <option value="other">Other (specify)</option>
                      </select>
                      {formData.toTrainer === 'other' && (
                        <input type="text" name="otherTrainerName" value={formData.otherTrainerName} onChange={handleInputChange} required
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter trainer name" />
                      )}
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Addressed To (Optional)</label>
                      <input type="text" name="otherTrainerName" value={formData.otherTrainerName} onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Facilities, Placement Team" />
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating *</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setFormData(prev => ({ ...prev, rating: star }))} className="focus:outline-none">
                        <Star className={`h-6 w-6 sm:h-7 sm:w-7 ${star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium text-gray-600">{formData.rating}/5</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
                <textarea name="content" value={formData.content} onChange={handleInputChange} required rows={4} maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Share your detailed feedback..." />
                <p className="text-xs text-gray-400 mt-1">{formData.content.length}/2000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Suggestions (Optional)</label>
                <textarea name="suggestions" value={formData.suggestions} onChange={handleInputChange} rows={2} maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any suggestions for improvement..." />
                <p className="text-xs text-gray-400 mt-1">{formData.suggestions.length}/1000</p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" name="isAnonymous" id="isAnonymous" checked={formData.isAnonymous} onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="isAnonymous" className="text-sm text-gray-600">Submit as anonymous</label>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50">
                <Send className="h-4 w-4" />
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        )}

        {/* Feedback History */}
        {activeView === 'history' && (
          <>
            {historyLoading ? (
              <div className="p-4"><LoadingSkeleton /></div>
            ) : myFeedbacks.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-sm sm:text-base text-gray-500 font-medium">No feedback submitted yet</p>
                <button onClick={() => setActiveView('submit')} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Submit your first feedback
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {myFeedbacks.map(fb => (
                  <div key={fb._id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                    <div className="space-y-3">
                      {/* Title + Rating + Category */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 break-words">{fb.title}</h4>
                            <span className="shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getCategoryLabel(fb.category)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                            <span className="text-xs sm:text-sm text-gray-600 ml-1">({fb.rating}/5)</span>
                          </div>
                        </div>
                        <button onClick={() => { setFeedbackToDelete(fb._id); setShowDeleteConfirm(true); }}
                          className="shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-gray-700 break-words leading-relaxed">{fb.content}</p>

                      {/* Suggestions */}
                      {fb.suggestions && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Suggestions:</p>
                          <p className="text-xs sm:text-sm text-blue-800 break-words">{fb.suggestions}</p>
                        </div>
                      )}

                      {/* Footer — Trainer + Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 pt-2 border-t border-gray-100">
                        {(fb.toTrainer || fb.otherTrainerName) && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span><strong>To:</strong> {fb.toTrainer ? fb.toTrainer.name : fb.otherTrainerName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 sm:ml-auto">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                          {fb.isAnonymous && <span className="italic text-gray-400 ml-2">(Anonymous)</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => { setShowDeleteConfirm(false); setFeedbackToDelete(null); }}>
          {/* Desktop: centered modal */}
          <div className="hidden sm:flex items-center justify-center min-h-full p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h4 className="text-base font-semibold text-gray-900 mb-2">Delete Feedback?</h4>
              <p className="text-sm text-gray-600 mb-5">This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowDeleteConfirm(false); setFeedbackToDelete(null); }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button onClick={() => handleDelete(feedbackToDelete)}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Delete</button>
              </div>
            </div>
          </div>
          {/* Mobile: bottom sheet */}
          <div className="sm:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-base font-semibold text-gray-900 mb-2">Delete Feedback?</h4>
            <p className="text-sm text-gray-600 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setFeedbackToDelete(null); }}
                className="flex-1 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-lg font-medium">Cancel</button>
              <button onClick={() => handleDelete(feedbackToDelete)}
                className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeedback;
