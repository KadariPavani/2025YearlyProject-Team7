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

  // Calculate duration
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);
  const durationMs = endTime - startTime;
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  // Check if contest is active
  const now = new Date();
  const isActive = now >= startTime && now <= endTime;
  const hasEnded = now > endTime;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => navigate('/student-dashboard')} 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Contests
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{contest.name}</h1>
              <p className="text-gray-600">{contest.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {isActive && !contest?.myFinalized && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Active
                </span>
              )}
              {hasEnded && (
                <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  Ended
                </span>
              )}
              {!isActive && !hasEnded && (
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Upcoming
                </span>
              )}
              {contest?.myFinalized && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Completed
                </span>
              )}
              
              {/* View Leaderboard Button */}
              {(contest?.myFinalized || hasEnded) && (
                <button 
                  onClick={() => navigate(`/student/contests/${id}/leaderboard`)} 
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                >
                  View Leaderboard
                </button>
              )}
              
              {/* Enter Contest Button */}
              {isActive && !contest?.myFinalized && (
                <button 
                  onClick={enterContest} 
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Enter Contest
                </button>
              )}
            </div>
          </div>

          {/* Contest Info Cards */}
          <div className="grid grid-cols-4 gap-6 mt-6">
            {/* Start Time */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                <span>📅</span>
                <span className="font-medium">START TIME</span>
              </div>
              <div className="text-gray-900 font-semibold">
                {startTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
              </div>
              <div className="text-gray-500 text-sm">
                {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Duration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                <span>⏱️</span>
                <span className="font-medium">DURATION</span>
              </div>
              <div className="text-gray-900 font-semibold">
                {durationMinutes} minutes
              </div>
              <div className="text-gray-500 text-sm">
                {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
              </div>
            </div>

            {/* Questions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                <span>👥</span>
                <span className="font-medium">QUESTIONS</span>
              </div>
              <div className="text-gray-900 font-semibold">
                {contest.questions?.length || 0}
              </div>
              <div className="text-gray-500 text-sm">
                Problems
              </div>
            </div>

            {/* Languages */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                <span>💻</span>
                <span className="font-medium">LANGUAGES</span>
              </div>
              <div className="text-gray-900 font-semibold">
                {contest.allowedLanguages?.join(', ') || 'python'}
              </div>
            </div>
          </div>

          {/* User Result if available */}
          {userResult && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-gray-900">Your Score:</strong> 
                  <span className="ml-2 text-blue-700 font-semibold">{userResult.myScore.totalScore}/{userResult.maxPossibleScore}</span>
                  <span className="mx-3 text-gray-400">•</span>
                  <strong className="text-gray-900">Rank:</strong> 
                  <span className="ml-2 text-blue-700 font-semibold">{userResult.rank}</span>
                  <span className="mx-3 text-gray-400">•</span>
                  <strong className="text-gray-900">Percentage:</strong> 
                  <span className="ml-2 text-blue-700 font-semibold">{userResult.myScore.percentage}%</span>
                </div>
                <button 
                  onClick={() => navigate(`/student/contests/${id}/leaderboard`)} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Leaderboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Questions Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions</h2>
        
        {contest.questions && contest.questions.length > 0 ? (
          <div className="space-y-4">
            {contest.questions.map((q, index) => (
              <div key={q._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-500 font-medium">Q{index + 1}.</span>
                      <h3 className="text-xl font-semibold text-gray-900">{q.title}</h3>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        q.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{q.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Time Limit: {q.timeLimit || 2000}ms</span>
                      <span>•</span>
                      <span>Memory: {q.memoryLimit || 256}MB</span>
                    </div>

                    {q.userSubmission ? (
                      <div className="mt-3 text-sm">
                        <span className="text-green-600 font-medium">
                          Your best: {q.userSubmission.marksAwarded}/{q.userSubmission.maxMarks} • {q.userSubmission.percentage ?? q.userSubmission.scorePercentage ?? 0}% • {q.userSubmission.status}
                        </span>
                        {q.userSubmission.submittedAt && (
                          <span className="text-gray-400 ml-2">
                            • {new Date(q.userSubmission.submittedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-gray-400">
                        Not attempted
                      </div>
                    )}
                  </div>

                  <div className="ml-6">
                    <div className="text-right mb-3">
                      <div className="text-sm text-gray-500">Marks</div>
                      <div className="text-xl font-bold text-gray-900">
                        {q.totalMarks && q.totalMarks > 0 ? q.totalMarks : ((q.testCases && q.testCases.length) ? 50 : 0)}
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/student/contests/${id}/question/${q._id}`)} 
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                    >
                      Solve <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            No questions available yet.
          </div>
        )}

        {/* Contest Rules */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Contest Rules</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>You can submit up to 9 attempt(s) per question</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Allowed programming languages: {contest.allowedLanguages?.join(', ') || 'python'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Each test case has individual marks that will be awarded upon passing</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContestOverview;