import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, TrendingUp, PieChart, Eye, X, Filter, Users } from 'lucide-react';
import axios from 'axios';

const TPOFeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/tpo/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data.data.feedbacks);
      setStatistics(response.data.data.statistics);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredFeedbacks = () => {
    return feedbacks.filter(feedback => {
      const categoryMatch = filterCategory === 'all' || feedback.category === filterCategory;
      const priorityMatch = filterPriority === 'all' || feedback.priority === filterPriority;
      const statusMatch = filterStatus === 'all' || feedback.status === filterStatus;
      return categoryMatch && priorityMatch && statusMatch;
    });
  };

  const filteredFeedbacks = getFilteredFeedbacks();

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statistics.totalFeedbacks}</p>
              </div>
              <MessageSquare className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">{statistics.averageRating}</p>
              </div>
              <Star className="h-12 w-12 text-yellow-500 fill-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-500 mt-1">{statistics.pendingCount}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Responded</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{statistics.respondedCount}</p>
              </div>
              <Users className="h-12 w-12 text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Category and Priority Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        {statistics?.categoryDistribution && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Feedback by Category
            </h3>
            <div className="space-y-3">
              {Object.entries(statistics.categoryDistribution).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${statistics.totalFeedbacks > 0 
                            ? (count / statistics.totalFeedbacks) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Distribution */}
        {statistics?.priorityDistribution && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Feedback by Priority
            </h3>
            <div className="space-y-3">
              {Object.entries(statistics.priorityDistribution).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <span className={`text-sm font-medium capitalize px-3 py-1 rounded-full ${getPriorityColor(priority)}`}>
                    {priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          priority === 'high' ? 'bg-red-500' :
                          priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${statistics.totalFeedbacks > 0 
                            ? (count / statistics.totalFeedbacks) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="training">Training</option>
              <option value="placement">Placement</option>
              <option value="facilities">Facilities</option>
              <option value="coordinator">Coordinator</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="responded">Responded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          All Feedback ({filteredFeedbacks.length})
        </h3>

        {filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No feedback found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map(feedback => (
              <div
                key={feedback._id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-gray-900 mb-1">
                      {feedback.title}
                    </h5>
                    <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
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
                      {!feedback.isAnonymous && feedback.fromStudent && (
                        <>
                          <span>•</span>
                          <span>{feedback.fromStudent.name} ({feedback.fromStudent.rollNo})</span>
                        </>
                      )}
                      {feedback.toTrainer && (
                        <>
                          <span>•</span>
                          <span>To: {feedback.toTrainer.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      feedback.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      feedback.status === 'reviewed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(feedback.priority)}`}>
                      {feedback.priority.charAt(0).toUpperCase() + feedback.priority.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {getCategoryLabel(feedback.category)}
                  </span>
                </div>

                <p className="text-gray-700 mb-3">{feedback.content}</p>

                {feedback.suggestions && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-3">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Suggestions:</p>
                    <p className="text-sm text-blue-700">{feedback.suggestions}</p>
                  </div>
                )}

                {feedback.response && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                    <p className="text-sm font-semibold text-green-800 mb-1">Response:</p>
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
                  View Full Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedFeedback.title}</h4>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    selectedFeedback.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    selectedFeedback.status === 'reviewed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {selectedFeedback.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedFeedback.priority)}`}>
                    {selectedFeedback.priority}
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

              {!selectedFeedback.isAnonymous && selectedFeedback.fromStudent && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Student Information:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Name:</strong> {selectedFeedback.fromStudent.name}</div>
                    <div><strong>Roll No:</strong> {selectedFeedback.fromStudent.rollNo}</div>
                    <div><strong>College:</strong> {selectedFeedback.fromStudent.college}</div>
                    <div><strong>Branch:</strong> {selectedFeedback.fromStudent.branch}</div>
                  </div>
                </div>
              )}

              {selectedFeedback.toTrainer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">Addressed To:</h5>
                  <p className="text-sm text-blue-700">
                    Trainer: {selectedFeedback.toTrainer.name} ({selectedFeedback.toTrainer.subjectDealing})
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-semibold text-gray-900 mb-2">Feedback Content:</h5>
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
    </div>
  );
};

export default TPOFeedbackView;