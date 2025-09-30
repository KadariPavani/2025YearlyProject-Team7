import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Bell, Settings, LogOut, ChevronDown,
  Users, GraduationCap, Eye, BarChart3, TrendingUp, 
  Activity, UserPlus, Calendar, Clock, AlertCircle
} from "lucide-react";
import PlacementTrainingBatches from "./PlacementTrainingBatches";
import CRTBatchSection from "./CRTBatchSection";


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
    totalAdmins: 0 
  });
  const [statistics, setStatistics] = useState({
    recentActivities: [],
    userGrowth: { trainers: 0, tpos: 0, admins: 0 },
    activeUsers: { trainers: 0, tpos: 0, admins: 0 },
    recentLogins: [],
    systemHealth: { uptime: 0, activeConnections: 0 }
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
    
    // Fetch main dashboard data
    const data = await fetchWithAuth("/api/admin/dashboard");
    if (data) setDashboard({ ...data, totalAdmins: 0 });
    
    // Fetch admins count
    await fetchAdminsCount();
    
    // Fetch detailed statistics
    await fetchStatistics();
    
    setAnalyticsLoading(false);
  };


  const fetchAdminsCount = async () => {
    const data = await fetchWithAuth("/api/admin/admins");
    if (data) {
      setAdmins(data);
      setDashboard(d => ({ ...d, totalAdmins: data.length }));
    }
  };


  const fetchStatistics = async () => {
    // Fetch all data to calculate statistics
    const [trainersData, tposData, adminsData] = await Promise.all([
      fetchWithAuth("/api/admin/trainers"),
      fetchWithAuth("/api/admin/tpos"),
      fetchWithAuth("/api/admin/admins")
    ]);


    if (trainersData && tposData && adminsData) {
      // Calculate active users (logged in within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);


      const activeTrainers = trainersData.filter(t => 
        t.lastLogin && new Date(t.lastLogin) > sevenDaysAgo
      ).length;


      const activeTpos = tposData.filter(t => 
        t.lastLogin && new Date(t.lastLogin) > sevenDaysAgo
      ).length;


      const activeAdmins = adminsData.filter(a => 
        a.lastLogin && new Date(a.lastLogin) > sevenDaysAgo
      ).length;


      // Get recent logins (last 5)
      const allUsers = [
        ...trainersData.map(t => ({ ...t, role: 'Trainer' })),
        ...tposData.map(t => ({ ...t, role: 'TPO' })),
        ...adminsData.map(a => ({ ...a, role: 'Admin' }))
      ];


      const recentLogins = allUsers
        .filter(u => u.lastLogin)
        .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
        .slice(0, 5);


      // Calculate growth (users created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);


      const newTrainers = trainersData.filter(t => 
        t.createdAt && new Date(t.createdAt) > thirtyDaysAgo
      ).length;


      const newTpos = tposData.filter(t => 
        t.createdAt && new Date(t.createdAt) > thirtyDaysAgo
      ).length;


      const newAdmins = adminsData.filter(a => 
        a.createdAt && new Date(a.createdAt) > thirtyDaysAgo
      ).length;


      setStatistics({
        activeUsers: {
          trainers: activeTrainers,
          tpos: activeTpos,
          admins: activeAdmins
        },
        userGrowth: {
          trainers: newTrainers,
          tpos: newTpos,
          admins: newAdmins
        },
        recentLogins: recentLogins,
        totalActive: activeTrainers + activeTpos + activeAdmins
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


  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "trainers", label: "Trainers", icon: GraduationCap },
    { id: "tpos", label: "TPOs", icon: Users },
    { id: "admins", label: "Admins", icon: Shield },
    { id: "crt-batches", label: "CRT Batches", icon: GraduationCap },
    { id: "placement-batches", label: "Placement Batches", icon: Users },
  ];


  const totalUsers = dashboard.totalTrainers + dashboard.totalTPOs + dashboard.totalAdmins;


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
              <div className="text-gray-900 text-lg font-bold">{dashboard.totalTrainers}</div>
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
              <div className="text-gray-900 text-lg font-bold">{dashboard.totalTPOs}</div>
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
              <div className="text-gray-900 text-lg font-bold">{dashboard.totalAdmins}</div>
              <div className="text-gray-600 text-sm">Total Admins</div>
            </div>
          </div>
        </div>


        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-red-600 text-red-600"
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
                    value={(statistics.userGrowth?.trainers || 0) + (statistics.userGrowth?.tpos || 0) + (statistics.userGrowth?.admins || 0)}
                    bgColor="bg-purple-50"
                  />
                  <MetricCard
                    icon={<UserPlus className="h-6 w-6 text-orange-600" />}
                    title="Growth Rate"
                    value={totalUsers > 0 ? `${Math.round(((statistics.userGrowth?.trainers || 0) + (statistics.userGrowth?.tpos || 0) + (statistics.userGrowth?.admins || 0)) / totalUsers * 100)}%` : '0%'}
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
                        icon={<GraduationCap className="h-5 w-5 text-green-600" />}
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
                    {statistics.recentLogins && statistics.recentLogins.length > 0 ? (
                      statistics.recentLogins.map((user, idx) => (
                        <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${
                              user.role === 'Trainer' ? 'bg-green-100' :
                              user.role === 'TPO' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              {user.role === 'Trainer' ? <GraduationCap className="h-5 w-5 text-green-600" /> :
                               user.role === 'TPO' ? <Users className="h-5 w-5 text-blue-600" /> :
                               <Shield className="h-5 w-5 text-purple-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name || user.email}</p>
                              <p className="text-sm text-gray-500">{user.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{new Date(user.lastLogin).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">{new Date(user.lastLogin).toLocaleTimeString()}</p>
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
                {adminData.permissions?.canAddTrainer && (
                  <button
                    onClick={() => navigate("/add-trainer")}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-sm font-semibold"
                  >
                    Add Trainer
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
                ]}
              />
            </div>
          )}


          {activeTab === "tpos" && (
            <div>
              <div className="mb-6 flex justify-end">
                {adminData.permissions?.canAddTPO && (
                  <button
                    onClick={() => navigate("/add-tpo")}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm font-semibold"
                  >
                    Add TPO
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
              />
            </div>
          )}


          {activeTab === "admins" && (
            <div>
              <div className="mb-6 flex justify-end">
                {adminData.permissions?.canAddAdmin && (
                  <button
                    onClick={() => navigate("/add-admin")}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md shadow-sm font-semibold"
                  >
                    Add Admin
                  </button>
                )}
              </div>
              <SectionTable
                title="Admin Details"
                loading={adminsLoading}
                searchValue={adminSearch}
                onSearchChange={setAdminSearch}
                data={filteredAdmins}
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
            </div>
          )}


          {activeTab === "crt-batches" && (
            <div>
              <CRTBatchSection />
            </div>
          )}


          {activeTab === "placement-batches" && (
            <div>
              <PlacementTrainingBatches onClose={() => setActiveTab("overview")} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


// New Component: Metric Card
const MetricCard = ({ icon, title, value, bgColor, isPercentage }) => (
  <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
    <div className="flex items-center justify-between mb-2">
      {icon}
    </div>
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
        <span className="text-sm font-semibold text-gray-900">{value} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
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


const AdminCard = ({ icon, title, description, onClick }) => (
  <div
    className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border border-gray-100"
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
    <section className="max-w-full overflow-x-auto">
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

