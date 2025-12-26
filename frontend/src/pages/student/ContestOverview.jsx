import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const ContestOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userResult, setUserResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    axios.get(`/api/contests/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        const c = res.data.contest;
        setContest(c);

        // If contest ended, fetch user's result and leaderboard availability
        const now = new Date();
        if (new Date(c.endTime) <= now) {
          try {
            const r = await axios.get(`/api/contests/${id}/user-result`, { headers: { Authorization: `Bearer ${token}` } });
            setUserResult(r.data);
          } catch (e) {
            // no personal results or not available
            setUserResult(null);
          }
        }
      })
      .catch(err => setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load contest'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!contest) return <div className="p-6">Contest not found</div>;

  const enterContest = () => {
    const firstQ = contest.questions && contest.questions[0];
    if (!firstQ) return alert('No questions in this contest');
    navigate(`/student/contests/${id}/question/${firstQ._id}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{contest.name}</h2>
          <p className="text-sm text-gray-600">{contest.description}</p>
          <p className="text-xs text-gray-500 mt-2">{new Date(contest.startTime).toLocaleString()} - {new Date(contest.endTime).toLocaleString()}</p>
          {userResult && (
            <div className="mt-3 p-2 bg-green-50 rounded text-sm">
              <strong>Your Score:</strong> {userResult.myScore.totalScore}/{userResult.maxPossibleScore} • <strong>Rank:</strong> {userResult.rank} • <strong>Percentage:</strong> {userResult.myScore.percentage}%
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/student-dashboard')} className="px-3 py-1 border rounded">Back</button>
          {contest?.myFinalized ? (
            <>
              <div className="text-xs text-green-700 rounded bg-green-50 px-3 py-1 mr-2 inline-block">Completed</div>
              <button onClick={() => navigate(`/student/contests/${id}/leaderboard`)} className="px-3 py-1 bg-yellow-600 text-white rounded">View Leaderboard</button>
            </>
          ) : (new Date(contest.endTime) > new Date() ? (
            <button onClick={enterContest} className="px-3 py-1 bg-purple-600 text-white rounded">Enter Contest</button>
          ) : (
            <>
              <button onClick={() => navigate(`/student/contests/${id}/leaderboard`)} className="px-3 py-1 bg-yellow-600 text-white rounded">View Leaderboard</button>
            </>
          ))}
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-4">Questions ({contest.questions?.length || 0})</h3>
        {contest.questions && contest.questions.length > 0 ? (
          <div className="space-y-4">
            {contest.questions.map(q => (
              <div key={q._id} className="p-4 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{q.title}</div>
                  <div className="text-xs text-gray-500">{q.difficulty} • {q.totalMarks && q.totalMarks > 0 ? q.totalMarks : ((q.testCases && q.testCases.length) ? 50 : 0)} Marks</div>
                  <p className="text-sm text-gray-700 mt-2">{q.description}</p>
                  {q.userSubmission ? (
                    <div className="text-xs text-green-600 mt-2">Your best: {q.userSubmission.marksAwarded}/{q.userSubmission.maxMarks} • {q.userSubmission.percentage ?? q.userSubmission.scorePercentage ?? 0}% • {q.userSubmission.status} {q.userSubmission.submittedAt ? `• ${new Date(q.userSubmission.submittedAt).toLocaleString()}` : ''}</div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-2">Not attempted</div>
                  )}
                </div>
                <div>
                  <button onClick={() => navigate(`/student/contests/${id}/question/${q._id}`)} className="px-3 py-1 bg-blue-600 text-white rounded">Solve</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No questions yet.</div>
        )}
      </div>
    </div>
  );
};

export default ContestOverview;
