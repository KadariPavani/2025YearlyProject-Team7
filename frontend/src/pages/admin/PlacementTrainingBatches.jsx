import React, { useState, useEffect } from 'react';
import { Users, Calendar, Eye, ChevronDown, ChevronRight } from 'lucide-react';

const PlacementTrainingBatches = () => {
  const [batchData, setBatchData] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedColleges, setExpandedColleges] = useState({});
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    fetchPlacementTrainingBatches();
  }, []);

  const fetchPlacementTrainingBatches = async () => {
    try {
      const response = await fetch('/api/placement-training-batches', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setBatchData(data.data.organized);
        setStats(data.data.stats);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch placement training batches');
    } finally {
      setLoading(false);
    }
  };

  const toggleYear = (year) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const toggleCollege = (year, college) => {
    const key = `${year}-${college}`;
    setExpandedColleges((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getTechStackColor = (techStack) => {
    const colors = {
      Java: 'bg-red-100 text-red-800',
      Python: 'bg-green-100 text-green-800',
      'AI/ML': 'bg-purple-100 text-purple-800',
      NonCRT: 'bg-gray-100 text-gray-800',
    };
    return colors[techStack] || 'bg-blue-100 text-blue-800';
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Placement Training Batches</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Training Batches</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBatches || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CRT Batches</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.crtBatches || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Non-CRT Batches</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.nonCrtBatches || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchical Batch Display */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Batches by Year → College → Tech Stack
          </h3>
        </div>
        <div className="p-6">
          {Object.keys(batchData).sort().reverse().map(year => (
            <div key={year} className="mb-6">
              {/* Year Header */}
              <div
                className="flex items-center cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                onClick={() => toggleYear(year)}
              >
                {expandedYears[year] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <h4 className="ml-2 text-lg font-semibold text-gray-900">Year {year}</h4>
                <span className="ml-4 text-sm text-gray-600">
                  ({Object.values(batchData[year]).reduce((acc, colleges) =>
                    acc + Object.values(colleges).reduce((acc2, techStacks) =>
                      acc2 + techStacks.totalBatches, 0), 0)} batches)
                </span>
              </div>

              {/* Colleges under this year */}
              {expandedYears[year] && (
                <div className="ml-6 mt-3 space-y-3">
                  {Object.keys(batchData[year]).map(college => (
                    <div key={college}>
                      {/* College Header */}
                      <div
                        className="flex items-center cursor-pointer p-2 bg-blue-50 rounded hover:bg-blue-100"
                        onClick={() => toggleCollege(year, college)}
                      >
                        {expandedColleges[`${year}-${college}`] ? 
                          <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <h5 className="ml-2 font-medium text-gray-800">{college}</h5>
                        <span className="ml-3 text-sm text-gray-600">
                          ({Object.values(batchData[year][college]).reduce((acc, tech) => acc + tech.totalBatches, 0)} batches,{' '}
                          {Object.values(batchData[year][college]).reduce((acc, tech) => acc + tech.totalStudents, 0)} students)
                        </span>
                      </div>

                      {/* Tech Stacks under this college */}
                      {expandedColleges[`${year}-${college}`] && (
                        <div className="ml-6 mt-2 space-y-2">
                          {Object.keys(batchData[year][college]).map(techStack => (
                            <div key={techStack} className="border border-gray-200 rounded-lg p-3">
                              {/* Tech Stack Header */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTechStackColor(techStack)}`}>
                                    {techStack}
                                  </span>
                                  <span className="ml-3 text-sm text-gray-600">
                                    {batchData[year][college][techStack].totalBatches} batches,{' '}
                                    {batchData[year][college][techStack].totalStudents} students
                                  </span>
                                </div>
                              </div>

                              {/* Individual Batches */}
                              <div className="space-y-2">
                                {batchData[year][college][techStack].batches.map(batch => (
                                  <div key={batch._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center">
                                      <span className="font-medium text-gray-900">{batch.batchNumber}</span>
                                      <span className="ml-3 text-sm text-gray-600">
                                        {batch.studentCount} students
                                      </span>
                                      <span className="ml-3 text-xs text-gray-500">
                                        Created: {new Date(batch.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => setSelectedBatch(batch)}
                                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedBatch.batchNumber} - Students
              </h3>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-500">Tech Stack</p>
                  <p className="text-gray-900">{selectedBatch.techStack}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Students</p>
                  <p className="text-gray-900">{selectedBatch.studentCount}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">TPO</p>
                  <p className="text-gray-900">{selectedBatch.tpoId?.name || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Start Date</p>
                  <p className="text-gray-900">{new Date(selectedBatch.startDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-80">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tech Stack</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedBatch.students.map((student) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.rollNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.college}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.branch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.techStack?.join(', ') || 'Not specified'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTrainingBatches;
