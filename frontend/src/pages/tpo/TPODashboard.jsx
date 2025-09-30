import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Settings, LogOut, Bell, ChevronDown,
  Building, Calendar, Eye, ChevronRight
} from 'lucide-react';
import PasswordChangeNotification from '../../components/common/PasswordChangeNotification';

const TPODashboard = () => {
  const [tpoData, setTpoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [message, setMessage] = useState('');
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [errorBatches, setErrorBatches] = useState('');
  const [showPlacementBatches, setShowPlacementBatches] = useState(false);
  
  // Placement Training Batches state
  const [placementBatchData, setPlacementBatchData] = useState({});
  const [placementStats, setPlacementStats] = useState({});
  const [loadingPlacementBatches, setLoadingPlacementBatches] = useState(false);
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedColleges, setExpandedColleges] = useState({});
  const [selectedBatch, setSelectedBatch] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchAssignedBatches();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/auth/dashboard/tpo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setTpoData(result.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch {
      setError('Failed to fetch dashboard data');
    }
  };

  const fetchAssignedBatches = async () => {
    setLoadingBatches(true);
    setErrorBatches('');
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/tpo/batches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setAssignedBatches(result.data);
      } else {
        setErrorBatches(result.message || 'Failed to fetch assigned batches');
      }
    } catch (err) {
      setErrorBatches('Failed to fetch assigned batches');
    }
    setLoadingBatches(false);
  };

  const fetchPlacementTrainingBatches = async () => {
    setLoadingPlacementBatches(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/tpo/placement-training-batches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPlacementBatchData(data.data.organized);
        setPlacementStats(data.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch placement training batches:', err);
    } finally {
      setLoadingPlacementBatches(false);
    }
  };

  const handleViewPlacementBatches = () => {
    setShowPlacementBatches(true);
    fetchPlacementTrainingBatches();
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

  const getStatusBadge = (batch) => {
    const now = new Date();
    const startDate = new Date(batch.startDate);
    const endDate = new Date(batch.endDate);

    if (!batch.isActive) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>;
    }
    if (startDate > now) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Not Started</span>;
    }
    if (endDate < now) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Completed</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ongoing</span>;
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('userToken');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      navigate('/tpo-login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PasswordChangeNotification
        userType="tpo"
        onPasswordChange={() => { }}
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TPO Dashboard</h1>
                <p className="text-sm opacity-90">Training & Placement Office</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center space-x-1 p-2 text-white hover:text-gray-200 transition-colors"
                >
                  <Settings className="h-6 w-6" />
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/tpo-profile');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/tpo-change-password');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Change Password
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {tpoData?.user?.name}!
              </h2>
              <p className="text-gray-600">
                {tpoData?.message}
              </p>
            </div>
            {tpoData?.lastLogin && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="text-sm font-medium">
                  {new Date(tpoData.lastLogin).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Assigned Trainers</h3>
                <p className="text-3xl font-bold text-blue-600">{tpoData?.assignedTrainers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Building className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Managed Companies</h3>
                <p className="text-3xl font-bold text-green-600">{tpoData?.managedCompanies || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Assigned Batches</h3>
                <p className="text-3xl font-bold text-purple-600">{tpoData?.assignedBatches || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Manage Students</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Company Relations</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Placement Schedule</p>
            </button>
          </div>
          
          {/* View Placement Training Batches Button */}
          <div className="mt-6">
            <button
              onClick={handleViewPlacementBatches}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
            >
              View Placement Training Batches
            </button>
          </div>
        </div>

        {/* Assigned Batches Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Assigned Batches</h3>
          {loadingBatches && <div>Loading batches...</div>}
          {errorBatches && (
            <div className="text-red-500 mb-4">{errorBatches}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignedBatches.map((batch) => (
              <div
                key={batch._id}
                className="bg-gray-50 border rounded shadow p-4 mb-4"
              >
                <h4 className="font-semibold text-lg mb-2">
                  Batch: {batch.batchNumber}
                </h4>
                <div>
                  <span className="font-medium text-gray-700">Colleges:</span> {batch.colleges?.join(', ') || '-'}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Students:</span> {batch.students?.length || 0}
                </div>
                <div>
                  <span className="font-medium text-gray-700">TPO:</span> {batch.tpoId?.name || '-'} ({batch.tpoId?.email || '-'})
                </div>
                <div>
                  <span className="font-medium text-gray-700">Start:</span> {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '-'}
                </div>
                <div>
                  <span className="font-medium text-gray-700">End:</span> {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : '-'}
                </div>
              </div>
            ))}
          </div>
          {!loadingBatches && assignedBatches.length === 0 && (
            <div className="text-gray-500 mt-4">No batches assigned yet.</div>
          )}
        </div>
      </main>

      {/* Placement Training Batches Modal */}
      {showPlacementBatches && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 shadow-lg rounded-md bg-white mb-10">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-900">My Placement Training Batches</h3>
              <button
                onClick={() => setShowPlacementBatches(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            {loadingPlacementBatches ? (
              <div className="flex justify-center items-center h-64">Loading...</div>
            ) : (
              <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Total Training Batches</p>
                    <p className="text-2xl font-semibold text-gray-900">{placementStats.totalBatches || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-semibold text-gray-900">{placementStats.totalStudents || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">CRT Batches</p>
                    <p className="text-2xl font-semibold text-gray-900">{placementStats.crtBatches || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Non-CRT Batches</p>
                    <p className="text-2xl font-semibold text-gray-900">{placementStats.nonCrtBatches || 0}</p>
                  </div>
                </div>

                {/* Hierarchical Batch Display */}
                <div className="max-h-96 overflow-y-auto">
                  {Object.keys(placementBatchData).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No placement training batches assigned yet.
                    </div>
                  ) : (
                    Object.keys(placementBatchData).sort().reverse().map(year => (
                      <div key={year} className="mb-4">
                        {/* Year Header */}
                        <div
                          className="flex items-center cursor-pointer p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                          onClick={() => toggleYear(year)}
                        >
                          {expandedYears[year] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                          <h4 className="ml-2 text-lg font-semibold text-gray-900">Year {year}</h4>
                          <span className="ml-4 text-sm text-gray-600">
                            ({Object.values(placementBatchData[year]).reduce((acc, colleges) =>
                              acc + Object.values(colleges).reduce((acc2, techStacks) =>
                                acc2 + techStacks.totalBatches, 0), 0)} batches)
                          </span>
                        </div>

                        {/* Colleges under this year */}
                        {expandedYears[year] && (
                          <div className="ml-6 mt-2 space-y-2">
                            {Object.keys(placementBatchData[year]).map(college => (
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
                                    ({Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalBatches, 0)} batches,{' '}
                                    {Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalStudents, 0)} students)
                                  </span>
                                </div>

                                {/* Tech Stacks under this college */}
                                {expandedColleges[`${year}-${college}`] && (
                                  <div className="ml-6 mt-2 space-y-2">
                                    {Object.keys(placementBatchData[year][college]).map(techStack => (
                                      <div key={techStack} className="border border-gray-200 rounded-lg p-3">
                                        {/* Tech Stack Header */}
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTechStackColor(techStack)}`}>
                                              {techStack}
                                            </span>
                                            <span className="ml-3 text-sm text-gray-600">
                                              {placementBatchData[year][college][techStack].totalBatches} batches,{' '}
                                              {placementBatchData[year][college][techStack].totalStudents} students
                                            </span>
                                          </div>
                                        </div>

                                        {/* Individual Batches */}
                                        <div className="space-y-2">
                                          {placementBatchData[year][college][techStack].batches.map(batch => (
                                            <div key={batch._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                              <div className="flex items-center space-x-3">
                                                <span className="font-medium text-gray-900">{batch.batchNumber}</span>
                                                <span className="text-sm text-gray-600">
                                                  {batch.studentCount} students
                                                </span>
                                                {getStatusBadge(batch)}
                                                <span className="text-xs text-gray-500">
                                                  {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
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
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedBatch.batchNumber} - Students
              </h3>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
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
                  <p className="font-medium text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedBatch)}</div>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Duration</p>
                  <p className="text-gray-900">
                    {new Date(selectedBatch.startDate).toLocaleDateString()} - {new Date(selectedBatch.endDate).toLocaleDateString()}
                  </p>
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

export default TPODashboard;