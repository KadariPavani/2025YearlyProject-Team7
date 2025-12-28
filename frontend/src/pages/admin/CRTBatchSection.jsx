import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Users, AlertCircle, ChevronDown } from "lucide-react";
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import { getAllBatches, updateBatch, deleteBatch, getAllTPOs } from "../../services/adminService";
import { Skeleton } from "../../components/ui/skeleton";
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
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchBatches();
    fetchTPOs();
  }, []);

  // Listen for a simple event dispatched by the parent tab to refresh batches
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
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {loading ? (
        <LoadingSkeleton />
      ) : batches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No CRT batches found.</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {batches.map((batch) => {
              const status = getBatchStatus(batch);
              return (
                <article key={batch._id} className="w-full overflow-hidden box-border bg-white border rounded-lg p-2 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-semibold leading-tight truncate">{batch.batchNumber}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 truncate">{batch.tpoId?.name || 'Not assigned'} • {(batch.students && batch.students.length) || 0}</p>
                      <div className="mt-1">
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full ${status === "Ongoing" ? "bg-blue-100 text-blue-800" : status === "Not Yet Started" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <button className="w-7 h-7 flex items-center justify-center rounded-md text-blue-600 hover:bg-blue-50" onClick={() => handleViewStudents(batch._id)} title="View Students" aria-label="View Students"><Users size={14} /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-md text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(batch)} title="Edit" aria-label="Edit"><Pencil size={14} /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-50" onClick={() => openDeleteConfirm(batch)} title="Delete" aria-label="Delete"><Trash2 size={14} /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-md border text-gray-600 hover:bg-gray-50" onClick={() => setExpandedId(expandedId === batch._id ? null : batch._id)} title="Toggle details" aria-label="Toggle details"><ChevronDown size={14} /></button>
                    </div>
                  </div>

                  {expandedId === batch._id && (
                    <div className="mt-3 text-xs text-gray-700 space-y-1">
                      <div><strong>Colleges:</strong> {(batch.colleges || []).join(', ') || '-'}</div>
                      <div><strong>Start:</strong> {batch.startDate ? batch.startDate.slice(0,10): '-'}</div>
                      <div><strong>End:</strong> {batch.endDate ? batch.endDate.slice(0,10): '-'}</div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-1.5 border-b text-left">Batch</th>
                  <th className="px-3 py-1.5 border-b text-left">Colleges</th>
                  <th className="px-3 py-1.5 border-b text-left">TPO</th>
                  <th className="px-3 py-1.5 border-b text-left">Students</th>
                  <th className="px-3 py-1.5 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const status = getBatchStatus(batch);
                  return (
                    <tr key={batch._id} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 border-b font-semibold">
                        <div className="leading-tight">{batch.batchNumber}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className={status === "Ongoing" ? "text-blue-600" : status === "Not Yet Started" ? "text-blue-600" : "text-gray-600"}>{status}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 border-b">{(batch.colleges || []).join(", ")}</td>
                      <td className="px-3 py-1.5 border-b">{batch.tpoId?.name || "Not assigned"}</td>
                      <td className="px-3 py-1.5 border-b">{(batch.students && batch.students.length) || 0}</td>
                      <td className="px-3 py-3 pb-2.5 border-b flex gap-2">
                        <button className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded" onClick={() => handleViewStudents(batch._id)} title="View Students" aria-label="View Students">
                          <Users size={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded" onClick={() => openEditModal(batch)} title="Edit Batch" aria-label="Edit Batch">
                          <Pencil size={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded" onClick={() => openDeleteConfirm(batch)} title="Delete Batch" aria-label="Delete Batch">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
    </>
  );
};

export default CRTBatchSection;