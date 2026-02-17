// src/components/trainer/Syllabus.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import { PlusCircle, Trash2, Edit, BookOpen, Clock, Users, X, Check, AlertCircle, ChevronLeft } from 'lucide-react';

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
  const [batches, setBatches] = useState([]);
  const [assignedPlacementBatches, setAssignedPlacementBatches] = useState([]);
  const [activeTab, setActiveTab] = useState('list');

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
      setBatches(response.data || []);
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

      if (assignedPlacementBatches.length === 0) {
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
        batchType: 'placement',
        assignedBatches: [],
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
    setAssignedPlacementBatches([]);
    setActiveTab('list');
  };

  const handleEdit = (syllabus) => {
    setFormData({
      title: syllabus.title,
      description: syllabus.description || '',
      topics: syllabus.topics.map(t => ({ ...t }))
    });
    setAssignedPlacementBatches(
      Array.isArray(syllabus.assignedPlacementBatches)
        ? syllabus.assignedPlacementBatches.map(b => b._id || b)
        : []
    );
    setEditingId(syllabus._id);
    setActiveTab('create');
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

  const handleToggleBatch = (batchId) => {
    setAssignedPlacementBatches(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Shared Header */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
                {activeTab === 'create' ? (editingId ? 'Edit Syllabus' : 'Create Syllabus') : 'Syllabus'}
              </h2>
              <p className="text-xs text-gray-500">{syllabi.length} syllabi created</p>
            </div>
          </div>
          {activeTab === 'list' ? (
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create Syllabus</span>
            </button>
          ) : (
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to List</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section: Basic Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Basic Information</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Full Stack Web Development"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief overview of the syllabus..."
                />
              </div>
            </div>
          </div>

          {/* Section: Topics */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Topics</h3>
              <button
                type="button"
                onClick={addTopic}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Topic
              </button>
            </div>
            <div className="p-4 space-y-3">
              {formData.topics.map((topic, index) => (
                <div key={index} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Topic Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="topicName"
                        value={topic.topicName}
                        onChange={(e) => handleTopicChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="e.g., React Hooks"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                      <input
                        type="text"
                        name="description"
                        value={topic.description || ''}
                        onChange={(e) => handleTopicChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="e.g., 3 hours"
                          required
                        />
                      </div>
                      {formData.topics.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTopic(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Batch Assignment */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Batch Assignment</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md bg-white">
                {batches.map(batch => {
                  const id = batch._id;
                  const checked = assignedPlacementBatches.includes(id);
                  return (
                    <label key={id} className="flex items-center gap-3 text-xs sm:text-sm truncate">
                      <input type="checkbox" checked={checked} onChange={() => handleToggleBatch(id)} className="w-4 h-4" />
                      <span className="truncate">{batch.batchNumber} - {batch.techStack}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click checkboxes to select multiple &bull; {assignedPlacementBatches.length} selected
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs sm:text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm transition"
            >
              {loading ? 'Saving...' : editingId ? 'Update Syllabus' : 'Create Syllabus'}
            </button>
          </div>
        </form>
      )}

      {/* Syllabus List */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {loading ? (
            <LoadingSkeleton />
          ) : syllabi.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No syllabi created yet.</p>
              <p className="text-sm text-gray-400 mt-2">Create your first syllabus above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Title</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Topics</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batches</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Created</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {syllabi.map((syllabus, idx) => (
                    <tr key={syllabus._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{syllabus.title}</div>
                        {syllabus.description && <div className="text-xs text-gray-500 truncate max-w-[200px]">{syllabus.description}</div>}
                      </td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{syllabus.topics.length}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {syllabus.assignedPlacementBatches?.map(b => (
                            <span key={b._id || b.batchNumber || b} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">{b.batchNumber || b}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{new Date(syllabus.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(syllabus)}
                            className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" /><span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(syllabus._id)}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /><span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Syllabus;