// Updated Trainer Assignment.jsx - Enhanced with placement training batch support
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Trash2, Edit, FileText, Users, Calendar, Clock, Upload, Download } from 'lucide-react';

const Assignment = ({ availableBatches }) => {
  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState({
    regular: [],
    placement: [],
    all: []
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    totalMarks: '',
    assignedBatches: [],
    assignedPlacementBatches: [],
    batchType: 'placement', // Default to placement batches
    attachmentLink: '',
    instructions: '',
    allowLateSubmission: true,
    lateSubmissionPenalty: 0,
    maxAttempts: 1,
    rubric: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchAssignments();
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

      const response = await axios.get('/api/assignments/batches', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBatches(response.data || { regular: [], placement: [], all: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batches');
      console.error('Error fetching batches:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignments');
      console.error('Error fetching assignments:', err);
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

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const addRubricCriteria = () => {
    setFormData({
      ...formData,
      rubric: [...formData.rubric, { criteria: '', maxPoints: '', description: '' }]
    });
  };

  const updateRubricCriteria = (index, field, value) => {
    const newRubric = [...formData.rubric];
    newRubric[index][field] = value;
    setFormData({ ...formData, rubric: newRubric });
  };

  const removeRubricCriteria = (index) => {
    const newRubric = formData.rubric.filter((_, i) => i !== index);
    setFormData({ ...formData, rubric: newRubric });
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

      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (key === 'rubric') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (Array.isArray(formData[key])) {
          formData[key].forEach(value => {
            formDataToSend.append(key, value);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append files
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const url = editingId ? `/api/assignments/${editingId}` : '/api/assignments';
      const method = editingId ? 'put' : 'post';

      await axios[method](url, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        subject: '',
        dueDate: '',
        totalMarks: '',
        assignedBatches: [],
        assignedPlacementBatches: [],
        batchType: 'placement',
        attachmentLink: '',
        instructions: '',
        allowLateSubmission: true,
        lateSubmissionPenalty: 0,
        maxAttempts: 1,
        rubric: []
      });
      setSelectedFiles([]);
      setEditingId(null);
      setActiveTab('list');
      await fetchAssignments();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assignment');
      console.error('Error saving assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      await axios.delete(`/api/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete assignment');
      console.error('Error deleting assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`/api/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubmissions(response.data.submissions || []);
      setSelectedAssignment(response.data.assignment);
      setShowSubmissions(true);
      setActiveTab('submissions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const gradeSubmission = async (assignmentId, submissionId, score, remarks, feedback) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      if (!token) throw new Error('No trainer token found');

      await axios.put(`/api/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
        score,
        remarks,
        feedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh submissions
      await fetchSubmissions(assignmentId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to grade submission');
      console.error('Error grading submission:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderAssignmentForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <PlusCircle className="w-6 h-6 mr-2 text-blue-600" />
        {editingId ? 'Edit Assignment' : 'Create New Assignment'}
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
              Assignment Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter assignment title"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter assignment description"
          />
        </div>

        {/* Assignment Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Marks *
            </label>
            <input
              type="number"
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter total marks"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Attempts
            </label>
            <input
              type="number"
              name="maxAttempts"
              value={formData.maxAttempts}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Batch Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch Type *
            </label>
            <select
              name="batchType"
              value={formData.batchType}
              onChange={handleBatchTypeChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="placement">Placement Training Batches</option>
              <option value="regular">Regular Batches</option>
              <option value="both">Both Types</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Batches *
            </label>
            <select
              multiple
              onChange={handleBatchChange}
              value={formData.batchType === 'regular' ? formData.assignedBatches : formData.assignedPlacementBatches}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            >
              {getBatchOptions().map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} ({batch.studentCount} students)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple batches</p>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachment Link (Optional)
          </label>
          <input
            type="url"
            name="attachmentLink"
            value={formData.attachmentLink}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter attachment URL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Attachments (Optional)
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum 5 files, 10MB each. Allowed: PDF, DOC, DOCX, TXT, ZIP, RAR, Images
          </p>
          {selectedFiles.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Selected Files:</p>
              <ul className="text-sm text-gray-600">
                {selectedFiles.map((file, index) => (
                  <li key={index}>• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter detailed instructions for the assignment"
          />
        </div>

        {/* Assignment Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="allowLateSubmission"
              checked={formData.allowLateSubmission}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Allow Late Submission
            </label>
          </div>

          {formData.allowLateSubmission && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Late Submission Penalty (%)
              </label>
              <input
                type="number"
                name="lateSubmissionPenalty"
                value={formData.lateSubmissionPenalty}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Grading Rubric */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Grading Rubric (Optional)</h3>
            <button
              type="button"
              onClick={addRubricCriteria}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Criteria
            </button>
          </div>

          {formData.rubric.map((criterion, index) => (
            <div key={index} className="mb-3 p-3 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Criteria"
                    value={criterion.criteria}
                    onChange={(e) => updateRubricCriteria(index, 'criteria', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max Points"
                    value={criterion.maxPoints}
                    onChange={(e) => updateRubricCriteria(index, 'maxPoints', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={criterion.description}
                    onChange={(e) => updateRubricCriteria(index, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeRubricCriteria(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              setEditingId(null);
              setFormData({
                title: '',
                description: '',
                subject: '',
                dueDate: '',
                totalMarks: '',
                assignedBatches: [],
                assignedPlacementBatches: [],
                batchType: 'placement',
                attachmentLink: '',
                instructions: '',
                allowLateSubmission: true,
                lateSubmissionPenalty: 0,
                maxAttempts: 1,
                rubric: []
              });
              setSelectedFiles([]);
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
            {loading ? 'Saving...' : editingId ? 'Update Assignment' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderAssignmentList = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          My Assignments
        </h2>
        <button
          onClick={() => setActiveTab('create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Assignment
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
          <p className="mt-2 text-gray-600">Loading assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No assignments found</p>
          <p className="text-gray-400">Create your first assignment to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg text-gray-900">{assignment.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchSubmissions(assignment._id)}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="View Submissions"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAssignment(assignment._id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Subject:</strong> {assignment.subject}</p>
                <p><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleDateString()} at {new Date(assignment.dueDate).toLocaleTimeString()}</p>
                <p><strong>Total Marks:</strong> {assignment.totalMarks}</p>
                <p><strong>Max Attempts:</strong> {assignment.maxAttempts}</p>
                
                {/* Due date indicator */}
                <div className="mt-3">
                  {new Date(assignment.dueDate) > new Date() ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Overdue
                    </span>
                  )}
                </div>

                {/* Batch Information */}
                <div className="mt-3">
                  <strong>Assigned to:</strong>
                  <div className="mt-1">
                    {assignment.assignedBatches?.length > 0 && (
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mr-1 mb-1">
                        Regular: {assignment.assignedBatches.map(b => b.name).join(', ')}
                      </div>
                    )}
                    {assignment.assignedPlacementBatches?.length > 0 && (
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block mr-1 mb-1">
                        Placement: {assignment.assignedPlacementBatches.map(b => `${b.batchNumber} - ${b.techStack}`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                {assignment.attachments?.length > 0 && (
                  <div className="mt-2">
                    <strong>Attachments:</strong> {assignment.attachments.length} file(s)
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Created: {new Date(assignment.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSubmissions = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-600" />
          Assignment Submissions
        </h2>
        <button
          onClick={() => {
            setActiveTab('list');
            setShowSubmissions(false);
            setSelectedAssignment(null);
            setSubmissions([]);
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>

      {selectedAssignment && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg">{selectedAssignment.title}</h3>
          <p className="text-sm text-gray-600">
            Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()} • 
            Total Marks: {selectedAssignment.totalMarks}
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No submissions found</p>
          <p className="text-gray-400">Students haven't submitted yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr key={submission._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {submission.student?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.student?.rollNo} • {submission.student?.college}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {submission.submissionFiles?.length || 0} files
                    </div>
                    {submission.submissionLink && (
                      <a 
                        href={submission.submissionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Link
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.score !== undefined ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {submission.score} / {selectedAssignment?.totalMarks}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.percentage?.toFixed(1)}% • Grade: {submission.grade}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not graded</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      submission.isLate 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {submission.isLate ? 'Late' : 'On Time'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        const score = prompt('Enter score:', submission.score || '');
                        const remarks = prompt('Enter remarks:', submission.remarks || '');
                        const feedback = prompt('Enter feedback:', submission.feedback || '');
                        
                        if (score !== null) {
                          gradeSubmission(selectedAssignment._id, submission._id, parseInt(score), remarks, feedback);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {submission.score !== undefined ? 'Update Grade' : 'Grade'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        {['list', 'create', 'submissions'].map((tab) => (
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
      {activeTab === 'list' && renderAssignmentList()}
      {activeTab === 'create' && renderAssignmentForm()}
      {activeTab === 'submissions' && renderSubmissions()}
    </div>
  );
};

export default Assignment;