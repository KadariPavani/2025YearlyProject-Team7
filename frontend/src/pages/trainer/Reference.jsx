import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Trash2, Edit, PlusCircle, BookOpen, Eye, Star, Users, 
  Link, Video, File, GraduationCap, Download, Calendar, Tag, Award,
  Search, X
} from 'lucide-react';

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
    referenceVideoLink: '',
    referenceNotesLink: '',
    assignedBatches: [],
    assignedPlacementBatches: [],
    batchType: 'placement',
    isPublic: true,
    accessLevel: 'public',
    learningObjectives: [],
    prerequisites: [],
    tags: [],
    existingFiles: [] // To store files from DB
  });
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [selectedReferenceId, setSelectedReferenceId] = useState(null);
  const [newFileInputs, setNewFileInputs] = useState([]); // Newly selected files
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterAccessLevel, setFilterAccessLevel] = useState('all');

  useEffect(() => {
    fetchReferences();
    if (availableBatches) {
      setBatches(availableBatches);
    } else {
      fetchBatches();
    }
  }, [availableBatches]);

  useEffect(() => {
    filterReferences();
  }, [references, searchTerm, filterSubject, filterAccessLevel]);

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

      const refs = Array.isArray(response.data.references) ? response.data.references : [];
      setReferences(refs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch references');
      console.error('Error fetching references:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterReferences = () => {
    let filtered = [...references];

    if (searchTerm) {
      filtered = filtered.filter(ref =>
        (ref.topicName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (ref.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (ref.tags && ref.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    if (filterSubject) {
      filtered = filtered.filter(ref => ref.subject === filterSubject);
    }

    if (filterAccessLevel !== 'all') {
      filtered = filtered.filter(ref => ref.accessLevel === filterAccessLevel);
    }

    return filtered;
  };

  const filteredReferences = filterReferences();

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

  const handleNewFileChange = (e) => {
    setNewFileInputs(Array.from(e.target.files));
  };

  const removeNewFile = (index) => {
    setNewFileInputs(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      existingFiles: prev.existingFiles.filter(f => f._id !== fileId)
    }));
  };

  const getBatchOptions = () => {
    switch (formData.batchType) {
      case 'regular': return batches.regular || [];
      case 'placement': return batches.placement || [];
      case 'both': return batches.all || [];
      default: return batches.placement || [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const form = new FormData();
      form.append('topicName', formData.topicName);
      form.append('subject', formData.subject);
      form.append('referenceVideoLink', formData.referenceVideoLink);
      form.append('referenceNotesLink', formData.referenceNotesLink);
      form.append('batchType', formData.batchType);
      form.append('isPublic', formData.isPublic);
      form.append('accessLevel', formData.accessLevel);
      form.append('learningObjectives', JSON.stringify(formData.learningObjectives));
      form.append('prerequisites', JSON.stringify(formData.prerequisites));
      form.append('tags', JSON.stringify(formData.tags));
      form.append('assignedBatches', JSON.stringify(formData.assignedBatches));
      form.append('assignedPlacementBatches', JSON.stringify(formData.assignedPlacementBatches));
      form.append('existingFiles', JSON.stringify(formData.existingFiles.map(f => f._id)));

      newFileInputs.forEach(f => form.append('files', f));

      const url = editingId ? `/api/references/${editingId}` : '/api/references';
      const method = editingId ? 'put' : 'post';

      await axios[method](url, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      resetForm();
      await fetchReferences();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reference');
      console.error('Error saving reference:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      topicName: '',
      subject: '',
      referenceVideoLink: '',
      referenceNotesLink: '',
      assignedBatches: [],
      assignedPlacementBatches: [],
      batchType: 'placement',
      isPublic: true,
      accessLevel: 'public',
      learningObjectives: [],
      prerequisites: [],
      tags: [],
      existingFiles: []
    });
    setNewFileInputs([]);
    setEditingId(null);
    setActiveTab('list');
  };

  const startEdit = (ref) => {
    setFormData({
      topicName: ref.topicName || '',
      subject: ref.subject || '',
      referenceVideoLink: ref.referenceVideoLink || '',
      referenceNotesLink: ref.referenceNotesLink || '',
      assignedBatches: ref.assignedBatches?.map(b => b._id || b) || [],
      assignedPlacementBatches: ref.assignedPlacementBatches?.map(b => b._id || b) || [],
      batchType: ref.batchType || 'placement',
      isPublic: ref.isPublic ?? true,
      accessLevel: ref.accessLevel || 'public',
      learningObjectives: ref.learningObjectives || [],
      prerequisites: ref.prerequisites || [],
      tags: ref.tags || [],
      existingFiles: ref.files || []
    });
    setNewFileInputs([]);
    setEditingId(ref._id);
    setActiveTab('create');
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
    } finally {
      setLoading(false);
    }
  };

  // const fetchAnalytics = async (referenceId) => {
  //   try {
  //     setLoading(true);
  //     const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
  //     if (!token) throw new Error('No trainer token found');

  //     const response = await axios.get(`/api/references/${referenceId}/analytics`, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });

  //     setAnalytics(response.data);
  //     setSelectedReferenceId(referenceId);
  //     setActiveTab('analytics');
  //   } catch (err) {
  //     setError(err.response?.data?.message || 'Failed to fetch analytics');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const getResourceIcon = (resource) => {
    if (resource.files && resource.files.length > 0) {
      const file = resource.files[0];
      if (file.mimetype?.includes('pdf')) return <FileText className="w-5 h-5" />;
      if (file.mimetype?.includes('document')) return <File className="w-5 h-5" />;
      return <File className="w-5 h-5" />;
    }
    if (resource.referenceVideoLink) return <Video className="w-5 h-5" />;
    if (resource.referenceNotesLink) return <Link className="w-5 h-5" />;
    return <BookOpen className="w-5 h-5" />;
  };

  const getUniqueSubjects = () => {
    const subjects = [...new Set(references.map(r => r.subject).filter(Boolean))];
    return subjects.sort();
  };

  const renderStars = (count) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading && activeTab === 'list') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading references...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            My Learning References
          </h1>
          <p className="text-gray-600 mt-2">
            Create, manage, and track resources shared with your students
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {['list', 'create'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'list' ? 'All References' : editingId ? 'Edit Reference' : 'Create New'}
              {/* {tab === 'list' ? 'All References' : tab === 'create' ? (editingId ? 'Edit Reference' : 'Create New') : 'Analytics'} */}
            </button>
          ))}
        </div>

        {/* List View */}
        {activeTab === 'list' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by topic, subject, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Subjects</option>
                    {getUniqueSubjects().map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={filterAccessLevel}
                    onChange={(e) => setFilterAccessLevel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Access</option>
                    <option value="public">Public</option>
                    <option value="batch-specific">Batch Specific</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredReferences.length} of {references.length} references
              </div>
            </div>

            {/* Grid */}
            {filteredReferences.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No References Found</h3>
                <p className="text-gray-500">
                  {references.length === 0
                    ? "You haven't created any references yet."
                    : "No references match your current filters."}
                </p>
                {references.length === 0 && (
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Create Your First Reference
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReferences.map(resource => (
                  <div
                    key={resource._id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            {getResourceIcon(resource)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                              {resource.topicName}
                            </h3>
                            <p className="text-sm text-gray-600">{resource.subject}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(resource); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteReference(resource._id); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {/* <button
                            onClick={(e) => { e.stopPropagation(); fetchAnalytics(resource._id); }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Analytics"
                          >
                            <Eye className="w-4 h-4" />
                          </button> */}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{resource.viewCount || 0} views</span>
                        </div>
                        {resource.averageRating > 0 && (
                          <div className="flex items-center gap-1">
                            {renderStars(Math.round(resource.averageRating))}
                            <span>{resource.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {resource.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          resource.accessLevel === 'public'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {resource.accessLevel === 'public' ? 'Public' : 'Batch Specific'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(resource.files?.length || 0) +
                            (resource.referenceVideoLink ? 1 : 0) +
                            (resource.referenceNotesLink ? 1 : 0)} file(s)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create/Edit Form */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <PlusCircle className="w-7 h-7 text-blue-600" />
              {editingId ? 'Edit Reference' : 'Create New Reference'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic Name *</label>
                  <input
                    type="text"
                    name="topicName"
                    value={formData.topicName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., React Hooks Deep Dive"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., React.js"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch Type</label>
                  <select
                    name="batchType"
                    value={formData.batchType}
                    onChange={handleBatchTypeChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="placement">Placement Training</option>
                    <option value="regular">Regular Batches</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Level *</label>
                  <select
                    name="accessLevel"
                    value={formData.accessLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">Public (All Students)</option>
                    <option value="batch-specific">Batch Specific</option>
                  </select>
                </div>
              </div>

              {formData.accessLevel === 'batch-specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Batches (Hold Ctrl/Cmd for multiple)
                  </label>
                  <select
                    multiple
                    value={formData.batchType === 'regular' ? formData.assignedBatches : formData.assignedPlacementBatches}
                    onChange={handleBatchChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  >
                    {getBatchOptions().map(batch => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name || `${batch.batchNumber} - ${batch.techStack}`} ({batch.studentCount || 0} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video Link</label>
                  <input
                    type="url"
                    name="referenceVideoLink"
                    value={formData.referenceVideoLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes Link</label>
                  <input
                    type="url"
                    name="referenceNotesLink"
                    value={formData.referenceNotesLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              {/* Existing Files (on edit) */}
              {editingId && formData.existingFiles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Files
                  </label>
                  <div className="space-y-2">
                    {formData.existingFiles.map((file) => (
                      <div
                        key={file._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 flex-1 hover:text-blue-700"
                        >
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{file.filename}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </a>
                        <button
                          type="button"
                          onClick={() => removeExistingFile(file._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New File Upload */}
              <div>
                <label className=" Security block text-sm font-medium text-gray-700 mb-2">
                  Add New Files (PDF, DOC, DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleNewFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {newFileInputs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {newFileInputs.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-600">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewFile(idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives (comma-separated)</label>
                <textarea
                  value={formData.learningObjectives.join(', ')}
                  onChange={(e) => handleArrayInputChange('learningObjectives', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Understand useState, Master useEffect"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prerequisites (comma-separated)</label>
                <textarea
                  value={formData.prerequisites.join(', ')}
                  onChange={(e) => handleArrayInputChange('prerequisites', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JavaScript ES6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleArrayInputChange('tags', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., react, hooks"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Reference' : 'Create Reference'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Analytics View */}
        {/* {activeTab === 'analytics' && analytics && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Eye className="w-7 h-7 text-green-600" />
                Resource Analytics
              </h2>
              <button
                onClick={() => {
                  setActiveTab('list');
                  setAnalytics(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back to List
              </button>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <Eye className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-blue-600">{analytics.viewStats.totalViews}</p>
                  <p className="text-sm text-gray-600">Total Views</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <Users className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-green-600">{analytics.viewStats.uniqueViewers}</p>
                  <p className="text-sm text-gray-600">Unique Students</p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg text-center">
                  <Star className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-yellow-600">{analytics.ratingStats.averageRating}</p>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>
              </div>

              {analytics.ratingStats.totalRatings > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {[5, 4, 3, 2, 1].map(r => (
                      <div key={r} className="text-center p-3 bg-gray-50 rounded-lg">
                        {renderStars(r)}
                        <p className="mt-1 font-medium">{analytics.ratingStats.ratingDistribution[r]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Views</h3>
                  <div className="space-y-3">
                    {analytics.viewStats.recentViews.map((v, i) => (
                      <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{v.studentId.name}</p>
                          <p className="text-sm text-gray-600">{v.studentId.rollNo}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(v.viewedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Ratings</h3>
                  <div className="space-y-3">
                    {analytics.ratingStats.recentRatings.map((r, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium">{r.student.name}</p>
                          <div className="flex items-center gap-1">
                            {renderStars(r.rating)}
                          </div>
                        </div>
                        {r.feedback && <p className="text-sm text-gray-600 italic">"{r.feedback}"</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(r.ratedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Reference;