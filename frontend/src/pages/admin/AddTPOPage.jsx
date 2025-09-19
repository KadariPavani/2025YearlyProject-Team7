import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import ToastNotification from '../../components/ui/ToastNotification';

const AddTPOPage = () => {
  const navigate = useNavigate();

  const [tpoData, setTpoData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    linkedIn: ''
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setTpoData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-tpo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          ...tpoData,
          experience: parseInt(tpoData.experience) || 0,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('success', 'TPO added successfully! Credentials sent to their email.');
        setTimeout(() => navigate('/admin-dashboard'), 3000);
      } else {
        showToast('error', result.message);
      }
    } catch {
      showToast('error', 'Failed to add TPO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left icon */}
      <div className="md:w-1/3 bg-white flex flex-col items-center justify-center p-12 shadow-lg">
        <Users 
          size={120} 
          className="text-blue-600" 
          strokeWidth={1.5} 
        />
        <h2 className="mt-6 text-2xl font-bold text-gray-700 text-center">
          Add TPO
        </h2>
        <p className="mt-2 text-center text-gray-500 max-w-xs">
          Fill in the TPO’s details to create a new account in the system.
        </p>
      </div>

      {/* Form side */}
      <div className="md:w-2/3 flex items-center justify-center p-10">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-10 w-full max-w-lg">
          {toast && (
            <ToastNotification 
              type={toast.type} 
              message={toast.message} 
              onClose={() => setToast(null)} 
            />
          )}

          <div className="space-y-6">
            {[
              { label: 'Name*', name: 'name', type: 'text', placeholder: 'Enter name' },
              { label: 'Email*', name: 'email', type: 'email', placeholder: 'Enter email' },
              { label: 'Phone*', name: 'phone', type: 'tel', placeholder: '10-digit phone', maxLength: 10 },
              { label: 'Experience (Years)', name: 'experience', type: 'number', placeholder: 'Years of experience', min: 0 },
              { label: 'LinkedIn Profile', name: 'linkedIn', type: 'url', placeholder: 'LinkedIn URL' }
            ].map(({ label, name, type, placeholder, maxLength, min }) => (
              <div key={name} className="flex flex-col">
                <label htmlFor={name} className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
                <input
                  id={name}
                  type={type}
                  name={name}
                  required={label.endsWith('*')}
                  placeholder={placeholder}
                  value={tpoData[name] || ''}
                  onChange={handleChange}
                  maxLength={maxLength}
                  min={min}
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-10">
            <button 
              type="button"
              onClick={() => navigate('/admin-dashboard')}
              disabled={loading}
              className="px-7 py-3 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add TPO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTPOPage;
