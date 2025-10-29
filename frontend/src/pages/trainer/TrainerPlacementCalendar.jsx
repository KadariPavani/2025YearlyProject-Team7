import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

const TrainerPlacementCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  // ✅ Fetch only events — no need for TPO ID
  useEffect(() => {
    fetchEvents();
  }, []);

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

      // ✅ Mark completed if endDate has passed
      if (computedStatus === "scheduled" && endDate < now) {
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
        date: e.startDate?.split("T")[0],
        participated: e.eventSummary?.totalAttendees || 0,
        placed: e.eventSummary?.selectedStudents || 0,
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
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => e.date === dateStr);
  };

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="text-purple-600 h-7 w-7" />
          <h1 className="text-2xl font-bold text-gray-800">Placement Calendar</h1>
        </div>
        <button
          onClick={fetchEvents}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
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
        <div className="grid grid-cols-7 gap-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600">{day}</div>
          ))}

          {days.map((day) => {
            const dateEvents = getEventsForDate(day);
            const today = new Date();
            const isPast = day < today && day.toDateString() !== today.toDateString();

            return (
              <div
                key={day}
                onClick={() => {
                  const dayEvents = getEventsForDate(day);
                  setSelectedDate(day);
                  setSelectedDateEvents(dayEvents);
                }}
                className={`border rounded-xl p-3 cursor-pointer transition-all ${
                  selectedDate.toDateString() === day.toDateString()
                    ? "bg-purple-100 border-purple-500 shadow-md"
                    : "bg-white hover:shadow-md"
                }`}
              >
                <span className="text-sm font-medium text-gray-700 mb-2">{day.getDate()}</span>
                {dateEvents.length > 0 ? (
                  <div className="space-y-1">
                    {dateEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`px-2 py-1 rounded text-xs truncate ${
                          ev.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : ev.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {ev.title}
                      </div>
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

      {/* Selected Date Details */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
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
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No events on this date.</p>
        )}
      </div>
    </div>
  );
};

export default TrainerPlacementCalendar;
