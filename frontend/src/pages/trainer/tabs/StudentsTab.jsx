import React, { useState, useMemo } from 'react';
import { Users, Search } from 'lucide-react';
import TrainerStudentActivity from '../TrainerStudentActivity';

const StudentsTab = ({ placementBatches }) => {
  const [subTab, setSubTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten all students with their batch info for searching
  const allStudents = useMemo(() => {
    const students = [];
    placementBatches.forEach(batch => {
      if (batch.students) {
        batch.students.forEach(student => {
          students.push({ ...student, batchNumber: batch.batchNumber, techStack: batch.techStack });
        });
      }
    });
    return students;
  }, [placementBatches]);

  // Filter batches based on search
  const filteredBatches = useMemo(() => {
    if (!searchTerm) return placementBatches;
    const term = searchTerm.toLowerCase();
    return placementBatches.map(batch => ({
      ...batch,
      students: batch.students?.filter(s =>
        s.name?.toLowerCase().includes(term) ||
        s.rollNo?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.college?.toLowerCase().includes(term)
      ) || []
    })).filter(batch => batch.students.length > 0);
  }, [placementBatches, searchTerm]);

  const totalFiltered = filteredBatches.reduce((acc, b) => acc + (b.students?.length || 0), 0);

  return (
    <div className="space-y-4">
      {/* Sub-tab toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSubTab('list')}
          className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
            subTab === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Student List
        </button>
        <button
          onClick={() => setSubTab('activity')}
          className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
            subTab === 'activity'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Student Activity
        </button>
      </div>

      {subTab === 'activity' ? (
        <TrainerStudentActivity />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900">All My Students</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {searchTerm ? `${totalFiltered} of ${allStudents.length}` : `${allStudents.length}`} students across {placementBatches.length} batches
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, roll, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {filteredBatches.length > 0 ? (
            <div className="space-y-4">
              {filteredBatches.map((batch) => (
                <div key={batch._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 border-b border-gray-200">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                      {batch.batchNumber} ({batch.students?.length || 0} students)
                    </h4>
                    <p className="text-[10px] sm:text-xs text-gray-500">{batch.techStack} • {batch.colleges?.join(', ')}</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Name</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Roll No</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">College</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Branch</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Email</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {batch.students && batch.students.map((student, idx) => (
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
                              <a href={`mailto:${student.email}`} className="text-xs text-blue-600 hover:underline">{student.email}</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-xs sm:text-sm font-medium">
                {searchTerm ? 'No students match your search' : 'No students assigned yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm ? 'Try a different search term' : 'Students will appear here once you\'re assigned to training batches'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentsTab;
