import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllBatches,
  updateBatch,
  deleteBatch,
  getAllTPOs
} from '../../services/adminService';
import { Pencil, Trash2, Users, AlertCircle, RefreshCw } from 'lucide-react';

function getBatchStatus(startDate, endDate) {
  const now = new Date();
  if (startDate && endDate) {
    if (now <= new Date(endDate)) return 'Ongoing';
    return 'Completed';
  }
  return '-';
}

const BatchListPage = () => {
  const [batches, setBatches] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  // Edit form state
  const [editForm, setEditForm] = useState({
    batchNumber: '',
    colleges: [],
    tpoId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchBatches();
    fetchTPOs();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllBatches();
      setBatches(response.data.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch batches');
      setLoading(false);
    }
  };

  const fetchTPOs = async () => {
    try {
      const response = await getAllTPOs();
      setTpos(response.data.data);
    } catch {
      setError('Failed to fetch TPOs');
    }
  };

  const handleEditClick = (batch) => {
    setSelectedBatch(batch);
    setEditForm({
      batchNumber: batch.batchNumber,
      colleges: batch.colleges,
      tpoId: batch.tpoId._id,
      startDate: batch.startDate ? batch.startDate.slice(0,10) : '',
      endDate: batch.endDate ? batch.endDate.slice(0,10) : '',
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (batch) => {
    setSelectedBatch(batch);
    setShowDeleteConfirm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateBatch(selectedBatch._id, editForm);
      setShowEditModal(false);
      fetchBatches();
    } catch {
      setError('Failed to update batch');
    }
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;

    const confirmMessage = `Are you sure you want to delete this batch?\n\nThis will also delete:\n` +
      `- All placement training batches created from this batch\n` +
      `- All student batch assignments\n` +
      `- All related data\n\n` +
      `This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      await deleteBatch(selectedBatch._id);
      setShowDeleteConfirm(false);
      showToast('success', 'Batch and all related data deleted successfully');
      fetchBatches(); // This will refresh the list
    } catch (error) {
      setError('Failed to delete batch and related data');
      showToast('error', 'Failed to delete batch and related data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = (batchId) => {
    navigate(`/admin/batches/${batchId}/students`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CRT Batches</h1>
        <button
          onClick={fetchBatches}
          className="flex items-center border border-gray-300 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={16} className="mr-1" /> Refresh
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch) => (
          <div key={batch._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Batch {batch.batchNumber}
                </h2>
                <p className="text-gray-600 mt-1">{batch.colleges.join(', ')}</p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Status: </span>
                  <span className={getBatchStatus(batch.startDate, batch.endDate) === 'Ongoing' ? "text-green-600" : "text-gray-600"}>
                    {getBatchStatus(batch.startDate, batch.endDate)}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Start: {batch.startDate ? (new Date(batch.startDate)).toLocaleDateString() : '-'}
                  {" | "}
                  End: {batch.endDate ? (new Date(batch.endDate)).toLocaleDateString() : '-'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditClick(batch)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Edit Batch"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDeleteClick(batch)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  title="Delete Batch"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600">
                TPO: {batch.tpoId?.name || 'Not assigned'}
              </p>
              <p className="text-sm text-gray-600">
                Students: {batch.students?.length || 0}
              </p>
            </div>

            <button
              onClick={() => handleViewStudents(batch._id)}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50"
            >
              <Users size={16} className="mr-2" />
              View Students
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Batch</h3>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={editForm.batchNumber}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        batchNumber: e.target.value
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Colleges</label>
                  <div className="mt-2 space-y-2">
                    {['KIET', 'KIEK', 'KIEW'].map((college) => (
                      <label key={college} className="inline-flex items-center mr-4">
                        <input
                          type="checkbox"
                          checked={editForm.colleges.includes(college)}
                          onChange={(e) => {
                            const colleges = e.target.checked
                              ? [...editForm.colleges, college]
                              : editForm.colleges.filter(c => c !== college);
                            setEditForm({ ...editForm, colleges });
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2">{college}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">TPO</label>
                  <select
                    value={editForm.tpoId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tpoId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="">Select TPO</option>
                    {tpos.map((tpo) => (
                      <option key={tpo._id} value={tpo._id}>{tpo.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, startDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, endDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  <small className="text-xs text-gray-500">You can extend the end date if needed</small>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-600 mr-2" size={24} />
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this batch? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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

export default BatchListPage;
