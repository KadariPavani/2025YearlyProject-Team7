import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const ContestLeaderboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [maxPossible, setMaxPossible] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    axios.get(`/api/contests/${id}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setLeaderboard(res.data.leaderboard || []);
        setMaxPossible(res.data.maxPossibleScore || 0);
      })
      .catch(err => setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (error) return (
    <div className="p-6">
      <div className="text-red-600 mb-3">{error}</div>
      {error === 'Leaderboard will be available after contest completion' && (
        <div className="text-sm text-gray-700">If the contest is still running, you can view the leaderboard only after you submit (finalize) your contest from the coding page.</div>
      )}
      <div className="mt-3">
        <button onClick={() => navigate(`/student/contests/${id}`)} className="px-3 py-1 border rounded">Back to Contest</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contest Leaderboard</h2>
        <button onClick={() => navigate(`/student/contests/${id}`)} className="px-3 py-1 border rounded">Back</button>
      </div>

      <div className="bg-white rounded shadow p-4">
        <div className="text-sm text-gray-600 mb-4">Max Possible Score: <strong>{maxPossible}</strong></div>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No participants yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th className="py-2">Rank</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Solved</th>
                  <th className="py-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-3">{idx + 1}</td>
                    <td className="py-3">{row.user?.fullName || row.user?.username || 'Student'}</td>
                    <td className="py-3">{row.totalScore}/{maxPossible}</td>
                    <td className="py-3">{row.problemsSolved}</td>
                    <td className="py-3">{row.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestLeaderboard;
