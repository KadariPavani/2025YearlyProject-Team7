import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Calendar, ThumbsUp } from 'lucide-react';
import axios from 'axios';

const TrainerFeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/trainer/received`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          setFeedbacks(response.data.data.feedbacks || []);
          setStats(response.data.data.statistics || null);
        } else {
          setError('Failed to load feedback data');
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setError('Error loading feedback. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
            <div className="text-sm text-gray-500">Total Feedback</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalFeedbacks}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
            <div className="text-sm text-gray-500">Average Rating</div>
            <div className="text-2xl font-bold text-yellow-500 flex items-center gap-1">
              {stats.averageRating} <Star className="h-5 w-5 inline fill-current" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-orange-500">{stats.pendingCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
            <div className="text-sm text-gray-500">Responded</div>
            <div className="text-2xl font-bold text-green-500">{stats.respondedCount}</div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No feedback received yet</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback._id} className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{feedback.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {feedback.isAnonymous ? 'Anonymous Student' : feedback.fromStudent?.name}
                    </span>
                    <Calendar className="h-4 w-4 text-gray-400 ml-2" />
                    <span className="text-sm text-gray-600">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-semibold text-yellow-600">{feedback.rating}/5</span>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{feedback.content}</p>

              {feedback.suggestions && (
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-sm font-medium text-blue-800">Suggestions:</p>
                  <p className="text-blue-600 mt-1">{feedback.suggestions}</p>
                </div>
              )}

              {feedback.response && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Your Response:</span>
                  </div>
                  <p className="text-gray-600">{feedback.response.content}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrainerFeedbackView;