import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  AlertCircle,
  Users,
  Briefcase,
  Building2,
  TrendingUp
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const PlacedStudentsTab = () => {
  const [placedStudents, setPlacedStudents] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingCompany, setDownloadingCompany] = useState('');

  useEffect(() => {
    fetchPlacedStudents();
  }, []);

  const fetchPlacedStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/placed-students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setPlacedStudents(response.data.data.groupedByCompany);
      } else {
        setError(response.data.message || 'Failed to fetch placed students');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch placed students');
    } finally {
      setLoading(false);
    }
  };

  const toggleCompanyExpand = (companyName) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
  };

  const downloadExcel = async (companyName = null) => {
    try {
      setDownloadingExcel(true);
      if (companyName) setDownloadingCompany(companyName);

      const token = localStorage.getItem('userToken');
      const url = companyName
        ? `/api/tpo/placed-students/download-company/${encodeURIComponent(companyName)}`
        : '/api/tpo/placed-students/download-excel';

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      const filename = companyName
        ? `${companyName}_Placed_Students_${new Date().toISOString().split('T')[0]}.xlsx`
        : `All_Placed_Students_${new Date().toISOString().split('T')[0]}.xlsx`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(response.data);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download Excel file');
    } finally {
      setDownloadingExcel(false);
      setDownloadingCompany('');
    }
  };

  // Collect all students for stats
  const allStudents = useMemo(() => {
    const list = [];
    Object.entries(placedStudents).forEach(([, company]) => {
      (company.students || []).forEach(student => list.push(student));
    });
    return list;
  }, [placedStudents]);

  const companies = Object.keys(placedStudents);

  const allBatches = useMemo(() => {
    const set = new Set();
    allStudents.forEach(s => { if (s.batch) set.add(s.batch); });
    return Array.from(set).sort();
  }, [allStudents]);

  const allBranches = useMemo(() => {
    const set = new Set();
    allStudents.forEach(s => { if (s.branch) set.add(s.branch); });
    return Array.from(set).sort();
  }, [allStudents]);

  // Filter students within a company
  const getFilteredStudents = (students) => {
    return students.filter(student => {
      const matchesSearch = !searchTerm ||
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBatch = filterBatch === 'all' || student.batch === filterBatch;
      const matchesBranch = filterBranch === 'all' || student.branch === filterBranch;
      return matchesSearch && matchesBatch && matchesBranch;
    });
  };

  const avgPerCompany = companies.length > 0 ? Math.round(allStudents.length / companies.length) : 0;

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Placed Students</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Placed students across all companies</p>
        </div>
        <button
          onClick={() => downloadExcel()}
          disabled={downloadingExcel || companies.length === 0}
          className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium flex items-center gap-2 ${downloadingExcel && !downloadingCompany ? 'bg-gray-300 text-gray-600' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{downloadingExcel && !downloadingCompany ? 'Downloading...' : 'Export All'}</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center"><Building2 className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Companies</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{companies.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center"><Users className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Placed</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{allStudents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-amber-50 items-center justify-center"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Avg / Company</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{avgPerCompany}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-purple-50 items-center justify-center"><Briefcase className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Branches</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{allBranches.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="relative col-span-3 sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, roll, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            />
          </div>
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white"
          >
            <option value="all">All Batches</option>
            {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white"
          >
            <option value="all">All Branches</option>
            {allBranches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Company-wise Accordion */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-xs sm:text-sm font-medium">No placed students found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden divide-y divide-gray-200">
          {companies.map(companyName => {
            const company = placedStudents[companyName];
            const filteredStudents = getFilteredStudents(company.students);
            const isExpanded = expandedCompanies[companyName];

            return (
              <div key={companyName}>
                {/* Company Row */}
                <div
                  onClick={() => toggleCompanyExpand(companyName)}
                  className="px-3 py-2.5 sm:px-4 sm:py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{companyName}</h3>
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-medium whitespace-nowrap">
                          {company.totalSelected} placed
                        </span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          <span className="truncate">{company.jobRole}</span>
                        </span>
                        <span>{new Date(company.eventDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadExcel(companyName);
                      }}
                      disabled={downloadingExcel && downloadingCompany === companyName}
                      className="px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white flex items-center gap-1.5"
                      aria-label={`Download placed students for ${companyName}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{downloadingExcel && downloadingCompany === companyName ? 'Downloading...' : 'Export'}</span>
                    </button>
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Students Table (expanded) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-xs sm:text-sm">No students match the selected filters</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-blue-50">
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll No</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Branch</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batch</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Batch No</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">College</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Email</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredStudents.map((student, idx) => (
                              <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{student.name || 'NA'}</td>
                                <td className="px-3 py-2 text-xs sm:text-sm font-mono text-gray-700 whitespace-nowrap">{student.rollNumber || 'NA'}</td>
                                <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.branch || 'NA'}</td>
                                <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.batch || 'NA'}</td>
                                <td className="px-3 py-2 text-xs sm:text-sm text-blue-600 font-medium whitespace-nowrap">{student.batchNumber || 'NA'}</td>
                                <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{student.colleges || 'NA'}</td>
                                <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                  {student.email ? (
                                    <a href={`mailto:${student.email}`} className="text-blue-600 hover:underline">{student.email}</a>
                                  ) : 'NA'}
                                </td>
                                <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                  {student.phone ? (
                                    <a href={`tel:${student.phone}`} className="hover:underline">{student.phone}</a>
                                  ) : 'NA'}
                                </td>
                                <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                                  {student.selectionDate ? new Date(student.selectionDate).toLocaleDateString() : 'NA'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlacedStudentsTab;
