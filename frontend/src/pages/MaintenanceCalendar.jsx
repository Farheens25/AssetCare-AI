import { useState } from "react";
import {
  FiSearch,
  FiMoon,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const eventData = {
  14: {
    label: "RO filter",
    type: "completed",
  },
  18: {
    label: "AC Warranty",
    type: "warranty",
  },
  22: {
    label: "LG Service",
    type: "service",
  },
  27: {
    label: "Insurance",
    type: "insurance",
  },
};

function MaintenanceCalendar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(
    new Date(2026, 8, 1)
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-[70px] items-center gap-4 border-b border-slate-200 bg-white px-5">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            ☰
          </button>

          {/* Search */}
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />

            <input
              type="text"
              placeholder="Search bills, warranties, serial numbers..."
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Dark mode */}
          <button
            type="button"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:flex"
          >
            <FiMoon size={19} />
          </button>

          {/* Notification */}
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <FiBell size={19} />

            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
          </button>

          {/* User */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1.5 transition hover:bg-slate-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              AS
            </span>

            <span className="hidden text-sm font-semibold text-slate-700 md:block">
              Aarav
            </span>
          </button>
        </header>

        {/* Page */}
        <main className="min-h-[calc(100vh-70px)] bg-gradient-to-br from-blue-50 via-white to-slate-50 px-5 py-8 lg:px-9">
          {/* Heading */}
          <div className="mx-auto max-w-7xl">
            <div className="mb-7">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Maintenance Calendar
              </h1>

              <p className="mt-2 text-sm text-slate-500 md:text-base">
                Color-coded services, warranty expiries and repairs.
              </p>
            </div>

            {/* Calendar Card */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              {/* Calendar Header */}
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {months[month]} {year}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Blue: service · Amber: warranty · Green: completed ·
                    Red: insurance
                  </p>
                </div>

                {/* Calendar controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={previousMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <FiChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={goToToday}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={nextMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <FiChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Week names */}
              <div className="mb-2 grid grid-cols-7 gap-2">
                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-xs font-bold text-slate-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const event =
                    day && year === 2026 && month === 8
                      ? eventData[day]
                      : null;

                  return (
                    <div
                      key={index}
                      className="min-h-[90px] rounded-2xl border border-slate-200 bg-white p-2 transition hover:border-blue-200 hover:bg-slate-50 md:min-h-[105px]"
                    >
                      {day && (
                        <>
                          <div className="text-xs font-semibold text-slate-700">
                            {day}
                          </div>

                          {event && (
                            <div
                              className={`mt-5 inline-flex max-w-full rounded-full px-2 py-1 text-[10px] font-bold md:text-xs ${
                                event.type === "service"
                                  ? "bg-blue-100 text-blue-700"
                                  : event.type === "warranty"
                                  ? "bg-amber-100 text-amber-700"
                                  : event.type === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              <span className="truncate">
                                {event.label}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MaintenanceCalendar;