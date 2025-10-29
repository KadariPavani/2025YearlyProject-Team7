import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, BookOpen, X, Plus, Trash2, 
  Save, User, Mail, Award, Info, Check
} from 'lucide-react';

const TrainerAssignment = ({ batchId, onClose, onUpdate }) => {
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
      <div className="flex items-center justify-center p-8">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl bg-white rounded-xl shadow-2xl my-8 mx-auto">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Trainer Assignment</h2>
            {batchDetails && (
              <p className="text-sm text-gray-600 mt-1">
                {batchDetails.batchNumber} • {batchDetails.techStack} • {batchDetails.colleges.join(', ')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="p-6">

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Batch Stats - Simple Cards */}
        {batchDetails && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Tech Stack</p>
              <p className="text-lg font-semibold text-gray-900">{batchDetails.techStack}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Students</p>
              <p className="text-lg font-semibold text-gray-900">{batchDetails.studentCount}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Year</p>
              <p className="text-lg font-semibold text-gray-900">{batchDetails.year}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Status</p>
              <p className="text-lg font-semibold text-gray-900">{batchDetails.status}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-2">Time Slot Guidelines</p>
              <ul className="space-y-1">
                <li>• Morning: 6:00 AM - 11:59 AM</li>
                <li>• Afternoon: 12:00 PM - 4:59 PM</li>
                <li>• Evening: 5:00 PM - 11:00 PM</li>
              </ul>
              <p className="mt-2 text-blue-700">Time slot badges are calculated automatically from schedule times.</p>
            </div>
          </div>
        </div>

        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
          <button
            onClick={addAssignment}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Trainer
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
          <div className="space-y-4">
            {assignments.map((assignment, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-5">

                {/* Assignment Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-700">{index + 1}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">Trainer {index + 1}</h4>
                  </div>
                  <button
                    onClick={() => removeAssignment(index)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Trainer & Subject Selection */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trainer
                    </label>
                    <select
                      value={assignment.trainerId}
                      onChange={(e) => updateAssignment(index, 'trainerId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={assignment.subject}
                      onChange={(e) => updateAssignment(index, 'subject', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter subject"
                    />
                  </div>
                </div>

                {/* Trainer Info Card */}
                {assignment.trainerName && (
                  <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {assignment.trainerName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900">{assignment.trainerName}</h5>
                        <p className="text-sm text-gray-600">{assignment.trainerEmail}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-300 px-2 py-1 rounded">
                            <Award className="h-3 w-3" />
                            {assignment.trainerCategory}
                          </span>
                          <span className="text-xs text-gray-600">
                            {assignment.trainerSubject}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Weekly Schedule
                    </label>
                    <button
                      onClick={() => addScheduleSlot(index)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Slot
                    </button>
                  </div>

                  <div className="space-y-2">
                    {assignment.schedule.map((slot, scheduleIndex) => {
                      const slotBadge = getTimeSlotFromTime(slot.startTime);

                      return (
                        <div 
                          key={scheduleIndex} 
                          className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          {/* Day */}
                          <select
                            value={slot.day}
                            onChange={(e) => updateSchedule(index, scheduleIndex, 'day', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px]"
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>

                          {/* Start Time */}
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSchedule(index, scheduleIndex, 'startTime', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          />

                          <span className="text-gray-500 text-sm">to</span>

                          {/* End Time */}
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSchedule(index, scheduleIndex, 'endTime', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          />

                          {/* Dynamic Badge */}
                          <span className={`px-3 py-1 rounded-md text-xs font-medium border ${getTimeSlotColor(slotBadge)}`}>
                            {getTimeSlotLabel(slotBadge)}
                          </span>

                          {/* Delete Button */}
                          <button
                            onClick={() => removeScheduleSlot(index, scheduleIndex)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveAssignments}
            disabled={saving || assignments.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Assignments
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainerAssignment;