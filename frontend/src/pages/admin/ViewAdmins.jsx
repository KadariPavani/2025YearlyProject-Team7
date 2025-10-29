import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Toast function (customize as needed)
const showToast = (type, message) => {
  // Implement your notification logic here
  alert(`${type}: ${message}`);
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[100px]">
    <div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div>
  </div>
);

const ViewAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/admins", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAdmins(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const filteredAdmins = useMemo(() => {
    if (!search) return admins;
    const lowerSearch = search.toLowerCase();
    return admins.filter(
      (admin) =>
        admin.email.toLowerCase().includes(lowerSearch) ||
        admin.role.toLowerCase().includes(lowerSearch)
    );
  }, [admins, search]);

  // Handler to edit admin (navigates to edit page)
  const handleEdit = (admin) => {
    navigate(`/edit-admin/${admin._id}`);
  };

  // Handler to delete admin
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/admins/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json());
    if (res.success) {
      showToast("success", "Admin deleted successfully.");
      setAdmins(admins.filter(a => a._id !== id));
    } else {
      showToast("error", res.message || "Failed to delete admin.");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-4 bg-white rounded shadow mt-10 overflow-x-auto">
      <input
        type="search"
        placeholder="Search by email or role"
        className="border border-gray-300 rounded px-3 py-2 mb-4 w-full max-w-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Role</th>
            <th className="border px-4 py-2">Add Admin</th>
            <th className="border px-4 py-2">Edit Admin</th>
            <th className="border px-4 py-2">Delete Admin</th>
            <th className="border px-4 py-2">Add Trainer</th>
            <th className="border px-4 py-2">Edit Trainer</th>
            <th className="border px-4 py-2">Suspend Trainer</th>
            <th className="border px-4 py-2">Delete Trainer</th>
            <th className="border px-4 py-2">Add TPO</th>
            <th className="border px-4 py-2">Edit TPO</th>
            <th className="border px-4 py-2">Suspend TPO</th>
            <th className="border px-4 py-2">Delete TPO</th>
            <th className="border px-4 py-2">View Activity</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Created At</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAdmins.length === 0 ? (
            <tr>
              <td colSpan={17} className="text-center p-4">
                No admins found.
              </td>
            </tr>
          ) : (
            filteredAdmins.map((admin) => (
              <tr key={admin._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{admin.email}</td>
                <td className="border px-4 py-2 capitalize">{admin.role.replace(/_/g, " ")}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.adminControls?.add ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.adminControls?.edit ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.adminControls?.delete ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.trainerControls?.add ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.trainerControls?.edit ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.trainerControls?.suspend ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.trainerControls?.delete ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.tpoControls?.add ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.tpoControls?.edit ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.tpoControls?.suspend ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.tpoControls?.delete ? "✔" : "❌"}</td>
                <td className="border px-4 py-2 text-center">{admin.permissions?.canViewActivity ? "✔" : "❌"}</td>
                <td className="border px-4 py-2">{admin.status}</td>
                <td className="border px-4 py-2">{new Date(admin.createdAt).toLocaleString()}</td>
                <td className="border px-4 py-2 flex gap-2">
                  {admin.permissions?.adminControls?.edit && (
                    <button
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => handleEdit(admin)}
                    >
                      Edit
                    </button>
                  )}
                  {admin.permissions?.adminControls?.delete && (
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(admin._id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ViewAdmins;
