import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import {
  Shield,
  Mail,
  Clock,
  UserCheck,
  Calendar,
  ArrowLeft,
  Edit,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminProfile } from "../../services/adminService";



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
        if (response.data.success) {
          setProfileData(response.data.data);
          setError("");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.response?.data?.message || "Failed to fetch profile");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Navbar/>
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin-dashboard")}
        className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium">Back to Dashboard</span>
      </button>

      <div className="max-w-5xl mx-auto">
        {error ? (
          <div className="bg-red-50 border border-red-300 rounded-md p-6 text-center shadow">
            <p className="text-red-600 text-lg font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Page Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Your Account
            </h1>

            {/* Profile Section */}
            <div className="bg-white rounded-md shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-red-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Admin Profile
                  </h2>
                </div>
                <button className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  <Edit className="h-4 w-4" /> Edit
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <p className="text-sm text-gray-600">Email Address</p>
                  <p className="text-gray-900 font-medium">
                    {profileData?.email}
                  </p>
                </div>

                {/* Role */}
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="text-gray-900 font-medium capitalize">
                    {profileData?.role?.replace(/_/g, " ")}
                  </p>
                </div>

                {/* Last Login */}
                <div>
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="text-gray-900 font-medium">
                    {profileData?.lastLogin
                      ? new Date(profileData.lastLogin).toLocaleString()
                      : "Never"}
                  </p>
                </div>

                {/* Created At */}
                <div>
                  <p className="text-sm text-gray-600">Account Created</p>
                  <p className="text-gray-900 font-medium">
                    {profileData?.createdAt &&
                      new Date(profileData.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-white rounded-md shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Permissions
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(profileData?.permissions || {}).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3"
                    >
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          value
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {value ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


export default AdminProfile;
