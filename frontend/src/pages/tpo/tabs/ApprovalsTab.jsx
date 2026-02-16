import React from 'react';
import { RefreshCw, CheckCircle, Users, Eye } from 'lucide-react';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeletons';

const ApprovalsTab = ({ loadingApprovals, pendingApprovals, fetchPendingApprovals, setSelectedApproval, setShowApprovalDetail }) => {
  const getRequestTypeLabel = (type) => {
    const labels = { 'crt_status_change': 'CRT Status', 'batch_change': 'Batch Change', 'profile_change': 'Profile Update' };
    return labels[type] || type;
  };

  const getRequestTypeBadge = (type) => {
    const styles = {
      'crt_status_change': 'bg-blue-50 text-blue-700 border-blue-200',
      'batch_change': 'bg-purple-50 text-purple-700 border-purple-200',
      'profile_change': 'bg-amber-50 text-amber-700 border-amber-200'
    };
    return styles[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Pending Approvals</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{pendingApprovals.length} pending requests</p>
        </div>
        <button
          onClick={fetchPendingApprovals}
          className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Content */}
      {loadingApprovals ? (
        <LoadingSkeleton />
      ) : pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-xs sm:text-sm font-medium">No pending approval requests</p>
          <p className="text-xs text-gray-400 mt-1">All requests have been processed</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Student</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll No</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Requested</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingApprovals.map((approval, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{approval.student.name}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm font-mono text-gray-700 whitespace-nowrap">{approval.student.rollNo}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium border ${getRequestTypeBadge(approval.requestType)}`}>
                        {getRequestTypeLabel(approval.requestType)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                      {new Date(approval.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowApprovalDetail(true);
                        }}
                        className="px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsTab;
