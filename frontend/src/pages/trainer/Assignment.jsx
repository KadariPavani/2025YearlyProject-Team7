import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Upload, Trash2, Users, Eye, Download, X, ChevronLeft, RefreshCw } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';

const Assignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subject, setSubject] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    totalMarks: '',
    assignedPlacementBatches: [],
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
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAssignments();
    fetchBatches();
    fetchSubject();
  }, []);

  // UI-only derived metrics for display (no logic changes)
  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce((acc, a) => acc + (a.submissions?.length || 0), 0);
  const upcomingCount = assignments.filter(a => a.dueDate && (new Date(a.dueDate) - new Date()) <= 7*24*60*60*1000 && (new Date(a.dueDate) - new Date()) >= 0).length;
  const activeBatchesCount = Array.from(new Set(assignments.flatMap(a => [...(a.assignedBatches || []).map(b => b._id || b.name), ...(a.assignedPlacementBatches || []).map(b => b._id || b.batchNumber)]))).length;
  const topSubmissionsAssignment = assignments.slice().sort((a,b)=>(b.submissions?.length||0)-(a.submissions?.length||0))[0] || null;

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments`, {
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

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments/batches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batches');
      console.error('Error fetching batches:', err);
    }
  };

  const fetchSubject = async () => {
    try {
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments/subjects`, {
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

  const fetchSubmissions = async (assignmentId) => {
    try {
      const token = localStorage.getItem('trainerToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data.submissions || []);
      setSelectedAssignment(assignmentId);
      setActiveTab('submissions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch submissions');
    }
  };

  const handleGradeSubmit = async () => {
    if (!gradingSubmission || !gradeForm.score) {
      setError('Please enter a score');
      return;
    }

    try {
      const token = localStorage.getItem('trainerToken');
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments/${selectedAssignment}/submissions/${gradingSubmission._id}/grade`,
        gradeForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setGradingSubmission(null);
      setGradeForm({ score: '', feedback: '' });
      await fetchSubmissions(selectedAssignment);
      setSuccess('Submission graded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to grade submission');
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
      const isValidSize = file.size <= 10 * 1024 * 1024;
      if (!isValidType) setError(`Invalid file type for ${file.name}`);
      if (!isValidSize) setError(`File ${file.name} exceeds 10MB limit`);
      return isValidType && isValidSize;
    });
    setFormData(prev => ({ ...prev, files }));
  };

  const handleToggleBatch = (batchId) => {
    setFormData(prev => ({
      ...prev,
      assignedPlacementBatches: prev.assignedPlacementBatches.includes(batchId)
        ? prev.assignedPlacementBatches.filter(id => id !== batchId)
        : [...prev.assignedPlacementBatches, batchId]
    }));
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
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('subject', formData.subject);
        formDataToSend.append('dueDate', formData.dueDate);
        formDataToSend.append('totalMarks', formData.totalMarks);
        formDataToSend.append('batchType', 'placement');
        formDataToSend.append('instructions', formData.instructions);
        formDataToSend.append('allowLateSubmission', formData.allowLateSubmission);
        formDataToSend.append('lateSubmissionPenalty', formData.lateSubmissionPenalty);
        formDataToSend.append('maxAttempts', formData.maxAttempts);
        formDataToSend.append('rubric', JSON.stringify(formData.rubric));
        formDataToSend.append('assignedBatches', JSON.stringify([]));
        formDataToSend.append('assignedPlacementBatches', JSON.stringify(formData.assignedPlacementBatches));

        formData.files.forEach(file => {
          formDataToSend.append('files', file);
        });

        response = await axios.post('/api/assignments', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        const data = {
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          dueDate: formData.dueDate,
          totalMarks: formData.totalMarks,
          batchType: 'placement',
          assignedBatches: [],
          assignedPlacementBatches: formData.assignedPlacementBatches,
          instructions: formData.instructions,
          allowLateSubmission: formData.allowLateSubmission,
          lateSubmissionPenalty: formData.lateSubmissionPenalty,
          maxAttempts: formData.maxAttempts,
          rubric: formData.rubric
        };

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
        assignedPlacementBatches: [],
        instructions: '',
        allowLateSubmission: false,
        lateSubmissionPenalty: 0,
        maxAttempts: 1,
        rubric: [],
        files: []
      });
      setActiveTab('list');
      await fetchAssignments();
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


  // Enhanced file icon function
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

  // Enhanced file view handler
  const handleFileView = (e, file) => {
    if (file.mimeType === 'application/pdf' || file.mimeType?.startsWith('image/')) {
      e.preventDefault();
      const viewUrl = file.url || file.downloadUrl;
      if (viewUrl) {
        window.open(viewUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Enhanced file download URL
  const getFileDownloadUrl = (file) => {
    return file.downloadUrl || file.url || '#';
  };

  const renderSubmissionsView = () => {
    const assignment = assignments.find(a => a._id === selectedAssignment);
    
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm"><strong>Total Submissions:</strong> {submissions.length}</p>
          <p className="text-sm"><strong>Due Date:</strong> {assignment && new Date(assignment.dueDate).toLocaleString()}</p>
          <p className="text-sm"><strong>Total Marks:</strong> {assignment?.totalMarks}</p>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm sm:text-base">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission._id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">{submission.studentId?.name || 'Unknown Student'}</h3>
                    <p className="text-sm text-gray-600">Roll No: {submission.studentId?.rollNo || 'N/A'}</p>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      {submission.isLate && <span className="ml-2 text-red-600 font-medium">(Late)</span>}
                    </p>
                  </div>
                  <div>
                    {submission.score !== undefined && submission.score !== null ? (
                      <div className="text-sm sm:text-right">
                        <p className="text-lg sm:text-xl font-bold text-green-600">{submission.score}/{assignment?.totalMarks}</p>
                        <p className="text-xs text-gray-500">Graded</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setGradingSubmission(submission);
                          setGradeForm({ score: '', feedback: submission.feedback || '' });
                        }}
                        className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Grade
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-gray-700 mb-2">Submitted Files:</h4>
                  <div className="space-y-2">
                    {submission.files.map((file, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-center sm:items-center justify-between bg-gray-50 p-2 rounded gap-2">
                        <div className="flex items-center gap-2 max-w-full">
                          <span className="text-xl">{getFileIcon(file.originalName, file.mimeType)}</span>
                          <span className="text-sm truncate block max-w-[220px] sm:max-w-none">{file.originalName}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <button
                            onClick={(e) => handleFileView(e, file)}
                            className="w-full sm:w-auto flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <a
                            href={getFileDownloadUrl(file)}
                            download={file.originalName}
                            className="w-full sm:w-auto flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {submission.feedback && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded">
                    <p className="text-sm font-medium text-gray-700">Feedback:</p>
                    <p className="text-sm text-gray-600">{submission.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Grading Modal */}
        {gradingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white rounded-t-3xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-lg font-semibold">Grade Submission</h3>
                <button
                  onClick={() => setGradingSubmission(null)}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Student: {gradingSubmission.studentId?.name}</p>
                  <p className="text-sm text-gray-600">Roll No: {gradingSubmission.studentId?.rollNo}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score * (out of {assignment?.totalMarks})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={assignment?.totalMarks}
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide feedback to the student..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setGradingSubmission(null)}
                    className="w-full sm:flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGradeSubmit}
                    className="w-full sm:flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Submit Grade
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAssignmentForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Section: Basic Information */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Basic Information</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title *</label>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Provide detailed instructions for students..."
          />
        </div>
        </div>
      </div>

      {/* Section: Schedule & Marks */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Schedule & Marks</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Due Date *</label>
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
        </div>
      </div>

      {/* Section: Batch Assignment */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Batch Assignment</h3>
        </div>
        <div className="p-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Select Batches *</label>
          <div className="max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-md bg-white">
            {loading ? (
              <div className="animate-pulse space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-4 bg-gray-200 rounded w-1/2"></div></div>
            ) : batches.length > 0 ? (
              batches.map(batch => {
                const id = batch._id;
                const checked = formData.assignedPlacementBatches.includes(id);
                return (
                  <label key={id} className="flex items-center gap-3 text-sm mb-1">
                    <input type="checkbox" checked={checked} onChange={() => handleToggleBatch(id)} className="w-4 h-4" />
                    <span>{batch.batchNumber} - {batch.techStack} ({batch.studentCount || 0} students)</span>
                  </label>
                );
              })
            ) : (
              <div className="text-sm text-gray-500">No batches available</div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Click checkboxes to select multiple batches</p>
        </div>
      </div>

      {/* Section: Attachments */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Attachments (Optional)</h3>
        </div>
        <div className="p-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Files for students
          </label>
          <input
            type="file"
            multiple
            accept=".jpg,.png,.pdf,.doc,.docx,.txt,.zip,.rar"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload reference materials, instructions, or resources for students (Max 10MB per file)
          </p>
          {formData.files.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Selected: {formData.files.map(f => f.name).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs sm:text-sm transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm transition"
        >
          {uploading ? 'Creating...' : 'Create Assignment'}
        </button>
      </div>
    </form>
  );

  const renderAssignmentList = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {loading ? (
        <LoadingSkeleton />
      ) : assignments.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm sm:text-base">No assignments found</p>
          <p className="text-gray-400">Create your first assignment to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Title</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Due Date</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Marks</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Submissions</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batches</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((assignment, idx) => (
                <tr key={assignment._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{assignment.title}</div>
                  </td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{assignment.subject}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{new Date(assignment.dueDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{assignment.totalMarks}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-center font-semibold text-blue-700">{assignment.submissions?.length || 0}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {assignment.assignedPlacementBatches?.map(b => (
                        <span key={b._id || b.batchNumber} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">{b.batchNumber}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => fetchSubmissions(assignment._id)}
                        className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /><span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => deleteAssignment(assignment._id)}
                        className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /><span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
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
    <div className="space-y-4">
      {/* Toast */}
      {(error || success) && (
        <ToastNotification
          type={error ? 'error' : 'success'}
          message={error || success}
          onClose={() => { setError(''); setSuccess(''); }}
        />
      )}

      {/* Shared Header */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
                {activeTab === 'create' ? 'Create Assignment' : activeTab === 'submissions' ? 'Submissions' : 'Assignments'}
              </h2>
              <p className="text-xs text-gray-500">{totalAssignments} assignments &bull; {totalSubmissions} submissions</p>
            </div>
          </div>
          {activeTab === 'list' ? (
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Create Assignment</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('list')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to List</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === 'list' && renderAssignmentList()}
      {activeTab === 'create' && renderAssignmentForm()}
      {activeTab === 'submissions' && renderSubmissionsView()}
    </div>
  );
};

export default Assignment;