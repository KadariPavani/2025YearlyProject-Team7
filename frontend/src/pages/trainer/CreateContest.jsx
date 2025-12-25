import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateContest = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [allowedLanguages, setAllowedLanguages] = useState(['python','javascript']);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [accessLevel, setAccessLevel] = useState('public');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [targetBatchIds, setTargetBatchIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Questions and testcases (allow adding during creation)
  const [questions, setQuestions] = useState([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [qTitle, setQTitle] = useState('');
  const [qDescription, setQDescription] = useState('');
  const [qDifficulty, setQDifficulty] = useState('Easy');
  const [qConstraints, setQConstraints] = useState('');
  const [qInputFormat, setQInputFormat] = useState('');
  const [qOutputFormat, setQOutputFormat] = useState('');
  const [qSampleInput, setQSampleInput] = useState('');
  const [qSampleOutput, setQSampleOutput] = useState('');
  const [qTimeLimit, setQTimeLimit] = useState(2000);
  const [qMemoryLimit, setQMemoryLimit] = useState(256);
  const [qTestCases, setQTestCases] = useState([]);

  useEffect(() => {
    // fetch batches for batch-specific access
    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    if (!token) return;
    axios.get('/api/quizzes/batches', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        // try to merge into one list
        const data = res.data || {};
        const all = [];
        if (Array.isArray(data.regular)) all.push(...data.regular);
        if (Array.isArray(data.placement)) all.push(...data.placement);
        if (all.length === 0 && Array.isArray(res.data)) all.push(...res.data);
        setAvailableBatches(all);
      })
      .catch(() => setAvailableBatches([]));
  }, []);

  const toggleLanguage = (lang) => {
    setAllowedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const toggleBatch = (id) => {
    setTargetBatchIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Question helpers for create flow
  const addQTestCase = () => {
    setQTestCases(prev => [...prev, { input: '', expectedOutput: '', marks: 0, isHidden: false }]);
  };
  const removeQTestCase = (idx) => {
    setQTestCases(prev => prev.filter((_, i) => i !== idx));
  };
  const updateQTestCase = (idx, key, value) => {
    setQTestCases(prev => prev.map((t, i) => i === idx ? { ...t, [key]: value } : t));
  };

  const addQuestionDraft = () => {
    // basic validation
    if (!qTitle || !qDescription) return setError('Question title and description are required');
    if (qTestCases.length === 0) return setError('Add at least one test case for the question');

    const questionObj = {
      title: qTitle,
      description: qDescription,
      difficulty: qDifficulty,
      constraints: qConstraints,
      inputFormat: qInputFormat,
      outputFormat: qOutputFormat,
      sampleInput: qSampleInput,
      sampleOutput: qSampleOutput,
      timeLimit: qTimeLimit,
      memoryLimit: qMemoryLimit,
      testCases: qTestCases.map(tc => ({ ...tc }))
    };

    setQuestions(prev => [...prev, questionObj]);
    // reset question form
    setQTitle(''); setQDescription(''); setQDifficulty('Easy'); setQConstraints(''); setQInputFormat(''); setQOutputFormat(''); setQSampleInput(''); setQSampleOutput(''); setQTimeLimit(2000); setQMemoryLimit(256); setQTestCases([]); setShowQuestionForm(false); setError('');
  };

  const removeQuestionDraft = (idx) => setQuestions(prev => prev.filter((_, i) => i !== idx));
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !startTime || !endTime) {
      setError('Please fill required fields (name, start and end time)');
      return;
    }

    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        name,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration,
        questions, // include drafted questions (with testcases including hidden flag)
        allowedLanguages,
        maxAttempts,
        accessLevel,
        targetBatchIds: accessLevel === 'batch' ? targetBatchIds : []
      };

      const res = await axios.post('/api/contests/admin', body, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.contest) {
        // navigate back and request trainer dashboard to refresh contests
        navigate('/trainer-dashboard', { state: { refreshContests: true } });
      } else {
        setError('Failed to create contest');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create contest');
      console.error('Create contest error', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create Contest</h2>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border rounded p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full border rounded p-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time *</label>
            <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time *</label>
            <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1 block w-full border rounded p-2" />
          </div>
        </div>

        {/* Questions section to allow adding questions & hidden testcases during contest creation */}
        <div className="mt-6 bg-gray-50 border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Questions ({questions.length})</h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowQuestionForm(prev => !prev)} className="px-3 py-1 bg-purple-600 text-white rounded">{showQuestionForm ? 'Close' : 'Add Question'}</button>
            </div>
          </div>

          {showQuestionForm && (
            <div className="border rounded p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600">Title *</label>
                  <input value={qTitle} onChange={e => setQTitle(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Difficulty</label>
                  <select value={qDifficulty} onChange={e => setQDifficulty(e.target.value)} className="mt-1 block w-full border rounded p-2">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600">Description *</label>
                  <textarea value={qDescription} onChange={e => setQDescription(e.target.value)} className="mt-1 block w-full border rounded p-2" rows={3} />
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Input Format</label>
                  <input value={qInputFormat} onChange={e => setQInputFormat(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Output Format</label>
                  <input value={qOutputFormat} onChange={e => setQOutputFormat(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Sample Input</label>
                  <input value={qSampleInput} onChange={e => setQSampleInput(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Sample Output</label>
                  <input value={qSampleOutput} onChange={e => setQSampleOutput(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Time Limit (ms)</label>
                  <input type="number" min={1000} value={qTimeLimit} onChange={e => setQTimeLimit(Number(e.target.value))} className="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Memory Limit (MB)</label>
                  <input type="number" min={64} value={qMemoryLimit} onChange={e => setQMemoryLimit(Number(e.target.value))} className="mt-1 block w-full border rounded p-2" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600">Constraints</label>
                  <input value={qConstraints} onChange={e => setQConstraints(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Test Cases</h4>
                  <button type="button" onClick={addQTestCase} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Add Test Case</button>
                </div>
                <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                  {qTestCases.length === 0 && <div className="text-sm text-gray-500">No test cases yet</div>}
                  {qTestCases.map((t, idx) => (
                    <div key={idx} className="p-2 border rounded bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input placeholder="Input" value={t.input} onChange={e => updateQTestCase(idx, 'input', e.target.value)} className="border rounded p-2" />
                        <input placeholder="Expected Output" value={t.expectedOutput} onChange={e => updateQTestCase(idx, 'expectedOutput', e.target.value)} className="border rounded p-2" />
                        <input type="number" placeholder="Marks" value={t.marks} onChange={e => updateQTestCase(idx, 'marks', Number(e.target.value))} className="border rounded p-2" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!t.isHidden} onChange={e => updateQTestCase(idx, 'isHidden', e.target.checked)} /> Hidden</label>
                        <button type="button" onClick={() => removeQTestCase(idx)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <div className="text-sm text-red-600">{error}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowQuestionForm(false); setError(''); }} className="px-3 py-1 border rounded">Cancel</button>
                  <button type="button" onClick={addQuestionDraft} className="px-3 py-1 bg-purple-600 text-white rounded">Add Question to Contest</button>
                </div>
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div className="mt-3 space-y-2">
              {questions.map((q, idx) => (
                <div key={idx} className="p-3 bg-white border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{q.title}</div>
                      <div className="text-xs text-gray-500">{q.difficulty} • {q.testCases.reduce((s, t) => s + (t.marks || 0), 0)} Marks • {q.testCases.length} cases ({q.testCases.filter(tc => tc.isHidden).length} hidden)</div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => removeQuestionDraft(idx)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Remove</button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{q.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value))} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Attempts</label>
            <input type="number" min={1} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} className="mt-1 block w-full border rounded p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Allowed Languages</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {['python','javascript','c','cpp','java'].map(lang => (
              <label key={lang} className={`px-3 py-1 border rounded cursor-pointer ${allowedLanguages.includes(lang) ? 'bg-purple-600 text-white border-transparent' : 'bg-white text-gray-700'}`}>
                <input type="checkbox" checked={allowedLanguages.includes(lang)} onChange={() => toggleLanguage(lang)} className="hidden" />
                {lang}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Access</label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2"><input type="radio" checked={accessLevel === 'public'} onChange={() => setAccessLevel('public')} /> Public</label>
            <label className="flex items-center gap-2"><input type="radio" checked={accessLevel === 'batch'} onChange={() => setAccessLevel('batch')} /> Batch-specific</label>
          </div>
        </div>

        {accessLevel === 'batch' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign to Batches</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
              {availableBatches.length === 0 ? (
                <div className="text-sm text-gray-500">No batches available</div>
              ) : (
                availableBatches.map(batch => (
                  <label key={batch._id} className="flex items-center gap-2">
                    <input type="checkbox" checked={targetBatchIds.includes(batch._id)} onChange={() => toggleBatch(batch._id)} />
                    <span className="text-sm">{batch.batchNumber || batch.name || batch._id}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={() => navigate('/trainer-dashboard')} className="px-4 py-2 mr-2 border rounded">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded" disabled={submitting}>{submitting ? 'Creating...' : 'Create Contest'}</button>
        </div>
      </form>
    </div>
  );
};

export default CreateContest;
