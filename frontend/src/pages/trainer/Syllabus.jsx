// src/components/trainer/Syllabus.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Trash2, Edit } from 'lucide-react';

const Syllabus = () => {
  const [syllabi, setSyllabi] = useState([]);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    topics: [{ topicName: '', description: '', duration: '' }]
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSyllabi();
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
      console.error('Error fetching syllabi:', err.response?.data || err.message);
    } finally {
      setLoading(false);
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
    setFormData({ ...formData, topics: newTopics.length ? newTopics : [{ topicName: '', description: '', duration: '' }] });
  };

  const isValidObjectId = (id) => {
    // Basic check for a 24-character hex string
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const validTopics = formData.topics.every(topic => 
        topic.topicName.trim() && topic.duration.trim()
      );
      if (!validTopics) {
        setError('Each topic must have a name and duration');
        return;
      }

      let payload = {
        title: formData.title,
        description: formData.description,
        topics: formData.topics.filter(t => t.topicName.trim() && t.duration.trim())
      };

      // Only include courseId if it's a valid ObjectId, otherwise set to null
      payload.courseId = formData.courseId.trim() && isValidObjectId(formData.courseId) 
        ? formData.courseId 
        : null;

      if (!payload.title.trim()) {
        setError('Title is required');
        return;
      }

      if (editingId) {
        const response = await axios.put(`/api/syllabi/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSyllabi(syllabi.map(s => (s._id === editingId ? response.data : s)));
        setEditingId(null);
      } else {
        const response = await axios.post('/api/syllabi', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSyllabi([...syllabi, response.data]);
      }

      setFormData({
        courseId: '',
        title: '',
        description: '',
        topics: [{ topicName: '', description: '', duration: '' }]
      });
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save syllabus';
      setError(errorMsg);
      console.error('Error saving syllabus:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (syllabus) => {
    setFormData({
      courseId: syllabus.courseId?._id || '',
      title: syllabus.title,
      description: syllabus.description || '',
      topics: syllabus.topics.map(t => ({ ...t }))
    });
    setEditingId(syllabus._id);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      await axios.delete(`/api/syllabi/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyllabi(syllabi.filter(s => s._id !== id));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete syllabus';
      setError(errorMsg);
      console.error('Error deleting syllabus:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Syllabus Management</h2>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
      {loading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Syllabus' : 'Add New Syllabus'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Course ID (Optional)</label>
            <input
              type="text"
              name="courseId"
              value={formData.courseId}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              placeholder="Enter valid Course ID (e.g., 507f1f77bcf86cd799439011) or leave blank"
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank if no course is associated</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 p-2 border rounded w-full"
              rows="3"
            ></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Topics</label>
            {formData.topics.map((topic, index) => (
              <div key={index} className="border p-4 mb-4 rounded relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Topic Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="topicName"
                      value={topic.topicName}
                      onChange={(e) => handleTopicChange(index, e)}
                      className="mt-1 p-2 border rounded w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      name="description"
                      value={topic.description || ''}
                      onChange={(e) => handleTopicChange(index, e)}
                      className="mt-1 p-2 border rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="duration"
                      value={topic.duration || ''}
                      onChange={(e) => handleTopicChange(index, e)}
                      className="mt-1 p-2 border rounded w-full"
                      required
                      placeholder="e.g., 2 hours"
                    />
                  </div>
                </div>
                {formData.topics.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTopic(index)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTopic}
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add Topic
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading}
        >
          {editingId ? 'Update Syllabus' : 'Add Syllabus'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setFormData({
                courseId: '',
                title: '',
                description: '',
                topics: [{ topicName: '', description: '', duration: '' }]
              });
              setEditingId(null);
            }}
            className="ml-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Your Syllabi</h3>
        {syllabi.length === 0 ? (
          <p className="text-gray-600">No syllabi found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {syllabi.map((syllabus) => (
              <div key={syllabus._id} className="border rounded-lg p-4">
                <h4 className="font-semibold">{syllabus.title}</h4>
                <p className="text-sm text-gray-600">Course: {syllabus.courseId?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">Topics: {syllabus.topics.length}</p>
                <p className="text-sm text-gray-600">Created: {new Date(syllabus.createdAt).toLocaleDateString()}</p>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleEdit(syllabus)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-5 w-5 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(syllabus._id)}
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

export default Syllabus;