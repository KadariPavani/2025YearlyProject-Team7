import React, { useState, useEffect } from 'react';
import { Download, Calendar, Clock, User, BookOpen, Filter, Search, RefreshCw, FileSpreadsheet, Eye, X } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ScheduleTimetable = ({ scheduleData, loading, onRefresh }) => {
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState(null);
  const [techStackColors, setTechStackColors] = useState({});


  // Get current week dates
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }

    return weekDates;
  };


  const weekDates = getCurrentWeek();
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    { name: 'Morning', start: '09:00', end: '12:00', color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
    { name: 'Afternoon', start: '14:00', end: '17:00', color: 'bg-blue-50 border-blue-300 text-blue-800' },
    { name: 'Evening', start: '18:00', end: '21:00', color: 'bg-purple-50 border-purple-300 text-purple-800' }
  ];


  // Get unique values for filters
  const uniqueBatches = [...new Set(scheduleData?.map(item => item.batchNumber) || [])];
  const uniqueColleges = [...new Set(scheduleData?.flatMap(item => item.colleges) || [])];


  // Filter schedule data based on selected filters
  const getFilteredSchedule = () => {
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
  };


  const filteredSchedule = getFilteredSchedule();


  // ✅ FIXED: CREATE TIMETABLE GRID BASED ON ACTUAL SCHEDULE START TIME, NOT SLOT LABEL
  const createTimetableGrid = () => {
    const grid = {};
    dayNames.forEach(day => {
      grid[day] = {};
      timeSlots.forEach(slot => {
        grid[day][slot.name] = [];
      });
    });

    filteredSchedule.forEach(batch => {
      if (batch.assignedTrainers && batch.assignedTrainers.length > 0) {
        batch.assignedTrainers.forEach(trainerAssignment => {
          if (trainerAssignment.schedule && trainerAssignment.schedule.length > 0) {
            trainerAssignment.schedule.forEach(scheduleItem => {
              const day = scheduleItem.day;

              // ✅ FIX: Determine slot by ACTUAL schedule startTime, not assignment label
              const startHour = parseInt(scheduleItem.startTime.split(':')[0]);
              let slotName;

              // Time boundaries based on actual time:
              // Morning: 09:00 - 11:59 (hours 9, 10, 11)
              // Afternoon: 12:00 - 17:59 (hours 12, 13, 14, 15, 16, 17)
              // Evening: 18:00 - 21:59 (hours 18, 19, 20, 21)

              if (startHour >= 9 && startHour < 12) {
                slotName = 'Morning';
              } else if (startHour >= 12 && startHour < 18) {
                slotName = 'Afternoon';
              } else if (startHour >= 18 && startHour < 22) {
                slotName = 'Evening';
              } else {
                slotName = 'Morning'; // Default fallback
              }

              if (grid[day] && grid[day][slotName]) {
                grid[day][slotName].push({ 
                  batchNumber: batch.batchNumber, 
                  batchId: batch._id, 
                  trainer: trainerAssignment.trainer, 
                  subject: trainerAssignment.subject, 
                  timeSlot: slotName.toLowerCase(), // Use calculated slot based on actual time
                  startTime: scheduleItem.startTime, 
                  endTime: scheduleItem.endTime, 
                  colleges: batch.colleges, 
                  techStack: batch.techStack, 
                  studentCount: batch.studentCount, 
                  year: batch.year 
                });
              }
            });
          }
        });
      }
    });

    return grid;
  };


  const timetableGrid = createTimetableGrid();


  // Export to Excel function
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Create main schedule sheet
    const scheduleSheet = [];

    // Headers
    scheduleSheet.push([
      'Day', 'Time Slot', 'Start Time', 'End Time', 'Batch Number', 
      'Trainer Name', 'Subject', 'College(s)', 'Tech Stack', 
      'Year', 'Student Count'
    ]);


    // Data rows
    dayNames.forEach(day => {
      timeSlots.forEach(slot => {
        const items = timetableGrid[day][slot.name] || [];

        if (items.length === 0) {
          // Add empty slot
          scheduleSheet.push([
            day, slot.name, slot.start, slot.end, 
            '', '', '', '', '', '', ''
          ]);
        } else {
          items.forEach(item => {
            scheduleSheet.push([
              day,
              slot.name,
              item.startTime,
              item.endTime,
              item.batchNumber,
              item.trainer?.name || 'Not Assigned',
              item.subject || '',
              item.colleges.join(', '),
              item.techStack,
              item.year,
              item.studentCount
            ]);
          });
        }
      });
    });


    const ws1 = XLSX.utils.aoa_to_sheet(scheduleSheet);
    XLSX.utils.book_append_sheet(workbook, ws1, "Weekly Schedule");


    // Create summary sheet
    const summarySheet = [];
    summarySheet.push(['Summary Report']);
    summarySheet.push(['']);
    summarySheet.push(['Total Batches', filteredSchedule.length]);
    summarySheet.push(['Total Classes', filteredSchedule.reduce((acc, batch) => {
      return acc + (batch.assignedTrainers?.reduce((trainerAcc, trainer) => {
        return trainerAcc + (trainer.schedule?.length || 0);
      }, 0) || 0);
    }, 0)]);
    summarySheet.push(['']);
    summarySheet.push(['Batch Distribution by College']);

    const collegeDistribution = {};
    filteredSchedule.forEach(batch => {
      batch.colleges.forEach(college => {
        collegeDistribution[college] = (collegeDistribution[college] || 0) + 1;
      });
    });

    Object.entries(collegeDistribution).forEach(([college, count]) => {
      summarySheet.push([college, count]);
    });


    const ws2 = XLSX.utils.aoa_to_sheet(summarySheet);
    XLSX.utils.book_append_sheet(workbook, ws2, "Summary");


    // Generate filename with current date
    const fileName = `TPO_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };


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


  const getTimeSlotColor = (timeSlot) => {
    const colors = {
      morning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      afternoon: 'bg-blue-100 text-blue-800 border-blue-300',
      evening: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[timeSlot] || 'bg-gray-100 text-gray-700 border-gray-200';
  };


  if (loading) return <LoadingSkeleton />;


  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-lg sm:rounded-2xl shadow border border-gray-300 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Calendar className="h-6 w-6 text-purple-700 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-1xl font-bold text-gray-900 ">Overall Schedule Timetable</h2>
              <p className="text-sm text-gray-600 mt-0.5 hidden sm:block">Complete schedule overview for all assigned batches</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md sm:rounded-lg transition-colors text-xs sm:text-sm"
              aria-label="Refresh schedule"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-md sm:rounded-lg transition-colors font-medium text-xs sm:text-sm"
              aria-label="Export schedule to excel"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>


        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 text-sm"
            >
              <option value="all">All Batches</option>
              {uniqueBatches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 text-sm"
            >
              <option value="all">All Colleges</option>
              {uniqueColleges.map(college => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
            <select
              value={selectedTimeSlot}
              onChange={(e) => setSelectedTimeSlot(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 text-sm"
            >
              <option value="all">All Time Slots</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 text-sm"
            >
              <option value="grid">Grid View</option>
              <option value="table">Table View</option>
            </select>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 text-sm"
              />
            </div>
          </div>
        </div>


        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs font-medium text-blue-600 mb-1">Total Batches</p>
            <p className="text-lg font-bold text-blue-900">{filteredSchedule.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs font-medium text-green-600 mb-1">Active Classes</p>
            <p className="text-lg font-bold text-green-900">
              {filteredSchedule.reduce((acc, batch) => {
                return acc + (batch.assignedTrainers?.reduce((trainerAcc, trainer) => {
                  return trainerAcc + (trainer.schedule?.length || 0);
                }, 0) || 0);
              }, 0)}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs font-medium text-amber-600 mb-1">Total Students</p>
            <p className="text-lg font-bold text-amber-900">
              {filteredSchedule.reduce((acc, batch) => acc + (batch.studentCount || 0), 0)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-xs font-medium text-purple-600 mb-1">Assigned Trainers</p>
            <p className="text-lg font-bold text-purple-900">
              {[...new Set(filteredSchedule.flatMap(batch => 
                batch.assignedTrainers?.map(t => t.trainer?._id) || []
              ))].length}
            </p>
          </div>
        </div>
      </div>


      {/* Timetable Grid View */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-lg sm:rounded-2xl shadow border border-gray-300 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Weekly Schedule Grid</h3>
            <p className="text-sm text-gray-600 mt-1">
              Current week: {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
            </p>
          </div>

          <div className="overflow-x-auto">
            {/* Desktop / Tablet grid (shows as table on sm+) */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-2 text-left text-[11px] font-bold text-purple-700 uppercase tracking-wider border-r border-gray-300">
                      Time Slot
                    </th>
                    {dayNames.map(day => (
                      <th key={day} className="px-2 py-2 text-center text-[11px] font-bold text-purple-700 uppercase tracking-wider border-r border-gray-300 min-w-[140px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {timeSlots.map(slot => (
                    <tr key={slot.name} className="hover:bg-gray-50">
                      <td className="px-2 py-3 border-r border-gray-300">
                        <div className={`px-2 py-1 rounded-md border font-medium text-center ${slot.color}`}>
                          <div className="font-bold">{slot.name}</div>
                          <div className="text-xs mt-1">{slot.start} - {slot.end}</div>
                        </div>
                      </td>
                      {dayNames.map(day => (
                        <td key={`${day}-${slot.name}`} className="px-2 py-2 border-r border-gray-200 align-top">
                          <div className="space-y-1">
                            {(timetableGrid[day][slot.name] || []).map((item, index) => (
                              <div
                                key={index}
                                className="bg-white border border-gray-300 rounded-md p-2 shadow-sm hover:shadow transition-shadow cursor-pointer text-sm"
                                onClick={() => {
                                  setSelectedScheduleItem(item);
                                  setShowScheduleDetail(true);
                                }}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-sm text-gray-900">{item.batchNumber}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getTechStackColor(item.techStack)}`}>
                                    {item.techStack}
                                  </span>
                                </div>

                                <div className="text-xs text-gray-600 mb-1">
                                  <div className="font-medium">{item.trainer?.name || 'Not Assigned'}</div>
                                  <div>{item.subject}</div>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">{item.startTime} - {item.endTime}</span>
                                  <span className="text-gray-500">{item.studentCount} students</span>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.colleges.map(college => (
                                    <span key={college} className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                      {college}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {(timetableGrid[day][slot.name] || []).length === 0 && (
                              <div className="text-center py-4 text-gray-400 text-sm">
                                No classes scheduled
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked view */}
            <div className="sm:hidden space-y-4 px-2">
              {dayNames.map(day => (
                <div key={day} className="bg-white rounded-sm sm:rounded-md border border-gray-300 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{day}</div>
                      <div className="text-[11px] text-gray-500">{weekDates[dayNames.indexOf(day)].toLocaleDateString()}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getTimeSlotColor('morning')}`}>{'Slots'}</div>
                  </div>

                  {timeSlots.map(slot => (
                    <div key={slot.name} className="mb-2">
                      <div className={`flex items-center justify-between mb-1 ${slot.color} px-2 py-1 rounded text-xs font-semibold`}> 
                        <div>{slot.name}</div>
                        <div className="text-[11px]">{slot.start} - {slot.end}</div>
                      </div>

                      {(timetableGrid[day][slot.name] || []).map((item, idx) => (
                        <div key={idx} className="bg-white border border-gray-300 rounded-sm sm:rounded-md p-2 mb-2 shadow-sm cursor-pointer" onClick={() => { setSelectedScheduleItem(item); setShowScheduleDetail(true); }}>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{item.batchNumber} <span className={`px-1 py-0.5 rounded text-xs font-medium border ${getTechStackColor(item.techStack)}`}>{item.techStack}</span></div>
                              <div className="text-xs text-gray-600 truncate">{item.trainer?.name || 'Not Assigned'} • {item.subject}</div>
                            </div>
                            <div className="text-right text-[11px] text-gray-500">{item.startTime} - {item.endTime}</div>
                          </div>
                        </div>
                      ))}

                      {(timetableGrid[day][slot.name] || []).length === 0 && (
                        <div className="text-sm text-gray-400 py-1">No classes</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg sm:rounded-2xl shadow border border-gray-300 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Schedule Table View</h3>
            <p className="text-sm text-gray-600 mt-1">Detailed list of all scheduled classes</p>
          </div>

          <div className="overflow-x-auto">
            {/* Desktop / Tablet Table */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trainer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">College</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-300">
                  {filteredSchedule.flatMap(batch =>
                    (batch.assignedTrainers || []).flatMap(trainer =>
                      (trainer.schedule || []).map((schedule, index) => ({
                        ...batch,
                        trainer,
                        schedule,
                        uniqueKey: `${batch._id}-${trainer.trainer?._id}-${index}`
                      }))
                    )
                  ).map(item => (
                    <tr key={item.uniqueKey} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.batchNumber}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getTechStackColor(item.techStack)}`}>
                            {item.techStack}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.schedule.day}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-900">
                            {item.schedule.startTime} - {item.schedule.endTime}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getTimeSlotColor(item.trainer.timeSlot)}`}>
                            {item.trainer.timeSlot}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {item.trainer.trainer?.name?.charAt(0) || 'T'}
                          </div>
                          <span className="text-sm text-gray-900">{item.trainer.trainer?.name || 'Not Assigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.trainer.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {item.colleges.map(college => (
                            <span key={college} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {college}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.studentCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedScheduleItem({
                              ...item,
                              startTime: item.schedule.startTime,
                              endTime: item.schedule.endTime
                            });
                            setShowScheduleDetail(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSchedule.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No scheduled classes found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>

            {/* Mobile List View */}
            <div className="sm:hidden space-y-3 px-2">
              {filteredSchedule.flatMap(batch =>
                (batch.assignedTrainers || []).flatMap(trainer =>
                  (trainer.schedule || []).map((schedule, index) => ({
                    ...batch,
                    trainer,
                    schedule,
                    uniqueKey: `${batch._id}-${trainer.trainer?._id}-${index}`
                  }))
                )
              ).map(item => (
                <div key={item.uniqueKey} className="bg-white rounded-sm sm:rounded-md border border-gray-300 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{item.batchNumber} <span className={`px-1 py-0.5 rounded text-xs font-medium border ${getTechStackColor(item.techStack)}`}>{item.techStack}</span></div>
                      <div className="text-xs text-gray-600 truncate">{item.schedule.day} • {item.schedule.startTime} - {item.schedule.endTime}</div>
                      <div className="text-xs text-gray-700 mt-1 truncate">{item.trainer.trainer?.name || 'Not Assigned'} • {item.trainer.subject}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.colleges.map(college => (
                          <span key={college} className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{college}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <div className="text-[11px] text-gray-500">{item.studentCount} students</div>
                      <button onClick={() => { setSelectedScheduleItem({ ...item, startTime: item.schedule.startTime, endTime: item.schedule.endTime }); setShowScheduleDetail(true); }} className="bg-purple-600 text-white px-2 py-1 rounded text-xs">View</button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredSchedule.length === 0 && (
                <div className="text-center py-6 text-gray-500">No scheduled classes found</div>
              )}
            </div>

          </div>
        </div>
      )}


      {/* Schedule Detail Modal */}
      {showScheduleDetail && selectedScheduleItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
            <div className="bg-purple-700 px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Schedule Details</h3>
                <p className="text-purple-200 text-sm">{selectedScheduleItem.batchNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowScheduleDetail(false);
                  setSelectedScheduleItem(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>


            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-xs font-medium text-blue-600 mb-1">Time</p>
                  <p className="text-lg font-bold text-blue-900">
                    {selectedScheduleItem.startTime} - {selectedScheduleItem.endTime}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 capitalize">{selectedScheduleItem.timeSlot} slot</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-xs font-medium text-green-600 mb-1">Students</p>
                  <p className="text-lg font-bold text-green-900">{selectedScheduleItem.studentCount}</p>
                  <p className="text-xs text-green-600 mt-1">Enrolled</p>
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Batch Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Batch Number:</span>
                      <span className="font-medium">{selectedScheduleItem.batchNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tech Stack:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getTechStackColor(selectedScheduleItem.techStack)}`}>
                        {selectedScheduleItem.techStack}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{selectedScheduleItem.year}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Colleges:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedScheduleItem.colleges.map(college => (
                          <span key={college} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {college}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>


                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Trainer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedScheduleItem.trainer?.name || 'Not Assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subject:</span>
                      <span className="font-medium">{selectedScheduleItem.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium capitalize">{selectedScheduleItem.trainer?.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{selectedScheduleItem.trainer?.experience} years</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ScheduleTimetable;