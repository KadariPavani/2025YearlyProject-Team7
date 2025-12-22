import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Download,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Loader,
  AlertCircle,
  Users,
  Calendar,
  Briefcase,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';

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
      const response = await axios.get('/api/tpo/placed-students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setPlacedStudents(response.data.data.groupedByCompany);
      } else {
        setError(response.data.message || 'Failed to fetch placed students');
      }
    } catch (err) {
      console.error('Error fetching placed students:', err);
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

// In PlacedStudentsTab.jsx - Update the downloadExcel function

const downloadExcel = async (companyName = null) => {
  try {
    setDownloadingExcel(true);
    if (companyName) {
      setDownloadingCompany(companyName);
    }

    const token = localStorage.getItem('userToken');
    
    // FIXED: Use separate routes for company-specific and all downloads
    const url = companyName 
      ? `/api/tpo/placed-students/download-company/${encodeURIComponent(companyName)}`  // ✅ Fixed
      : '/api/tpo/placed-students/download-excel';

    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${token}` },
      responseType: 'blob'
    });

    const filename = companyName 
      ? `${companyName}_Placed_Students_${new Date().toISOString().split('T')[0]}.xlsx`
      : `All_Companies_Placed_Students_${new Date().toISOString().split('T')[0]}.xlsx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(response.data);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error downloading Excel:', err);
    setError('Failed to download Excel file');
  } finally {
    setDownloadingExcel(false);
    setDownloadingCompany('');
  }
};


  const getFilteredStudents = (students) => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' ||
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBatch = filterBatch === 'all' || student.batch === filterBatch;
      const matchesBranch = filterBranch === 'all' || student.branch === filterBranch;

      return matchesSearch && matchesBatch && matchesBranch;
    });
  };

  const getAllBatches = () => {
    const batches = new Set(['all']);
    Object.values(placedStudents).forEach(company => {
      company.students.forEach(student => {
        if (student.batch) batches.add(student.batch);
      });
    });
    return Array.from(batches).sort();
  };

  const getAllBranches = () => {
    const branches = new Set(['all']);
    Object.values(placedStudents).forEach(company => {
      company.students.forEach(student => {
        if (student.branch) branches.add(student.branch);
      });
    });
    return Array.from(branches).sort();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader className="animate-spin mr-2" size={24} />
        <span>Loading placed students...</span>
      </div>
    );
  }

  const companies = Object.keys(placedStudents);

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users size={28} className="text-teal-600" />
            <h2 className="text-3xl font-bold text-slate-900">Placed Students</h2>
          </div>
          <button
            onClick={() => downloadExcel()}
            disabled={downloadingExcel || companies.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition duration-200"
          >
            <Download size={18} />
            {downloadingExcel ? 'Downloading...' : 'Download All'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm font-medium">Total Companies</p>
            <p className="text-3xl font-bold text-teal-600">{companies.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm font-medium">Total Placed Students</p>
            <p className="text-3xl font-bold text-blue-600">
              {Object.values(placedStudents).reduce((sum, c) => sum + c.students.length, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm font-medium">Avg. Per Company</p>
            <p className="text-3xl font-bold text-purple-600">
              {companies.length > 0 
                ? Math.round(Object.values(placedStudents).reduce((sum, c) => sum + c.students.length, 0) / companies.length)
                : 0
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search size={16} className="inline mr-2" />
              Search Students
            </label>
            <input
              type="text"
              placeholder="Name, Roll No, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <GraduationCap size={16} className="inline mr-2" />
              Batch
            </label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {getAllBatches().map(batch => (
                <option key={batch} value={batch}>
                  {batch === 'all' ? 'All Batches' : batch}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase size={16} className="inline mr-2" />
              Branch
            </label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {getAllBranches().map(branch => (
                <option key={branch} value={branch}>
                  {branch === 'all' ? 'All Branches' : branch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Companies List */}
      <div className="space-y-4">
        {companies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Users size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No placed students found</p>
          </div>
        ) : (
          companies.map(companyName => {
            const company = placedStudents[companyName];
            const filteredStudents = getFilteredStudents(company.students);
            const isExpanded = expandedCompanies[companyName];

            return (
              <div key={companyName} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Company Header */}
                <div
                  onClick={() => toggleCompanyExpand(companyName)}
                  className="p-5 bg-gradient-to-r from-teal-50 to-teal-100 cursor-pointer hover:from-teal-100 hover:to-teal-200 transition duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div>
                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{companyName}</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-teal-600" />
                            <span>{new Date(company.eventDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase size={16} className="text-teal-600" />
                            <span>{company.jobRole}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-teal-600" />
                            <span>{company.totalSelected} Selected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadExcel(companyName);
                      }}
                      disabled={downloadingExcel && downloadingCompany === companyName}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition duration-200 flex items-center gap-2 whitespace-nowrap"
                    >
                      <Download size={16} />
                      {downloadingExcel && downloadingCompany === companyName ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                </div>

                {/* Company Students Table */}
{/* Company Students Table */}
{isExpanded && (
  <div className="overflow-x-auto">
    {filteredStudents.length === 0 ? (
      <div className="p-6 text-center text-gray-500">
        No students match the selected filters
      </div>
    ) : (
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-t border-gray-200">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Student Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Roll No
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Branch
            </th>

            {/* CRT / Academic Batch (YOP) */}
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Batch
            </th>

            {/* Placement Training Batch Number */}
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Batch Number
            </th>

            {/* College from PlacementTrainingBatch */}
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              College
            </th>

            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Email
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Selection Date
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-200 hover:bg-gray-50 transition duration-150"
            >
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                {student.name || "NA"}
              </td>

              <td className="px-6 py-4 text-sm text-gray-700">
                {student.rollNumber || "NA"}
              </td>

              <td className="px-6 py-4 text-sm text-gray-700">
                {student.branch || "NA"}
              </td>

              {/* CRT / Academic batch (usually Year Of Passing) */}
              <td className="px-6 py-4 text-sm text-gray-700">
                {student.batch || "NA"}
              </td>

              {/* Placement Training Batch Number */}
              <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                {student.batchNumber || "NA"}
              </td>

              {/* College(s) from PlacementTrainingBatch */}
              <td className="px-6 py-4 text-sm text-gray-700">
                {student.colleges || "NA"}
              </td>

              <td className="px-6 py-4 text-sm text-blue-600">
                {student.email ? (
                  <a
                    href={`mailto:${student.email}`}
                    className="hover:underline"
                  >
                    {student.email}
                  </a>
                ) : (
                  "NA"
                )}
              </td>

              <td className="px-6 py-4 text-sm text-gray-700">
                {student.phone ? (
                  <a
                    href={`tel:${student.phone}`}
                    className="hover:underline"
                  >
                    {student.phone}
                  </a>
                ) : (
                  "NA"
                )}
              </td>

              <td className="px-6 py-4 text-sm text-gray-700">
                {student.selectionDate
                  ? new Date(student.selectionDate).toLocaleDateString()
                  : "NA"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlacedStudentsTab;
