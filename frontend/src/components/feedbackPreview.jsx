// components/FeedbackPreview.jsx
import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import axios from 'axios';

const FeedbackPreview = ({ role = 'tpo', tokenKey = 'userToken' }) => {
  const [stats, setStats] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem(tokenKey);
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const endpoint = role === 'tpo' 
          ? '/api/feedback/tpo/all' 
          : '/api/feedback/trainer/all';

        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true
        });

        if (res.status === 200 && res.data?.success && res.data.data) {
          const data = res.data.data;
          setStats(data.statistics || null);
          const feedbacks = Array.isArray(data.feedbacks) ? data.feedbacks : (data.feedbacks || []);
          setRecentFeedbacks(feedbacks.slice(0, 3));
        } else {
          setError(res.data?.message || 'Failed to load feedback');
        }
      } catch (err) {
        console.error('Feedback fetch error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [role, tokenKey]);

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Feedback Overview
        </h3>
        <span className="text-xs text-gray-500">
          Last updated: {stats?.lastUpdated ? formatDate(stats.lastUpdated) : 'N/A'}
        </span>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Feedback</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600 opacity-70" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Average Rating</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-2xl font-bold ${getRatingColor(stats.averageRating)}`}>
                    {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                  </p>
                  <Star className={`h-5 w-5 ${getRatingColor(stats.averageRating)} fill-current`} />
                </div>
              </div>
              <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i <= Math.round(stats.averageRating || 0)
                        ? getRatingColor(stats.averageRating) + ' fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">This Month</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{stats.thisMonth || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600 opacity-70" />
            </div>
          </div>
        </div>
      )}

      {recentFeedbacks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Feedback</h4>
          <div className="space-y-3">
            {recentFeedbacks.map((fb, idx) => (
              <div
                key={fb._id || idx}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {fb.student?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {fb.student?.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fb.batch?.batchNumber || 'Unknown Batch'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (fb.rating || 0)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {fb.comment && (
                  <p className="text-sm text-gray-700 mt-2 italic">"{fb.comment}"</p>
                )}
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(fb.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentFeedbacks.length === 0 && stats && (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No feedback received yet</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackPreview;