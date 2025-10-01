import React, { useState, useEffect } from 'react';
import { Users, Calendar, Eye, Building2, Code2, GraduationCap, X, TrendingUp, Clock, MapPin, Award, Filter, Search } from 'lucide-react';

const PlacementTrainingBatches = () => {
  const [batchData, setBatchData] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' or 'statistics'
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
        // Set default year to latest
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

  const getTechStackColor = (techStack) => {
    const colors = {
      Java: 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200',
      Python: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
      'AI/ML': 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200',
      NonCRT: 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 border-slate-200',
    };
    return colors[techStack] || 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200';
  };

  const getTechStackBadgeColor = (techStack) => {
    const colors = {
      Java: 'bg-red-500',
      Python: 'bg-emerald-500',
      'AI/ML': 'bg-purple-500',
      NonCRT: 'bg-slate-500',
    };
    return colors[techStack] || 'bg-blue-500';
  };

  // Get unique values for filters
  const years = Object.keys(batchData).sort().reverse();
  const colleges = selectedYear !== 'all' && batchData[selectedYear] 
    ? Object.keys(batchData[selectedYear]) 
    : [];
  const techStacks = selectedYear !== 'all' && selectedCollege !== 'all' && batchData[selectedYear]?.[selectedCollege]
    ? Object.keys(batchData[selectedYear][selectedCollege])
    : [];

  // Get filtered batches
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

    // Apply search filter
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading batches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-purple-700">
                Placement Training Batches
              </h1>
              <p className="text-gray-600 mt-2">Manage and monitor all training programs</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live Data</span>
            </div>
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="px-8 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Academic Year</p>
                  <p className="text-lg font-bold text-green-900">{selectedYear !== 'all' ? selectedYear : 'All Years'}</p>
                  <p className="text-xs text-green-700 mt-1">Active Programs</p>
                </div>
              </div>
            </div>

            <div className="bg-pink-50 rounded-2xl p-5 border border-pink-200">
              <div className="flex items-start gap-3">
                <div className="bg-pink-500 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-1">Total Batches</p>
                  <p className="text-lg font-bold text-pink-900">{stats.totalBatches || 0}</p>
                  <p className="text-xs text-pink-700 mt-1">All Programs</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Students</p>
                  <p className="text-lg font-bold text-blue-900">{stats.totalStudents || 0}</p>
                  <p className="text-xs text-blue-700 mt-1">Enrolled</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">CRT Programs</p>
                  <p className="text-lg font-bold text-amber-900">{stats.crtBatches || 0} Batches</p>
                  <p className="text-xs text-amber-700 mt-1">+ {stats.nonCrtBatches || 0} Non-CRT</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-8">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'batches'
                  ? 'border-purple-700 text-purple-700 bg-purple-100'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              All Batches
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'statistics'
                  ? 'border-purple-700 text-purple-700 bg-purple-100'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8">
        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-purple-700" />
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedCollege('all');
                      setSelectedTechStack('all');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700"
                  >
                    <option value="all">All Years</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                  <select
                    value={selectedCollege}
                    onChange={(e) => {
                      setSelectedCollege(e.target.value);
                      setSelectedTechStack('all');
                    }}
                    disabled={selectedYear === 'all'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 disabled:bg-gray-100"
                  >
                    <option value="all">All Colleges</option>
                    {colleges.map(college => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack</label>
                  <select
                    value={selectedTechStack}
                    onChange={(e) => setSelectedTechStack(e.target.value)}
                    disabled={selectedCollege === 'all'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 disabled:bg-gray-100"
                  >
                    <option value="all">All Tech Stacks</option>
                    {techStacks.map(tech => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search batches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Batches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBatches.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No batches found</p>
                </div>
              ) : (
                filteredBatches.map(batch => (
                  <div key={batch._id} className="bg-white rounded-2xl shadow border border-gray-200 hover:shadow-lg transition-transform duration-300 hover:-translate-y-1 overflow-hidden">
                    <div className={`h-2 ${getTechStackBadgeColor(batch.techStack).replace('bg-', 'bg-opacity-80 ')}`}></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{batch.batchNumber}</h3>
                          <p className="text-sm text-gray-600 mt-1">{batch.college}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTechStackColor(batch.techStack)} border`}>
                          {batch.techStack}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4 text-gray-700 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span><strong>{batch.studentCount}</strong> Students</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>Year {batch.year}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="w-full text-white bg-purple-700 hover:bg-purple-800 font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Statistics</h2>
              {Object.keys(batchData).sort().reverse().map(year => (
                <div key={year} className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Academic Year {year}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.keys(batchData[year]).map(college => {
                      const totalBatches = Object.values(batchData[year][college]).reduce((acc, tech) => acc + tech.totalBatches, 0);
                      const totalStudents = Object.values(batchData[year][college]).reduce((acc, tech) => acc + tech.totalStudents, 0);

                      return (
                        <div key={college} className="bg-gray-50 p-4 rounded border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">{college}</h4>
                          <p className="text-sm text-gray-600 mb-3">{totalBatches} batches • {totalStudents} students</p>
                          {Object.keys(batchData[year][college]).map(techStack => (
                            <div key={techStack} className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{techStack}</span>
                              <span className="text-gray-700">{batchData[year][college][techStack].totalBatches} batches</span>
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

    {/* Batch Detail Modal */}
    {selectedBatch && (
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl">
          <div className="bg-purple-700 px-6 py-5 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="h-7 w-7" />
                {selectedBatch.batchNumber}
              </h3>
              <p className="text-purple-200 text-sm mt-1">{selectedBatch.college} • Year {selectedBatch.year}</p>
            </div>
            <button
              onClick={() => setSelectedBatch(null)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <p className="text-xs font-medium text-purple-600 mb-1">Tech Stack</p>
                <p className="text-lg font-bold text-purple-900">{selectedBatch.techStack}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="text-xs font-medium text-blue-600 mb-1">Total Students</p>
                <p className="text-lg font-bold text-blue-900">{selectedBatch.studentCount}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-xs font-medium text-green-600 mb-1">TPO</p>
                <p className="text-lg font-bold text-green-900">{selectedBatch.tpoId?.name || 'Not assigned'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="text-xs font-medium text-amber-600 mb-1">Start Date</p>
                <p className="text-lg font-bold text-amber-900">{new Date(selectedBatch.startDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Roll No</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">College</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tech Stack</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {selectedBatch.students.map((student, idx) => (
                      <tr key={student._id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{student.rollNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.college}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.branch}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
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
        </div>
      </div>
    )}
  </div>
);



};

export default PlacementTrainingBatches;