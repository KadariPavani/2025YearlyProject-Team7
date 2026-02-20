import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ToastNotification from '../../components/ui/ToastNotification';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';


const ContestIDE = () => {
  const { contestId, questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const [contestTimedOut, setContestTimedOut] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const finalizingRef = useRef(false);
  const fsExitCountRef = useRef(0);

  const templates = {
    python: '# Your code here\n',
    javascript: '// Your code here\nconsole.log("Hello");\n',
    js: '// Your code here\nconsole.log("Hello");\n',
    java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello");\n  }\n}\n',
    c: '#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  return 0;\n}\n',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  return 0;\n}\n'
  };

  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(templates.python);
  const [running, setRunning] = useState(false);    // true when Run is in progress
  const [submitting, setSubmitting] = useState(false); // true when Submit is in progress
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Compute locked state
  const isLocked = contestTimedOut || !!contest?.myFinalized;

  // --- Feature 6: Finalize contest (does NOT manage fullscreen - callers handle that) ---
  const finalizeContest = useCallback(async () => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    const token = localStorage.getItem('userToken');
    try {
      await axios.post(`/api/contests/${contestId}/finalize`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Finalize error', err);
    }
    // Always navigate away — finalizingRef stays true to prevent re-entry
    navigate(`/student/contests/${contestId}`);
  }, [contestId, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('userToken');

    const p1 = axios.get(`/api/contests/${contestId}`, { headers: { Authorization: `Bearer ${token}` } });
    const p2 = axios.get(`/api/contests/${contestId}/questions/${questionId}`, { headers: { Authorization: `Bearer ${token}` } });

    Promise.all([p1, p2])
      .then(([cRes, qRes]) => {
        const c = cRes.data.contest;
        setContest(c);
        setQuestion(qRes.data.question);

        // Feature 6: If already finalized, redirect away
        if (c?.myFinalized) {
          navigate(`/student/contests/${contestId}`);
          return;
        }

        if (Array.isArray(c?.allowedLanguages) && c.allowedLanguages.length > 0) {
          const pref = c.allowedLanguages[0];
          setLanguage(pref);
          if (code.trim() === '' || code.includes('Your code here')) {
            const tpl = templates[(pref || '').toLowerCase()] || '';
            setCode(tpl);
          }
        }
      })
      .catch(err => showToast('error', err.response?.data?.error || err.response?.data?.message || 'Failed to load question'))
      .finally(() => setLoading(false));
  }, [contestId, questionId]);

  // --- Feature 5: Check every second if contest endTime has passed ---
  useEffect(() => {
    if (!contest?.endTime) return;
    const interval = setInterval(() => {
      if (new Date() >= new Date(contest.endTime)) {
        setContestTimedOut(true);
        clearInterval(interval);
      }
    }, 1000);
    // Check immediately
    if (new Date() >= new Date(contest.endTime)) {
      setContestTimedOut(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [contest?.endTime]);

  // --- Feature 4: Show fullscreen modal on mount (warning count is preserved from session) ---
  useEffect(() => {
    if (loading || !contest || contest.myFinalized) return;
    setShowFullscreenModal(true);
  }, [loading, contest?.myFinalized]);

  // --- Feature 4: Fullscreen change listener (3 strikes then auto-finalize) ---
  useEffect(() => {
    const handleFsChange = async () => {
      if (!document.fullscreenElement && contest && !contest.myFinalized && !finalizingRef.current) {
        fsExitCountRef.current += 1;
        if (fsExitCountRef.current >= 3) {
          await finalizeContest();
        } else {
          setShowFullscreenModal(true);
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [contest, finalizeContest, contestId, questionId]);

  // --- Feature 7: Auto-finalize contest on page refresh/close ---
  useEffect(() => {
    if (!contest || contest.myFinalized) return;
    const handler = () => {
      if (finalizingRef.current) return;
      const token = localStorage.getItem('userToken');
      if (!token) return;
      try {
        fetch(`/api/contests/${contestId}/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: '{}',
          keepalive: true
        });
      } catch {}
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [contest, contestId]);

  // --- Feature 7: Catch browser back button via popstate ---
  useEffect(() => {
    if (!contest || contest.myFinalized) return;
    // Push dummy state so back triggers popstate instead of leaving
    window.history.pushState({ contestIDE: true }, '');
    const handlePopState = async () => {
      if (contest?.myFinalized || finalizingRef.current) return;
      // Set ref BEFORE confirm so fullscreen exit from confirm dialog doesn't count as a strike
      finalizingRef.current = true;
      const confirmed = window.confirm('Leaving will finalize your contest. Are you sure?');
      if (confirmed) {
        if (document.fullscreenElement) {
          try { await document.exitFullscreen(); } catch {}
        }
        await finalizeContest();
      } else {
        finalizingRef.current = false;
        // Re-push dummy state so next back press is also caught
        window.history.pushState({ contestIDE: true }, '');
        // Re-request fullscreen since confirm dialog exited it
        if (!document.fullscreenElement) setShowFullscreenModal(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [contest, finalizeContest]);

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limit between 20% and 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    const key = (newLang || '').toLowerCase();
    const tpl = templates[key] || '';
    if (code.trim() === '' || code.includes('Your code here')) {
      setCode(tpl);
    }
    setLanguage(newLang);
  };

  const textareaRef = useRef(null);

  // Editor keyboard helpers: auto-pair opening chars and smart backspace when deleting pairs
  const handleEditorKeyDown = (e) => {
    const pairs = {'(':')','[':']','{':'}','"':'"',"'":"'", '`':'`'};
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;

    // Auto-pair opening characters
    if (Object.prototype.hasOwnProperty.call(pairs, e.key)) {
      e.preventDefault();
      const openChar = e.key;
      const closeChar = pairs[openChar];
      const before = value.slice(0, selectionStart);
      const selected = value.slice(selectionStart, selectionEnd);
      const after = value.slice(selectionEnd);
      const newValue = before + openChar + selected + closeChar + after;
      setCode(newValue);
      const cursorPos = selectionStart + 1 + selected.length;
      setTimeout(() => el.setSelectionRange(cursorPos, cursorPos), 0);
      return;
    }

    // Smart Backspace: if cursor is between a matching pair, delete both
    if (e.key === 'Backspace' && selectionStart === selectionEnd && selectionStart > 0) {
      const prev = value[selectionStart - 1];
      const next = value[selectionStart];
      if (pairs[prev] === next) {
        e.preventDefault();
        const newValue = value.slice(0, selectionStart - 1) + value.slice(selectionStart + 1);
        setCode(newValue);
        setTimeout(() => el.setSelectionRange(selectionStart - 1, selectionStart - 1), 0);
        return;
      }
    }
  };

  // Basic balance validator for brackets/braces/quotes (ignores escaped quotes and content inside quotes)
  const isBalanced = (s) => {
    const pairsMap = { ')':'(', ']':'[', '}':'{' };
    let stack = [];
    let inQuote = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      // Handle quote toggling (ignore escaped quotes)
      if (ch === '"' || ch === "'" || ch === '`') {
        let bs = 0, j = i - 1;
        while (j >= 0 && s[j] === '\\') { bs++; j--; }
        if (bs % 2 === 0) {
          if (inQuote === ch) inQuote = null;
          else if (!inQuote) inQuote = ch;
        }
        continue;
      }
      if (inQuote) continue;
      if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
      if (ch === ')' || ch === ']' || ch === '}') {
        if (stack.length === 0) return false;
        const last = stack.pop();
        if (last !== pairsMap[ch]) return false;
      }
    }
    return stack.length === 0 && inQuote === null;
  };

  const validateBeforeSubmit = (currentCode) => {
    if (!isBalanced(currentCode)) {
      showToast('error','Unbalanced brackets or quotes detected. Please check matching pairs.');
      return false;
    }
    setError('');
    return true;
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!question) return <div className="p-6">Question not found</div>;

  const submitCode = async (isFinal = true) => {
    if (contest?.myFinalized) return showToast('error','Contest already submitted; no further submissions allowed.');
    if (!validateBeforeSubmit(code)) return;
    setResult(null);
    setSubmitting(true);
    const token = localStorage.getItem('userToken');
    try {
      const res = await axios.post(`/api/contests/${contestId}/questions/${questionId}/submit`, { code, language }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(res.data.submission || res.data);
      if (isFinal) showToast('success','Submission recorded');
    } catch (err) {
      console.error('Submission error', err);
      showToast('error', err.response?.data?.error || err.response?.data?.message || 'Failed to submit code');
    } finally {
      setSubmitting(false);
    }
  };

  const runCode = async () => {
    if (contest?.myFinalized) return showToast('error','Contest already submitted; no further runs allowed.');
    if (!validateBeforeSubmit(code)) return;
    setResult(null);
    setRunning(true);
    setError('');
    const token = localStorage.getItem('userToken');
    try {
      const shouldSaveRun = !question?.userSubmission;
      const res = await axios.post(`/api/contests/${contestId}/questions/${questionId}/run`, { code, language, saveRun: shouldSaveRun }, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.compilationError) {
        showToast('error', res.data.compilationError);
      } else {
        setResult({ testCaseResults: res.data.testCaseResults, totalTime: res.data.totalTime });
        if (res.data.savedRun) {
          showToast('success','Run saved and visible on leaderboard');
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
      showToast('error', err.response?.data?.error || err.response?.data?.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  // --- Feature 7: Back button handler with confirm + finalize ---
  const handleBackClick = async () => {
    if (contest?.myFinalized) {
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch {}
      }
      navigate(`/student/contests/${contestId}`);
      return;
    }
    // Set ref BEFORE confirm so the fullscreen exit from confirm dialog doesn't count as a strike
    finalizingRef.current = true;
    const confirmed = window.confirm('Leaving will finalize your contest. Are you sure?');
    if (confirmed) {
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch {}
      }
      await finalizeContest();
    } else {
      finalizingRef.current = false;
      // Re-request fullscreen since confirm dialog exited it
      if (!document.fullscreenElement) setShowFullscreenModal(true);
    }
  };

  // --- Feature 6: Submit button handler with confirm + submit + finalize ---
  const handleFinalSubmit = async () => {
    if (contest?.myFinalized) return showToast('error','Contest already submitted.');
    // Set ref BEFORE confirm so the fullscreen exit from confirm dialog doesn't count as a strike
    finalizingRef.current = true;
    const confirmed = window.confirm('Submit and finalize your contest? You will not be able to make further changes.');
    if (!confirmed) {
      finalizingRef.current = false;
      // Re-request fullscreen since confirm dialog exited it
      if (!document.fullscreenElement) setShowFullscreenModal(true);
      return;
    }
    await submitCode(true);
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {}
    }
    await finalizeContest();
  };

  // --- Feature 4: Fullscreen modal enter handler ---
  const handleEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setShowFullscreenModal(false);
    } catch {
      showToast('error', 'Could not enter fullscreen. Please allow fullscreen access.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Feature 4: Fullscreen modal overlay */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
            <h2 className="text-xl font-bold mb-3">Fullscreen Required</h2>
            <p className="text-gray-600 mb-2">This contest must be taken in fullscreen mode.</p>
            {fsExitCountRef.current > 0 && (
              <p className="text-red-600 text-sm mb-4 font-medium">
                Warning {fsExitCountRef.current}/3 — After 3 exits the contest will be auto-finalized.
              </p>
            )}
            {fsExitCountRef.current === 0 && <p className="text-gray-500 text-sm mb-4">Exiting fullscreen 3 times will auto-finalize your contest.</p>}
            <button
              onClick={handleEnterFullscreen}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Top Section - Back Button */}
      <div className="bg-white border-b px-6 py-3">
        <button
          onClick={handleBackClick}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <span>&larr;</span> Back to Contest
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Left Panel - Problem Description */}
        <div
          className="overflow-y-auto border-r bg-white"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="p-6">
            {/* Problem Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">&#128187;</span>
              <h2 className="text-2xl font-bold">{question.title}</h2>
            </div>

            {/* Difficulty Badge */}
            <div className="inline-block mb-6">
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {question.difficulty}
              </span>
            </div>

            {/* Marks, Time, Memory */}
            <div className="flex items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">&#127919;</span>
                <span className="font-medium">MARKS</span>
                <span className="text-gray-600">
                  {(question.totalMarks && question.totalMarks > 0) ? question.totalMarks : ((question.sampleInput || question.sampleOutput || (question.testCases && question.testCases.length)) ? 50 : 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">&#9201;&#65039;</span>
                <span className="font-medium">TIME</span>
                <span className="text-gray-600">{question.timeLimit}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">&#128190;</span>
                <span className="font-medium">MEMORY</span>
                <span className="text-gray-600">{question.memoryLimit}MB</span>
              </div>
            </div>

            {/* Problem Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Problem Description</h3>
              <p className="text-gray-700 leading-relaxed">{question.description}</p>
            </div>

            {/* Constraints */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Constraints</h3>
              <p className="text-gray-700">no constraints</p>
            </div>

            {/* Input Format */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Input Format</h3>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-gray-700 font-mono text-sm">{question.sampleInput || '\u2014'}</p>
              </div>
            </div>

            {/* Output Format */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Output Format</h3>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-gray-700 font-mono text-sm">{question.sampleOutput || '\u2014'}</p>
              </div>
            </div>

            {/* Sample Input/Output */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sample Input</h3>
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-gray-700 font-mono text-sm whitespace-pre-wrap">{question.sampleInput || '\u2014'}</pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sample Output</h3>
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-gray-700 font-mono text-sm whitespace-pre-wrap">{question.sampleOutput || '\u2014'}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Submissions Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-500">&#128260;</span>
                <h3 className="text-lg font-semibold">Your Recent Submissions</h3>
              </div>
              {result && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <div className="text-sm">
                    <div className="mb-2 font-medium">Total time: {result.totalTime ?? 'N/A'} ms</div>
                    {Array.isArray(result.testCaseResults) ? (() => {
                      const awarded = result.testCaseResults.reduce((s, t) => s + (t.marksAwarded || 0), 0);
                      const max = result.testCaseResults.reduce((s, t) => s + (t.maxMarks || 0), 0);
                      return (
                        <>
                          <div className="mb-1">Status: completed</div>
                          <div className="mb-3">Marks awarded: {awarded}/{max} {max > 0 ? `\u2022 ${Math.round((awarded / max) * 100)}%` : ''}</div>
                          <div className="space-y-2">
                            {result.testCaseResults.map((tc, i) => (
                              <div key={i} className="p-2 bg-white rounded border">
                                <div className="text-xs font-medium">Test #{i+1}: {tc.status} {tc.isHidden ? '(hidden)' : ''}</div>
                                <div className="text-xs text-gray-600">Marks: {tc.marksAwarded}/{tc.maxMarks} {tc.maxMarks ? `\u2022 ${Math.round((tc.marksAwarded/ tc.maxMarks)*100)}%` : ''}</div>
                                {tc.output && <div className="mt-1 text-xs">Output: <pre className="whitespace-pre-wrap text-xs">{tc.output}</pre></div>}
                                {tc.error && <div className="mt-1 text-xs text-red-600">Error: <pre className="whitespace-pre-wrap text-xs">{tc.error}</pre></div>}
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })() : <div className="text-sm">{JSON.stringify(result)}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex-shrink-0 relative group"
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500 group-hover:opacity-20" />
        </div>

        {/* Right Panel - Code Editor */}
        <div
          className="flex flex-col bg-white"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {/* Editor Header */}
          <div className="border-b px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">&#9881;&#65039;</span>
                <label className="text-sm font-medium text-gray-700">Language:</label>
                <select
                  value={language}
                  onChange={e => handleLanguageChange(e)}
                  className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.isArray(contest?.allowedLanguages) && contest.allowedLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <button className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
                <span>&#9654;&#65039;</span> Console
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={runCode}
                className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                disabled={running || submitting || isLocked}
              >
                {running ? 'Running...' : isLocked ? 'Locked' : '\u25b6\ufe0f Run'}
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                disabled={running || submitting || isLocked}
              >
                {submitting ? 'Submitting...' : isLocked ? 'Finalized' : '\u2713 Submit'}
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full relative">
              {/* Line Numbers */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-800 text-gray-400 text-right pr-2 pt-3 text-sm font-mono select-none overflow-hidden">
                {code.split('\n').map((_, i) => (
                  <div key={i} className="leading-6">{i + 1}</div>
                ))}
              </div>
              {/* Code Textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                className="w-full h-full pl-14 pr-4 py-3 font-mono text-sm bg-gray-900 text-green-300 focus:outline-none resize-none"
                spellCheck="false"
                style={{ lineHeight: '1.5rem' }}
              />
            </div>
          </div>

          {/* Toast for errors */}
          {toast && (
            <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestIDE;
