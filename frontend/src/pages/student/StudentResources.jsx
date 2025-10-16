// Updated StudentResources.jsx - Enhanced to work with placement training batch system
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, BookOpen, Video, File, Link, Star, Eye, User, GraduationCap, Download } from "lucide-react";

const StudentResources = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, selectedSubject, selectedDifficulty]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('Please log in to view resources');
        return;
      }

      // Backend automatically filters by student's batch
      const response = await axios.get('/api/references/student/list', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResources(Array.isArray(response.data.references) ? response.data.references : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch resources');
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resource.tags && resource.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter(resource => resource.subject === selectedSubject);
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(resource => resource.difficulty === selectedDifficulty);
    }

    setFilteredResources(filtered);
  };

  const handleResourceClick = async (resourceId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      // Fetch detailed resource view (this records the view)
      await axios.get(`/api/references/student/${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optionally refresh resources to update view count
      fetchResources();
    } catch (err) {
      console.error('Error viewing resource:', err);
    }
  };

  const handleRateResource = async (resourceId, rating, feedback = '') => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      await axios.post(`/api/references/${resourceId}/rate`, {
        rating,
        feedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh resources to update rating
      fetchResources();
    } catch (err) {
      console.error('Error rating resource:', err);
      setError('Failed to submit rating');
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-500" />;
      case 'document': return <File className="w-5 h-5 text-blue-500" />;
      case 'link': return <Link className="w-5 h-5 text-green-500" />;
      case 'presentation': return <File className="w-5 h-5 text-orange-500" />;
      default: return <BookOpen className="w-5 h-5 text-purple-500" />;
    }
  };

  const getBatchTypeDisplay = (resource) => {
    if (resource.accessLevel === 'public') {
      return { type: 'Public', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (resource.batchType === 'placement' && resource.assignedPlacementBatches?.length > 0) {
      return {
        type: 'Placement Training',
        batches: resource.assignedPlacementBatches.map(b => `${b.batchNumber} - ${b.techStack}`).join(', '),
        color: 'bg-green-100 text-green-800'
      };
    } else if (resource.batchType === 'regular' && resource.assignedBatches?.length > 0) {
      return {
        type: 'Regular Batch',
        batches: resource.assignedBatches.map(b => b.name).join(', '),
        color: 'bg-purple-100 text-purple-800'
      };
    }
    
    return { type: 'Batch Specific', color: 'bg-gray-100 text-gray-800' };
  };

  const uniqueSubjects = [...new Set(resources.map(r => r.subject))];

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
              Learning Resources
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Resources
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search topics, subjects, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading resources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Available</h3>
              <p className="text-gray-600">
                {resources.length === 0 
                  ? "No resources have been shared with your batch yet."
                  : "No resources match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => {
                const batchInfo = getBatchTypeDisplay(resource);

                return (
                  <div key={resource._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                        {resource.topicName}
                      </h2>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        resource.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        resource.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {resource.difficulty.charAt(0).toUpperCase() + resource.difficulty.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        <span>Subject: {resource.subject}</span>
                      </div>

                      {resource.module && (
                        <div className="flex items-center">
                          <File className="w-4 h-4 mr-2" />
                          <span>Module: {resource.module}</span>
                        </div>
                      )}

                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span>By: {resource.trainerId?.name}</span>
                      </div>

                      {/* Batch Information */}
                      <div>
                        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${batchInfo.color}`}>
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {batchInfo.type}
                        </div>
                        {batchInfo.batches && (
                          <p className="text-xs text-gray-500 mt-1 truncate" title={batchInfo.batches}>
                            {batchInfo.batches}
                          </p>
                        )}
                      </div>

                      {/* Resource Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{resource.viewCount || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            <span>{resource.averageRating || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <File className="w-4 h-4 mr-1" />
                            <span>{resource.resourceCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {resource.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{resource.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Available Resources */}
                    <div className="space-y-2 mb-4">
                      {/* Legacy links */}
                      {resource.referenceVideoLink && (
                        <a
                          href={resource.referenceVideoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleResourceClick(resource._id)}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Reference Video
                        </a>
                      )}
                      {resource.referenceNotesLink && (
                        <a
                          href={resource.referenceNotesLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleResourceClick(resource._id)}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <File className="w-4 h-4 mr-2" />
                          Reference Notes
                        </a>
                      )}

                      {/* New resources */}
                      {resource.resources && resource.resources.length > 0 && (
                        <div className="space-y-1">
                          {resource.resources.slice(0, 3).map((res, index) => (
                            <a
                              key={index}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleResourceClick(resource._id)}
                              className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                              title={res.description}
                            >
                              {getResourceIcon(res.type)}
                              <span className="ml-2 truncate">
                                {res.title}
                                {res.duration && <span className="text-gray-500 ml-1">({res.duration})</span>}
                              </span>
                            </a>
                          ))}
                          {resource.resources.length > 3 && (
                            <p className="text-xs text-gray-500 ml-6">
                              +{resource.resources.length - 3} more resources
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Learning Objectives */}
                    {resource.learningObjectives && resource.learningObjectives.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Learning Objectives:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {resource.learningObjectives.slice(0, 2).map((objective, index) => (
                            <li key={index} className="truncate">{objective}</li>
                          ))}
                          {resource.learningObjectives.length > 2 && (
                            <li className="text-gray-500">+{resource.learningObjectives.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Rating Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Rate this resource:</span>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => {
                                const feedback = prompt(`Rate ${resource.topicName} (${rating}/5 stars). Add feedback (optional):`);
                                if (feedback !== null) {
                                  handleRateResource(resource._id, rating, feedback);
                                }
                              }}
                              className="text-yellow-400 hover:text-yellow-500"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-4">
                      Added: {new Date(resource.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary Stats */}
          {resources.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{resources.length}</div>
                <div className="text-sm text-gray-600">Total Resources</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{uniqueSubjects.length}</div>
                <div className="text-sm text-gray-600">Subjects</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {resources.filter(r => r.accessLevel === 'public').length}
                </div>
                <div className="text-sm text-gray-600">Public Resources</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((resources.reduce((acc, r) => acc + (r.averageRating || 0), 0) / resources.length) * 10) / 10 || 0}
                </div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentResources;