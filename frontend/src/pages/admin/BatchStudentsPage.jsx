import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBatchStudents, updateStudent, deleteStudent } from '../../services/adminService';
import { ArrowLeft, Pencil, Trash2, Search, ChevronUp, ChevronDown, AlertCircle, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import { Skeleton } from '../../components/ui/Skeleton';

const BatchStudentsPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [batchDetails, setBatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // all, name, email, branch, rollNo
  const [editForm, setEditForm] = useState({
    name: '',
    rollNo: '',
    email: '',
    branch: '',
    yearOfPassing: '',
    college: ''
  });
  const [expandedId, setExpandedId] = useState(null);

  // Compute batch status (mobile-friendly summary)
  const getBatchStatus = (batch) => {
    if (!batch) return 'Unknown';
    const now = new Date();
    const start = batch.startDate ? new Date(batch.startDate) : null;
    const end = batch.endDate ? new Date(batch.endDate) : null;
    if (start && now < start) return 'Not Yet Started';
    if (end && now > end) return 'Completed';
    return 'Ongoing';
  };

  useEffect(() => {
    fetchBatchStudents();
  }, [batchId]);

  // Search functionality - filters students based on query and filter type
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter((student) => {
      const query = searchQuery.toLowerCase().trim();
      
      switch (searchFilter) {
        case 'name':
          return student.name.toLowerCase().includes(query);
        case 'email':
          return student.email.toLowerCase().includes(query);
        case 'branch':
          return student.branch.toLowerCase().includes(query);
        case 'rollNo':
          return student.rollNo.toLowerCase().includes(query);
        default: // 'all'
          return (
            student.name.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query) ||
            student.branch.toLowerCase().includes(query) ||
            student.rollNo.toLowerCase().includes(query)
          );
      }
    });

    setFilteredStudents(filtered);
  }, [searchQuery, searchFilter, students]);

  const fetchBatchStudents = async () => {
    try {
      const response = await getBatchStudents(batchId);
      setStudents(response.data.data);
      setFilteredStudents(response.data.data);
      setBatchDetails(response.data.batchDetails);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch students');
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilter('all');
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      rollNo: student.rollNo,
      email: student.email,
      branch: student.branch,
      yearOfPassing: student.yearOfPassing,
      college: student.college
    });
    setShowEditModal(true);
  };

  const handleDelete = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateStudent(selectedStudent._id, editForm);
      setShowEditModal(false);
      await fetchBatchStudents(); // Refresh the list
      setError(null);
      setLoading(false);
      // Show success message
      toast.success('Student updated successfully! 🎉');
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || 'Failed to update student');
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await deleteStudent(selectedStudent._id);
      setShowDeleteModal(false);
      await fetchBatchStudents(); // Refresh the list
      setError(null);
      setLoading(false);
      // Show success message
      toast.success('Student deleted successfully! 🎉');
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 'Failed to delete student');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-4 shadow">
            <Skeleton className="h-8 w-1/4 mb-4" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 items-center">
                  <Skeleton className="h-6 col-span-2" />
                  <Skeleton className="h-6 col-span-1" />
                  <Skeleton className="h-6 col-span-1" />
                  <Skeleton className="h-6 col-span-1" />
                  <Skeleton className="h-6 col-span-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '8px',
            padding: '12px',
          },
        }}
      />
      {/* Header Section - compact, mobile-first */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">Batch {batchDetails?.batchNumber}</h1>
              <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-3 items-center">
                <span className="truncate"><strong>TPO:</strong> {batchDetails?.tpoId?.name || 'Not assigned'}</span>
                <span>•</span>
                <span className="truncate"><strong>Status:</strong> {getBatchStatus(batchDetails)}</span>
                <span>•</span>
                <span className="truncate"><strong>Students:</strong> {filteredStudents.length}</span>
                <select
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="ml-2 px-2 py-1 text-xs border rounded-md bg-white"
                >
                  <option value="all">All</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="branch">Branch</option>
                  <option value="rollNo">Roll Number</option>
                </select>

                {/* Inline desktop search (appears next to filter on sm+) */}
                <div className="hidden sm:inline-flex items-center ml-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search students..."
                      className="pl-8 pr-8 py-1 text-sm border rounded-md"
                    />
                    {searchQuery && (
                      <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-1 flex items-center">
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate(-1)}
                className="px-2 py-1 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                title="Go back"
              >
                Back
              </button>
            </div>
          </div>

          {/* Mobile small search under header */}
          <div className="sm:hidden mt-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>





      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Mobile Scroll Hint - Only shows on mobile */}
      <div className="block sm:hidden mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm flex items-center">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Swipe left to see all student details →
          </p>
        </div>
      </div>

      {/* Students Table - FIXED COLUMN ALIGNMENT */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Desktop View - Fixed Height with Scrollable Body */}
        <div className="hidden sm:block">
          {/* Fixed Header */}
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Branch</div>
              <div className="col-span-2">Roll Number</div>
              <div className="col-span-2">Actions</div>
            </div>
          </div>
          
          {/* Scrollable Body */}
          <div className="max-h-[450px] overflow-y-auto">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div key={student._id} className="px-4 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center text-sm">
                    {/* Name Column */}
                    <div className="col-span-3">
                      <div className="text-sm font-medium text-gray-900">
                        {student.name}
                      </div>
                    </div>
                    {/* Email Column */}
                    <div className="col-span-3">
                      <div className="text-sm text-gray-500">
                        {student.email}
                      </div>
                    </div>
                    {/* Branch Column */}
                    <div className="col-span-2">
                      <div className="text-sm text-gray-500">
                        {student.branch}
                      </div>
                    </div>
                    {/* Roll Number Column */}
                    <div className="col-span-2">
                      <div className="text-sm text-gray-500">
                        {student.rollNo}
                      </div>
                    </div>
                    {/* Actions Column */}
                    <div className="col-span-2">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          disabled={loading}
                          title="Edit Student"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          disabled={loading}
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500">
                  {searchQuery ? (
                    <div>
                      <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No students found</h3>
                      <p className="text-sm text-gray-500">Try adjusting your search terms or filters</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No students in this batch</h3>
                      <p className="text-sm text-gray-500">Students will appear here once added</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile stacked cards - compact, mobile-first */}
        <div className="sm:hidden space-y-3">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <article key={student._id} className="w-full overflow-hidden box-border bg-white border rounded-lg p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{student.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 truncate">{student.email}</p>
                    <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-3">
                      <span className="truncate">{student.branch || '-'}</span>
                      <span>•</span>
                      <span className="truncate">Roll: {student.rollNo || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <button onClick={() => handleEdit(student)} className="p-1 rounded text-blue-600" title="Edit"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(student)} className="p-1 rounded text-red-600" title="Delete"><Trash2 size={16} /></button>
                    <button onClick={() => setExpandedId(expandedId === student._id ? null : student._id)} className="p-1 rounded border text-gray-600" title="Toggle details"><ChevronDown size={16} /></button>
                  </div>
                </div>

                {expandedId === student._id && (
                  <div className="mt-3 text-xs text-gray-700 space-y-1">
                    <div><strong>College:</strong> {student.college || '-'}</div>
                    <div><strong>Year:</strong> {student.yearOfPassing || '-'}</div>
                    <div><strong>Email:</strong> {student.email}</div>
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className="px-4 py-12 text-center">
              <div className="text-gray-500">
                {searchQuery ? (
                  <div>
                    <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No students found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your search terms or filters</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No students in this batch</h3>
                    <p className="text-sm text-gray-500">Students will appear here once added</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Student</h3>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Roll No</label>
                <input
                  type="text"
                  value={editForm.rollNo}
                  onChange={(e) => setEditForm({ ...editForm, rollNo: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Branch</label>
                <select
                  value={editForm.branch}
                  onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {['AID', 'CSM', 'CAI', 'CSC', 'CSD'].map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year of Passing</label>
                <input
                  type="text"
                  value={editForm.yearOfPassing}
                  onChange={(e) => setEditForm({ ...editForm, yearOfPassing: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">College</label>
                <select
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {['KIET', 'KIEK', 'KIEW'].map(college => (
                    <option key={college} value={college}>{college}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-600 mr-2" size={24} />
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchStudentsPage;