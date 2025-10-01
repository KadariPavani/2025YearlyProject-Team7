// src/components/trainer/Assignment.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Trash2, Edit } from 'lucide-react';

const Assignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    totalMarks: '',
    assignedBatches: [],
    attachmentLink: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
    fetchAssignments();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      const response = await axios.get('/api/assignments/batches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched batches:', response.data); // Debug log
      setBatches(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batches');
      console.error('Error fetching batches:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      const response = await axios.get('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched assignments:', response.data); // Debug log
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignments');
      console.error('Error fetching assignments:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBatchChange = (e) => {
    const selectedBatches = Array.from(e.target.selectedOptions, option => option.value);
    console.log('Selected batches:', selectedBatches); // Debug log
    setFormData({ ...formData, assignedBatches: selectedBatches });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const payload = {
        ...formData,
        totalMarks: parseInt(formData.totalMarks, 10) || 0,
        dueDate: new Date(formData.dueDate).toISOString(),
        assignedBatches: formData.assignedBatches.length > 0 ? formData.assignedBatches : [batches[0]?._id] // Default to first batch if none selected
      };
      console.log('Submitting payload:', payload); // Debug log

      if (editingId) {
        const response = await axios.put(`/api/assignments/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignments(assignments.map(ass => (ass._id === editingId ? response.data : ass)));
        setEditingId(null);
      } else {
        const response = await axios.post('/api/assignments', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignments([...assignments, response.data]);
      }

      setFormData({
        title: '',
        description: '',
        subject: '',
        dueDate: '',
        totalMarks: '',
        assignedBatches: [],
        attachmentLink: ''
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assignment');
      console.error('Error saving assignment:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment) => {
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      subject: assignment.subject,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
      totalMarks: assignment.totalMarks.toString(),
      assignedBatches: assignment.assignedBatches.map(b => b._id.toString()),
      attachmentLink: assignment.attachmentLink || ''
    });
    setEditingId(assignment._id);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      await axios.delete(`/api/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(assignments.filter(ass => ass._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete assignment');
      console.error('Error deleting assignment:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignment Management</h2>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
      {loading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>}

      {/* Form for adding/editing assignments */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Assignment' : 'Add New Assignment'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Marks</label>
            <input
              type="number"
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Attachment Link (Optional)</label>
            <input
              type="url"
              name="attachmentLink"
              value={formData.attachmentLink}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign to Batches</label>
            <select
              multiple
              name="assignedBatches"
              value={formData.assignedBatches}
              onChange={handleBatchChange}
              className="mt-1 p-2 border rounded w-full"
              required
            >
              {batches.map(batch => (
                <option key={batch._id} value={batch._id}>{batch.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              rows="4"
            ></textarea>
          </div>
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading}
        >
          {editingId ? 'Update Assignment' : 'Add Assignment'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                subject: '',
                dueDate: '',
                totalMarks: '',
                assignedBatches: [],
                attachmentLink: ''
              });
              setEditingId(null);
            }}
            className="ml-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </form>

      {/* List of assignments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Your Assignments</h3>
        {assignments.length === 0 ? (
          <p className="text-gray-600">No assignments found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <div key={assignment._id} className="border rounded-lg p-4">
                <h4 className="font-semibold">{assignment.title}</h4>
                <p className="text-sm text-gray-600">Subject: {assignment.subject}</p>
                <p className="text-sm text-gray-600">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">Marks: {assignment.totalMarks}</p>
                <p className="text-sm text-gray-600">
                  Batches: {assignment.assignedBatches.map(b => b.name).join(', ')}
                </p>
                {assignment.attachmentLink && (
                  <p className="text-sm text-gray-600">
                    Attachment: <a href={assignment.attachmentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a>
                  </p>
                )}
                <p className="text-sm text-gray-600">Created: {new Date(assignment.createdAt).toLocaleDateString()}</p>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleEdit(assignment)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-5 w-5 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(assignment._id)}
                    className="flex items-center text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5 mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignment;