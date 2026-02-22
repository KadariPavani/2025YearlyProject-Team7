import React, { useState, useEffect } from "react";
import axios from "axios";
import ToastNotification from '../../components/ui/ToastNotification';

const CompanyRegistrationForm = ({  eventId, onClose, tpoExternalLink, onRegistered }) => {
  const [studentData, setStudentData] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [externalLink, setExternalLink] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };
useEffect(() => {
  if (tpoExternalLink) {
    setExternalLink(tpoExternalLink);
  }
}, [tpoExternalLink]);

const disableExternalLink = Boolean(tpoExternalLink);
useEffect(() => {
  const fetchStudentProfile = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentData(res.data?.data || {});
    } catch (err) {
    }
  };

  fetchStudentProfile();
}, [tpoExternalLink]);
const openCompanyRegistrationForm = (event) => {
  setSelectedEventId(event.id);
  setTpoExternalLink(event.companyFormLink || ""); // Pass from TPO form here
  setShowStudentForm(true);
};



const handleSubmit = async (e) => {
  e.preventDefault();

  if (!studentData) {
    showToast('error','Student data not loaded yet!');
    return;
  }

  try {

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}/register`,
      { externalLink },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    showToast('success','Registration submitted successfully!');

    // ✅ Trigger parent to refresh registered list & hide register button
    // Inside handleSubmit, after successful registration
if (typeof onRegistered === "function") {
  onRegistered(eventId); // ✅ Pass eventId to parent
}


    // 🟣 Optional: trigger global refresh for dashboard
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("studentRegistered"));
    }

    onClose();
  } catch (err) {
    showToast('error', err.response?.data?.message || "Failed to submit registration");
  }
};



  if (!studentData)
    return <p className="text-center text-gray-500">Loading student details...</p>;

  return (
    <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}>
      {/* Desktop: centered modal */}
      <div className="hidden sm:flex items-center justify-center min-h-full p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 rounded-t-lg flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Company Registration Form</h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 text-lg">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {[
              ["Full Name", studentData.name],
              ["Roll Number", studentData.rollNo],
              ["Email", studentData.email],
              ["Phone Number", studentData.phonenumber],
              ["College", studentData.college],
              ["Branch", studentData.branch],
              ["Gender", studentData.gender],
              ["Date of Birth", studentData.dob ? new Date(studentData.dob).toLocaleDateString() : ""],
              ["Current Location", studentData.currentLocation],
              ["Home Town", studentData.hometown],
              ["Backlogs", studentData.backlogs],
              ["Tech Stack", studentData.techStack],
            ].map(([label, value]) => (
              <div key={label}>
                <label className="block text-xs font-medium mb-1 text-gray-600">{label}</label>
                <input type="text" value={value || ""} disabled className="w-full border border-gray-200 rounded px-3 py-1.5 bg-gray-50 text-xs sm:text-sm text-gray-700" />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600">External Link (Optional)</label>
              <div className="flex items-center gap-2">
                <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs sm:text-sm" placeholder="https://yourportfolio.com" disabled={disableExternalLink} />
                {externalLink && (
                  <a href={externalLink} target="_blank" rel="noopener noreferrer" className="shrink-0 px-2.5 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Open</a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600">Resume</label>
              {studentData.resumeUrl ? (
                <a href={studentData.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">{studentData.resumeFileName || "View Resume"}</a>
              ) : (
                <p className="text-xs text-gray-500">No resume uploaded</p>
              )}
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700">Submit</button>
          </form>
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
        {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold text-gray-900">Company Registration</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {[
            ["Full Name", studentData.name],
            ["Roll Number", studentData.rollNo],
            ["Email", studentData.email],
            ["Phone", studentData.phonenumber],
            ["College", studentData.college],
            ["Branch", studentData.branch],
            ["Gender", studentData.gender],
            ["DOB", studentData.dob ? new Date(studentData.dob).toLocaleDateString() : ""],
            ["Location", studentData.currentLocation],
            ["Home Town", studentData.hometown],
            ["Backlogs", studentData.backlogs],
            ["Tech Stack", studentData.techStack],
          ].map(([label, value]) => (
            <div key={label}>
              <label className="block text-[10px] font-medium mb-0.5 text-gray-500">{label}</label>
              <input type="text" value={value || ""} disabled className="w-full border border-gray-200 rounded px-2.5 py-1.5 bg-gray-50 text-xs text-gray-700" />
            </div>
          ))}

          <div>
            <label className="block text-[10px] font-medium mb-0.5 text-gray-500">External Link</label>
            <div className="flex items-center gap-2">
              <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs" placeholder="https://yourportfolio.com" disabled={disableExternalLink} />
              {externalLink && (
                <a href={externalLink} target="_blank" rel="noopener noreferrer" className="shrink-0 px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Open</a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium mb-0.5 text-gray-500">Resume</label>
            {studentData.resumeUrl ? (
              <a href={studentData.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">{studentData.resumeFileName || "View Resume"}</a>
            ) : (
              <p className="text-xs text-gray-500">No resume uploaded</p>
            )}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded text-sm font-medium hover:bg-blue-700">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegistrationForm;
