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
    console.log("Received external link from TPO:", tpoExternalLink);
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
      console.log("Student profile data:", res.data?.data);
      setStudentData(res.data?.data || {});
    } catch (err) {
      console.error("Error fetching student profile:", err);
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
    console.log("🟣 Registering event:", eventId);

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

    console.log("✅ Registration response:", res.data);
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
    console.error("❌ Error submitting registration:", err?.response?.data || err.message || err);
    showToast('error', err.response?.data?.message || "Failed to submit registration");
  }
};



  if (!studentData)
    return <p className="text-center text-gray-500">Loading student details...</p>;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        {toast && (
          <ToastNotification
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-purple-700 mb-6 text-center">
          Company Registration Form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
  ["Full Name", studentData.name],
  ["Roll Number", studentData.rollNo],  // <-- use rollNo here
  ["Email", studentData.email],
  ["Phone Number", studentData.phonenumber],
  ["College", studentData.college],
  ["Branch", studentData.branch],
  ["Gender", studentData.gender],
  ["Date of Birth", studentData.dob ? new Date(studentData.dob).toLocaleDateString() : ""], // format Date to string
  ["Current Location", studentData.currentLocation],
  ["Home Town", studentData.hometown],
  ["Backlogs", studentData.backlogs],
  ["Tech Stack", studentData.techStack],
]

.map(([label, value]) => (
            <div key={label}>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                {label}
              </label>
              <input
                type="text"
                value={value || ""}
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
              />
            </div>
          ))}

          {/* External Link (Optional) */}
          {/* ✅ External Link (Optional + Clickable) */}
<div>
  <label className="block text-sm font-medium mb-1 text-gray-700">
    External Link (Optional)
  </label>

  {externalLink ? (
    <div className="flex items-center gap-3">
      <input
        type="url"
        value={externalLink}
        onChange={(e) => setExternalLink(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
        placeholder="https://yourportfolio.com"
        disabled={disableExternalLink}
      />
      <a
        href={externalLink}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm"
      >
        Open
      </a>
    </div>
  ) : (
    <input
      type="url"
      value={externalLink}
      onChange={(e) => setExternalLink(e.target.value)}
      className="w-full border rounded-lg px-3 py-2"
      placeholder="https://yourportfolio.com"
      disabled={disableExternalLink}
    />
  )}
</div>


          {/* Resume Upload */}
          <div>
  <label className="block text-sm font-medium mb-1">Resume</label>
  {studentData.resumeUrl ? (
    <a
      href={studentData.resumeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline"
    >
      {studentData.resumeFileName || "View Resume"}
    </a>
  ) : (
    <p className="text-gray-500">No resume uploaded</p>
  )}
</div>


          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-all"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegistrationForm;
