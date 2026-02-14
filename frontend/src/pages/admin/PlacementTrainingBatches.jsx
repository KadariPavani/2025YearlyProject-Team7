import React, { useState, useEffect } from 'react';
import { Users, Eye, EyeOff, GraduationCap, X, Search } from 'lucide-react';
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

  useEffect(() => {
    fetchPlacementTrainingBatches();
  }, []);

  const fetchPlacementTrainingBatches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/placement-training-batches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
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
    } catch {
      setError('Failed to fetch placement training batches');
    } finally {
      setLoading(false);
    }
  };

  const years = Object.keys(batchData).sort().reverse();
  const colleges = selectedYear !== 'all' && batchData[selectedYear] ? Object.keys(batchData[selectedYear]) : [];
  const techStacks = selectedYear !== 'all' && selectedCollege !== 'all' && batchData[selectedYear]?.[selectedCollege] ? Object.keys(batchData[selectedYear][selectedCollege]) : [];

  const getFilteredBatches = () => {
    const allBatches = [];
    Object.keys(batchData).forEach(year => {
      if (selectedYear !== 'all' && year !== selectedYear) return;
      Object.keys(batchData[year]).forEach(college => {
        if (selectedCollege !== 'all' && college !== selectedCollege) return;
        Object.keys(batchData[year][college]).forEach(techStack => {
          if (selectedTechStack !== 'all' && techStack !== selectedTechStack) return;
          batchData[year][college][techStack].batches.forEach(batch => {
            allBatches.push({ ...batch, year, college, techStack });
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

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg max-w-md">
          <p className="text-xs sm:text-sm text-blue-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Placement Training Batches</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {stats.totalBatches || 0} batches &middot; {stats.totalStudents || 0} students
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-4">
        <button onClick={() => setActiveTab('batches')} className={`px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeTab === 'batches' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-blue-50'}`}>
          All Batches
        </button>
        <button onClick={() => setActiveTab('statistics')} className={`px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeTab === 'statistics' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-blue-50'}`}>
          Statistics
        </button>
      </div>

      {activeTab === 'batches' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedCollege('all'); setSelectedTechStack('all'); }} className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  <option value="all">All Years</option>
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">College</label>
                <select value={selectedCollege} onChange={(e) => { setSelectedCollege(e.target.value); setSelectedTechStack('all'); }} disabled={selectedYear === 'all'} className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100">
                  <option value="all">All Colleges</option>
                  {colleges.map(college => <option key={college} value={college}>{college}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tech Stack</label>
                <select value={selectedTechStack} onChange={(e) => setSelectedTechStack(e.target.value)} disabled={selectedCollege === 'all'} className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100">
                  <option value="all">All</option>
                  {techStacks.map(tech => <option key={tech} value={tech}>{tech}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Batches Table */}
          {filteredBatches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-xs sm:text-sm text-gray-600 font-medium">No batches found</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batch</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">College</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Tech Stack</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Students</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBatches.map((batch, idx) => {
                    const isExpanded = selectedBatch?._id === batch._id;
                    return (
                      <React.Fragment key={batch._id}>
                        <tr className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                          <td className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">{batch.batchNumber}</td>
                          <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{batch.college}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">{batch.techStack}</span>
                          </td>
                          <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{batch.studentCount}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedBatch(isExpanded ? null : batch)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              {isExpanded ? 'Hide' : 'View'}
                            </button>
                          </td>
                        </tr>

                        {/* Inline expanded — desktop only */}
                        {isExpanded && (
                          <tr className="hidden sm:table-row">
                            <td colSpan={5} className="px-4 py-3 bg-blue-50/40 border-l-4 border-blue-500 animate-fadeIn">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-500">
                                  <span className="font-semibold text-gray-700">{batch.studentCount}</span> students &middot; {batch.techStack} &middot; TPO: {batch.tpoId?.name || 'N/A'}
                                </p>
                              </div>
                              {batch.students && batch.students.length > 0 ? (
                                <div className="max-h-72 overflow-y-auto overflow-x-auto rounded border border-gray-200 bg-white">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="sticky top-0 z-10">
                                      <tr className="bg-blue-50">
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll No</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Branch</th>
                                        {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Tech Stack</th> */}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {batch.students.map((student, sIdx) => (
                                        <tr key={student._id} className={`${sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                          <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{student.name}</td>
                                          <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.rollNo}</td>
                                          <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.branch}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-xs sm:text-sm text-gray-500 text-center py-3">No students enrolled</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile-only bottom sheet */}
          {selectedBatch && (
            <div
              className="sm:hidden fixed inset-0 bg-black/40 z-50 flex items-end justify-center animate-fadeOverlay"
              onClick={() => setSelectedBatch(null)}
            >
              <div
                className="w-full bg-white rounded-t-2xl flex flex-col h-[70vh] animate-slideUp"
                onClick={e => e.stopPropagation()}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-9 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{selectedBatch.batchNumber}</h3>
                    <p className="text-xs text-gray-500 truncate">
                      {selectedBatch.college} &middot; {selectedBatch.techStack} &middot; {selectedBatch.studentCount} students
                    </p>
                  </div>
                  <button onClick={() => setSelectedBatch(null)} className="flex-shrink-0 p-1.5 text-gray-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Scrollable students */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {selectedBatch.students && selectedBatch.students.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-blue-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll No</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Branch</th>
                            {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Tech Stack</th> */}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedBatch.students.map((student, sIdx) => (
                            <tr key={student._id} className={`${sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                              <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{student.name}</td>
                              <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{student.rollNo}</td>
                              <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{student.branch}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-8">No students enrolled</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {Object.keys(batchData).sort().reverse().map(year => (
            <div key={year}>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">Academic Year {year}</h3>
              {Object.keys(batchData[year]).map(college => {
                const totalBatches = Object.values(batchData[year][college]).reduce((acc, tech) => acc + tech.totalBatches, 0);
                const totalStudents = Object.values(batchData[year][college]).reduce((acc, tech) => acc + tech.totalStudents, 0);
                return (
                  <div key={`${year}-${college}`} className="mb-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">{college} &middot; {totalBatches} batches &middot; {totalStudents} students</h4>
                    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Tech Stack</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batches</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Students</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {Object.keys(batchData[year][college]).map((techStack, idx) => (
                            <tr key={techStack} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{techStack}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">{batchData[year][college][techStack].totalBatches}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{batchData[year][college][techStack].totalStudents}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacementTrainingBatches;
