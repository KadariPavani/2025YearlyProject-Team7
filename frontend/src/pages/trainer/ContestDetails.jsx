import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const ContestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Contest edit state (minimal fields)
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
      } else {
        setContestEditError('Failed to update contest');
      }
    } catch (err) {
      setContestEditError(err.response?.data?.error || 'Failed to update contest');
      console.error('Update contest error', err);
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
      const body = {
        title,
        description: descriptionQ,
        difficulty,
        constraints,
        inputFormat,
        outputFormat,
        sampleInput,
        sampleOutput,
        testCases,
        timeLimit,
        memoryLimit
      };

      const res = await axios.post(`/api/contests/admin/${id}/questions`, body, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.question) {
        // append to contest questions
        setContest(prev => ({ ...prev, questions: [...(prev.questions || []), res.data.question] }));
        // reset form
        setTitle(''); setDescriptionQ(''); setDifficulty('Easy'); setConstraints(''); setInputFormat(''); setOutputFormat(''); setSampleInput(''); setSampleOutput(''); setTimeLimit(2000); setMemoryLimit(256); setTestCases([]); setShowAddForm(false);
      } else {
        setFormError('Failed to add question');
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add question');
      console.error('Add question error', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Question edit/delete helpers ----------
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
      const body = {
        title: editTitle,
        description: editDescription,
        difficulty: editDifficulty,
        constraints: editConstraints,
        inputFormat: editInputFormat,
        outputFormat: editOutputFormat,
        sampleInput: editSampleInput,
        sampleOutput: editSampleOutput,
        testCases: editTestCases,
        timeLimit: editTimeLimit,
        memoryLimit: editMemoryLimit
      };

      const res = await axios.put(`/api/contests/admin/${id}/questions/${editingQuestionId}`, body, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.question) {
        setContest(prev => ({ ...prev, questions: prev.questions.map(q => q._id === res.data.question._id ? res.data.question : q) }));
        cancelEdit();
      } else {
        setEditError('Failed to update question');
      }
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update question');
      console.error('Update question error', err);
    } finally {
      setEditingSubmitting(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    if (!token) return alert('Not authenticated');

    try {
      await axios.delete(`/api/contests/admin/${id}/questions/${questionId}`, { headers: { Authorization: `Bearer ${token}` } });
      setContest(prev => ({ ...prev, questions: prev.questions.filter(q => q._id !== questionId) }));
    } catch (err) {
      console.error('Delete question error', err);
      alert(err.response?.data?.error || 'Failed to delete question');
    }
  };

  const deleteContest = async () => {
    if (!window.confirm('Delete this contest? This will remove it permanently.')) return;
    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    if (!token) return alert('Not authenticated');

    try {
      await axios.delete(`/api/contests/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/trainer-dashboard', { state: { refreshContests: true } });
    } catch (err) {
      console.error('Delete contest error', err);
      alert(err.response?.data?.error || 'Failed to delete contest');
    }
  };


  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
    axios.get(`/api/contests/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setContest(res.data.contest);
      })
      .catch(err => {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load contest');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // If navigated with state.edit, open edit form automatically once contest is loaded
  useEffect(() => {
    if (contest && location?.state?.edit) {
      startEditContest();
      try { window.history.replaceState({}, document.title, window.location.pathname); } catch(e) {}
    }
  }, [contest, location?.state]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!contest) return <div className="p-6">No contest found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">{contest.name}</h2>
          <p className="text-sm text-gray-600">{contest.description}</p>
          <p className="text-xs text-gray-500 mt-2">{new Date(contest.startTime).toLocaleString()} - {new Date(contest.endTime).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/trainer-dashboard')} className="px-3 py-1 border rounded">Back</button>
          <button onClick={startEditContest} className="px-3 py-1 border rounded">Edit</button>
          <button onClick={async () => {
            if (!window.confirm('Finalize contest for all participants? This will create final submissions and update student coding progress.')) return;
            const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
            try {
              const res = await axios.post(`/api/contests/admin/${id}/finalize-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
              alert(res.data.message || 'Finalized for all participants');
            } catch (err) {
              console.error('Finalize all error', err);
              alert(err.response?.data?.error || 'Failed to finalize contest for all');
            }
          }} className="px-3 py-1 bg-amber-500 text-white rounded">Finalize All</button>
          <button onClick={deleteContest} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
        </div>
      </div>

      {showContestEdit && (
        <div className="mb-4 border rounded p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">Edit Contest</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600">Name *</label>
              <input value={editContestName} onChange={e => setEditContestName(e.target.value)} className="mt-1 block w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Duration (minutes)</label>
              <input type="number" value={contest.duration || ''} disabled className="mt-1 block w-full border rounded p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600">Description</label>
              <textarea value={editContestDescription} onChange={e => setEditContestDescription(e.target.value)} className="mt-1 block w-full border rounded p-2" rows={3} />
            </div>
          </div>
          {contestEditError && <div className="mt-2 text-red-600">{contestEditError}</div>}
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowContestEdit(false)} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={submitEditContest} className="px-3 py-1 bg-purple-600 text-white rounded" disabled={contestEditSubmitting}>{contestEditSubmitting ? 'Updating...' : 'Update'}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Questions ({contest.questions?.length || 0})</h3>
          <div className="flex items-center gap-2">
            {/* Add Question button visible to authenticated users (trainer/admin) */}
            <button onClick={() => setShowAddForm(prev => !prev)} className="px-3 py-1 bg-purple-600 text-white rounded">{showAddForm ? 'Close' : 'Add Question'}</button>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-4 border rounded p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="mt-1 block w-full border rounded p-2">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600">Description *</label>
                <textarea value={descriptionQ} onChange={e => setDescriptionQ(e.target.value)} className="mt-1 block w-full border rounded p-2" rows={4} />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Input Format</label>
                <input value={inputFormat} onChange={e => setInputFormat(e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Output Format</label>
                <input value={outputFormat} onChange={e => setOutputFormat(e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Sample Input</label>
                <input value={sampleInput} onChange={e => setSampleInput(e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Sample Output</label>
                <input value={sampleOutput} onChange={e => setSampleOutput(e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-xs text-gray-600">Time Limit (ms)</label>
                <input type="number" min={1000} value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Memory Limit (MB)</label>
                <input type="number" min={64} value={memoryLimit} onChange={e => setMemoryLimit(Number(e.target.value))} className="mt-1 block w-full border rounded p-2" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600">Constraints</label>
                <input value={constraints} onChange={e => setConstraints(e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Test Cases</h4>
                <button type="button" onClick={addTestCase} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Add Test Case</button>
              </div>
              <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                {testCases.length === 0 && <div className="text-sm text-gray-500">No test cases yet</div>}
                {testCases.map((t, idx) => (
                  <div key={idx} className="p-2 border rounded bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input placeholder="Input" value={t.input} onChange={e => updateTestCase(idx, 'input', e.target.value)} className="border rounded p-2" />
                      <input placeholder="Expected Output" value={t.expectedOutput} onChange={e => updateTestCase(idx, 'expectedOutput', e.target.value)} className="border rounded p-2" />
                      <input type="number" placeholder="Marks" value={t.marks} onChange={e => updateTestCase(idx, 'marks', Number(e.target.value))} className="border rounded p-2" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={!!t.isHidden} onChange={e => updateTestCase(idx, 'isHidden', e.target.checked)} /> Hidden</label>
                      <button type="button" onClick={() => removeTestCase(idx)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formError && <div className="mt-2 text-red-600">{formError}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1 border rounded">Cancel</button>
              <button type="button" onClick={submitQuestion} className="px-3 py-1 bg-purple-600 text-white rounded">{submitting ? 'Adding...' : 'Add Question'}</button>
            </div>
          </div>
        )}

        {contest.questions && contest.questions.length > 0 ? (
          <div className="space-y-3">
            {contest.questions.map(q => (
              <div key={q._id} className="p-3 border rounded">
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{q.title}</div>
                        <div className="text-xs text-gray-500">{q.difficulty} • {q.totalMarks || (q.testCases ? q.testCases.reduce((s, t) => s + (t.marks || 0), 0) : 0)} Marks • {q.testCases ? q.testCases.length : 0} cases ({q.testCases ? q.testCases.filter(tc => tc.isHidden).length : 0} hidden)</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditQuestion(q)} className="px-2 py-1 border rounded text-sm">Edit</button>
                        <button onClick={() => deleteQuestion(q._id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{q.description}</p>

                    {editingQuestionId === q._id && (
                      <div className="mt-3 border rounded p-3 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600">Title *</label>
                            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mt-1 block w-full border rounded p-2" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Difficulty</label>
                            <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)} className="mt-1 block w-full border rounded p-2">
                              <option>Easy</option>
                              <option>Medium</option>
                              <option>Hard</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-600">Description *</label>
                            <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="mt-1 block w-full border rounded p-2" rows={3} />
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold">Test Cases</h5>
                            <button onClick={addEditTestCase} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Add Test Case</button>
                          </div>
                          <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                            {editTestCases.length === 0 && <div className="text-sm text-gray-500">No test cases yet</div>}
                            {editTestCases.map((t, idx) => (
                              <div key={idx} className="p-2 border rounded bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <input placeholder="Input" value={t.input} onChange={e => updateEditTestCase(idx, 'input', e.target.value)} className="border rounded p-2" />
                                  <input placeholder="Expected Output" value={t.expectedOutput} onChange={e => updateEditTestCase(idx, 'expectedOutput', e.target.value)} className="border rounded p-2" />
                                  <input type="number" placeholder="Marks" value={t.marks} onChange={e => updateEditTestCase(idx, 'marks', Number(e.target.value))} className="border rounded p-2" />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!t.isHidden} onChange={e => updateEditTestCase(idx, 'isHidden', e.target.checked)} /> Hidden</label>
                                  <button onClick={() => removeEditTestCase(idx)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Remove</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {editError && <div className="mt-2 text-red-600">{editError}</div>}
                        <div className="mt-3 flex justify-end gap-2">
                          <button onClick={cancelEdit} className="px-2 py-1 border rounded">Cancel</button>
                          <button onClick={submitEditQuestion} className="px-2 py-1 bg-purple-600 text-white rounded" disabled={editingSubmitting}>{editingSubmitting ? 'Updating...' : 'Update'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No questions yet. You can add questions from here.</div>
        )}
      </div>
    </div>
  );
};

export default ContestDetails;
