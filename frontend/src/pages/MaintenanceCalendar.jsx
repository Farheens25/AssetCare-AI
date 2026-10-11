import { useEffect, useState } from "react";
import {
  FiSearch,
  FiMoon,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { supabase } from "../lib/supabase";

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

function MaintenanceCalendar() {
  const navigate = useNavigate();

  // ---------------------------------------
  // SIDEBAR
  // ---------------------------------------

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ---------------------------------------
  // USER AND ASSETS
  // ---------------------------------------

  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------
  // CURRENT CALENDAR DATE
  // ---------------------------------------

  const [currentDate, setCurrentDate] = useState(
    new Date(2026, 8, 1)
  );

  // ---------------------------------------
  // LOAD USER AND ASSETS
  // ---------------------------------------

  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setLoading(true);

        // Get logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        // If user is not logged in
        if (!user) {
          navigate("/login");
          return;
        }

        // Get only the logged-in user's assets
        const { data, error: assetsError } = await supabase
          .from("assets")
          .select("*")
          .eq("user_id", user.id);

        if (assetsError) {
          throw assetsError;
        }

        setUser(user);
        setAssets(data || []);
      } catch (error) {
        console.error("Calendar error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, [navigate]);

  // ---------------------------------------
  // CALENDAR INFORMATION
  // ---------------------------------------

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  // ---------------------------------------
  // CREATE CALENDAR EVENTS FROM USER ASSETS
  // ---------------------------------------

  const calendarEvents = {};

  assets.forEach((asset) => {
    // We only create an event if warranty expiry exists
    if (!asset.warranty_expiry) {
      return;
    }

    const warrantyDate = new Date(
      asset.warranty_expiry
    );

    const eventYear = warrantyDate.getFullYear();
    const eventMonth = warrantyDate.getMonth();
    const eventDay = warrantyDate.getDate();

    // Only show event in the correct month
    if (
      eventYear === year &&
      eventMonth === month
    ) {
      calendarEvents[eventDay] = {
        label: `${asset.product_name || "Asset"} Warranty`,
        type: "warranty",
      };
    }
  });

  // ---------------------------------------
  // PREVIOUS MONTH
  // ---------------------------------------

  const previousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    );
  };

  // ---------------------------------------
  // NEXT MONTH
  // ---------------------------------------

  const nextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    );
  };

  // ---------------------------------------
  // TODAY
  // ---------------------------------------

  const goToToday = () => {
    const today = new Date();

    setCurrentDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );
  };

  // ---------------------------------------
  // CALENDAR DAYS
  // ---------------------------------------

  const calendarDays = [];

  // Empty spaces before first day
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Actual days
  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    calendarDays.push(day);
  }

  // ---------------------------------------
  // USER NAME
  // ---------------------------------------

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  // ---------------------------------------
  // USER INITIALS
  // ---------------------------------------

  const userInitials = userName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ---------------------------------------
  // LOADING SCREEN
  // ---------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            Loading your calendar...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------
  // MAIN PAGE
  // ---------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <div className="lg:ml-72">

        {/* =====================================
            TOP NAVBAR
        ===================================== */}

        <header className="sticky top-0 z-30 flex h-[70px] items-center gap-4 border-b border-slate-200 bg-white px-5">

          {/* Mobile menu */}

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
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

          {/* =================================
              NOTIFICATION
          ================================= */}

          <button
            type="button"
            onClick={() =>
              navigate("/notifications")
            }
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <FiBell size={19} />

            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
          </button>

          {/* =================================
              USER PROFILE
          ================================= */}

          <button
            type="button"
            onClick={() =>
              navigate("/profile")
            }
            className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1.5 transition hover:bg-slate-50"
          >

            {/* User initials */}

            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              {userInitials}
            </span>

            {/* User name */}

            <span className="hidden text-sm font-semibold text-slate-700 md:block">
              {userName}
            </span>

          </button>

        </header>

        {/* =====================================
            PAGE
        ===================================== */}

        <main className="min-h-[calc(100vh-70px)] bg-gradient-to-br from-blue-50 via-white to-slate-50 px-5 py-8 lg:px-9">

          <div className="mx-auto max-w-7xl">

            {/* =================================
                HEADING
            ================================= */}

            <div className="mb-7">

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Maintenance Calendar
              </h1>

              <p className="mt-2 text-sm text-slate-500 md:text-base">
                Track your asset warranties and important dates.
              </p>

            </div>

            {/* =================================
                CALENDAR CARD
            ================================= */}

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">

              {/* Calendar Header */}

              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    {months[month]} {year}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Warranty dates from your assets
                  </p>

                </div>

                {/* Calendar controls */}

                <div className="flex items-center gap-2">

                  {/* Previous */}

                  <button
                    type="button"
                    onClick={previousMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <FiChevronLeft size={18} />
                  </button>

                  {/* Today */}

                  <button
                    type="button"
                    onClick={goToToday}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Today
                  </button>

                  {/* Next */}

                  <button
                    type="button"
                    onClick={nextMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <FiChevronRight size={18} />
                  </button>

                </div>

              </div>

              {/* =================================
                  WEEK NAMES
              ================================= */}

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

              {/* =================================
                  CALENDAR
              ================================= */}

              <div className="grid grid-cols-7 gap-2">

                {calendarDays.map(
                  (day, index) => {

                    // Get event for this day
                    const event =
                      day
                        ? calendarEvents[day]
                        : null;

                    return (
                      <div
                        key={index}
                        className="min-h-[90px] rounded-2xl border border-slate-200 bg-white p-2 transition hover:border-blue-200 hover:bg-slate-50 md:min-h-[105px]"
                      >

                        {day && (
                          <>
                            {/* Day number */}

                            <div className="text-xs font-semibold text-slate-700">
                              {day}
                            </div>

                            {/* User asset warranty */}

                            {event && (
                              <div className="mt-5 inline-flex max-w-full rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700 md:text-xs">

                                <span className="truncate">
                                  {event.label}
                                </span>

                              </div>
                            )}

                          </>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

              {/* =================================
                  NO EVENTS MESSAGE
              ================================= */}

              {Object.keys(calendarEvents).length ===
                0 && (
                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  No warranty events for this month.
                </div>
              )}

            </section>

          </div>

        </main>

      </div>

    </div>
  );
}

export default MaintenanceCalendar;