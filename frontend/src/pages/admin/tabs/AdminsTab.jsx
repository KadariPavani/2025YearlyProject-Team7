import React, { useState } from "react";
import { Shield, ChevronDown, ChevronUp, Pencil, Trash2, Plus } from "lucide-react";

const Badge = ({ label, enabled, color = "gray" }) => {
  const map = {
    purple: "bg-blue-100 text-blue-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
  };
  const cls = map[color] || map.gray;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold select-none ${cls}`}>
      {enabled ? "✔️" : "✖️"} {label}
    </span>
  );
};

const PermissionGroup = ({ title, permissions = {}, color }) => {
  const keys = ["add", "edit", "delete", "suspend"];
  return (
    <div>
      <h4 className={`mb-2 font-semibold ${color === 'purple' ? 'text-blue-600' : color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-blue-600' : 'text-gray-700'}`}>{title}</h4>
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => (
          permissions.hasOwnProperty(k) ? (
            <Badge key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} enabled={!!permissions[k]} color={color} />
          ) : null
        ))}
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
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="relative overflow-x-hidden">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Admin Management</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="sm:hidden inline-flex items-center px-2 py-2 border rounded-md text-sm bg-white"
            aria-expanded={showFilters}
            aria-label="Toggle filters"
          >
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {adminData?.permissions?.adminControls?.add && (
            <button
              onClick={() => navigate('/add-admin')}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md focus:outline-none ml-2"
              aria-label="Add Admin"
              title="Add Admin"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters - responsive: collapsible on mobile, visible on sm+ */}
      <div className={`mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg border ${showFilters ? 'block' : 'hidden'} sm:block`}>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <input
              type="search"
              placeholder="Search by email or role"
              className="border border-gray-300 rounded px-2 py-1 h-8 text-xs w-full appearance-none"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={adminRoleFilter}
              onChange={(e) => setAdminRoleFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 h-8 text-xs w-full appearance-none"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin_level_1">Admin Level 1</option>
              <option value="admin_level_2">Admin Level 2</option>
              <option value="admin_level_3">Admin Level 3</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={adminStatusFilter}
              onChange={(e) => setAdminStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 h-8 text-xs w-full appearance-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Permissions</label>
            <select
              value={adminPermissionFilter}
              onChange={(e) => setAdminPermissionFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 h-8 text-xs w-full appearance-none"
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={adminSortBy}
                onChange={(e) => setAdminSortBy(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
              >
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="status">Status</option>
                <option value="createdAt">Created Date</option>
                <option value="lastLogin">Last Login</option>
              </select>
            </div>

            <button
              onClick={() => setAdminSortOrder(adminSortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center space-x-1 px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
            >
              <span>{adminSortOrder === 'asc' ? '↑' : '↓'}</span>
              <span className="hidden sm:inline text-xs">{adminSortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>

            <button
              onClick={clearAdminFilters}
              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:underline"
            >
              Clear
            </button>
          </div>

          <div className="text-xs sm:text-sm text-gray-600 truncate whitespace-nowrap">Showing {filteredAndSortedAdmins.length} of {admins.length} admins</div>
        </div>
      </div>

      {/* Admin Cards Grid */}
      <div className="grid gap-4">
        {filteredAndSortedAdmins.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-base font-medium">No admins found</p>
            <p className="text-xs">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          filteredAndSortedAdmins.map((admin) => (
            <article key={admin._id} className="bg-white border rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition">
              {/* Desktop layout (sm+) - original structure restored */}
              <header className="hidden sm:flex items-start justify-between gap-3 w-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{admin.email}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${admin.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{admin.status}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600">
                    <p className="capitalize"><strong>Role:</strong> {admin.role.replace(/_/g, " ")}</p>
                    <p><strong>Created:</strong> {new Date(admin.createdAt).toLocaleDateString()}</p>
                    {admin.lastLogin && <p><strong>Last Login:</strong> {new Date(admin.lastLogin).toLocaleDateString()}</p>}
                  </div>
                </div>

                <div className="flex-shrink-0 ml-4 flex flex-col items-end gap-2">
                  {adminData?.permissions?.adminControls?.edit && (
                    <button onClick={() => handleEditAdmin(admin)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">✏️ Edit</button>
                  )}
                  {adminData?.permissions?.adminControls?.delete && admin._id !== adminData?._id && (
                    <button onClick={() => handleDeleteAdmin(admin._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">🗑️ Delete</button>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === admin._id ? null : admin._id)}
                    aria-expanded={expandedId === admin._id}
                    className="p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    title="Toggle details"
                  >
                    {expandedId === admin._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </header>

              {/* Mobile layout (<sm) - compact */}
              <header className="sm:hidden">
                <h3 className="text-sm font-semibold text-gray-900 truncate break-words">{admin.email}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${admin.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{admin.status}</span>

                  {adminData?.permissions?.adminControls?.edit && (
                    <button onClick={() => handleEditAdmin(admin)} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-xs">
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  {adminData?.permissions?.adminControls?.delete && admin._id !== adminData?._id && (
                    <button onClick={() => handleDeleteAdmin(admin._id)} className="inline-flex items-center text-red-600 hover:text-red-800 text-xs">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setExpandedId(expandedId === admin._id ? null : admin._id)}
                    aria-expanded={expandedId === admin._id}
                    className="p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    title="Toggle details"
                  >
                    {expandedId === admin._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </header>

              <div className={`${expandedId === admin._id ? 'mt-4 block' : 'hidden mt-4'} border-t pt-4`}> 
                <div className="mb-3 text-xs sm:text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <p className="truncate"><strong>Role:</strong> {admin.role.replace(/_/g, " ")}</p>
                  <p className="truncate"><strong>Created:</strong> {new Date(admin.createdAt).toLocaleDateString()}</p>
                  {admin.lastLogin && <p className="truncate"><strong>Last Login:</strong> {new Date(admin.lastLogin).toLocaleDateString()}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PermissionGroup title="Admin Controls" permissions={admin.permissions?.adminControls} color="purple" />
                  <PermissionGroup title="TPO Controls" permissions={admin.permissions?.tpoControls} color="blue" />
                  <PermissionGroup title="Trainer Controls" permissions={admin.permissions?.trainerControls} color="green" />
                </div>

                <div className="mt-4 flex items-center justify-start">
                  <div className="flex items-center gap-2">
                    <Badge label="Can View Activity" enabled={!!admin.permissions?.canViewActivity} color="gray" />
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>


    </div>
  );
};

export default AdminsTab;
