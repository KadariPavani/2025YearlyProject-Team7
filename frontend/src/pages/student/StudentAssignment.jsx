
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Upload, CheckCircle, XCircle, Download, Paperclip, Eye } from 'lucide-react';

const StudentAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [expandedAssignment, setExpandedAssignment] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('No user token found');

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments/student/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CRITICAL FIX: File Handlers
  // Use clean URLs without fl_attachment transformations
  // ============================================
  
  // View file - opens in new tab
  const handleFileView = (e, file) => {
    e.preventDefault();
    
    // Use clean URL - NO transformations for raw files!
    let viewUrl = file.url;
    
    if (viewUrl) {
      // Ensure HTTPS
      viewUrl = viewUrl.replace('http://', 'https://');
      
      // Open in new tab
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('File URL not available');
    }
  };

  // Download file with custom filename
  const handleFileDownload = (e, file) => {
    e.preventDefault();
    
    // Use clean URL - NO fl_attachment!
    let downloadUrl = file.url;
    
    if (downloadUrl) {
      // Ensure HTTPS
      downloadUrl = downloadUrl.replace('http://', 'https://');
      
      // Create download link with HTML5 download attribute
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName || 'download';
      link.target = '_blank';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('File URL not available');
    }
  };

  // Get file icon based on extension
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
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
      ].includes(file.type);
      
      const isValidSize = file.size <= 10 * 1024 * 1024;
      
      if (!isValidType) {
        setError(`Invalid file type for ${file.name}`);
      }
      if (!isValidSize) {
        setError(`File ${file.name} exceeds 10MB limit`);
      }
      
      return isValidType && isValidSize;
    });

    setSelectedFiles(prev => ({
      ...prev,
      [assignmentId]: validFiles
    }));
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const files = selectedFiles[assignmentId];
    
    if (!files || files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('No user token found');

      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[assignmentId];
        return updated;
      });

      await fetchAssignments();
      alert('Assignment submitted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate) => {
    return new Date() > new Date(dueDate);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <FileText className="w-8 h-8 mr-3 text-blue-600" />
        My Assignments
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold text-xl">×</button>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No assignments available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Assignment Header */}
              <div 
                className={`p-6 cursor-pointer hover:bg-gray-50 transition ${
                  expandedAssignment === assignment._id ? 'bg-gray-50' : ''
                }`}
                onClick={() => setExpandedAssignment(
                  expandedAssignment === assignment._id ? null : assignment._id
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {assignment.title}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Subject:</span>
                        <p className="font-medium">{assignment.subject}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Due Date:</span>
                        <p className={`font-medium ${isOverdue(assignment.dueDate) ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(assignment.dueDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Marks:</span>
                        <p className="font-medium">{assignment.totalMarks}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        {assignment.hasSubmitted ? (
                          <div className="flex items-center text-green-600 font-medium">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Submitted
                          </div>
                        ) : isOverdue(assignment.dueDate) ? (
                          <div className="flex items-center text-red-600 font-medium">
                            <XCircle className="w-4 h-4 mr-1" />
                            Overdue
                          </div>
                        ) : (
                          <div className="flex items-center text-yellow-600 font-medium">
                            <Upload className="w-4 h-4 mr-1" />
                            Pending
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedAssignment === assignment._id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {/* Description */}
                  {assignment.description && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700 mb-2">Description:</h3>
                      <p className="text-gray-600">{assignment.description}</p>
                    </div>
                  )}

                  {/* Instructions */}
                  {assignment.instructions && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700 mb-2">Instructions:</h3>
                      <p className="text-gray-600">{assignment.instructions}</p>
                    </div>
                  )}

                  {/* Assignment Attachments */}
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                        <Paperclip className="w-4 h-4 mr-1" />
                        Assignment Files:
                      </h3>
                      <div className="space-y-2">
                        {assignment.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">{getFileIcon(file.originalName, file.mimeType)}</span>
                              <span className="text-sm font-medium">{file.originalName}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => handleFileView(e, file)}
                                className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </button>
                              <button
                                onClick={(e) => handleFileDownload(e, file)}
                                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Section */}
                  {!assignment.hasSubmitted ? (
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                      <h3 className="font-semibold text-gray-700 mb-3">Submit Your Work:</h3>
                      <input
                        type="file"
                        multiple
                        accept=".jpg,.png,.pdf,.doc,.docx,.txt,.zip,.rar"
                        onChange={(e) => handleFileSelect(assignment._id, e.target.files)}
                        className="mb-3 w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      {selectedFiles[assignment._id] && selectedFiles[assignment._id].length > 0 && (
                        <div className="mb-3 text-sm text-gray-600">
                          Selected: {selectedFiles[assignment._id].map(f => f.name).join(', ')}
                        </div>
                      )}
                      <button
                        onClick={() => handleSubmitAssignment(assignment._id)}
                        disabled={uploading || !selectedFiles[assignment._id] || selectedFiles[assignment._id].length === 0}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Submitting...' : 'Submit Assignment'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Your Submission:
                      </h3>
                      {assignment.submissions && assignment.submissions[0] && (
                        <>
                          <p className="text-sm text-gray-600 mb-3">
                            Submitted on: {formatDate(assignment.submissions[0].submittedAt)}
                            {assignment.submissions[0].isLate && (
                              <span className="ml-2 text-red-600 font-medium">(Late Submission)</span>
                            )}
                          </p>
                          
                          {assignment.submissions[0].files && assignment.submissions[0].files.length > 0 && (
                            <div className="space-y-2 mb-3">
                              <h4 className="font-medium text-gray-700">Submitted Files:</h4>
                              {assignment.submissions[0].files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                  <div className="flex items-center">
                                    <span className="text-xl mr-2">{getFileIcon(file.originalName, file.mimeType)}</span>
                                    <span className="text-sm">{file.originalName}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => handleFileView(e, file)}
                                      className="flex items-center px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </button>
                                    <button
                                      onClick={(e) => handleFileDownload(e, file)}
                                      className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Download
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {assignment.submissions[0].score !== undefined && assignment.submissions[0].score !== null && (
                            <div className="bg-white p-3 rounded border border-green-300">
                              <p className="text-lg font-bold text-green-700">
                                Score: {assignment.submissions[0].score} / {assignment.totalMarks}
                              </p>
                              {assignment.submissions[0].feedback && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700">Feedback:</p>
                                  <p className="text-sm text-gray-600">{assignment.submissions[0].feedback}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAssignment;
