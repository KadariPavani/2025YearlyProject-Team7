import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TPOEventRegistrations = ({ eventId }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId) fetchRegistrations();
  }, [eventId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}/registrations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('userToken')}`,
        },
      });
      setRegistrations(res.data.data);
    } catch (err) {
    }
    setLoading(false);
  }; 

  if (loading) return <p>Loading registrations...</p>;
  if (!registrations.length) return <p>No registrations found for this event.</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Registered Students</h2>
      <table className="w-full table-auto border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Roll No.</th>
            <th className="border border-gray-300 p-2">Email</th>
            <th className="border border-gray-300 p-2">Phone</th>
            <th className="border border-gray-300 p-2">College</th>
            <th className="border border-gray-300 p-2">Branch</th>
            <th className="border border-gray-300 p-2">Gender</th>
            <th className="border border-gray-300 p-2">DOB</th>
            <th className="border border-gray-300 p-2">Current Location</th>
            <th className="border border-gray-300 p-2">Hometown</th>
            <th className="border border-gray-300 p-2">Backlogs</th>
            <th className="border border-gray-300 p-2">Tech Stack</th>
            <th className="border border-gray-300 p-2">Resume</th>
            <th className="border border-gray-300 p-2">External Link</th>
            <th className="border border-gray-300 p-2">Registered At</th>
            <th className="border border-gray-300 p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => {
            const s = reg.studentInfo;
            return (
              <tr key={reg.registrationId}>
                <td className="border border-gray-300 p-2">{s.name}</td>
                <td className="border border-gray-300 p-2">{s.rollNo}</td>
                <td className="border border-gray-300 p-2">{s.email}</td>
                <td className="border border-gray-300 p-2">{s.phonenumber}</td>
                <td className="border border-gray-300 p-2">{s.college}</td>
                <td className="border border-gray-300 p-2">{s.branch}</td>
                <td className="border border-gray-300 p-2">{s.gender}</td>
                <td className="border border-gray-300 p-2">{s.dob ? new Date(s.dob).toLocaleDateString() : ''}</td>
                <td className="border border-gray-300 p-2">{s.currentLocation}</td>
                <td className="border border-gray-300 p-2">{s.hometown}</td>
                <td className="border border-gray-300 p-2">{s.backlogs}</td>
                <td className="border border-gray-300 p-2">{s.techStack?.join(', ')}</td>
                <td className="border border-gray-300 p-2">
                  {s.resumeUrl ? (
                    <a href={s.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {s.resumeFileName || 'View'}
                    </a>
                  ) : (
                    'No Resume'
                  )}
                </td>
                <td className="border border-gray-300 p-2">
                  {reg.externalLink ? (
                    <a href={reg.externalLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      Link
                    </a>
                  ) : (
                    'No Link'
                  )}
                </td>
                <td className="border border-gray-300 p-2">{new Date(reg.registeredAt).toLocaleString()}</td>
                <td className="border border-gray-300 p-2">{reg.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TPOEventRegistrations;
