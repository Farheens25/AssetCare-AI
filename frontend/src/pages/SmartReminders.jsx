
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiBell,
  FiRefreshCw,
  FiCalendar,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiMail,
} from "react-icons/fi";

import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { supabase } from "../lib/supabase";

function SmartReminders() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadAssets() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error: assetsError } = await supabase
        .from("assets")
        .select(
          "id, user_id, product_name, brand, category, warranty_expiry"
        )
        .eq("user_id", user.id)
        .order("warranty_expiry", { ascending: true });

      if (assetsError) throw assetsError;

      setAssets(data || []);
    } catch (err) {
      console.error("Smart Reminders error:", err);
      setError(err.message || "Unable to load warranty reminders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
  }, []);

  function getDateDifference(expiryDate) {
    const today = new Date();
    const expiry = new Date(`${expiryDate}T00:00:00`);

    today.setHours(0, 0, 0, 0);

    return Math.round(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  function formatDate(date) {
    if (!date) return "Not available";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const reminders = assets
    .filter((asset) => asset.warranty_expiry)
    .map((asset) => {
      const daysLeft = getDateDifference(asset.warranty_expiry);

      let status = "upcoming";
      let reminderDate = null;
      let reminderDays = null;

      if (daysLeft < 0) {
        status = "expired";
      } else if (daysLeft === 0) {
        status = "today";
      } else if (daysLeft <= 5) {
        status = "due-soon";
        reminderDays = 5;
      } else if (daysLeft <= 15) {
        status = "due-soon";
        reminderDays = 15;
      } else if (daysLeft <= 30) {
        status = "upcoming";
        reminderDays = 30;
      }

      if (reminderDays !== null) {
        reminderDate = new Date(
          `${asset.warranty_expiry}T00:00:00`
        );
        reminderDate.setDate(reminderDate.getDate() - reminderDays);
      }

      return {
        ...asset,
        daysLeft,
        status,
        reminderDays,
        reminderDate,
      };
    });

  const filteredReminders = reminders.filter((reminder) => {
    if (filter === "all") return true;
    if (filter === "due-soon") return reminder.status === "due-soon";
    if (filter === "upcoming") return reminder.status === "upcoming";
    if (filter === "expired") return reminder.status === "expired";
    if (filter === "today") return reminder.status === "today";

    return true;
  });

  const dueSoonCount = reminders.filter(
    (item) => item.status === "due-soon" || item.status === "today"
  ).length;

  const upcomingCount = reminders.filter(
    (item) => item.status === "upcoming"
  ).length;

  const expiredCount = reminders.filter(
    (item) => item.status === "expired"
  ).length;

  function getStatusLabel(reminder) {
    if (reminder.status === "expired") return "Warranty expired";
    if (reminder.status === "today") return "Expires today";
    if (reminder.status === "due-soon") return "Due soon";
    return "Upcoming";
  }

  function getStatusStyle(reminder) {
    if (reminder.status === "expired") {
      return "bg-red-50 text-red-700";
    }

    if (reminder.status === "today" || reminder.status === "due-soon") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-blue-50 text-blue-700";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <FiMenu size={22} />
            </button>

            <Link
              to="/dashboard"
              className="text-xl font-bold text-blue-600"
            >
              AssetCare-AI
            </Link>
          </div>

          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="rounded-full border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
            aria-label="Notifications"
          >
            <FiBell size={18} />
          </button>
        </header>

        <main className="mx-auto max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-600">
                Care / Smart Reminders
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Smart Reminders
              </h1>

              <p className="mt-2 text-slate-500">
                Keep track of your warranty expiry dates and upcoming alerts.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAssets}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <FiMail className="mt-1 text-blue-600" size={20} />
              <div>
                <p className="font-semibold text-blue-900">
                  Email reminders are not configured yet
                </p>
                <p className="mt-1 text-sm text-blue-800">
                  Warranty dates are calculated from your saved assets.
                  Automatic email delivery for the owner and eligible family
                  members will be connected after the email service is set up.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
              <button
                type="button"
                onClick={loadAssets}
                className="ml-3 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <FiCalendar className="mb-4 text-blue-600" size={24} />
              <p className="text-sm text-slate-500">Total warranties</p>
              <p className="mt-1 text-3xl font-bold">{reminders.length}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <FiAlertCircle className="mb-4 text-amber-600" size={24} />
              <p className="text-sm text-slate-500">Due soon</p>
              <p className="mt-1 text-3xl font-bold">{dueSoonCount}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <FiClock className="mb-4 text-blue-600" size={24} />
              <p className="text-sm text-slate-500">Upcoming</p>
              <p className="mt-1 text-3xl font-bold">{upcomingCount}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <FiPackage className="mb-4 text-red-600" size={24} />
              <p className="text-sm text-slate-500">Expired warranties</p>
              <p className="mt-1 text-3xl font-bold">{expiredCount}</p>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Warranty reminders
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Calculated from the expiry dates saved in My Assets.
                </p>
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                aria-label="Filter warranty reminders"
              >
                <option value="all">All warranties</option>
                <option value="due-soon">Due soon</option>
                <option value="upcoming">Upcoming</option>
                <option value="today">Expires today</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500">
                Loading warranty reminders...
              </div>
            ) : filteredReminders.length === 0 ? (
              <div className="p-10 text-center">
                <FiCheckCircle
                  className="mx-auto mb-3 text-slate-300"
                  size={36}
                />
                <p className="font-medium text-slate-700">
                  No warranties found in this filter
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Add an asset with a warranty expiry date to see its reminders.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex flex-col gap-4 p-5 md:flex-row md:items-center"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FiPackage size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {reminder.product_name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {[reminder.brand, reminder.category]
                          .filter(Boolean)
                          .join(" · ") || "Asset"}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        Warranty expiry:{" "}
                        <span className="font-medium">
                          {formatDate(reminder.warranty_expiry)}
                        </span>
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {reminder.daysLeft < 0
                          ? `Expired ${Math.abs(reminder.daysLeft)} day(s) ago`
                          : reminder.daysLeft === 0
                          ? "Expires today"
                          : `${reminder.daysLeft} day(s) remaining`}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          reminder
                        )}`}
                      >
                        {getStatusLabel(reminder)}
                      </span>

                      {reminder.reminderDays !== null &&
                        reminder.reminderDate && (
                          <p className="text-xs text-slate-500">
                            {reminder.reminderDays}-day alert date:{" "}
                            {formatDate(
                              reminder.reminderDate.toISOString().slice(0, 10)
                            )}
                          </p>
                        )}

                      <p className="text-xs text-slate-400">
                        Email: Not configured
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">
              How warranty alerts work
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">30 days before</p>
                <p className="mt-1 text-sm text-slate-500">
                  Early warning to plan warranty-related service.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">15 days before</p>
                <p className="mt-1 text-sm text-slate-500">
                  Follow-up reminder before the warranty ends.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">5 days before</p>
                <p className="mt-1 text-sm text-slate-500">
                  Final advance warning to take action.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SmartReminders;
