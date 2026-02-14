import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
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
  Home,
  MessageSquare,
  Search,
  Briefcase,
  BookOpen,
  Plus,
  RefreshCw,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import PlacementTrainingBatches from "./PlacementTrainingBatches";
import CRTBatchSection from "./CRTBatchSection";
import ToastNotification from "../../components/ui/ToastNotification";
import Header from "../../components/common/Header";
import TrainersTab from "./tabs/TrainersTab";
import TpoTab from "./tabs/TpoTab";
import AdminsTab from "./tabs/AdminsTab";
import ContactsTab from "./tabs/ContactsTab";
import BottomNav from '../../components/common/BottomNav';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const Skeleton = ({ className = "h-4 bg-gray-200 rounded" }) => (
  <div className={`animate-pulse ${className}`} />
);


const AdminDashboard = () => {
  const navigate = useNavigate();
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
  const [visibleTabsCount, setVisibleTabsCount] = useState(100);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const moreRef = useRef(null);
  const dropdownRef = useRef(null);
  const navRef = useRef(null);
  const [dropdownCoords, setDropdownCoords] = useState(null);

  const handleMoreToggle = (e) => {
    e.stopPropagation();
    if (!moreRef.current) {
      setShowMoreDropdown(s => !s);
      return;
    }
    const rect = moreRef.current.getBoundingClientRect();
    const width = 224;
    const top = rect.bottom + 8;
    const left = Math.max(8, rect.right - width);
    setDropdownCoords({ top, left, width });
    setShowMoreDropdown(s => !s);
  };

  // Recompute dropdown position on resize/scroll while open
  useEffect(() => {
    if (!showMoreDropdown) return;
    const handleReposition = () => {
      if (!moreRef.current) return;
      const rect = moreRef.current.getBoundingClientRect();
      const width = 224;
      const top = rect.bottom + 8;
      const left = Math.max(8, rect.right - width);
      setDropdownCoords({ top, left, width });
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [showMoreDropdown]);

  // Reset to all tabs on resize, then let useLayoutEffect trim
  useEffect(() => {
    const reset = () => { setVisibleTabsCount(100); setShowMoreDropdown(false); };
    window.addEventListener('resize', reset);
    // Also re-trigger when crossing the sm breakpoint (nav hidden ↔ visible)
    const mql = window.matchMedia('(min-width: 640px)');
    const onBreakpoint = () => { setVisibleTabsCount(100); setShowMoreDropdown(false); };
    mql.addEventListener('change', onBreakpoint);
    return () => { window.removeEventListener('resize', reset); mql.removeEventListener('change', onBreakpoint); };
  }, []);

  // Cascade: after each render, if nav overflows, reduce by 1 (runs before paint)
  // No dependency array so it re-runs when nav first appears after loading
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.offsetWidth === 0) return; // skip if nav is hidden
    // Fast-forward: jump to actual child count instead of decrementing one-by-one
    const childCount = nav.children.length;
    if (childCount > 0 && visibleTabsCount > childCount) {
      setVisibleTabsCount(childCount);
      return;
    }
    if (nav.scrollWidth > nav.clientWidth + 2 && visibleTabsCount > 1) {
      setVisibleTabsCount(v => v - 1);
    }
  });

  useEffect(() => {
    const onDocClick = (e) => {
      if (moreRef.current && moreRef.current.contains(e.target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setShowMoreDropdown(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const [trainers, setTrainers] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [trainersLoading, setTrainersLoading] = useState(false);
  const [tposLoading, setTposLoading] = useState(false);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);

  const [trainerSearch, setTrainerSearch] = useState("");
  const [tpoSearch, setTpoSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
// Admin filtering states
const [adminRoleFilter, setAdminRoleFilter] = useState("");
const [adminStatusFilter, setAdminStatusFilter] = useState("");
const [adminPermissionFilter, setAdminPermissionFilter] = useState("");
const [adminSortBy, setAdminSortBy] = useState("email");
const [adminSortOrder, setAdminSortOrder] = useState("asc");


  const [toast, setToast] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      const finalUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;
      const res = await fetch(finalUrl, {
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
      const finalUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;
      const res = await fetch(finalUrl, {
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

  const fetchContacts = async () => {
    setContactsLoading(true);
    const data = await fetchWithAuth("/api/contacts");
    setContacts(data || []);
    setContactsLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "trainers") fetchTrainers();
    if (tab === "tpos") fetchTpos();
    if (tab === "admins") fetchAdmins();
    if (tab === "contacts") fetchContacts();
    if (tab === "actions") {
      fetchTrainers();
      fetchTpos();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/super-admin-login");
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

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
          (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase())) ||
          c.phone.toLowerCase().includes(contactSearch.toLowerCase()) ||
          (c.message && c.message.toLowerCase().includes(contactSearch.toLowerCase()))
      ),
    [contacts, contactSearch]
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

const handleDeleteContact = async (id) => {
  if (!window.confirm("Are you sure you want to delete this contact submission?")) return;

  const res = await apiCall(`/api/contacts/${id}`, "DELETE");
  if (res) {
    showToast("success", "Contact deleted successfully.");
    setContacts(contacts.filter(c => c._id !== id));
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

  if (!adminData || analyticsLoading) return <LoadingSkeleton />;

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "trainers", label: "Trainers", icon: GraduationCap },
    { id: "tpos", label: "TPOs", icon: Users },
    { id: "admins", label: "Admins", icon: Shield },
    { id: "contacts", label: "Contacts", icon: MessageSquare },
    { id: "actions", label: "Actions", icon: AlertCircle },
    { id: "crt-batches", label: "CRT Batches", icon: BookOpen },
    { id: "placement-batches", label: "Placement Batches", icon: Briefcase },
  ];

  const totalUsers =
    dashboard.totalTrainers + dashboard.totalTPOs + dashboard.totalAdmins;

  return (
    <div className="min-h-screen bg-white">
      <Header
        title="Welcome Admin..!"
        subtitle="Manage Trainers, Batches & Students"
        icon={Shield}
        userData={adminData}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onLogout={handleLogout}
        onIconClick={() => {
          if (window.location.pathname === '/admin-dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/admin-dashboard');
          }
        }}
      />

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8 pt-24 pb-[220px] sm:pb-8">
        {/* Page header (moved out of Header component) */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{`Welcome, ${adminData?.name  || 'Admin'}`}</h1>
              <p className="text-sm text-gray-600 mt-1">Manage Trainers, Batches & Students</p>
            </div>
          </div>
        </div>

        
        {/* Analytics Summary Cards: desktop grid + compact mobile scroller */}
        {/* Desktop: 3 cards */}
        <div className="hidden sm:grid grid-cols-3 gap-6 mb-8">
          <div
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow p-6 flex items-center space-x-4 cursor-pointer  transition border border-blue-200"
            onClick={() => handleTabChange("trainers")}
          >
            <div className="bg-blue-600 p-3 rounded-full flex items-center justify-center text-white">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-gray-900 text-lg font-bold">
                {dashboard.totalTrainers}
              </div>
              <div className="text-gray-600 text-sm">Total Trainers</div>
            </div>
          </div>
          <div
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow p-6 flex items-center space-x-4 cursor-pointer transition border border-blue-200"
            onClick={() => handleTabChange("tpos")}
          >
            <div className="bg-blue-600 p-3 rounded-full flex items-center justify-center text-white">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-gray-900 text-lg font-bold">
                {dashboard.totalTPOs}
              </div>
              <div className="text-gray-600 text-sm">Total TPOs</div>
            </div>
          </div>
          <div
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow p-6 flex items-center space-x-4 cursor-pointer transition border border-blue-200"
            onClick={() => handleTabChange("admins")}
          >
            <div className="bg-blue-600 p-3 rounded-full flex items-center justify-center text-white">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-gray-900 text-lg font-bold">
                {dashboard.totalAdmins}
              </div>
              <div className="text-gray-600 text-sm">Total Admins</div>
            </div>
          </div>
        </div>

        {/* Mobile: compact non-scrolling metrics bar (icon above text) */}
        <div className="sm:hidden flex gap-2 mb-6">
          <button onClick={() => handleTabChange("trainers")} className="flex-1 flex flex-col items-center gap-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg py-2 px-2 shadow-sm min-w-0 border border-blue-200">
            <div className="bg-blue-600 p-2 rounded-full flex-shrink-0 flex items-center justify-center text-white">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="text-center min-w-0">
              <div className="text-gray-900 font-semibold text-sm truncate">{dashboard.totalTrainers} <span className="text-[11px] text-gray-500">Trainers</span></div>
            </div>
          </button>

          <button onClick={() => handleTabChange("tpos")} className="flex-1 flex flex-col items-center gap-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg py-2 px-2 shadow-sm min-w-0 border border-blue-200">
            <div className="bg-blue-600 p-2 rounded-full flex-shrink-0 flex items-center justify-center text-white">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="text-center min-w-0">
              <div className="text-gray-900 font-semibold text-sm truncate">{dashboard.totalTPOs} <span className="text-[11px] text-gray-500">TPOs</span></div>
            </div>
          </button>

          <button onClick={() => handleTabChange("admins")} className="flex-1 flex flex-col items-center gap-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg py-2 px-2 shadow-sm min-w-0 border border-blue-200">
            <div className="bg-blue-600 p-2 rounded-full flex-shrink-0 flex items-center justify-center text-white">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="text-center min-w-0">
              <div className="text-gray-900 font-semibold text-sm truncate">{dashboard.totalAdmins} <span className="text-[11px] text-gray-500">Admins</span></div>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav ref={navRef} className="hidden sm:flex items-center space-x-2 overflow-hidden">
              {tabs.slice(0, visibleTabsCount).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "border-b-2 border-blue-700 text-blue-700"
                        : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              {tabs.length > visibleTabsCount && (
                <div className="relative ml-auto" ref={moreRef}>
                  <button
                    onClick={handleMoreToggle}
                    aria-label="More"
                    className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border-transparent rounded"
                  >
                    <span>More</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showMoreDropdown && dropdownCoords && (
                    <div
                      ref={dropdownRef}
                      style={{ position: 'fixed', top: dropdownCoords.top, left: dropdownCoords.left, width: dropdownCoords.width }}
                      className="bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    >
                      <ul className="divide-y divide-gray-100">
                        {tabs.slice(visibleTabsCount).map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <li key={tab.id}>
                              <button
                                onClick={() => { handleTabChange(tab.id); setShowMoreDropdown(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"
                              >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
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
                  <BarChart3 className="h-6 w-6 mr-2 text-blue-700" />
                  System Statistics
                </h2>

                {/* Key Metrics Row */}
                {/* Mobile compact metrics (2 per row, icon above, single-line label) */}
                <div className="sm:hidden grid grid-cols-2 gap-2 mb-4">
                  <button onClick={() => handleTabChange('overview')} className="flex flex-col items-center bg-white rounded-lg p-2 shadow-sm">
                    <Users className="h-5 w-5 text-blue-600 mb-1" />
                    <div className="text-center text-sm font-semibold text-gray-900 truncate">{totalUsers} <span className="text-[11px] text-gray-500">Users</span></div>
                  </button>
                  <button onClick={() => handleTabChange('overview')} className="flex flex-col items-center bg-white rounded-lg p-2 shadow-sm">
                    <Activity className="h-5 w-5 text-blue-600 mb-1" />
                    <div className="text-center text-sm font-semibold text-gray-900 truncate">{statistics.totalActive || 0} <span className="text-[11px] text-gray-500">Active</span></div>
                  </button>
                  <button onClick={() => handleTabChange('overview')} className="flex flex-col items-center bg-white rounded-lg p-2 shadow-sm">
                    <TrendingUp className="h-5 w-5 text-blue-600 mb-1" />
                    <div className="text-center text-sm font-semibold text-gray-900 truncate">{((statistics.userGrowth?.trainers||0)+(statistics.userGrowth?.tpos||0)+(statistics.userGrowth?.admins||0))} <span className="text-[11px] text-gray-500">New</span></div>
                  </button>
                  <button onClick={() => handleTabChange('overview')} className="flex flex-col items-center bg-white rounded-lg p-2 shadow-sm">
                    <UserPlus className="h-5 w-5 text-blue-600 mb-1" />
                    <div className="text-center text-sm font-semibold text-gray-900 truncate">{totalUsers>0?`${Math.round((((statistics.userGrowth?.trainers||0)+(statistics.userGrowth?.tpos||0)+(statistics.userGrowth?.admins||0))/totalUsers)*100)}%`:'0%'} <span className="text-[11px] text-gray-500">Growth</span></div>
                  </button>
                </div>

                <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <MetricCard
                    icon={<Users className="h-6 w-6 text-blue-600" />}
                    title="Total Users"
                    value={totalUsers}
                    bgColor="bg-blue-50"
                  />
                  <MetricCard
                    icon={<Activity className="h-6 w-6 text-blue-600" />}
                    title="Active Users (7d)"
                    value={statistics.totalActive || 0}
                    bgColor="bg-blue-50"
                  />
                  <MetricCard
                    icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
                    title="New Users (30d)"
                    value={
                      (statistics.userGrowth?.trainers || 0) +
                      (statistics.userGrowth?.tpos || 0) +
                      (statistics.userGrowth?.admins || 0)
                    }
                    bgColor="bg-blue-50"
                  />
                  <MetricCard
                    icon={<UserPlus className="h-6 w-6 text-blue-600" />}
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
                    bgColor="bg-blue-50"
                    isPercentage={true}
                  />
                </div>

                {/* Detailed Statistics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* User Distribution */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-700" />
                      User Distribution
                    </h3>
                    <div className="space-y-3">
                      <DistributionBar
                        label="Trainers"
                        value={dashboard.totalTrainers}
                        total={totalUsers}
                        color="bg-blue-500"
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
                        color="bg-blue-500"
                      />
                    </div>
                  </div>

                  {/* Active Users Breakdown */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-blue-700" />
                      Active Users (Last 7 Days)
                    </h3>
                    <div className="space-y-4">
                      <ActiveUserStat
                        label="Active Trainers"
                        value={statistics.activeUsers?.trainers || 0}
                        total={dashboard.totalTrainers}
                        icon={
                          <GraduationCap className="h-5 w-5 text-blue-600" />
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
                        icon={<Shield className="h-5 w-5 text-blue-600" />}
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

                  {/* Desktop list (sm+) */}
                  <div className="hidden sm:block divide-y divide-gray-200">
                    {statistics.recentLogins && statistics.recentLogins.length > 0 ? (
                      statistics.recentLogins.map((user, idx) => (
                        <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${user.role === "Trainer" ? "bg-blue-100" : user.role === "TPO" ? "bg-blue-100" : "bg-blue-100"}`}>
                              {user.role === "Trainer" ? (
                                <GraduationCap className="h-5 w-5 text-blue-600" />
                              ) : user.role === "TPO" ? (
                                <Users className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Shield className="h-5 w-5 text-blue-600" />
                              )}
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

                  {/* Mobile compact list (icon left + two-line summary) */}
                  <div className="sm:hidden">
                    {statistics.recentLogins && statistics.recentLogins.length > 0 ? (
                      statistics.recentLogins.map((user, idx) => (
                        <div key={idx} className="py-3 px-3 border-b border-gray-100 flex items-center">
                          <div className="mr-3 flex-shrink-0">
                            {user.role === "Trainer" ? (
                              <GraduationCap className="h-6 w-6 text-blue-600" />
                            ) : user.role === "TPO" ? (
                              <Users className="h-6 w-6 text-blue-600" />
                            ) : (
                              <Shield className="h-6 w-6 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{user.name || user.email}</div>
                            <div className="text-xs text-gray-500 truncate">{user.role} • {new Date(user.lastLogin).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-gray-500">
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
            trainersLoading ? (
              <LoadingSkeleton />
            ) : (
              <TrainersTab
                adminData={adminData}
                trainersLoading={trainersLoading}
                trainerSearch={trainerSearch}
                setTrainerSearch={setTrainerSearch}
                filteredTrainers={filteredTrainers}
                navigate={navigate}
                handleSuspendToggle={handleSuspendToggle}
                handleDelete={handleDelete}
                SectionTable={SectionTable}
              />
            )
          )}

          {activeTab === "tpos" && (
            tposLoading ? (
              <LoadingSkeleton />
            ) : (
              <TpoTab
                adminData={adminData}
                tposLoading={tposLoading}
                tpoSearch={tpoSearch}
                setTpoSearch={setTpoSearch}
                filteredTpos={filteredTpos}
                navigate={navigate}
                handleSuspendToggle={handleSuspendToggle}
                handleDelete={handleDelete}
                SectionTable={SectionTable}
              />
            )
          )}

          {activeTab === "actions" && (
            (trainersLoading || tposLoading) ? (
              <LoadingSkeleton />
            ) : (
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
                          className="mr-4 text-blue-600 hover:underline"
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
                          className="mr-4 text-blue-600 hover:underline"
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
            )
          )}

{activeTab === "admins" && (
  adminsLoading ? (
    <LoadingSkeleton />
  ) : (
    <AdminsTab
      adminData={adminData}
      adminSearch={adminSearch}
      setAdminSearch={setAdminSearch}
      adminRoleFilter={adminRoleFilter}
      setAdminRoleFilter={setAdminRoleFilter}
      adminStatusFilter={adminStatusFilter}
      setAdminStatusFilter={setAdminStatusFilter}
      adminPermissionFilter={adminPermissionFilter}
      setAdminPermissionFilter={setAdminPermissionFilter}
      adminSortBy={adminSortBy}
      setAdminSortBy={setAdminSortBy}
      adminSortOrder={adminSortOrder}
      setAdminSortOrder={setAdminSortOrder}
      clearAdminFilters={clearAdminFilters}
      filteredAndSortedAdmins={filteredAndSortedAdmins}
      admins={admins}
      handleEditAdmin={handleEditAdmin}
      handleDeleteAdmin={handleDeleteAdmin}
      navigate={navigate}
    />
  )
)}

          {activeTab === "contacts" && (
            <ContactsTab
              adminData={adminData}
              contactsLoading={contactsLoading}
              contactSearch={contactSearch}
              setContactSearch={setContactSearch}
              filteredContacts={filteredContacts}
              handleDeleteContact={handleDeleteContact}
              SectionTable={SectionTable}
            />
          )}


          {activeTab === "crt-batches" && (
            <div className="mb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 ">CRT Batches Management</h3>
                </div>

                <div className="flex items-center gap-2 p-4">
                  <button
                    onClick={() => navigate('/crt-management')}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md focus:outline-none flex-shrink-0"
                    aria-label="Add CRT Batch"
                    title="Add CRT Batch"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

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

          {/* Mobile bottom navigation (visible on small screens only) */}
          <div className="sm:hidden">
            <BottomNav tabs={tabs} active={activeTab} onChange={handleTabChange} />
          </div>
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
  <div className={`rounded-xl p-4 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm`}>
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
  const [expandedId, setExpandedId] = useState(null);

  // Use the unified LoadingSkeleton for all table and card loading states
  if (loading) return <LoadingSkeleton />;

  const getNestedValue = (obj, key) =>
    key.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);

  return (
    <section className="max-w-full">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {data.length === 0 ? (
        <p className="text-center text-gray-600">No records found.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
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
          </div>

          {/* Mobile stacked cards with collapsible details */}
          <div className="sm:hidden space-y-4">
            {data.map((item) => (
              <article key={item._id || item.email} className="w-full overflow-hidden box-border bg-white border rounded-lg p-2 shadow-sm">                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{getNestedValue(item, columns[0].key) ?? (item.name || item.email)}</h3>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {(getNestedValue(item, 'status') || item.status) && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${(getNestedValue(item, 'status') || item.status) === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{(getNestedValue(item, 'status') || item.status)}</span>
                      )}

                      <div className="flex items-center space-x-2 ml-2 text-gray-600 text-xs flex-shrink-0">
                        {actions && actions(item)}
                      </div>

                      <div className="ml-auto">
                        <button
                          onClick={() => setExpandedId(expandedId === (item._id || item.email) ? null : (item._id || item.email))}
                          aria-expanded={expandedId === (item._id || item.email)}
                          className="p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          title="Toggle details"
                        >
                          {expandedId === (item._id || item.email) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedId === (item._id || item.email) && (
                  <div className="mt-3 border-t pt-3 grid grid-cols-1 gap-2 text-xs text-gray-700">
                    {columns.slice(1).map((col) => {
                      const raw = getNestedValue(item, col.key);
                      let display = raw === undefined || raw === null ? '-' : raw;
                      if (col.key === 'lastLogin' && raw) display = new Date(raw).toLocaleString();
                      return (
                        <div key={col.key} className="truncate">
                          <div className="text-[10px] text-gray-500 uppercase mb-0">{col.label}</div>
                          <div className="text-sm text-gray-800">{String(display)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};




export default AdminDashboard;
