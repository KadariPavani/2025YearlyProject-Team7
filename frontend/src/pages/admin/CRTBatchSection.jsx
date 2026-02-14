import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Users, AlertCircle } from "lucide-react";
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
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

  useEffect(() => {
    const handler = () => fetchBatches();
    window.addEventListener("refreshCRT", handler);
    return () => window.removeEventListener("refreshCRT", handler);
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
    <>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-xs sm:text-sm">{error}</div>}
      {loading ? (
        <LoadingSkeleton />
      ) : batches.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-xs sm:text-sm">No CRT batches found.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batch</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Colleges</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">TPO</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Students</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((batch, idx) => {
                const status = getBatchStatus(batch);
                return (
                  <tr key={batch._id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">{batch.batchNumber}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        status === "Ongoing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        status === "Not Yet Started" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        "bg-gray-100 text-gray-700 border-gray-200"
                      }`}>{status}</span>
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{(batch.colleges || []).join(", ") || "-"}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{batch.tpoId?.name || "Not assigned"}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{(batch.students && batch.students.length) || 0}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" onClick={() => handleViewStudents(batch._id)} title="View Students">
                          <Users size={14} />
                        </button>
                        <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" onClick={() => openEditModal(batch)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-100 rounded" onClick={() => openDeleteConfirm(batch)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-sm sm:text-lg font-semibold mb-4">Edit Batch</h3>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Batch Number</label>
                  <input type="text" value={editForm.batchNumber} onChange={(e) => setEditForm({ ...editForm, batchNumber: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Colleges</label>
                  <div className="mt-2 space-y-2">
                    {["KIET", "KIEK", "KIEW"].map((college) => (
                      <label key={college} className="inline-flex items-center mr-4 text-xs sm:text-sm">
                        <input type="checkbox" checked={editForm.colleges.includes(college)} onChange={() => handleEditChange("colleges", college)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2">{college}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">TPO</label>
                  <select value={editForm.tpoId} onChange={(e) => setEditForm({ ...editForm, tpoId: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm">
                    <option value="">Select TPO</option>
                    {tpos.map((tpo) => (<option key={tpo._id} value={tpo._id}>{tpo.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Start Date</label>
                  <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">End Date</label>
                  <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm" />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-sm">Save Changes</button>
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
              <h3 className="text-sm sm:text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6 text-xs sm:text-sm">Are you sure you want to delete batch "{selectedBatch?.batchNumber}"? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs sm:text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CRTBatchSection;
