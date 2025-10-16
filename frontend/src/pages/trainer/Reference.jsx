// Updated Trainer Reference.jsx - Enhanced with placement training batch support
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Trash2, Edit, PlusCircle, BookOpen, Eye, Star, Users, Link, Video, File } from 'lucide-react';

const Reference = ({ availableBatches }) => {
  const [references, setReferences] = useState([]);
  const [batches, setBatches] = useState({
    regular: [],
    placement: [],
    all: []
  });
  const [formData, setFormData] = useState({
    topicName: '',
    subject: '',
    module: '',
    difficulty: 'intermediate',
    resources: [],
    referenceVideoLink: '',
    referenceNotesLink: '',
    assignedBatches: [],
    assignedPlacementBatches: [],
    batchType: 'placement',
    isPublic: true,
    accessLevel: 'public',
    learningObjectives: [],
    prerequisites: [],
    tags: []
  });
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [selectedReferenceId, setSelectedReferenceId] = useState(null);

  useEffect(() => {
    fetchReferences();
    if (availableBatches) {
      setBatches(availableBatches);
    } else {
      fetchBatches();
    }
  }, [availableBatches]);

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get('/api/references/batches', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBatches(response.data || { regular: [], placement: [], all: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batches');
      console.error('Error fetching batches:', err);
    }
  };

  const fetchReferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get('/api/references', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReferences(Array.isArray(response.data.references) ? response.data.references : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch references');
      console.error('Error fetching references:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleArrayInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value.split(',').map(item => item.trim()).filter(item => item)
    });
  };

  const handleBatchTypeChange = (e) => {
    const newBatchType = e.target.value;
    setFormData({
      ...formData,
      batchType: newBatchType,
      assignedBatches: [],
      assignedPlacementBatches: []
    });
  };

  const handleBatchChange = (e) => {
    const selectedBatches = Array.from(e.target.selectedOptions, option => option.value);
    
    if (formData.batchType === 'regular') {
      setFormData({ ...formData, assignedBatches: selectedBatches });
    } else if (formData.batchType === 'placement') {
      setFormData({ ...formData, assignedPlacementBatches: selectedBatches });
    } else if (formData.batchType === 'both') {
      setFormData({ ...formData, assignedBatches: selectedBatches });
    }
  };

  const addResource = () => {
    setFormData({
      ...formData,
      resources: [...formData.resources, {
        type: 'link',
        title: '',
        url: '',
        description: '',
        duration: '',
        size: ''
      }]
    });
  };

  const updateResource = (index, field, value) => {
    const newResources = [...formData.resources];
    newResources[index][field] = value;
    setFormData({ ...formData, resources: newResources });
  };

  const removeResource = (index) => {
    const newResources = formData.resources.filter((_, i) => i !== index);
    setFormData({ ...formData, resources: newResources });
  };

  const getBatchOptions = () => {
    switch (formData.batchType) {
      case 'regular':
        return batches.regular || [];
      case 'placement':
        return batches.placement || [];
      case 'both':
        return batches.all || [];
      default:
        return batches.placement || [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const url = editingId ? `/api/references/${editingId}` : '/api/references';
      const method = editingId ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form
      setFormData({
        topicName: '',
        subject: '',
        module: '',
        difficulty: 'intermediate',
        resources: [],
        referenceVideoLink: '',
        referenceNotesLink: '',
        assignedBatches: [],
        assignedPlacementBatches: [],
        batchType: 'placement',
        isPublic: true,
        accessLevel: 'public',
        learningObjectives: [],
        prerequisites: [],
        tags: []
      });

      setEditingId(null);
      setActiveTab('list');
      await fetchReferences();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reference');
      console.error('Error saving reference:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReference = async (referenceId) => {
    if (!window.confirm('Are you sure you want to archive this reference?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      await axios.delete(`/api/references/${referenceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchReferences();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reference');
      console.error('Error deleting reference:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (referenceId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`/api/references/${referenceId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAnalytics(response.data);
      setSelectedReferenceId(referenceId);
      setActiveTab('analytics');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
      case 'link': return <Link className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const renderReferenceForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <PlusCircle className="w-6 h-6 mr-2 text-blue-600" />
        {editingId ? 'Edit Reference' : 'Create New Reference'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic Name *
            </label>
            <input
              type="text"
              name="topicName"
              value={formData.topicName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter topic name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter subject"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Module
            </label>
            <input
              type="text"
              name="module"
              value={formData.module}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter module name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Access Control */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Level *
            </label>
            <select
              name="accessLevel"
              value={formData.accessLevel}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public (All Students)</option>
              <option value="batch-specific">Batch Specific</option>
            </select>
          </div>

          {formData.accessLevel === 'batch-specific' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Type
                </label>
                <select
                  name="batchType"
                  value={formData.batchType}
                  onChange={handleBatchTypeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="placement">Placement Training Batches</option>
                  <option value="regular">Regular Batches</option>
                  <option value="both">Both Types</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Batches
                </label>
                <select
                  multiple
                  onChange={handleBatchChange}
                  value={formData.batchType === 'regular' ? formData.assignedBatches : formData.assignedPlacementBatches}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                >
                  {getBatchOptions().map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} ({batch.studentCount} students)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple batches</p>
              </div>
            </>
          )}
        </div>

        {/* Legacy Links (for backward compatibility) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Video Link
            </label>
            <input
              type="url"
              name="referenceVideoLink"
              value={formData.referenceVideoLink}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter video URL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Notes Link
            </label>
            <input
              type="url"
              name="referenceNotesLink"
              value={formData.referenceNotesLink}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter notes URL"
            />
          </div>
        </div>

        {/* Multiple Resources */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Additional Resources</h3>
            <button
              type="button"
              onClick={addResource}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Resource
            </button>
          </div>

          {formData.resources.map((resource, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={resource.type}
                    onChange={(e) => updateResource(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                    <option value="presentation">Presentation</option>
                    <option value="code">Code</option>
                    <option value="image">Image</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={resource.title}
                    onChange={(e) => updateResource(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter resource title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={resource.url}
                    onChange={(e) => updateResource(index, 'url', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter resource URL"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeResource(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={resource.description}
                  onChange={(e) => updateResource(index, 'description', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter resource description"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Learning Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Learning Objectives (comma-separated)
          </label>
          <textarea
            value={formData.learningObjectives.join(', ')}
            onChange={(e) => handleArrayInputChange('learningObjectives', e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter learning objectives separated by commas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prerequisites (comma-separated)
          </label>
          <textarea
            value={formData.prerequisites.join(', ')}
            onChange={(e) => handleArrayInputChange('prerequisites', e.target.value)}
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter prerequisites separated by commas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleArrayInputChange('tags', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter tags separated by commas"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              setEditingId(null);
              setFormData({
                topicName: '',
                subject: '',
                module: '',
                difficulty: 'intermediate',
                resources: [],
                referenceVideoLink: '',
                referenceNotesLink: '',
                assignedBatches: [],
                assignedPlacementBatches: [],
                batchType: 'placement',
                isPublic: true,
                accessLevel: 'public',
                learningObjectives: [],
                prerequisites: [],
                tags: []
              });
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingId ? 'Update Reference' : 'Create Reference'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderReferenceList = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
          My References
        </h2>
        <button
          onClick={() => setActiveTab('create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Reference
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading references...</p>
        </div>
      ) : references.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No references found</p>
          <p className="text-gray-400">Create your first reference to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {references.map((reference) => (
            <div key={reference._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg text-gray-900">{reference.topicName}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchAnalytics(reference._id)}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="View Analytics"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteReference(reference._id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete Reference"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Subject:</strong> {reference.subject}</p>
                {reference.module && <p><strong>Module:</strong> {reference.module}</p>}
                <p><strong>Difficulty:</strong> {reference.difficulty.charAt(0).toUpperCase() + reference.difficulty.slice(1)}</p>
                <p><strong>Access:</strong> {reference.accessLevel === 'public' ? 'Public' : 'Batch Specific'}</p>
                
                {/* Resource Count */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{reference.resourceCount || 0} resources</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{reference.viewCount || 0} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{reference.averageRating || 0}</span>
                  </div>
                </div>

                {/* Batch Information */}
                {reference.accessLevel === 'batch-specific' && (
                  <div className="mt-3">
                    <strong>Assigned to:</strong>
                    <div className="mt-1">
                      {reference.assignedBatches?.length > 0 && (
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mr-1 mb-1">
                          Regular: {reference.assignedBatches.map(b => b.name).join(', ')}
                        </div>
                      )}
                      {reference.assignedPlacementBatches?.length > 0 && (
                        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block mr-1 mb-1">
                          Placement: {reference.assignedPlacementBatches.map(b => `${b.batchNumber} - ${b.techStack}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {reference.tags && reference.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {reference.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {reference.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{reference.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Created: {new Date(reference.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Eye className="w-6 h-6 mr-2 text-blue-600" />
          Reference Analytics
        </h2>
        <button
          onClick={() => {
            setActiveTab('list');
            setAnalytics(null);
            setSelectedReferenceId(null);
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>

      {analytics && (
        <div className="space-y-8">
          {/* View Stats */}
          <div>
            <h3 className="text-lg font-semibold mb-4">View Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{analytics.viewStats.totalViews}</p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{analytics.viewStats.uniqueViewers}</p>
                <p className="text-sm text-gray-600">Unique Viewers</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{analytics.ratingStats.averageRating}</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          {analytics.ratingStats.totalRatings > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
              <div className="grid grid-cols-5 gap-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="text-center">
                    <div className="bg-yellow-100 p-2 rounded">
                      <Star className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                      <p className="text-lg font-bold">{analytics.ratingStats.ratingDistribution[rating]}</p>
                      <p className="text-xs text-gray-600">{rating} Star{rating !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Views */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Views</h3>
              <div className="space-y-3">
                {analytics.viewStats.recentViews.map((view, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{view.studentId.name}</p>
                      <p className="text-sm text-gray-600">{view.studentId.rollNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(view.viewedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Ratings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Ratings</h3>
              <div className="space-y-3">
                {analytics.ratingStats.recentRatings.map((rating, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{rating.student.name}</p>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span>{rating.rating}</span>
                      </div>
                    </div>
                    {rating.feedback && (
                      <p className="text-sm text-gray-600">{rating.feedback}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(rating.ratedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        {['list', 'create', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'list' && renderReferenceList()}
      {activeTab === 'create' && renderReferenceForm()}
      {activeTab === 'analytics' && renderAnalytics()}
    </div>
  );
};

export default Reference;