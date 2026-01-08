// StudentResources.jsx - Updated: No Modal, All Data in Cards
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Search, BookOpen, Video, File, Link, Star, Eye, User, 
  GraduationCap, Download, FileText, Calendar, Tag, Award, ChevronDown, ChevronUp 
} from "lucide-react";
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';

const StudentResources = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState("all");
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({}); // Track expanded state per card
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, selectedSubject, selectedAccessLevel]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        setLoading(false);
        showToast('error', 'Please log in to view resources');
        return;
      }

      // Use the correct endpoint
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/references/student/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Handle the response structure correctly
      if (response.data && response.data.references) {
        setResources(response.data.references);
      } else if (Array.isArray(response.data)) {
        setResources(response.data);
      } else {
        setResources([]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch resources';
      showToast('error', msg);
      console.error('Error fetching resources:', err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = [...resources];

    if (searchTerm) {
      filtered = filtered.filter(r =>
        (r.topicName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (r.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (r.tags && r.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter(r => r.subject === selectedSubject);
    }

    if (selectedAccessLevel !== "all") {
      filtered = filtered.filter(r => r.accessLevel === selectedAccessLevel);
    }

    setFilteredResources(filtered);
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getUniqueSubjects = () => {
    return [...new Set(resources.map(r => r.subject).filter(Boolean))].sort();
  };

  const getResourceIcon = (resource) => {
    if (resource.files?.length > 0) {
      const file = resource.files[0];
      if (file.mimetype?.includes('pdf')) return <FileText className="w-5 h-5" />;
      if (file.mimetype?.includes('document')) return <File className="w-5 h-5" />;
      if (file.mimetype?.includes('presentation')) return <File className="w-5 h-5" />;
      return <File className="w-5 h-5" />;
    }
    if (resource.referenceVideoLink) return <Video className="w-5 h-5" />;
    if (resource.referenceNotesLink) return <Link className="w-5 h-5" />;
    return <BookOpen className="w-5 h-5" />;
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

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            Learning Resources
          </h1>
          <p className="text-gray-600 mt-2">
            Access course materials, videos, and documents shared by your trainers
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <ToastNotification
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

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

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {getUniqueSubjects().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedAccessLevel}
              onChange={(e) => setSelectedAccessLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Resources</option>
              <option value="public">Public</option>
              <option value="batch-specific">Batch Specific</option>
            </select>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredResources.length} of {resources.length} resources
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Resources Found</h3>
            <p className="text-gray-500">
              {resources.length === 0
                ? "No resources have been shared with your batch yet."
                : "No resources match your current filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredResources.map(resource => (
              <div
                key={resource._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600">
                        {getResourceIcon(resource)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{resource.topicName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{resource.subject}</p>
                        {resource.trainerId && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <User className="w-4 h-4" /> {resource.trainerId.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(resource._id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedCards[resource._id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span>{resource.viewCount || 0} views</span>
                    </div>
                    {resource.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        {renderStars(Math.round(resource.averageRating))}
                        <span className="ml-1 text-gray-600">{resource.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      resource.accessLevel === 'public' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {resource.accessLevel === 'public' ? 'Public' : 'Batch'}
                    </span>
                  </div>

                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {resource.tags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-white text-gray-600 text-xs rounded-full">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expandable Content */}
                {expandedCards[resource._id] && (
                  <div className="p-6 space-y-6 border-t border-gray-100">
                    {/* Learning Objectives */}
                    {resource.learningObjectives && resource.learningObjectives.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Award className="w-5 h-5 text-blue-600" />
                          Learning Objectives
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                          {resource.learningObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Prerequisites */}
                    {resource.prerequisites && resource.prerequisites.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Prerequisites</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                          {resource.prerequisites.map((pr, i) => <li key={i}>{pr}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Files */}
                    {resource.files && resource.files.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Files</h4>
                        <div className="space-y-2">
                          {resource.files.map((file, i) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{file.filename}</p>
                                  <p className="text-xs text-gray-500">
                                    {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'File'}
                                  </p>
                                </div>
                              </div>
                              <Download className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video */}
                    {resource.referenceVideoLink && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Video</h4>
                        <a
                          href={resource.referenceVideoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 text-blue-700"
                        >
                          <Video className="w-5 h-5" />
                          <span>Watch Video</span>
                        </a>
                      </div>
                    )}

                    {/* Notes */}
                    {resource.referenceNotesLink && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                        <a
                          href={resource.referenceNotesLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 text-green-700"
                        >
                          <Link className="w-5 h-5" />
                          <span>View Notes</span>
                        </a>
                      </div>
                    )}

                    {/* Rating */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">Rating</h4>
                          {resource.averageRating > 0 ? (
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(Math.round(resource.averageRating))}
                              <span className="text-sm text-gray-600">{resource.averageRating.toFixed(1)} / 5.0</span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No ratings yet</p>
                          )}
                        </div>
                        {resource.hasRated && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            You rated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResources;