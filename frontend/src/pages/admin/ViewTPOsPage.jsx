import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../../components/ui/ToastNotification';

const ViewTPOsPage = () => {
  const [tpos, setTpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchTPOs();
  }, []);

  const fetchTPOs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tpos', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const result = await response.json();
      if (result.success) {
        setTpos(result.data);
      } else {
        showToast('error', result.message);
      }
    } catch {
      showToast('error', 'Failed to fetch TPOs');
    } finally {
      setLoading(false);
    }
  };

  const filteredTPOs = tpos.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
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
      <h1 className="text-3xl font-bold mb-6">TPOs List</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search TPOs by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading TPOs...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-md shadow">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Phone</th>
                <th className="py-3 px-6 text-left">Experience (Years)</th>
                <th className="py-3 px-6 text-left">LinkedIn</th>
              </tr>
            </thead>
            <tbody>
              {filteredTPOs.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 px-6 text-center text-gray-500">No TPOs found.</td>
                </tr>
              )}
              {filteredTPOs.map((tpo) => (
                <tr key={tpo._id} className="border-b hover:bg-blue-50 cursor-pointer"
                    onClick={() => navigate(`/tpo-profile/${tpo._id}`)}> {/* Optional profile view */}
                  <td className="py-3 px-6">{tpo.name}</td>
                  <td className="py-3 px-6">{tpo.email}</td>
                  <td className="py-3 px-6">{tpo.phone}</td>
                  <td className="py-3 px-6">{tpo.experience}</td>
                  <td className="py-3 px-6">
                    {tpo.linkedIn ? (
                      <a href={tpo.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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

export default ViewTPOsPage;
