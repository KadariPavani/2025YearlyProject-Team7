import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Plus, X } from "lucide-react";

import TPOEventRegistrations from "./TPOEventRegistrations";
// Parse date in local timezone without timezone shift
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return new Date(year, month - 1, day); // month is 0-indexed
};

const PlacementCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [tpoId, setTpoId] = useState("");
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [viewOnly, setViewOnly] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
const [tpoFile, setTpoFile] = useState(null);
const [registeredStudents, setRegisteredStudents] = useState([]);
const [showRegistrations, setShowRegistrations] = useState(false);
const [tpoExternalLink, setTpoExternalLink] = useState("");
const [externalLink, setExternalLink] = useState("");
const [selectedEvent, setSelectedEvent] = useState(null);
const [showModal, setShowModal] = useState(false);
const [deletedEvents, setDeletedEvents] = useState([]);
const [showDeletedModal, setShowDeletedModal] = useState(false);
const [targetGroup, setTargetGroup] = useState("both");
const [selectedStudentEmail, setSelectedStudentEmail] = useState("");
const [selectedEmail, setSelectedEmail] = useState("");
const [highlightedEventId, setHighlightedEventId] = useState(null);
const [selectedFile, setSelectedFile] = useState(null);
const [showSelectModal, setShowSelectModal] = useState(false);
const [mailSent, setMailSent] = useState(false);
const [selectedDateLabel, setSelectedDateLabel] = useState("");
const [showSelectedStudentsModal, setShowSelectedStudentsModal] = useState(false);
const [selectedStudents, setSelectedStudents] = useState([]);
const [eventRegistrations, setEventRegistrations] = useState([]);
const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShowRegistrations = (eventId) => {
    setSelectedEventId(eventId);
    setShowRegistrations(true);
  };
const openCompanyRegistrationForm = (event) => {
  setSelectedEventId(event.id);
  setTpoExternalLink(event.externalLink || "");
  setShowStudentForm(true);
};
const handleViewSelectedStudents = async (eventId) => {
  try {
    const token = localStorage.getItem("userToken");
    const res = await axios.get(
      `http://localhost:5000/api/calendar/${eventId}/selected-students`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const students = res.data?.data || [];
    if (students.length > 0) {
      setSelectedStudents(students);
      setShowSelectedStudentsModal(true);
    } else {
      alert("⚠️ No selected students found for this event.");
    }
  } catch (err) {
    console.error("Error fetching selected students:", err);
    alert("Failed to load selected students");
  }
};

const [formData, setFormData] = useState({
  id: "",
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  venue: "",
  isOnline: false,
  companyName: "",
  companyFormLink: "",
  eventType: "",
  status: "scheduled",
  participated: "",
  placed: "",
  companyDetails: {           // ✅ Added nested object
    externalLink: ""
  }
});

  const [studentFormData, setStudentFormData] = useState({
  fullName: "",
  rollNumber: "",
  gender: "",
  dob: "",
  contactNumber: "",
  email: "",
  alternateContact: "",
  address: "",
  department: "",
  year: "",
  section: "",
  tenthPercent: "",
  twelfthPercent: "",
  currentCGPA: "",
  backlogs: "",
  yearOfPassing: "",
  jobRoles: "",
  preferredLocation: "",
  relocation: "No",
  expectedCTC: "",
  internship: "",
  linkedin: "",
  portfolio: "",
  resumeFile: null,
  photoFile: null,
  markSheets: null,
});

const handleUploadSelectedList = async () => {
  const eventIdToUse = selectedEventId || formData?.id;
  if (!selectedFile || !eventIdToUse) return alert("⚠️ Please select a file and event first!");
  if (mailSent) return alert("Mail & notification already sent!");

  try {
    const token = localStorage.getItem("userToken");
    const uploadData = new FormData();
    uploadData.append("file", selectedFile);
    uploadData.append("selectedStudentsCount", registeredStudents.length);
    uploadData.append(
      "selectedEmails",
      JSON.stringify(registeredStudents.map((s) => s.email))
    );

    const res = await axios.put(
      `http://localhost:5000/api/calendar/${eventIdToUse}/upload-selected`,
      uploadData,
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
    );

    if (res.data.success) {
      alert("📧 Selected list uploaded & mail sent successfully!");
      setMailSent(true); // ✅ lock mail sending
      setSelectedFile(null);
      fetchEvents();
    } else {
      alert("⚠️ Upload failed: " + res.data.message);
    }
  } catch (err) {
    console.error("❌ Upload failed:", err);
    alert("❌ Upload failed: " + err.message);
  }
};


  // Fetch TPO ID from logged-in user
  useEffect(() => {
    const fetchTpoId = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/tpo/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
        });
        const id =
          res.data?.data?._id ||
          res.data?.data?.tpoId ||
          res.data?.data?.user?._id ||
          res.data?._id;

        if (id) setTpoId(id);
      } catch (err) {
        console.error("Error fetching TPO profile:", err.response?.data || err.message);
      }
    };
    fetchTpoId();
    fetchEvents();
  }, []);
const autoSelectOngoingDate = (eventsList) => {
  const today = normalizeDate(new Date());

  // 1️⃣ Find ongoing events
  const ongoingEvents = eventsList.filter(
    (e) =>
      e.status === "ongoing" &&
      normalizeDate(e.startDate) <= today &&
      normalizeDate(e.endDate) >= today
  );

  if (ongoingEvents.length > 0) {
    setSelectedDate(today);
    setSelectedDateLabel(today.toDateString());
    setSelectedDateEvents(ongoingEvents);
    return;
  }

  // 2️⃣ Fallback: today's events (scheduled)
  const todayEvents = eventsList.filter(
    (e) => normalizeDate(e.startDate).getTime() === today.getTime()
  );

  setSelectedDate(today);
  setSelectedDateLabel(today.toDateString());
  setSelectedDateEvents(todayEvents);
};

useEffect(() => {
  const handleStudentRegistered = () => {
    console.log("🔄 Student registered — refreshing events...");
    fetchEvents();
  };

  window.addEventListener("studentRegistered", handleStudentRegistered);
  return () => {
    window.removeEventListener("studentRegistered", handleStudentRegistered);
  };
}, []);

const selectStudent = async (email) => {
  try {
    const token = localStorage.getItem("userToken");
    
    // ✅ Debug: Log what we're sending
    console.log("🔍 Selecting student (quick select):", {
      selectedEventId,
      studentEmail: email,
      hasToken: !!token
    });
    
    const res = await axios.put(
      `http://localhost:5000/api/calendar/${selectedEventId}/select-student`,
      { studentEmail: email },  // ✅ Fix: Backend expects 'studentEmail', not 'email'
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.success) {
      alert(res.data.message || "✅ Student selected successfully!");
      fetchRegisteredStudents(selectedEventId); // refresh list
      fetchEvents(); // ✅ Also refresh events to update placed students tab
    } else {
      alert(res.data.message);
    }
  } catch (err) {
    console.error("❌ Error selecting student:", err);
    console.error("❌ Error response:", err.response?.data);
    alert(err.response?.data?.message || "Failed to update student selection");
  }
};

const handleViewRegisteredStudents = async (eventId) => {
setSelectedEventId(eventId);

  try {
    const token = localStorage.getItem("userToken");
    if (!token) {
      alert("Please log in first");
      return;
    }

    // Fetch registered students from backend
    const res = await axios.get(
      `http://localhost:5000/api/calendar/${eventId}/registered-students`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.status === 200 && Array.isArray(res.data?.data)) {
      const students = res.data.data;

      // ✅ Update global state so dropdown also gets populated
      setRegisteredStudents(students);
      setSelectedEvent(eventId);

      // ✅ Show both modal + ready dropdown list
      setShowModal(true);

      // ✅ If the event is completed, pre-fill the dropdown immediately
      const selectedEvent = events.find((e) => e.id === eventId);
      if (selectedEvent?.status === "completed") {
        setSelectedStudentEmail(""); // reset previous email
      }
    } else {
      alert("No registered students found.");
    }
  } catch (err) {
    console.error("Error fetching registered students:", err.response || err);
    if (err.response?.status === 403)
      alert("Access denied. Only TPOs can view registered students.");
    else alert("Failed to load registered students");
  }
};



  const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const fetchCompletedEventStudents = async (eventId) => {
  try {
    const token = localStorage.getItem("userToken");
    const res = await axios.get(
      `http://localhost:5000/api/calendar/${eventId}/registered-students`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRegisteredStudents(res.data.data || []);
  } catch (err) {
    console.error("Error fetching completed event students:", err);
  }
};

const handleSelectStudent = async (eventId) => {
  if (!selectedStudentEmail) return alert("Select a student first");
  if (mailSent) return alert("Mail & notification already sent!");

  try {
    const token = localStorage.getItem("userToken");
    
    // ✅ Debug: Log what we're sending
    console.log("🔍 Selecting student:", {
      eventId,
      studentEmail: selectedStudentEmail,
      hasToken: !!token
    });
    
    const res = await axios.put(
      `http://localhost:5000/api/calendar/${eventId}/select-student`,
      { studentEmail: selectedStudentEmail },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      alert("✅ Student marked and mail sent!");
      setMailSent(true);
      fetchEvents(); // ✅ refresh list
      setShowSelectModal(false); // ✅ close modal
    } else {
      alert(res.data.message);
    }
  } catch (err) {
    console.error("❌ Error selecting student:", err);
    console.error("❌ Error response:", err.response?.data);
    alert(err.response?.data?.message || "Failed to mark student as selected");
  }
};


  // Fetch all events
const fetchEvents = async () => {
  setLoading(true);
  try {
    const res = await axios.get("http://localhost:5000/api/calendar", {
      headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
    });
    const data = res.data?.data || [];

    // Separate deleted and active events
    const deletedEvents = data.filter(
      (e) => e.status === "cancelled" || e.status === "deleted"
    );
    const activeEvents = data.filter((e) => e.status !== "deleted");

    // Map & compute active events
    const mappedEvents = activeEvents.map((e) => {
      let computedStatus = e.status || "scheduled";

      const startDate = normalizeDate(e.startDate);
      const today = normalizeDate(new Date());
      const end = normalizeDate(e.endDate);

      if (end < today) computedStatus = "completed";
      else if (startDate <= today && today <= end) computedStatus = "ongoing";
      else computedStatus = "scheduled";

      return {
        id: e._id,
        title: e.title || "",
        description: e.description || "",
        startDate: e.startDate || "",
        endDate: e.endDate || "",
        startTime: e.startTime || "",
        endTime: e.endTime || "",
        venue: e.venue || "",
        isOnline: e.isOnline || false,
        company: e.companyDetails?.companyName || "",
        companyFormLink: e.companyDetails?.companyFormLink || "",
        targetGroup: e.targetGroup || "both",
        eventType: e.eventType || "",
        status: computedStatus,
        date: e.startDate?.split("T")[0] || "",
        participated: e.eventSummary?.totalAttendees || "",
        placed: e.eventSummary?.selectedStudents || "",
        externalLink: e.companyDetails?.externalLink || "",
      };
    });

    // ✅ Update state and handle deleted events
    setEvents(mappedEvents);
    setDeletedEvents(deletedEvents);
    autoSelectOngoingDate(mappedEvents);
  } catch (err) {
    console.error("Error fetching events:", err);
  }
  setLoading(false);
};



  // Calendar navigation
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const handlePrevMonth = () => setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  const handleYearClick = () => setShowYearPicker(!showYearPicker);
  const handleYearSelect = (year) => {
    setSelectedDate(new Date(year, currentMonth, 1));
    setShowYearPicker(false);
  };

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };
  const days = getDaysInMonth(currentYear, currentMonth);

const getEventsForDate = (date) => {
  return events.filter((e) => {
    const eventDate = parseLocalDate(e.startDate);
    return (
      eventDate.getFullYear() === date.getFullYear() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getDate() === date.getDate()
    );
  });
};

const fetchRegisteredStudents = async (eventId) => {
  try {
    const token = localStorage.getItem("userToken");
    const res = await axios.get(
      `http://localhost:5000/api/calendar/${eventId}/registered-students`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRegisteredStudents(res.data.students || []);
  } catch (err) {
    console.error("Error fetching students:", err);
    setRegisteredStudents([]);
  }
};


// safe date click handler — prevents crash and only opens form if no event exists for that date
// ✅ Updated Date Click Handler
const handleDateClick = (day) => {
  const formattedDate = day.toDateString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  setSelectedDate(day);
  setSelectedDateLabel(day.toDateString());

  // Get events for the clicked day
  const eventsForDay = events.filter(
    (e) => new Date(e.startDate).toDateString() === formattedDate
  );

  setSelectedDateEvents(eventsForDay);

  // If there are events for the day → show them
  if (eventsForDay.length > 0) {
    setShowForm(false);
    setSelectedEventId(eventsForDay[0]?._id || null);
    return;
  }

  // If there are NO events:
  const isPast = day < today; // completed date
  if (isPast) {
    alert("⚠️ Cannot add a new event on a completed date.");
    setShowForm(false);
    return;
  }

  // If it's ongoing or future date → open form
  setFormData({
    id: "",
    title: "",
    description: "",
    startDate: day.toLocaleDateString("en-CA"),
    endDate: day.toLocaleDateString("en-CA"),
    startTime: "",
    endTime: "",
    venue: "",
    isOnline: false,
    companyName: "",
    companyFormLink: "",
    eventType: "",
    status: "scheduled",
    participated: "",
    placed: "",
    companyDetails: {
      externalLink: "",
    },
  });

  setViewOnly(false);
  setShowForm(true);
};




  // Edit event
  // Edit event
// ✏️ Edit Event - open full form prefilled
const handleEditEvent = async (event) => {
  if (event.status === "completed" || event.status === "cancelled") return;

  try {
    const token = localStorage.getItem("userToken");
    const response = await axios.get(
      `http://localhost:5000/api/calendar/${event.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const e = response.data.data || response.data; // adjust if API returns {data:{data:...}}

    // ✅ Prefill form with event data
    setFormData({
      id: e._id,
      title: e.title || "",
      description: e.description || "",
      startDate: e.startDate
        ? new Date(e.startDate).toISOString().split("T")[0]
        : "",
      endDate: e.endDate
        ? new Date(e.endDate).toISOString().split("T")[0]
        : "",
      startTime: e.startTime || "",
      endTime: e.endTime || "",
      venue: e.venue || "",
      isOnline: e.isOnline || false,
      companyName: e.companyDetails?.companyName || "",
      companyFormLink: e.companyDetails?.companyFormLink || "",
      eventType: e.eventType || "",
      status: e.status || "scheduled",
      participated: e.eventSummary?.totalAttendees || "",
      placed: e.eventSummary?.selectedStudents || "",
      companyDetails: {
        externalLink:
          e.companyDetails?.externalLink ||
          e.externalLink ||
          "",
      },
    });

    // ✅ Set target group if available
    setTargetGroup(e.targetGroup || "both");

    // ✅ Show form modal in edit mode
    setViewOnly(false);
    setShowForm(true);
  } catch (error) {
    console.error("Error loading event for edit:", error);
    alert("Failed to load event details for editing");
  }
};


  // Cancel & delete event
// ✅ Cancel & Delete Event (fixed)
const handleCancelDeleteEvent = async (eventId) => {
  if (!window.confirm("Are you sure you want to cancel and delete this event?")) return;

  try {
    // 1️⃣ Mark as cancelled first
    await axios.put(
      `http://localhost:5000/api/calendar/${eventId}`,
      { status: "cancelled" },
      { headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` } }
    );

    // Update UI instantly
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "cancelled" } : e))
    );
    setSelectedDateEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "cancelled" } : e))
    );

    alert("Event cancelled! It will be deleted shortly.");

    // 2️⃣ Actually delete after short delay
    setTimeout(async () => {
      await axios.delete(`http://localhost:5000/api/calendar/${eventId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      });

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSelectedDateEvents((prev) => prev.filter((e) => e.id !== eventId));
      fetchEvents(); // ✅ Refresh from backend to stay consistent
    }, 1500);
  } catch (err) {
    console.error("❌ Error cancelling/deleting event:", err);
    alert(err.response?.data?.message || "Failed to cancel & delete event");
  }
};


  // New event
// New event
const handleNewEvent = () => {
  const today = new Date();
  const isPast =
    selectedDate < today &&
    !(selectedDate.toDateString() === today.toDateString());

  const allCompleted =
    selectedDateEvents.length > 0 &&
    selectedDateEvents.every((e) => e.status === "completed");

  if (isPast || allCompleted) {
    alert("You cannot add a new event on a completed date.");
    setShowForm(false);
    return;
  }

  // ✅ Reset everything cleanly before opening the form
  setFormData({
    id: "",
    title: "",
    description: "",
    startDate: selectedDate.toLocaleDateString("en-CA"),
    endDate: selectedDate.toLocaleDateString("en-CA"),
    startTime: "",
    endTime: "",
    venue: "",
    isOnline: false,
    companyName: "",
    companyFormLink: "https://companyform.com",
    eventType: "",
    status: "scheduled",
    participated: "",
    placed: "",
companyDetails: {                            // ✅ fixed
    externalLink: event.companyDetails?.externalLink || event.externalLink || ""
  }
  });

  setViewOnly(false);
  setShowForm(true);
};


  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

  if (isSubmitting) return; // 🛑 Prevent multiple rapid submissions
  setIsSubmitting(true);
    if (!tpoId) return alert("TPO ID is missing");

    // Always include event summary for completed events
    const payload = {
  ...formData,
targetGroup,
  companyDetails: {
    companyName: formData.companyName,
    companyFormLink: formData.companyFormLink,
    externalLink: formData.companyDetails?.externalLink || "", // ✅ moved inside companyDetails
  },
  createdBy: tpoId,
  createdByModel: "TPO",
  eventSummary: {
    totalAttendees: formData.status === "completed" ? parseInt(formData.participated) || 0 : 0,
    selectedStudents: formData.status === "completed" ? parseInt(formData.placed) || 0 : 0
  }
};


    try {
  let response;
  if (formData.id) {
    response = await axios.put(
      `http://localhost:5000/api/calendar/${formData.id}`,
      payload,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      }
    );
  } else {
    response = await axios.post(
      "http://localhost:5000/api/calendar",
      payload,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      }
    );
  }

  // ✅ Log External Link Confirmation
  const savedLink =
    response.data?.data?.companyDetails?.externalLink ||
    payload.companyDetails?.externalLink ||
    "";
  if (savedLink) {
    console.log(`✅ External link stored successfully: ${savedLink}`);
  } else {
    console.warn("⚠️ External link not found in saved event data.");
  }

  setShowForm(false);
} catch (err) {
  console.error("Error saving event:", err.response?.data || err.message);
  alert(err.response?.data?.message || "Failed to save event");
}
  }
// 🔹 Remove duplicates by Roll Number or Email
const uniqueStudents = registeredStudents.filter(
  (student, index, self) =>
    index ===
    self.findIndex(
      (s) => s.rollNo === student.rollNo || s.email === student.email
    )
);

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="text-purple-600 h-7 w-7" />
          <h1 className="text-2xl font-bold text-gray-800">Placement Calendar</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchEvents} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Month + Year Controls */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 bg-white border rounded-full hover:bg-purple-100"><ChevronLeft /></button>
        <div onClick={handleYearClick} className="cursor-pointer text-lg font-semibold text-gray-800 hover:text-purple-600 transition-all">
          {selectedDate.toLocaleString("default", { month: "long" })} {currentYear}
        </div>
        <button onClick={handleNextMonth} className="p-2 bg-white border rounded-full hover:bg-purple-100"><ChevronRight /></button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <p className="text-center text-gray-500">Loading events...</p>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600">{day}</div>
          ))}

          {days.map((day) => {
  const dateEvents = getEventsForDate(day);
  const today = normalizeDate(new Date());
  const dayNormalized = normalizeDate(day);

  return (
    <div
      key={day}
      onClick={() => handleDateClick(dayNormalized)} // always pass normalized date
      className={`border rounded-xl p-3 cursor-pointer flex flex-col transition-all ${
        selectedDate.toDateString() === dayNormalized.toDateString()
          ? "bg-purple-100 border-purple-500 shadow-md"
          : "bg-white hover:shadow-md"
      }`}
    >
      <span className="text-sm font-medium text-gray-700 mb-2">{day.getDate()}</span>
{dateEvents.length > 0 ? (
  <div className="flex flex-wrap gap-1 mt-1">
    {dateEvents.map((ev) => (
      <span
        key={ev.id}
        className={`inline-block w-3 h-3 rounded-full ${
  ev.status === "completed"
    ? "bg-green-500"
    : ev.status === "ongoing"
    ? "bg-orange-500"
    : ev.status === "cancelled"
    ? "bg-red-500"
    : "bg-purple-500"   // upcoming / scheduled
}`}

        title={`${ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}`}
      ></span>
    ))}
  </div>
) : (
  <span className="text-xs text-gray-400 mt-auto">No Events</span>
)}

    </div>
  );
})}

        </div>
      )}

      {/* Selected Date Event Details */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
{selectedDateLabel && (
  <h2 className="text-xl font-bold text-purple-700 mt-6 mb-2">
    {selectedDateLabel}
  </h2>
)}

        <div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold text-purple-700">
    Events on {selectedDate.toDateString()}
  </h2>
  <div className="flex gap-3">
    <button
  onClick={() => setShowDeletedModal(true)}
  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg border border-red-300 hover:bg-red-200 transition-all"
>
  🗑 Deleted Events
</button>

    <button
      onClick={handleNewEvent}
      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all"
    >
      + New Event
    </button>
  </div>
</div>

        {selectedDateEvents.length > 0 ? (
  <div className="grid gap-4">
    {selectedDateEvents?.filter(Boolean).map((event) => (
<div
  key={event.id}
  onClick={(e) => {
    e.stopPropagation(); // prevent bubbling
    // 🚫 Stop form from opening when event card clicked
    setHighlightedEventId(event.id); // still highlight the card
    console.log("Event card clicked — form will not open.");
  }}
className={`border rounded-lg p-4 transition-all cursor-pointer ${
  event.status === "completed"
    ? "bg-green-50 border-green-400"
    : event.status === "ongoing"
    ? "bg-orange-50 border-orange-400"
    : event.status === "cancelled"
    ? "bg-red-50 border-red-400"
    : "bg-white"
}`}

>

        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 text-lg">
            {event.status === "completed" ? "✅ " : ""}
            {event.title}
          </h3>
          <span
            className={`text-sm font-medium ${
              event?.status === "completed"
                ? "text-green-700"
                : event.status === "cancelled"
                ? "text-red-700"
                : "text-purple-700"
            }`}
          >
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>
        </div>

        {event.company && (
          <p className="text-sm text-gray-600 mt-1">
            <strong>Company:</strong>{" "}
            {event.companyFormLink ? (
              <a
                href={event.companyFormLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline cursor-pointer"
              >
                {event.company}
              </a>
            ) : (
              <span className="text-gray-700">{event.company}</span>
            )}
          </p>
        )}



        {event.description && (
        <div className="text-sm text-gray-600 mt-1">
            <strong>Description:</strong> {event.description}
          </div>
        )}
{event.targetGroup && (
  <p className="text-sm text-purple-700 mt-1">
    🎯 <strong>Target Group:</strong>{" "}
    {event.targetGroup === "crt"
      ? "CRT Students Only"
      : event.targetGroup === "non-crt"
      ? "Non-CRT Students Only"
      : "Both CRT & Non-CRT"}
  </p>
)}

        {event.startTime && event.endTime && (
          <p className="text-sm text-gray-600 mt-1">
            <strong>Time:</strong> {event.startTime} - {event.endTime}
          </p>
        )}

        {/* Show participation stats for completed events */}
{event.status === "completed" && (
  <>
    <p className="text-sm text-green-600 mt-1">
      <strong>Participated:</strong> {parseInt(event.participated) > 0 ? `${event.participated} students` : "Click to update"}
    </p>
    <p className="text-sm text-green-600 mt-1">
      <strong>Placed:</strong> {parseInt(event.placed) > 0 ? `${event.placed} students` : "Click to update"}
    </p>
  </>
)}

        {/* Only show for ongoing or scheduled events */}
{/* ✅ Show "View Registered Students" for both completed and not completed events */}
{/* ✅ Show "View Registered Students" for both completed and not completed events */}
{event.status !== "cancelled" && (
  <div className="mt-3 flex flex-wrap items-center gap-3">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleViewRegisteredStudents(event.id);
      }}
      className={`px-4 py-2 rounded-lg text-white transition-all ${
        event?.status === "completed"
          ? "bg-green-600 hover:bg-green-700"
          : "bg-purple-600 hover:bg-purple-700"
      }`}
    >
      {event?.status === "completed"
        ? "View Registered Students (Completed)"
        : "View Registered Students"}
    </button>

    {/* ✅ Add Selected Students & Selected Students buttons — side by side */}
{event.status === "completed" && (
  <div className="flex flex-col gap-3 mt-3">
    <div className="flex gap-3 items-center">
      {/* ➕ Add Selected Students */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEventId(event.id);
          setShowSelectModal(true);
        }}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        ➕ Add Selected Students
      </button>

      {/* 🎯 View Selected Students */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleViewSelectedStudents(event.id); // Function to fetch and show modal
        }}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
      >
        🎯 Selected Students
      </button>
    </div>

    {/* 🎯 Selected Students Modal */}
    {showSelectedStudentsModal && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setShowSelectedStudentsModal(false)}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowSelectedStudentsModal(false)}
            className="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold"
          >
            ✕
          </button>

          <h2 className="text-xl font-bold text-indigo-700 mb-4">
            🎯 Selected Students ({selectedStudents.length})
          </h2>

          {selectedStudents.length === 0 ? (
            <p className="text-gray-500 text-center">No selected students found.</p>
          ) : (
            <div className="overflow-x-auto max-h-[60vh] border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-indigo-100 text-gray-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 border">Full Name</th>
                    <th className="px-3 py-2 border">Roll No</th>
                    <th className="px-3 py-2 border">Email</th>
                    <th className="px-3 py-2 border">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudents.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border">{s.name}</td>
                      <td className="px-3 py-2 border">{s.rollNo}</td>
                      <td className="px-3 py-2 border">{s.email}</td>
                      <td className="px-3 py-2 border">{s.branch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
)}


  </div>
)}


{/* ✏️ Edit Event — only for not completed/cancelled */}
{/* ✏️ Edit + 🗑️ Cancel & Delete — aligned side by side */}
{/* ✏️ Edit + 🗑️ Cancel & Delete — aligned side by side */}
{event.status !== "completed" && (
  <div className="flex gap-3 mt-3 justify-start items-center">
    {event.status !== "cancelled" && (
      <>
        {event.isEditing ? (
          <div className="flex flex-col gap-2 w-full">
            {/* Editable fields */}
            <input
              type="text"
              value={event.editTitle ?? event.title}
              onChange={(e) =>
                setEvents((prev) =>
                  prev.map((ev) =>
                    ev.id === event.id
                      ? { ...ev, editTitle: e.target.value }
                      : ev
                  )
                )
              }
              className="border px-2 py-1 rounded w-full"
              placeholder="Edit event title"
            />
            <textarea
              value={event.editDescription ?? event.description}
              onChange={(e) =>
                setEvents((prev) =>
                  prev.map((ev) =>
                    ev.id === event.id
                      ? { ...ev, editDescription: e.target.value }
                      : ev
                  )
                )
              }
              className="border px-2 py-1 rounded w-full"
              placeholder="Edit description"
              rows={2}
            ></textarea>

            <div className="flex gap-2 mt-2">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const token = localStorage.getItem("userToken");
                    await axios.put(
                      `http://localhost:5000/api/calendar/${event.id}`,
                      {
                        title: event.editTitle || event.title,
                        description:
                          event.editDescription || event.description,
                      },
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );
                    alert("✅ Event updated successfully!");
                    fetchEvents(); // refresh backend data
                  } catch (err) {
                    console.error("Error updating event:", err);
                    alert("❌ Failed to update event");
                  } finally {
                    // turn off edit mode
                    setEvents((prev) =>
                      prev.map((ev) =>
                        ev.id === event.id
                          ? { ...ev, isEditing: false }
                          : ev
                      )
                    );
                  }
                }}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                💾 Save
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEvents((prev) =>
                    prev.map((ev) =>
                      ev.id === event.id
                        ? { ...ev, isEditing: false }
                        : ev
                    )
                  );
                }}
                className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                ✖ Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            {event.status !== "completed" && event.status !== "cancelled" && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      handleEditEvent(event); // ✅ Opens form
    }}
    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
  >
    ✏️ Edit
  </button>
)}


            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancelDeleteEvent(event.id);
              }}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              🗑️ Cancel & Delete
            </button>
          </div>
        )}
      </>
    )}
  </div>
)}

      </div>

    ))}
{/* ✅ Mark Selected Students for Completed Events */}


  </div>
) : (
  <div className="text-center text-gray-500">
    <p>No events on this date.</p>
  </div>
)}


      </div>


      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-fadeIn max-h-[90vh] overflow-y-auto p-6">
            <button onClick={() => setShowForm(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-5 text-gray-800 text-center">
              {formData.id ? "Edit Event" : "Add Placement Event"}
            </h2>
            <p className="text-center text-sm text-gray-500 mb-4">
  Selected Date: {selectedDate.toDateString()}
</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full border rounded-lg px-3 py-2" placeholder="Event Title" disabled={viewOnly}/>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Event Type</label>
                <select
  value={formData.eventType}
  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
  required
  className="w-full border rounded-lg px-3 py-2"
  disabled={viewOnly}

>
  <option value="">Select Type</option>
  <option value="Campus_Drive">Campus Drive</option>
  <option value="Test">Test</option>
</select>

              </div>
{/* 🔹 Target Group Dropdown */}
<div>
  <label className="block text-sm font-medium mb-1">
    Target Group
  </label>
  <select
    value={targetGroup}
    onChange={(e) => setTargetGroup(e.target.value)}
    className="w-full border rounded-lg px-3 py-2"
    disabled={viewOnly}
  >
    <option value="both">Both CRT & Non-CRT Students</option>
    <option value="crt">CRT Students Only</option>
    <option value="non-crt">Non-CRT Students Only</option>
  </select>
</div>

              {/* Status */}
              {/* Status */}
<div>
  <label className="block text-sm font-medium mb-1">Status</label>
  <input
    type="text"
    value={formData.status}
    disabled
    className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
  />
</div>

              {/* Participated Students (Only editable for completed events) */}
              {/* Number of Registered Students */}
<div>
  <label className="block text-sm font-medium mb-1 text-gray-700">
    No. of Registered Students
  </label>
<input
  type="number"
  value={formData.participated}
  onChange={(e) => setFormData({ ...formData, participated: e.target.value })}
  className="w-full border rounded-lg px-3 py-2 bg-white"
  disabled={formData.status !== "completed"} // editable only if event completed
  min="0"
  placeholder="Enter number of participants"
/>

</div>

{/* Number of Selected Students */}
<div>
  <label className="block text-sm font-medium mb-1 text-gray-700">
    No. of Selected Students
  </label>
  <input
    type="number"
    value={formData.placed}
    onChange={(e) => setFormData({ ...formData, placed: e.target.value })}
    className="w-full border rounded-lg px-3 py-2 bg-white"
    disabled={formData.status !== "completed"} // editable only if event completed
    min="0"
    placeholder="Enter number of selected students"
  />


</div>


              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2" placeholder="Short description" disabled={viewOnly}/>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Company Name" disabled={viewOnly}/>
              </div>

              {/* ✅ Company Form Link */}
              <div>
              <label className="block text-sm font-medium mb-1">Company Link</label>
<input
  type="url"
  value={formData.companyFormLink}
  onChange={(e) => setFormData({ ...formData, companyFormLink: e.target.value })}
  className="w-full border rounded-lg px-3 py-2"
  placeholder="https://company.com"
  disabled={viewOnly}
/>


              </div>


              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium mb-1">Venue / Mode</label>
                <input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Auditorium or Online" disabled={viewOnly}/>
              </div>
              {/* Company Website Link */}


{/* External Registration Link */}
{/* ✅ External Registration Link */}
<div className="mb-4">
  <label className="block text-sm font-medium mb-1 text-gray-700">
    External Link (Optional)
  </label>
  <input
    type="url"
    value={formData.companyDetails?.externalLink || ""}
    onChange={(e) =>
      setFormData({
        ...formData,
        companyDetails: {
          ...formData.companyDetails,
          externalLink: e.target.value,
        },
      })
    }
    placeholder="https://your-company-form.com"
    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-purple-300"
    disabled={viewOnly}
  />
</div>



              {/* Online Checkbox */}
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isOnline} onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })} disabled={viewOnly}/>
                <label>Is Online Event</label>
              </div>

              {/* Submit button */}
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-all mt-4">
                {formData.status === "completed" ? "Update Participation Details" : formData.id ? "Update Event" : "Create Event"}
              </button>
            </form>
          </div>
        </div>
      )}
{showRegistrations && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-5xl w-full max-h-[80vh] overflow-auto relative">
      <button
        className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
        onClick={() => setShowRegistrations(false)}
      >
        Close
      </button>
      <TPOEventRegistrations eventId={selectedEventId} />
    </div>
  </div>
)}





{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
      <button
        onClick={() => setShowModal(false)}
        className="absolute top-3 right-3 text-gray-600 hover:text-black"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold text-purple-700 mb-4">
        Registered Students ({uniqueStudents.length})
      </h2>

      {uniqueStudents.length === 0 ? (
        <p className="text-gray-500 text-center">No students registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border">
            <thead className="bg-purple-100 text-gray-800">
              <tr>
                <th className="px-3 py-2 border">Full Name</th>
                <th className="px-3 py-2 border">Roll No</th>
                <th className="px-3 py-2 border">Email</th>
                <th className="px-3 py-2 border">Phone</th>
                <th className="px-3 py-2 border">College</th>
                <th className="px-3 py-2 border">Branch</th>
                <th className="px-3 py-2 border">Gender</th>
                <th className="px-3 py-2 border">DOB</th>
                <th className="px-3 py-2 border">Current Location</th>
                <th className="px-3 py-2 border">Home Town</th>
                <th className="px-3 py-2 border">Backlogs</th>
                <th className="px-3 py-2 border">Tech Stack</th>
                <th className="px-3 py-2 border">Resume</th>

              </tr>
            </thead>
            <tbody>
              {uniqueStudents.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border">{r.name}</td>
                  <td className="px-3 py-2 border">{r.rollNo}</td>
                  <td className="px-3 py-2 border">{r.email}</td>
                  <td className="px-3 py-2 border">{r.phonenumber}</td>
                  <td className="px-3 py-2 border">{r.college}</td>
                  <td className="px-3 py-2 border">{r.branch}</td>
                  <td className="px-3 py-2 border">{r.gender}</td>
                  <td className="px-3 py-2 border">
                    {r.dob ? new Date(r.dob).toLocaleDateString() : ""}
                  </td>
                  <td className="px-3 py-2 border">{r.currentLocation}</td>
                  <td className="px-3 py-2 border">{r.hometown}</td>
                  <td className="px-3 py-2 border">{r.backlogs}</td>
                  <td className="px-3 py-2 border">
                    {Array.isArray(r.techStack)
                      ? r.techStack.join(", ")
                      : r.techStack}
                  </td>
                  <td className="px-3 py-2 border">
                    {r.resumeUrl ? (
                      <a
                        href={r.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
)}
{showDeletedModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative p-6 max-h-[80vh] overflow-y-auto">
      <button
        onClick={() => setShowDeletedModal(false)}
        className="absolute top-3 right-3 text-gray-600 hover:text-black"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold text-red-600 mb-4">
        🗑 Deleted Events ({deletedEvents.length})
      </h2>

      {deletedEvents.length === 0 ? (
        <p className="text-gray-500 text-center">No deleted events available.</p>
      ) : (
        <div className="space-y-4">
          {deletedEvents.map((event) => (
            <div
              key={event._id}
              className="border border-red-200 bg-red-50 p-4 rounded-lg"
            >
<h3 className="font-semibold text-gray-800 flex justify-between items-center">
  {event.title}
  <span
    className={`text-sm px-2 py-1 rounded ${
      event.status === "cancelled"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-600"
    }`}
  >
    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
  </span>
</h3>

              {event.description && (
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {new Date(event.startDate).toLocaleDateString()}{" "}
                {event.startTime && `(${event.startTime})`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{showSelectModal && (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    onClick={() => setShowSelectModal(false)} // close when clicking outside
  >
    <div
      className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative"
      onClick={(e) => e.stopPropagation()} // prevent modal close on inside click
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Mark Selected Students
      </h2>

      {/* 🔹 Email Search Field */}
      <input
        type="text"
        placeholder="Search student by email..."
        value={selectedStudentEmail}
        onChange={(e) => {
          setSelectedStudentEmail(e.target.value);
          if (e.target.value.length > 3) {
            fetchCompletedEventStudents(selectedEventId);
          }
        }}
        className="w-full border rounded-lg px-3 py-2 mb-3"
      />

      {/* 🔹 Registered Students Dropdown */}
      <select
        value={selectedStudentEmail}
        onChange={(e) => setSelectedStudentEmail(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-3"
      >
        <option value="">-- Select Registered Student --</option>
        {registeredStudents
          .filter((s) =>
            s.email.toLowerCase().includes(selectedStudentEmail.toLowerCase())
          )
          .map((s) => (
            <option key={s.email} value={s.email}>
              {s.name} ({s.rollNo}) - {s.branch}
            </option>
          ))}
      </select>

      {/* 🔹 Action Button */}
      <button
        onClick={() => handleSelectStudent(selectedEventId)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full"
      >
        ✅ Mark Selected & Notify
      </button>

      {/* OR Upload Section */}
      <div className="mt-6 flex flex-col items-start gap-3 border-t pt-4">
        <p className="text-gray-700 font-medium">OR Upload Selected List</p>

        <input
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          className="border p-2 rounded-md w-full cursor-pointer"
        />

        <button
          onClick={handleUploadSelectedList}
          disabled={!selectedFile || !selectedEventId}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 w-full"
        >
          Upload Selected List
        </button>
      </div>

      {/* ❌ Close Button */}
      <button
        onClick={() => setShowSelectModal(false)}
        className="absolute top-2 right-3 text-gray-600 hover:text-red-600 text-lg font-bold"
      >
        ✕
      </button>
    </div>
  </div>
)}



      {showStudentForm && (
      <CompanyRegistrationForm
        eventId={selectedEventId}
        onClose={() => setShowStudentForm(false)}
        tpoExternalLink={tpoExternalLink}
      />
    )}


    </div>
  );
};

export default PlacementCalendar;
