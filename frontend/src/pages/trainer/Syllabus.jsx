// src/components/trainer/Syllabus.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Trash2, Edit, BookOpen, Clock, Users, X, Check, AlertCircle } from 'lucide-react';

const Syllabus = () => {
  const [syllabi, setSyllabi] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topics: [{ topicName: '', description: '', duration: '' }]
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchType, setBatchType] = useState('placement');
  const [batches, setBatches] = useState({ regular: [], placement: [], all: [] });
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [assignedPlacementBatches, setAssignedPlacementBatches] = useState([]);

  useEffect(() => {
    fetchSyllabi();
    fetchBatches();
  }, []);

  const fetchSyllabi = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) {
        setError('No trainer token found. Please log in again.');
        return;
      }
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabi`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyllabi(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch syllabi';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('trainerToken');
      if (!token) return;
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/batches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(response.data || { regular: [], placement: [], all: [] });
      console.log('DEBUG /api/quizzes/batches response (syllabus):', response.data || {});
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch batches';
      setError(errorMsg);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTopicChange = (index, e) => {
    const { name, value } = e.target;
    const newTopics = [...formData.topics];
    newTopics[index][name] = value;
    setFormData({ ...formData, topics: newTopics });
  };

  const addTopic = () => {
    setFormData({
      ...formData,
      topics: [...formData.topics, { topicName: '', description: '', duration: '' }]
    });
  };

  const removeTopic = (index) => {
    const newTopics = formData.topics.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      topics: newTopics.length ? newTopics : [{ topicName: '', description: '', duration: '' }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const validTopics = formData.topics.every(t => t.topicName.trim() && t.duration.trim());
      if (!validTopics) {
        setError('Each topic must have a name and duration');
        return;
      }

      // Require at least one selected batch — allow either array to satisfy when types may overlap
      const hasNonCrtSelection = assignedBatches.length > 0 || assignedPlacementBatches.length > 0;
      const hasPlacementSelection = assignedPlacementBatches.length > 0 || assignedBatches.length > 0;

      if (
        (batchType === 'noncrt' && !hasNonCrtSelection) ||
        (batchType === 'placement' && !hasPlacementSelection) ||
        (batchType === 'both' && (assignedBatches.length === 0 && assignedPlacementBatches.length === 0))
      ) {
        setError('Please assign at least one batch');
        return;
      }

      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      // Send both arrays so backend can reconcile placement vs regular ids regardless of selected batchType
      const payload = {
        title: formData.title,
        description: formData.description,
        topics: formData.topics.filter(t => t.topicName.trim() && t.duration.trim()),
        batchType,
        assignedBatches: assignedBatches,
        assignedPlacementBatches: assignedPlacementBatches
      };

      if (editingId) {
        const response = await axios.put(`/api/syllabi/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSyllabi(syllabi.map(s => (s._id === editingId ? response.data : s)));
        resetForm();
      } else {
        const response = await axios.post('/api/syllabi', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSyllabi([...syllabi, response.data]);
        resetForm();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save syllabus');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      topics: [{ topicName: '', description: '', duration: '' }]
    });
    setEditingId(null);
    setBatchType('placement');
    setAssignedBatches([]);
    setAssignedPlacementBatches([]);
  };

  const handleEdit = (syllabus) => {
    setFormData({
      title: syllabus.title,
      description: syllabus.description || '',
      topics: syllabus.topics.map(t => ({ ...t }))
    });
    setBatchType(syllabus.batchType || 'placement');
    setAssignedBatches(
      Array.isArray(syllabus.assignedBatches)
        ? syllabus.assignedBatches.map(b => b._id || b)
        : []
    );
    setAssignedPlacementBatches(
      Array.isArray(syllabus.assignedPlacementBatches)
        ? syllabus.assignedPlacementBatches.map(b => b._id || b)
        : []
    );
    setEditingId(syllabus._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this syllabus?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      await axios.delete(`/api/syllabi/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyllabi(syllabi.filter(s => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete syllabus');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchTypeChange = (e) => {
    setBatchType(e.target.value);
    setAssignedBatches([]);
    setAssignedPlacementBatches([]);
  };

  const handleBatchChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    if (batchType === 'noncrt') {
      setAssignedBatches(selected);
    } else if (batchType === 'placement') {
      setAssignedPlacementBatches(selected);
    } else if (batchType === 'both') {
      // when both, keep both arrays in sync
      setAssignedBatches(selected);
      setAssignedPlacementBatches(selected);
    }
  };

  // Toggle selector for checkboxes (supports passing item's type to disambiguate placement vs regular)
  const handleToggleBatch = (batchId, itemType) => {
    const toggle = (arr, id) => (arr.includes(id) ? arr.filter(i => i !== id) : [...arr, id]);

    // If explicit itemType is provided, use it
    if (itemType === 'placement') {
      setAssignedPlacementBatches(prev => toggle(prev, batchId));
      return;
    }
    if (itemType === 'regular') {
      setAssignedBatches(prev => toggle(prev, batchId));
      return;
    }

    // Fallback: use the current batchType
    if (batchType === 'noncrt' || batchType === 'regular') {
      setAssignedBatches(prev => toggle(prev, batchId));
    } else if (batchType === 'placement') {
      setAssignedPlacementBatches(prev => toggle(prev, batchId));
    } else { // both
      setAssignedBatches(prev => toggle(prev, batchId));
      setAssignedPlacementBatches(prev => toggle(prev, batchId));
    }
  };

  const getBatchOptions = () => {
    const norm = s => (s || '').toString().trim().toUpperCase();
    const isNT = b => (b && (b.isCrt === false)) || /^NT\b|^NT[_\- ]/.test(norm(b.batchNumber || b.name));
    const isPT = b => /^PT\b|^PT[_\- ]/.test(norm(b.batchNumber || b.name));

    const regularList = batches.regular || [];
    const placementAll = batches.placement || [];

    const noncrtFromRegular = regularList.filter(b => isNT(b));
    const noncrtFromPlacement = placementAll.filter(b => isNT(b));

    const uniqueById = (arr) => Array.from(new Map(arr.map(i => [i._id?.toString() || i.name || Math.random(), i])).values());

    const noncrtList = uniqueById([...noncrtFromRegular, ...noncrtFromPlacement]);
    const placementList = uniqueById(placementAll.filter(b => isPT(b)));

    // DEBUG: log computed lists
    console.log('DEBUG getBatchOptions (syllabus):', { batchType, noncrtFromRegular: noncrtFromRegular.length, noncrtFromPlacement: noncrtFromPlacement.length, noncrtCount: noncrtList.length, placementCount: placementList.length });

    switch (batchType) {
      case 'noncrt': return noncrtList;
      case 'placement': return placementList;
      case 'both': return [...placementList, ...noncrtList];
      default: return [];
    }
  };

  const getSelectedCount = () => {
    if (batchType === 'noncrt') return assignedBatches.length;
    if (batchType === 'placement') return assignedPlacementBatches.length;
    // both: count unique selected ids across both arrays
    return Array.from(new Set([...(assignedBatches || []), ...(assignedPlacementBatches || [])])).length;
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-md">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">Syllabus Management</h1>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Create and manage course syllabi for your batches
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            {editingId ? 'Edit Syllabus' : 'Create New Syllabus'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g., Full Stack Web Development"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Batch Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={batchType}
                  onChange={handleBatchTypeChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="placement">Placement Training</option>
                  <option value="noncrt">Non-CRT Batches</option>
                  <option value="both">Both Types</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief overview of the syllabus..."
              />
            </div>

            {/* Topics */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Topics <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addTopic}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all text-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Topic
                </button>
              </div>

              <div className="space-y-4">
                {formData.topics.map((topic, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Topic Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="topicName"
                          value={topic.topicName}
                          onChange={(e) => handleTopicChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., React Hooks"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          name="description"
                          value={topic.description || ''}
                          onChange={(e) => handleTopicChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Brief description"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Duration <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="duration"
                            value={topic.duration || ''}
                            onChange={(e) => handleTopicChange(index, e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 3 hours"
                            required
                          />
                        </div>
                        {formData.topics.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTopic(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch Assignment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign to Batches <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md bg-white">
                  {getBatchOptions().map(batch => {
                    const id = batch._id || batch.batchNumber || batch.name;
                    const checked = batchType === 'noncrt' ? assignedBatches.includes(id) : batchType === 'placement' ? assignedPlacementBatches.includes(id) : (assignedBatches.includes(id) || assignedPlacementBatches.includes(id));
                    return (
                      <label key={id} className="flex items-center gap-3 text-sm truncate">
                        <input type="checkbox" checked={checked} onChange={() => handleToggleBatch(id, batch.type)} className="w-4 h-4" />
                        <span className="truncate">{batch.type === 'placement' ? `${batch.batchNumber} - ${batch.techStack}` : (batch.name || batch.batchNumber)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click checkboxes to select multiple • {getSelectedCount()} selected
              </p>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {loading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {editingId ? 'Update Syllabus' : 'Create Syllabus'}
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Syllabus List */}
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Syllabi</h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : syllabi.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No syllabi created yet.</p>
              <p className="text-sm text-gray-400 mt-2">Create your first syllabus above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {syllabi.map((syllabus) => {
                const batchCount = 
                  (syllabus.assignedBatches?.length || 0) + 
                  (syllabus.assignedPlacementBatches?.length || 0);

                return (
                  <div
                    key={syllabus._id}
                    className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 text-lg leading-tight">
                        {syllabus.title}
                      </h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(syllabus)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(syllabus._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {syllabus.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {syllabus.description}
                      </p>
                    )}

                    {/* Batch badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {syllabus.assignedBatches?.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Non-CRT: {syllabus.assignedBatches.map(b => b.name || b).join(', ')}</span>
                      )}

                      {syllabus.assignedPlacementBatches?.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Placement: {syllabus.assignedPlacementBatches.map(b => b.batchNumber ? `${b.batchNumber} - ${b.techStack}` : b).join(', ')}</span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm sm:text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>{syllabus.topics.length} topic{syllabus.topics.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(syllabus.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Syllabus;