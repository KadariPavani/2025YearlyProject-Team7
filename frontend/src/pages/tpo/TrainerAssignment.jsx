import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, MapPin, BookOpen, X, Plus, Trash2, Save, UserCheck } from 'lucide-react';

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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const addAssignment = () => {
    setAssignments([...assignments, {
      trainerId: '',
      trainerName: '',
      trainerEmail: '',
      trainerSubject: '',
      trainerCategory: '',
      timeSlot: 'morning',
      subject: '',
      schedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]
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
          subject: selectedTrainer.subjectDealing // Auto-fill subject
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
    setAssignments(updated);
  };

  const addScheduleSlot = (assignmentIndex) => {
    const updated = [...assignments];
    updated[assignmentIndex].schedule.push({
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00'
    });
    setAssignments(updated);
  };

  const removeScheduleSlot = (assignmentIndex, scheduleIndex) => {
    const updated = [...assignments];
    updated[assignmentIndex].schedule.splice(scheduleIndex, 1);
    setAssignments(updated);
  };

  const saveAssignments = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`/api/tpo/assign-trainers/${batchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trainerAssignments: assignments.map(assignment => ({
            trainerId: assignment.trainerId,
            timeSlot: assignment.timeSlot,
            subject: assignment.subject,
            schedule: assignment.schedule
          }))
        })
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
      morning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      afternoon: 'bg-blue-100 text-blue-800 border-blue-200',
      evening: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[timeSlot] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-2xl flex justify-between items-center text-white">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <UserCheck className="h-7 w-7" />
                Assign Trainers
              </h3>
              {batchDetails && (
                <p className="text-purple-200 text-sm mt-1">
                  {batchDetails.batchNumber} - {batchDetails.techStack} - {batchDetails.colleges.join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Batch Info Cards */}
            {batchDetails && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-xs font-medium text-purple-600 mb-1">Tech Stack</p>
                  <p className="text-lg font-bold text-purple-900">{batchDetails.techStack}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-xs font-medium text-blue-600 mb-1">Students</p>
                  <p className="text-lg font-bold text-blue-900">{batchDetails.studentCount}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-xs font-medium text-green-600 mb-1">Year</p>
                  <p className="text-lg font-bold text-green-900">{batchDetails.year}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-xs font-medium text-amber-600 mb-1">Status</p>
                  <p className="text-lg font-bold text-amber-900">{batchDetails.status}</p>
                </div>
              </div>
            )}

            {/* Trainer Assignments */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-gray-900">Trainer Assignments</h4>
                <button
                  onClick={addAssignment}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Trainer
                </button>
              </div>

              {assignments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No trainers assigned yet</p>
                  <p className="text-gray-400 text-sm">Click "Add Trainer" to start assigning</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <h5 className="font-semibold text-gray-900">Assignment #{index + 1}</h5>
                        <button
                          onClick={() => removeAssignment(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {/* Trainer Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Select Trainer</label>
                          <select
                            value={assignment.trainerId}
                            onChange={(e) => updateAssignment(index, 'trainerId', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Choose a trainer...</option>
                            {availableTrainers.map(trainer => (
                              <option key={trainer._id} value={trainer._id}>
                                {trainer.name} - {trainer.subjectDealing} ({trainer.category})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Time Slot */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                          <select
                            value={assignment.timeSlot}
                            onChange={(e) => updateAssignment(index, 'timeSlot', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="morning">Morning (9 AM - 12 PM)</option>
                            <option value="afternoon">Afternoon (1 PM - 4 PM)</option>
                            <option value="evening">Evening (5 PM - 8 PM)</option>
                          </select>
                        </div>

                        {/* Subject */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                          <input
                            type="text"
                            value={assignment.subject}
                            onChange={(e) => updateAssignment(index, 'subject', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Subject to teach"
                          />
                        </div>
                      </div>

                      {/* Trainer Info Display */}
                      {assignment.trainerName && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {assignment.trainerName.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h6 className="font-semibold text-gray-900">{assignment.trainerName}</h6>
                              <p className="text-sm text-gray-600">{assignment.trainerEmail}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {assignment.trainerCategory}
                                </span>
                                <span className="text-xs text-gray-600">
                                  Specializes in: {assignment.trainerSubject}
                                </span>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getTimeSlotColor(assignment.timeSlot)}`}>
                              {assignment.timeSlot}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Schedule */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">Weekly Schedule</label>
                          <button
                            onClick={() => addScheduleSlot(index)}
                            className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            Add Time Slot
                          </button>
                        </div>

                        <div className="space-y-2">
                          {assignment.schedule.map((slot, scheduleIndex) => (
                            <div key={scheduleIndex} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                              <select
                                value={slot.day}
                                onChange={(e) => updateSchedule(index, scheduleIndex, 'day', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </select>

                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateSchedule(index, scheduleIndex, 'startTime', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />

                              <span className="text-gray-500">to</span>

                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateSchedule(index, scheduleIndex, 'endTime', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />

                              <button
                                onClick={() => removeScheduleSlot(index, scheduleIndex)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAssignments}
                disabled={saving || assignments.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerAssignment;