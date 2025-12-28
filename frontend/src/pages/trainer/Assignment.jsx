import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Upload, Trash2, Users, Eye, Download, X, ChevronLeft, RefreshCw } from 'lucide-react';

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
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });

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
      console.log('DEBUG /api/assignments/batches response:', response.data || {});
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

  const fetchSubmissions = async (assignmentId) => {
    try {
      const token = localStorage.getItem('trainerToken');
      const response = await axios.get(`/api/assignments/${assignmentId}/submissions`, {
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
        `/api/assignments/${selectedAssignment}/submissions/${gradingSubmission._id}/grade`,
        gradeForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setGradingSubmission(null);
      setGradeForm({ score: '', feedback: '' });
      await fetchSubmissions(selectedAssignment);
      alert('Submission graded successfully!');
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
    if (formData.batchType === 'noncrt') {
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

  const handleToggleBatch = (batchId) => {
    if (formData.batchType === 'noncrt') {
      setFormData(prev => ({ ...prev, assignedBatches: prev.assignedBatches.includes(batchId) ? prev.assignedBatches.filter(id => id !== batchId) : [...prev.assignedBatches, batchId] }));
    } else if (formData.batchType === 'placement') {
      setFormData(prev => ({ ...prev, assignedPlacementBatches: prev.assignedPlacementBatches.includes(batchId) ? prev.assignedPlacementBatches.filter(id => id !== batchId) : [...prev.assignedPlacementBatches, batchId] }));
    } else {
      setFormData(prev => ({ ...prev, assignedBatches: prev.assignedBatches.includes(batchId) ? prev.assignedBatches.filter(id => id !== batchId) : [...prev.assignedBatches, batchId], assignedPlacementBatches: prev.assignedPlacementBatches.includes(batchId) ? prev.assignedPlacementBatches.filter(id => id !== batchId) : [...prev.assignedPlacementBatches, batchId] }));
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
          batchType: formData.batchType,
          assignedBatches: formData.assignedBatches,
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
    const norm = s => (s || '').toString().trim().toUpperCase();
    const isNT = b => (b && (b.isCrt === false)) || /^NT\b|^NT[_\- ]/.test(norm(b.batchNumber || b.name));
    const isPT = b => /^PT\b|^PT[_\- ]/.test(norm(b.batchNumber || b.name));

    const regularList = batches.regular || [];
    const placementAll = batches.placement || [];

    const noncrtFromRegular = regularList.filter(b => isNT(b));
    const noncrtFromPlacement = placementAll.filter(b => isNT(b));

    const uniqueById = (arr) => Array.from(new Map(arr.map(i => [i._id?.toString() || i.name || Math.random(), i])).values());

    const noncrtList = uniqueById([...noncrtFromRegular, ...noncrtFromPlacement]);
    const placementList = uniqueById(placementAll.filter(b => isPT(b)));

    // DEBUG: log computed lists
    console.log('DEBUG getBatchOptions (assignment):', { batchType: formData.batchType, noncrtFromRegular: noncrtFromRegular.length, noncrtFromPlacement: noncrtFromPlacement.length, noncrtCount: noncrtList.length, placementCount: placementList.length });

    switch (formData.batchType) {
      case 'noncrt':
        return noncrtList;
      case 'placement':
        return placementList;
      case 'both':
        return [...placementList, ...noncrtList];
      default:
        return [];
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-md">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Submissions: {assignment?.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{submissions.length} submissions • Due {assignment && new Date(assignment.dueDate).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm"><strong>Total Submissions:</strong> {submissions.length}</p>
          <p className="text-sm"><strong>Due Date:</strong> {assignment && new Date(assignment.dueDate).toLocaleString()}</p>
          <p className="text-sm"><strong>Total Marks:</strong> {assignment?.totalMarks}</p>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission._id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">{submission.studentId?.name || 'Unknown Student'}</h3>
                    <p className="text-sm text-gray-600">Roll No: {submission.studentId?.rollNo || 'N/A'}</p>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      {submission.isLate && <span className="ml-2 text-red-600 font-medium">(Late)</span>}
                    </p>
                  </div>
                  <div>
                    {submission.score !== undefined && submission.score !== null ? (
                      <div className="text-sm sm:text-right">
                        <p className="text-2xl font-bold text-green-600">{submission.score}/{assignment?.totalMarks}</p>
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
                <h3 className="text-lg sm:text-xl font-bold">Grade Submission</h3>
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
              <option value="noncrt">Non-CRT Batches</option>
              <option value="both">Both Types</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batches *</label>
            <div className="max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-md bg-white">
              {loading ? (
                <div className="text-sm text-gray-500">Loading batches...</div>
              ) : getBatchOptions().length > 0 ? (
                getBatchOptions().map(batch => {
                  const id = batch._id || batch.batchNumber || batch.name;
                  const checked = formData.batchType === 'noncrt' ? formData.assignedBatches.includes(id) : formData.batchType === 'placement' ? formData.assignedPlacementBatches.includes(id) : (formData.assignedBatches.includes(id) || formData.assignedPlacementBatches.includes(id));
                  return (
                    <label key={id} className="flex items-center gap-3 text-sm mb-1">
                      <input type="checkbox" checked={checked} onChange={() => handleToggleBatch(id)} className="w-4 h-4" />
                      <span>{batch.name} ({batch.studentCount || 0} students)</span>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments (Optional) - Files for students
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-md">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Assignments</h2>
            <p className="text-xs text-gray-600 mt-1">{totalAssignments} assignments • {totalSubmissions} submissions</p>
          </div>
        </div>




      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{assignment.title}</h3>
                    <div className="text-xs text-gray-500">{assignment.subject} • Due {new Date(assignment.dueDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-800">{assignment.submissions?.length || 0}</div>
                    <div className="text-xs text-blue-600">Submissions</div>
                  </div>
                </div>
              </div>

              <div className="p-3 text-sm text-gray-600">
                <div className="mb-2">Marks: <span className="font-medium">{assignment.totalMarks}</span></div>
                <div className="mb-2">Assigned to:</div>
                <div className="inline-flex flex-wrap gap-1">
                  {assignment.assignedBatches?.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Non-CRT: {assignment.assignedBatches.map(b => b.name).join(', ')}</span>
                  )}
                  {assignment.assignedPlacementBatches?.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Placement: {assignment.assignedPlacementBatches.map(b => `${b.batchNumber} - ${b.techStack}`).join(', ')}</span>
                  )}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => fetchSubmissions(assignment._id)}
                    className="w-full sm:flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Submissions ({assignment.submissions?.length || 0})
                  </button>

                  <button
                    onClick={() => deleteAssignment(assignment._id)}
                    className="w-full sm:w-auto px-3 py-2 border border-red-200 text-red-600 rounded text-sm flex items-center justify-center"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
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
      {activeTab === 'submissions' && renderSubmissionsView()}
    </div>
  );
};

export default Assignment;