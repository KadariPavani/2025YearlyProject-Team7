import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Shield,
  Users,
  GraduationCap,
  BarChart3,
  AlertCircle,
  MessageSquare,
  Briefcase,
  BookOpen,
  Plus,
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";

import Header from "../../components/common/Header";
import BottomNav from "../../components/common/BottomNav";
import ToastNotification from "../../components/ui/ToastNotification";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeletons";

import OverviewTab from "./tabs/OverviewTab";
import TrainersTab from "./tabs/TrainersTab";
import TpoTab from "./tabs/TpoTab";
import AdminsTab from "./tabs/AdminsTab";
import ContactsTab from "./tabs/ContactsTab";
import CRTBatchSection from "./CRTBatchSection";
import PlacementTrainingBatches from "./PlacementTrainingBatches";
import PlacementImportTab from "./tabs/PlacementImportTab";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Core state ──
  const [adminData, setAdminData] = useState(null);
  const [dashboard, setDashboard] = useState({ totalTPOs: 0, totalTrainers: 0, totalAdmins: 0 });
  const [statistics, setStatistics] = useState({
    recentLogins: [],
    userGrowth: { trainers: 0, tpos: 0, admins: 0 },
    activeUsers: { trainers: 0, tpos: 0, admins: 0 },
    totalActive: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // ── Tab overflow (desktop "More" dropdown) ──
  const [visibleTabsCount, setVisibleTabsCount] = useState(100);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState(null);
  const moreRef = useRef(null);
  const dropdownRef = useRef(null);
  const navRef = useRef(null);

  // ── Data lists ──
  const [trainers, setTrainers] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [contacts, setContacts] = useState([]);

  // ── Loading states ──
  const [trainersLoading, setTrainersLoading] = useState(false);
  const [tposLoading, setTposLoading] = useState(false);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);

  // ── Search states ──
  const [trainerSearch, setTrainerSearch] = useState("");
  const [tpoSearch, setTpoSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  // ── Admin filtering ──
  const [adminRoleFilter, setAdminRoleFilter] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("");
  const [adminPermissionFilter, setAdminPermissionFilter] = useState("");
  const [adminSortBy, setAdminSortBy] = useState("email");
  const [adminSortOrder, setAdminSortOrder] = useState("asc");

  // ── Notifications ──
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryUnread, setCategoryUnread] = useState({});

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ────────────────────────────── Tab overflow logic ──────────────────────────────

  const handleMoreToggle = (e) => {
    e.stopPropagation();
    if (!moreRef.current) { setShowMoreDropdown((s) => !s); return; }
    const rect = moreRef.current.getBoundingClientRect();
    const width = 224;
    setDropdownCoords({ top: rect.bottom + 8, left: Math.max(8, rect.right - width), width });
    setShowMoreDropdown((s) => !s);
  };

  useEffect(() => {
    if (!showMoreDropdown) return;
    const reposition = () => {
      if (!moreRef.current) return;
      const rect = moreRef.current.getBoundingClientRect();
      const width = 224;
      setDropdownCoords({ top: rect.bottom + 8, left: Math.max(8, rect.right - width), width });
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => { window.removeEventListener("resize", reposition); window.removeEventListener("scroll", reposition, true); };
  }, [showMoreDropdown]);

  useEffect(() => {
    const reset = () => { setVisibleTabsCount(100); setShowMoreDropdown(false); };
    window.addEventListener("resize", reset);
    const mql = window.matchMedia("(min-width: 640px)");
    mql.addEventListener("change", reset);
    return () => { window.removeEventListener("resize", reset); mql.removeEventListener("change", reset); };
  }, []);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.offsetWidth === 0) return;
    const childCount = nav.children.length;
    if (childCount > 0 && visibleTabsCount > childCount) { setVisibleTabsCount(childCount); return; }
    if (nav.scrollWidth > nav.clientWidth + 2 && visibleTabsCount > 1) setVisibleTabsCount((v) => v - 1);
  });

  useEffect(() => {
    const onDocClick = (e) => {
      if (moreRef.current?.contains(e.target)) return;
      if (dropdownRef.current?.contains(e.target)) return;
      setShowMoreDropdown(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // ────────────────────────────── API helpers ──────────────────────────────

  const fetchWithAuth = async (url) => {
    const token = localStorage.getItem("adminToken");
    if (!token) { handleLogout(); return null; }
    try {
      const finalUrl = url.startsWith("/") ? `${API_BASE}${url}` : url;
      const res = await fetch(finalUrl, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      if (res.status === 401) { handleLogout(); return null; }
      const json = await res.json();
      return json.success ? json.data : null;
    } catch { return null; }
  };

  const apiCall = async (url, method = "GET", body = null) => {
    const token = localStorage.getItem("adminToken");
    if (!token) { handleLogout(); return null; }
    try {
      const finalUrl = url.startsWith("/") ? `${API_BASE}${url}` : url;
      const res = await fetch(finalUrl, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : null,
      });
      if (res.status === 401) { handleLogout(); return null; }
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API error");
      return json;
    } catch (error) { showToast("error", error.message ?? "Network error"); return null; }
  };

  // ────────────────────────────── Notification helpers ──────────────────────────────

  const fetchNotifications = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/admin`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.status === 401) return;
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
        setCategoryUnread(json.unreadByCategory || {});
        const total = Object.values(json.unreadByCategory || {}).reduce((a, b) => a + b, 0);
        setUnreadCount(total);
      }
    } catch (e) {
      console.error("Error fetching admin notifications:", e);
    }
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/notifications/admin/mark-read/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      await fetchNotifications();
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/notifications/admin/mark-all-read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      await fetchNotifications();
    } catch (e) {
      console.error("Error marking all notifications as read:", e);
    }
  };

  // ────────────────────────────── Data fetching ──────────────────────────────

  useEffect(() => {
    const storedAdminData = localStorage.getItem("adminData");
    if (storedAdminData) setAdminData(JSON.parse(storedAdminData));
    fetchDashboardAnalytics();
    fetchNotifications();
    // Load data for the tab restored from URL
    const tab = searchParams.get("tab");
    if (tab === "trainers") fetchTrainers();
    if (tab === "tpos") fetchTpos();
    if (tab === "admins") fetchAdmins();
    if (tab === "contacts") fetchContacts();
  }, []);

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
    if (data) { setAdmins(data); setDashboard((d) => ({ ...d, totalAdmins: data.length })); }
  };

  const fetchStatistics = async () => {
    const [trainersData, tposData, adminsData] = await Promise.all([
      fetchWithAuth("/api/admin/trainers"),
      fetchWithAuth("/api/admin/tpos"),
      fetchWithAuth("/api/admin/admins"),
    ]);
    if (trainersData && tposData && adminsData) {
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeTrainers = trainersData.filter((t) => t.lastLogin && new Date(t.lastLogin) > sevenDaysAgo).length;
      const activeTpos = tposData.filter((t) => t.lastLogin && new Date(t.lastLogin) > sevenDaysAgo).length;
      const activeAdmins = adminsData.filter((a) => a.lastLogin && new Date(a.lastLogin) > sevenDaysAgo).length;

      const allUsers = [
        ...trainersData.map((t) => ({ ...t, role: "Trainer" })),
        ...tposData.map((t) => ({ ...t, role: "TPO" })),
        ...adminsData.map((a) => ({ ...a, role: "Admin" })),
      ];
      const recentLogins = allUsers.filter((u) => u.lastLogin).sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin)).slice(0, 5);

      setStatistics({
        activeUsers: { trainers: activeTrainers, tpos: activeTpos, admins: activeAdmins },
        userGrowth: {
          trainers: trainersData.filter((t) => t.createdAt && new Date(t.createdAt) > thirtyDaysAgo).length,
          tpos: tposData.filter((t) => t.createdAt && new Date(t.createdAt) > thirtyDaysAgo).length,
          admins: adminsData.filter((a) => a.createdAt && new Date(a.createdAt) > thirtyDaysAgo).length,
        },
        recentLogins,
        totalActive: activeTrainers + activeTpos + activeAdmins,
      });
    }
  };

  const fetchTrainers = async () => { if (trainers.length > 0) return; setTrainersLoading(true); setTrainers(await fetchWithAuth("/api/admin/trainers") || []); setTrainersLoading(false); };
  const fetchTpos = async () => { if (tpos.length > 0) return; setTposLoading(true); setTpos(await fetchWithAuth("/api/admin/tpos") || []); setTposLoading(false); };
  const fetchAdmins = async () => { if (admins.length > 0) return; setAdminsLoading(true); setAdmins(await fetchWithAuth("/api/admin/admins") || []); setAdminsLoading(false); };
  const fetchContacts = async () => { setContactsLoading(true); setContacts(await fetchWithAuth("/api/contacts") || []); setContactsLoading(false); };

  // ────────────────────────────── Tab change ──────────────────────────────

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    if (tab === "trainers") fetchTrainers();
    if (tab === "tpos") fetchTpos();
    if (tab === "admins") fetchAdmins();
    if (tab === "contacts") fetchContacts();
    if (tab === "actions") { fetchTrainers(); fetchTpos(); }
  };

  // ────────────────────────────── Auth ──────────────────────────────

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/super-admin-login");
  };

  // ────────────────────────────── Filtered data ──────────────────────────────

  const filteredTrainers = useMemo(() =>
    trainers.filter((t) =>
      t.name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(trainerSearch.toLowerCase())
    ), [trainers, trainerSearch]);

  const filteredTpos = useMemo(() =>
    tpos.filter((t) =>
      t.name.toLowerCase().includes(tpoSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(tpoSearch.toLowerCase())
    ), [tpos, tpoSearch]);

  const filteredContacts = useMemo(() =>
    contacts.filter((c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase())) ||
      c.phone.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.message && c.message.toLowerCase().includes(contactSearch.toLowerCase()))
    ), [contacts, contactSearch]);

  const filteredAndSortedAdmins = useMemo(() => {
    let filtered = admins.filter((admin) => {
      const searchMatch = admin.email.toLowerCase().includes(adminSearch.toLowerCase()) || admin.role.toLowerCase().includes(adminSearch.toLowerCase());
      const roleMatch = !adminRoleFilter || admin.role === adminRoleFilter;
      const statusMatch = !adminStatusFilter || admin.status === adminStatusFilter;
      const permissionMatch = !adminPermissionFilter || (() => {
        switch (adminPermissionFilter) {
          case "can_add_admin": return admin.permissions?.adminControls?.add;
          case "can_edit_admin": return admin.permissions?.adminControls?.edit;
          case "can_delete_admin": return admin.permissions?.adminControls?.delete;
          case "can_add_trainer": return admin.permissions?.trainerControls?.add;
          case "can_edit_trainer": return admin.permissions?.trainerControls?.edit;
          case "can_delete_trainer": return admin.permissions?.trainerControls?.delete;
          case "can_add_tpo": return admin.permissions?.tpoControls?.add;
          case "can_edit_tpo": return admin.permissions?.tpoControls?.edit;
          case "can_delete_tpo": return admin.permissions?.tpoControls?.delete;
          default: return true;
        }
      })();
      return searchMatch && roleMatch && statusMatch && permissionMatch;
    });
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (adminSortBy) {
        case "email": aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); break;
        case "role": aVal = a.role; bVal = b.role; break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "createdAt": aVal = new Date(a.createdAt); bVal = new Date(b.createdAt); break;
        case "lastLogin": aVal = a.lastLogin ? new Date(a.lastLogin) : new Date(0); bVal = b.lastLogin ? new Date(b.lastLogin) : new Date(0); break;
        default: aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase();
      }
      return adminSortOrder === "desc" ? (aVal > bVal ? -1 : aVal < bVal ? 1 : 0) : (aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
    });
    return filtered;
  }, [admins, adminSearch, adminRoleFilter, adminStatusFilter, adminPermissionFilter, adminSortBy, adminSortOrder]);

  const clearAdminFilters = () => {
    setAdminSearch(""); setAdminRoleFilter(""); setAdminStatusFilter("");
    setAdminPermissionFilter(""); setAdminSortBy("email"); setAdminSortOrder("asc");
  };

  // ────────────────────────────── Action handlers ──────────────────────────────

  const handleSuspendToggle = async (entityType, id) => {
    const res = await apiCall(`/api/admin/${entityType}/${id}/toggle-status`, "PATCH");
    if (res) { showToast("success", `${entityType.slice(0, -1)} status updated.`); refreshData(); }
  };

  const handleEditAdmin = async (admin) => {
    if (!adminData?.permissions?.adminControls?.edit) { showToast("error", "You don't have permission to edit admins"); return; }
    const newRole = prompt(`Change role for ${admin.email}:\n\nOptions:\n- super_admin\n- admin_level_1\n- admin_level_2\n- admin_level_3`, admin.role);
    if (newRole && newRole !== admin.role && ["super_admin", "admin_level_1", "admin_level_2", "admin_level_3"].includes(newRole)) {
      const res = await apiCall(`/api/admin/admins/${admin._id}`, "PUT", { role: newRole });
      if (res) { showToast("success", "Admin updated successfully."); fetchAdmins(); }
    } else if (newRole && !["super_admin", "admin_level_1", "admin_level_2", "admin_level_3"].includes(newRole)) {
      showToast("error", "Invalid role selected");
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!adminData?.permissions?.adminControls?.delete) { showToast("error", "You don't have permission to delete admins"); return; }
    if (!window.confirm("Are you sure you want to delete this admin? This cannot be undone.")) return;
    const res = await apiCall(`/api/admin/admins/${id}`, "DELETE");
    if (res) { showToast("success", "Admin deleted successfully."); setAdmins(admins.filter((a) => a._id !== id)); }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact submission?")) return;
    const res = await apiCall(`/api/contacts/${id}`, "DELETE");
    if (res) { showToast("success", "Contact deleted successfully."); setContacts(contacts.filter((c) => c._id !== id)); }
  };

  const handleDelete = async (entityType, id) => {
    const entityName = entityType.slice(0, -1);
    const permissionGroup = entityType === "trainers" ? "trainerControls" : "tpoControls";
    if (!adminData?.permissions?.[permissionGroup]?.delete) { showToast("error", `You don't have permission to delete ${entityType}`); return; }
    if (!window.confirm(`Are you sure you want to delete this ${entityName}? This cannot be undone.`)) return;
    const res = await apiCall(`/api/admin/${entityType}/${id}`, "DELETE");
    if (res) {
      showToast("success", `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} deleted successfully.`);
      if (entityType === "trainers") setTrainers(trainers.filter((t) => t._id !== id));
      else if (entityType === "tpos") setTpos(tpos.filter((t) => t._id !== id));
      refreshData();
    }
  };

  const refreshData = () => { fetchTrainers(); fetchTpos(); fetchAdmins(); fetchDashboardAnalytics(); };

  // ────────────────────────────── Loading ──────────────────────────────

  if (!adminData || analyticsLoading) return <LoadingSkeleton />;

  // ────────────────────────────── Tabs config ──────────────────────────────

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "trainers", label: "Trainers", icon: GraduationCap },
    { id: "tpos", label: "TPOs", icon: Users },
    { id: "admins", label: "Admins", icon: Shield },
    { id: "contacts", label: "Contacts", icon: MessageSquare },
    { id: "crt-batches", label: "CRT Batches", icon: BookOpen },
    { id: "placement-batches", label: "Placement Batches", icon: Briefcase },
    { id: "placement-import", label: "Import Placement", icon: FileSpreadsheet },
  ];

  // ────────────────────────────── Render ──────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <Header
        title="Welcome Admin..!"
        icon={Shield}
        userData={adminData}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onLogout={handleLogout}
        onIconClick={() => {
          if (window.location.pathname === "/admin-dashboard") window.scrollTo({ top: 0, behavior: "smooth" });
          else navigate("/admin-dashboard");
        }}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        categoryUnread={categoryUnread}
        unreadCount={unreadCount}
        userType="admin"
        userId={adminData?._id || adminData?.id}
      />

      <main className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 pt-24 pb-[220px] sm:pb-8">
        {/* Page header */}
        <div className="mb-4 px-5 sm:px-0">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">{`Welcome, ${adminData?.name || "Admin"}..!`}</h1>
        </div>

        {/* Desktop Tab Navigation */}
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
                    className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border-transparent rounded"
                  >
                    <span>More</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showMoreDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showMoreDropdown && dropdownCoords && (
                    <div
                      ref={dropdownRef}
                      style={{ position: "fixed", top: dropdownCoords.top, left: dropdownCoords.left, width: dropdownCoords.width }}
                      className="bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    >
                      <ul className="divide-y divide-gray-100">
                        {tabs.slice(visibleTabsCount).map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <li key={tab.id}>
                              <button
                                onClick={() => { handleTabChange(tab.id); setShowMoreDropdown(false); }}
                                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-center gap-2 text-sm text-gray-700"
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
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {activeTab === "overview" && (
            <OverviewTab dashboard={dashboard} statistics={statistics} handleTabChange={handleTabChange} />
          )}

          {activeTab === "trainers" && (
            trainersLoading ? <LoadingSkeleton /> : (
              <TrainersTab
                adminData={adminData}
                trainersLoading={trainersLoading}
                trainerSearch={trainerSearch}
                setTrainerSearch={setTrainerSearch}
                filteredTrainers={filteredTrainers}
                navigate={navigate}
                handleSuspendToggle={handleSuspendToggle}
                handleDelete={handleDelete}
              />
            )
          )}

          {activeTab === "tpos" && (
            tposLoading ? <LoadingSkeleton /> : (
              <TpoTab
                adminData={adminData}
                tposLoading={tposLoading}
                tpoSearch={tpoSearch}
                setTpoSearch={setTpoSearch}
                filteredTpos={filteredTpos}
                navigate={navigate}
                handleSuspendToggle={handleSuspendToggle}
                handleDelete={handleDelete}
              />
            )
          )}

          {activeTab === "admins" && (
            adminsLoading ? <LoadingSkeleton /> : (
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
            />
          )}

          {activeTab === "crt-batches" && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900">CRT Batches Management</h3>
                <button
                  onClick={() => navigate("/crt-management")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                  aria-label="Add CRT Batch"
                  title="Add CRT Batch"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Batch</span>
                </button>
              </div>
              <CRTBatchSection />
            </div>
          )}

          {activeTab === "placement-batches" && (
            <PlacementTrainingBatches onClose={() => setActiveTab("overview")} />
          )}

          {activeTab === "placement-import" && (
            <PlacementImportTab showToast={showToast} />
          )}

          {/* Mobile bottom nav */}
          <div className="sm:hidden">
            <BottomNav tabs={tabs} active={activeTab} onChange={handleTabChange} />
          </div>
        </div>
      </main>

      {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminDashboard;
