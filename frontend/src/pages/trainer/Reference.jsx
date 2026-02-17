import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import {
  FileText, Trash2, Edit, PlusCircle, BookOpen, Eye, Star, Users, 
  Link, Video, File, GraduationCap, Download, Calendar, Tag, Award,
  Search, X, ChevronDown, ChevronUp, ChevronLeft
} from 'lucide-react';

const Reference = () => {
  const [references, setReferences] = useState([]);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    topicName: '',
    subject: '',
    referenceVideoLink: '',
    referenceNotesLink: '',
    assignedPlacementBatches: [],
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
  const [expandedCards, setExpandedCards] = useState({}); // Track expanded cards

  useEffect(() => {
    fetchReferences();
    fetchBatches();
  }, []);

  useEffect(() => {
    filterReferences();
  }, [references, searchTerm, filterSubject, filterAccessLevel]);

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/references/batches`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBatches(response.data || []);
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

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/references`, {
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

  const handleToggleBatch = (batchId) => {
    setFormData(prev => ({
      ...prev,
      assignedPlacementBatches: prev.assignedPlacementBatches.includes(batchId)
        ? prev.assignedPlacementBatches.filter(id => id !== batchId)
        : [...prev.assignedPlacementBatches, batchId]
    }));
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
      form.append('batchType', 'placement');
      form.append('isPublic', formData.isPublic);
      form.append('accessLevel', formData.accessLevel);
      form.append('learningObjectives', JSON.stringify(formData.learningObjectives));
      form.append('prerequisites', JSON.stringify(formData.prerequisites));
      form.append('tags', JSON.stringify(formData.tags));
      form.append('assignedBatches', JSON.stringify([]));
      form.append('assignedPlacementBatches', JSON.stringify(formData.assignedPlacementBatches));
      
      // Handle existing files for edit mode
      if (editingId) {
        form.append('existingFiles', JSON.stringify(formData.existingFiles.map(f => f._id)));
      }

      // Add new files
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
      assignedPlacementBatches: [],
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
      assignedPlacementBatches: ref.assignedPlacementBatches?.map(b => b._id || b) || [],
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
      if (file.mimetype?.includes('pdf')) return <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />;
      if (file.mimetype?.includes('document')) return <File className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />;
      return <File className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />;
    }
    if (resource.referenceVideoLink) return <Video className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />;
    if (resource.referenceNotesLink) return <Link className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />;
    return <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />;
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

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading && activeTab === 'list') {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Shared Header */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
                {activeTab === 'create' ? (editingId ? 'Edit Reference' : 'Create Reference') : 'References'}
              </h2>
              <p className="text-xs text-gray-500">{references.length} references created</p>
            </div>
          </div>
          {activeTab === 'list' ? (
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create Reference</span>
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

        {/* List View */}
        {activeTab === 'list' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
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
              <div className="mt-3 text-xs text-gray-500">
                Showing {filteredReferences.length} of {references.length} references
              </div>
            </div>

            {/* Grid - Updated to expandable cards like student dashboard */}
            {filteredReferences.length === 0 ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
                <BookOpen className="w-10 h-10 sm:w-14 sm:h-14 text-gray-300 mx-auto mb-4" />
                <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-2">No References Found</h3>
                <p className="text-gray-500">
                  {references.length === 0
                    ? "You haven't created any references yet."
                    : "No references match your current filters."}
                </p>
                {references.length === 0 && (
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    Create Your First Reference
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-blue-50">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Topic</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Access</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Resources</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Created</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredReferences.map((resource, idx) => {
                        const isExpanded = expandedCards[resource._id];
                        const resourceCount = (resource.files?.length || 0) + (resource.referenceVideoLink ? 1 : 0) + (resource.referenceNotesLink ? 1 : 0);
                        return (
                          <React.Fragment key={resource._id}>
                            <tr className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">{resource.topicName}</div>
                                {resource.tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {resource.tags.slice(0, 3).map((tag, i) => (
                                      <span key={i} className="text-[10px] text-gray-500">#{tag}</span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{resource.subject}</td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                  resource.accessLevel === 'public' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {resource.accessLevel === 'public' ? 'Public' : 'Batch'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{resourceCount}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{new Date(resource.createdAt).toLocaleDateString()}</td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => toggleExpand(resource._id)}
                                    className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${isExpanded ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                  >
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    <span className="hidden sm:inline">{isExpanded ? 'Less' : 'More'}</span>
                                  </button>
                                  <button
                                    onClick={() => startEdit(resource)}
                                    className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
                                  >
                                    <Edit className="h-3 w-3" /><span className="hidden sm:inline">Edit</span>
                                  </button>
                                  <button
                                    onClick={() => deleteReference(resource._id)}
                                    className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"
                                  >
                                    <Trash2 className="h-3 w-3" /><span className="hidden sm:inline">Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                  <div className="space-y-3">
                                    {resource.learningObjectives?.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-semibold text-gray-700 mb-1">Learning Objectives</h4>
                                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                                          {resource.learningObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                    {resource.prerequisites?.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-semibold text-gray-700 mb-1">Prerequisites</h4>
                                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                                          {resource.prerequisites.map((pr, i) => <li key={i}>{pr}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                      {resource.files?.map((file, i) => (
                                        <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-blue-600 hover:bg-blue-50">
                                          <FileText className="w-3 h-3" />{file.filename}
                                        </a>
                                      ))}
                                      {resource.referenceVideoLink && (
                                        <a href={resource.referenceVideoLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-600 hover:bg-blue-50">
                                          <Video className="w-3 h-3" />Video
                                        </a>
                                      )}
                                      {resource.referenceNotesLink && (
                                        <a href={resource.referenceNotesLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-green-200 rounded text-xs text-green-600 hover:bg-green-50">
                                          <Link className="w-3 h-3" />Notes
                                        </a>
                                      )}
                                    </div>
                                    {resource.accessLevel === 'batch-specific' && resource.assignedPlacementBatches?.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {resource.assignedPlacementBatches.map(b => (
                                          <span key={b._id || b.batchNumber} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">{b.batchNumber}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Topic Name *</label>
                    <input
                      type="text"
                      name="topicName"
                      value={formData.topicName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., React Hooks Deep Dive"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., React.js"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Access Level *</label>
                  <select
                    name="accessLevel"
                    value={formData.accessLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">Public (All Students)</option>
                    <option value="batch-specific">Batch Specific</option>
                  </select>
                </div>
                {formData.accessLevel === 'batch-specific' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Select Batches</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md bg-white">
                      {batches.map(batch => {
                        const id = batch._id;
                        const checked = formData.assignedPlacementBatches.includes(id);
                        return (
                          <label key={id} className="flex items-center gap-3 text-xs sm:text-sm">
                            <input type="checkbox" checked={checked} onChange={() => handleToggleBatch(id)} className="w-4 h-4" />
                            <span>{batch.batchNumber} - {batch.techStack} ({batch.studentCount || 0} students)</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Click checkboxes to select multiple &bull; {formData.assignedPlacementBatches.length} selected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Resources */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Resources</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Video Link</label>
                    <input
                      type="url"
                      name="referenceVideoLink"
                      value={formData.referenceVideoLink}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes Link</label>
                    <input
                      type="url"
                      name="referenceNotesLink"
                      value={formData.referenceNotesLink}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
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
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
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
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
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
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Section: Additional Details */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Additional Details</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Learning Objectives (comma-separated)</label>
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
                {loading ? 'Saving...' : editingId ? 'Update Reference' : 'Create Reference'}
              </button>
            </div>
          </form>
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
  );
};

export default Reference;