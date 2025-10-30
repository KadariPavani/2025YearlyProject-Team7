import React, { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FeedbackWidget = () => {
  const [stats, setStats] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchFeedbacks = async () => {
      try {
        const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
        if (!token) return;

        // Use the correct endpoint
        const res = await axios.get('/api/feedback/trainer/received', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!mounted) return;
        
        if (res.status === 200 && res.data?.success) {
          const { statistics, feedbacks } = res.data.data;
          setStats(statistics || null);
          setRecentFeedbacks((feedbacks || []).slice(0, 3));
        }
      } catch (err) {
        console.error('FeedbackWidget fetch error:', err);
      }
    };

    fetchFeedbacks();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Feedback</h3>
        <button onClick={() => navigate('/trainer/feedback')} className="text-blue-600 text-sm">View All →</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-sm text-blue-600">Total</div>
          <div className="text-2xl font-bold text-blue-700">{stats?.totalFeedbacks ?? '—'}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-sm text-yellow-600">Avg</div>
          <div className="text-2xl font-bold text-yellow-700 flex items-center justify-center">
            {stats?.averageRating ?? '—'} <Star className="h-5 w-5 text-yellow-500 ml-2" />
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-sm text-orange-600">Pending</div>
          <div className="text-2xl font-bold text-orange-700">{stats?.pendingCount ?? '—'}</div>
        </div>
      </div>

      {recentFeedbacks.length > 0 ? (
        <div className="space-y-3">
          {recentFeedbacks.map(f => (
            <div key={f._id} className="border rounded-lg p-4">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium text-gray-900">{f.title}</div>
                  <div className="text-sm text-gray-500">{f.isAnonymous ? 'Anonymous' : f.fromStudent?.name}</div>
                </div>
                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="ml-1 text-sm font-medium text-yellow-700">{f.rating}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{f.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No feedback received yet</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackWidget;