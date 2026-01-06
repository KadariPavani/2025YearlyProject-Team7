import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Plus, X } from "lucide-react";
import { LoadingSkeleton, ListSkeleton } from '../../components/ui/LoadingSkeletons';

import TPOEventRegistrations from "./TPOEventRegistrations";
// Parse date in local timezone without timezone shift
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return new Date(year, month - 1, day); // month is 0-indexed
};

const PlacementCalendar = () => {
  const [events, setEvents] = useState([]);
  // Start in loading state so the LoadingSkeleton is visible immediately on mount
  const [loading, setLoading] = useState(true);
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
const [selectedBatches, setSelectedBatches] = useState([]);
const [selectedStudentIds, setSelectedStudentIds] = useState([]);
const [availableBatches, setAvailableBatches] = useState([]);
const [availableStudents, setAvailableStudents] = useState([]);
const [studentSearchTerm, setStudentSearchTerm] = useState("");
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
// Which event has an open action menu (three dots)
const [openMenuId, setOpenMenuId] = useState(null);

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
  setSelectedEventId(eventId); // ensure modal has context for uploads/marking
  try {
    const token = localStorage.getItem("userToken");
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}/selected-students`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const students = res.data?.data || [];
    // Open modal even if there are no students so user can see 'no students' state
    setSelectedStudents(students);
    setShowSelectedStudentsModal(true);

    if (!students || students.length === 0) {
      // Inform the user but keep the modal open so they can upload or take action
      console.info("No selected students found for this event.");
    }
  } catch (err) {
    console.error("Error fetching selected students:", err);
    // Open the modal with empty list to allow retry/upload flow; still notify the user
    setSelectedStudents([]);
    setShowSelectedStudentsModal(true);
    alert("Failed to load selected students (network or server error). Please try again or upload a list.");
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
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventIdToUse}/upload-selected`,
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
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/profile`, {
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
    fetchBatchesAndStudents();
  }, []);

// Fetch batches and students for selection
const fetchBatchesAndStudents = async () => {
  try {
    const token = localStorage.getItem("userToken");
    
    // 1️⃣ Fetch ALL placement training batches assigned to this TPO
    const batchRes = await axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/placement-training-batches`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('📦 Full Batch Response:', JSON.stringify(batchRes.data, null, 2));
    
    // Parse the nested structure: year -> college -> techStack -> batches
    let allBatches = [];
    const allStudents = [];
    const studentIds = new Set(); // To avoid duplicates
    
    const response = batchRes.data;
    
    // Handle nested structure with years
    if (response.success && response.data && response.data.organized) {
      const yearData = response.data.organized;
      
      // Iterate through years (2021, 2026, etc.)
      Object.keys(yearData).forEach(year => {
        console.log(`📅 Processing Year: ${year}`);
        
        // Iterate through colleges
        Object.keys(yearData[year]).forEach(college => {
          console.log(`  🏫 Processing College: ${college}`);
          
          // Iterate through tech stacks
          Object.keys(yearData[year][college]).forEach(techStack => {
            const techData = yearData[year][college][techStack];
            console.log(`    💻 Processing TechStack: ${techStack}, Batches: ${techData.batches?.length || 0}`);
            
            if (Array.isArray(techData.batches)) {
              techData.batches.forEach(batch => {
                // Add batch to list
                allBatches.push(batch);
                
                // Extract students from this batch
                if (Array.isArray(batch.students)) {
                  console.log(`      👥 Batch ${batch.batchNumber}: ${batch.students.length} students`);
                  batch.students.forEach(student => {
                    if (student && student._id && !studentIds.has(student._id)) {
                      studentIds.add(student._id);
                      allStudents.push({
                        _id: student._id,
                        name: student.name,
                        rollNo: student.rollNo || student.rollNumber,
                        email: student.email,
                        college: student.college,
                        branch: student.branch,
                        batchName: batch.batchNumber,
                        batchType: batch.techStack
                      });
                    }
                  });
                }
              });
            }
          });
        });
      });
    }
    
    console.log('✅ Extracted Batches Count:', allBatches.length);
    console.log('✅ Extracted Students Count:', allStudents.length);
    
    setAvailableBatches(allBatches);
    setAvailableStudents(allStudents);
    
  } catch (err) {
    console.error("❌ Error fetching batches/students:", err.response?.data || err.message);
    alert("Failed to load batches/students. Check console for details.");
    setAvailableBatches([]);
    setAvailableStudents([]);
  }
};
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
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${selectedEventId}/select-student`,
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
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}/registered-students`,
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
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}/registered-students`,
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
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}/select-student`,
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
    const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar`, {
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

  // Build fixed 6-row (42-cell) calendar grid so the calendar stays square and consistent
  const buildCalendarCells = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    // leading empty cells
    for (let i = 0; i < startDay; i++) cells.push(null);
    // actual month days
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    // trailing empty cells to fill 42
    while (cells.length < 42) cells.push(null);

    return cells;
  };

  const calendarCells = buildCalendarCells(currentYear, currentMonth);

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
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}/registered-students`,
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
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${event.id}`,
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

    // ✅ Set batch and student selections if available
    setSelectedBatches(e.targetBatchIds || []);
    setSelectedStudentIds(e.targetStudentIds || []);

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
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}`,
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
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}`, {
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

  setTargetGroup("both");
  setSelectedBatches([]);
  setSelectedStudentIds([]);
  setStudentSearchTerm("");
  setViewOnly(false);
  setShowForm(true);
};

// Batch selection handlers
const handleBatchToggle = (batchId) => {
  setSelectedBatches(prev => 
    prev.includes(batchId) 
      ? prev.filter(id => id !== batchId)
      : [...prev, batchId]
  );
};

// Student selection handlers
const handleStudentToggle = (studentId) => {
  setSelectedStudentIds(prev =>
    prev.includes(studentId)
      ? prev.filter(id => id !== studentId)
      : [...prev, studentId]
  );
};

const filteredStudents = availableStudents.filter(student =>
  student.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
  student.rollNo?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
  student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
);


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
targetBatchIds: selectedBatches,
targetStudentIds: selectedStudentIds,
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
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${formData.id}`,
      payload,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      }
    );
  } else {
    response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar`,
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

  await fetchEvents(); // ✅ Refresh events list
  setShowForm(false);
} catch (err) {
  console.error("Error saving event:", err.response?.data || err.message);
  alert(err.response?.data?.message || "Failed to save event");
} finally {
  setIsSubmitting(false);
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

  const ordinal = (n) => {
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return `${n}st`;
    if (j === 2 && k !== 12) return `${n}nd`;
    if (j === 3 && k !== 13) return `${n}rd`;
    return `${n}th`;
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-2 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="text-blue-600 h-7 w-7" />
          <h1 className="text-xl font-bold text-gray-800">Placement Calendar</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchEvents} className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-sm">
            <RefreshCw className="h-4 w-4" /> <span className="hidden sm:inline">Refresh</span>
          </button>

          <button onClick={handleNewEvent} className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Event</span>
          </button>

          <button onClick={() => setShowDeletedModal(true)} className="flex items-center gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-red-100 text-red-700 rounded-xl border border-red-300 hover:bg-red-200 transition-all text-sm">
            <span className="text-base">🗑</span> <span className="hidden sm:inline">Deleted</span>
          </button>

        </div>
      </div>



      {/* Calendar Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Left: calendar (40%) */}
            <div className="w-full sm:w-2/5">
              {/* Month + Year Controls (centered above calendar column) */}
              <div className="flex justify-center items-center mb-3">
                <button onClick={handlePrevMonth} className="p-2 bg-white border rounded-full hover:bg-blue-100"><ChevronLeft /></button>
                <div onClick={handleYearClick} className="mx-3 cursor-pointer text-base font-semibold text-gray-800 hover:text-blue-600 transition-all">
                  {selectedDate.toLocaleString("default", { month: "long" })} {currentYear}
                </div>
                <button onClick={handleNextMonth} className="p-2 bg-white border rounded-full hover:bg-blue-100"><ChevronRight /></button>
              </div>

              {/* Weekday headings (now visible on mobile as compact labels) */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-blue-800 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-[10px] bg-blue-50 rounded-sm py-0.5">{day}</div>
            ))}
          </div>

          {/* Responsive calendar grid: always visible and square cells that fit the container (no horizontal scroll) */}
          <div className="w-full bg-gradient-to-b from-blue-50 to-white rounded-md border border-blue-100 shadow-sm p-1">
            <div className="w-full grid grid-rows-6 grid-cols-7 gap-0.5">
              {calendarCells.map((cellDate, idx) => {
                if (!cellDate) return <div key={idx} className="bg-white border border-blue-100 rounded-sm aspect-square"></div>; 

                const dateEvents = getEventsForDate(cellDate);
                const dayNormalized = normalizeDate(cellDate);
                const isSelected = selectedDate.toDateString() === dayNormalized.toDateString();
                const isToday = normalizeDate(new Date()).getTime() === dayNormalized.getTime();

                return (
                  <div
                    key={idx}
                    onClick={() => handleDateClick(dayNormalized)}
                    className={`aspect-square min-h-0 overflow-hidden border border-blue-100 rounded-sm sm:rounded-md p-0.5 sm:p-0.5 cursor-pointer flex flex-col transition-all ${isSelected ? "bg-blue-200 border-blue-600 shadow-md" : "bg-white shadow-sm hover:shadow-md hover:bg-blue-50"} ${isToday ? "ring-2 ring-blue-200" : ""}`}>

                    <div className="flex items-start justify-between px-1">
                      <span className="text-[10px] sm:text-sm font-medium text-gray-600">{cellDate.getDate()}</span>
                    </div>

                    <div className="flex-1 mt-0 sm:mt-1 overflow-hidden px-1 flex flex-col justify-between h-full">
                      {/* Mobile: show dots only (smaller) */}
                      <div className="sm:hidden flex items-center justify-start gap-1 mt-0.5">
                        <div className="flex items-start justify-start gap-0.5">
                          {dateEvents.slice(0, 3).map((ev, i) => (
                            <span key={i} className={`inline-block flex-shrink-0 w-1 h-1 rounded-full shadow-sm ${ev.status === "completed" ? "bg-green-500" : ev.status === "ongoing" ? "bg-orange-500" : ev.status === "cancelled" ? "bg-red-500" : "bg-blue-600"}`} />
                          ))}
                        </div>
                      </div>

                      <div className="hidden sm:flex sm:flex-col sm:gap-1">
                        {dateEvents.slice(0, 1).map((ev) => (
                          <div
                            key={ev.id}
                            className={`text-[10px] rounded px-1 py-0.5 ${
                              ev.status === "completed"
                                ? "bg-green-50 text-green-700"
                                : ev.status === "ongoing"
                                ? "bg-orange-50 text-orange-700"
                                : ev.status === "cancelled"
                                ? "bg-red-50 text-red-700"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="inline-block truncate min-w-0" title={ev.title}>{ev.title}</span>
                              {dateEvents.length > 1 && (
                                <span className="hidden sm:inline text-[9px] text-gray-500 flex-shrink-0">+{Math.max(0, dateEvents.length - 1)}</span>
                              )}
                            </div>
                          </div>
                        ))}

                        {dateEvents.length > 1 && (
                          <div className="mt-1">
                            <span className="hidden sm:inline text-[8px] text-gray-500">+{Math.max(0, dateEvents.length - 1)} more</span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            </div>
            <aside className="hidden sm:block w-full sm:w-3/5 sticky top-20 self-start">
              <div className="p-4 w-full border-l border-blue-50 pl-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-blue-500 font-medium">{selectedDateLabel ? 'Events on' : ''}</div>
                    <div className="text-2xl font-bold text-blue-800">{selectedDate.toLocaleString('default', { weekday: 'long' })}, <span className="text-blue-600">{ordinal(selectedDate.getDate())}</span></div>
                  </div>
                </div>

                <div className="h-px bg-blue-50 mb-2" />

                {/* Show loading skeleton when events are still loading */}
                {loading ? (
                  <ListSkeleton />
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {selectedDateEvents.length > 0 ? (
                      selectedDateEvents.map((event) => (
                        <li key={event.id} className="flex items-center justify-between py-3 relative">
                          <div className="flex items-start gap-3">
                            <div className={`w-1 h-8 rounded ${event.status === 'completed' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-orange-500' : event.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-600'}`} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{event.title}</div>
                              <div className="text-xs text-gray-500">{event.startTime}{event.endTime ? ` • ${event.endTime}` : ''}</div>

                              {/* Extra details shown inline under the title */}
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {event.company && (<span className="block"><strong>Company:</strong> {event.company}</span>)}
                                {event.description && (<span className="block truncate"><strong>Description:</strong> {event.description}</span>)}
                              </div>

                              <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                <span><strong>Registered:</strong> {event.participated ?? 0}</span>
                                <span><strong>Selected:</strong> {event.placed ?? 0}</span>
                                <span><strong>Venue:</strong> {event.venue || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Only the kebab shows; actions are in the menu */}
                            <button title="More" onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId === event.id ? null : event.id);}} className="p-2 rounded-md hover:bg-gray-100 text-gray-600">⋮</button>

                            {/* Action menu */}
                            {openMenuId === event.id && (
                              <div className="absolute right-4 top-8 z-50 bg-white border rounded shadow-md w-44">
                                <ul>
                                  <li>
                                    <button onClick={(e)=>{e.stopPropagation(); handleViewRegisteredStudents(event.id); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">View Registered Students</button>
                                  </li>

                                  <li>
                                    {event.status === 'completed' ? (
                                      <button onClick={(e)=>{e.stopPropagation(); setSelectedEventId(event.id); setShowSelectModal(true); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">➕ Add Selected Students</button>
                                    ) : (
                                      <div className="w-full text-left px-3 py-2 text-sm text-gray-400">➕ Add Selected Students (only after completion)</div>
                                    )}
                                  </li>

                                  <li>
                                    <button onClick={(e)=>{e.stopPropagation(); handleViewSelectedStudents(event.id); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">View Selected Students</button>
                                  </li>

                                  <li>
                                    {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'completed' && event.status !== 'cancelled' ? (
                                      <button onClick={(e)=>{e.stopPropagation(); handleEditEvent(event); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Edit Event</button>
                                    ) : (
                                      <div className="w-full text-left px-3 py-2 text-sm text-gray-400">Edit (not available for past events)</div>
                                    )}
                                  </li>

                                  <li>
                                    {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'cancelled' ? (
                                      <button onClick={(e)=>{e.stopPropagation(); handleCancelDeleteEvent(event.id); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50">Cancel & Delete</button>
                                    ) : (
                                      <div className="w-full text-left px-3 py-2 text-sm text-gray-400">Cancel & Delete (not available for past events)</div>
                                    )}
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </li>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-3">No events for this date.</div>
                    )}
                  </ul>
                )}


              </div>
            </aside>
        </div>
      </div>
      )}

      {/* Selected Date Event Details (mobile only) */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-3 w-full max-w-[560px] mx-auto border border-blue-100 block sm:hidden">
        {loading ? (
          <ListSkeleton />
        ) : (
          <>
            <div className="mb-3 text-center">
              <div className="text-2xl font-bold text-blue-800">{selectedDate.toLocaleString('default', { weekday: 'long' })}, <span className="text-blue-600">{ordinal(selectedDate.getDate())}</span></div>
            </div>

            <ul className="divide-y divide-gray-100">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between py-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-1 h-8 rounded ${event.status === 'completed' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-orange-500' : event.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-600'}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{event.title}</div>
                        <div className="text-xs text-gray-500">{event.startTime}{event.endTime ? ` • ${event.endTime}` : ''}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button title="More" onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId === event.id ? null : event.id);}} className="p-2 rounded-md hover:bg-gray-100 text-gray-600">⋮</button>

                      {openMenuId === event.id && (
                        <>
                          {/* Desktop: inline absolute menu */}
                          <div className="hidden sm:block absolute left-3 top-12 z-50 bg-white border rounded shadow-md w-44">
                            <ul>
                              <li>
                                <button onClick={(e)=>{e.stopPropagation(); handleViewRegisteredStudents(event.id); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">View Registered Students</button>
                              </li>

                              <li>
                                {event.status === 'completed' ? (
                                  <button onClick={(e)=>{e.stopPropagation(); setSelectedEventId(event.id); setShowSelectModal(true); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">➕ Add Selected Students</button>
                                ) : (
                                  <div className="w-full text-left px-3 py-2 text-sm text-gray-400">➕ Add Selected Students (only after completion)</div>
                                )}
                              </li>

                              <li>
                                <button onClick={(e)=>{e.stopPropagation(); handleViewSelectedStudents(event.id); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">View Selected Students</button>
                              </li>

                              <li>
                                {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'completed' && event.status !== 'cancelled' ? (
                                  <button onClick={(e)=>{e.stopPropagation(); handleEditEvent(event); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Edit Event</button>
                                ) : (
                                  <div className="w-full text-left px-3 py-2 text-sm text-gray-400">Edit (not available for past events)</div>
                                )}
                              </li>

                              <li>
                                {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'cancelled' ? (
                                  <button onClick={(e)=>{e.stopPropagation(); handleCancelDeleteEvent(event.id); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50">Cancel & Delete</button>
                                ) : (
                                  <div className="w-full text-left px-3 py-2 text-sm text-gray-400">Cancel & Delete (not available for past events)</div>
                                )}
                              </li>
                            </ul>
                          </div>

                          {/* Mobile: centered modal (matches other mobile modals) */}
                          <div className="block sm:hidden fixed inset-0 z-50 grid place-items-center bg-black/50" onClick={() => setOpenMenuId(null)}>
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-4 mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={`menu-title-${event.id}`}>
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div id={`menu-title-${event.id}`} className="text-sm font-semibold truncate" title={event.title}>{event.title}</div>
                                  <div className="text-xs text-gray-500">{event.startDate ? new Date(event.startDate).toLocaleDateString() : ''}{event.startTime ? ` • ${event.startTime}` : ''}</div>
                                </div>
                                <button onClick={() => setOpenMenuId(null)} aria-label="Close" className="p-1 text-gray-600">✕</button>
                              </div>

                              <ul className="space-y-2">
                                <li>
                                  <button onClick={() => { handleViewRegisteredStudents(event.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100">View Registered Students</button>
                                </li>
                                <li>
                                  {event.status === 'completed' ? (
                                    <button onClick={() => { setSelectedEventId(event.id); setShowSelectModal(true); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100">➕ Add Selected Students</button>
                                  ) : (
                                    <div className="w-full text-left px-4 py-3 text-sm text-gray-400 rounded-lg">➕ Add Selected Students (only after completion)</div>
                                  )}
                                </li>
                                <li>
                                  <button onClick={() => { handleViewSelectedStudents(event.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100">View Selected Students</button>
                                </li>
                                <li>
                                  {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'completed' && event.status !== 'cancelled' ? (
                                    <button onClick={() => { handleEditEvent(event); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100">Edit Event</button>
                                  ) : (
                                    <div className="w-full text-left px-4 py-3 text-sm text-gray-400 rounded-lg">Edit (not available for past events)</div>
                                  )}
                                </li>
                                <li>
                                  {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'cancelled' ? (
                                    <button onClick={() => { handleCancelDeleteEvent(event.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Cancel & Delete</button>
                                  ) : (
                                    <div className="w-full text-left px-4 py-3 text-sm text-gray-400 rounded-lg">Cancel & Delete (not available for past events)</div>
                                  )}
                                </li>
                              </ul>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-sm text-gray-500">No events for this date.</div>
              )}
            </ul>
          </>
        )}
      </div>


      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50" onClick={() => setShowForm(false)}>
          {/* Desktop anchored form on right */}
          <div className="hidden sm:block fixed top-20 right-6 bottom-6 w-[44%] max-w-lg bg-white rounded-2xl shadow-2xl p-6 overflow-auto" onClick={(e)=>e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-5 text-gray-800">{formData.id ? "Edit Event" : "Add Placement Event"}</h2>
            <p className="text-sm text-gray-500 mb-4">Selected Date: {selectedDate.toDateString()}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full border rounded-lg px-3 py-2" placeholder="Event Title" disabled={viewOnly}/>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Event Type</label>
                <select value={formData.eventType} onChange={(e) => setFormData({ ...formData, eventType: e.target.value })} required className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}>
                  <option value="">Select Type</option>
                  <option value="Campus_Drive">Campus Drive</option>
                  <option value="Test">Test</option>
                </select>
              </div>

              {/* Target Group Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">Target Group</label>
                <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}>
                  <option value="both">Both CRT & Non-CRT Students</option>
                  <option value="crt">CRT Students Only</option>
                  <option value="non-crt">Non-CRT Students Only</option>
                  <option value="batch-specific">Batch Specific</option>
                  <option value="specific-students">Specific Students</option>
                </select>
              </div>

              {/* Batch Selection with Checkboxes - Show only when batch-specific */}
              {targetGroup === 'batch-specific' && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Batches (Optional)</label>
                <div className="text-xs text-blue-600 mb-1">Debug: {availableBatches.length} batches loaded</div>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                  {!Array.isArray(availableBatches) || availableBatches.length === 0 ? (
                    <p className="text-sm text-gray-500">No batches available</p>
                  ) : (
                    <div className="space-y-2">
                      {availableBatches.map(batch => (
                        <label key={batch._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedBatches.includes(batch._id)}
                            onChange={() => handleBatchToggle(batch._id)}
                            disabled={viewOnly}
                            className="w-4 h-4"
                          />
                          <span>{batch.batchNumber} - {batch.techStack} ({batch.students?.length || 0} students)</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedBatches.length > 0 ? `${selectedBatches.length} batch(es) selected` : 'Leave empty to target all students by group'}
                </p>
              </div>
              )}

              {/* Student Selection with Search and Checkboxes - Show only when specific-students */}
              {targetGroup === 'specific-students' && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Specific Students (Optional)</label>
                <div className="text-xs text-blue-600 mb-1">Debug: {availableStudents.length} total students | {filteredStudents.length} filtered</div>
                <input
                  type="text"
                  placeholder="Search by name, roll no, or email..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  disabled={viewOnly}
                  className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
                />
                <div className="border rounded-lg p-3 max-h-64 overflow-y-auto bg-gray-50">
                  {!Array.isArray(filteredStudents) || filteredStudents.length === 0 ? (
                    <p className="text-sm text-gray-500">No students found</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredStudents.map(student => (
                        <label key={student._id} className="flex items-start gap-2 text-xs cursor-pointer hover:bg-gray-100 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => handleStudentToggle(student._id)}
                            disabled={viewOnly}
                            className="w-4 h-4 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-gray-600">{student.rollNo} • {student.email}</div>
                            <div className="text-gray-500">{student.batchName}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} student(s) selected` : 'Leave empty for batch/group-based targeting'}
                </p>
              </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <input type="text" value={formData.status} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700" />
              </div>

              {/* Participated & Selected counts */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">No. of Registered Students</label>
                <input type="number" value={formData.participated} onChange={(e) => setFormData({ ...formData, participated: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white" disabled={formData.status !== "completed"} min="0" placeholder="Enter number of participants" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">No. of Selected Students</label>
                <input type="number" value={formData.placed} onChange={(e) => setFormData({ ...formData, placed: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white" disabled={formData.status !== "completed"} min="0" placeholder="Enter number of selected students" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2" placeholder="Short description" disabled={viewOnly}/>
              </div>

              {/* Company Name & Link */}
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Company Name" disabled={viewOnly}/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company Link</label>
                <input type="url" value={formData.companyFormLink} onChange={(e) => setFormData({ ...formData, companyFormLink: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="https://company.com" disabled={viewOnly} />
              </div>

              {/* Start / End Date & Time */}
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Venue / Mode</label>
                <input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Auditorium or Online" disabled={viewOnly}/>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700">External Link (Optional)</label>
                <input type="url" value={formData.companyDetails?.externalLink || ""} onChange={(e) => setFormData({ ...formData, companyDetails: { ...formData.companyDetails, externalLink: e.target.value } })} placeholder="https://your-company-form.com" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" disabled={viewOnly} />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isOnline} onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })} disabled={viewOnly}/>
                <label>Is Online Event</label>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all mt-4">{formData.status === "completed" ? "Update Participation Details" : formData.id ? "Update Event" : "Create Event"}</button>
            </form>
          </div>

          {/* Mobile centered overlay */}
          <div className="block sm:hidden fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[92vw] max-h-[85vh] overflow-auto p-4 mx-2 text-sm" onClick={(e)=>e.stopPropagation()}>
              <button onClick={() => setShowForm(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>

              <h2 className="text-lg font-bold mb-3 text-gray-800 text-center">{formData.id ? "Edit Event" : "Add Placement Event"}</h2>
              <p className="text-center text-sm text-gray-500 mb-3">Selected Date: {selectedDate.toDateString()}</p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full border rounded-lg px-3 py-2" placeholder="Event Title" disabled={viewOnly}/>
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Event Type</label>
                  <select value={formData.eventType} onChange={(e) => setFormData({ ...formData, eventType: e.target.value })} required className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}>
                    <option value="">Select Type</option>
                    <option value="Campus_Drive">Campus Drive</option>
                    <option value="Test">Test</option>
                  </select>
                </div>

                {/* Target Group */}
                <div>
                  <label className="block text-sm font-medium mb-1">Target Group</label>
                  <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}>
                    <option value="both">Both CRT & Non-CRT Students</option>
                    <option value="crt">CRT Students Only</option>
                    <option value="non-crt">Non-CRT Students Only</option>
                    <option value="batch-specific">Batch Specific</option>
                    <option value="specific-students">Specific Students</option>
                  </select>
                </div>

                {/* Batch Selection - Show only when batch-specific */}
                {targetGroup === 'batch-specific' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Batches (Optional)</label>
                  <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-gray-50">
                    {!Array.isArray(availableBatches) || availableBatches.length === 0 ? (
                      <p className="text-xs text-gray-500">No batches available</p>
                    ) : (
                      <div className="space-y-1.5">
                        {availableBatches.map(batch => (
                          <label key={batch._id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-100 p-1.5 rounded">
                            <input
                              type="checkbox"
                              checked={selectedBatches.includes(batch._id)}
                              onChange={() => handleBatchToggle(batch._id)}
                              disabled={viewOnly}
                              className="w-3.5 h-3.5"
                            />
                            <span className="text-xs">{batch.batchNumber} - {batch.techStack}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {selectedBatches.length > 0 ? `${selectedBatches.length} selected` : 'Optional'}
                  </p>
                </div>
                )}

                {/* Student Selection - Show only when specific-students */}
                {targetGroup === 'specific-students' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Students (Optional)</label>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    disabled={viewOnly}
                    className="w-full border rounded-lg px-2 py-1.5 mb-2 text-xs"
                  />
                  <div className="border rounded-lg p-2 max-h-48 overflow-y-auto bg-gray-50">
                    {!Array.isArray(filteredStudents) || filteredStudents.length === 0 ? (
                      <p className="text-xs text-gray-500">No students found</p>
                    ) : (
                      <div className="space-y-1.5">
                        {filteredStudents.slice(0, 50).map(student => (
                          <label key={student._id} className="flex items-start gap-2 text-[10px] cursor-pointer hover:bg-gray-100 p-1.5 rounded">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student._id)}
                              onChange={() => handleStudentToggle(student._id)}
                              disabled={viewOnly}
                              className="w-3 h-3 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs">{student.name}</div>
                              <div className="text-gray-600 truncate">{student.rollNo}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} selected` : 'Optional'}
                  </p>
                </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <input type="text" value={formData.status} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700" />
                </div>

                {/* Participated */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">No. of Registered Students</label>
                  <input type="number" value={formData.participated} onChange={(e) => setFormData({ ...formData, participated: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white" disabled={formData.status !== "completed"} min="0" placeholder="Enter number of participants" />
                </div>

                {/* Selected */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">No. of Selected Students</label>
                  <input type="number" value={formData.placed} onChange={(e) => setFormData({ ...formData, placed: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white" disabled={formData.status !== "completed"} min="0" placeholder="Enter number of selected students" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2" placeholder="Short description" disabled={viewOnly}/>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Company Name" disabled={viewOnly}/>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Company Link</label>
                  <input type="url" value={formData.companyFormLink} onChange={(e) => setFormData({ ...formData, companyFormLink: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="https://company.com" disabled={viewOnly} />
                </div>

                {/* Dates & times */}
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}/>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Venue / Mode</label>
                  <input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Auditorium or Online" disabled={viewOnly}/>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">External Link (Optional)</label>
                  <input type="url" value={formData.companyDetails?.externalLink || ""} onChange={(e) => setFormData({ ...formData, companyDetails: { ...formData.companyDetails, externalLink: e.target.value } })} placeholder="https://your-company-form.com" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" disabled={viewOnly} />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isOnline} onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })} disabled={viewOnly}/>
                  <label>Is Online Event</label>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all mt-4">{formData.status === "completed" ? "Update Participation Details" : formData.id ? "Update Event" : "Create Event"}</button>
              </form>
            </div>
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
  <div className="fixed inset-0 z-50" onClick={() => setShowModal(false)}>
    {/* Desktop panel */}
    <div className="hidden sm:block fixed top-24 right-6 bottom-6 w-[44%] max-w-2xl bg-white rounded-lg shadow-lg p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-black">✕</button>
      <h2 className="text-xl font-bold text-blue-700 mb-4">Registered Students ({uniqueStudents.length})</h2>
      {uniqueStudents.length === 0 ? (
        <p className="text-gray-500 text-center">No students registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border">
            <thead className="bg-blue-100 text-gray-800">
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
                  <td className="px-3 py-2 border">{r.dob ? new Date(r.dob).toLocaleDateString() : ""}</td>
                  <td className="px-3 py-2 border">{r.currentLocation}</td>
                  <td className="px-3 py-2 border">{r.hometown}</td>
                  <td className="px-3 py-2 border">{r.backlogs}</td>
                  <td className="px-3 py-2 border">{Array.isArray(r.techStack) ? r.techStack.join(", ") : r.techStack}</td>
                  <td className="px-3 py-2 border">{r.resumeUrl ? (<a href={r.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>) : ("N/A")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Mobile: centered overlay */}
    <div className="block sm:hidden fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[92vw] max-h-[85vh] overflow-auto p-4 relative mx-2 text-sm" onClick={(e)=>e.stopPropagation()}>
        <button onClick={() => setShowModal(false)} className="absolute top-2 right-2 text-gray-600 hover:text-black">✕</button>
        <h2 className="text-lg font-bold text-blue-700 mb-3">Registered Students ({uniqueStudents.length})</h2>
        {uniqueStudents.length === 0 ? (
          <p className="text-gray-500 text-center">No students registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            {/* table content same as above */}
            <table className="w-full text-sm text-left border">
              <thead className="bg-blue-100 text-gray-800">
                <tr>
                  <th className="px-3 py-2 border">Full Name</th>
                  <th className="px-3 py-2 border">Roll No</th>
                  <th className="px-3 py-2 border">Email</th>
                </tr>
              </thead>
              <tbody>
                {uniqueStudents.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border">{r.name}</td>
                    <td className="px-3 py-2 border">{r.rollNo}</td>
                    <td className="px-3 py-2 border">{r.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
)}
{showDeletedModal && (
  <div className="fixed inset-0 z-50" onClick={() => setShowDeletedModal(false)}>

    {/* Desktop: anchored panel on right */}
    <div className="hidden sm:block fixed top-20 right-6 bottom-6 w-[44%] max-w-2xl bg-white rounded-lg shadow-lg p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setShowDeletedModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-black">✕</button>

      <h2 className="text-xl font-bold text-red-600 mb-4">🗑 Deleted Events ({deletedEvents.length})</h2>

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

    {/* Mobile: centered overlay */}
    <div className="block sm:hidden fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowDeletedModal(false)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[92vw] max-h-[85vh] overflow-auto p-4 relative mx-2 text-sm" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setShowDeletedModal(false)} className="absolute top-2 right-2 text-gray-600 hover:text-black">✕</button>

        <h2 className="text-lg font-bold text-red-600 mb-3">🗑 Deleted Events ({deletedEvents.length})</h2>

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
  </div>
)}

{showSelectModal && (
  <div className="fixed inset-0 z-50" onClick={() => setShowSelectModal(false)}>
    {/* Desktop: anchored panel to the right */}
    <div className="hidden sm:block fixed top-24 right-6 bottom-6 w-[36%] max-w-sm bg-white rounded-lg shadow-lg p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Mark Selected Students</h2>
      <input
        type="text"
        placeholder="Search student by email..."
        value={selectedStudentEmail}
        onChange={(e) => {
          setSelectedStudentEmail(e.target.value);
          if (e.target.value.length > 3) fetchCompletedEventStudents(selectedEventId);
        }}
        className="w-full border rounded-lg px-3 py-2 mb-3"
      />
      <select value={selectedStudentEmail} onChange={(e) => setSelectedStudentEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-3">
        <option value="">-- Select Registered Student --</option>
        {registeredStudents.filter((s) => s.email.toLowerCase().includes(selectedStudentEmail.toLowerCase())).map((s) => (
          <option key={s.email} value={s.email}>{s.name} ({s.rollNo}) - {s.branch}</option>
        ))}
      </select>

      <button onClick={() => handleSelectStudent(selectedEventId)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full">✅ Mark Selected & Notify</button>

      <div className="mt-6 border-t pt-4">
        <p className="text-gray-700 font-medium mb-2">OR Upload Selected List</p>
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setSelectedFile(e.target.files[0])} className="border p-2 rounded-md w-full cursor-pointer mb-3" />
        <button onClick={handleUploadSelectedList} disabled={!selectedFile || !selectedEventId} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 w-full">Upload Selected List</button>
      </div>

      <div className="mt-4 text-right">
        <button onClick={() => setShowSelectModal(false)} className="px-3 py-1 bg-gray-100 rounded">Close</button>
      </div>
    </div>

    {/* Mobile: centered overlay */}
    <div className="block sm:hidden fixed inset-0 z-50 grid place-items-center bg-black bg-opacity-50 p-4" onClick={() => setShowSelectModal(false)}>
      <div className="bg-white p-4 rounded-lg w-full max-w-[92vw] max-h-[85vh] overflow-auto mx-2 text-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Mark Selected Students</h2>
        <input type="text" placeholder="Search student by email..." value={selectedStudentEmail} onChange={(e) => { setSelectedStudentEmail(e.target.value); if (e.target.value.length > 3) fetchCompletedEventStudents(selectedEventId); }} className="w-full border rounded-lg px-3 py-2 mb-3" />
        <select value={selectedStudentEmail} onChange={(e) => setSelectedStudentEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-3">
          <option value="">-- Select Registered Student --</option>
          {registeredStudents.filter((s) => s.email.toLowerCase().includes(selectedStudentEmail.toLowerCase())).map((s) => (<option key={s.email} value={s.email}>{s.name} ({s.rollNo}) - {s.branch}</option>))}
        </select>
        <button onClick={() => handleSelectStudent(selectedEventId)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full">✅ Mark Selected & Notify</button>

        <div className="mt-6 border-t pt-4">
          <p className="text-gray-700 font-medium mb-2">OR Upload Selected List</p>
          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setSelectedFile(e.target.files[0])} className="border p-2 rounded-md w-full cursor-pointer mb-3" />
          <button onClick={handleUploadSelectedList} disabled={!selectedFile || !selectedEventId} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 w-full">Upload Selected List</button>
        </div>

        <div className="mt-4 text-right">
          <button onClick={() => setShowSelectModal(false)} className="px-3 py-1 bg-gray-100 rounded">Close</button>
        </div>
      </div>
    </div>
  </div>
)}



{showSelectedStudentsModal && (
  <div className="fixed inset-0 z-50" onClick={() => setShowSelectedStudentsModal(false)}>
    {/* Desktop anchored panel */}
    <div className="hidden sm:block fixed top-28 right-6 bottom-6 w-[36%] max-w-md bg-white rounded-lg shadow-lg p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setShowSelectedStudentsModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-black">✕</button>
      <h2 className="text-xl font-bold text-blue-700 mb-4">🎯 Selected Students ({selectedStudents.length})</h2>

      {selectedStudents.length === 0 ? (
        <div className="text-center text-gray-500">No selected students found for this event. You can upload a selected list.</div>
      ) : (
        <div className="overflow-x-auto max-h-[60vh] border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-blue-100 text-gray-800">
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

      <div className="mt-4 text-right">
        <button onClick={() => { setShowSelectedStudentsModal(false); setShowSelectModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Upload Selected List</button>
        <button onClick={() => setShowSelectedStudentsModal(false)} className="ml-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Close</button>
      </div>
    </div>

    {/* Mobile centered overlay */}
    <div className="block sm:hidden fixed inset-0 z-50 grid place-items-center bg-black bg-opacity-50 p-4" onClick={() => setShowSelectedStudentsModal(false)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[92vw] max-h-[85vh] overflow-auto p-4 mx-2 text-sm" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setShowSelectedStudentsModal(false)} className="absolute top-2 right-2 text-gray-600 hover:text-black">✕</button>
        <h2 className="text-lg font-bold text-blue-700 mb-3">🎯 Selected Students ({selectedStudents.length})</h2>
        {selectedStudents.length === 0 ? (
          <div className="text-center text-gray-500">No selected students found for this event. You can upload a selected list.</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-blue-100 text-gray-800">
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

        <div className="mt-4 text-right">
          <button onClick={() => { setShowSelectedStudentsModal(false); setShowSelectModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Upload Selected List</button>
          <button onClick={() => setShowSelectedStudentsModal(false)} className="ml-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Close</button>
        </div>
      </div>
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
