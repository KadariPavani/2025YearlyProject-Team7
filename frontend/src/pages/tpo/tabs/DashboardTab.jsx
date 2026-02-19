import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeletons';

const DashboardTab = ({ loadingBatches, errorBatches, assignedBatches }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Quick Actions */}

      <h2 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4">Recently Assigned Batches</h2>
      {loadingBatches ? (
        <LoadingSkeleton />
      ) : errorBatches ? (
        <div className="text-red-500 mb-4">{errorBatches}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedBatches.slice(0, 4).map(batch => (
            <div key={batch.id} className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow p-4 sm:p-5 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-sm sm:text-base mb-2 text-gray-900">Batch {batch.batchNumber}</h4>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <div><span className="font-medium text-gray-700">College:</span> {batch.colleges?.join(', ') || '-'}</div>
                <div><span className="font-medium text-gray-700">Students:</span> {batch.students?.length || 0}</div>
                <div><span className="font-medium text-gray-700">Start:</span> {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '-'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loadingBatches && assignedBatches.length === 0 && (
        <div className="text-gray-500 mt-4">No batches assigned yet.</div>
      )}
    </div>
  );
};

export default DashboardTab;
