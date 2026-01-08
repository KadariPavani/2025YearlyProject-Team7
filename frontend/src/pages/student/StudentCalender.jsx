import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, List } from "lucide-react";
import CompanyRegistrationForm from "./CompanyRegistrationForm"; // Adjust path as needed
import { LoadingSkeleton, ListSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';

const StudentPlacementCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [selectedDateLabel, setSelectedDateLabel] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }; 
const [selectedEventId, setSelectedEventId] = useState(null);
const [tpoExternalLink, setTpoExternalLink] = useState("");
const [studentData, setStudentData] = useState(null);
const [registeredEvents, setRegisteredEvents] = useState([]);
const [showRegistered, setShowRegistered] = useState(false);
const [registeredEventIds, setRegisteredEventIds] = useState([]);
const [openMenuId, setOpenMenuId] = useState(null);
const [showMobileDetails, setShowMobileDetails] = useState(false);

// Small helper to show ordinal day (1st, 2nd, 3rd, 4th...)
const ordinal = (n) => {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return new Date(year, month - 1, day); // Month is 0-indexed
};


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
      console.error("Error fetching student profile:", err);
    }
  };
  fetchStudentProfile();
}, []);

const handleOpenRegistration = (event) => {
  setSelectedEventId(event.id);
  setTpoExternalLink(event.externalLink || "");  // ✅ pass link from event
  setShowRegistrationModal(true);
};






  const fetchEvents = async () => {
  setLoading(true);
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
    });
    const data = res.data?.data || [];

    const now = new Date();
const processedEvents = data.map((e) => {
  let computedStatus = e.status || "scheduled";
  const endDate = new Date(e.endDate);

  // Normalize dates to ignore time component
  const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Mark completed if endDate is before today
  if (computedStatus === "scheduled" && endDateOnly < todayOnly) {
    computedStatus = "completed";
  }

  return {
    id: e._id,
    title: e.title,
    description: e.description,
    startDate: e.startDate,
    endDate: e.endDate,
    startTime: e.startTime,
    endTime: e.endTime,
    venue: e.venue,
    company: e.companyDetails?.companyName || "",
    eventType: e.eventType,
    status: computedStatus,
    date: parseLocalDate(e.startDate).toISOString().split("T")[0],

    participated: e.eventSummary?.totalAttendees || 0,
    placed: e.eventSummary?.selectedStudents || 0,
    externalLink: e.companyDetails?.externalLink || "",
    targetGroup: e.targetGroup || "both",
  };
});


    setEvents(processedEvents);
    // Auto-select ongoing or today's events to mimic TPO behavior
    autoSelectOngoingDate(processedEvents);

    // Update selected date events if there's a selected date
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    const currentDateEvents = processedEvents.filter(e => e.date === currentDateStr);
    setSelectedDateEvents(currentDateEvents);
  } catch (err) {
    showToast('error', err.response?.data?.message || 'Error fetching events');
  }
  setLoading(false);
};

// ✅ Fetch registered events
const fetchRegisteredEvents = async () => {
  const token = localStorage.getItem("userToken");
  if (!token) return;

  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar/registered`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const events = res.data?.data || [];
    console.log("✅ Registered events fetched:", events);

    // ✅ Store both event IDs and event data
    const registeredIds = events.map((event) => event._id?.toString());
    setRegisteredEventIds(registeredIds);
    setRegisteredEvents(events);
  } catch (err) {
    showToast('error', err.response?.data?.message || 'Error fetching registered events');
  }
};


useEffect(() => {
  fetchEvents();
  fetchRegisteredEvents();
}, []);
  // Calendar helpers
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const handlePrevMonth = () => setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setSelectedDate(new Date(currentYear, currentMonth + 1, 1));

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

  // Build fixed 6-row (42-cell) calendar grid for consistent square layout
  const buildCalendarCells = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length < 42) cells.push(null);

    return cells;
  };

  const calendarCells = buildCalendarCells(currentYear, currentMonth);

  const getEventsForDate = (date) => {
    // Normalize to start of day and compare using timestamps to avoid timezone string issues
    const target = normalizeDate(date);
    return events.filter((e) => {
      const start = normalizeDate(e.startDate || e.date);
      const end = e.endDate ? normalizeDate(e.endDate) : start;
      return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
    });
  };

  // Normalize date to start of day for comparisons
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d;
  };

  // Handle date click (student): select day and show events for that day
  const handleDateClick = (day) => {
    const dayNormalized = normalizeDate(day);
    const eventsForDay = getEventsForDate(dayNormalized);
    setSelectedDate(dayNormalized);
    setSelectedDateLabel(dayNormalized.toDateString());
    setSelectedDateEvents(eventsForDay);
    // Close any open action menu (do NOT open details modal on date click)
    setOpenMenuId(null);
  };  

  // Auto-select an ongoing event date or today's events (follows TPO logic)
  const autoSelectOngoingDate = (eventsList) => {
    const today = normalizeDate(new Date());

    // 1) Find ongoing events
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

    // 2) Fallback: today's events
    const todayEvents = eventsList.filter((e) => normalizeDate(e.startDate).getTime() === today.getTime());

    setSelectedDate(today);
    setSelectedDateLabel(today.toDateString());
    setSelectedDateEvents(todayEvents);
  };

const canRegisterForEvent = (eventStartDate) => {
  if (!eventStartDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to start of day

  const startDate = new Date(eventStartDate);
  startDate.setHours(0, 0, 0, 0); // normalize to start of event day

  const registrationCloseDate = new Date(startDate);
  registrationCloseDate.setDate(registrationCloseDate.getDate() - 2);
  // Registration allowed only before day-before yesterday

  // Return true only if today is on or before registrationCloseDate
  return today <= registrationCloseDate;
};
// ✅ Load events and registered events when component mounts

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {toast && (
        <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {/* Header */}
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
  {/* Left side - Title */}
  <div className="flex items-center gap-3">
    <Calendar className="text-blue-600 h-7 w-7" />
    <h1 className="text-2xl font-bold text-gray-800">Placement Calendar</h1>
  </div>

  {/* Right side - Registered Events + Refresh */}
  <div className="flex items-center gap-4 relative">
    {/* ✅ Registered Events Dropdown on Click (desktop) */}
    <div className="relative hidden sm:block">
      <button
        onClick={() => setShowRegistered(!showRegistered)}
        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
      >
        Registered Events ({registeredEvents.length})
      </button>

      {showRegistered && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {registeredEvents.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto text-sm">
              {registeredEvents.map((ev) => (
                <li
                  key={ev._id}
                  className="px-3 py-2 border-b hover:bg-blue-50 cursor-pointer"
                  onClick={() => {
                    const eventDate = new Date(ev.startDate);
                    setSelectedDate(eventDate);
                    setSelectedDateLabel(eventDate.toDateString());
                    setSelectedDateEvents([
                      {
                        id: ev._id,
                        title: ev.title,
                        startDate: ev.startDate,
                        endDate: ev.endDate,
                        status: ev.status,
                        venue: ev.venue,
                        description: ev.description,
                      },
                    ]);
                    // Open details modal on mobile
                    if (typeof window !== 'undefined' && window.innerWidth < 640) setShowMobileDetails(true);
                    setShowRegistered(false); // Close dropdown
                  }}
                >
                  <p className="font-medium text-gray-800 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-500">{new Date(ev.startDate).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center p-3 text-sm">No registered events yet.</p>
          )}
        </div>
      )}
    </div>

    {/* 🔁 Refresh Button (desktop) */}
    <div className="hidden sm:block">
      <button
        onClick={() => {
          fetchEvents();
          fetchRegisteredEvents();
        }}
        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
      >
        <RefreshCw className="h-4 w-4" /> Refresh
      </button>
    </div>

    {/* Mobile controls */}
    <div className="flex gap-3 mt-4 block sm:hidden w-full">
      <button onClick={() => setShowRegistered(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
        <List className="h-4 w-4" />
        <span className="text-sm">Registered ({registeredEvents.length})</span>
      </button>
      <button onClick={() => { fetchEvents(); fetchRegisteredEvents(); }} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
        <RefreshCw className="h-4 w-4" />
        <span className="text-sm">Refresh</span>
      </button>
    </div>

    {/* Mobile Registered Events Modal (when showRegistered on mobile) */}
    {showRegistered && (
      <div className="block sm:hidden fixed inset-0 z-50 grid place-items-center bg-black/50" onClick={() => setShowRegistered(false)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-4 mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="registered-events-title">
          <div className="mb-2 flex items-center justify-between">
            <div id="registered-events-title" className="text-sm font-semibold">Registered Events ({registeredEvents.length})</div>
            <button onClick={() => setShowRegistered(false)} className="text-sm text-gray-500">Close</button>
          </div>
          {registeredEvents.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {registeredEvents.map(ev => (
                <li key={ev._id} className="px-3 py-2 border-b hover:bg-blue-50 cursor-pointer" onClick={() => { const eventDate = normalizeDate(new Date(ev.startDate)); setSelectedDate(eventDate); setSelectedDateLabel(eventDate.toDateString()); setSelectedDateEvents(getEventsForDate(eventDate)); setOpenMenuId(null); setShowRegistered(false); }}>
                  <p className="font-medium text-gray-800">{ev.title}</p>
                  <p className="text-xs text-gray-500">{new Date(ev.startDate).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center p-3 text-sm">No registered events yet.</p>
          )}
        </div>
      </div>
    )}
  </div>
</div>





      {/* TPO-style calendar container */}
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
                <div className="mx-3 text-base font-semibold text-gray-800">{selectedDate.toLocaleString('default', { month: 'long' })} {currentYear}</div>
                <button onClick={handleNextMonth} className="p-2 bg-white border rounded-full hover:bg-blue-100"><ChevronRight /></button>
              </div>

              {/* Weekday headings */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-blue-800 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
                  <div key={day} className="text-[10px] bg-blue-50 rounded-sm py-0.5">{day}</div>
                ))}
              </div>

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
                        className={`aspect-square min-h-0 overflow-hidden border border-blue-100 rounded-sm sm:rounded-md p-0.5 sm:p-0.5 cursor-pointer flex flex-col transition-all ${isSelected ? 'bg-blue-200 border-blue-600 shadow-md' : 'bg-white shadow-sm hover:shadow-md hover:bg-blue-50'} ${isToday ? 'ring-2 ring-blue-200' : ''}`}>

                        <div className="flex items-start justify-between px-1">
                          <span className="text-[10px] sm:text-sm font-medium text-gray-600">{cellDate.getDate()}</span>
                        </div>

                        <div className="flex-1 mt-0 sm:mt-1 overflow-hidden px-1 flex flex-col justify-between h-full">
                          {/* Mobile: show dots only (clickable, accessible, and enlarged to match TPO) */}
                          <div className="sm:hidden flex items-center justify-center gap-1 mt-0.5">
                            <div className="flex items-start justify-start gap-1">
                              {dateEvents.slice(0,3).map((ev) => (
                                <span
                                  key={ev.id}
                                  role="button"
                                  tabIndex={0}
                                  title={ev.title}
                                  aria-label={ev.title}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const eventDate = normalizeDate(new Date(ev.startDate));
                                    setSelectedDate(eventDate);
                                    setSelectedDateLabel(eventDate.toDateString());
                                    setSelectedDateEvents(getEventsForDate(eventDate));
                                    setOpenMenuId(null); // close any open action menu
                                    // DO NOT open details modal on dot click — user wants explicit card click to open details
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      const eventDate = normalizeDate(new Date(ev.startDate));
                                      setSelectedDate(eventDate);
                                      setSelectedDateLabel(eventDate.toDateString());
                                      setSelectedDateEvents(getEventsForDate(eventDate));
                                      setOpenMenuId(null); // close any open action menu
                                      // DO NOT open details modal on dot key press — wait for explicit card click
                                    }
                                  }}
                                  className={`inline-block flex-shrink-0 w-1.5 h-1.5 rounded-full shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 ${ev.status === 'completed' ? 'bg-green-500' : ev.status === 'ongoing' ? 'bg-orange-500' : ev.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-600'}`}
                                />
                              ))}
                              {dateEvents.length > 3 && (
                                <span className="text-[10px] text-gray-500 ml-1">+{dateEvents.length - 3}</span>
                              )}
                            </div>
                          </div>

                          <div className="hidden sm:flex sm:flex-col sm:gap-1">
                            {dateEvents.slice(0,1).map((ev) => (
                              <div
                                key={ev.id}
                                className={`text-[10px] rounded px-1 py-0.5 ${ev.status === 'completed' ? 'bg-green-50 text-green-700' : ev.status === 'ongoing' ? 'bg-orange-50 text-orange-700' : ev.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}
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
                                <span className="hidden sm:inline text-[8px] text-gray-500">+{Math.max(0, dateEvents.length - 1)}</span>
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

            {/* Right: details (hidden on small screens) */}
            <aside className="hidden sm:block w-full sm:w-3/5 sticky top-20 self-start">
              <div className="p-4 w-full border-l border-blue-50 pl-6">

              <div className="h-px bg-blue-50 mb-2" />

              {/* Show loading skeleton when events are still loading */}
              {loading ? (
                <ListSkeleton />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map(event => (
                      <li key={event.id} className="flex items-center justify-between py-3 relative">
                        <div className="flex items-start gap-3">
                          <div className={`w-1 h-8 rounded ${event.status === 'completed' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-orange-500' : event.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-600'}`} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{event.title}</div>
                            <div className="text-xs text-gray-500">{event.startTime}{event.endTime ? ` • ${event.endTime}` : ''}</div>

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
                          <div className="flex flex-col items-end">
                            {event.status === 'scheduled' ? (
                              registeredEventIds.includes(event.id) ? (
                                <button disabled className="px-3 py-1 bg-green-200 text-green-700 rounded cursor-not-allowed">✅ Registered</button>
                              ) : canRegisterForEvent(event.startDate) ? (
                                <button onClick={(e)=>{e.stopPropagation(); handleOpenRegistration(event);}} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all">Register</button>
                              ) : (
                                <span className="text-xs text-gray-500 italic">Registration closed</span>
                              )
                            ) : null}

                            <button title="More" onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId === event.id ? null : event.id);}} className="mt-2 p-2 rounded-md hover:bg-gray-100 text-gray-600">⋮</button>

                            {openMenuId === event.id && (
                              <div className="absolute right-4 top-8 z-50 bg-white border rounded shadow-md w-44">
                                <ul>
                                  {event.externalLink ? (
                                    <li>
                                      <button onClick={(e)=>{e.stopPropagation(); window.open(event.externalLink,'_blank'); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Open External Link</button>
                                    </li>
                                  ) : null}

                                  <li>
                                    <button onClick={(e)=>{e.stopPropagation(); navigator.clipboard?.writeText(event.externalLink || ''); showToast('success','Link copied to clipboard'); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Copy Link</button>
                                  </li>

                                  <li>
                                    <div className="w-full text-left px-3 py-2 text-sm text-gray-400">More actions coming</div>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
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

      <div className="mt-8 bg-white rounded-lg shadow-lg p-3 w-full max-w-[560px] mx-auto border border-gray-100 block sm:hidden">
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
                  <li key={event.id} onClick={() => {
                    // when user clicks the event card on mobile, show the details modal for that event
                    const eventDate = normalizeDate(new Date(event.startDate || selectedDate));
                    setSelectedDate(eventDate);
                    setSelectedDateLabel(eventDate.toDateString());
                    setSelectedDateEvents(getEventsForDate(eventDate));
                    setOpenMenuId(null);
                    setShowMobileDetails(true);
                  }} className="relative flex flex-col sm:flex-row items-start justify-between py-3 gap-3">
                    <button title="More" onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId === event.id ? null : event.id);}} className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 text-gray-600 sm:static sm:mt-0 sm:p-2 sm:rounded-md sm:w-auto">⋮</button>
                    <div className="flex items-start gap-3 w-full">
                      <div className={`w-1 h-8 rounded ${event.status === 'completed' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-orange-500' : event.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-600'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-800 sm:truncate">{event.title}</div>
                        <div className="text-xs text-gray-500">{event.startTime}{event.endTime ? ` • ${event.endTime}` : ''}</div>

                        {event.company && (<div className="text-xs text-gray-500 mt-1"><strong>Company:</strong> {event.company}</div>)}
                        {event.description && (<div className="text-xs text-gray-500 mt-1 sm:truncate"><strong>Description:</strong> {event.description}</div>)}

                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                          <span className="w-full sm:w-auto"><strong>Registered:</strong> {event.participated ?? 0}</span>
                          <span className="w-full sm:w-auto"><strong>Selected:</strong> {event.placed ?? 0}</span>
                          <span className="w-full sm:w-auto"><strong>Venue:</strong> {event.venue || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end items-stretch gap-2 w-full sm:w-auto">
                      {event.status === 'scheduled' ? (
                        registeredEventIds.includes(event.id) ? (
                          <button disabled className="w-full sm:w-auto px-3 py-1 bg-green-200 text-green-700 rounded cursor-not-allowed">✅ Registered</button>
                        ) : canRegisterForEvent(event.startDate) ? (
                          <button onClick={(e)=>{e.stopPropagation(); handleOpenRegistration(event);}} className="w-full sm:w-auto px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all">Register</button>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Registration closed</span>
                        )
                      ) : null}

                      

                      {/* Mobile: centered modal with student actions */}
                      {openMenuId === event.id && (
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
                              {event.externalLink ? (
                                <li>
                                  <button onClick={() => { window.open(event.externalLink, '_blank'); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100">Open External Link</button>
                                </li>
                              ) : null}

                              <li>
                                <button onClick={() => { navigator.clipboard?.writeText(event.externalLink || ''); showToast('success','Link copied to clipboard'); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100">Copy Link</button>
                              </li>

                              {event.status === 'scheduled' ? (
                                registeredEventIds.includes(event.id) ? (
                                  <li>
                                    <div className="w-full text-left px-4 py-3 text-sm text-gray-600 rounded-lg">✅ Registered</div>
                                  </li>
                                ) : canRegisterForEvent(event.startDate) ? (
                                  <li>
                                    <button onClick={() => { handleOpenRegistration(event); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 rounded-lg bg-blue-600 text-white">Register</button>
                                  </li>
                                ) : (
                                  <li>
                                    <div className="w-full text-left px-4 py-3 text-sm text-gray-500 rounded-lg">Registration closed</div>
                                  </li>
                                )
                              ) : null}

                              <li>
                                <div className="w-full text-left px-4 py-3 text-sm text-gray-400 rounded-lg">More actions coming</div>
                              </li>
                            </ul>

                          </div>
                        </div>
                      )}

                    </div>
                  </li>
                ))
              ) : (
                <div className="text-sm text-gray-500 p-3">No events for this date.</div>
              )}
            </ul>
          </>
        )}
      </div>{showMobileDetails && (
  <div className="block sm:hidden fixed inset-0 z-50 grid place-items-center bg-black/50" onClick={() => setShowMobileDetails(false)}>
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-4 mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="mobile-details-title">
      <div className="mb-2 flex items-center justify-between">
        <div id="mobile-details-title" className="text-sm font-semibold">Events on {selectedDateLabel || selectedDate.toDateString()}</div>
        <button onClick={() => setShowMobileDetails(false)} aria-label="Close" className="p-1 text-gray-600">✕</button>
      </div>

      {selectedDateEvents.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {selectedDateEvents.map(event => (
            <li key={event.id || event._id} className="relative flex flex-col sm:flex-row items-start justify-between py-3 gap-3">
              <button title="More" onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId === (event.id || event._id) ? null : (event.id || event._id));}} className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 text-gray-600 sm:static sm:p-2 sm:rounded-md">⋮</button>
              <div className="flex items-start gap-3 w-full">
                <div className={`w-1 h-8 rounded ${event.status === 'completed' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-orange-500' : event.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-600'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 sm:truncate">{event.title}</div>
                  <div className="text-xs text-gray-500">{event.startTime}{event.endTime ? ` • ${event.endTime}` : ''}</div>

                  <div className="text-xs text-gray-500 mt-1 sm:truncate">
                    {event.company && (<span className="block"><strong>Company:</strong> {event.company}</span>)}
                    {event.description && (<span className="block sm:truncate"><strong>Description:</strong> {event.description}</span>)}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                    <span className="w-full sm:w-auto"><strong>Registered:</strong> {event.participated ?? 0}</span>
                    <span className="w-full sm:w-auto"><strong>Selected:</strong> {event.placed ?? 0}</span>
                    <span className="w-full sm:w-auto"><strong>Venue:</strong> {event.venue || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:items-end items-stretch gap-2 w-full sm:w-auto">
                {event.status === 'scheduled' ? (
                  registeredEventIds.includes(event.id) || registeredEventIds.includes(event._id) ? (
                    <button disabled className="w-full sm:w-auto px-3 py-1 bg-green-200 text-green-700 rounded cursor-not-allowed">✅ Registered</button>
                  ) : canRegisterForEvent(event.startDate) ? (
                    <button onClick={(e)=>{e.stopPropagation(); handleOpenRegistration(event); setShowMobileDetails(false);}} className="w-full sm:w-auto px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all">Register</button>
                  ) : (
                    <span className="text-xs text-gray-500 italic">Registration closed</span>
                  )
                ) : null}

                <button title="More" onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId === (event.id || event._id) ? null : (event.id || event._id));}} className="w-full sm:w-auto mt-2 p-2 rounded-md hover:bg-gray-100 text-gray-600 text-center">⋮</button>

                {openMenuId === (event.id || event._id) && (
                  <div className="absolute right-4 top-8 z-50 bg-white border rounded shadow-md w-44">
                    <ul>
                      {event.externalLink ? (
                        <li>
                          <button onClick={(e)=>{e.stopPropagation(); window.open(event.externalLink,'_blank'); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Open External Link</button>
                        </li>
                      ) : null}

                      <li>
                        <button onClick={(e)=>{e.stopPropagation(); navigator.clipboard?.writeText(event.externalLink || ''); showToast('success','Link copied to clipboard'); setOpenMenuId(null);}} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Copy Link</button>
                      </li>

                      <li>
                        <div className="w-full text-left px-3 py-2 text-sm text-gray-400">More actions coming</div>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500 p-3">No events for this date.</div>
      )}

    </div>
  </div>
)}
{showRegistrationModal && (
  <CompanyRegistrationForm
  eventId={selectedEventId}
  onClose={() => setShowRegistrationModal(false)}
  tpoExternalLink={tpoExternalLink}
  onRegistered={(eventId) => {
    setRegisteredEventIds((prev) => [...prev, eventId]); // ✅ instantly disable button
    fetchRegisteredEvents(); // optional refresh
    setShowRegistrationModal(false);
  }}
/>

)}


    </div>
  );
};

export default StudentPlacementCalendar;
