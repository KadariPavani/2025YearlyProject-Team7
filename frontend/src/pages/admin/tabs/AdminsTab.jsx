import React, { useState } from "react";
import { Shield, Pencil, Trash2, Plus } from "lucide-react";

const Badge = ({ label, enabled }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
      enabled
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-gray-50 text-gray-500 border-gray-200"
    }`}
  >
    {enabled ? "+" : "-"} {label}
  </span>
);

const PermissionGroup = ({ title, permissions = {} }) => {
  const keys = ["add", "edit", "delete", "suspend"];
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold text-gray-700">{title}</h4>
      <div className="flex flex-wrap gap-1">
        {keys.map((k) =>
          permissions.hasOwnProperty(k) ? (
            <Badge key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} enabled={!!permissions[k]} />
          ) : null
        )}
      </div>
    </div>
  );
};

const AdminsTab = ({
  adminData,
  adminSearch,
  setAdminSearch,
  adminRoleFilter,
  setAdminRoleFilter,
  adminStatusFilter,
  setAdminStatusFilter,
  adminPermissionFilter,
  setAdminPermissionFilter,
  adminSortBy,
  setAdminSortBy,
  adminSortOrder,
  setAdminSortOrder,
  clearAdminFilters,
  filteredAndSortedAdmins,
  admins,
  handleEditAdmin,
  handleDeleteAdmin,
  navigate,
}) => {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="relative overflow-x-hidden">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Admin Management</h2>
        {adminData?.permissions?.adminControls?.add && (
          <button
            onClick={() => navigate("/add-admin")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
            aria-label="Add Admin"
            title="Add Admin"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Admin</span>
          </button>
        )}
      </div>

      {/* Filters - always visible */}
      <div className="mb-4 bg-white rounded-lg border border-gray-200 p-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Search</label>
            <input
              type="search"
              placeholder="Search by email or role"
              className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
            <select
              value={adminRoleFilter}
              onChange={(e) => setAdminRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin_level_1">Admin Level 1</option>
              <option value="admin_level_2">Admin Level 2</option>
              <option value="admin_level_3">Admin Level 3</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={adminStatusFilter}
              onChange={(e) => setAdminStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Permissions</label>
            <select
              value={adminPermissionFilter}
              onChange={(e) => setAdminPermissionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">All Permissions</option>
              <option value="can_add_admin">Can Add Admin</option>
              <option value="can_edit_admin">Can Edit Admin</option>
              <option value="can_delete_admin">Can Delete Admin</option>
              <option value="can_add_trainer">Can Add Trainer</option>
              <option value="can_edit_trainer">Can Edit Trainer</option>
              <option value="can_delete_trainer">Can Delete Trainer</option>
              <option value="can_add_tpo">Can Add TPO</option>
              <option value="can_edit_tpo">Can Edit TPO</option>
              <option value="can_delete_tpo">Can Delete TPO</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end mt-3">
          <div className="text-xs text-gray-500">
            {filteredAndSortedAdmins.length} of {admins.length} admins
          </div>
        </div>
      </div>

      {filteredAndSortedAdmins.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-medium text-gray-600">No admins found</p>
          <p className="text-xs text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Email</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Role</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Created</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Last Login</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Permissions</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedAdmins.map((admin, idx) => (
                <tr
                  key={admin._id}
                  className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                >
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{admin.email}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 capitalize whitespace-nowrap">{admin.role.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        admin.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {admin.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : "-"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => setExpandedId(expandedId === admin._id ? null : admin._id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {expandedId === admin._id ? "Hide" : "View"}
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {adminData?.permissions?.adminControls?.edit && (
                        <button onClick={() => handleEditAdmin(admin)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {adminData?.permissions?.adminControls?.delete && admin._id !== adminData?._id && (
                        <button onClick={() => handleDeleteAdmin(admin._id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Expanded permissions panel */}
          {expandedId && (() => {
            const admin = filteredAndSortedAdmins.find((a) => a._id === expandedId);
            if (!admin) return null;
            return (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <PermissionGroup title="Admin Controls" permissions={admin.permissions?.adminControls} />
                  <PermissionGroup title="TPO Controls" permissions={admin.permissions?.tpoControls} />
                  <PermissionGroup title="Trainer Controls" permissions={admin.permissions?.trainerControls} />
                </div>
                <div className="mt-3">
                  <Badge label="Can View Activity" enabled={!!admin.permissions?.canViewActivity} />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AdminsTab;
