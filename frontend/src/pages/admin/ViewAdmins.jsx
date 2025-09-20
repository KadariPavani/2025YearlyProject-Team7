import React, { useState, useEffect, useMemo } from "react";

const PERMISSIONS_KEYS = [
  "canAddAdmin",
  "canAddTrainer",
  "canAddTPO",
  "canViewActivity"
];

function ViewAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetch("/api/admin/admins", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setAdmins(data.data);
        setLoading(false);
      });
  }, [token]);

  const filteredAdmins = useMemo(() => {
    if (!search) return admins;
    const lowerSearch = search.toLowerCase();
    return admins.filter(admin =>
      admin.email.toLowerCase().includes(lowerSearch) ||
      admin.role.toLowerCase().includes(lowerSearch)
    );
  }, [admins, search]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-4 bg-white rounded shadow mt-10 overflow-x-auto">
      <input
        type="search"
        placeholder="Search by email or role"
        className="border border-gray-300 rounded px-3 py-2 mb-4 w-full max-w-sm"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Role</th>
            {PERMISSIONS_KEYS.map(key => (
              <th key={key} className="border px-4 py-2">{key}</th>
            ))}
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {filteredAdmins.length === 0
            ? <tr><td colSpan={PERMISSIONS_KEYS.length + 4} className="text-center p-4">No admins found.</td></tr>
            : filteredAdmins.map(admin => (
              <tr key={admin._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{admin.email}</td>
                <td className="border px-4 py-2 capitalize">{admin.role.replace('_', ' ')}</td>
                {PERMISSIONS_KEYS.map(key => (
                  <td key={key} className="border px-4 py-2 text-center">
                    {admin.permissions?.[key] ? "✔" : "❌"}
                  </td>
                ))}
                <td className="border px-4 py-2">{admin.status}</td>
                <td className="border px-4 py-2">{new Date(admin.createdAt).toLocaleString()}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

export default ViewAdmins;
