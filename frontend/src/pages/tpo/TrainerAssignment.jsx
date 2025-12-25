import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, BookOpen, X, Plus, Trash2, 
  Save, User, Mail, Award, Info, Check
} from 'lucide-react';

const TrainerAssignment = ({ batchId, onClose, onUpdate, compact = false }) => {
  const [batchDetails, setBatchDetails] = useState(null);
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails();
      fetchAvailableTrainers();
    }
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`/api/tpo/batch-trainer-assignments/${batchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setBatchDetails(data.data.batchInfo);
        setAssignments(data.data.assignedTrainers.map(assignment => ({
          trainerId: assignment.trainer._id,
          trainerName: assignment.trainer.name,
          trainerEmail: assignment.trainer.email,
          trainerSubject: assignment.trainer.subjectDealing,
          trainerCategory: assignment.trainer.category,
          timeSlot: assignment.timeSlot,
          subject: assignment.subject,
          schedule: assignment.schedule || []
        })));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch batch details');
    }
  };

  const fetchAvailableTrainers = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/tpo/available-trainers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setAvailableTrainers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlotFromTime = (timeString) => {
    if (!timeString) return 'morning';
    const hour = parseInt(timeString.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour <= 23) return 'evening';
    return 'morning';
  };

  const determineOverallTimeSlot = (schedule) => {
    if (!schedule || schedule.length === 0) return 'morning';
    return getTimeSlotFromTime(schedule[0].startTime);
  };

  const addAssignment = () => {
    setAssignments([...assignments, {
      trainerId: '',
      trainerName: '',
      trainerEmail: '',
      trainerSubject: '',
      trainerCategory: '',
      timeSlot: 'morning',
      subject: '',
      schedule: [{ day: 'Monday', startTime: '09:00', endTime: '11:00' }]
    }]);
  };

  const removeAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignment = (index, field, value) => {
    const updated = [...assignments];

    if (field === 'trainerId') {
      const selectedTrainer = availableTrainers.find(t => t._id === value);
      if (selectedTrainer) {
        updated[index] = {
          ...updated[index],
          trainerId: value,
          trainerName: selectedTrainer.name,
          trainerEmail: selectedTrainer.email,
          trainerSubject: selectedTrainer.subjectDealing,
          trainerCategory: selectedTrainer.category,
          subject: selectedTrainer.subjectDealing
        };
      }
    } else {
      updated[index][field] = value;
    }

    setAssignments(updated);
  };

  const updateSchedule = (assignmentIndex, scheduleIndex, field, value) => {
    const updated = [...assignments];
    updated[assignmentIndex].schedule[scheduleIndex][field] = value;

    if (scheduleIndex === 0 && field === 'startTime') {
      updated[assignmentIndex].timeSlot = getTimeSlotFromTime(value);
    }

    setAssignments(updated);
  };

  const addScheduleSlot = (assignmentIndex) => {
    const updated = [...assignments];
    updated[assignmentIndex].schedule.push({
      day: 'Monday',
      startTime: '09:00',
      endTime: '11:00'
    });
    setAssignments(updated);
  };

  const removeScheduleSlot = (assignmentIndex, scheduleIndex) => {
    const updated = [...assignments];
    updated[assignmentIndex].schedule.splice(scheduleIndex, 1);

    if (updated[assignmentIndex].schedule.length > 0) {
      updated[assignmentIndex].timeSlot = determineOverallTimeSlot(updated[assignmentIndex].schedule);
    }

    setAssignments(updated);
  };

  const saveAssignments = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');

      const formattedAssignments = assignments.map(assignment => ({
        trainerId: assignment.trainerId,
        timeSlot: determineOverallTimeSlot(assignment.schedule),
        subject: assignment.subject,
        schedule: assignment.schedule
      }));

      const response = await fetch(`/api/tpo/assign-trainers/${batchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trainerAssignments: formattedAssignments })
      });

      const data = await response.json();

      if (data.success) {
        onUpdate && onUpdate();
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  const getTimeSlotColor = (timeSlot) => {
    const colors = {
      morning: 'bg-amber-50 text-amber-700 border-amber-200',
      afternoon: 'bg-blue-50 text-blue-700 border-blue-200',
      evening: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[timeSlot] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getTimeSlotLabel = (timeSlot) => {
    return timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'p-4' : 'p-8'}`}>
        <div className={`bg-white rounded-xl ${compact ? 'p-4' : 'p-8'} shadow-lg`}>
          <div className={`animate-spin rounded-full ${compact ? 'h-8 w-8 border-b-2' : 'h-12 w-12 border-b-3'} border-blue-600 mx-auto mb-4`}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-2xl">
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2.5 sm:px-4 sm:py-3 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white text-base sm:text-lg">Trainer Assignment</h2>
            {batchDetails && (
              <p className="mt-0.5 text-xs sm:text-sm text-blue-100 truncate">
                {batchDetails.batchNumber} • {batchDetails.techStack}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Batch Stats - Simple Cards */}
        {batchDetails && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-2.5">
              <p className="text-[10px] sm:text-xs text-blue-700 mb-0.5 uppercase tracking-wide">Tech Stack</p>
              <p className="text-xs sm:text-sm font-semibold text-blue-900 truncate">{batchDetails.techStack}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-2.5">
              <p className="text-[10px] sm:text-xs text-blue-700 mb-0.5 uppercase tracking-wide">Students</p>
              <p className="text-xs sm:text-sm font-semibold text-blue-900">{batchDetails.studentCount}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-2.5">
              <p className="text-[10px] sm:text-xs text-blue-700 mb-0.5 uppercase tracking-wide">Year</p>
              <p className="text-xs sm:text-sm font-semibold text-blue-900">{batchDetails.year}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-2.5">
              <p className="text-[10px] sm:text-xs text-blue-700 mb-0.5 uppercase tracking-wide">Status</p>
              <p className="text-xs sm:text-sm font-semibold text-blue-900">{batchDetails.status}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
          <div className="flex gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-900">
              <p className="font-medium mb-1 sm:mb-2">Time Slot Guidelines</p>
              <ul className="space-y-0.5 sm:space-y-1">
                <li>• Morning: 6:00 AM - 11:59 AM</li>
                <li>• Afternoon: 12:00 PM - 4:59 PM</li>
                <li>• Evening: 5:00 PM - 11:00 PM</li>
              </ul>
              <p className="mt-1 sm:mt-2 text-blue-700">Time slot badges are calculated automatically from schedule times.</p>
            </div>
          </div>
        </div>

        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Assignments</h3>
          <button
            onClick={addAssignment}
            className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add Trainer</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Assignments List */}
        {assignments.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No trainers assigned</p>
            <p className="text-gray-500 text-sm mt-1">Click "Add Trainer" to get started</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {assignments.map((assignment, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-3 lg:p-4">

                {/* Assignment Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-semibold text-blue-700">{index + 1}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Trainer {index + 1}</h4>
                  </div>
                  <button
                    onClick={() => removeAssignment(index)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>

                {/* Trainer & Subject Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Trainer
                    </label>
                    <select
                      value={assignment.trainerId}
                      onChange={(e) => updateAssignment(index, 'trainerId', e.target.value)}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                    >
                      <option value="">Select trainer...</option>
                      {availableTrainers.map(trainer => (
                        <option key={trainer._id} value={trainer._id}>
                          {trainer.name} - {trainer.subjectDealing}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={assignment.subject}
                      onChange={(e) => updateAssignment(index, 'subject', e.target.value)}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                      placeholder="Enter subject"
                    />
                  </div>
                </div>

                {/* Trainer Info Card */}
                {assignment.trainerName && (
                  <div className="mb-3 bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-2.5">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm sm:text-base">
                        {assignment.trainerName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{assignment.trainerName}</h5>
                        <p className="text-[10px] sm:text-xs text-gray-600 truncate">{assignment.trainerEmail}</p>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-white border border-gray-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                            <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {assignment.trainerCategory}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-600 truncate">
                            {assignment.trainerSubject}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Section */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">
                      Weekly Schedule
                    </label>
                    <button
                      onClick={() => addScheduleSlot(index)}
                      className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Add Slot</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {assignment.schedule.map((slot, scheduleIndex) => {
                      const slotBadge = getTimeSlotFromTime(slot.startTime);

                      return (
                        <div 
                          key={scheduleIndex} 
                          className="bg-gray-50 p-2 sm:p-2.5 rounded-lg border border-gray-200"
                        >
                          {/* Mobile Layout */}
                          <div className="flex flex-col sm:hidden gap-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={slot.day}
                                onChange={(e) => updateSchedule(index, scheduleIndex, 'day', e.target.value)}
                                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              >
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => removeScheduleSlot(index, scheduleIndex)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1 flex-shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateSchedule(index, scheduleIndex, 'startTime', e.target.value)}
                                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-gray-500 text-xs flex-shrink-0">to</span>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateSchedule(index, scheduleIndex, 'endTime', e.target.value)}
                                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <span className={`self-start px-2 py-0.5 rounded text-[10px] font-medium border ${getTimeSlotColor(slotBadge)}`}>
                              {getTimeSlotLabel(slotBadge)}
                            </span>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:flex items-center gap-2">
                            <select
                              value={slot.day}
                              onChange={(e) => updateSchedule(index, scheduleIndex, 'day', e.target.value)}
                              className="px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 min-w-[100px] sm:min-w-[110px]"
                            >
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateSchedule(index, scheduleIndex, 'startTime', e.target.value)}
                              className="px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 w-24 sm:w-28"
                            />
                            <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">to</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateSchedule(index, scheduleIndex, 'endTime', e.target.value)}
                              className="px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 w-24 sm:w-28"
                            />
                            <span className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium border ${getTimeSlotColor(slotBadge)} flex-shrink-0`}>
                              {getTimeSlotLabel(slotBadge)}
                            </span>
                            <button
                              onClick={() => removeScheduleSlot(index, scheduleIndex)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 ml-auto flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 sm:px-5 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveAssignments}
            disabled={saving || assignments.length === 0}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Saving...</span>
                <span className="sm:hidden">Save...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Save Assignments</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainerAssignment;