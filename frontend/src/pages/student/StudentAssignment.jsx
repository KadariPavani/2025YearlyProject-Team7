
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ToastNotification from '../../components/ui/ToastNotification';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import { FileText, Upload, CheckCircle, XCircle, Download, Paperclip, Eye, RefreshCw, ChevronDown, ChevronUp, Clock } from 'lucide-react';

const StudentAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [expandedAssignment, setExpandedAssignment] = useState(null);

  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        showToast('error','Please log in to view assignments');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments/student/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileView = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    let viewUrl = file.url;
    if (viewUrl) {
      viewUrl = viewUrl.replace('http://', 'https://');
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('error','File URL not available');
    }
  };

  const handleFileDownload = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    let downloadUrl = file.url;
    if (downloadUrl) {
      downloadUrl = downloadUrl.replace('http://', 'https://');
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast('error','File URL not available');
    }
  };

  const getFileIcon = (fileName, mimeType = '') => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (mimeType) {
      if (mimeType.startsWith('image/')) return '🖼️';
      if (mimeType === 'application/pdf') return '📄';
      if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
      if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
      if (mimeType.startsWith('text/')) return '📃';
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️';
    if (['txt', 'csv', 'json', 'xml', 'js', 'html', 'css'].includes(ext)) return '📃';
    return '📎';
  };

  const handleFileSelect = (assignmentId, files) => {
    const validFiles = Array.from(files).filter(file => {
      const isValidType = [
        'image/jpeg', 'image/png', 'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'application/zip', 'application/x-rar-compressed'
      ].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024;
      if (!isValidType) showToast('error', `Invalid file type for ${file.name}`);
      if (!isValidSize) showToast('error', `File ${file.name} exceeds 10MB limit`);
      return isValidType && isValidSize;
    });
    setSelectedFiles(prev => ({ ...prev, [assignmentId]: validFiles }));
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const files = selectedFiles[assignmentId];
    if (!files || files.length === 0) {
      showToast('error','Please select at least one file');
      return;
    }
    try {
      setUploading(true);
      setError('');
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('No user token found');
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[assignmentId];
        return updated;
      });
      await fetchAssignments();
      showToast('success','Assignment submitted successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit assignment';
      setError(msg);
      showToast('error', msg);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const isOverdue = (dueDate) => new Date() > new Date(dueDate);

  if (loading) return <LoadingSkeleton />;

  const submitted = assignments.filter(a => a.hasSubmitted).length;
  const pending = assignments.filter(a => !a.hasSubmitted && !isOverdue(a.dueDate)).length;
  const overdue = assignments.filter(a => !a.hasSubmitted && isOverdue(a.dueDate)).length;

  return (
    <div className="space-y-4">
      {toast && (
        <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">My Assignments</h2>
          <p className="text-xs text-gray-500 mt-0.5">{assignments.length} assignments</p>
        </div>
        <button
          onClick={fetchAssignments}
          className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Submitted</p>
              <p className="text-sm sm:text-xl font-bold text-green-700">{submitted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-yellow-50 items-center justify-center"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-sm sm:text-xl font-bold text-yellow-600">{pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-red-50 items-center justify-center"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-sm sm:text-xl font-bold text-red-600">{overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">All Assignments</h3>
          <span className="ml-auto text-xs text-gray-500">{assignments.length} total</span>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-8 p-3 sm:p-4">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">No assignments available</p>
            <p className="text-xs text-gray-400 mt-1">Assignments will appear here once created by trainers</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-3">
            {assignments.map((assignment) => {
              const isExpanded = expandedAssignment === assignment._id;
              const statusInfo = assignment.hasSubmitted
                ? { label: 'Submitted', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> }
                : isOverdue(assignment.dueDate)
                ? { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> }
                : { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> };

              return (
                <div key={assignment._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Assignment Row */}
                  <div
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-3 ${isExpanded ? 'bg-blue-50/50' : ''}`}
                    onClick={() => setExpandedAssignment(isExpanded ? null : assignment._id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate">{assignment.title}</h4>
                        <span className={`shrink-0 px-2 py-0.5 inline-flex items-center gap-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] sm:text-xs text-gray-500">
                        <span>Subject: <span className="text-gray-700 font-medium">{assignment.subject}</span></span>
                        <span className={`${isOverdue(assignment.dueDate) && !assignment.hasSubmitted ? 'text-red-600 font-medium' : ''}`}>
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                        <span>Marks: <span className="text-gray-700 font-medium">{assignment.totalMarks}</span></span>
                      </div>
                    </div>
                    <div className="shrink-0 text-gray-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-4 bg-gray-50 space-y-3">
                      {/* Description */}
                      {assignment.description && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-1">Description</h5>
                          <p className="text-xs sm:text-sm text-gray-600">{assignment.description}</p>
                        </div>
                      )}

                      {/* Instructions */}
                      {assignment.instructions && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-1">Instructions</h5>
                          <p className="text-xs sm:text-sm text-gray-600">{assignment.instructions}</p>
                        </div>
                      )}

                      {/* Assignment Attachments */}
                      {assignment.attachments && assignment.attachments.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            Assignment Files
                          </h5>
                          <div className="space-y-1.5">
                            {assignment.attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                <div className="flex items-center min-w-0 gap-2">
                                  <span className="text-sm shrink-0">{getFileIcon(file.originalName, file.mimeType)}</span>
                                  <span className="text-xs sm:text-sm text-gray-700 truncate">{file.originalName}</span>
                                </div>
                                <div className="flex gap-1.5 shrink-0 ml-2">
                                  <button
                                    onClick={(e) => handleFileView(e, file)}
                                    className="px-2 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" /><span className="hidden sm:inline">View</span>
                                  </button>
                                  <button
                                    onClick={(e) => handleFileDownload(e, file)}
                                    className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
                                  >
                                    <Download className="w-3 h-3" /><span className="hidden sm:inline">Download</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Submission Section */}
                      {!assignment.hasSubmitted ? (
                        <div className="bg-white p-3 rounded-lg border border-dashed border-gray-300">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">Submit Your Work</h5>
                          <input
                            type="file"
                            multiple
                            accept=".jpg,.png,.pdf,.doc,.docx,.txt,.zip,.rar"
                            onChange={(e) => handleFileSelect(assignment._id, e.target.files)}
                            className="w-full text-xs sm:text-sm px-2 py-1.5 border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {selectedFiles[assignment._id] && selectedFiles[assignment._id].length > 0 && (
                            <p className="mt-1.5 text-[10px] sm:text-xs text-gray-500">
                              Selected: {selectedFiles[assignment._id].map(f => f.name).join(', ')}
                            </p>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSubmitAssignment(assignment._id); }}
                            disabled={uploading || !selectedFiles[assignment._id] || selectedFiles[assignment._id].length === 0}
                            className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {uploading ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      ) : (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <h5 className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Your Submission
                          </h5>
                          {assignment.submissions && assignment.submissions[0] && (
                            <div className="space-y-2">
                              <p className="text-[10px] sm:text-xs text-gray-600">
                                Submitted: {formatDate(assignment.submissions[0].submittedAt)}
                                {assignment.submissions[0].isLate && (
                                  <span className="ml-1.5 text-red-600 font-medium">(Late)</span>
                                )}
                              </p>

                              {assignment.submissions[0].files && assignment.submissions[0].files.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-medium text-gray-700">Submitted Files:</p>
                                  {assignment.submissions[0].files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                      <div className="flex items-center min-w-0 gap-2">
                                        <span className="text-sm shrink-0">{getFileIcon(file.originalName, file.mimeType)}</span>
                                        <span className="text-xs truncate">{file.originalName}</span>
                                      </div>
                                      <div className="flex gap-1.5 shrink-0 ml-2">
                                        <button
                                          onClick={(e) => handleFileView(e, file)}
                                          className="px-2 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-1"
                                        >
                                          <Eye className="w-3 h-3" /><span className="hidden sm:inline">View</span>
                                        </button>
                                        <button
                                          onClick={(e) => handleFileDownload(e, file)}
                                          className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
                                        >
                                          <Download className="w-3 h-3" /><span className="hidden sm:inline">Download</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {assignment.submissions[0].score !== undefined && assignment.submissions[0].score !== null && (
                                <div className="bg-white p-2 sm:p-2.5 rounded border border-green-300">
                                  <p className="text-xs sm:text-sm font-bold text-green-700">
                                    Score: {assignment.submissions[0].score} / {assignment.totalMarks}
                                  </p>
                                  {assignment.submissions[0].feedback && (
                                    <div className="mt-1">
                                      <p className="text-[10px] sm:text-xs font-medium text-gray-700">Feedback:</p>
                                      <p className="text-[10px] sm:text-xs text-gray-600">{assignment.submissions[0].feedback}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignment;
