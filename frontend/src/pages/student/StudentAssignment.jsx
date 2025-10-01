import React, { useEffect, useState } from "react";

// Helper function to check if a date is upcoming
const isUpcoming = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  return due.setHours(0, 0, 0, 0) > today.setHours(0, 0, 0, 0);
};

// Assignment statistics card
const AssignmentStatsCard = ({ total, completed, pending, upcoming }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
    <StatItem label="Total" count={total} color="bg-blue-200 text-blue-800" />
    <StatItem label="Completed" count={completed} color="bg-green-200 text-green-800" />
    <StatItem label="Pending" count={pending} color="bg-yellow-200 text-yellow-800" />
    <StatItem label="Upcoming" count={upcoming} color="bg-purple-200 text-purple-800" />
  </div>
);

const StatItem = ({ label, count, color }) => (
  <div className={`p-4 rounded-xl text-center ${color} shadow-lg transition-transform hover:scale-105`}>
    <div className="text-3xl font-extrabold">{count}</div>
    <div className="text-sm font-semibold">{label}</div>
  </div>
);

// Assignment list item
const AssignmentItem = ({ assignment, onClick }) => {
  let statusColor = "";
  let statusText = "";

  if (assignment.status === "graded") {
    statusColor = "bg-indigo-100 text-indigo-700";
    statusText = `Graded: ${assignment.grade}`;
  } else if (assignment.status === "submitted") {
    statusColor = "bg-purple-100 text-purple-700";
    statusText = "Submitted";
  } else if (isUpcoming(assignment.dueDate)) {
    statusColor = "bg-blue-100 text-blue-700";
    statusText = "Upcoming";
  } else {
    statusColor = "bg-yellow-100 text-yellow-700";
    statusText = "Pending";
  }

  return (
    <div
      className="bg-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
      onClick={() => onClick(assignment)}
    >
      <div className="flex-1">
        <h2 className="text-lg font-bold text-gray-800">{assignment.title}</h2>
        <p className="text-sm text-gray-500 mt-1">Given by: {assignment.trainerId?.name || "N/A"}</p>
        <p className="text-sm text-gray-500">Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : ""}</p>
      </div>
      <div className="flex items-center space-x-4 mt-4 md:mt-0">
        <div className={`text-sm font-semibold py-1 px-3 rounded-full whitespace-nowrap ${statusColor}`}>
          {statusText}
        </div>
      </div>
    </div>
  );
};

// Assignment details and file upload
const AssignmentDetails = ({ assignment, onGoBack, onFileSubmit }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadClick = () => {
    if (file) {
      onFileSubmit(assignment._id, file.name);
      setFile(null);
    }
  };

  let statusColor = "";
  let statusText = "";
  if (assignment.status === "graded") {
    statusColor = "bg-indigo-100 text-indigo-700";
    statusText = `Graded: ${assignment.grade}`;
  } else if (assignment.status === "submitted") {
    statusColor = "bg-purple-100 text-purple-700";
    statusText = "Submitted";
  } else if (isUpcoming(assignment.dueDate)) {
    statusColor = "bg-blue-100 text-blue-700";
    statusText = "Upcoming";
  } else {
    statusColor = "bg-yellow-100 text-yellow-700";
    statusText = "Pending";
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto">
      <button
        onClick={onGoBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Back to Assignments
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
      <div className="flex items-center space-x-4 mb-6 text-gray-600 text-sm">
        <p>Given by: <span className="font-semibold">{assignment.trainerId?.name || "N/A"}</span></p>
        <p>Due: <span className="font-semibold">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : ""}</span></p>
        <span className={`text-xs font-bold py-1 px-3 rounded-full ${statusColor}`}>{statusText}</span>
      </div>

      <div className="prose max-w-none text-gray-700">
        <h2 className="text-xl font-bold mb-2">Description</h2>
        <p>{assignment.description}</p>
        {assignment.submission && (
          <p className="mt-4 font-semibold text-gray-800">
            Submitted File: <span className="text-blue-600">{assignment.submission}</span>
          </p>
        )}
        {assignment.grade && (
          <p className="mt-2 font-semibold text-gray-800">
            Grade: <span className="text-indigo-600">{assignment.grade}</span>
          </p>
        )}
        {assignment.attachmentLink && (
          <p className="mt-2 font-semibold text-gray-800">
            Attachment:{" "}
            <a href={assignment.attachmentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Download
            </a>
          </p>
        )}
      </div>

      {!assignment.submission && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Submit Assignment</h2>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              type="file"
              id="submission-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
            />
            <button
              onClick={handleUploadClick}
              disabled={!file}
              className={`font-semibold py-2 px-6 rounded-lg shadow-md w-full sm:w-auto transition-colors ${
                file
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StudentAssignment() {
  const [assignments, setAssignments] = useState([]);
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load submissions from localStorage
  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem("studentAssignmentSubmissions");
    return saved ? JSON.parse(saved) : {};
  });

  // Save submissions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("studentAssignmentSubmissions", JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        setLoading(true);
        const response = await fetch("/api/assignments/public");
        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }
        const data = await response.json();
        const withSubmission = data.map((a) =>
          submissions[a._id]
            ? { ...a, submission: submissions[a._id], status: "submitted" }
            : a
        );
        setAssignments(Array.isArray(withSubmission) ? withSubmission : []);
      } catch (err) {
        setError("Failed to fetch assignments");
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
    // eslint-disable-next-line
  }, [submissions]);

  const handleSubmitAssignment = (id, fileName) => {
    setSubmissions((prev) => ({ ...prev, [id]: fileName }));
    setCurrentView("dashboard");
    setSelectedAssignment(null);
  };

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
    setCurrentView("details");
  };

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(
    (a) => a.status === "completed" || a.status === "submitted" || a.status === "graded"
  ).length;
  const pendingAssignments = assignments.filter((a) => a.status === "pending").length;
  const upcomingAssignments = assignments.filter(
    (a) => a.status === "pending" && isUpcoming(a.dueDate)
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-10">
          Your Assignments
        </h1>
        {currentView === "details" && selectedAssignment ? (
          <AssignmentDetails
            assignment={{
              ...selectedAssignment,
              submission: submissions[selectedAssignment._id],
            }}
            onGoBack={() => setCurrentView("dashboard")}
            onFileSubmit={handleSubmitAssignment}
          />
        ) : (
          <>
            <AssignmentStatsCard
              total={totalAssignments}
              completed={completedAssignments}
              pending={pendingAssignments}
              upcoming={upcomingAssignments}
            />
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Assignment List</h2>
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <AssignmentItem
                    key={assignment._id}
                    assignment={{
                      ...assignment,
                      submission: submissions[assignment._id],
                      status: submissions[assignment._id]
                        ? "submitted"
                        : assignment.status || "pending",
                    }}
                    onClick={handleAssignmentClick}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500">No assignments found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
