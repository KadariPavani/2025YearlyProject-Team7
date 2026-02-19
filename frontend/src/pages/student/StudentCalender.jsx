import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, List, X } from "lucide-react";
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
    // Exclude events that are explicitly deleted on the server
    const data = (res.data?.data || []).filter(e => e.status !== 'deleted');

    const now = new Date();
// Build processed events: normalize status, compute local date (yyyy-mm-dd), and dedupe by id
const mapped = data.map((e) => {
  let computedStatus = e.status || "scheduled";
  const endDate = e.endDate ? new Date(e.endDate) : null;

  // Normalize dates to ignore time component
  const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Mark completed if endDate is before today
  if (computedStatus === "scheduled" && endDateOnly && endDateOnly < todayOnly) {
    computedStatus = "completed";
  }

  // Compute local yyyy-mm-dd for startDate without using toISOString (avoids timezone shifts)
  const startLocal = parseLocalDate(e.startDate);
  const dateStr = startLocal ? `${startLocal.getFullYear()}-${String(startLocal.getMonth() + 1).padStart(2, '0')}-${String(startLocal.getDate()).padStart(2, '0')}` : (e.startDate?.split('T')[0] || '');

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
    date: dateStr,

    participated: e.eventSummary?.totalAttendees || 0,
    placed: e.eventSummary?.selectedStudents || 0,
    externalLink: e.companyDetails?.externalLink || "",
    targetGroup: e.targetGroup || "both",
    isEligible: e.isEligible !== undefined ? e.isEligible : true,
  };
});

// Deduplicate by id (in-case backend returns duplicates)
const seen = new Map();
const processedEvents = [];
for (const ev of mapped) {
  if (!ev || !ev.id) continue;
  if (!seen.has(ev.id)) {
    seen.set(ev.id, true);
    processedEvents.push(ev);
  } else {
    console.warn('Duplicate event id filtered:', ev.id);
  }
}

setEvents(processedEvents);
// Auto-select ongoing or today's events to mimic TPO behavior
autoSelectOngoingDate(processedEvents);

// Update selected date events if there's a selected date using robust date normalization
const sel = normalizeDate(selectedDate);
const currentDateEvents = processedEvents.filter((e) => {
  const start = normalizeDate(e.startDate || e.date);
  const end = e.endDate ? normalizeDate(e.endDate) : start;
  return sel.getTime() >= start.getTime() && sel.getTime() <= end.getTime();
});
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

  // Refresh when other parts of app (eg. TPO) update calendar
  const onCalendarUpdated = () => {
    console.log('📣 calendarUpdated event received — refreshing student calendar');
    fetchEvents();
  };

  window.addEventListener('calendarUpdated', onCalendarUpdated);
  return () => {
    window.removeEventListener('calendarUpdated', onCalendarUpdated);
  };
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
    <div className="space-y-4">
      {toast && (
        <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Placement Calendar</h2>
          <p className="text-xs text-gray-500 mt-0.5">{events.length} events</p>
        </div>
        <div className="relative flex items-center gap-2">
          <div>
            <button
              onClick={() => setShowRegistered(!showRegistered)}
              className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Registered</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">{registeredEvents.length}</span>
            </button>

            {/* Desktop dropdown */}
            {showRegistered && (
              <div className="hidden sm:block absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Registered Events</span>
                  <button onClick={() => setShowRegistered(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                </div>
                {registeredEvents.length > 0 ? (
                  <ul className="max-h-60 overflow-y-auto">
                    {registeredEvents.map((ev) => (
                      <li
                        key={ev._id}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                        onClick={() => {
                          const eventDate = normalizeDate(new Date(ev.startDate));
                          setSelectedDate(eventDate);
                          setSelectedDateLabel(eventDate.toDateString());
                          setSelectedDateEvents(getEventsForDate(eventDate));
                          setShowRegistered(false);
                        }}
                      >
                        <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-500">{new Date(ev.startDate).toLocaleDateString()}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center p-3 text-xs">No registered events yet.</p>
                )}
              </div>
            )}

            {/* Mobile dropdown — directly under button */}
            {showRegistered && (
              <>
                <div className="sm:hidden fixed inset-0 z-20" onClick={() => setShowRegistered(false)} />
                <div className="sm:hidden absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-[50vh] overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Registered ({registeredEvents.length})</span>
                    <button onClick={() => setShowRegistered(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  {registeredEvents.length > 0 ? (
                    <ul className="max-h-[40vh] overflow-y-auto divide-y divide-gray-100">
                      {registeredEvents.map((ev) => (
                        <li
                          key={ev._id}
                          className="px-3 py-2.5 hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                          onClick={() => {
                            const eventDate = normalizeDate(new Date(ev.startDate));
                            setSelectedDate(eventDate);
                            setSelectedDateLabel(eventDate.toDateString());
                            setSelectedDateEvents(getEventsForDate(eventDate));
                            setShowRegistered(false);
                          }}
                        >
                          <p className="text-xs font-medium text-gray-800 truncate">{ev.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{new Date(ev.startDate).toLocaleDateString()}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-xs">No registered events yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => { fetchEvents(); fetchRegisteredEvents(); }}
            className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
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
                                  className={`inline-block flex-shrink-0 w-1.5 h-1.5 rounded-full shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 ${ev.status === 'completed' ? 'bg-green-500' : ev.status === 'ongoing' ? 'bg-orange-500' : (ev.status === 'cancelled' || ev.status === 'deleted') ? 'bg-red-500' : 'bg-blue-600'}`}
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
                          <div className={`w-1 h-8 rounded ${event.status === 'completed' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-orange-500' : (event.status === 'cancelled' || event.status === 'deleted') ? 'bg-red-500' : 'bg-blue-600'}`} />
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

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {event.status === 'scheduled' ? (
                            registeredEventIds.includes(event.id) ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Registered</span>
                            ) : !event.isEligible ? (
                              <span className="px-2.5 py-1 bg-gray-200 text-gray-500 rounded text-xs cursor-not-allowed">Not Eligible</span>
                            ) : canRegisterForEvent(event.startDate) ? (
                              <button onClick={(e)=>{e.stopPropagation(); handleOpenRegistration(event);}} className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Register</button>
                            ) : (
                              <span className="text-xs text-gray-500 italic">Closed</span>
                            )
                          ) : null}
                          {event.externalLink && (
                            <button onClick={(e)=>{e.stopPropagation(); window.open(event.externalLink,'_blank');}} className="text-xs text-blue-600 hover:underline">External Link</button>
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

      {/* Mobile: events for selected date — full details inline */}
      <div className="sm:hidden bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <ListSkeleton />
        ) : (
          <>
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {selectedDate.toLocaleString('default', { weekday: 'short' })}, {ordinal(selectedDate.getDate())} {selectedDate.toLocaleString('default', { month: 'short' })}
              </h3>
              <span className="text-xs text-gray-500">{selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="p-4">
              {selectedDateEvents.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {selectedDateEvents.map((event) => {
                    const eid = event.id || event._id;
                    return (
                      <li key={eid} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className={`w-1.5 h-12 rounded shrink-0 ${event.status === 'completed' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-orange-500' : (event.status === 'cancelled' || event.status === 'deleted') ? 'bg-red-500' : 'bg-blue-600'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</p>
                            {event.company && <p className="text-xs text-gray-600 mt-1.5"><strong>Company:</strong> {event.company}</p>}
                            {event.description && <p className="text-xs text-gray-500 mt-1">{event.description}</p>}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                              <span>Registered: {event.participated ?? 0}</span>
                              <span>Selected: {event.placed ?? 0}</span>
                              <span>Venue: {event.venue || 'N/A'}</span>
                            </div>

                            <div className="flex flex-wrap gap-2.5 mt-3">
                              {event.status === 'scheduled' && (
                                registeredEventIds.includes(eid) ? (
                                  <span className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded font-medium">Registered</span>
                                ) : !event.isEligible ? (
                                  <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded font-medium cursor-not-allowed">Not Eligible</span>
                                ) : canRegisterForEvent(event.startDate) ? (
                                  <button onClick={() => handleOpenRegistration(event)} className="text-xs text-white bg-blue-600 px-3 py-1 rounded font-medium hover:bg-blue-700">Register</button>
                                ) : (
                                  <span className="text-xs text-gray-500 italic">Registration closed</span>
                                )
                              )}
                              {event.externalLink && (
                                <button onClick={() => window.open(event.externalLink, '_blank')} className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded font-medium hover:bg-blue-100">External Link</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">No events for this date.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Registration Form */}
      {showRegistrationModal && (
        <CompanyRegistrationForm
          eventId={selectedEventId}
          onClose={() => setShowRegistrationModal(false)}
          tpoExternalLink={tpoExternalLink}
          onRegistered={(eventId) => {
            setRegisteredEventIds((prev) => [...prev, eventId]);
            fetchRegisteredEvents();
            setShowRegistrationModal(false);
          }}
        />
      )}

    </div>
  );
};

export default StudentPlacementCalendar;
