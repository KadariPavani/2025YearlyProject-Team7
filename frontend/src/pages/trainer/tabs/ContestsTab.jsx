import React, { useState } from 'react';
import axios from 'axios';
import { PlusCircle, Monitor, Eye, Edit, Trash2, BarChart } from 'lucide-react';
import ToastNotification from '../../../components/ui/ToastNotification';

const ContestsTab = ({ contests, setContests, navigate }) => {
  const [toastMsg, setToastMsg] = useState('');

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMsg && (
        <ToastNotification type="error" message={toastMsg} onClose={() => setToastMsg('')} />
      )}

      {/* Shared Header */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Contests</h2>
              <p className="text-xs text-gray-500">{contests.length} contests created</p>
            </div>
          </div>
          <button onClick={() => navigate('/trainer/contests/create')} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Create Contest</span>
          </button>
        </div>
      </div>

      {contests.length > 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Contest Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Start</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">End</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contests.map((c, idx) => (
                  <tr key={c._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[200px]">{c.name}</div>
                      {c.description && <div className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[200px]">{c.description}</div>}
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{new Date(c.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{new Date(c.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => navigate(`/trainer/contests/${c._id}`)} className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" /><span className="hidden sm:inline">View</span>
                        </button>
                        <button onClick={() => navigate(`/trainer/contests/${c._id}`, { state: { edit: true } })} className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex items-center gap-1">
                          <Edit className="h-3 w-3" /><span className="hidden sm:inline">Edit</span>
                        </button>
                        {(new Date(c.endTime) < new Date() || !c.isActive) && (
                          <button onClick={() => navigate(`/trainer/contests/${c._id}/leaderboard`)} className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 inline-flex items-center gap-1">
                            <BarChart className="h-3 w-3" /><span className="hidden sm:inline">Board</span>
                          </button>
                        )}
                        <button onClick={async () => {
                          if (!window.confirm('Delete this contest?')) return;
                          const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
                          try {
                            await axios.delete(`/api/contests/admin/${c._id}`, { headers: { Authorization: `Bearer ${token}` } });
                            setContests(prev => prev.filter(x => x._id !== c._id));
                          } catch (err) {
                            console.error('Delete contest error', err);
                            setToastMsg(err.response?.data?.error || 'Failed to delete contest');
                          }
                        }} className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /><span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
          <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-xs sm:text-sm font-medium">No contests created yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first contest to get started</p>
        </div>
      )}
    </div>
  );
};

export default ContestsTab;
