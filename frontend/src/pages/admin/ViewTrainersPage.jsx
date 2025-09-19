import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../../components/ui/ToastNotification';

const ViewTrainersPage = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/trainers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const result = await response.json();
      if (result.success) {
        setTrainers(result.data);
      } else {
        showToast('error', result.message);
      }
    } catch {
      showToast('error', 'Failed to fetch trainers');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainers = trainers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-7xl mx-auto">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <h1 className="text-3xl font-bold mb-6">Trainers List</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search trainers by name, email, or employee ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading trainers...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-md shadow">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Phone</th>
                <th className="py-3 px-6 text-left">Employee ID</th>
                <th className="py-3 px-6 text-left">Experience (Years)</th>
                <th className="py-3 px-6 text-left">Subject</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-left">LinkedIn</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrainers.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-4 px-6 text-center text-gray-500">No trainers found.</td>
                </tr>
              )}
              {filteredTrainers.map((trainer) => (
                <tr key={trainer._id} className="border-b hover:bg-green-50 cursor-pointer"
                    onClick={() => navigate(`/trainer-profile/${trainer._id}`)}  /* Optional profile view */>
                  <td className="py-3 px-6">{trainer.name}</td>
                  <td className="py-3 px-6">{trainer.email}</td>
                  <td className="py-3 px-6">{trainer.phone}</td>
                  <td className="py-3 px-6">{trainer.employeeId}</td>
                  <td className="py-3 px-6">{trainer.experience}</td>
                  <td className="py-3 px-6">{trainer.subjectDealing}</td>
                  <td className="py-3 px-6 capitalize">{trainer.category}</td>
                  <td className="py-3 px-6">
                    {trainer.linkedIn ? (
                      <a href={trainer.linkedIn} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                        LinkedIn
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        onClick={() => navigate('/admin-dashboard')}
        className="mt-6 px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-md font-semibold"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default ViewTrainersPage;
