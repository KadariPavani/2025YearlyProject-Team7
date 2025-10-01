// src/components/trainer/Reference.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Trash2, Edit, PlusCircle } from 'lucide-react';

const Reference = () => {
  const [references, setReferences] = useState([]);
  const [formData, setFormData] = useState({
    topicName: '',
    referenceVideoLink: '',
    referenceNotesLink: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      const response = await axios.get('/api/reference', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferences(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch references');
      console.error('Error fetching references:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      if (editingId) {
        // Update existing reference
        const response = await axios.put(`/api/reference/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReferences(references.map(ref => (ref._id === editingId ? response.data : ref)));
        setEditingId(null);
      } else {
        // Create new reference
        const response = await axios.post('/api/reference', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReferences([...references, response.data]);
      }

      setFormData({
        topicName: '',
        referenceVideoLink: '',
        referenceNotesLink: ''
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reference');
      console.error('Error saving reference:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reference) => {
    setFormData({
      topicName: reference.topicName,
      referenceVideoLink: reference.referenceVideoLink,
      referenceNotesLink: reference.referenceNotesLink
    });
    setEditingId(reference._id);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      await axios.delete(`/api/reference/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferences(references.filter(ref => ref._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reference');
      console.error('Error deleting reference:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reference Management</h2>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
      {loading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>}

      {/* Form for adding/editing references */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Reference' : 'Add New Reference'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Topic Name</label>
            <input
              type="text"
              name="topicName"
              value={formData.topicName}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference Video Link</label>
            <input
              type="url"
              name="referenceVideoLink"
              value={formData.referenceVideoLink}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference Notes Link</label>
            <input
              type="url"
              name="referenceNotesLink"
              value={formData.referenceNotesLink}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading}
        >
          {editingId ? 'Update Reference' : 'Add Reference'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setFormData({ topicName: '', referenceVideoLink: '', referenceNotesLink: '' });
              setEditingId(null);
            }}
            className="ml-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </form>

      {/* List of references */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Your References</h3>
        {references.length === 0 ? (
          <p className="text-gray-600">No references found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {references.map((reference) => (
              <div key={reference._id} className="border rounded-lg p-4">
                <h4 className="font-semibold">{reference.topicName}</h4>
                <p className="text-sm text-gray-600">
                  Video: <a href={reference.referenceVideoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a>
                </p>
                <p className="text-sm text-gray-600">
                  Notes: <a href={reference.referenceNotesLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a>
                </p>
                <p className="text-sm text-gray-600">Created: {new Date(reference.createdAt).toLocaleDateString()}</p>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleEdit(reference)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-5 w-5 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(reference._id)}
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

export default Reference;