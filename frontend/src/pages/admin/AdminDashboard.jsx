import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  GraduationCap,
  BarChart3,
  TrendingUp,
  Activity,
  UserPlus,
  Clock,
  AlertCircle,
  Trash2,
  Slash,
} from "lucide-react";
import PlacementTrainingBatches from "./PlacementTrainingBatches";
import CRTBatchSection from "./CRTBatchSection";
import ToastNotification from "../../components/ui/ToastNotification";

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[100px]">
      <div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div>
    </div>
  );
}

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [dashboard, setDashboard] = useState({
    totalTPOs: 0,
    totalTrainers: 0,
    totalAdmins: 0,
  });
  const [statistics, setStatistics] = useState({
    recentLogins: [],
    userGrowth: { trainers: 0, tpos: 0, admins: 0 },
    activeUsers: { trainers: 0, tpos: 0, admins: 0 },
    totalActive: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [trainers, setTrainers] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [trainersLoading, setTrainersLoading] = useState(false);
  const [tposLoading, setTposLoading] = useState(false);
  const [adminsLoading, setAdminsLoading] = useState(false);

  const [trainerSearch, setTrainerSearch] = useState("");
  const [tpoSearch, setTpoSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
// Admin filtering states
const [adminRoleFilter, setAdminRoleFilter] = useState("");
const [adminStatusFilter, setAdminStatusFilter] = useState("");
const [adminPermissionFilter, setAdminPermissionFilter] = useState("");
const [adminSortBy, setAdminSortBy] = useState("email");
const [adminSortOrder, setAdminSortOrder] = useState("asc");

  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

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

  const apiCall = async (url, method = "GET", body = null) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      handleLogout();
      return null;
    }
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : null,
      });
      if (res.status === 401) {
        handleLogout();
        return null;
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API error");
      return json;
    } catch (error) {
      showToast("error", error.message ?? "Network error");
      return null;
    }
  };

  const fetchDashboardAnalytics = async () => {
    setAnalyticsLoading(true);
    const data = await fetchWithAuth("/api/admin/dashboard");
    if (data) setDashboard({ ...data, totalAdmins: 0 });
    await fetchAdminsCount();
    await fetchStatistics();
    setAnalyticsLoading(false);
  };

  const fetchAdminsCount = async () => {
    const data = await fetchWithAuth("/api/admin/admins");
    if (data) {
      setAdmins(data);
      setDashboard((d) => ({ ...d, totalAdmins: data.length }));
    }
  };

  const fetchStatistics = async () => {
    const [trainersData, tposData, adminsData] = await Promise.all([
      fetchWithAuth("/api/admin/trainers"),
      fetchWithAuth("/api/admin/tpos"),
      fetchWithAuth("/api/admin/admins"),
    ]);
    if (trainersData && tposData && adminsData) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeTrainers = trainersData.filter(
        (t) => t.lastLogin && new Date(t.lastLogin) > sevenDaysAgo
      ).length;
      const activeTpos = tposData.filter(
        (t) => t.lastLogin && new Date(t.lastLogin) > sevenDaysAgo
      ).length;
      const activeAdmins = adminsData.filter(
        (a) => a.lastLogin && new Date(a.lastLogin) > sevenDaysAgo
      ).length;
      const allUsers = [
        ...trainersData.map((t) => ({ ...t, role: "Trainer" })),
        ...tposData.map((t) => ({ ...t, role: "TPO" })),
        ...adminsData.map((a) => ({ ...a, role: "Admin" })),
      ];
      const recentLogins = allUsers
        .filter((u) => u.lastLogin)
        .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
        .slice(0, 5);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newTrainers = trainersData.filter(
        (t) => t.createdAt && new Date(t.createdAt) > thirtyDaysAgo
      ).length;
      const newTpos = tposData.filter(
        (t) => t.createdAt && new Date(t.createdAt) > thirtyDaysAgo
      ).length;
      const newAdmins = adminsData.filter(
        (a) => a.createdAt && new Date(a.createdAt) > thirtyDaysAgo
      ).length;

      setStatistics({
        activeUsers: {
          trainers: activeTrainers,
          tpos: activeTpos,
          admins: activeAdmins,
        },
        userGrowth: { trainers: newTrainers, tpos: newTpos, admins: newAdmins },
        recentLogins,
        totalActive: activeTrainers + activeTpos + activeAdmins,
      });
    }
  };

  const fetchTrainers = async () => {
    if (trainers.length > 0) return;
    setTrainersLoading(true);
    const data = await fetchWithAuth("/api/admin/trainers");
    setTrainers(data || []);
    setTrainersLoading(false);
  };

  const fetchTpos = async () => {
    if (tpos.length > 0) return;
    setTposLoading(true);
    const data = await fetchWithAuth("/api/admin/tpos");
    setTpos(data || []);
    setTposLoading(false);
  };

  const fetchAdmins = async () => {
    if (admins.length > 0) return;
    setAdminsLoading(true);
    const data = await fetchWithAuth("/api/admin/admins");
    setAdmins(data || []);
    setAdminsLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "trainers") fetchTrainers();
    if (tab === "tpos") fetchTpos();
    if (tab === "admins") fetchAdmins();
    if (tab === "actions") {
      fetchTrainers();
      fetchTpos();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/");
  };

  const filteredTrainers = useMemo(
    () =>
      trainers.filter(
        (t) =>
          t.name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
          t.email.toLowerCase().includes(trainerSearch.toLowerCase()) ||
          t.employeeId.toLowerCase().includes(trainerSearch.toLowerCase())
      ),
    [trainers, trainerSearch]
  );

  const filteredTpos = useMemo(
    () =>
      tpos.filter(
        (t) =>
          t.name.toLowerCase().includes(tpoSearch.toLowerCase()) ||
          t.email.toLowerCase().includes(tpoSearch.toLowerCase())
      ),
    [tpos, tpoSearch]
  );

// Enhanced filtering and sorting for admins
const filteredAndSortedAdmins = useMemo(() => {
  let filtered = admins.filter(admin => {
    // Search filter
    const searchMatch = 
      admin.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
      admin.role.toLowerCase().includes(adminSearch.toLowerCase());

    // Role filter
    const roleMatch = !adminRoleFilter || admin.role === adminRoleFilter;

    // Status filter
    const statusMatch = !adminStatusFilter || admin.status === adminStatusFilter;

    // Permission filter
    const permissionMatch = !adminPermissionFilter || (() => {
      switch (adminPermissionFilter) {
        case 'can_add_admin': return admin.permissions?.adminControls?.add;
        case 'can_edit_admin': return admin.permissions?.adminControls?.edit;
        case 'can_delete_admin': return admin.permissions?.adminControls?.delete;
        case 'can_add_trainer': return admin.permissions?.trainerControls?.add;
        case 'can_edit_trainer': return admin.permissions?.trainerControls?.edit;
        case 'can_delete_trainer': return admin.permissions?.trainerControls?.delete;
        case 'can_add_tpo': return admin.permissions?.tpoControls?.add;
        case 'can_edit_tpo': return admin.permissions?.tpoControls?.edit;
        case 'can_delete_tpo': return admin.permissions?.tpoControls?.delete;
        default: return true;
      }
    })();

    return searchMatch && roleMatch && statusMatch && permissionMatch;
  });

  // Sorting
  filtered.sort((a, b) => {
    let aVal, bVal;
    
    switch (adminSortBy) {
      case 'email':
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
        break;
      case 'role':
        aVal = a.role;
        bVal = b.role;
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt);
        bVal = new Date(b.createdAt);
        break;
      case 'lastLogin':
        aVal = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
        bVal = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
        break;
      default:
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
    }

    if (adminSortOrder === 'desc') {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    } else {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    }
  });

  return filtered;
}, [admins, adminSearch, adminRoleFilter, adminStatusFilter, adminPermissionFilter, adminSortBy, adminSortOrder]);

const clearAdminFilters = () => {
  setAdminSearch("");
  setAdminRoleFilter("");
  setAdminStatusFilter("");
  setAdminPermissionFilter("");
  setAdminSortBy("email");
  setAdminSortOrder("asc");
};


  const handleSuspendToggle = async (entityType, id) => {
    const res = await apiCall(
      `/api/admin/${entityType}/${id}/toggle-status`,
      "PATCH"
    );
    if (res) {
      showToast("success", `${entityType.slice(0, -1)} status updated.`);
      refreshData();
    }
  };
// Admin Edit and Delete Handlers
const handleEditAdmin = async (admin) => {
  // Check if CURRENT admin has edit permission
  if (!adminData?.permissions?.adminControls?.edit) {
    showToast("error", "You don't have permission to edit admins");
    return;
  }
  
  // Simple inline edit for now - you can replace this with a modal
  const newRole = prompt(`Change role for ${admin.email}:\n\nOptions:\n- super_admin\n- admin_level_1\n- admin_level_2\n- admin_level_3`, admin.role);
  
  if (newRole && newRole !== admin.role && ['super_admin', 'admin_level_1', 'admin_level_2', 'admin_level_3'].includes(newRole)) {
    const res = await apiCall(`/api/admin/admins/${admin._id}`, "PUT", { role: newRole });
    if (res) {
      showToast("success", "Admin updated successfully.");
      fetchAdmins(); // Refresh the data
    }
  } else if (newRole && !['super_admin', 'admin_level_1', 'admin_level_2', 'admin_level_3'].includes(newRole)) {
    showToast("error", "Invalid role selected");
  }
};

const handleDeleteAdmin = async (id) => {
  // Check if CURRENT admin has delete permission
  if (!adminData?.permissions?.adminControls?.delete) {
    showToast("error", "You don't have permission to delete admins");
    return;
  }
  
  if (!window.confirm("Are you sure you want to delete this admin? This cannot be undone.")) return;
  
  const res = await apiCall(`/api/admin/admins/${id}`, "DELETE");
  if (res) {
    showToast("success", "Admin deleted successfully.");
    setAdmins(admins.filter(a => a._id !== id));
  }
};


const handleDelete = async (entityType, id) => {
  const entityName = entityType.slice(0, -1); // e.g., "trainer" or "tpo"
  const permissionGroup = entityType === 'trainers' ? 'trainerControls' : 'tpoControls';

  // Check permission
  if (!adminData?.permissions?.[permissionGroup]?.delete) {
    showToast("error", `You don't have permission to delete ${entityType}`);
    return;
  }

  if (!window.confirm(`Are you sure you want to delete this ${entityName}? This cannot be undone.`)) return;

  const res = await apiCall(`/api/admin/${entityType}/${id}`, "DELETE");
  if (res) {
    showToast("success", `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} deleted successfully.`);
    if (entityType === 'trainers') {
      setTrainers(trainers.filter(t => t._id !== id));
    } else if (entityType === 'tpos') {
      setTpos(tpos.filter(t => t._id !== id));
    }
    refreshData(); // Optional: refresh analytics if needed
  }
};

  const refreshData = () => {
    fetchTrainers();
    fetchTpos();
    fetchAdmins();
    fetchDashboardAnalytics();
  };

  if (!adminData || analyticsLoading) return <LoadingSpinner />;

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "trainers", label: "Trainers", icon: GraduationCap },
    { id: "tpos", label: "TPOs", icon: Users },
    { id: "admins", label: "Admins", icon: Shield },
    { id: "actions", label: "Actions", icon: AlertCircle },
    { id: "crt-batches", label: "CRT Batches", icon: GraduationCap },
    { id: "placement-batches", label: "Placement Batches", icon: Users },
  ];

  const totalUsers =
    dashboard.totalTrainers + dashboard.totalTPOs + dashboard.totalAdmins;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* Header */}
    <header className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Left Section - Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Welcome Admin..!</h1>
              <p className="text-sm opacity-90">
                Manage Trainers, Batches & Students
              </p>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-6">
            {/* Notification Icon */}
            <button className="relative p-2 text-white hover:text-gray-100 transition-colors">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
            </button>

            {/* Profile and Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="flex items-center space-x-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
              >
                <img
                  src={adminData?.profileImage || "/default-avatar.png"}
                  alt="Admin"
                  className="h-8 w-8 rounded-full border border-white"
                />
                <span className="text-sm font-medium">
                  {adminData?.name || "Admin"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Dropdown */}
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

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-white text-indigo-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div
            className="bg-white rounded-xl shadow p-6 flex items-center space-x-4 cursor-pointer hover:scale-105 transition"
            onClick={() => handleTabChange("trainers")}
          >
            <div className="bg-green-100 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <div className="text-gray-900 text-lg font-bold">
                {dashboard.totalTrainers}
              </div>
              <div className="text-gray-600 text-sm">Total Trainers</div>
            </div>
          </div>
          <div
            className="bg-white rounded-xl shadow p-6 flex items-center space-x-4 cursor-pointer hover:scale-105 transition"
            onClick={() => handleTabChange("tpos")}
          >
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className="text-gray-900 text-lg font-bold">
                {dashboard.totalTPOs}
              </div>
              <div className="text-gray-600 text-sm">Total TPOs</div>
            </div>
          </div>
          <div
            className="bg-white rounded-xl shadow p-6 flex items-center space-x-4 cursor-pointer hover:scale-105 transition"
            onClick={() => handleTabChange("admins")}
          >
            <div className="bg-purple-100 p-3 rounded-full">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <div className="text-gray-900 text-lg font-bold">
                {dashboard.totalAdmins}
              </div>
              <div className="text-gray-600 text-sm">Total Admins</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "border-b-2 border-red-600 text-red-600"
                        : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Professional Statistics Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-red-600" />
                  System Statistics
                </h2>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <MetricCard
                    icon={<Users className="h-6 w-6 text-blue-600" />}
                    title="Total Users"
                    value={totalUsers}
                    bgColor="bg-blue-50"
                  />
                  <MetricCard
                    icon={<Activity className="h-6 w-6 text-green-600" />}
                    title="Active Users (7d)"
                    value={statistics.totalActive || 0}
                    bgColor="bg-green-50"
                  />
                  <MetricCard
                    icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
                    title="New Users (30d)"
                    value={
                      (statistics.userGrowth?.trainers || 0) +
                      (statistics.userGrowth?.tpos || 0) +
                      (statistics.userGrowth?.admins || 0)
                    }
                    bgColor="bg-purple-50"
                  />
                  <MetricCard
                    icon={<UserPlus className="h-6 w-6 text-orange-600" />}
                    title="Growth Rate"
                    value={
                      totalUsers > 0
                        ? `${Math.round(
                            (((statistics.userGrowth?.trainers || 0) +
                              (statistics.userGrowth?.tpos || 0) +
                              (statistics.userGrowth?.admins || 0)) /
                              totalUsers) *
                              100
                          )}%`
                        : "0%"
                    }
                    bgColor="bg-orange-50"
                    isPercentage={true}
                  />
                </div>

                {/* Detailed Statistics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* User Distribution */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-gray-700" />
                      User Distribution
                    </h3>
                    <div className="space-y-3">
                      <DistributionBar
                        label="Trainers"
                        value={dashboard.totalTrainers}
                        total={totalUsers}
                        color="bg-green-500"
                      />
                      <DistributionBar
                        label="TPOs"
                        value={dashboard.totalTPOs}
                        total={totalUsers}
                        color="bg-blue-500"
                      />
                      <DistributionBar
                        label="Admins"
                        value={dashboard.totalAdmins}
                        total={totalUsers}
                        color="bg-purple-500"
                      />
                    </div>
                  </div>

                  {/* Active Users Breakdown */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-green-700" />
                      Active Users (Last 7 Days)
                    </h3>
                    <div className="space-y-4">
                      <ActiveUserStat
                        label="Active Trainers"
                        value={statistics.activeUsers?.trainers || 0}
                        total={dashboard.totalTrainers}
                        icon={
                          <GraduationCap className="h-5 w-5 text-green-600" />
                        }
                      />
                      <ActiveUserStat
                        label="Active TPOs"
                        value={statistics.activeUsers?.tpos || 0}
                        total={dashboard.totalTPOs}
                        icon={<Users className="h-5 w-5 text-blue-600" />}
                      />
                      <ActiveUserStat
                        label="Active Admins"
                        value={statistics.activeUsers?.admins || 0}
                        total={dashboard.totalAdmins}
                        icon={<Shield className="h-5 w-5 text-purple-600" />}
                      />
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-gray-700" />
                      Recent Login Activity
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {statistics.recentLogins &&
                    statistics.recentLogins.length > 0 ? (
                      statistics.recentLogins.map((user, idx) => (
                        <div
                          key={idx}
                          className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-2 rounded-full ${
                                user.role === "Trainer"
                                  ? "bg-green-100"
                                  : user.role === "TPO"
                                  ? "bg-blue-100"
                                  : "bg-purple-100"
                              }`}
                            >
                              {user.role === "Trainer" ? (
                                <GraduationCap className="h-5 w-5 text-green-600" />
                              ) : user.role === "TPO" ? (
                                <Users className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Shield className="h-5 w-5 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.name || user.email}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.role}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {new Date(user.lastLogin).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(user.lastLogin).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center text-gray-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No recent login activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "trainers" && (
            <div>
              <div className="mb-6 flex justify-end">
                {adminData.permissions?.trainerControls?.add && (
                  <button
                    onClick={() => navigate("/add-trainer")}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-sm font-semibold"
                  >
                    <UserPlus className="h-5 w-5 mr-2" /> Add Trainer
                  </button>
                )}
              </div>
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
                  { label: "Status", key: "status" },
                ]}
                actions={(trainer) => (
                  <>
                    {/* {adminData.permissions?.trainerControls?.edit && (
            <button
              onClick={() => navigate(`/edit-trainer/${trainer._id}`)}
              className="mr-2 text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <Eye className="h-5 w-5" />
            </button>
          )} */}
                    {adminData.permissions?.trainerControls?.suspend && (
                      <button
                        onClick={() =>
                          handleSuspendToggle("trainers", trainer._id)
                        }
                        className={`mr-2 ${
                          trainer.status === "active"
                            ? "text-red-600"
                            : "text-green-600"
                        } hover:text-opacity-80`}
                        title={
                          trainer.status === "active" ? "Suspend" : "Activate"
                        }
                      >
                        <Slash className="h-5 w-5" />
                      </button>
                    )}
                    {adminData.permissions?.trainerControls?.delete && (
                      <button
                        onClick={() => handleDelete("trainers", trainer._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </>
                )}
              />
            </div>
          )}

          {activeTab === "tpos" && (
            <div>
              <div className="mb-6 flex justify-end">
                {adminData.permissions?.tpoControls?.add && (
                  <button
                    onClick={() => navigate("/add-tpo")}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm font-semibold"
                  >
                    <UserPlus className="h-5 w-5 mr-2" /> Add TPO
                  </button>
                )}
              </div>
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
                actions={(tpo) => (
                  <>
                    {/* {adminData.permissions?.tpoControls?.edit && (
            <button
              onClick={() => navigate(`/edit-tpo/${tpo._id}`)}
              className="mr-2 text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <Eye className="h-5 w-5" />
            </button>
          )} */}
                    {adminData.permissions?.tpoControls?.suspend && (
                      <button
                        onClick={() => handleSuspendToggle("tpos", tpo._id)}
                        className={`mr-2 ${
                          tpo.status === "active"
                            ? "text-red-600"
                            : "text-green-600"
                        } hover:text-opacity-80`}
                        title={tpo.status === "active" ? "Suspend" : "Activate"}
                      >
                        <Slash className="h-5 w-5" />
                      </button>
                    )}
                    {adminData.permissions?.tpoControls?.delete && (
                      <button
                        onClick={() => handleDelete("tpos", tpo._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </>
                )}
              />
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-12">
              <SectionTable
                title="Suspended Trainers"
                loading={trainersLoading}
                searchValue={trainerSearch}
                onSearchChange={setTrainerSearch}
                data={trainers.filter((t) => t.status === "inactive")}
                columns={[
                  { label: "Name", key: "name" },
                  { label: "Email", key: "email" },
                  { label: "Phone", key: "phone" },
                  { label: "Employee ID", key: "employeeId" },
                  { label: "Experience", key: "experience" },
                  { label: "Subject", key: "subjectDealing" },
                  { label: "Category", key: "category" },
                  { label: "LinkedIn", key: "linkedIn" },
                  { label: "Status", key: "status" },
                ]}
                actions={(trainer) => (
                  <>
                    {adminData.permissions?.canSuspendTrainer && (
                      <button
                        onClick={() =>
                          handleSuspendToggle("trainers", trainer._id)
                        }
                        className="mr-4 text-green-600 hover:underline"
                      >
                        Activate
                      </button>
                    )}
                    {adminData.permissions?.canDeleteTrainer && (
                      <button
                        onClick={() => handleDelete("trainers", trainer._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              />
              <SectionTable
                title="Suspended TPOs"
                loading={tposLoading}
                searchValue={tpoSearch}
                onSearchChange={setTpoSearch}
                data={tpos.filter((t) => t.status === "inactive")}
                columns={[
                  { label: "Name", key: "name" },
                  { label: "Email", key: "email" },
                  { label: "Phone", key: "phone" },
                  { label: "Experience", key: "experience" },
                  { label: "LinkedIn", key: "linkedIn" },
                  { label: "Status", key: "status" },
                  { label: "Last Login", key: "lastLogin" },
                ]}
                actions={(tpo) => (
                  <>
                    {adminData.permissions?.canSuspendTPO && (
                      <button
                        onClick={() => handleSuspendToggle("tpos", tpo._id)}
                        className="mr-4 text-green-600 hover:underline"
                      >
                        Activate
                      </button>
                    )}
                    {adminData.permissions?.canDeleteTPO && (
                      <button
                        onClick={() => handleDelete("tpos", tpo._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              />
            </div>
          )}

{activeTab === "admins" && (
  <div>
    <div className="mb-6 flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
      {adminData?.permissions?.adminControls?.add && (
        <button 
          onClick={() => navigate('/add-admin')}
          className="bg-purple-700 hover:bg-purple-800 text-white py-2 px-5 rounded-md shadow-md font-semibold transition"
        >
          Add Admin
        </button>
      )}
    </div>

    {/* Advanced Filters */}
    <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="search"
            placeholder="Search by email or role"
            className="border border-gray-300 rounded px-3 py-2 w-full"
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
          />
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={adminRoleFilter}
            onChange={(e) => setAdminRoleFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin_level_1">Admin Level 1</option>
            <option value="admin_level_2">Admin Level 2</option>
            <option value="admin_level_3">Admin Level 3</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={adminStatusFilter}
            onChange={(e) => setAdminStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Permission Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
          <select
            value={adminPermissionFilter}
            onChange={(e) => setAdminPermissionFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
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

      {/* Sort and View Options */}
      <div className="flex flex-wrap items-center justify-between mt-4 gap-4">
        <div className="flex items-center space-x-4">
          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={adminSortBy}
              onChange={(e) => setAdminSortBy(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="status">Status</option>
              <option value="createdAt">Created Date</option>
              <option value="lastLogin">Last Login</option>
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setAdminSortOrder(adminSortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center space-x-1 px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            <span>{adminSortOrder === 'asc' ? '↑' : '↓'}</span>
            <span>{adminSortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          </button>

          {/* Clear Filters */}
          <button
            onClick={clearAdminFilters}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:underline"
          >
            Clear All Filters
          </button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedAdmins.length} of {admins.length} admins
        </div>
      </div>
    </div>

    {/* Admin Cards Grid */}
    <div className="grid gap-6">
      {filteredAndSortedAdmins.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium">No admins found</p>
          <p className="text-sm">Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        filteredAndSortedAdmins.map((admin) => (
          <div key={admin._id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Admin Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{admin.email}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    admin.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {admin.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <p className="capitalize">
                    <strong>Role:</strong> {admin.role.replace(/_/g, " ")}
                  </p>
                  <p>
                    <strong>Created:</strong> {new Date(admin.createdAt).toLocaleDateString()}
                  </p>
                  {admin.lastLogin && (
                    <p>
                      <strong>Last Login:</strong> {new Date(admin.lastLogin).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                {adminData?.permissions?.adminControls?.edit && (
                  <button 
                    className="text-indigo-600 hover:text-indigo-800 hover:underline text-sm font-medium" 
                    onClick={() => handleEditAdmin(admin)}
                  >
                    ✏️ Edit
                  </button>
                )}
                {adminData?.permissions?.adminControls?.delete && admin._id !== adminData?._id && (
                  <button 
                    className="text-red-600 hover:text-red-800 hover:underline text-sm font-medium" 
                    onClick={() => handleDeleteAdmin(admin._id)}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Admin Controls */}
              <PermissionGroup 
                title="Admin Controls" 
                permissions={admin.permissions.adminControls} 
                color="purple" 
              />
              
              {/* TPO Controls */}
              <PermissionGroup 
                title="TPO Controls" 
                permissions={admin.permissions.tpoControls} 
                color="blue" 
              />
              
              {/* Trainer Controls */}
              <PermissionGroup 
                title="Trainer Controls" 
                permissions={admin.permissions.trainerControls} 
                color="green" 
              />
            </div>

            {/* View Activity Permission */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Additional Permissions</h4>
                <Badge 
                  label="Can View Activity" 
                  enabled={admin.permissions.canViewActivity} 
                  color="gray" 
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}






          {activeTab === "crt-batches" && (
            <div>
              <CRTBatchSection />
            </div>
          )}

          {activeTab === "placement-batches" && (
            <div>
              <PlacementTrainingBatches
                onClose={() => setActiveTab("overview")}
              />
            </div>
          )}
        </div>
      </main>

      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// New Component: Metric Card
const MetricCard = ({ icon, title, value, bgColor, isPercentage }) => (
  <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
    <div className="flex items-center justify-between mb-2">{icon}</div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600 mt-1">{title}</p>
  </div>
);

// New Component: Distribution Bar
const DistributionBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// New Component: Active User Stat
const ActiveUserStat = ({ label, value, total, icon }) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {icon}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-600">{percentage}% of total</p>
      </div>
    </div>
  );
};

const SectionTable = ({
  title,
  loading,
  data,
  columns,
  searchValue,
  onSearchChange,
  actions,
}) => {
  if (loading) return <LoadingSpinner />;

  const getNestedValue = (obj, key) =>
    key.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);

  return (
    <section className="max-w-full overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <input
        type="search"
        className="border border-gray-300 rounded px-3 py-2 mb-4 max-w-sm w-full"
        placeholder="Search..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {data.length === 0 ? (
        <p className="text-center text-gray-600">No records found.</p>
      ) : (
        <table className="min-w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item._id || item.email} className="hover:bg-gray-50">
                {columns.map((col) => {
                  let val = getNestedValue(item, col.key);
                  if (col.type === "boolean") val = val ? "✔️" : "❌";
                  else if (col.key === "lastLogin" && val)
                    val = new Date(val).toLocaleString();
                  else if (val === undefined || val === null) val = "-";
                  return (
                    <td
                      key={col.key}
                      className="border border-gray-300 px-4 py-2"
                    >
                      {val}
                    </td>
                  );
                })}
                {actions && (
                  <td className="border border-gray-300 px-4 py-2">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};


// Permissions Group Component
const PermissionGroup = ({ title, permissions, color }) => (
  <div>
    <h4 className={`mb-2 font-semibold text-${color}-600`}>{title}</h4>
    <div className="flex flex-wrap gap-2">
      {["add", "edit", "delete", "suspend"].map((perm) => (
        permissions && permissions.hasOwnProperty(perm) ? (
          <Badge key={perm} label={perm.charAt(0).toUpperCase() + perm.slice(1)} enabled={permissions[perm]} color={color} />
        ) : null
      ))}
    </div>
  </div>
);

// Badge Component
const Badge = ({ label, enabled, color }) => {
  const baseColor = {
    purple: "purple",
    blue: "blue",
    green: "green",
    gray: "gray",
  }[color] || "gray";

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold select-none bg-${baseColor}-100 text-${baseColor}-800`}>
      {enabled ? "✔️" : "✖️"} {label}
    </span>
  );
};

export default AdminDashboard;
