import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Bell, Settings, LogOut, ChevronDown,
  Users, GraduationCap, Eye, BarChart3,
} from "lucide-react";
import PlacementTrainingBatches from "./PlacementTrainingBatches";
// Import CRTBatchSection from the path where you save the new component
import CRTBatchSection from "./CRTBatchSection"; // Adjust path as needed

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[100px]">
      <div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div>
    </div>
  );
}


// Permission label map for display
const PERMISSION_LABELS = {
  canAddAdmin: "Add Admin",
  canAddTrainer: "Add Trainer",
  canAddTPO: "Add TPO",
  canViewActivity: "View Activity"
};

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [dashboard, setDashboard] = useState({ totalTPOs: 0, totalTrainers: 0, totalAdmins: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [showPlacementBatches, setShowPlacementBatches] = useState(false);

  const [visibleList, setVisibleList] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [trainersLoading, setTrainersLoading] = useState(false);
  const [tposLoading, setTposLoading] = useState(false);
  const [adminsLoading, setAdminsLoading] = useState(false);

  const [trainerSearch, setTrainerSearch] = useState("");
  const [tpoSearch, setTpoSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");

  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAdminData = localStorage.getItem("adminData");
    if (storedAdminData) setAdminData(JSON.parse(storedAdminData));
    fetchDashboardAnalytics();
  }, []);

  const fetchWithAuth = async (url) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      handleLogout();
      return null;
    }
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.status === 401) {
        handleLogout();
        return null;
      }
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  };

  const fetchDashboardAnalytics = async () => {
    setAnalyticsLoading(true);
    const data = await fetchWithAuth("/api/admin/dashboard");
    if (data) setDashboard({ ...data, totalAdmins: 0 }); // totalAdmins will be fetched separately
    await fetchAdminsCount();
    setAnalyticsLoading(false);
  };

  const fetchAdminsCount = async () => {
    const data = await fetchWithAuth("/api/admin/admins");
    if (data) {
      setAdmins(data);
      setDashboard(d => ({ ...d, totalAdmins: data.length }));
    }
  };

  const fetchTrainers = async () => {
    setTrainersLoading(true);
    const data = await fetchWithAuth("/api/admin/trainers");
    setTrainers(data || []);
    setTrainersLoading(false);
  };

  const fetchTpos = async () => {
    setTposLoading(true);
    const data = await fetchWithAuth("/api/admin/tpos");
    setTpos(data || []);
    setTposLoading(false);
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    const data = await fetchWithAuth("/api/admin/admins");
    setAdmins(data || []);
    setAdminsLoading(false);
  };

  const toggleList = (type) => {
    if (visibleList === type) {
      setVisibleList(null);
      return;
    }
    setVisibleList(type);
    if (type === "trainers" && trainers.length === 0) fetchTrainers();
    if (type === "tpos" && tpos.length === 0) fetchTpos();
    if (type === "admins" && admins.length === 0) fetchAdmins();
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/");
  };

  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) =>
      t.name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(trainerSearch.toLowerCase())
    );
  }, [trainers, trainerSearch]);

  const filteredTpos = useMemo(() => {
    return tpos.filter((t) =>
      t.name.toLowerCase().includes(tpoSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(tpoSearch.toLowerCase())
    );
  }, [tpos, tpoSearch]);

  const filteredAdmins = useMemo(() => {
    return admins.filter(a =>
      a.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.role.toLowerCase().includes(adminSearch.toLowerCase())
    );
  }, [admins, adminSearch]);

  if (!adminData || analyticsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm opacity-90">Welcome to InfoVerse Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center space-x-1 p-2 text-white hover:text-gray-200 transition-colors"
                >
                  <Settings className="h-6 w-6" />
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate("/admin-profile");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate("/admin-change-password");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Change Password
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* Analytics summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div
            className="bg-white rounded-xl shadow p-6 flex items-center space-x-4 cursor-pointer hover:scale-105 transition"
            onClick={() => toggleList("trainers")}
          >
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <div className="text-gray-900 text-lg font-bold">{dashboard.totalTrainers}</div>
              <div className="text-gray-600 text-sm">Total Trainers</div>
            </div>
          </div>
          <div
            className="bg-white rounded-xl shadow p-6 flex items-center space-x-4 cursor-pointer hover:scale-105 transition"
            onClick={() => toggleList("tpos")}
          >
            <div className="bg-blue-100 p-3 rounded-full">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className="text-gray-900 text-lg font-bold">{dashboard.totalTPOs}</div>
              <div className="text-gray-600 text-sm">Total TPOs</div>
            </div>
          </div>
          <div
            className="bg-white rounded-xl shadow p-6 flex items-center space-x-4 cursor-pointer hover:scale-105 transition"
            onClick={() => toggleList("admins")}
          >
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <div className="text-gray-900 text-lg font-bold">{dashboard.totalAdmins}</div>
              <div className="text-gray-600 text-sm">Total Admins</div>
            </div>
          </div>
        </div>
        {/* CRT Batches Management Section */}
        <CRTBatchSection />
        {/* Admin Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
          {adminData.permissions?.canAddTrainer && (
            <AdminCard
              icon={<GraduationCap className="h-8 w-8 text-green-600" />}
              title="Add Trainer"
              description="Create new trainer account"
              onClick={() => navigate("/add-trainer")}
            />
          )}
          {adminData.permissions?.canViewTrainer && (
            <AdminCard
              icon={<Eye className="h-8 w-8 text-green-600" />}
              title="View Trainers"
              description="Browse all trainers"
              onClick={() => toggleList("trainers")}
            />
          )}
          {adminData.permissions?.canAddTPO && (
            <AdminCard
              icon={<Users className="h-8 w-8 text-blue-600" />}
              title="Add TPO"
              description="Create new TPO account"
              onClick={() => navigate("/add-tpo")}
            />
          )}
          {adminData.permissions?.canViewTPO && (
            <AdminCard
              icon={<Eye className="h-8 w-8 text-blue-600" />}
              title="View TPOs"
              description="Browse all TPOs"
              onClick={() => toggleList("tpos")}
            />
          )}
          {adminData.permissions?.canAddAdmin && (
            <AdminCard
              icon={<Shield className="h-8 w-8 text-purple-600" />}
              title="Add Admin"
              description="Create new admin"
              onClick={() => navigate("/add-admin")}
            />
          )}
        </div>
        {/* Lists to show tables */}
        {visibleList === "trainers" && (
          <SectionTable
            title="Trainer Details"
            loading={trainersLoading}
            searchValue={trainerSearch}
            onSearchChange={setTrainerSearch}
            data={filteredTrainers}
            columns={[
              { label: "Name", key: "name" },
              { label: "Email", key: "email" },
              { label: "Phone", key: "phone" },
              { label: "Employee ID", key: "employeeId" },
              { label: "Experience", key: "experience" },
              { label: "Subject", key: "subjectDealing" },
              { label: "Category", key: "category" },
              { label: "LinkedIn", key: "linkedIn" },
            ]}
          />
        )}
        {visibleList === "tpos" && (
          <SectionTable
            title="TPO Details"
            loading={tposLoading}
            searchValue={tpoSearch}
            onSearchChange={setTpoSearch}
            data={filteredTpos}
            columns={[
              { label: "Name", key: "name" },
              { label: "Email", key: "email" },
              { label: "Phone", key: "phone" },
              { label: "Experience", key: "experience" },
              { label: "LinkedIn", key: "linkedIn" },
              { label: "Status", key: "status" },
              { label: "Last Login", key: "lastLogin" },
            ]}
          />
        )}
        {visibleList === "admins" && (
          <SectionTable
            title="Admin Details"
            loading={adminsLoading}
            searchValue={adminSearch}
            onSearchChange={setAdminSearch}
            data={admins}
            columns={[
              { label: "Email", key: "email" },
              { label: "Role", key: "role" },
              { label: "Can Add Admin", key: "permissions.canAddAdmin", type: "boolean" },
              { label: "Can Add Trainer", key: "permissions.canAddTrainer", type: "boolean" },
              { label: "Can Add TPO", key: "permissions.canAddTPO", type: "boolean" },
              { label: "Can View Activity", key: "permissions.canViewActivity", type: "boolean" },
              { label: "Status", key: "status" },
              { label: "Last Login", key: "lastLogin" },
            ]}
          />
        )}
      </main>

      <button
  className="bg-purple-600 text-white rounded px-4 py-2"
  onClick={() => setShowPlacementBatches(true)}
>
  View Placement Training Batches
</button>
{showPlacementBatches && (
  <PlacementTrainingBatches onClose={() => setShowPlacementBatches(false)} />
)}

    </div>
  );
};

const AdminCard = ({ icon, title, description, onClick }) => (
  <div
    className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyPress={e => e.key === "Enter" && onClick()}
  >
    <div className="flex items-center mb-4">
      <div className="p-3 rounded-lg mr-4 bg-gray-100">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </div>
);


const SectionTable = ({ title, loading, data, columns, searchValue, onSearchChange }) => {
  if (loading) return <LoadingSpinner />;

  const getNestedValue = (obj, key) => key.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);

  return (
    <section className="mt-10 max-w-full overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <input
        type="search"
        className="border border-gray-300 rounded px-3 py-2 mb-4 max-w-sm w-full"
        placeholder="Search..."
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
      />
      {data.length === 0 ? (
        <p className="text-center text-gray-600">No records found.</p>
      ) : (
        <table className="min-w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item._id || item.email} className="hover:bg-gray-50">
                {columns.map(col => {
                  let val = getNestedValue(item, col.key);
                  if (col.type === "boolean") val = val ? "✔️" : "❌";
                  else if (col.key === "lastLogin" && val) val = new Date(val).toLocaleString();
                  else if (val === undefined || val === null) val = "-";
                  return (
                    <td key={col.key} className="border border-gray-300 px-4 py-2">{val}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};


export default AdminDashboard;
