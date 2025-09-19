// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import ToastNotification from '../../components/ui/ToastNotification';
// import { 
//   Shield, Bell, Settings, LogOut, ChevronDown, X, 
//   Plus, Users, GraduationCap, AlertCircle, Check
// } from 'lucide-react';

// const AdminDashboard = () => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [adminData, setAdminData] = useState(null);
//   const [showAddTrainer, setShowAddTrainer] = useState(false);
//   const [showAddTPO, setShowAddTPO] = useState(false);
//   const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
//   const [toast, setToast] = useState(null); // {type: 'success'|'error', message: string}

//   // Trainer form state
//   const [trainerData, setTrainerData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     employeeId: '',
//     experience: '',
//     linkedIn: '',
//     subjectDealing: '',
//     category: ''
//   });

//   // TPO form state
//   const [tpoData, setTpoData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     experience: '',
//     linkedIn: ''
//   });

//   const navigate = useNavigate();

//   useEffect(() => {
//     const storedAdminData = localStorage.getItem('adminData');
//     if (storedAdminData) {
//       setAdminData(JSON.parse(storedAdminData));
//     }
//   }, []);

//   const handleLogout = async () => {
//     localStorage.removeItem('adminToken');
//     localStorage.removeItem('adminData');
//     navigate('/');
//   };

//   // Show toast notification helper
//   const showToast = (type, message) => {
//     setToast({ type, message });
//     setTimeout(() => setToast(null), 4000);
//   };

//   const handleAddTrainer = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const response = await fetch('/api/admin/add-trainer', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
//         },
//         body: JSON.stringify({
//           ...trainerData,
//           experience: parseInt(trainerData.experience) || 0
//         })
//       });

//       const result = await response.json();

//       if (result.success) {
//         showToast('success', 'Trainer added successfully! Credentials sent to their email.');
//         setTrainerData({
//           name: '',
//           email: '',
//           phone: '',
//           employeeId: '',
//           experience: '',
//           linkedIn: '',
//           subjectDealing: '',
//           category: ''
//         });
//         setTimeout(() => setShowAddTrainer(false), 3000);
//       } else {
//         showToast('error', result.message);
//       }
//     } catch {
//       showToast('error', 'Failed to add trainer');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddTPO = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const response = await fetch('/api/admin/add-tpo', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
//         },
//         body: JSON.stringify({
//           ...tpoData,
//           experience: parseInt(tpoData.experience) || 0
//         })
//       });

//       const result = await response.json();

//       if (result.success) {
//         showToast('success', 'TPO added successfully! Credentials sent to their email.');
//         setTpoData({
//           name: '',
//           email: '',
//           phone: '',
//           experience: '',
//           linkedIn: ''
//         });
//         setTimeout(() => setShowAddTPO(false), 3000);
//       } else {
//         showToast('error', result.message);
//       }
//     } catch {
//       showToast('error', 'Failed to add TPO');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center py-4">
//             <div className="flex items-center space-x-4">
//               <div className="bg-white p-2 rounded-lg">
//                 <Shield className="h-8 w-8 text-red-600" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//                 <p className="text-sm opacity-90">Welcome to InfoVerse Admin Panel</p>
//               </div>
//             </div>

//             <div className="flex items-center space-x-6">
//               <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
//                 <Bell className="h-6 w-6" />
//                 <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
//               </button>

//               <div className="relative">
//                 <button
//                   onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
//                   className="flex items-center space-x-1 p-2 text-white hover:text-gray-200 transition-colors"
//                 >
//                   <Settings className="h-6 w-6" />
//                   <ChevronDown className="h-4 w-4" />
//                 </button>

//                 {showSettingsDropdown && (
//                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
//                     <button
//                       onClick={() => {
//                         setShowSettingsDropdown(false);
//                         navigate('/admin-profile');
//                       }}
//                       className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                     >
//                       View Profile
//                     </button>
//                     <button
//                       onClick={() => {
//                         setShowSettingsDropdown(false);
//                         navigate('/admin-change-password');
//                       }}
//                       className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                     >
//                       Change Password
//                     </button>
//                   </div>
//                 )}
//               </div>

//               <button
//                 onClick={handleLogout}
//                 className="flex items-center space-x-2 bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
//               >
//                 <LogOut className="h-4 w-4" />
//                 <span>Logout</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Toast notifications */}
//       {toast && (
//         <ToastNotification
//           type={toast.type}
//           message={toast.message}
//           onClose={() => setToast(null)}
//         />
//       )}

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Action Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//           {/* Add Trainer Card */}
//           {adminData?.permissions?.canAddTrainer && (
//             <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
//               <div className="flex items-center mb-4">
//                 <div className="bg-green-100 p-3 rounded-lg mr-4">
//                   <GraduationCap className="h-8 w-8 text-green-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">Add Trainer</h3>
//                   <p className="text-sm text-gray-600">Create new trainer account</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowAddTrainer(true)}
//                 className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add Trainer
//               </button>
//             </div>
//           )}

//           {/* Add TPO Card */}
//           {adminData?.permissions?.canAddTPO && (
//             <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
//               <div className="flex items-center mb-4">
//                 <div className="bg-blue-100 p-3 rounded-lg mr-4">
//                   <Users className="h-8 w-8 text-blue-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">Add TPO</h3>
//                   <p className="text-sm text-gray-600">Create new TPO account</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowAddTPO(true)}
//                 className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add TPO
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Dashboard Stats */}
//         <div className="bg-white rounded-xl shadow-lg p-8">
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
//           <p className="text-gray-600">Welcome to your admin dashboard. Use the action cards above to manage users.</p>
//         </div>
//       </main>

//       {/* Add Trainer Modal */}
//       {showAddTrainer && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
//               <h2 className="text-2xl font-bold text-gray-900">Add New Trainer</h2>
//               <button
//                 onClick={() => setShowAddTrainer(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <X className="h-6 w-6" />
//               </button>
//             </div>

//             <form onSubmit={handleAddTrainer} className="p-6 space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Name*</label>
//                   <input
//                     type="text"
//                     required
//                     value={trainerData.name}
//                     onChange={(e) => setTrainerData({ ...trainerData, name: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                     placeholder="Enter trainer name"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
//                   <input
//                     type="email"
//                     required
//                     value={trainerData.email}
//                     onChange={(e) => setTrainerData({ ...trainerData, email: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                     placeholder="Enter email address"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Phone*</label>
//                   <input
//                     type="tel"
//                     required
//                     value={trainerData.phone}
//                     onChange={(e) => setTrainerData({ ...trainerData, phone: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                     placeholder="10-digit phone number"
//                     maxLength={10}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID*</label>
//                   <input
//                     type="text"
//                     required
//                     value={trainerData.employeeId}
//                     onChange={(e) => setTrainerData({ ...trainerData, employeeId: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                     placeholder="Enter employee ID"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
//                   <input
//                     type="number"
//                     min="0"
//                     required
//                     value={trainerData.experience}
//                     onChange={(e) => setTrainerData({ ...trainerData, experience: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                     placeholder="Years of experience"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
//                   <input
//                     type="url"
//                     value={trainerData.linkedIn}
//                     onChange={(e) => setTrainerData({ ...trainerData, linkedIn: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                     placeholder="LinkedIn profile URL"
//                   />
//                 </div>
//               </div>

//               {/* Subject Dealing Section */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Subject Dealing*</label>
//                 <input
//                   type="text"
//                   required
//                   value={trainerData.subjectDealing}
//                   onChange={(e) => setTrainerData({ ...trainerData, subjectDealing: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
//                   placeholder="Subject name (e.g., Python)"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Category*</label>
//                 <select
//                   required
//                   value={trainerData.category}
//                   onChange={(e) => setTrainerData({ ...trainerData, category: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
//                 >
//                   <option value="">Select category</option>
//                   <option value="technical">Technical</option>
//                   <option value="non-technical">Non-Technical</option>
//                 </select>
//               </div>

//               <div className="flex space-x-4 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowAddTrainer(false)}
//                   className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
//                 >
//                   {loading ? 'Adding...' : 'Add Trainer'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Add TPO Modal */}
//       {showAddTPO && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg max-w-md w-full">
//             <div className="p-6 border-b border-gray-200 flex justify-between items-center">
//               <h2 className="text-2xl font-bold text-gray-900">Add New TPO</h2>
//               <button
//                 onClick={() => setShowAddTPO(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <X className="h-6 w-6" />
//               </button>
//             </div>

//             <form onSubmit={handleAddTPO} className="p-6 space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Name*</label>
//                 <input
//                   type="text"
//                   required
//                   value={tpoData.name}
//                   onChange={(e) => setTpoData({ ...tpoData, name: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter TPO name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
//                 <input
//                   type="email"
//                   required
//                   value={tpoData.email}
//                   onChange={(e) => setTpoData({ ...tpoData, email: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter email address"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Phone*</label>
//                 <input
//                   type="tel"
//                   required
//                   value={tpoData.phone}
//                   onChange={(e) => setTpoData({ ...tpoData, phone: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="10-digit phone number"
//                   maxLength={10}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
//                 <input
//                   type="number"
//                   min="0"
//                   value={tpoData.experience}
//                   onChange={(e) => setTpoData({ ...tpoData, experience: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Years of experience"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
//                 <input
//                   type="url"
//                   value={tpoData.linkedIn}
//                   onChange={(e) => setTpoData({ ...tpoData, linkedIn: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="LinkedIn profile URL"
//                 />
//               </div>

//               <div className="flex space-x-4 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowAddTPO(false)}
//                   className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
//                 >
//                   {loading ? 'Adding...' : 'Add TPO'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Bell, Settings, LogOut, ChevronDown,
  Users, GraduationCap, Eye, BarChart3,
} from "lucide-react";

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[100px]">
      <div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div>
    </div>
  );
}

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [dashboard, setDashboard] = useState({ totalTPOs: 0, totalTrainers: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [visibleList, setVisibleList] = useState(null);

  const [trainers, setTrainers] = useState([]);
  const [tpos, setTpos] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const [tposLoading, setTposLoading] = useState(false);

  const [trainerSearch, setTrainerSearch] = useState("");
  const [tpoSearch, setTpoSearch] = useState("");

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
    if (data) setDashboard(data);
    setAnalyticsLoading(false);
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

  const toggleList = (type) => {
    if (visibleList === type) {
      setVisibleList(null);
      return;
    }
    setVisibleList(type);
    if (type === "trainers" && trainers.length === 0) fetchTrainers();
    if (type === "tpos" && tpos.length === 0) fetchTpos();
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

      {/* Analytics */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        </div>

        {/* Add/View Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {adminData.permissions?.canAddTrainer && (
            <div
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => navigate("/add-trainer")}
              role="button"
              tabIndex={0}
              onKeyPress={e => e.key === "Enter" && navigate("/add-trainer")}
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <GraduationCap className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add Trainer</h3>
                  <p className="text-sm text-gray-600">Create new trainer account</p>
                </div>
              </div>
            </div>
          )}

          {adminData.permissions?.canViewTrainer && (
            <div
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => toggleList("trainers")}
              role="button"
              tabIndex={0}
              onKeyPress={e => e.key === "Enter" && toggleList("trainers")}
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">View Trainers</h3>
                  <p className="text-sm text-gray-600">Browse all trainers</p>
                </div>
              </div>
            </div>
          )}

          {adminData.permissions?.canAddTPO && (
            <div
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => navigate("/add-tpo")}
              role="button"
              tabIndex={0}
              onKeyPress={e => e.key === "Enter" && navigate("/add-tpo")}
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add TPO</h3>
                  <p className="text-sm text-gray-600">Create new TPO account</p>
                </div>
              </div>
            </div>
          )}

          {adminData.permissions?.canViewTPO && (
            <div
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => toggleList("tpos")}
              role="button"
              tabIndex={0}
              onKeyPress={e => e.key === "Enter" && toggleList("tpos")}
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">View TPOs</h3>
                  <p className="text-sm text-gray-600">Browse all TPOs</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trainer Table */}
        {visibleList === "trainers" && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Trainer Details</h2>
            <SearchableList
              loading={trainersLoading}
              data={filteredTrainers}
              columns={[
                { label: "Name", key: "name" },
                { label: "Email", key: "email" },
                { label: "Phone", key: "phone" },
                { label: "Employee ID", key: "employeeId" },
                { label: "Experience", key: "experience" },
                { label: "Subject", key: "subjectDealing" },
                { label: "Category", key: "category" },
                { label: "LinkedIn", key: "linkedIn" }
                // { label: "Status", key: "status" },
                // { label: "Last Login", key: "lastLogin" },
              ]}
              searchValue={trainerSearch}
              onSearchChange={setTrainerSearch}
            />
          </section>
        )}

        {/* TPO Table */}
        {visibleList === "tpos" && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4">TPO Details</h2>
            <SearchableList
              loading={tposLoading}
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
              searchValue={tpoSearch}
              onSearchChange={setTpoSearch}
            />
          </section>
        )}
      </main>
    </div>
  );
};

function SearchableList({ loading, data, columns, searchValue, onSearchChange }) {
  if (loading) return <LoadingSpinner />;

  return (
    <>
      <input
        type="search"
        className="border border-gray-300 rounded px-3 py-2 mb-6 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Search..."
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
      />
      {data.length === 0 ? (
        <p className="text-center text-gray-600">No records found.</p>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full table-auto border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="border border-gray-300 px-4 py-2 text-left text-gray-700 font-semibold"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col.key} className="border border-gray-300 px-4 py-2">
                      {col.key === 'lastLogin' && item[col.key]
                        ? new Date(item[col.key]).toLocaleString()
                        : item[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;
