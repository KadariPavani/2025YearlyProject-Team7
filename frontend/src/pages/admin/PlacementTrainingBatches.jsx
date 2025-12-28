import React, { useState, useEffect } from 'react';
import { Users, Calendar, Eye, Building2, GraduationCap, X, Clock, MapPin, Award, Filter, Search, ChevronDown } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

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
  // Mobile UI state: collapse filters on small screens by default
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Inline expanded batch id (per-card expansion)
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchPlacementTrainingBatches();
  }, []);

  const fetchPlacementTrainingBatches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-training-batches`, {
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

  const getTechStackColor = (techStack) => 'bg-blue-50 text-blue-800 border-blue-200';

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
    return <LoadingSkeleton />;
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
    <div className="min-h-screen bg-gray-50">
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-8"> */}
        {/* Header + Stats (unified card) */}
        {/* <div className="bg-white rounded-2xl shadow border border-gray-300 p-4 sm:p-6"> */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-black">Placement Training Batches</h2>
                <p className="text-xs sm:text-sm text-gray-700 mt-1">Manage and monitor all training programs</p>
              </div>
            </div>

            {/* Desktop metrics: 3 cards */}
            <div className="hidden sm:grid grid-cols-3 gap-4 mb-4 w-full">
              <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-3 cursor-pointer hover:scale-105 transition" onClick={() => setActiveTab('batches')}>
                <div className="bg-blue-50 p-2 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-gray-900 text-lg font-bold">{stats.totalBatches || 0}</div>
                  <div className="text-gray-600 text-sm">Total Batches</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-3 cursor-pointer hover:scale-105 transition" onClick={() => setActiveTab('batches')}>
                <div className="bg-blue-50 p-2 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-gray-900 text-lg font-bold">{stats.totalStudents || 0}</div>
                  <div className="text-gray-600 text-sm">Total Students</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-3 cursor-pointer hover:scale-105 transition" onClick={() => setActiveTab('batches')}>
                <div className="bg-blue-50 p-2 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-gray-900 text-lg font-bold">{stats.crtBatches || 0}</div>
                  <div className="text-gray-600 text-sm">CRT Programs</div>
                </div>
              </div>
            </div>

            {/* Mobile metrics: compact, icon above, number+label (inline) */}
            <div className="sm:hidden grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => setActiveTab('batches')} className="flex flex-col items-center gap-1 bg-white rounded-lg py-2 px-2 shadow-sm min-w-0">
                <div className="bg-blue-50 p-1 rounded-full">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-center min-w-0">
                  <div className="text-gray-900 font-semibold text-sm truncate">{stats.totalBatches || 0} <span className="text-[11px] text-gray-500">Batches</span></div>
                </div>
              </button>

              <button onClick={() => setActiveTab('batches')} className="flex flex-col items-center gap-1 bg-white rounded-lg py-2 px-2 shadow-sm min-w-0">
                <div className="bg-blue-50 p-1 rounded-full">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-center min-w-0">
                  <div className="text-gray-900 font-semibold text-sm truncate">{stats.totalStudents || 0} <span className="text-[11px] text-gray-500">Students</span></div>
                </div>
              </button>

              <button onClick={() => setActiveTab('batches')} className="flex flex-col items-center gap-1 bg-white rounded-lg py-2 px-2 shadow-sm min-w-0">
                <div className="bg-blue-50 p-1 rounded-full">
                  <Award className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-center min-w-0">
                  <div className="text-gray-900 font-semibold text-sm truncate">{stats.crtBatches || 0} <span className="text-[11px] text-gray-500">CRT</span></div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-xs sm:text-sm">
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase">Academic Year</p>
              <div className="font-semibold text-black">{selectedYear !== 'all' ? selectedYear : 'All Years'}</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase">Active Programs</p>
              <div className="font-semibold text-black">{stats.totalBatches || 0}</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase">Enrolled</p>
              <div className="font-semibold text-black">{stats.totalStudents || 0}</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase">Non-CRT</p>
              <div className="font-semibold text-black">{stats.nonCrtBatches || 0}</div>
            </div>
          </div>
        

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-300 mt-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 focus:outline-none ${
              activeTab === 'batches'
                ? 'border-blue-700 text-blue-700 bg-blue-100'
                : 'border-transparent text-black hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            All Batches
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 focus:outline-none ${
              activeTab === 'statistics'
                ? 'border-blue-700 text-blue-700 bg-blue-100'
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
              {/* Mobile: show toggle to collapse/expand filters */}
              <div className="sm:hidden flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold">Filters</span>
                </div>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="text-sm text-blue-700 flex items-center gap-1"
                  aria-expanded={filtersOpen}
                >
                  {filtersOpen ? 'Hide' : 'Show'} <ChevronDown className={`h-4 w-4 transform ${filtersOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
              </div>

              <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block bg-white rounded-2xl shadow border border-gray-300 p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-5 w-5 text-blue-400" />
                  <h3 className="text-base font-semibold text-black">Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Academic Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setSelectedCollege('all');
                        setSelectedTechStack('all');
                      }}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    >
                      <option value="all">All Years</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-black mb-1">College</label>
                    <select
                      value={selectedCollege}
                      onChange={(e) => {
                        setSelectedCollege(e.target.value);
                        setSelectedTechStack('all');
                      }}
                      disabled={selectedYear === 'all'}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 text-sm"
                    >
                      <option value="all">All Colleges</option>
                      {colleges.map(college => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Tech Stack</label>
                    <select
                      value={selectedTechStack}
                      onChange={(e) => setSelectedTechStack(e.target.value)}
                      disabled={selectedCollege === 'all'}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 text-sm"
                    >
                      <option value="all">All Tech Stacks</option>
                      {techStacks.map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <input
                        type="text"
                        placeholder="Search batches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
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
                    <div key={batch._id}>
                      {/* Desktop card (sm+) */}
                      <div className="hidden sm:block bg-white rounded-2xl shadow border border-gray-300 hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5 overflow-hidden">
                        <div className="p-4 sm:p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-base font-semibold text-black">{batch.batchNumber}</h3>
                              <p className="text-xs text-gray-700 mt-1">{batch.college}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTechStackColor(batch.techStack)} border`}>
                              {batch.techStack}
                            </span>
                          </div>
                          <div className="space-y-2 mb-3 text-gray-800 text-xs">
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
                            onClick={() => {
                              if (window.innerWidth >= 640) { setSelectedBatch(batch); setExpandedId(null); }
                              else { setExpandedId(prev => prev === batch._id ? null : batch._id); }
                            }}
                            className="w-full text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Eye className="h-4 w-4" /> View
                          </button>
                        </div>

                        {/* Mobile-only inline expansion (kept within card) */}
                        {expandedId === batch._id && (
                          <div className="sm:hidden p-4 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                                <div className="font-semibold text-black">{batch.techStack}</div>
                                <div className="text-[11px] text-blue-700">Tech Stack</div>
                              </div>
                              <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                                <div className="font-semibold text-black">{batch.studentCount}</div>
                                <div className="text-[11px] text-blue-700">Students</div>
                              </div>
                            </div>

                            {batch.students.map(student => (
                              <div key={student._id} className="border rounded p-2 mb-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-black">{student.name}</div>
                                    <div className="text-xs text-gray-600">{student.rollNo} • {student.college}</div>
                                  </div>
                                  <div className="text-xs">
                                    <span className="px-2 py-0.5 bg-blue-100 rounded-full text-blue-800">{student.techStack?.join(', ') || 'Not specified'}</span>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-700"><strong>Branch:</strong> {student.branch}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Mobile compact card */}
                      <div className="sm:hidden bg-white rounded-lg border border-gray-200 p-3 shadow-sm mt-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-black truncate">{batch.batchNumber}</h3>
                            <p className="text-xs text-gray-600 mt-1 truncate">{batch.college}</p>
                          </div>
                          <div className="text-right">
                            <div className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getTechStackColor(batch.techStack)} border`}>{batch.techStack}</div>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-gray-700">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span className="font-medium">{batch.studentCount}</span>
                          </div>
                          <button onClick={() => setExpandedId(expandedId === batch._id ? null : batch._id)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md">{expandedId === batch._id ? 'Hide' : 'View'}</button>
                        </div>

                        {expandedId === batch._id && (
                          <div className="mt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                              <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                                <div className="font-semibold text-black">{batch.techStack}</div>
                                <div className="text-[11px] text-blue-700">Tech Stack</div>
                              </div>
                              <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                                <div className="font-semibold text-black">{batch.studentCount}</div>
                                <div className="text-[11px] text-blue-700">Students</div>
                              </div>
                            </div>

                            {batch.students.map(student => (
                              <div key={student._id} className="border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-black">{student.name}</div>
                                    <div className="text-xs text-gray-600">{student.rollNo} • {student.college}</div>
                                  </div>
                                  <div className="text-xs">
                                    <span className="px-2 py-0.5 bg-blue-100 rounded-full text-blue-800">{student.techStack?.join(', ') || 'Not specified'}</span>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-700"><strong>Branch:</strong> {student.branch}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selected Batch Details (desktop + mobile modal) */}
              {selectedBatch && (
                <>
                  {/* Desktop panel */}
                  <div className="hidden sm:block mt-10">
                    <div className="bg-white rounded-2xl shadow border border-gray-300 p-6 relative">
                      <button
                        onClick={() => setSelectedBatch(null)}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close details"
                      >
                        <X className="h-5 w-5 text-gray-700" />
                      </button>

                      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-full">
                            <GraduationCap className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-black">{selectedBatch.batchNumber}</h3>
                            <p className="text-sm text-gray-700 mt-1">{selectedBatch.college} • Year {selectedBatch.year}</p>
                          </div>
                        </div>
                      </div>

                      {/* Batch Info Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                          <span className="block text-xs text-blue-700 font-medium mb-1">Tech Stack</span>
                          <span className="block text-sm font-semibold text-black">{selectedBatch.techStack}</span>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                          <span className="block text-xs text-blue-700 font-medium mb-1">Total Students</span>
                          <span className="block text-sm font-semibold text-black">{selectedBatch.studentCount}</span>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                          <span className="block text-xs text-blue-700 font-medium mb-1">TPO</span>
                          <span className="block text-sm font-semibold text-black">{selectedBatch.tpoId?.name || 'Not assigned'}</span>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                          <span className="block text-xs text-blue-700 font-medium mb-1">Start Date</span>
                          <span className="block text-sm font-semibold text-black">{new Date(selectedBatch.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Students Table */}
                      <div className="border border-gray-200 rounded-xl overflow-x-auto">
                        <table className="hidden sm:table min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Roll No</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">College</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Branch</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">Tech Stack</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {selectedBatch.students.map((student, idx) => (
                              <tr key={student._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}`}>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                      {student.name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-black">{student.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-black font-mono">{student.rollNo}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-black">{student.college}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-black">{student.branch}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    {student.techStack?.join(', ') || 'Not specified'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Desktop also shows nothing extra; mobile content handled below */}
                      </div>
                    </div>
                  </div>

                  {/* Mobile full-screen modal */}
                  <div className="sm:hidden fixed inset-0 z-50 bg-black bg-opacity-40 p-4 overflow-auto">
                    <div className="bg-white rounded-lg w-full p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-black">{selectedBatch.batchNumber}</h3>
                          <p className="text-xs text-gray-600">{selectedBatch.college} • Year {selectedBatch.year}</p>
                        </div>
                        <button onClick={() => setSelectedBatch(null)} className="p-2 rounded bg-gray-100">
                          <X className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                          <div className="font-semibold text-black">{selectedBatch.techStack}</div>
                          <div className="text-[11px] text-blue-700">Tech Stack</div>
                        </div>
                        <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                          <div className="font-semibold text-black">{selectedBatch.studentCount}</div>
                          <div className="text-[11px] text-blue-700">Total Students</div>
                        </div>
                        <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                          <div className="font-semibold text-black">{selectedBatch.tpoId?.name || 'Not assigned'}</div>
                          <div className="text-[11px] text-blue-700">TPO</div>
                        </div>
                        <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                          <div className="font-semibold text-black">{new Date(selectedBatch.startDate).toLocaleDateString()}</div>
                          <div className="text-[11px] text-blue-700">Start Date</div>
                        </div>
                      </div>

                      {/* Mobile stacked student cards */}
                      <div className="space-y-3">
                        {selectedBatch.students.map(student => (
                          <div key={student._id} className="border rounded p-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-black">{student.name}</div>
                                <div className="text-xs text-gray-600">{student.rollNo} • {student.college}</div>
                              </div>
                              <div className="text-xs">
                                <span className="px-2 py-0.5 bg-blue-100 rounded-full text-blue-800">{student.techStack?.join(', ') || 'Not specified'}</span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-700"><strong>Branch:</strong> {student.branch}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
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
                        <div key={`${year}-${college}`} className="bg-blue-50 p-3 sm:p-4 rounded border border-blue-200">
                            <h4 className="font-semibold text-sm sm:text-base text-black mb-2">{college}</h4>
                            <p className="text-xs sm:text-sm text-blue-700 mb-3">{totalBatches} batches • {totalStudents} students</p>
                            {Object.keys(batchData[year][college]).map(techStack => (
                              <div key={techStack} className="flex justify-between text-xs sm:text-sm mb-1">
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
  );
};

export default PlacementTrainingBatches;
