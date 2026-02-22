import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { GraduationCap, Eye } from 'lucide-react';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeletons';

const MyBatchesTab = ({ placementBatches, weeklySchedule, getTimeSlotColor, getTimeSlotLabel, navigate }) => {
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const batchModalRef = useRef(null);

  const fetchBatchDetails = async (batchId) => {
    try {
      setBatchLoading(true);
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      const res = await axios.get(`/api/trainer/placement-batch-details/${batchId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.success) {
        setSelectedBatchDetails(res.data.data);
      } else {
        setSelectedBatchDetails(null);
      }
    } catch (err) {
      setSelectedBatchDetails(null);
    } finally {
      setBatchLoading(false);
      setShowBatchModal(true);
    }
  };

  const handleViewClick = (batchId) => {
    if (window.innerWidth < 640) {
      fetchBatchDetails(batchId);
    } else {
      navigate(`/trainer/batches/${batchId}`);
    }
  };

  useEffect(() => {
    if (!showBatchModal) return;
    const onDocClick = (e) => {
      if (batchModalRef.current && !batchModalRef.current.contains(e.target)) {
        setModalOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [showBatchModal]);

  useEffect(() => {
    if (showBatchModal) {
      setModalOpen(false);
      const id = setTimeout(() => setModalOpen(true), 20);
      return () => clearTimeout(id);
    }
  }, [showBatchModal]);

  useEffect(() => {
    if (!modalOpen && showBatchModal) {
      const id = setTimeout(() => {
        setShowBatchModal(false);
        setSelectedBatchDetails(null);
      }, 300);
      return () => clearTimeout(id);
    }
  }, [modalOpen, showBatchModal]);

  return (
    <div className="space-y-6">
      {/* Batch Table */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">My Training Batches</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{placementBatches.length} batches assigned</p>
          </div>
        </div>

        {placementBatches.length > 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batch</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Tech Stack</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">College(s)</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                 </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {placementBatches.map((batch, idx) => (
                    <tr key={batch._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{batch.batchNumber}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">Year {batch.year}</div>
                      </td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{batch.techStack}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap max-w-[150px] truncate">{batch.colleges?.join(', ')}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{batch.myAssignment?.subject || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-xs sm:text-sm font-medium">No training batches assigned yet</p>
            <p className="text-xs text-gray-400 mt-1">Contact your TPO for batch assignments</p>
          </div>
        )}
      </div>

      {/* Weekly Schedule Grid */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Weekly Class Schedule</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{placementBatches.length} batches</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-50">
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
                    <th key={day} className="px-2 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200 last:border-r-0 min-w-[120px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
                    <td key={day} className="align-top px-1.5 py-1.5 border-r border-gray-200 last:border-r-0 min-w-[120px]">
                      <div className="space-y-1.5">
                        {(weeklySchedule[day] || []).length > 0 ? (weeklySchedule[day]).map((classSession, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-1.5 sm:p-2">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{classSession.batchNumber}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 truncate">{classSession.myAssignment?.subject}</div>
                            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{classSession.scheduleSlot.startTime}-{classSession.scheduleSlot.endTime}</div>
                            {/* <span className={`mt-1 inline-block px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-medium border ${getTimeSlotColor(classSession.myAssignment?.timeSlot)}`}>
                              {getTimeSlotLabel(classSession.myAssignment?.timeSlot)}
                            </span> */}
                          </div>
                        )) : (
                          <div className="text-center py-3 text-gray-300 text-xs">—</div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Batch Details Modal (mobile) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${modalOpen ? 'opacity-100' : 'opacity-0'}`} />
          <div className="relative w-full sm:max-w-lg flex justify-center">
            <div
              ref={batchModalRef}
              className={`bg-white w-full rounded-t-2xl sm:rounded-lg p-4 sm:p-5 shadow-lg border border-gray-200 transition-transform duration-300 ease-out transform ${modalOpen ? 'translate-y-0' : 'translate-y-full'}`}
              style={{ maxHeight: '80vh', overflow: 'auto' }}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900">{selectedBatchDetails?.batchInfo?.batchNumber || 'Batch Details'}</h4>
                <button onClick={() => setModalOpen(false)} className="px-2 py-1 rounded text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">Close</button>
              </div>
              {batchLoading ? (
                <LoadingSkeleton />
              ) : selectedBatchDetails ? (
                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded p-2 border border-gray-100"><span className="text-[10px] text-gray-400 block">Tech Stack</span><span className="font-medium">{selectedBatchDetails.batchInfo.techStack}</span></div>
                    <div className="bg-gray-50 rounded p-2 border border-gray-100"><span className="text-[10px] text-gray-400 block">Year</span><span className="font-medium">{selectedBatchDetails.batchInfo.year}</span></div>
                    <div className="bg-gray-50 rounded p-2 border border-gray-100"><span className="text-[10px] text-gray-400 block">Status</span><span className="font-medium">{selectedBatchDetails.batchInfo.status}</span></div>
                    <div className="bg-gray-50 rounded p-2 border border-gray-100"><span className="text-[10px] text-gray-400 block">Start Date</span><span className="font-medium">{new Date(selectedBatchDetails.batchInfo.startDate).toLocaleDateString()}</span></div>
                  </div>
                  {selectedBatchDetails.myAssignment && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 mb-1.5">My Assignment</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded p-2 border border-gray-100"><span className="text-[10px] text-gray-400 block">Subject</span><span className="font-medium">{selectedBatchDetails.myAssignment.subject}</span></div>
                        <div className="bg-gray-50 rounded p-2 border border-gray-100"><span className="text-[10px] text-gray-400 block">Time Slot</span><span className="font-medium">{selectedBatchDetails.myAssignment.timeSlot}</span></div>
                      </div>
                      {selectedBatchDetails.myAssignment.schedule?.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                          {selectedBatchDetails.myAssignment.schedule.map((s, i) => (
                            <div key={i} className="text-xs bg-blue-50 rounded p-1.5 border border-blue-200">
                              <span className="font-medium text-blue-800">{s.day}</span>
                              <span className="text-blue-600 ml-1">{s.startTime}-{s.endTime}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-gray-500">Failed to load details</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBatchesTab;
