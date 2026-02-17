import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Monitor, ChevronLeft, PlusCircle, Trash2, X, Code, Clock, Shield } from 'lucide-react';

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
    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/batches`, { headers: { Authorization: `Bearer ${token}` } })
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

  const langLabels = { python: 'Python', javascript: 'JavaScript', c: 'C', cpp: 'C++', java: 'Java' };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Create Contest</h2>
                <p className="text-xs text-gray-500">Set up a coding contest for your students</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/trainer-dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section: Basic Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Basic Information</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contest Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., Weekly Coding Challenge #5"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                  placeholder="Describe the contest objectives..."
                />
              </div>
            </div>
          </div>

          {/* Section: Schedule & Duration */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Schedule & Duration</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Questions */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Questions ({questions.length})</h3>
              <button
                type="button"
                onClick={() => setShowQuestionForm(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                  showQuestionForm
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {showQuestionForm ? <X className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                {showQuestionForm ? 'Close' : 'Add Question'}
              </button>
            </div>
            <div className="p-4">
              {/* Question Form */}
              {showQuestionForm && (
                <div className="border border-blue-200 rounded-lg bg-blue-50/30 p-4 mb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                      <input
                        value={qTitle}
                        onChange={e => setQTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        placeholder="Question title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty</label>
                      <select
                        value={qDifficulty}
                        onChange={e => setQDifficulty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                      <textarea
                        value={qDescription}
                        onChange={e => setQDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        rows={3}
                        placeholder="Describe the problem statement..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Input Format</label>
                      <input value={qInputFormat} onChange={e => setQInputFormat(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Output Format</label>
                      <input value={qOutputFormat} onChange={e => setQOutputFormat(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sample Input</label>
                      <input value={qSampleInput} onChange={e => setQSampleInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sample Output</label>
                      <input value={qSampleOutput} onChange={e => setQSampleOutput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Time Limit (ms)</label>
                      <input type="number" min={1000} value={qTimeLimit} onChange={e => setQTimeLimit(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Memory Limit (MB)</label>
                      <input type="number" min={64} value={qMemoryLimit} onChange={e => setQMemoryLimit(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Constraints</label>
                      <input value={qConstraints} onChange={e => setQConstraints(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" placeholder="e.g., 1 <= N <= 10^5" />
                    </div>
                  </div>

                  {/* Test Cases */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-700">Test Cases ({qTestCases.length})</h4>
                      <button
                        type="button"
                        onClick={addQTestCase}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                      >
                        <PlusCircle className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                    {qTestCases.length === 0 && <p className="text-xs text-gray-500">No test cases yet. Add at least one.</p>}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {qTestCases.map((t, idx) => (
                        <div key={idx} className="p-2.5 border border-gray-200 rounded-lg bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              placeholder="Input"
                              value={t.input}
                              onChange={e => updateQTestCase(idx, 'input', e.target.value)}
                              className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              placeholder="Expected Output"
                              value={t.expectedOutput}
                              onChange={e => updateQTestCase(idx, 'expectedOutput', e.target.value)}
                              className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="number"
                              placeholder="Marks"
                              value={t.marks}
                              onChange={e => updateQTestCase(idx, 'marks', Number(e.target.value))}
                              className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <label className="flex items-center gap-1.5 text-xs text-gray-600">
                              <input
                                type="checkbox"
                                checked={!!t.isHidden}
                                onChange={e => updateQTestCase(idx, 'isHidden', e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              Hidden
                            </label>
                            <button
                              type="button"
                              onClick={() => removeQTestCase(idx)}
                              className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs hover:bg-red-100 transition inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Form Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => { setShowQuestionForm(false); setError(''); }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addQuestionDraft}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs transition"
                    >
                      Add Question to Contest
                    </button>
                  </div>
                </div>
              )}

              {/* Added Questions List */}
              {questions.length > 0 ? (
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-gray-50/50 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{q.title}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1.5 ${
                            q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>{q.difficulty}</span>
                          {q.testCases.reduce((s, t) => s + (t.marks || 0), 0)} Marks &bull; {q.testCases.length} cases ({q.testCases.filter(tc => tc.isHidden).length} hidden)
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{q.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestionDraft(idx)}
                        className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs hover:bg-red-100 transition inline-flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : !showQuestionForm && (
                <div className="text-center py-6 text-gray-400">
                  <Code className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm">No questions added yet</p>
                  <p className="text-xs text-gray-400">Click "Add Question" to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Contest Settings */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Contest Settings</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                <input
                  type="number"
                  min={1}
                  value={maxAttempts}
                  onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Allowed Languages</label>
                <div className="flex flex-wrap gap-2">
                  {['python','javascript','c','cpp','java'].map(lang => (
                    <label
                      key={lang}
                      className={`px-3 py-1.5 border rounded-lg cursor-pointer text-xs sm:text-sm font-medium transition ${
                        allowedLanguages.includes(lang)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input type="checkbox" checked={allowedLanguages.includes(lang)} onChange={() => toggleLanguage(lang)} className="hidden" />
                      {langLabels[lang]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Access Control */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Access Control</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                  <input type="radio" checked={accessLevel === 'public'} onChange={() => setAccessLevel('public')} className="w-4 h-4" />
                  Public (All Students)
                </label>
                <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                  <input type="radio" checked={accessLevel === 'batch'} onChange={() => setAccessLevel('batch')} className="w-4 h-4" />
                  Batch Specific
                </label>
              </div>

              {accessLevel === 'batch' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Assign to Batches</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-white">
                    {availableBatches.length === 0 ? (
                      <p className="text-xs text-gray-500">No batches available</p>
                    ) : (
                      availableBatches.map(batch => (
                        <label key={batch._id} className="flex items-center gap-2 text-xs sm:text-sm">
                          <input type="checkbox" checked={targetBatchIds.includes(batch._id)} onChange={() => toggleBatch(batch._id)} className="w-4 h-4" />
                          <span>{batch.batchNumber || batch.name || batch._id}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click checkboxes to select multiple &bull; {targetBatchIds.length} selected</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/trainer-dashboard')}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs sm:text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm transition"
            >
              {submitting ? 'Creating...' : 'Create Contest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContest;
