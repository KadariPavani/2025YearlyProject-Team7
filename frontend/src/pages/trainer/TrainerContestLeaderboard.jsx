import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';
import { BarChart, ChevronLeft, Trophy, Users } from 'lucide-react';

const TrainerContestLeaderboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [maxPossible, setMaxPossible] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    axios.get(`/api/contests/admin/${id}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setLeaderboard(res.data.leaderboard || []);
        setMaxPossible(res.data.maxPossibleScore || 0);
      })
      .catch(err => setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {error && (
          <ToastNotification type="error" message={error} onClose={() => setError('')} />
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Contest Leaderboard</h2>
                <p className="text-xs text-gray-500">{leaderboard.length} participants</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-700 font-medium">Max Score: {maxPossible}</span>
              </div>
              <button
                onClick={() => navigate('/trainer-dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
          {/* Mobile max score */}
          <div className="sm:hidden mt-2 flex items-center gap-1.5 text-xs text-amber-700">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">Max Score: {maxPossible}</span>
          </div>
        </div>

        {/* Leaderboard Table */}
        {leaderboard.length > 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-16">Rank</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name / Username</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Score</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Solved</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaderboard.map((row, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-gray-200 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'text-gray-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{row.user?.fullName || row.user?.username || 'Student'}</div>
                        {row.user?.email && <div className="text-[10px] sm:text-xs text-gray-500">{row.user.email}</div>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">{row.totalScore}</span>
                        <span className="text-xs text-gray-400">/{maxPossible}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{row.problemsSolved}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="hidden sm:block w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(row.percentage, 100)}%` }} />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">{row.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">No participants yet</p>
            <p className="text-xs text-gray-400 mt-1">Students will appear here once they participate</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerContestLeaderboard;
