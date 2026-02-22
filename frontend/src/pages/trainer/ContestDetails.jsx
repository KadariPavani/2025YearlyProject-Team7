import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Monitor, ChevronLeft, Edit, Trash2, PlusCircle, X, CheckCircle, AlertTriangle, Code } from 'lucide-react';

const ContestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('error');

  // Contest edit state
  const [showContestEdit, setShowContestEdit] = useState(false);
  const [editContestName, setEditContestName] = useState('');
  const [editContestDescription, setEditContestDescription] = useState('');
  const [contestEditError, setContestEditError] = useState('');
  const [contestEditSubmitting, setContestEditSubmitting] = useState(false);

  const startEditContest = () => {
    setEditContestName(contest.name || '');
    setEditContestDescription(contest.description || '');
    setContestEditError('');
    setShowContestEdit(true);
  };

  const submitEditContest = async () => {
    setContestEditError('');
    if (!editContestName) return setContestEditError('Name is required');
    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    if (!token) return setContestEditError('Not authenticated');

    setContestEditSubmitting(true);
    try {
      const body = { name: editContestName, description: editContestDescription };
      const res = await axios.put(`/api/contests/admin/${id}`, body, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.contest) {
        setContest(res.data.contest);
        setShowContestEdit(false);
        setToastType('success'); setToastMsg('Contest updated successfully');
      } else {
        setContestEditError('Failed to update contest');
      }
    } catch (err) {
      setContestEditError(err.response?.data?.error || 'Failed to update contest');
    } finally {
      setContestEditSubmitting(false);
    }
  };

  // Add question form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [descriptionQ, setDescriptionQ] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [constraints, setConstraints] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [timeLimit, setTimeLimit] = useState(2000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [testCases, setTestCases] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit question state
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('Easy');
  const [editConstraints, setEditConstraints] = useState('');
  const [editInputFormat, setEditInputFormat] = useState('');
  const [editOutputFormat, setEditOutputFormat] = useState('');
  const [editSampleInput, setEditSampleInput] = useState('');
  const [editSampleOutput, setEditSampleOutput] = useState('');
  const [editTimeLimit, setEditTimeLimit] = useState(2000);
  const [editMemoryLimit, setEditMemoryLimit] = useState(256);
  const [editTestCases, setEditTestCases] = useState([]);
  const [editError, setEditError] = useState('');
  const [editingSubmitting, setEditingSubmitting] = useState(false);

  const addTestCase = () => {
    setTestCases(prev => [...prev, { input: '', expectedOutput: '', marks: 0, isHidden: false }]);
  };
  const removeTestCase = (idx) => {
    setTestCases(prev => prev.filter((_, i) => i !== idx));
  };
  const updateTestCase = (idx, key, value) => {
    setTestCases(prev => prev.map((t, i) => i === idx ? { ...t, [key]: value } : t));
  };

  const submitQuestion = async () => {
    setFormError('');
    if (!title || !descriptionQ) return setFormError('Title and description required');
    if (testCases.length === 0) return setFormError('Add at least one test case');

    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    if (!token) return setFormError('Not authenticated');

    setSubmitting(true);
    try {
      const body = { title, description: descriptionQ, difficulty, constraints, inputFormat, outputFormat, sampleInput, sampleOutput, testCases, timeLimit, memoryLimit };
      const res = await axios.post(`/api/contests/admin/${id}/questions`, body, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.question) {
        setContest(prev => ({ ...prev, questions: [...(prev.questions || []), res.data.question] }));
        setTitle(''); setDescriptionQ(''); setDifficulty('Easy'); setConstraints(''); setInputFormat(''); setOutputFormat(''); setSampleInput(''); setSampleOutput(''); setTimeLimit(2000); setMemoryLimit(256); setTestCases([]); setShowAddForm(false);
        setToastType('success'); setToastMsg('Question added successfully');
      } else {
        setFormError('Failed to add question');
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditQuestion = (q) => {
    setEditingQuestionId(q._id);
    setEditTitle(q.title || '');
    setEditDescription(q.description || '');
    setEditDifficulty(q.difficulty || 'Easy');
    setEditConstraints(q.constraints || '');
    setEditInputFormat(q.inputFormat || '');
    setEditOutputFormat(q.outputFormat || '');
    setEditSampleInput(q.sampleInput || '');
    setEditSampleOutput(q.sampleOutput || '');
    setEditTimeLimit(q.timeLimit || 2000);
    setEditMemoryLimit(q.memoryLimit || 256);
    setEditTestCases((q.testCases || []).map(tc => ({ ...tc })));
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingQuestionId(null);
    setEditTitle(''); setEditDescription(''); setEditDifficulty('Easy'); setEditConstraints(''); setEditInputFormat(''); setEditOutputFormat(''); setEditSampleInput(''); setEditSampleOutput(''); setEditTimeLimit(2000); setEditMemoryLimit(256); setEditTestCases([]); setEditError('');
  };

  const addEditTestCase = () => setEditTestCases(prev => [...prev, { input: '', expectedOutput: '', marks: 0, isHidden: false }]);
  const removeEditTestCase = (idx) => setEditTestCases(prev => prev.filter((_, i) => i !== idx));
  const updateEditTestCase = (idx, key, value) => setEditTestCases(prev => prev.map((t, i) => i === idx ? { ...t, [key]: value } : t));

  const submitEditQuestion = async () => {
    setEditError('');
    if (!editTitle || !editDescription) return setEditError('Title and description required');
    if (editTestCases.length === 0) return setEditError('Add at least one test case');

    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    if (!token) return setEditError('Not authenticated');

    setEditingSubmitting(true);
    try {
      const body = { title: editTitle, description: editDescription, difficulty: editDifficulty, constraints: editConstraints, inputFormat: editInputFormat, outputFormat: editOutputFormat, sampleInput: editSampleInput, sampleOutput: editSampleOutput, testCases: editTestCases, timeLimit: editTimeLimit, memoryLimit: editMemoryLimit };
      const res = await axios.put(`/api/contests/admin/${id}/questions/${editingQuestionId}`, body, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.question) {
        setContest(prev => ({ ...prev, questions: prev.questions.map(q => q._id === res.data.question._id ? res.data.question : q) }));
        cancelEdit();
        setToastType('success'); setToastMsg('Question updated successfully');
      } else {
        setEditError('Failed to update question');
      }
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update question');
    } finally {
      setEditingSubmitting(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    if (!token) { setToastType('error'); setToastMsg('Not authenticated'); return; }

    try {
      await axios.delete(`/api/contests/admin/${id}/questions/${questionId}`, { headers: { Authorization: `Bearer ${token}` } });
      setContest(prev => ({ ...prev, questions: prev.questions.filter(q => q._id !== questionId) }));
      setToastType('success'); setToastMsg('Question deleted');
    } catch (err) {
      setToastType('error'); setToastMsg(err.response?.data?.error || 'Failed to delete question');
    }
  };

  const deleteContest = async () => {
    if (!window.confirm('Delete this contest? This will remove it permanently.')) return;
    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    if (!token) { setToastType('error'); setToastMsg('Not authenticated'); return; }

    try {
      await axios.delete(`/api/contests/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/trainer-dashboard', { state: { refreshContests: true } });
    } catch (err) {
      setToastType('error'); setToastMsg(err.response?.data?.error || 'Failed to delete contest');
    }
  };

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    axios.get(`/api/contests/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setContest(res.data.contest))
      .catch(err => setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load contest'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (contest && location?.state?.edit) {
      startEditContest();
      try { window.history.replaceState({}, document.title, window.location.pathname); } catch(e) {}
    }
  }, [contest, location?.state]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="p-6"><ToastNotification type="error" message={error} onClose={() => setError('')} /></div>;
  if (!contest) return <div className="p-6">No contest found</div>;

  const difficultyColor = (d) => {
    if (d === 'Easy') return 'bg-green-100 text-green-700';
    if (d === 'Medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-xs sm:text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {toastMsg && (
          <ToastNotification type={toastType} message={toastMsg} onClose={() => setToastMsg('')} />
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">{contest.name}</h2>
              <p className="text-xs text-gray-500 truncate">{contest.description || 'No description'}</p>
            </div>
            <button
              onClick={() => navigate('/trainer-dashboard')}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
          {/* Action buttons row */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button
              onClick={startEditContest}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={async () => {
                if (!window.confirm('Finalize contest for all participants? This will create final submissions and update student coding progress.')) return;
                const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
                try {
                  const res = await axios.post(`/api/contests/admin/${id}/finalize-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
                  setToastType('success'); setToastMsg(res.data.message || 'Finalized for all participants');
                } catch (err) {
                  setToastType('error'); setToastMsg(err.response?.data?.error || 'Failed to finalize contest for all');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs hover:bg-amber-600 transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Finalize All
            </button>
            <button
              onClick={deleteContest}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
          {/* Schedule info strip */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>Start: <strong className="text-gray-700">{new Date(contest.startTime).toLocaleString()}</strong></span>
            <span>End: <strong className="text-gray-700">{new Date(contest.endTime).toLocaleString()}</strong></span>
            {contest.duration && <span>Duration: <strong className="text-gray-700">{contest.duration} min</strong></span>}
            <span>Questions: <strong className="text-gray-700">{contest.questions?.length || 0}</strong></span>
          </div>
        </div>

        {/* Edit Contest Section */}
        {showContestEdit && (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Edit Contest</h3>
              <button onClick={() => setShowContestEdit(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Contest Name *</label>
                  <input value={editContestName} onChange={e => setEditContestName(e.target.value)} className={inputClass} placeholder="Contest name" />
                </div>
                <div>
                  <label className={labelClass}>Duration (minutes)</label>
                  <input type="number" value={contest.duration || ''} disabled className={`${inputClass} bg-gray-50 cursor-not-allowed`} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea value={editContestDescription} onChange={e => setEditContestDescription(e.target.value)} className={inputClass} rows={3} placeholder="Contest description" />
                </div>
              </div>
              {contestEditError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {contestEditError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowContestEdit(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition">Cancel</button>
                <button onClick={submitEditContest} disabled={contestEditSubmitting} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {contestEditSubmitting ? 'Updating...' : 'Update Contest'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Questions ({contest.questions?.length || 0})</h3>
            <button
              onClick={() => setShowAddForm(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                showAddForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showAddForm ? <X className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
              {showAddForm ? 'Close' : 'Add Question'}
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Add Question Form */}
            {showAddForm && (
              <div className="border border-blue-200 rounded-lg bg-blue-50/30 p-4 space-y-4">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700">New Question</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Title *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Question title" />
                  </div>
                  <div>
                    <label className={labelClass}>Difficulty</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={inputClass}>
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Description *</label>
                    <textarea value={descriptionQ} onChange={e => setDescriptionQ(e.target.value)} className={inputClass} rows={4} placeholder="Problem statement..." />
                  </div>
                  <div>
                    <label className={labelClass}>Input Format</label>
                    <input value={inputFormat} onChange={e => setInputFormat(e.target.value)} className={inputClass} placeholder="e.g., First line contains N" />
                  </div>
                  <div>
                    <label className={labelClass}>Output Format</label>
                    <input value={outputFormat} onChange={e => setOutputFormat(e.target.value)} className={inputClass} placeholder="e.g., Print the result" />
                  </div>
                  <div>
                    <label className={labelClass}>Sample Input</label>
                    <input value={sampleInput} onChange={e => setSampleInput(e.target.value)} className={inputClass} placeholder="Sample input" />
                  </div>
                  <div>
                    <label className={labelClass}>Sample Output</label>
                    <input value={sampleOutput} onChange={e => setSampleOutput(e.target.value)} className={inputClass} placeholder="Sample output" />
                  </div>
                  <div>
                    <label className={labelClass}>Time Limit (ms)</label>
                    <input type="number" min={1000} value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Memory Limit (MB)</label>
                    <input type="number" min={64} value={memoryLimit} onChange={e => setMemoryLimit(Number(e.target.value))} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Constraints</label>
                    <input value={constraints} onChange={e => setConstraints(e.target.value)} className={inputClass} placeholder="e.g., 1 <= N <= 10^5" />
                  </div>
                </div>

                {/* Test Cases */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs sm:text-sm font-semibold text-gray-700">Test Cases</h5>
                    <button type="button" onClick={addTestCase} className="flex items-center gap-1.5 px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition">
                      <PlusCircle className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {testCases.length === 0 && <p className="text-xs text-gray-400">No test cases yet. Add at least one.</p>}
                    {testCases.map((t, idx) => (
                      <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input placeholder="Input" value={t.input} onChange={e => updateTestCase(idx, 'input', e.target.value)} className={inputClass} />
                          <input placeholder="Expected Output" value={t.expectedOutput} onChange={e => updateTestCase(idx, 'expectedOutput', e.target.value)} className={inputClass} />
                          <input type="number" placeholder="Marks" value={t.marks} onChange={e => updateTestCase(idx, 'marks', Number(e.target.value))} className={inputClass} />
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={!!t.isHidden} onChange={e => updateTestCase(idx, 'isHidden', e.target.checked)} className="rounded" /> Hidden
                          </label>
                          <button type="button" onClick={() => removeTestCase(idx)} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition">
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition">Cancel</button>
                  <button type="button" onClick={submitQuestion} disabled={submitting} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? 'Adding...' : 'Add Question'}
                  </button>
                </div>
              </div>
            )}

            {/* Question List */}
            {contest.questions && contest.questions.length > 0 ? (
              <div className="space-y-3">
                {contest.questions.map((q, qIdx) => (
                  <div key={q._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-3 sm:p-4 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-xs text-gray-400 font-mono">#{qIdx + 1}</span>
                          <span className="text-sm font-medium text-gray-900">{q.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => startEditQuestion(q)} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition">
                            <Edit className="w-3 h-3" /> <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button onClick={() => deleteQuestion(q._id)} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition">
                            <Trash2 className="w-3 h-3" /> <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{q.totalMarks || (q.testCases ? q.testCases.reduce((s, t) => s + (t.marks || 0), 0) : 0)} Marks</span>
                        <span>{q.testCases ? q.testCases.length : 0} test cases</span>
                        <span>{q.testCases ? q.testCases.filter(tc => tc.isHidden).length : 0} hidden</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">{q.description}</p>
                    </div>

                    {/* Edit Question Inline */}
                    {editingQuestionId === q._id && (
                      <div className="border-t border-gray-200 bg-gray-50/50 p-4 space-y-4">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Edit Question</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Title *</label>
                            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Difficulty</label>
                            <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)} className={inputClass}>
                              <option>Easy</option>
                              <option>Medium</option>
                              <option>Hard</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className={labelClass}>Description *</label>
                            <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className={inputClass} rows={3} />
                          </div>
                          <div>
                            <label className={labelClass}>Input Format</label>
                            <input value={editInputFormat} onChange={e => setEditInputFormat(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Output Format</label>
                            <input value={editOutputFormat} onChange={e => setEditOutputFormat(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Sample Input</label>
                            <input value={editSampleInput} onChange={e => setEditSampleInput(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Sample Output</label>
                            <input value={editSampleOutput} onChange={e => setEditSampleOutput(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Time Limit (ms)</label>
                            <input type="number" min={1000} value={editTimeLimit} onChange={e => setEditTimeLimit(Number(e.target.value))} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Memory Limit (MB)</label>
                            <input type="number" min={64} value={editMemoryLimit} onChange={e => setEditMemoryLimit(Number(e.target.value))} className={inputClass} />
                          </div>
                          <div className="md:col-span-2">
                            <label className={labelClass}>Constraints</label>
                            <input value={editConstraints} onChange={e => setEditConstraints(e.target.value)} className={inputClass} />
                          </div>
                        </div>

                        {/* Edit Test Cases */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs sm:text-sm font-semibold text-gray-700">Test Cases</h5>
                            <button onClick={addEditTestCase} className="flex items-center gap-1.5 px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition">
                              <PlusCircle className="w-3 h-3" /> Add
                            </button>
                          </div>
                          <div className="space-y-2 max-h-56 overflow-y-auto">
                            {editTestCases.length === 0 && <p className="text-xs text-gray-400">No test cases yet</p>}
                            {editTestCases.map((t, idx) => (
                              <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <input placeholder="Input" value={t.input} onChange={e => updateEditTestCase(idx, 'input', e.target.value)} className={inputClass} />
                                  <input placeholder="Expected Output" value={t.expectedOutput} onChange={e => updateEditTestCase(idx, 'expectedOutput', e.target.value)} className={inputClass} />
                                  <input type="number" placeholder="Marks" value={t.marks} onChange={e => updateEditTestCase(idx, 'marks', Number(e.target.value))} className={inputClass} />
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={!!t.isHidden} onChange={e => updateEditTestCase(idx, 'isHidden', e.target.checked)} className="rounded" /> Hidden
                                  </label>
                                  <button onClick={() => removeEditTestCase(idx)} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition">
                                    <Trash2 className="w-3 h-3" /> Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {editError && (
                          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            {editError}
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <button onClick={cancelEdit} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition">Cancel</button>
                          <button onClick={submitEditQuestion} disabled={editingSubmitting} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {editingSubmitting ? 'Updating...' : 'Update Question'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Code className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-xs sm:text-sm font-medium text-gray-500">No questions yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your first question to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestDetails;
