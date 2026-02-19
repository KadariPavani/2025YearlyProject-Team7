import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Plus, X, Download } from "lucide-react";
import { LoadingSkeleton, ListSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';

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
const [targetGroup, setTargetGroup] = useState("batch-specific");
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
// Toast
const [toast, setToast] = useState(null);
const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3500); };
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
const [deletingEmail, setDeletingEmail] = useState(null);

const handleRemoveSelectedStudent = async (email) => {
  if (!selectedEventId || !email) return;
  if (!window.confirm(`Remove this student from the selected list?`)) return;
  setDeletingEmail(email);
  try {
    const token = localStorage.getItem("userToken");
    await axios.put(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${selectedEventId}/remove-selected-student`,
      { studentEmail: email },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSelectedStudents((prev) => prev.filter((s) => s.email?.toLowerCase() !== email.toLowerCase()));
    await fetchEvents({ notify: true, message: 'Student removed from selected list' });
  } catch (err) {
    console.error("Error removing selected student:", err);
    alert(err.response?.data?.message || "Failed to remove student");
  } finally {
    setDeletingEmail(null);
  }
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
  role: "",
  ctc: "",
  eventType: "drive",
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
                // Skip empty batches (should already be filtered by backend)
                if (!Array.isArray(batch.students) || batch.students.length === 0) {
                  console.log(`      ⚠️ Skipping empty batch ${batch.batchNumber || batch._id}`);
                  return;
                }

                // Add batch to list
                allBatches.push(batch);
                
                // Extract students from this batch
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
const fetchEvents = async ({ notify = false, message = null } = {}) => {
  setLoading(true);
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
    });
    const data = res.data?.data || [];

    // Separate deleted events (permanently deleted) and active/cancelled events
    const deletedEvents = data.filter((e) => e.status === "deleted");
    const activeEvents = data.filter((e) => e.status !== "deleted");

    // Map & compute active events (preserve explicit 'cancelled' status)
    const mappedEvents = activeEvents.map((e) => {
      // preserve cancelled status explicitly
      if (e.status === 'cancelled') {
        const startLocal = e.startDate ? new Date(e.startDate) : null;
        const dateStr = startLocal
          ? `${startLocal.getFullYear()}-${String(startLocal.getMonth() + 1).padStart(2, '0')}-${String(startLocal.getDate()).padStart(2, '0')}`
          : (e.startDate?.split('T')[0] || '');
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
          targetGroup: e.targetGroup || "batch-specific",
          eventType: e.eventType || "drive",
          status: 'cancelled',
          date: dateStr,
          participated: e.eventSummary?.totalAttendees || "",
          placed: e.eventSummary?.selectedStudents || "",
          externalLink: e.companyDetails?.externalLink || "",
        };
      }

      let computedStatus = e.status || "scheduled";

      const startDate = normalizeDate(e.startDate);
      const today = normalizeDate(new Date());
      const end = normalizeDate(e.endDate);

      if (end < today) computedStatus = "completed";
      else if (startDate <= today && today <= end) computedStatus = "ongoing";
      else computedStatus = "scheduled";

      // Compute local YYYY-MM-DD for start date to avoid timezone shifts
      const startLocal = e.startDate ? new Date(e.startDate) : null;
      const dateStr = startLocal
        ? `${startLocal.getFullYear()}-${String(startLocal.getMonth() + 1).padStart(2, '0')}-${String(startLocal.getDate()).padStart(2, '0')}`
        : (e.startDate?.split('T')[0] || '');

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
        targetGroup: e.targetGroup || "batch-specific",
        eventType: e.eventType || "drive",
        status: computedStatus,
        date: dateStr,
        participated: e.eventSummary?.totalAttendees || "",
        placed: e.eventSummary?.selectedStudents || "",
        externalLink: e.companyDetails?.externalLink || "",
      };
    });

    // Map deleted events so they can be shown on calendar as red (but also listed in deleted modal)
    const mappedDeleted = deletedEvents.map((e) => {
      const startLocal = e.startDate ? new Date(e.startDate) : null;
      const dateStr = startLocal
        ? `${startLocal.getFullYear()}-${String(startLocal.getMonth() + 1).padStart(2, '0')}-${String(startLocal.getDate()).padStart(2, '0')}`
        : (e.startDate?.split('T')[0] || '');
      return {
        id: e._id,
        title: e.title || "(deleted)",
        description: e.description || "",
        startDate: e.startDate || "",
        endDate: e.endDate || "",
        startTime: e.startTime || "",
        endTime: e.endTime || "",
        venue: e.venue || "",
        isOnline: e.isOnline || false,
        company: e.companyDetails?.companyName || "",
        companyFormLink: e.companyDetails?.companyFormLink || "",
        targetGroup: e.targetGroup || "batch-specific",
        eventType: e.eventType || "drive",
        status: 'deleted',
        date: dateStr,
        participated: e.eventSummary?.totalAttendees || "",
        placed: e.eventSummary?.selectedStudents || "",
        externalLink: e.companyDetails?.externalLink || "",
      };
    });

    // Combine active + deleted so deleted events show with red styling on calendar
    const combinedEvents = [...mappedEvents, ...mappedDeleted];

    // ✅ Update state and handle deleted events
    setEvents(combinedEvents);
    setDeletedEvents(deletedEvents);
    autoSelectOngoingDate(mappedEvents);

    // If caller wants a user-facing toast (eg. delete action), show it once
    if (notify) {
      showToast('success', message || 'Events updated');
    }

    // Notify other windows/components that calendar has been updated (helps student view stay in sync)
    try {
      window.dispatchEvent(new Event('calendarUpdated'));
    } catch (err) {
      console.warn('Could not dispatch calendarUpdated event', err);
    }
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
    role: "",
    ctc: "",
    eventType: "drive",
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
      role: e.companyDetails?.roles?.[0] || "",
      ctc: e.companyDetails?.packageDetails?.max || e.companyDetails?.packageDetails?.min || "",
      eventType: e.eventType || "drive",
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
    // 1) Mark cancelled on server (best-effort) so audit trail exists
    await axios.put(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}`,
      { status: "cancelled" },
      { headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` } }
    );

    // 2) Immediately delete the event on server
    await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
    });

    // 3) Update UI instantly
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setSelectedDateEvents((prev) => prev.filter((e) => e.id !== eventId));
    setDeletedEvents((prev) => [{ _id: eventId, status: 'deleted' }, ...prev]);

    // 4) Refresh events and show ONE toast after refresh (fetchEvents will show toast when notify=true)
    try { await fetchEvents({ notify: true, message: 'Event cancelled and deleted' }); } catch (err) { console.warn('fetchEvents failed after delete', err); }

    // fetchEvents already dispatches 'calendarUpdated' so no additional dispatch needed here.
  } catch (err) {
    console.error("❌ Error cancelling/deleting event:", err);
    showToast('error', err.response?.data?.message || "Failed to cancel & delete event");
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
    role: "",
    ctc: "",
    eventType: "drive",
    status: "scheduled",
    participated: "",
    placed: "",
companyDetails: {                            // ✅ fixed
    externalLink: event.companyDetails?.externalLink || event.externalLink || ""
  }
  });

  setTargetGroup("batch-specific");
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
    roles: formData.role ? [formData.role.trim()] : [],
    packageDetails: formData.ctc ? { min: parseFloat(formData.ctc), max: parseFloat(formData.ctc), currency: 'INR' } : undefined,
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

  // show a success toast after refresh
  const actionMsg = formData.id ? 'Event updated' : 'Event created';
  await fetchEvents({ notify: true, message: actionMsg }); // ✅ Refresh events list and show single toast
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

const handleExportRegisteredStudents = async () => {
  const eventId = selectedEvent || selectedEventId;
  if (!eventId) return;
  try {
    const token = localStorage.getItem("userToken");
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/${eventId}/registered-students/export`,
      { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
    );
    // Extract filename from Content-Disposition header (uses company name)
    const disposition = res.headers['content-disposition'];
    let fileName = `Registered_Students_${new Date().toISOString().split('T')[0]}.xlsx`;
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) fileName = match[1];
    }
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error exporting registered students:", err);
    showToast('error', 'Failed to export registered students');
  }
};

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
      {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
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
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Left: calendar (40%) */}
            <div className="w-full md:w-2/5">
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

                    <div className="flex-1 mt-0 md:mt-1 overflow-hidden px-1 flex flex-col justify-between h-full">
                      {/* Mobile/Tablet: dots below date */}
                      <div className="md:hidden flex items-center justify-start gap-1">
                        <div className="flex items-start justify-start gap-0.5">
                          {dateEvents.slice(0, 3).map((ev, i) => (
                            <span key={i} title={ev.title} aria-label={ev.title} className={`inline-block flex-shrink-0 w-1 h-1 rounded-full shadow-sm ${ev.status === "completed" ? "bg-green-500" : ev.status === "ongoing" ? "bg-orange-500" : (ev.status === "cancelled" || ev.status === "deleted") ? "bg-red-500" : "bg-blue-600"}`} />
                          ))}
                        </div>
                      </div>
                      {/* Desktop: event title chips */}
                      <div className="hidden md:flex md:flex-col md:gap-1">
                        {dateEvents.slice(0, 1).map((ev) => (
                          <div
                            key={ev.id}
                            className={`text-[10px] rounded px-1 py-0.5 ${
                              ev.status === "completed"
                                ? "bg-green-50 text-green-700"
                                : ev.status === "ongoing"
                                ? "bg-orange-50 text-orange-700"
                                : (ev.status === "cancelled" || ev.status === "deleted")
                                ? "bg-red-50 text-red-700"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="inline-block truncate min-w-0" title={ev.title}>{ev.title}</span>
                              {dateEvents.length > 1 && (
                                <span className="hidden md:inline text-[9px] text-gray-500 flex-shrink-0">+{Math.max(0, dateEvents.length - 1)}</span>
                              )}
                            </div>
                          </div>
                        ))}

                        {dateEvents.length > 1 && (
                          <div className="mt-1">
                            <span className="hidden md:inline text-[8px] text-gray-500">+{Math.max(0, dateEvents.length - 1)} more</span>
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
            <aside className="hidden md:block w-full md:w-3/5 sticky top-20 self-start">
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
                            <div className={`w-1 h-8 rounded ${event.status === 'completed' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-orange-500' : (event.status === 'cancelled' || event.status === 'deleted') ? 'bg-red-500' : 'bg-blue-600'}`} />
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
                            {event.status === 'deleted' ? (
                              <span className="px-2 py-1 rounded text-red-600 text-sm font-semibold border border-red-100 bg-red-50">Deleted</span>
                            ) : (
                              <button title="More" onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId === event.id ? null : event.id);}} className="p-2 rounded-md hover:bg-gray-100 text-gray-600">⋮</button>
                            )}

                            {/* Action menu */}
                            {openMenuId === event.id && event.status !== 'deleted' && (
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
                                    {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'completed' && event.status !== 'cancelled' && event.status !== 'deleted' ? (
                                      <button onClick={(e)=>{e.stopPropagation(); handleEditEvent(event); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Edit Event</button>
                                    ) : (
                                      <div className="w-full text-left px-3 py-2 text-sm text-gray-400">Edit (not available for past events)</div>
                                    )}
                                  </li>

                                  <li>
                                    {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'cancelled' && event.status !== 'deleted' ? (
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

      {/* Selected Date Event Details (mobile + tablet) */}
      <div className="mt-4 bg-white rounded-lg shadow border border-gray-200 w-full mx-auto block md:hidden">
        {loading ? (
          <ListSkeleton />
        ) : (
          <>
            {/* Date header */}
            <div className="px-3 py-2 border-b border-gray-100 bg-blue-50 rounded-t-lg">
              <div className="text-xs text-blue-500 font-medium">Events on</div>
              <div className="text-sm font-bold text-blue-800">{selectedDate.toLocaleString('default', { weekday: 'long' })}, {ordinal(selectedDate.getDate())} {selectedDate.toLocaleString('default', { month: 'long' })}</div>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="p-3">
                    {/* Title row with status badge and action button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div className={`w-1 mt-0.5 self-stretch rounded-full flex-shrink-0 ${event.status === 'completed' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-orange-500' : (event.status === 'cancelled' || event.status === 'deleted') ? 'bg-red-500' : 'bg-blue-600'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">{event.title}</span>
                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${event.status === 'completed' ? 'bg-green-100 text-green-700' : event.status === 'ongoing' ? 'bg-orange-100 text-orange-700' : (event.status === 'cancelled' || event.status === 'deleted') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
                          </div>
                        </div>
                      </div>
                      {event.status === 'deleted' ? (
                        <span className="px-2 py-0.5 rounded text-red-600 text-xs font-semibold border border-red-100 bg-red-50 flex-shrink-0">Deleted</span>
                      ) : (
                        <button title="More" onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId === event.id ? null : event.id);}} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 flex-shrink-0">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
                        </button>
                      )}
                    </div>

                    {/* Event details - only show fields with real values */}
                    <div className="mt-2 ml-3">
                      <table className="w-full text-xs">
                        <tbody>
                          {event.company && (
                            <tr>
                              <td className="py-0.5 pr-2 text-gray-400 font-medium whitespace-nowrap align-top w-20">Company</td>
                              <td className="py-0.5 text-gray-700">{event.company}</td>
                            </tr>
                          )}
                          {(event.startTime || event.endTime) && (
                            <tr>
                              <td className="py-0.5 pr-2 text-gray-400 font-medium whitespace-nowrap w-20">Time</td>
                              <td className="py-0.5 text-gray-700">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</td>
                            </tr>
                          )}
                          {event.venue && (
                            <tr>
                              <td className="py-0.5 pr-2 text-gray-400 font-medium whitespace-nowrap w-20">Venue</td>
                              <td className="py-0.5 text-gray-700">{event.venue}</td>
                            </tr>
                          )}
                          {event.participated > 0 && (
                            <tr>
                              <td className="py-0.5 pr-2 text-gray-400 font-medium whitespace-nowrap w-20">Registered</td>
                              <td className="py-0.5 text-gray-700 font-medium">{event.participated}</td>
                            </tr>
                          )}
                          {event.placed > 0 && (
                            <tr>
                              <td className="py-0.5 pr-2 text-gray-400 font-medium whitespace-nowrap w-20">Selected</td>
                              <td className="py-0.5 text-gray-700 font-medium">{event.placed}</td>
                            </tr>
                          )}
                          {event.description && (
                            <tr>
                              <td className="py-0.5 pr-2 text-gray-400 font-medium whitespace-nowrap align-top w-20">Details</td>
                              <td className="py-0.5 text-gray-600 break-words">{event.description}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Inline dropdown action menu (no modal) */}
                    {openMenuId === event.id && event.status !== 'deleted' && (
                      <>
                        {/* Invisible backdrop to close menu on tap outside */}
                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                        <div className="relative z-50 mt-2 ml-3 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                          <button onClick={() => { handleViewRegisteredStudents(event.id); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">View Registered Students</button>
                          {event.status === 'completed' ? (
                            <button onClick={() => { setSelectedEventId(event.id); setShowSelectModal(true); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">Add Selected Students</button>
                          ) : (
                            <div className="w-full text-left px-3 py-2 text-xs text-gray-400">Add Selected Students (after completion)</div>
                          )}
                          <button onClick={() => { handleViewSelectedStudents(event.id); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">View Selected Students</button>
                          {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'completed' && event.status !== 'cancelled' && event.status !== 'deleted' ? (
                            <button onClick={() => { handleEditEvent(event); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">Edit Event</button>
                          ) : (
                            <div className="w-full text-left px-3 py-2 text-xs text-gray-400">Edit (not available for past events)</div>
                          )}
                          <div className="border-t border-gray-100 my-0.5" />
                          {!(event.endDate && normalizeDate(event.endDate) < normalizeDate(new Date())) && event.status !== 'cancelled' && event.status !== 'deleted' ? (
                            <button onClick={() => { handleCancelDeleteEvent(event.id); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50">Cancel & Delete</button>
                          ) : (
                            <div className="w-full text-left px-3 py-2 text-xs text-gray-400">Cancel & Delete (not available)</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-xs">No events for this date.</div>
            )}
          </>
        )}
      </div>


      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50" onClick={() => setShowForm(false)}>
          {/* Desktop anchored form on right */}
          <div className="hidden md:block fixed top-20 right-6 bottom-6 w-[44%] max-w-lg bg-white rounded-2xl shadow-2xl p-6 overflow-auto" onClick={(e)=>e.stopPropagation()}>
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

              {/* Target Group Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1">Target Group</label>
                <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}>
                  <option value="batch-specific">Batch Specific</option>
                  <option value="specific-students">Specific Students</option>
                </select>
              </div>

              {/* Batch Selection with Checkboxes - Show only when batch-specific */}
              {targetGroup === 'batch-specific' && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Batches</label>
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
                  {selectedBatches.length > 0 ? `${selectedBatches.length} batch(es) selected` : 'Select target batches'}
                </p>
              </div>
              )}

              {/* Student Selection with Search and Checkboxes - Show only when specific-students */}
              {targetGroup === 'specific-students' && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Students</label>
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
                  {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} student(s) selected` : 'Select target students'}
                </p>
              </div>
              )}

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

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Software Engineer" disabled={viewOnly}/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CTC (LPA)</label>
                <input type="number" step="0.01" min="0" value={formData.ctc} onChange={(e) => setFormData({ ...formData, ctc: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. 6.5" disabled={viewOnly}/>
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

              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all mt-4">{formData.id ? "Update Event" : "Create Event"}</button>
            </form>
          </div>

          {/* Mobile/Tablet bottom sheet */}
          <div className="block md:hidden fixed inset-0 z-50" onClick={() => setShowForm(false)}>
            <div className="fixed inset-0 bg-black/40" />
            <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-auto p-4 text-sm animate-slideUp" onClick={(e)=>e.stopPropagation()}>
              <div className="flex justify-center mb-2"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800">{formData.id ? "Edit Event" : "Add Placement Event"}</h2>
                <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-gray-500 mb-3">Selected Date: {selectedDate.toDateString()}</p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full border rounded-lg px-3 py-2" placeholder="Event Title" disabled={viewOnly}/>
                </div>

                {/* Target Group */}
                <div>
                  <label className="block text-sm font-medium mb-1">Target Group</label>
                  <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="w-full border rounded-lg px-3 py-2" disabled={viewOnly}>
                    <option value="batch-specific">Batch Specific</option>
                    <option value="specific-students">Specific Students</option>
                  </select>
                </div>

                {/* Batch Selection - Show only when batch-specific */}
                {targetGroup === 'batch-specific' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Batches</label>
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
                    {selectedBatches.length > 0 ? `${selectedBatches.length} selected` : 'Select target batches'}
                  </p>
                </div>
                )}

                {/* Student Selection - Show only when specific-students */}
                {targetGroup === 'specific-students' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Students</label>
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
                    {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} selected` : 'Select target students'}
                  </p>
                </div>
                )}

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

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Software Engineer" disabled={viewOnly}/>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">CTC (LPA)</label>
                  <input type="number" step="0.01" min="0" value={formData.ctc} onChange={(e) => setFormData({ ...formData, ctc: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. 6.5" disabled={viewOnly}/>
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

                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all mt-4">{formData.id ? "Update Event" : "Create Event"}</button>
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
    <div className="hidden md:block fixed top-24 right-6 bottom-6 w-[44%] max-w-2xl bg-white rounded-lg shadow-lg p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-black">✕</button>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-700">Registered Students ({uniqueStudents.length})</h2>
        {uniqueStudents.length > 0 && (
          <button onClick={handleExportRegisteredStudents} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        )}
      </div>
      {uniqueStudents.length === 0 ? (
        <p className="text-gray-500 text-center">No students registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll No</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Email</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">College</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Branch</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Gender</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">DOB</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Location</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Home Town</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Backlogs</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Tech Stack</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Year of Passing</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Resume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {uniqueStudents.map((r, i) => (
                <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium whitespace-nowrap">{r.name}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm font-mono text-gray-700 whitespace-nowrap">{r.rollNo}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{r.email}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{r.phonenumber}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{r.college}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{r.branch}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{r.gender}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{r.dob ? new Date(r.dob).toLocaleDateString() : ""}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{r.currentLocation}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{r.hometown}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-center text-gray-700">{r.backlogs}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{Array.isArray(r.techStack) ? r.techStack.join(", ") : r.techStack}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{r.yearOfPassing}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-center">{r.resumeUrl ? (<a href={r.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>) : ("N/A")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Mobile/Tablet bottom sheet */}
    <div className="block md:hidden fixed inset-0 z-50" onClick={() => setShowModal(false)}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-auto p-4 text-sm animate-slideUp" onClick={(e)=>e.stopPropagation()}>
        <div className="flex justify-center mb-2"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-blue-700">Registered Students ({uniqueStudents.length})</h2>
          <div className="flex items-center gap-2">
            {uniqueStudents.length > 0 && (
              <button onClick={handleExportRegisteredStudents} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition">
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            )}
            <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
        {uniqueStudents.length === 0 ? (
          <p className="text-gray-500 text-center">No students registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll No</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">College</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Branch</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Gender</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">DOB</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Location</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Home Town</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Backlogs</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Tech Stack</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Year of Passing</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uniqueStudents.map((r, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2 text-xs text-gray-900 font-medium whitespace-nowrap">{r.name}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-700 whitespace-nowrap">{r.rollNo}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.email}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.phonenumber}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.college}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.branch}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.gender}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.dob ? new Date(r.dob).toLocaleDateString() : ""}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.currentLocation}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.hometown}</td>
                    <td className="px-3 py-2 text-xs text-center text-gray-700">{r.backlogs}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{Array.isArray(r.techStack) ? r.techStack.join(", ") : r.techStack}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{r.yearOfPassing}</td>
                    <td className="px-3 py-2 text-xs text-center">{r.resumeUrl ? (<a href={r.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>) : ("N/A")}</td>
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
    <div className="hidden md:block fixed top-20 right-6 bottom-6 w-[44%] max-w-2xl bg-white rounded-lg shadow-lg p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
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

    {/* Mobile/Tablet bottom sheet */}
    <div className="block md:hidden fixed inset-0 z-50" onClick={() => setShowDeletedModal(false)}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-auto p-4 text-sm animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-2"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-red-600">Deleted Events ({deletedEvents.length})</h2>
          <button onClick={() => setShowDeletedModal(false)} className="p-1 text-gray-400 hover:text-gray-600">✕</button>
        </div>

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
    <div className="hidden md:block fixed top-24 right-6 bottom-6 w-[36%] max-w-sm bg-white rounded-lg shadow-lg p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
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

    {/* Mobile/Tablet bottom sheet */}
    <div className="block md:hidden fixed inset-0 z-50" onClick={() => setShowSelectModal(false)}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-auto p-4 text-sm animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-2"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Mark Selected Students</h2>
          <button onClick={() => setShowSelectModal(false)} className="p-1 text-gray-400 hover:text-gray-600">✕</button>
        </div>
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
    <div className="hidden md:block fixed top-28 right-6 bottom-6 w-[36%] max-w-md bg-white rounded-lg shadow-lg p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setShowSelectedStudentsModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-black">✕</button>
      <h2 className="text-xl font-bold text-blue-700 mb-4">🎯 Selected Students ({selectedStudents.length})</h2>

      {selectedStudents.length === 0 ? (
        <div className="text-center text-gray-500">No selected students found for this event. You can upload a selected list.</div>
      ) : (
        <div className="overflow-auto max-h-[60vh] rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Full Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll No</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Email</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Branch</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedStudents.map((s, i) => (
                <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium whitespace-nowrap">{s.name}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm font-mono text-gray-700 whitespace-nowrap">{s.rollNo}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{s.email}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{s.branch}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleRemoveSelectedStudent(s.email)}
                      disabled={deletingEmail === s.email}
                      className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      {deletingEmail === s.email ? '...' : 'Remove'}
                    </button>
                  </td>
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

    {/* Mobile/Tablet bottom sheet */}
    <div className="block md:hidden fixed inset-0 z-50" onClick={() => setShowSelectedStudentsModal(false)}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-auto p-4 text-sm animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-2"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-blue-700">Selected Students ({selectedStudents.length})</h2>
          <button onClick={() => setShowSelectedStudentsModal(false)} className="p-1 text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {selectedStudents.length === 0 ? (
          <div className="text-center text-gray-500">No selected students found for this event. You can upload a selected list.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Roll No</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Branch</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedStudents.map((s, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2 text-xs text-gray-900 font-medium whitespace-nowrap">{s.name}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-700 whitespace-nowrap">{s.rollNo}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{s.email}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{s.branch}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleRemoveSelectedStudent(s.email)}
                        disabled={deletingEmail === s.email}
                        className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {deletingEmail === s.email ? '...' : 'Remove'}
                      </button>
                    </td>
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
