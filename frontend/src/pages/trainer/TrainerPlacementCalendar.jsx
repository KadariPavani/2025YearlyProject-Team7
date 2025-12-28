import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const TrainerPlacementCalendar = () => {
  const [events, setEvents] = useState([]);
  // Start in loading state so the LoadingSkeleton is visible immediately on mount
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  // ✅ Fetch only events — no need for TPO ID
  useEffect(() => {
    fetchEvents();
  }, []);
const normalizeDate = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};


  const fetchEvents = async () => {
  setLoading(true);
  try {
    const res = await axios.get("http://localhost:5000/api/calendar", {
      headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
    });
    const data = res.data?.data || [];

    const today = normalizeDate(new Date());

const processedEvents = data.map((e) => {
  let computedStatus = e.status || "scheduled";

  const start = normalizeDate(e.startDate);
  const end = normalizeDate(e.endDate);

  if (today < start) {
    computedStatus = "upcoming";
  } else if (today > end) {
    computedStatus = "completed";
  } else {
    computedStatus = "ongoing";
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
        date: e.startDate?.split("T")[0],
        participated: e.eventSummary?.totalAttendees || 0,
        placed: e.eventSummary?.selectedStudents || 0,
targetGroup: e.targetGroup || "both",

      };
    });

    setEvents(processedEvents);

    // Update selected date events if there's a selected date
    const currentDateStr = selectedDate.toLocaleDateString("en-CA");
    const currentDateEvents = processedEvents.filter(e => e.date === currentDateStr);
    setSelectedDateEvents(currentDateEvents);
  } catch (err) {
    console.error("Error fetching events:", err);
  }
  setLoading(false);
};


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

  const getEventsForDate = (date) => {
    const dateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
    return events.filter((e) => e.date === dateStr);
  };

  // small helper for display (no logic change)
  const ordinal = (n) => {
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return `${n}st`;
    if (j === 2 && k !== 12) return `${n}nd`;
    if (j === 3 && k !== 13) return `${n}rd`;
    return `${n}th`;
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
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
                <div className="mx-3 text-base font-semibold text-gray-800">
                  {selectedDate.toLocaleString("default", { month: "long" })} {currentYear}
                </div>
                <button onClick={handleNextMonth} className="p-2 bg-white border rounded-full hover:bg-blue-100"><ChevronRight /></button>
              </div>

              {/* Weekday headings (compact) */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-blue-800 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dateEvents = getEventsForDate(day);
                  const today = normalizeDate(new Date());

                  return (
                    <div
                      key={day}
                      onClick={() => {
                        const dayEvents = getEventsForDate(day);
                        setSelectedDate(day);
                        setSelectedDateEvents(dayEvents);
                      }}
                      className={`border rounded-lg p-2 cursor-pointer transition-all h-24 flex flex-col ${
                        selectedDate.toDateString() === day.toDateString()
                          ? "bg-purple-50 border-purple-400 shadow-sm"
                          : "bg-white hover:shadow"
                      }`}
                    >
                      <span className="text-[12px] font-medium text-gray-700">{day.getDate()}</span>

                      {dateEvents.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1 items-start">
                          {dateEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              title={ev.title}
                              className={`w-2.5 h-2.5 rounded-full ${
                                ev.status === "completed"
                                  ? "bg-green-500"
                                  : ev.status === "ongoing"
                                  ? "bg-orange-500"
                                  : ev.status === "upcoming"
                                  ? "bg-blue-500"
                                  : ev.status === "cancelled"
                                  ? "bg-red-500"
                                  : "bg-purple-500"
                              }`}
                            />
                          ))}

                          {dateEvents.length > 2 && (
                            <div className="text-[10px] text-gray-500 mt-1">+{dateEvents.length - 2} more</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 mt-auto">No Events</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: details (hidden on small screens) */}
            <aside className="hidden sm:block w-full sm:w-3/5 sticky top-20 self-start">
              <div className="p-4 w-full border-l border-blue-50 pl-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-blue-500 font-medium">Events on</div>
                    <div className="text-2xl font-bold text-blue-800">{selectedDate.toLocaleString("default", { weekday: "long" })}, <span className="text-blue-600">{ordinal(selectedDate.getDate())}</span></div>
                  </div>
                </div>

                <div className="h-px bg-blue-50 mb-2" />

                {loading ? (
                  <div className="text-sm text-gray-500">Loading...</div>
                ) : selectedDateEvents.length === 0 ? (
                  <p className="text-gray-500 text-center">No events on this date.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {selectedDateEvents.map((event) => (
                      <li key={event.id} className="flex items-center justify-between py-3 relative">
                        <div className="flex items-start gap-3">
                          <div className={`px-3 py-2 rounded-lg ${event.status === "completed" ? "bg-green-50 text-green-700" : event.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-purple-50 text-purple-700"}`}>
                            {event.title.length > 24 ? event.title.slice(0, 24) + "…" : event.title}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">{event.company}</p>
                            <p className="text-xs text-gray-500 mt-1">{event.startDate?.split("T")[0]} • {event.startTime}</p>
                          </div>
                        </div>

                        <div className="text-[10px] text-gray-500 mt-1">{event.participated > 0 ? `${event.participated} participated` : "0"}</div>
                      </li>
                    ))}
                  </ul>
                )}

              </div>
            </aside>
          </div>

          {/* For small screens: show selected date details below */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 w-full max-w-[520px] mx-auto sm:hidden">
            <h2 className="text-xl font-bold text-purple-700 mb-4">Events on {selectedDate.toDateString()}</h2>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className={`border rounded-lg p-4 ${event.status === "completed" ? "bg-green-50 border-green-400" : event.status === "cancelled" ? "bg-red-50 border-red-400" : "bg-purple-50 border-purple-400"}`}>
                    <h3 className="font-semibold text-gray-800 text-lg">{event.status === "completed" ? "✅ " : ""}{event.title}</h3>
                    {event.company && <p className="text-sm text-gray-600 mt-1"><strong>Company:</strong> {event.company}</p>}
                    {event.description && <p className="text-sm text-gray-600 mt-1"><strong>Description:</strong> {event.description}</p>}
                    <p className="text-sm text-gray-600 mt-1"><strong>Start:</strong> {event.startDate?.split("T")[0]} {event.startTime}</p>
                    <p className="text-sm text-gray-600 mt-1"><strong>End:</strong> {event.endDate?.split("T")[0]} {event.endTime}</p>
                    <p className="text-sm text-gray-600 mt-1"><strong>Venue:</strong> {event.venue || "N/A"}</p>
                    <p className="text-sm text-gray-600 mt-1"><strong>Status:</strong> {event.status}</p>
                    <p className="text-sm text-gray-600 mt-1"><strong>Target Group:</strong> {event.targetGroup === "crt" ? "CRT Students" : event.targetGroup === "non-crt" ? "Non-CRT Students" : "Both CRT & Non-CRT Students"}</p>
                    {event.status === "completed" && (
                      <>
                        <p className="text-sm text-green-600 mt-2"><strong>Number of Students Participated:</strong> {event.participated > 0 ? `${event.participated} students` : "Not updated yet"}</p>
                        <p className="text-sm text-green-600 mt-1"><strong>Number of Students Placed:</strong> {event.placed > 0 ? `${event.placed} students` : "Not updated yet"}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No events on this date.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerPlacementCalendar;
