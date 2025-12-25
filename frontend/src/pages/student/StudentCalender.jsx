import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import CompanyRegistrationForm from "./CompanyRegistrationForm"; // Adjust path as needed

const StudentPlacementCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
const [showRegistrationModal, setShowRegistrationModal] = useState(false);
const [selectedEventId, setSelectedEventId] = useState(null);
const [tpoExternalLink, setTpoExternalLink] = useState("");
const [studentData, setStudentData] = useState(null);
const [registeredEvents, setRegisteredEvents] = useState([]);
const [showRegistered, setShowRegistered] = useState(false);
const [registeredEventIds, setRegisteredEventIds] = useState([]);

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
      const res = await axios.get("http://localhost:5000/api/student/profile", {
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
    const res = await axios.get("http://localhost:5000/api/calendar", {
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

    // Update selected date events if there's a selected date
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    const currentDateEvents = processedEvents.filter(e => e.date === currentDateStr);
    setSelectedDateEvents(currentDateEvents);
  } catch (err) {
    console.error("Error fetching events:", err);
  }
  setLoading(false);
};

// ✅ Fetch registered events
const fetchRegisteredEvents = async () => {
  const token = localStorage.getItem("userToken");
  if (!token) return;

  try {
    const res = await axios.get("http://localhost:5000/api/calendar/registered", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const events = res.data?.data || [];
    console.log("✅ Registered events fetched:", events);

    // ✅ Store both event IDs and event data
    const registeredIds = events.map((event) => event._id?.toString());
    setRegisteredEventIds(registeredIds);
    setRegisteredEvents(events);
  } catch (err) {
    console.error("❌ Error fetching registered events:", err);
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
    const dateStr = date.toISOString().split("T")[0];
// ✅ No need to filter by batch type here — backend already filters
return events.filter((e) => e.date === dateStr);


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
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
{/* Header */}
<div className="flex justify-between items-center mb-8">
  {/* Left side - Title */}
  <div className="flex items-center gap-3">
    <Calendar className="text-purple-600 h-7 w-7" />
    <h1 className="text-2xl font-bold text-gray-800">Placement Calendar</h1>
  </div>

  {/* Right side - Registered Events + Refresh */}
  <div className="flex items-center gap-4 relative">
    {/* ✅ Registered Events Dropdown on Click */}
    <div className="relative">
      <button
        onClick={() => setShowRegistered(!showRegistered)}
        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition"
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
                  className="px-3 py-2 border-b hover:bg-purple-50 cursor-pointer"
                  onClick={() => {
                    const eventDate = new Date(ev.startDate);
                    setSelectedDate(eventDate);
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
                    setShowRegistered(false); // Close dropdown
                  }}
                >
                  <p className="font-medium text-gray-800 truncate">{ev.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(ev.startDate).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center p-3 text-sm">
              No registered events yet.
            </p>
          )}
        </div>
      )}
    </div>

    {/* 🔁 Refresh Button */}
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
</div>



      {/* Month Controls */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 bg-white border rounded-full hover:bg-purple-100">
          <ChevronLeft />
        </button>
        <div className="text-lg font-semibold text-gray-800">
          {selectedDate.toLocaleString("default", { month: "long" })} {currentYear}
        </div>
        <button onClick={handleNextMonth} className="p-2 bg-white border rounded-full hover:bg-purple-100">
          <ChevronRight />
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <p className="text-center text-gray-500">Loading events...</p>
      ) : (
        <div className="w-full max-w-[520px] mx-auto">
          <div className="grid grid-cols-7 gap-2 text-center font-semibold text-gray-600 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-[10px] sm:text-xs">{day}</div>
            ))}
          </div>

          <div className="aspect-square w-full grid grid-rows-6 grid-cols-7 gap-2">
            {calendarCells.map((cellDate, idx) => {
              if (!cellDate) return <div key={idx} className="bg-gray-50 border rounded-lg"></div>;

              const dateEvents = getEventsForDate(cellDate);
              const isSelected = selectedDate.toDateString() === cellDate.toDateString();
              const isToday = new Date().toDateString() === cellDate.toDateString();

              return (
                <div
                  key={idx}
                  onClick={() => {
                    const dayEvents = getEventsForDate(cellDate);
                    setSelectedDate(cellDate);
                    setSelectedDateEvents(dayEvents);
                  }}
                  className={`border rounded-lg p-2 cursor-pointer transition-all flex flex-col ${isSelected ? "bg-purple-100 border-purple-500 shadow-md" : "bg-white hover:shadow"} ${isToday ? "ring-2 ring-indigo-200" : ""}`}>

                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium text-gray-700">{cellDate.getDate()}</span>
                    {dateEvents.length > 0 && <span className="text-[10px] px-1 py-0.5 rounded bg-purple-600 text-white">{dateEvents.length}</span>}
                  </div>

                  <div className="flex-1 mt-1 overflow-hidden">
                    {dateEvents.slice(0, 2).map((ev) => (
                      <div key={ev.id} className={`text-xs truncate rounded px-1 py-0.5 ${ev.status === "completed" ? "bg-green-50 text-green-700" : ev.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-purple-50 text-purple-700"}`}>{ev.title.length > 24 ? ev.title.slice(0, 24) + "…" : ev.title}</div>
                    ))}
                    {dateEvents.length > 2 && <div className="text-[10px] text-gray-500">+{dateEvents.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6 w-full max-w-[520px] mx-auto">
        <h2 className="text-xl font-bold text-purple-700 mb-4">
          Events on {selectedDate.toDateString()}
        </h2>
        {selectedDateEvents.length > 0 ? (
          <div className="space-y-4">
            {selectedDateEvents.map((event) => (
              <div
                key={event.id}
                className={`border rounded-lg p-4 ${
                  event.status === "completed"
                    ? "bg-green-50 border-green-400"
                    : event.status === "cancelled"
                    ? "bg-red-50 border-red-400"
                    : "bg-purple-50 border-purple-400"
                }`}
              >
                <h3 className="font-semibold text-gray-800 text-lg">
  {event.status === "completed" ? "✅ " : ""}{event.title}
</h3>

{/* 🎯 Show which group the event is for */}
<p className="text-xs mt-1 text-gray-500">
  🎯 Target Group:
  {event.targetGroup === "crt"
    ? " CRT Students"
    : event.targetGroup === "non-crt"
    ? " Non-CRT Students"
    : " Both Groups"}
</p>

{event.company && (
  <p className="text-sm text-gray-600 mt-1">
    <strong>Company:</strong> {event.company}
  </p>
)}

                {event.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Description:</strong> {event.description}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Start:</strong> {event.startDate?.split("T")[0]} {event.startTime}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>End:</strong> {event.endDate?.split("T")[0]} {event.endTime}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Venue:</strong> {event.venue || "N/A"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Status:</strong> {event.status}
                </p>

                {/* Show participation stats for completed events */}
                {event.status === "completed" && (
                  <>
                    <p className="text-sm text-green-600 mt-2">
                      <strong>Number of Students Participated:</strong>{" "}
                      {event.participated > 0 ? `${event.participated} students` : "Not updated yet"}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      <strong>Number of Students Placed:</strong>{" "}
                      {event.placed > 0 ? `${event.placed} students` : "Not updated yet"}
                    </p>
                  </>
                )}
{event.status === "scheduled" && (
  <>
    {registeredEventIds.includes(event.id) ? (
      // ✅ Already registered — disable button
      <button
        disabled
        className="px-3 py-1 bg-green-200 text-green-700 rounded cursor-not-allowed"
      >
        ✅ Registered
      </button>
    ) : canRegisterForEvent(event.startDate) ? (
      // 🟦 Allow registration
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleOpenRegistration(event);
        }}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all"
      >
        Register
      </button>
    ) : (
      // ⚪ Registration closed
      <p className="text-gray-500 text-sm mt-2 italic">
        Registration closed
      </p>
    )}
  </>
)}


              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No events on this date.</p>
        )}
      </div>
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
