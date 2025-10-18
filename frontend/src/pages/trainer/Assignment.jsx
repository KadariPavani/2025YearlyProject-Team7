import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Upload, Trash2 } from 'lucide-react';

const Assignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState({ regular: [], placement: [], all: [] });
  const [subject, setSubject] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    totalMarks: '',
    assignedBatches: [],
    assignedPlacementBatches: [],
    batchType: 'placement',
    instructions: '',
    allowLateSubmission: false,
    lateSubmissionPenalty: 0,
    maxAttempts: 1,
    rubric: [],
    files: []
  });
  const [activeTab, setActiveTab] = useState('list');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchBatches();
    fetchSubject();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
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

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get('/api/assignments/batches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(response.data || { regular: [], placement: [], all: [] });
      console.log('Fetched batches:', response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batches');
      console.error('Error fetching batches:', err);
    }
  };

  const fetchSubject = async () => {
    try {
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get('/api/assignments/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedSubject = Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : '';
      setSubject(fetchedSubject);
      setFormData(prev => ({ ...prev, subject: fetchedSubject }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subject');
      console.error('Error fetching subject:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter(file => {
      const isValidType = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
      ].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) setError(`Invalid file type for ${file.name}`);
      if (!isValidSize) setError(`File ${file.name} exceeds 10MB limit`);
      return isValidType && isValidSize;
    });
    setFormData(prev => ({ ...prev, files }));
    console.log('Selected files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
  };

  const handleBatchTypeChange = (e) => {
    const newBatchType = e.target.value;
    setFormData(prev => ({
      ...prev,
      batchType: newBatchType,
      assignedBatches: [],
      assignedPlacementBatches: []
    }));
  };

  const handleBatchChange = (e) => {
    const selectedBatches = Array.from(e.target.selectedOptions, option => option.value);
    if (formData.batchType === 'regular') {
      setFormData(prev => ({ ...prev, assignedBatches: selectedBatches }));
    } else if (formData.batchType === 'placement') {
      setFormData(prev => ({ ...prev, assignedPlacementBatches: selectedBatches }));
    } else if (formData.batchType === 'both') {
      setFormData(prev => ({
        ...prev,
        assignedBatches: selectedBatches,
        assignedPlacementBatches: selectedBatches
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      setError('');
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const hasFiles = formData.files.length > 0;
      let response;

      if (hasFiles) {
        // Send multipart/form-data request with files
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('subject', formData.subject);
        formDataToSend.append('dueDate', formData.dueDate);
        formDataToSend.append('totalMarks', formData.totalMarks);
        formDataToSend.append('batchType', formData.batchType);
        formDataToSend.append('instructions', formData.instructions);
        formDataToSend.append('allowLateSubmission', formData.allowLateSubmission);
        formDataToSend.append('lateSubmissionPenalty', formData.lateSubmissionPenalty);
        formDataToSend.append('maxAttempts', formData.maxAttempts);
        formDataToSend.append('rubric', JSON.stringify(formData.rubric));
        formDataToSend.append('assignedBatches', JSON.stringify(formData.assignedBatches));
        formDataToSend.append('assignedPlacementBatches', JSON.stringify(formData.assignedPlacementBatches));

        formData.files.forEach(file => {
          formDataToSend.append('files', file);
        });

        console.log('Submitting formData for assignment creation:');
        for (let [key, value] of formDataToSend.entries()) {
          console.log(`FormData entry: ${key}=${value.name || value}`);
        }

        response = await axios.post('/api/assignments', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Send JSON request without files
        const data = {
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          dueDate: formData.dueDate,
          totalMarks: formData.totalMarks,
          batchType: formData.batchType,
          assignedBatches: formData.assignedBatches,
          assignedPlacementBatches: formData.assignedPlacementBatches,
          instructions: formData.instructions,
          allowLateSubmission: formData.allowLateSubmission,
          lateSubmissionPenalty: formData.lateSubmissionPenalty,
          maxAttempts: formData.maxAttempts,
          rubric: formData.rubric
        };

        console.log('Submitting JSON for assignment creation:', data);

        response = await axios.post('/api/assignments', data, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      setFormData({
        title: '',
        description: '',
        subject: subject,
        dueDate: '',
        totalMarks: '',
        assignedBatches: [],
        assignedPlacementBatches: [],
        batchType: 'placement',
        instructions: '',
        allowLateSubmission: false,
        lateSubmissionPenalty: 0,
        maxAttempts: 1,
        rubric: [],
        files: []
      });
      setActiveTab('list');
      await fetchAssignments();
      console.log('Assignment created:', response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assignment');
      console.error('Error creating assignment:', err);
    } finally {
      setUploading(false);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
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

  const getBatchOptions = () => {
    switch (formData.batchType) {
      case 'regular':
        return batches.regular || [];
      case 'placement':
        return batches.placement || [];
      case 'both':
        return batches.all || [];
      default:
        return [];
    }
  };

  const renderAssignmentForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-blue-600" />
        Create New Assignment
      </h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
            <input
              type="number"
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Type *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batches *</label>
            <select
              multiple
              onChange={handleBatchChange}
              value={formData.batchType === 'regular' ? formData.assignedBatches : formData.assignedPlacementBatches}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              disabled={loading || getBatchOptions().length === 0}
            >
              {loading ? (
                <option disabled>Loading batches...</option>
              ) : getBatchOptions().length > 0 ? (
                getBatchOptions().map(batch => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name} ({batch.studentCount || 0} students)
                  </option>
                ))
              ) : (
                <option disabled>No batches available</option>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple batches</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
          <input
            type="file"
            multiple
            accept=".jpg,.png,.pdf,.doc,.docx,.txt,.zip,.rar"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderAssignmentList = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-blue-600" />
        My Assignments
      </h2>
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
                <button
                  onClick={() => deleteAssignment(assignment._id)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Delete Assignment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Subject:</strong> {assignment.subject}</p>
                <p><strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
                <p><strong>Marks:</strong> {assignment.totalMarks}</p>
                <p><strong>Assigned to:</strong></p>
                <div className="mt-1">
                  {assignment.assignedBatches?.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                      Regular: {assignment.assignedBatches.map(b => b.name).join(', ')}
                    </span>
                  )}
                  {assignment.assignedPlacementBatches?.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Placement: {assignment.assignedPlacementBatches.map(b => `${b.batchNumber} - ${b.techStack}`).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        {['list', 'create'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      {activeTab === 'list' && renderAssignmentList()}
      {activeTab === 'create' && renderAssignmentForm()}
    </div>
  );
};

export default Assignment;