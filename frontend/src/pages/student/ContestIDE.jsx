import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ContestIDE = () => {
  const { contestId, questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('# Your code here\n');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');

    const p1 = axios.get(`/api/contests/${contestId}`, { headers: { Authorization: `Bearer ${token}` } });
    const p2 = axios.get(`/api/contests/${contestId}/questions/${questionId}`, { headers: { Authorization: `Bearer ${token}` } });

    Promise.all([p1, p2])
      .then(([cRes, qRes]) => {
        setContest(cRes.data.contest);
        setQuestion(qRes.data.question);
        // prefer contest allowed languages
        if (Array.isArray(cRes.data.contest?.allowedLanguages) && cRes.data.contest.allowedLanguages.length > 0) {
          setLanguage(cRes.data.contest.allowedLanguages[0]);
        }
      })
      .catch(err => setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load question'))
      .finally(() => setLoading(false));
  }, [contestId, questionId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!question) return <div className="p-6">Question not found</div>;

  const submitCode = async (isFinal = true) => {
    if (contest?.myFinalized) return alert('Contest already submitted; no further submissions allowed.');
    setResult(null);
    setRunning(true);
    const token = localStorage.getItem('userToken');
    try {
      const res = await axios.post(`/api/contests/${contestId}/questions/${questionId}/submit`, { code, language }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data.submission || res.data);
      if (isFinal) alert('Submission recorded');
    } catch (err) {
      console.error('Submission error', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit code');
    } finally {
      setRunning(false);
    }
  };

  const runCode = async () => {
    setResult(null);
    setRunning(true);
    setError('');
    const token = localStorage.getItem('userToken');
    try {
      const shouldSaveRun = !question?.userSubmission; // save the first run for visibility on leaderboard
      const res = await axios.post(`/api/contests/${contestId}/questions/${questionId}/run`, { code, language, saveRun: shouldSaveRun }, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.compilationError) {
        setError(res.data.compilationError);
      } else {
        setResult({ testCaseResults: res.data.testCaseResults, totalTime: res.data.totalTime });
        if (res.data.savedRun) {
          alert('Run saved and visible on leaderboard');
          // refresh contest and question data to reflect saved run
          const p1 = axios.get(`/api/contests/${contestId}`, { headers: { Authorization: `Bearer ${token}` } });
          const p2 = axios.get(`/api/contests/${contestId}/questions/${questionId}`, { headers: { Authorization: `Bearer ${token}` } });
          Promise.all([p1, p2]).then(([cRes, qRes]) => {
            setContest(cRes.data.contest);
            setQuestion(qRes.data.question);
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Run error', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">{question.title}</h3>
              <p className="text-sm text-gray-600">{question.difficulty} • { (question.totalMarks && question.totalMarks > 0) ? question.totalMarks : ((question.sampleInput || question.sampleOutput || (question.testCases && question.testCases.length)) ? 50 : 0) } Marks</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/student/contests/${contestId}`)} className="px-3 py-1 border rounded">Back</button>
              <button onClick={() => navigate(`/student/contests/${contestId}/leaderboard`)} className="px-3 py-1 bg-yellow-500 text-white rounded">View Leaderboard</button>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-700">{question.description}</p>
          <div className="mt-4 text-xs text-gray-500">Time Limit: {question.timeLimit}ms • Memory: {question.memoryLimit}MB</div>

          <div className="mt-6">
            <h4 className="font-semibold mb-2">Sample Input</h4>
            <div className="p-3 bg-gray-50 rounded">{question.sampleInput || '—'}</div>
            <h4 className="font-semibold mt-3 mb-2">Sample Output</h4>
            <div className="p-3 bg-gray-50 rounded">{question.sampleOutput || '—'}</div>
          </div>

          {result && (
            <div className="mt-4 bg-white p-3 border rounded">
              <h5 className="font-semibold mb-2">Result</h5>
              <div className="text-sm">
                <div className="mb-1">Total time: {result.totalTime ?? 'N/A'} ms</div>
                {/* compute marks for run (run endpoint returns testCaseResults) */}
                {Array.isArray(result.testCaseResults) ? (() => {
                  const awarded = result.testCaseResults.reduce((s, t) => s + (t.marksAwarded || 0), 0);
                  const max = result.testCaseResults.reduce((s, t) => s + (t.maxMarks || 0), 0);
                  return (
                    <>
                      <div>Status: completed</div>
                      <div>Marks awarded: {awarded}/{max} {max > 0 ? `• ${Math.round((awarded / max) * 100)}%` : ''}</div>
                      <div className="mt-2">
                        <div className="space-y-2">
                          {result.testCaseResults.map((tc, i) => (
                            <div key={i} className="p-2 border rounded bg-gray-50">
                              <div className="text-xs font-medium">Test #{i+1}: {tc.status} {tc.isHidden ? '(hidden)' : ''}</div>
                              <div className="text-xs text-gray-600">Marks: {tc.marksAwarded}/{tc.maxMarks} {tc.maxMarks ? `• ${Math.round((tc.marksAwarded/ tc.maxMarks)*100)}%` : ''}</div>
                              {tc.output && <div className="mt-1 text-xs">Output: <pre className="whitespace-pre-wrap text-xs">{tc.output}</pre></div>}
                              {tc.error && <div className="mt-1 text-xs text-red-600">Error: <pre className="whitespace-pre-wrap text-xs">{tc.error}</pre></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })() : <div className="text-sm">{JSON.stringify(result)}</div>}
              </div>
            </div>
          )}

        </div>
      </div>

      <div>
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <label className="text-sm">Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="ml-2 border rounded p-1">
                {Array.isArray(contest?.allowedLanguages) && contest.allowedLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={runCode} className="px-3 py-1 bg-gray-100 rounded" disabled={running}>{running ? 'Running...' : 'Run'}</button>
              <button onClick={() => submitCode(true)} className="px-3 py-1 bg-green-600 text-white rounded" disabled={running}>{running ? 'Submitting...' : 'Submit'}</button>
              <button onClick={async () => {
                if (contest?.myFinalized) return alert('You have already submitted the contest.');
                if (!window.confirm('Submit contest and view leaderboard? You will not be able to change answers after submission.')) return;
                setRunning(true);
                setError('');
                const token = localStorage.getItem('userToken');
                try {
                  // submit current question first (best-effort)
                  await submitCode(true).catch(() => {});

                  // finalize contest on server (creates final submissions for unanswered questions)
                  await axios.post(`/api/contests/${contestId}/finalize`, {}, { headers: { Authorization: `Bearer ${token}` } });

                  // refresh student activity and results
                  await axios.get('/api/student-activity/student', { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
                } catch (e) {
                  setError(e.response?.data?.error || e.response?.data?.message || 'Failed to submit contest');
                } finally {
                  setRunning(false);
                  navigate(`/student/contests/${contestId}/leaderboard`);
                }
              }} className="px-3 py-1 bg-blue-600 text-white rounded" disabled={running || contest?.myFinalized}>{running ? 'Submitting...' : (contest?.myFinalized ? 'Submitted' : 'Submit Contest')}</button>
            </div>
          </div>

          <textarea value={code} onChange={e => setCode(e.target.value)} className="w-full h-[480px] border rounded p-3 font-mono text-sm bg-black text-green-200" />

          {error && <div className="mt-3 text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ContestIDE;
