import React, { useState, useEffect, useMemo } from 'react';
import { Download, Calendar, Search, RefreshCw } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ScheduleTimetable = ({ scheduleData, loading, onRefresh }) => {
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [techStackColors, setTechStackColors] = useState({});

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    { name: 'Morning', start: '09:00', end: '12:00', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    { name: 'Afternoon', start: '14:00', end: '17:00', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { name: 'Evening', start: '18:00', end: '21:00', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
  ];

  useEffect(() => {
    const fetchTechStackColors = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/tech-stacks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          setTechStackColors(response.data.data.colors);
        }
      } catch (error) {
        console.error('Error fetching tech stack colors:', error);
      }
    };
    fetchTechStackColors();
  }, []);

  const getTechStackColor = (techStack) => {
    return techStackColors[techStack] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTimeSlotLabel = (startTime) => {
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 9 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    if (hour >= 18 && hour < 22) return 'Evening';
    return 'Morning';
  };

  // Unique filter values
  const uniqueBatches = [...new Set(scheduleData?.map(item => item.batchNumber) || [])];
  const uniqueColleges = [...new Set(scheduleData?.flatMap(item => item.colleges) || [])];

  // Filter schedule data
  const filteredSchedule = useMemo(() => {
    if (!scheduleData) return [];
    return scheduleData.filter(item => {
      const matchesBatch = selectedBatch === 'all' || item.batchNumber === selectedBatch;
      const matchesCollege = selectedCollege === 'all' || item.colleges.includes(selectedCollege);
      const matchesTimeSlot = selectedTimeSlot === 'all' ||
        item.assignedTrainers?.some(trainer => trainer.timeSlot === selectedTimeSlot);
      const matchesSearch = !searchTerm ||
        item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.colleges.some(college => college.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.assignedTrainers?.some(trainer =>
          trainer.trainer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trainer.subject?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesBatch && matchesCollege && matchesTimeSlot && matchesSearch;
    });
  }, [scheduleData, selectedBatch, selectedCollege, selectedTimeSlot, searchTerm]);

  // Build timetable grid (day x slot -> items)
  const timetableGrid = useMemo(() => {
    const grid = {};
    dayNames.forEach(day => {
      grid[day] = {};
      timeSlots.forEach(slot => { grid[day][slot.name] = []; });
    });

    filteredSchedule.forEach(batch => {
      (batch.assignedTrainers || []).forEach(trainerAssignment => {
        (trainerAssignment.schedule || []).forEach(scheduleItem => {
          const day = scheduleItem.day;
          const slotName = getTimeSlotLabel(scheduleItem.startTime);

          if (grid[day] && grid[day][slotName]) {
            grid[day][slotName].push({
              batchNumber: batch.batchNumber,
              batchId: batch._id,
              trainer: trainerAssignment.trainer,
              subject: trainerAssignment.subject,
              timeSlot: slotName.toLowerCase(),
              startTime: scheduleItem.startTime,
              endTime: scheduleItem.endTime,
              colleges: batch.colleges,
              techStack: batch.techStack,
              studentCount: batch.studentCount,
              year: batch.year
            });
          }
        });
      });
    });
    return grid;
  }, [filteredSchedule]);

  // Stats
  const totalBatches = filteredSchedule.length;
  const activeClasses = filteredSchedule.reduce((acc, batch) =>
    acc + (batch.assignedTrainers?.reduce((t, trainer) => t + (trainer.schedule?.length || 0), 0) || 0), 0);
  const totalStudents = filteredSchedule.reduce((acc, batch) => acc + (batch.studentCount || 0), 0);
  const assignedTrainers = [...new Set(filteredSchedule.flatMap(batch =>
    batch.assignedTrainers?.map(t => t.trainer?._id) || []
  ))].length;

  // Check if grid has any classes
  const hasClasses = activeClasses > 0;

  // Export
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const scheduleSheet = [['Day', 'Time Slot', 'Start Time', 'End Time', 'Batch Number', 'Trainer Name', 'Subject', 'College(s)', 'Tech Stack', 'Year', 'Student Count']];
    dayNames.forEach(day => {
      timeSlots.forEach(slot => {
        const items = timetableGrid[day][slot.name] || [];
        if (items.length === 0) {
          scheduleSheet.push([day, slot.name, slot.start, slot.end, '', '', '', '', '', '', '']);
        } else {
          items.forEach(item => {
            scheduleSheet.push([day, slot.name, item.startTime, item.endTime, item.batchNumber, item.trainer?.name || 'Not Assigned', item.subject || '', item.colleges.join(', '), item.techStack, item.year, item.studentCount]);
          });
        }
      });
    });
    const ws1 = XLSX.utils.aoa_to_sheet(scheduleSheet);
    XLSX.utils.book_append_sheet(workbook, ws1, 'Weekly Schedule');

    const summarySheet = [['Summary Report'], [''], ['Total Batches', totalBatches], ['Total Classes', activeClasses], [''], ['Batch Distribution by College']];
    const collegeDistribution = {};
    filteredSchedule.forEach(batch => { batch.colleges.forEach(c => { collegeDistribution[c] = (collegeDistribution[c] || 0) + 1; }); });
    Object.entries(collegeDistribution).forEach(([college, count]) => { summarySheet.push([college, count]); });
    const ws2 = XLSX.utils.aoa_to_sheet(summarySheet);
    XLSX.utils.book_append_sheet(workbook, ws2, 'Summary');

    XLSX.writeFile(workbook, `TPO_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Overall Schedule Timetable</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Complete schedule overview for all assigned batches</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2" aria-label="Refresh schedule">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={exportToExcel} className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-green-600 hover:bg-green-700 text-white flex items-center gap-2" aria-label="Export schedule to excel">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
            <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Batches</p>
            <p className="text-sm sm:text-xl font-semibold text-blue-900">{totalBatches}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 sm:p-3">
            <p className="text-xs sm:text-sm text-green-600 font-medium">Active Classes</p>
            <p className="text-sm sm:text-xl font-semibold text-green-900">{activeClasses}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 sm:p-3">
            <p className="text-xs sm:text-sm text-amber-600 font-medium">Total Students</p>
            <p className="text-sm sm:text-xl font-semibold text-amber-900">{totalStudents}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 sm:p-3">
            <p className="text-xs sm:text-sm text-purple-600 font-medium">Assigned Trainers</p>
            <p className="text-sm sm:text-xl font-semibold text-purple-900">{assignedTrainers}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white">
            <option value="all">All Batches</option>
            {uniqueBatches.map(batch => <option key={batch} value={batch}>{batch}</option>)}
          </select>
          <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)} className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white">
            <option value="all">All Colleges</option>
            {uniqueColleges.map(college => <option key={college} value={college}>{college}</option>)}
          </select>
          <select value={selectedTimeSlot} onChange={(e) => setSelectedTimeSlot(e.target.value)} className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white">
            <option value="all">All Time Slots</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm" />
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {!hasClasses ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-xs sm:text-sm font-medium">No scheduled classes found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-20 relative bg-blue-50 px-2 py-2 text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 w-12 sm:w-16 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-gray-200">
                    Slot
                  </th>
                  {dayNames.map(day => (
                    <th key={day} className="sticky top-0 z-10 relative bg-blue-50 px-2 py-2 text-center text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200 last:border-r-0 min-w-[130px] sm:min-w-[150px] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-gray-200">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(slot => (
                  <tr key={slot.name} className="border-b border-gray-200 last:border-b-0">
                    <td className={`sticky left-0 z-[5] ${slot.bg} border-r ${slot.border} px-0 py-2 text-center align-middle w-12 sm:w-16`}>
                      <div className="flex items-center justify-center h-full">
                        <span className={`[writing-mode:vertical-lr] rotate-180 text-xs sm:text-sm font-bold ${slot.text} whitespace-nowrap leading-tight`}>
                          {slot.name} {slot.start}-{slot.end}
                        </span>
                      </div>
                    </td>
                    {dayNames.map(day => {
                      const items = timetableGrid[day][slot.name] || [];
                      return (
                        <td key={`${day}-${slot.name}`} className="px-1.5 py-1.5 sm:px-2 sm:py-2 border-r border-gray-200 last:border-r-0 align-top">
                          <div className="space-y-1.5">
                            {items.map((item, index) => (
                              <div key={index} className="bg-white border border-gray-200 rounded-lg p-1.5 sm:p-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">{item.batchNumber}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium border ${getTechStackColor(item.techStack)} whitespace-nowrap`}>
                                    {item.techStack}
                                  </span>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                  <div className="font-medium truncate">{item.trainer?.name || 'Not Assigned'}</div>
                                  <div className="truncate">{item.subject}</div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-400 mt-0.5">
                                  <span>{item.startTime}-{item.endTime}</span>
                                  <span>{item.studentCount} students</span>
                                </div>
                              </div>
                            ))}
                            {items.length === 0 && (
                              <div className="text-center py-3 sm:py-4 text-gray-300 text-xs sm:text-sm">—</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ScheduleTimetable;
