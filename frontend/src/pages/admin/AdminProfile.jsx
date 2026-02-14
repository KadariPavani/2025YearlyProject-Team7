import React, { useState, useEffect } from "react";
import Header from "../../components/common/Header";
import { Shield, Mail, Clock, Calendar, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminProfile } from "../../services/adminService";
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const AdminProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) throw new Error("No authentication token found");
        const response = await getAdminProfile();
        if (response && response.data && response.data.success) {
          setProfileData(response.data.data);
          setError("");
        } else {
          throw new Error("Failed to fetch profile");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.response?.data?.message || err.message || "Failed to fetch profile");
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminData");
          navigate("/super-admin-login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/super-admin-login");
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  const permissions = profileData?.permissions || {};
  const adminControls = permissions.adminControls || {};
  const trainerControls = permissions.trainerControls || {};
  const tpoControls = permissions.tpoControls || {};
  const canViewActivity = permissions.canViewActivity;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title="Admin Profile"
        subtitle="View your profile details"
        showTitleInHeader={false}
        userData={profileData}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onLogout={handleLogout}
        onIconClick={() => navigate('/admin-dashboard')}
      />

      {/* Back Button - Fixed at top right */}
      <div className="fixed top-20 right-4 sm:right-8 z-10">
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:text-gray-900 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 pt-24 w-full space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-sm sm:text-lg font-semibold text-gray-900">Profile Details</h1>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-xs sm:text-sm text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">Account Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                  <p className="text-xs sm:text-sm text-gray-900">{profileData?.email}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                  <p className="text-xs sm:text-sm text-gray-900 capitalize">
                    {profileData?.role?.replace(/_/g, " ")}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Last Login</label>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {profileData?.lastLogin
                      ? new Date(profileData.lastLogin).toLocaleString()
                      : "Never"}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Account Created</label>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {profileData?.createdAt &&
                      new Date(profileData.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Permissions</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Admin Controls */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">Admin Controls</h3>
                  <div className="space-y-1.5">
                    {Object.entries(adminControls).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 capitalize">{key}</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          value ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {value ? "Yes" : "No"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trainer Controls */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">Trainer Controls</h3>
                  <div className="space-y-1.5">
                    {Object.entries(trainerControls).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 capitalize">{key}</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          value ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {value ? "Yes" : "No"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TPO Controls */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">TPO Controls</h3>
                  <div className="space-y-1.5">
                    {Object.entries(tpoControls).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 capitalize">{key}</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          value ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {value ? "Yes" : "No"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* View Activity Access */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 font-medium">View Activity Access</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    canViewActivity ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {canViewActivity ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminProfile;
