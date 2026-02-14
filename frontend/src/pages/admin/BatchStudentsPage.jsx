import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBatchStudents, updateStudent, deleteStudent } from '../../services/adminService';
import { ArrowLeft, Pencil, Trash2, Search, AlertCircle, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import Header from '../../components/common/Header';

const BatchStudentsPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/super-admin-login");
  };
  const [students, setStudents] = useState([]);
  const [batchDetails, setBatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    branch: '',
    college: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    rollNo: '',
    email: '',
    branch: '',
    yearOfPassing: '',
    college: ''
  });

  useEffect(() => {
    fetchBatchStudents();
  }, [batchId]);

  const fetchBatchStudents = async () => {
    try {
      setLoading(true);
      const response = await getBatchStudents(batchId);
      setStudents(response.data.data);
      setBatchDetails(response.data.batchDetails);
    } catch (error) {
      setError('Failed to fetch students');
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
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
      await fetchBatchStudents();
      toast.success('Student updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await deleteStudent(selectedStudent._id);
      setShowDeleteModal(false);
      await fetchBatchStudents();
      toast.success('Student deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.rollNo?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = (!filters.branch || student.branch === filters.branch) &&
                          (!filters.college || student.college === filters.college);

    return matchesSearch && matchesFilters;
  });

  if (loading && !batchDetails) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title={`Batch ${batchDetails?.batchNumber || ''} Students`}
        subtitle="Manage batch students"
        showTitleInHeader={false}
        userData={adminData}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onLogout={handleLogout}
        onIconClick={() => navigate('/admin-dashboard')}
      />
      <Toaster position="top-center" reverseOrder={false} />

      {/* Back Button - Fixed at top right */}
      <div className="fixed top-24 right-4 sm:right-8 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:text-gray-900 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 pt-24 w-full space-y-4">
        {/* Page Header */}
        <div>
          <h1 className="text-sm sm:text-lg font-semibold text-gray-900">
            Batch {batchDetails?.batchNumber} Students
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            TPO: {batchDetails?.tpoId?.name || 'Not assigned'} • {students.length} students
          </p>
        </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">All Branches</option>
              <option value="AID">AID</option>
              <option value="CSM">CSM</option>
              <option value="CAI">CAI</option>
              <option value="CSD">CSD</option>
              <option value="CSC">CSC</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">College</label>
            <select
              value={filters.college}
              onChange={(e) => setFilters({ ...filters, college: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">All Colleges</option>
              <option value="KIET">KIET</option>
              <option value="KIEK">KIEK</option>
              <option value="KIEW">KIEW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs sm:text-sm text-gray-500">
              {searchQuery ? 'No students found matching your search' : 'No students in this batch'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll No</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Branch</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">College</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Year</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student, idx) => (
                  <tr
                    key={student._id}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{student.name}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.rollNo}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.email}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.branch}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.college}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.yearOfPassing || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4">Edit Student</h3>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Roll No</label>
                <input
                  type="text"
                  value={editForm.rollNo}
                  onChange={(e) => setEditForm({ ...editForm, rollNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
                <select
                  value={editForm.branch}
                  onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select Branch</option>
                  {['AID', 'CSM', 'CAI', 'CSC', 'CSD'].map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year of Passing</label>
                <input
                  type="text"
                  value={editForm.yearOfPassing}
                  onChange={(e) => setEditForm({ ...editForm, yearOfPassing: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">College</label>
                <select
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select College</option>
                  {['KIET', 'KIEK', 'KIEW'].map(college => (
                    <option key={college} value={college}>{college}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedStudent?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs sm:text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="px-4 py-2 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default BatchStudentsPage;
