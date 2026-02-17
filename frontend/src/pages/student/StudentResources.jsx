import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search, BookOpen, Video, File, Link, User,
  Download, FileText, Award, ChevronDown, ChevronUp, RefreshCw
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
  const [expandedCards, setExpandedCards] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { fetchResources(); }, []);
  useEffect(() => { filterResources(); }, [resources, searchTerm, selectedSubject, selectedAccessLevel]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) { setLoading(false); showToast('error', 'Please log in to view resources'); return; }
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/references/student/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.references) setResources(response.data.references);
      else if (Array.isArray(response.data)) setResources(response.data);
      else setResources([]);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to fetch resources');
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
    if (selectedSubject) filtered = filtered.filter(r => r.subject === selectedSubject);
    if (selectedAccessLevel !== "all") filtered = filtered.filter(r => r.accessLevel === selectedAccessLevel);
    setFilteredResources(filtered);
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getUniqueSubjects = () => [...new Set(resources.map(r => r.subject).filter(Boolean))].sort();

  const getResourceIcon = (resource) => {
    if (resource.files?.length > 0) {
      const file = resource.files[0];
      if (file.mimetype?.includes('pdf')) return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
      return <File className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
    if (resource.referenceVideoLink) return <Video className="w-4 h-4 sm:w-5 sm:h-5" />;
    if (resource.referenceNotesLink) return <Link className="w-4 h-4 sm:w-5 sm:h-5" />;
    return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Learning Resources</h2>
          <p className="text-xs text-gray-500 mt-0.5">{resources.length} resources available</p>
        </div>
        <button onClick={fetchResources} className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search topic, subject, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Subjects</option>
            {getUniqueSubjects().map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={selectedAccessLevel}
            onChange={(e) => setSelectedAccessLevel(e.target.value)}
            className="px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Access</option>
            <option value="public">Public</option>
            <option value="batch-specific">Batch Only</option>
          </select>
        </div>
        <p className="mt-2 text-[10px] sm:text-xs text-gray-500">{filteredResources.length} of {resources.length} resources</p>
      </div>

      {/* Resources List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">All Resources</h3>
          <span className="ml-auto text-xs text-gray-500">{filteredResources.length} shown</span>
        </div>

        {filteredResources.length === 0 ? (
          <div className="text-center py-8 p-3 sm:p-4">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">
              {resources.length === 0 ? "No resources shared yet" : "No resources match your filters"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {resources.length === 0 ? "Resources will appear here once shared by trainers" : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-2.5">
            {filteredResources.map(resource => (
              <div key={resource._id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Resource Row */}
                <div
                  className={`px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2.5 sm:gap-3 ${expandedCards[resource._id] ? 'bg-blue-50/50' : ''}`}
                  onClick={() => toggleExpand(resource._id)}
                >
                  <div className="shrink-0 p-1.5 sm:p-2 bg-blue-50 rounded-lg text-blue-600">
                    {getResourceIcon(resource)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{resource.topicName}</h4>
                      <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                        resource.accessLevel === 'public' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {resource.accessLevel === 'public' ? 'Public' : 'Batch'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[10px] sm:text-xs text-gray-500">
                      <span>{resource.subject}</span>
                      {resource.trainerId && <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{resource.trainerId.name}</span>}
                    </div>
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {resource.tags.slice(0, 4).map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-gray-400">
                    {expandedCards[resource._id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedCards[resource._id] && (
                  <div className="border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-4 bg-gray-50 space-y-3">
                    {/* Learning Objectives */}
                    {resource.learningObjectives && resource.learningObjectives.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <Award className="w-3 h-3 text-blue-600" />Learning Objectives
                        </h5>
                        <ul className="list-disc list-inside space-y-0.5 text-xs sm:text-sm text-gray-600">
                          {resource.learningObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Prerequisites */}
                    {resource.prerequisites && resource.prerequisites.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-1">Prerequisites</h5>
                        <ul className="list-disc list-inside space-y-0.5 text-xs sm:text-sm text-gray-600">
                          {resource.prerequisites.map((pr, i) => <li key={i}>{pr}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Files */}
                    {resource.files && resource.files.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-1.5">Files</h5>
                        <div className="space-y-1.5">
                          {resource.files.map((file, i) => (
                            <a key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors group">
                              <div className="flex items-center min-w-0 gap-2">
                                <FileText className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                                  {file.size && <p className="text-[10px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
                                </div>
                              </div>
                              <Download className="w-3.5 h-3.5 shrink-0 text-gray-400 group-hover:text-blue-600 ml-2" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video & Notes Links */}
                    <div className="flex flex-wrap gap-2">
                      {resource.referenceVideoLink && (
                        <a href={resource.referenceVideoLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
                          <Video className="w-3 h-3" />Watch Video
                        </a>
                      )}
                      {resource.referenceNotesLink && (
                        <a href={resource.referenceNotesLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">
                          <Link className="w-3 h-3" />View Notes
                        </a>
                      )}
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
