import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';


const ContestIDE = () => {
  const { contestId, questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

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
        if (Array.isArray(cRes.data.contest?.allowedLanguages) && cRes.data.contest.allowedLanguages.length > 0) {
          const pref = cRes.data.contest.allowedLanguages[0];
          setLanguage(pref);
          if (code.trim() === '' || code.includes('Your code here')) {
            const tpl = templates[(pref || '').toLowerCase()] || '';
            setCode(tpl);
          }
        }
      })
      .catch(err => setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load question'))
      .finally(() => setLoading(false));
  }, [contestId, questionId]);

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
      setError('Unbalanced brackets or quotes detected. Please check matching pairs.');
      return false;
    }
    setError('');
    return true;
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!question) return <div className="p-6">Question not found</div>;

  const submitCode = async (isFinal = true) => {
    if (contest?.myFinalized) return alert('Contest already submitted; no further submissions allowed.');
    if (!validateBeforeSubmit(code)) return;
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
    if (!validateBeforeSubmit(code)) return;
    setResult(null);
    setRunning(true);
    setError('');
    const token = localStorage.getItem('userToken');
    try {
      const shouldSaveRun = !question?.userSubmission;
      const res = await axios.post(`/api/contests/${contestId}/questions/${questionId}/run`, { code, language, saveRun: shouldSaveRun }, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.compilationError) {
        setError(res.data.compilationError);
      } else {
        setResult({ testCaseResults: res.data.testCaseResults, totalTime: res.data.totalTime });
        if (res.data.savedRun) {
          alert('Run saved and visible on leaderboard');
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Section - Back Button */}
      <div className="bg-white border-b px-6 py-3">
        <button 
          onClick={() => navigate(`/student/contests/${contestId}`)} 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <span>←</span> Back to Contest
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
              <span className="text-2xl">💻</span>
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
                <span className="text-orange-500">🎯</span>
                <span className="font-medium">MARKS</span>
                <span className="text-gray-600">
                  {(question.totalMarks && question.totalMarks > 0) ? question.totalMarks : ((question.sampleInput || question.sampleOutput || (question.testCases && question.testCases.length)) ? 50 : 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">⏱️</span>
                <span className="font-medium">TIME</span>
                <span className="text-gray-600">{question.timeLimit}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">💾</span>
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
                <p className="text-gray-700 font-mono text-sm">{question.sampleInput || '—'}</p>
              </div>
            </div>

            {/* Output Format */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Output Format</h3>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-gray-700 font-mono text-sm">{question.sampleOutput || '—'}</p>
              </div>
            </div>

            {/* Sample Input/Output */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sample Input</h3>
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-gray-700 font-mono text-sm whitespace-pre-wrap">{question.sampleInput || '—'}</pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sample Output</h3>
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-gray-700 font-mono text-sm whitespace-pre-wrap">{question.sampleOutput || '—'}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Submissions Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-500">🔄</span>
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
                          <div className="mb-3">Marks awarded: {awarded}/{max} {max > 0 ? `• ${Math.round((awarded / max) * 100)}%` : ''}</div>
                          <div className="space-y-2">
                            {result.testCaseResults.map((tc, i) => (
                              <div key={i} className="p-2 bg-white rounded border">
                                <div className="text-xs font-medium">Test #{i+1}: {tc.status} {tc.isHidden ? '(hidden)' : ''}</div>
                                <div className="text-xs text-gray-600">Marks: {tc.marksAwarded}/{tc.maxMarks} {tc.maxMarks ? `• ${Math.round((tc.marksAwarded/ tc.maxMarks)*100)}%` : ''}</div>
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
                <span className="text-gray-600">⚙️</span>
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
                <span>▶️</span> Console
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={runCode} 
                className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50" 
                disabled={running}
              >
                {running ? 'Running...' : '▶️ Run'}
              </button>
              <button 
                onClick={() => submitCode(true)} 
                className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium disabled:opacity-50" 
                disabled={running}
              >
                {running ? 'Submitting...' : '✓ Submit'}
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

          {/* Error Display */}
          {error && (
            <div className="border-t px-6 py-3 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestIDE;