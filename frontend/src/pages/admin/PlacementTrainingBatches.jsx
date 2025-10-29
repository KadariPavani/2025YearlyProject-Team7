import React, { useState, useEffect } from 'react';
import { Users, Calendar, Eye, Building2, GraduationCap, X, Clock, MapPin, Award, Filter, Search } from 'lucide-react';

const PlacementTrainingBatches = () => {
  const [batchData, setBatchData] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeTab, setActiveTab] = useState('batches');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedTechStack, setSelectedTechStack] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        const years = Object.keys(data.data.organized).sort().reverse();
        if (years.length > 0) setSelectedYear(years[0]);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch placement training batches');
    } finally {
      setLoading(false);
    }
  };

  const getTechStackColor = (techStack) => 'bg-blue-100 text-blue-800 border-blue-200';

  const years = Object.keys(batchData).sort().reverse();
  const colleges = selectedYear !== 'all' && batchData[selectedYear]
    ? Object.keys(batchData[selectedYear])
    : [];
  const techStacks = selectedYear !== 'all' && selectedCollege !== 'all' && batchData[selectedYear]?.[selectedCollege]
    ? Object.keys(batchData[selectedYear][selectedCollege])
    : [];

  const getFilteredBatches = () => {
    const allBatches = [];
    Object.keys(batchData).forEach(year => {
      if (selectedYear !== 'all' && year !== selectedYear) return;
      Object.keys(batchData[year]).forEach(college => {
        if (selectedCollege !== 'all' && college !== selectedCollege) return;
        Object.keys(batchData[year][college]).forEach(techStack => {
          if (selectedTechStack !== 'all' && techStack !== selectedTechStack) return;
          batchData[year][college][techStack].batches.forEach(batch => {
            allBatches.push({
              ...batch,
              year,
              college,
              techStack
            });
          });
        });
      });
    });
    if (searchTerm) {
      return allBatches.filter(batch =>
        batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.techStack.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return allBatches;
  };

  const filteredBatches = getFilteredBatches();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-base text-black font-medium">Loading batches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg shadow-lg max-w-md">
          <p className="text-base text-blue-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black text-base">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header Section */}
        <div className="border-b border-gray-200 shadow-sm py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-black">Placement Training Batches</h2>
              <p className="text-sm text-gray-700 mt-1">Manage and monitor all training programs</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full border border-blue-200">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-700">Live Data</span>
            </div>
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6 text-sm">
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-black uppercase tracking-wide mb-0.5">Academic Year</p>
              <p className="text-base font-semibold text-black">{selectedYear !== 'all' ? selectedYear : 'All Years'}</p>
              <p className="text-xs text-blue-700 mt-1">Active Programs</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-black uppercase tracking-wide mb-0.5">Total Batches</p>
              <p className="text-base font-semibold text-black">{stats.totalBatches || 0}</p>
              <p className="text-xs text-blue-700 mt-1">All Programs</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-black uppercase tracking-wide mb-0.5">Total Students</p>
              <p className="text-base font-semibold text-black">{stats.totalStudents || 0}</p>
              <p className="text-xs text-blue-700 mt-1">Enrolled</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center">
              <Award className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-black uppercase tracking-wide mb-0.5">CRT Programs</p>
              <p className="text-base font-semibold text-black">{stats.crtBatches || 0} Batches</p>
              <p className="text-xs text-blue-700 mt-1">+ {stats.nonCrtBatches || 0} Non-CRT</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-300 mt-8">
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 focus:outline-none ${
              activeTab === 'batches'
                ? 'border-blue-800 text-blue-800 bg-blue-100'
                : 'border-transparent text-black hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            All Batches
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 focus:outline-none ${
              activeTab === 'statistics'
                ? 'border-blue-800 text-blue-800 bg-blue-100'
                : 'border-transparent text-black hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Content */}
        <div className="py-8 text-sm">
          {activeTab === 'batches' && (
            <div className="space-y-6">
              {/* Filters Section */}
              <div className="bg-white rounded-2xl shadow border border-gray-300 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-black">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Academic Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setSelectedCollege('all');
                        setSelectedTechStack('all');
                      }}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="all">All Years</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">College</label>
                    <select
                      value={selectedCollege}
                      onChange={(e) => {
                        setSelectedCollege(e.target.value);
                        setSelectedTechStack('all');
                      }}
                      disabled={selectedYear === 'all'}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                    >
                      <option value="all">All Colleges</option>
                      {colleges.map(college => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Tech Stack</label>
                    <select
                      value={selectedTechStack}
                      onChange={(e) => setSelectedTechStack(e.target.value)}
                      disabled={selectedCollege === 'all'}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                    >
                      <option value="all">All Tech Stacks</option>
                      {techStacks.map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <input
                        type="text"
                        placeholder="Search batches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid and Batch Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBatches.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-300">
                    <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium text-base">No batches found</p>
                  </div>
                ) : (
                  filteredBatches.map(batch => (
                    <div key={batch._id} className="bg-white rounded-2xl shadow border border-gray-300 hover:shadow-lg transition-transform duration-300 hover:-translate-y-1 overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-black">{batch.batchNumber}</h3>
                            <p className="text-sm text-gray-700 mt-1">{batch.college}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTechStackColor(batch.techStack)} border`}>
                            {batch.techStack}
                          </span>
                        </div>
                        <div className="space-y-3 mb-4 text-gray-800 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span><strong>{batch.studentCount}</strong> Students</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-400" />
                            <span>{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-400" />
                            <span>Year {batch.year}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedBatch(batch)}
                          className="w-full text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
                        >
                          <Eye className="h-4 w-4" /> View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selected Batch Details */}
              {selectedBatch && (
                <div className="mt-10">
                  <div className="bg-white rounded-2xl shadow border border-gray-300 p-8 relative">
                    <button
                      onClick={() => setSelectedBatch(null)}
                      className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Close details"
                    >
                      <X className="h-6 w-6 text-gray-700" />
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center mb-8 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <GraduationCap className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-black">{selectedBatch.batchNumber}</h3>
                          <p className="text-sm text-gray-700 mt-1">{selectedBatch.college} • Year {selectedBatch.year}</p>
                        </div>
                      </div>
                    </div>

                    {/* Batch Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <span className="block text-xs text-blue-700 font-medium mb-1">Tech Stack</span>
                        <span className="block text-base font-semibold text-black">{selectedBatch.techStack}</span>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <span className="block text-xs text-blue-700 font-medium mb-1">Total Students</span>
                        <span className="block text-base font-semibold text-black">{selectedBatch.studentCount}</span>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <span className="block text-xs text-blue-700 font-medium mb-1">TPO</span>
                        <span className="block text-base font-semibold text-black">{selectedBatch.tpoId?.name || 'Not assigned'}</span>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <span className="block text-xs text-blue-700 font-medium mb-1">Start Date</span>
                        <span className="block text-base font-semibold text-black">{new Date(selectedBatch.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Students Table */}
                    <div className="border border-gray-200 rounded-xl overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Roll No</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">College</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Branch</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Tech Stack</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {selectedBatch.students.map((student, idx) => (
                            <tr key={student._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}`}>
                              <td className="px-6 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {student.name.charAt(0)}
                                  </div>
                                  <span className="font-medium text-black">{student.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-black font-mono">{student.rollNo}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-black">{student.college}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-black">{student.branch}</td>
                              <td className="px-6 py-3 whitespace-nowrap">
                                <span className="px-3 py-1 bg-blue-100 text-black rounded-full text-xs font-medium">
                                  {student.techStack?.join(', ') || 'Not specified'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow border border-gray-300 p-6">
                <h2 className="text-lg font-semibold text-black mb-6">Detailed Statistics</h2>
                {Object.keys(batchData).sort().reverse().map(year => (
                  <div key={year} className="mb-6">
                    <h3 className="font-semibold text-black mb-3 border-b border-gray-300 pb-2">Academic Year {year}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
                      {Object.keys(batchData[year]).map(college => {
                        const totalBatches = Object.values(batchData[year][college]).reduce((acc, tech) => acc + tech.totalBatches, 0);
                        const totalStudents = Object.values(batchData[year][college]).reduce((acc, tech) => acc + tech.totalStudents, 0);
                        return (
                          <div key={college} className="bg-blue-50 p-4 rounded border border-blue-200">
                            <h4 className="font-semibold text-black mb-2">{college}</h4>
                            <p className="text-sm text-blue-700 mb-3">{totalBatches} batches • {totalStudents} students</p>
                            {Object.keys(batchData[year][college]).map(techStack => (
                              <div key={techStack} className="flex justify-between text-sm mb-1">
                                <span className="text-blue-800">{techStack}</span>
                                <span className="text-blue-800">{batchData[year][college][techStack].totalBatches} batches</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlacementTrainingBatches;
