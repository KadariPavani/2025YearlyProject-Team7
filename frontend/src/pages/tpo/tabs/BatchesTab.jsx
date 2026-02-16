import React, { useState } from 'react';
import { Users, Calendar, Eye, Building2, UserPlus, UserCheck, GraduationCap, Search, ArrowLeft } from 'lucide-react';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeletons';
import TrainerAssignment from '../TrainerAssignment';

const BatchesTab = ({
  loadingPlacementBatches,
  filteredBatches,
  selectedYear,
  setSelectedYear,
  selectedCollege,
  setSelectedCollege,
  selectedTechStack,
  setSelectedTechStack,
  searchTerm,
  setSearchTerm,
  years,
  colleges,
  techStacks,
  handleAssignCoordinator,
  assigningCoordinatorId,
  fetchPlacementTrainingBatches,
  fetchScheduleData,
  fetchStudentDetailsByBatch,
  getTechStackColor,
  getTechStackBadgeColor,
  getTrainerAssignmentStatus
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'detail' | 'assign'
  const [selectedBatchData, setSelectedBatchData] = useState(null);

  const handleViewBatch = (batch) => {
    setSelectedBatchData(batch);
    setViewMode('detail');
  };

  const handleAssignBatch = (batchId) => {
    setSelectedBatchData({ _id: batchId });
    setViewMode('assign');
  };

  const handleBack = () => {
    setViewMode('grid');
    setSelectedBatchData(null);
  };

  const handleAssignmentUpdate = () => {
    fetchPlacementTrainingBatches();
    fetchScheduleData();
    fetchStudentDetailsByBatch();
    handleBack();
  };

  // Detail view
  if (viewMode === 'detail' && selectedBatchData) {
    return (
      <div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-4 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Batches
        </button>

        {/* Batch Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2.5 sm:px-4 sm:py-3 rounded-t-lg flex items-center">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-1.5 sm:gap-2 truncate">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">{selectedBatchData.batchNumber}</span>
            </h3>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5 truncate">
              {selectedBatchData.college} • Year {selectedBatchData.year}
            </p>
          </div>
        </div>

        {/* Batch Detail Content */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 border border-t-0 border-gray-200 rounded-b-lg">

          {/* Assigned Trainers */}
          {selectedBatchData.assignedTrainers && selectedBatchData.assignedTrainers.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 border border-gray-200">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                Assigned Trainers ({selectedBatchData.assignedTrainers.length})
              </h4>
              <div className="space-y-2">
                {selectedBatchData.assignedTrainers.map((assignment, index) => (
                  <div key={index} className="bg-white rounded-lg p-2 sm:p-2.5 border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                          {assignment.trainer?.name?.charAt(0) || 'T'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{assignment.trainer?.name || 'Unknown'}</h5>
                          <p className="text-gray-600 text-[10px] sm:text-xs truncate">{assignment.subject}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                          assignment.timeSlot === 'morning' ? 'bg-blue-100 text-blue-800' :
                          assignment.timeSlot === 'afternoon' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.timeSlot}
                        </span>
                        <span className="text-gray-500 text-[10px]">
                          {assignment.schedule?.length || 0} slots
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 border-b border-gray-200">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                Students List ({selectedBatchData.students.length})
              </h4>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto max-h-64">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Roll No</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">College</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Tech Stack</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {selectedBatchData.students.map((student, idx) => (
                    <tr key={student._id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 text-xs">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700 font-mono">{student.rollNo}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{student.college}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{student.branch}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
                          {student.techStack?.join(', ') || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {selectedBatchData.coordinators && selectedBatchData.coordinators.length > 0 && selectedBatchData.coordinators.some(coord => {
                          return coord.rollNo && student.rollNo && String(coord.rollNo) === String(student.rollNo);
                        }) ? (
                          <span className="px-2 py-1 text-[10px] rounded bg-green-100 text-green-800">Coordinator</span>
                        ) : (
                          <button
                            onClick={() => handleAssignCoordinator(student._id, selectedBatchData._id)}
                            disabled={assigningCoordinatorId === student._id}
                            className={`px-2 py-1 text-[10px] rounded transition-colors ${
                              assigningCoordinatorId === student._id
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {assigningCoordinatorId === student._id ? 'Assigning...' : 'Make Coordinator'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden max-h-64 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {selectedBatchData.students.map((student, idx) => (
                  <div key={student._id} className={`p-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 text-xs mb-0.5 truncate">{student.name}</h5>
                        <p className="text-[10px] text-gray-600 font-mono">{student.rollNo}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-[10px] text-gray-700 mb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">College:</span>
                        <span className="truncate ml-2">{student.college}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Branch:</span>
                        <span className="truncate ml-2">{student.branch}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Tech:</span>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
                          {student.techStack?.join(', ') || 'N/A'}
                        </span>
                      </div>
                    </div>
                    {selectedBatchData.coordinators && selectedBatchData.coordinators.length > 0 && selectedBatchData.coordinators.some(coord => {
                      return coord.rollNo && student.rollNo && String(coord.rollNo) === String(student.rollNo);
                    }) ? (
                      <div className="w-full px-2 py-1.5 text-xs rounded bg-green-100 text-green-800 text-center">Coordinator</div>
                    ) : (
                      <button
                        onClick={() => handleAssignCoordinator(student._id, selectedBatchData._id)}
                        disabled={assigningCoordinatorId === student._id}
                        className={`w-full px-2 py-1.5 text-xs rounded transition-colors ${
                          assigningCoordinatorId === student._id
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {assigningCoordinatorId === student._id ? 'Assigning...' : 'Make Coordinator'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assign view
  if (viewMode === 'assign' && selectedBatchData) {
    return (
      <div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-4 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Batches
        </button>

        <TrainerAssignment
          batchId={selectedBatchData._id}
          compact
          onClose={handleBack}
          onUpdate={handleAssignmentUpdate}
        />
      </div>
    );
  }

  // Grid view (default)
  return (
    <div>
      <h2 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4">Training Batches</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Academic Year</label>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedCollege('all');
              setSelectedTechStack('all');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">College</label>
          <select
            value={selectedCollege}
            onChange={(e) => {
              setSelectedCollege(e.target.value);
              setSelectedTechStack('all');
            }}
            disabled={selectedYear === 'all'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
          >
            <option value="all">All Colleges</option>
            {colleges.map(college => (
              <option key={college} value={college}>{college}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Tech Stack</label>
          <select
            value={selectedTechStack}
            onChange={(e) => setSelectedTechStack(e.target.value)}
            disabled={selectedCollege === 'all'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
          >
            <option value="all">All Tech Stacks</option>
            {techStacks.map(tech => (
              <option key={tech} value={tech}>{tech}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Batches Grid */}
      {loadingPlacementBatches ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="h-1.5 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
              <GraduationCap className="h-14 w-14 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No batches found</p>
            </div>
          ) : (
            filteredBatches.map(batch => {
              const assignmentStatus = getTrainerAssignmentStatus(batch);
              return (
                <div key={batch._id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className={`h-1.5 ${getTechStackBadgeColor(batch.techStack)}`}></div>
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900">{batch.batchNumber}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{batch.college}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTechStackColor(batch.techStack)} border`}>
                        {batch.techStack}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3 text-gray-700 text-[11px] sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span><strong>{batch.studentCount}</strong> Students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span>Year {batch.year}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${assignmentStatus.color} border`}>
                          {assignmentStatus.icon} {assignmentStatus.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewBatch(batch)}
                        className="flex-1 text-white bg-blue-600 hover:bg-blue-700 font-medium py-1.5 px-2 sm:py-2 sm:px-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 shadow-sm text-xs sm:text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleAssignBatch(batch._id)}
                        className="flex-1 text-blue-700 bg-blue-100 hover:bg-blue-200 font-medium py-1.5 px-2 sm:py-2 sm:px-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Assign</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default BatchesTab;
