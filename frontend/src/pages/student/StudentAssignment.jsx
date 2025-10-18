import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Upload, CheckCircle, XCircle } from 'lucide-react';

const StudentAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('userToken');
        if (!token) throw new Error('No user token found');

        const response = await axios.get('/api/assignments/student/list', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setAssignments(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch assignments');
        console.error('Error fetching assignments:', err);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

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
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) setError(`Invalid file type for ${file.name}`);
      if (!isValidSize) setError(`File ${file.name} exceeds 10MB limit`);
      return isValidType && isValidSize;
    });
    setSelectedFiles(files);
    console.log('Selected files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
  };

  const handleSubmit = async (assignmentId) => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to submit');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('No user token found');

      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      console.log('Submitting formData for assignment:', assignmentId);
      for (let [key, value] of formData.entries()) {
        console.log(`FormData entry: ${key}=${value.name || value}`);
      }

      const response = await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSelectedFiles([]);
      // Refresh assignments
      const refreshResponse = await axios.get('/api/assignments/student/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(Array.isArray(refreshResponse.data) ? refreshResponse.data : []);
      console.log('Submission response:', response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
      console.error('Error submitting assignment:', err);
    } finally {
      setUploading(false);
    }
  };

  const renderAssignmentList = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-blue-600" />
        My Assignments
      </h2>
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
          <p className="text-gray-400">Check back later for new assignments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg text-gray-900">{assignment.title}</h3>
              <div className="space-y-2 text-sm text-gray-600 mt-2">
                <p><strong>Subject:</strong> {assignment.subject}</p>
                <p><strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
                <p><strong>Marks:</strong> {assignment.totalMarks}</p>
                <p><strong>Status:</strong> {assignment.hasSubmitted ? (
                  <span className="text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> Submitted
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" /> Not Submitted
                  </span>
                )}</p>
                {assignment.hasSubmitted && (
                  <>
                    <p><strong>Score:</strong> {assignment.score !== null ? assignment.score : 'Not graded'}</p>
                    <p><strong>Feedback:</strong> {assignment.feedback || 'No feedback provided'}</p>
                  </>
                )}
                <p><strong>Assigned to:</strong></p>
                <div className="mt-1">
                  {assignment.assignedBatches?.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                      Regular: {assignment.assignedBatches.map(b => b.name).join(', ')}
                    </span>
                  )}
                  {assignment.assignedPlacementBatches?.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Placement: {assignment.assignedPlacementBatches.map(b => `${b.batchNumber} - ${b.techStack}`).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              {!assignment.hasSubmitted && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.png,.pdf,.doc,.docx,.txt,.zip,.rar"
                    onChange={handleFileChange}
                    className="mb-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={() => handleSubmit(assignment._id)}
                    disabled={uploading || selectedFiles.length === 0}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {renderAssignmentList()}
    </div>
  );
};

export default StudentAssignment;