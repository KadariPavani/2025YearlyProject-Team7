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
      const response = await axios.get('/api/syllabi', {
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
      const response = await axios.get('/api/quizzes/batches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(response.data || { regular: [], placement: [], all: [] });
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

      if (
        (batchType === 'regular' || batchType === 'both') && assignedBatches.length === 0 ||
        (batchType === 'placement' || batchType === 'both') && assignedPlacementBatches.length === 0
      ) {
        setError('Please assign at least one batch');
        return;
      }

      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        topics: formData.topics.filter(t => t.topicName.trim() && t.duration.trim()),
        batchType,
        assignedBatches: batchType === 'regular' || batchType === 'both' ? assignedBatches : [],
        assignedPlacementBatches: batchType === 'placement' || batchType === 'both' ? assignedPlacementBatches : []
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
    if (batchType === 'regular') setAssignedBatches(selected);
    else if (batchType === 'placement') setAssignedPlacementBatches(selected);
    else if (batchType === 'both') setAssignedBatches(selected);
  };

  const getBatchOptions = () => {
    switch (batchType) {
      case 'regular': return batches.regular;
      case 'placement': return batches.placement;
      case 'both': return batches.all;
      default: return [];
    }
  };

  const getSelectedCount = () => {
    if (batchType === 'regular') return assignedBatches.length;
    if (batchType === 'placement') return assignedPlacementBatches.length;
    return assignedBatches.length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Syllabus Management</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create and manage detailed course syllabi for your batches
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/50">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <PlusCircle className="w-7 h-7 text-blue-600" />
            {editingId ? 'Edit Syllabus' : 'Create New Syllabus'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <option value="regular">Regular Batches</option>
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
                <label className="text-sm font-semibold text-gray-700">
                  Topics <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addTopic}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add Topic
                </button>
              </div>

              <div className="space-y-4">
                {formData.topics.map((topic, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
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
                <select
                  multiple
                  value={batchType === 'regular' ? assignedBatches : assignedPlacementBatches}
                  onChange={handleBatchChange}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 text-sm"
                >
                  {getBatchOptions().map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name || `${batch.batchNumber} - ${batch.techStack}`} ({batch.studentCount || 0} students)
                    </option>
                  ))}
                </select>
                <div className="absolute top-3 right-3 pointer-events-none">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Hold Ctrl/Cmd to select multiple • {getSelectedCount()} selected
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Syllabi</h3>

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
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-800 text-lg leading-tight">
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

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>{syllabus.topics.length} topic{syllabus.topics.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4 text-green-600" />
                        <span>{batchCount} batch{batchCount > 1 ? 'es' : ''}</span>
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