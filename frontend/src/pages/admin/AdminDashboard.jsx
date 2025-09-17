import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Bell, Settings, LogOut, ChevronDown, X, UserCircle,
  Plus, Users, GraduationCap, Phone, Mail, MapPin, Trash2, Edit, Check, AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showAddTPO, setShowAddTPO] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  

  // Trainer form state
  const [trainerData, setTrainerData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    experience: '',
    linkedIn: '',
    subjects: []
  });
  const [newSubject, setNewSubject] = useState({ name: '', type: 'technical' });

  // TPO form state
  const [tpoData, setTpoData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    linkedIn: ''
  });

  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedAdminData = localStorage.getItem('adminData');
    if (storedAdminData) {
      setAdminData(JSON.parse(storedAdminData));
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/');
  };


  const addSubject = () => {
    if (newSubject.name.trim()) {
      setTrainerData(prev => ({
        ...prev,
        subjects: [...prev.subjects, { ...newSubject, id: Date.now() }]
      }));
      setNewSubject({ name: '', type: 'technical' });
    }
  };

  const removeSubject = (id) => {
    setTrainerData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(subject => subject.id !== id)
    }));
  };

  const handleAddTrainer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/add-trainer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          ...trainerData,
          experience: parseInt(trainerData.experience) || 0,
          subjects: trainerData.subjects.map(s => ({ name: s.name, type: s.type }))
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Trainer added successfully! Credentials sent to their email.');
        setTrainerData({
          name: '',
          email: '',
          phone: '',
          employeeId: '',
          experience: '',
          linkedIn: '',
          subjects: []
        });
        setTimeout(() => {
          setShowAddTrainer(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch {
      setError('Failed to add trainer');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTPO = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/add-tpo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          ...tpoData,
          experience: parseInt(tpoData.experience) || 0
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('TPO added successfully! Credentials sent to their email.');
        setTpoData({
          name: '',
          email: '',
          phone: '',
          experience: '',
          linkedIn: ''
        });
        setTimeout(() => {
          setShowAddTPO(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch {
      setError('Failed to add TPO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm opacity-90">Welcome to InfoVerse Admin Panel</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
              </button>
              
              <button
                onClick={() => navigate('/admin-profile')}
                className="flex items-center space-x-2 p-2 text-white hover:text-gray-200 transition-colors"
              >
                <UserCircle className="h-6 w-6" />
                <span className="hidden sm:inline">Profile</span>
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
                        navigate('/admin-profile')
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/admin-change-password');
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
                className="flex items-center space-x-2 bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
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
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Add Trainer Card */}
          {adminData?.permissions?.canAddTrainer && (
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <GraduationCap className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add Trainer</h3>
                  <p className="text-sm text-gray-600">Create new trainer account</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTrainer(true)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Trainer
              </button>
            </div>
          )}

          {/* Add TPO Card */}
          {adminData?.permissions?.canAddTPO && (
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add TPO</h3>
                  <p className="text-sm text-gray-600">Create new TPO account</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTPO(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add TPO
              </button>
            </div>
          )}
        </div>

        {/* Dashboard Stats */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome to your admin dashboard. Use the action cards above to manage users.</p>
        </div>
      </main>

      {/* Add Trainer Modal */}
      {showAddTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Add New Trainer</h2>
              <button
                onClick={() => setShowAddTrainer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddTrainer} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name*</label>
                  <input
                    type="text"
                    required
                    value={trainerData.name}
                    onChange={(e) => setTrainerData({...trainerData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter trainer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
                  <input
                    type="email"
                    required
                    value={trainerData.email}
                    onChange={(e) => setTrainerData({...trainerData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone*</label>
                  <input
                    type="tel"
                    required
                    value={trainerData.phone}
                    onChange={(e) => setTrainerData({...trainerData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="10-digit phone number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID*</label>
                  <input
                    type="text"
                    required
                    value={trainerData.employeeId}
                    onChange={(e) => setTrainerData({...trainerData, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter employee ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={trainerData.experience}
                    onChange={(e) => setTrainerData({...trainerData, experience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Years of experience"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={trainerData.linkedIn}
                    onChange={(e) => setTrainerData({...trainerData, linkedIn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="LinkedIn profile URL"
                  />
                </div>
              </div>

              {/* Subjects Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Subjects/Skills</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Subject/Skill name"
                  />
                  <select
                    value={newSubject.type}
                    onChange={(e) => setNewSubject({...newSubject, type: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="technical">Technical</option>
                    <option value="non-technical">Non-Technical</option>
                  </select>
                  <button
                    type="button"
                    onClick={addSubject}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {trainerData.subjects.length > 0 && (
                  <div className="space-y-2">
                    {trainerData.subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <div>
                          <span className="font-medium">{subject.name}</span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            subject.type === 'technical' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {subject.type}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTrainer(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add TPO Modal */}
      {showAddTPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Add New TPO</h2>
              <button
                onClick={() => setShowAddTPO(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddTPO} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name*</label>
                <input
                  type="text"
                  required
                  value={tpoData.name}
                  onChange={(e) => setTpoData({...tpoData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter TPO name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
                <input
                  type="email"
                  required
                  value={tpoData.email}
                  onChange={(e) => setTpoData({...tpoData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone*</label>
                <input
                  type="tel"
                  required
                  value={tpoData.phone}
                  onChange={(e) => setTpoData({...tpoData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10-digit phone number"
                  maxLength={10}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  value={tpoData.experience}
                  onChange={(e) => setTpoData({...tpoData, experience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Years of experience"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                <input
                  type="url"
                  value={tpoData.linkedIn}
                  onChange={(e) => setTpoData({...tpoData, linkedIn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="LinkedIn profile URL"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTPO(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add TPO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;