// Updated StudentAssignment.jsx - Enhanced to work with placement training batch system
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, FileText, Upload, Download, CheckCircle, AlertTriangle, User, GraduationCap } from "lucide-react";

// Helper function to check if a date is upcoming
const isUpcoming = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  return due.setHours(0, 0, 0, 0) > today.setHours(0, 0, 0, 0);
};

// Assignment statistics card
const AssignmentStatsCard = ({ total, completed, pending, upcoming }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-blue-50 p-4 rounded-lg text-center">
      <div className="text-2xl font-bold text-blue-600">{total}</div>
      <div className="text-sm text-gray-600">Total Assignments</div>
    </div>
    <div className="bg-green-50 p-4 rounded-lg text-center">
      <div className="text-2xl font-bold text-green-600">{completed}</div>
      <div className="text-sm text-gray-600">Completed</div>
    </div>
    <div className="bg-yellow-50 p-4 rounded-lg text-center">
      <div className="text-2xl font-bold text-yellow-600">{pending}</div>
      <div className="text-sm text-gray-600">Pending</div>
    </div>
    <div className="bg-purple-50 p-4 rounded-lg text-center">
      <div className="text-2xl font-bold text-purple-600">{upcoming}</div>
      <div className="text-sm text-gray-600">Upcoming</div>
    </div>
  </div>
);

const StudentAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    submissionText: '',
    submissionLink: '',
    submissionFiles: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('Please log in to view assignments');
        return;
      }

      // Backend automatically filters by student's batch
      const response = await axios.get('/api/assignments/student/list', {
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

  const fetchAssignmentDetails = async (assignmentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('Please log in to view assignment details');
        return;
      }

      const response = await axios.get(`/api/assignments/student/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedAssignment(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignment details');
      console.error('Error fetching assignment details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSubmissionData({
      ...submissionData,
      submissionFiles: files
    });
  };

  const handleSubmission = async (assignmentId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('Please log in to submit assignment');
        return;
      }

      const formData = new FormData();
      formData.append('submissionText', submissionData.submissionText);
      formData.append('submissionLink', submissionData.submissionLink);
      
      submissionData.submissionFiles.forEach(file => {
        formData.append('submissionFiles', file);
      });

      await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Assignment submitted successfully!');
      setSubmissionData({
        submissionText: '',
        submissionLink: '',
        submissionFiles: []
      });

      // Refresh assignments and selected assignment
      await fetchAssignments();
      if (selectedAssignment) {
        await fetchAssignmentDetails(assignmentId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
      console.error('Error submitting assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStatus = (assignment) => {
    if (assignment.hasSubmitted) {
      return { status: 'completed', color: 'text-green-600', bg: 'bg-green-100', text: 'Completed' };
    } else if (assignment.isOverdue) {
      return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-100', text: 'Overdue' };
    } else if (isUpcoming(assignment.dueDate)) {
      return { status: 'upcoming', color: 'text-blue-600', bg: 'bg-blue-100', text: 'Active' };
    } else {
      return { status: 'pending', color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Pending' };
    }
  };

  const getBatchTypeDisplay = (assignment) => {
    if (assignment.batchType === 'placement' && assignment.assignedPlacementBatches?.length > 0) {
      return {
        type: 'Placement Training',
        batches: assignment.assignedPlacementBatches.map(b => `${b.batchNumber} - ${b.techStack} (${b.year})`).join(', '),
        color: 'bg-green-100 text-green-800'
      };
    } else if (assignment.batchType === 'regular' && assignment.assignedBatches?.length > 0) {
      return {
        type: 'Regular Batch',
        batches: assignment.assignedBatches.map(b => b.name).join(', '),
        color: 'bg-blue-100 text-blue-800'
      };
    } else if (assignment.batchType === 'both') {
      const regularBatches = assignment.assignedBatches?.map(b => b.name) || [];
      const placementBatches = assignment.assignedPlacementBatches?.map(b => `${b.batchNumber} - ${b.techStack}`) || [];
      return {
        type: 'Mixed Batches',
        batches: [...regularBatches, ...placementBatches].join(', '),
        color: 'bg-purple-100 text-purple-800'
      };
    }
    return { type: 'Unknown', batches: '', color: 'bg-gray-100 text-gray-800' };
  };

  const calculateStats = () => {
    const total = assignments.length;
    const completed = assignments.filter(a => a.hasSubmitted).length;
    const overdue = assignments.filter(a => a.isOverdue && !a.hasSubmitted).length;
    const pending = total - completed - overdue;
    const upcoming = assignments.filter(a => isUpcoming(a.dueDate) && !a.hasSubmitted).length;

    return { total, completed, pending: pending - upcoming, upcoming };
  };

  if (selectedAssignment) {
    const status = getAssignmentStatus(selectedAssignment);
    const batchInfo = getBatchTypeDisplay(selectedAssignment);

    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Assignments
              </button>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${status.bg} ${status.color}`}>
                {status.text}
              </span>
            </div>

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedAssignment.title}</h1>
              <p className="text-gray-600 mb-4">{selectedAssignment.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-gray-700">
                  <User className="w-5 h-5 mr-2" />
                  <span>Trainer: {selectedAssignment.trainer?.name}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <FileText className="w-5 h-5 mr-2" />
                  <span>Subject: {selectedAssignment.subject}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>Due: {new Date(selectedAssignment.dueDate).toLocaleString()}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>Total Marks: {selectedAssignment.totalMarks}</span>
                </div>
              </div>

              {/* Batch Information */}
              <div className="mb-4">
                <div className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${batchInfo.color}`}>
                  <GraduationCap className="w-4 h-4 mr-1" />
                  {batchInfo.type}
                </div>
                {batchInfo.batches && (
                  <p className="text-sm text-gray-600 mt-1">{batchInfo.batches}</p>
                )}
              </div>

              {selectedAssignment.instructions && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedAssignment.instructions}</p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {(selectedAssignment.attachmentLink || selectedAssignment.attachments?.length > 0) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Assignment Materials</h3>
                  <div className="space-y-2">
                    {selectedAssignment.attachmentLink && (
                      <a
                        href={selectedAssignment.attachmentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Assignment Materials
                      </a>
                    )}
                    {selectedAssignment.attachments?.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {attachment.originalName} ({(attachment.fileSize / 1024 / 1024).toFixed(2)} MB)
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Submissions */}
              {selectedAssignment.submissions?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Your Submissions</h3>
                  {selectedAssignment.submissions.map((submission, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Submission #{index + 1}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(submission.submittedAt).toLocaleString()}
                          {submission.isLate && <span className="text-red-600 ml-2">(Late)</span>}
                        </span>
                      </div>
                      
                      {submission.submissionText && (
                        <div className="mb-2">
                          <strong>Text:</strong> {submission.submissionText}
                        </div>
                      )}
                      
                      {submission.submissionLink && (
                        <div className="mb-2">
                          <strong>Link:</strong> 
                          <a href={submission.submissionLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
                            {submission.submissionLink}
                          </a>
                        </div>
                      )}

                      {submission.submissionFiles?.length > 0 && (
                        <div className="mb-2">
                          <strong>Files:</strong>
                          <ul className="list-disc list-inside ml-4">
                            {submission.submissionFiles.map((file, fileIndex) => (
                              <li key={fileIndex}>
                                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                  {file.originalName}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {submission.score !== undefined && (
                        <div className="bg-white p-3 rounded border-l-4 border-green-500">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Score: {submission.score}/{selectedAssignment.totalMarks}</span>
                            <span className="text-green-600 font-medium">{submission.percentage?.toFixed(1)}% • Grade: {submission.grade}</span>
                          </div>
                          {submission.feedback && (
                            <div className="mt-2">
                              <strong>Feedback:</strong>
                              <p className="text-gray-700">{submission.feedback}</p>
                            </div>
                          )}
                          {submission.remarks && (
                            <div className="mt-1">
                              <strong>Remarks:</strong>
                              <p className="text-gray-600">{submission.remarks}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission Form */}
            {selectedAssignment.canSubmit && !selectedAssignment.isOverdue && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Submit Assignment</h3>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700">{success}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submission Text
                    </label>
                    <textarea
                      value={submissionData.submissionText}
                      onChange={(e) => setSubmissionData({...submissionData, submissionText: e.target.value})}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your submission text here..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submission Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={submissionData.submissionLink}
                      onChange={(e) => setSubmissionData({...submissionData, submissionLink: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Files (Optional)
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum 5 files, 10MB each. Allowed: PDF, DOC, DOCX, TXT, ZIP, RAR, Images
                    </p>
                    {submissionData.submissionFiles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                        <ul className="text-sm text-gray-600">
                          {submissionData.submissionFiles.map((file, index) => (
                            <li key={index}>• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSubmission(selectedAssignment._id)}
                    disabled={loading || (!submissionData.submissionText.trim() && !submissionData.submissionLink.trim() && submissionData.submissionFiles.length === 0)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Assignment
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <p>Remaining attempts: {selectedAssignment.maxAttempts - selectedAssignment.submissionCount}</p>
                  {selectedAssignment.allowLateSubmission && (
                    <p>Late submissions are allowed with {selectedAssignment.lateSubmissionPenalty}% penalty.</p>
                  )}
                </div>
              </div>
            )}

            {selectedAssignment.isOverdue && !selectedAssignment.hasSubmitted && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">This assignment is overdue and can no longer be submitted.</span>
                </div>
              </div>
            )}

            {!selectedAssignment.canSubmit && selectedAssignment.hasSubmitted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">You have reached the maximum number of submissions for this assignment.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main assignment list view
  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-600" />
              My Assignments
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <AssignmentStatsCard {...stats} />

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Available</h3>
              <p className="text-gray-600">No assignments have been assigned to your batch yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => {
                const status = getAssignmentStatus(assignment);
                const batchInfo = getBatchTypeDisplay(assignment);

                return (
                  <div 
                    key={assignment._id} 
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => fetchAssignmentDetails(assignment._id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex-1 pr-2">{assignment.title}</h2>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>{assignment.subject}</span>
                      </div>

                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span>Trainer: {assignment.trainer?.name}</span>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>{assignment.totalMarks} marks • {assignment.maxAttempts} attempt{assignment.maxAttempts !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Batch Information */}
                      <div className="mt-3">
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

                      {/* Submission Status */}
                      {assignment.hasSubmitted && assignment.lastSubmission && (
                        <div className="bg-green-50 p-2 rounded mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-green-800 font-medium">
                              {assignment.lastSubmission.score !== undefined 
                                ? `Score: ${assignment.lastSubmission.score}/${assignment.totalMarks}`
                                : 'Submitted'
                              }
                            </span>
                            {assignment.lastSubmission.grade && (
                              <span className="text-green-600 text-xs">Grade: {assignment.lastSubmission.grade}</span>
                            )}
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Submitted: {new Date(assignment.lastSubmission.submittedAt).toLocaleDateString()}
                            {assignment.lastSubmission.isLate && <span className="text-red-600"> (Late)</span>}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {assignment.submissionCount > 0 && (
                          <span>Attempts: {assignment.submissionCount}/{assignment.maxAttempts}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchAssignmentDetails(assignment._id);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignment;