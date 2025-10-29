import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Users, RefreshCw, AlertCircle } from "lucide-react";
import { getAllBatches, updateBatch, deleteBatch, getAllTPOs } from "../../services/adminService";

const CRTBatchSection = () => {
  const [batches, setBatches] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    batchNumber: "",
    colleges: [],
    tpoId: "",
    startDate: "",
    endDate: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
    fetchTPOs();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAllBatches();
      setBatches(response.data.data);
    } catch {
      setError("Failed to fetch CRT batches.");
    }
    setLoading(false);
  };

  const fetchTPOs = async () => {
    try {
      const response = await getAllTPOs();
      setTpos(response.data.data);
    } catch {
      setError("Failed to fetch TPOs.");
    }
  };

  const getBatchStatus = (batch) => {
    const now = new Date();
    const start = batch.startDate ? new Date(batch.startDate) : null;
    const end = batch.endDate ? new Date(batch.endDate) : null;
    if (start && now < start) return "Not Yet Started";
    if (end && now > end) return "Completed";
    return "Ongoing";
  };

  const openEditModal = (batch) => {
    setSelectedBatch(batch);
    setEditForm({
      batchNumber: batch.batchNumber || "",
      colleges: batch.colleges || [],
      tpoId: batch.tpoId?._id || "",
      startDate: batch.startDate ? batch.startDate.slice(0, 10) : "",
      endDate: batch.endDate ? batch.endDate.slice(0, 10) : ""
    });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    if (field === "colleges") {
      let newColleges;
      if (editForm.colleges.includes(value)) {
        newColleges = editForm.colleges.filter((c) => c !== value);
      } else {
        newColleges = [...editForm.colleges, value];
      }
      setEditForm({ ...editForm, colleges: newColleges });
    } else {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateBatch(selectedBatch._id, editForm);
      setShowEditModal(false);
      fetchBatches();
    } catch {
      alert("Failed to update batch.");
    }
  };

  const openDeleteConfirm = (batch) => {
    setSelectedBatch(batch);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteBatch(selectedBatch._id);
      setShowDeleteConfirm(false);
      fetchBatches();
    } catch {
      alert("Failed to delete batch.");
    }
  };

  const handleViewStudents = (batchId) => {
    navigate(`/admin/batches/${batchId}/students`);
  };

  return (
    <section className="bg-white rounded-xl shadow p-6 mt-12">
      {/* Updated responsive header section */}
      <div className="mb-6 space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">CRT Batches Management</h2>
          <p className="text-gray-500 text-sm">Manage and view all CRT batches easily from here.</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <button 
            onClick={() => navigate("/crt-management")} 
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition text-sm"
          >
            <Plus size={16} className="mr-2" /> Manage CRT Batches
          </button>
          <button 
            onClick={fetchBatches} 
            className="flex items-center justify-center border border-gray-300 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 text-sm" 
            title="Refresh"
          >
            <RefreshCw size={16} className="mr-1" /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-b-green-500"></div>
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No CRT batches found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border-b text-left">Batch Number</th>
                <th className="px-4 py-2 border-b text-left">Colleges</th>
                <th className="px-4 py-2 border-b text-left">TPO</th>
                <th className="px-4 py-2 border-b text-left">Students</th>
                <th className="px-4 py-2 border-b text-left">Status</th>
                <th className="px-4 py-2 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const status = getBatchStatus(batch);
                return (
                  <tr key={batch._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b font-semibold">{batch.batchNumber}</td>
                    <td className="px-4 py-2 border-b">{(batch.colleges || []).join(", ")}</td>
                    <td className="px-4 py-2 border-b">{batch.tpoId?.name || "Not assigned"}</td>
                    <td className="px-4 py-2 border-b">{(batch.students && batch.students.length) || 0}</td>
                    <td className="px-4 py-2 border-b">
                      <span className={status === "Ongoing" ? "text-green-600" : status === "Not Yet Started" ? "text-yellow-600" : "text-gray-600"}>{status}</span>
                    </td>
                    <td className="px-4 py-2 border-b flex gap-2">
                      <button className="text-green-600 hover:bg-green-50 rounded p-2" onClick={() => handleViewStudents(batch._id)} title="View Students">
                        <Users size={16} />
                      </button>
                      <button className="text-blue-600 hover:bg-blue-50 rounded p-2" onClick={() => openEditModal(batch)} title="Edit Batch">
                        <Pencil size={16} />
                      </button>
                      <button className="text-gray-600 hover:bg-gray-50 rounded p-2" onClick={() => openDeleteConfirm(batch)} title="Delete Batch">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
                      setEditForm({ ...editForm, batchNumber: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Colleges</label>
                  <div className="mt-2 space-y-2">
                    {["KIET", "KIEK", "KIEW"].map((college) => (
                      <label key={college} className="inline-flex items-center mr-4">
                        <input
                          type="checkbox"
                          checked={editForm.colleges.includes(college)}
                          onChange={() => handleEditChange("colleges", college)}
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
                      <option key={tpo._id} value={tpo._id}>
                        {tpo.name}
                      </option>
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
                  <small className="text-xs text-gray-500">
                    You can extend the end date if needed
                  </small>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-600 mr-2" size={24} />
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete batch "{selectedBatch?.batchNumber}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CRTBatchSection;