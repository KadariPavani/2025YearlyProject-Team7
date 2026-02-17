import React from 'react';
import { Clock } from 'lucide-react';

const DashboardTab = ({ todaySchedule, getTimeSlotColor, getTimeSlotLabel, getCurrentTimeStatus }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Today's Classes</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{todaySchedule.length} classes scheduled</p>
        </div>
      </div>

      {todaySchedule.length > 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batch</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Time</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Slot</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todaySchedule.map((classSession, idx) => {
                  const timeStatus = getCurrentTimeStatus(classSession.scheduleSlot.startTime, classSession.scheduleSlot.endTime);
                  return (
                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{classSession.batchNumber}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">{classSession.techStack}</div>
                      </td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{classSession.myAssignment.subject}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{classSession.scheduleSlot.startTime} - {classSession.scheduleSlot.endTime}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium border ${getTimeSlotColor(classSession.myAssignment.timeSlot)}`}>
                          {getTimeSlotLabel(classSession.myAssignment.timeSlot)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium border ${timeStatus.color}`}>
                          {timeStatus.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-xs sm:text-sm font-medium">No classes scheduled for today</p>
          <p className="text-xs text-gray-400 mt-1">Enjoy your free day!</p>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
