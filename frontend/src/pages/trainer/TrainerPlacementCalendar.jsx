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
  const [selectedDateLabel, setSelectedDateLabel] = useState("");

  // ✅ Fetch only events — no need for TPO ID
  useEffect(() => {
    fetchEvents();

    const onCalendarUpdated = () => {
      console.log('📣 calendarUpdated received on trainer calendar — refreshing');
      fetchEvents();
    };
    window.addEventListener('calendarUpdated', onCalendarUpdated);
    return () => window.removeEventListener('calendarUpdated', onCalendarUpdated);
  }, []);

  // Keep display label in sync
  useEffect(() => {
    setSelectedDateLabel(selectedDate.toDateString());
  }, [selectedDate]);

const normalizeDate = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

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



// Safe date click handler — keeps UI-only behavior (no logic changes)
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
};


  const fetchEvents = async () => {
  setLoading(true);
  try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/calendar`, {
    });
    // Exclude deleted events and normalize data
    const data = (res.data?.data || []).filter(e => e.status !== 'deleted');

    const today = normalizeDate(new Date());

    const mapped = data.map((e) => {
      let computedStatus = e.status || "scheduled";

      const start = e.startDate ? normalizeDate(e.startDate) : null;
      const end = e.endDate ? normalizeDate(e.endDate) : start;

      if (!start) {
        computedStatus = e.status || 'scheduled';
      } else if (today < start) {
        computedStatus = "upcoming";
      } else if (today > end) {
        computedStatus = "completed";
      } else {
        computedStatus = "ongoing";
      }

      // Build YYYY-MM-DD using local date (no timezone conversion)
      const dateObj = start || new Date(e.startDate || new Date());
      const dateStr = dateObj
        ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
        : (e.startDate?.split("T")[0] || '');

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
        targetGroup: e.targetGroup || "both",
      };
    });

    // Deduplicate
    const seen = new Map();
    const processedEvents = [];
    for (const ev of mapped) {
      if (!ev || !ev.id) continue;
      if (!seen.has(ev.id)) {
        seen.set(ev.id, true);
        processedEvents.push(ev);
      }
    }

    setEvents(processedEvents);

    // Update selected date events if there's a selected date using normalized compare
    const sel = normalizeDate(selectedDate);
    const currentDateEvents = processedEvents.filter((e) => {
      const start = e.startDate ? normalizeDate(e.startDate) : normalizeDate(e.date);
      const end = e.endDate ? normalizeDate(e.endDate) : start;
      return sel.getTime() >= start.getTime() && sel.getTime() <= end.getTime();
    });
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

  // Build calendar cells after currentYear/currentMonth are available
  const calendarCells = buildCalendarCells(currentYear, currentMonth);

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
                <div onClick={() => {}} className="mx-3 cursor-pointer text-base font-semibold text-gray-800 hover:text-blue-600 transition-all">
                  {selectedDate.toLocaleString("default", { month: "long" })} {currentYear}
                </div>
                <button onClick={handleNextMonth} className="p-2 bg-white border rounded-full hover:bg-blue-100"><ChevronRight /></button>
              </div>

              {/* Weekday headings */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-blue-800 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-[10px] bg-blue-50 rounded-sm py-0.5">{day}</div>
                ))}
              </div>

              {/* Responsive calendar grid (fixed 6 rows, square cells) */}
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
                          {/* Mobile dots */}
                          <div className="sm:hidden flex items-center justify-start gap-1 mt-0.5">
                            <div className="flex items-start justify-start gap-0.5">
                              {dateEvents.slice(0, 3).map((ev, i) => (
                                <span key={i} className={`inline-block flex-shrink-0 w-1 h-1 rounded-full shadow-sm ${ev.status === 'completed' ? 'bg-green-500' : ev.status === 'ongoing' ? 'bg-orange-500' : (ev.status === 'cancelled' || ev.status === 'deleted') ? 'bg-red-500' : 'bg-blue-600'}`} />
                              ))}
                            </div>
                          </div>

                          {/* Desktop preview */}
                          <div className="hidden sm:flex sm:flex-col sm:gap-1">
                            {dateEvents.slice(0, 1).map((ev) => (
                              <div
                                key={ev.id}
                                className={`text-[10px] rounded px-1 py-0.5 ${ev.status === 'completed' ? 'bg-green-50 text-green-700' : ev.status === 'ongoing' ? 'bg-orange-50 text-orange-700' : (ev.status === 'cancelled' || ev.status === 'deleted') ? 'bg-red-50 text-red-700' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
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
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-blue-500 font-medium">{selectedDateLabel ? 'Events on' : ''}</div>
                    <div className="text-2xl font-bold text-blue-800">{selectedDate.toLocaleString("default", { weekday: "long" })}, <span className="text-blue-600">{ordinal(selectedDate.getDate())}</span></div>
                  </div>
                </div>

                <div className="h-px bg-blue-50 mb-2" />

                {loading ? (
                  <div className="text-sm text-gray-500">Loading...</div>
                ) : selectedDateEvents.length === 0 ? (
                  <p className="text-gray-500 text-center">No events for this date.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {selectedDateEvents.map((event) => (
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

                        {/* <div className="flex items-center gap-2">
                          <button title="More" className="p-2 rounded-md hover:bg-gray-100 text-gray-600">⋮</button>
                        </div> */}

                      </li>
                    ))}
                  </ul>
                )}

              </div>
            </aside>

          </div>

          {/* Selected Date Event Details (mobile only) */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-3 w-full max-w-[560px] mx-auto border border-blue-100 block sm:hidden">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
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
                          <button title="More" className="p-2 rounded-md hover:bg-gray-100 text-gray-600">⋮</button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 p-3">No events for this date.</div>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerPlacementCalendar;
