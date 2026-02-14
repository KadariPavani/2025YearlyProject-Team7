import React from "react";
import {
  Users,
  GraduationCap,
  Shield,
  BarChart3,
  Activity,
  Clock,
  AlertCircle,
} from "lucide-react";
import ActiveUserStat from "../components/ActiveUserStat";

const OverviewTab = ({ dashboard, statistics, handleTabChange }) => {
  const totalUsers =
    dashboard.totalTrainers + dashboard.totalTPOs + dashboard.totalAdmins;

  return (
    <div className="space-y-6">
      {/* Distribution & Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
            User Distribution
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <GraduationCap className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-xs sm:text-sm text-gray-700">Trainers</span>
                </div>
                <div className="text-right">
                  <span className="text-sm sm:text-base font-semibold text-gray-900">{dashboard.totalTrainers}</span>
                  <span className="text-xs text-gray-500 ml-2">{totalUsers > 0 ? Math.round((dashboard.totalTrainers / totalUsers) * 100) : 0}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${totalUsers > 0 ? (dashboard.totalTrainers / totalUsers) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-xs sm:text-sm text-gray-700">TPOs</span>
                </div>
                <div className="text-right">
                  <span className="text-sm sm:text-base font-semibold text-gray-900">{dashboard.totalTPOs}</span>
                  <span className="text-xs text-gray-500 ml-2">{totalUsers > 0 ? Math.round((dashboard.totalTPOs / totalUsers) * 100) : 0}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${totalUsers > 0 ? (dashboard.totalTPOs / totalUsers) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-xs sm:text-sm text-gray-700">Admins</span>
                </div>
                <div className="text-right">
                  <span className="text-sm sm:text-base font-semibold text-gray-900">{dashboard.totalAdmins}</span>
                  <span className="text-xs text-gray-500 ml-2">{totalUsers > 0 ? Math.round((dashboard.totalAdmins / totalUsers) * 100) : 0}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${totalUsers > 0 ? (dashboard.totalAdmins / totalUsers) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Activity className="h-4 w-4 mr-2 text-blue-600" />
            Active Users (Last 7 Days)
          </h3>
          <div className="space-y-3">
            <ActiveUserStat label="Trainers" value={statistics.activeUsers?.trainers || 0} total={dashboard.totalTrainers} icon={<GraduationCap className="h-4 w-4 text-blue-600" />} />
            <ActiveUserStat label="TPOs" value={statistics.activeUsers?.tpos || 0} total={dashboard.totalTPOs} icon={<Users className="h-4 w-4 text-blue-600" />} />
            <ActiveUserStat label="Admins" value={statistics.activeUsers?.admins || 0} total={dashboard.totalAdmins} icon={<Shield className="h-4 w-4 text-blue-600" />} />
          </div>
        </div>
      </div>

      {/* Recent Login Activity - table */}
      <div>
        <h2 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
          Recent Login Activity
        </h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
          {statistics.recentLogins && statistics.recentLogins.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Role</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {statistics.recentLogins.map((user, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 whitespace-nowrap font-medium">{user.name || user.email}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{user.role}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{new Date(user.lastLogin).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-xs sm:text-sm">No recent login activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
