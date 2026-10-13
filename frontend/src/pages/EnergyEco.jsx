
import { useEffect, useState } from "react";
import {
  FiZap,
  FiFeather,
  FiWind,
  FiDroplet,
  FiMenu,
  FiSun,
  FiCheckCircle,
} from "react-icons/fi";

import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { supabase } from "../lib/supabase";

const ecoTips = [
  {
    id: "ac_24",
    icon: FiWind,
    title: "Set your AC to 24┬░C",
    description:
      "A practical temperature setting can help reduce cooling energy use.",
    saving: "Potential energy savings",
  },
  {
    id: "full_washing_loads",
    icon: FiDroplet,
    title: "Run full washing loads",
    description:
      "Use the washing machine only when you have a full load.",
    saving: "Save water and electricity",
  },
  {
    id: "maintain_refrigerator",
    icon: FiSun,
    title: "Maintain your refrigerator",
    description:
      "Clean the coils and check the door seals regularly.",
    saving: "Improve energy efficiency",
  },
  {
    id: "unplug_chargers",
    icon: FiZap,
    title: "Unplug idle chargers",
    description:
      "Switch off chargers and devices when they are not needed.",
    saving: "Reduce standby power use",
  },
];

function getLastSixMonths() {
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - 5 + index,
      1
    );

    return {
      key: `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`,
      month: date.toLocaleString("en-IN", {
        month: "short",
      }),
      units: 0,
    };
  });
}

function EnergyEco() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState(
    getLastSixMonths
  );
  const [completedTips, setCompletedTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTips, setSavingTips] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasUsageRecords, setHasUsageRecords] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEnergyData() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          throw new Error(
            "Please log in to view your Energy & Eco data."
          );
        }

        const months = getLastSixMonths();
        const firstMonth = `${months[0].key}-01`;
        const lastMonth = `${months[months.length - 1].key}-01`;

        const [usageResult, tipsResult] = await Promise.all([
          supabase
            .from("energy_usage")
            .select("month_start, units_kwh")
            .eq("user_id", user.id)
            .gte("month_start", firstMonth)
            .lte("month_start", lastMonth)
            .order("month_start", { ascending: true }),

          supabase
            .from("eco_tip_completions")
            .select("tip_id")
            .eq("user_id", user.id),
        ]);

        if (usageResult.error) throw usageResult.error;
        if (tipsResult.error) throw tipsResult.error;

        if (cancelled) return;

        // Add together all usage records belonging to the same month.
        const usageByMonth = new Map();

        (usageResult.data || []).forEach((record) => {
          const monthKey = String(record.month_start).slice(0, 7);
          const units = Number(record.units_kwh) || 0;

          usageByMonth.set(
            monthKey,
            (usageByMonth.get(monthKey) || 0) + units
          );
        });

        const updatedMonths = months.map((month) => ({
          ...month,
          units: usageByMonth.get(month.key) ?? 0,
        }));

        setMonthlyUsage(updatedMonths);
        setHasUsageRecords((usageResult.data || []).length > 0);
        setCompletedTips(
          [
            ...new Set(
              (tipsResult.data || []).map((item) => item.tip_id)
            ),
          ].filter((id) => ecoTips.some((tip) => tip.id === id))
        );
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error.message || "Unable to load Energy & Eco data."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEnergyData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleTip(tipId) {
    // Prevent duplicate requests for the same tip.
    if (savingTips.includes(tipId)) return;

    setErrorMessage("");
    setSavingTips((previous) => [...previous, tipId]);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Please log in to save your eco tips.");
      }

      const alreadyCompleted = completedTips.includes(tipId);

      if (alreadyCompleted) {
        const { error } = await supabase
          .from("eco_tip_completions")
          .delete()
          .eq("user_id", user.id)
          .eq("tip_id", tipId);

        if (error) throw error;

        setCompletedTips((previous) =>
          previous.filter((id) => id !== tipId)
        );
      } else {
        const { error } = await supabase
          .from("eco_tip_completions")
          .insert({
            user_id: user.id,
            tip_id: tipId,
          });

        if (error) throw error;

        setCompletedTips((previous) =>
          previous.includes(tipId)
            ? previous
            : [...previous, tipId]
        );
      }
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Unable to save your eco tip. Please try again."
      );
    } finally {
      setSavingTips((previous) =>
        previous.filter((id) => id !== tipId)
      );
    }
  }

  const totalUsage = monthlyUsage.reduce(
    (total, month) => total + month.units,
    0
  );

  const maxUsage = Math.max(
    1800,
    ...monthlyUsage.map((month) => month.units)
  );

  const chartMax = Math.ceil(maxUsage / 4 / 100) * 100 * 4;

  const completedCount = ecoTips.filter((tip) =>
    completedTips.includes(tip.id)
  ).length;

  const completionPercentage =
    (completedCount / ecoTips.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <FiMenu size={21} />
          </button>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              AssetCare-AI
            </p>
            <p className="text-xs text-slate-500">
              Sustainability dashboard
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 p-5 sm:p-8">
          {/* Page heading */}
          <section>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiFeather size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Energy & Eco
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Electricity usage, sustainability and eco tips.
                </p>
              </div>
            </div>
          </section>

          {/* Error message */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <p className="font-semibold">
                Unable to complete the operation
              </p>
              <p className="mt-1 break-words">{errorMessage}</p>
            </div>
          )}

          {/* Loading message */}
          {loading && (
            <p
              role="status"
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
            >
              Loading your Energy & Eco data...
            </p>
          )}

          {/* Summary cards */}
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Energy score
                </span>
                <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <FiFeather size={20} />
                </span>
              </div>

              <p className="mt-5 text-3xl font-bold">
                {loading ? "..." : hasUsageRecords ? "ΓÇö" : "N/A"}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {hasUsageRecords
                  ? "Usage data available; a scoring model is not configured yet."
                  : "Add electricity usage to begin tracking."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Electricity usage
                </span>
                <span className="rounded-xl bg-sky-50 p-2 text-sky-600">
                  <FiZap size={20} />
                </span>
              </div>

              <p className="mt-5 text-3xl font-bold">
                {loading
                  ? "..."
                  : `${totalUsage.toLocaleString("en-IN")} kWh`}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Total recorded usage across the displayed six months.
              </p>

              {!loading && !hasUsageRecords && (
                <p className="mt-3 text-xs text-amber-700">
                  No usage records found for this period.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Carbon footprint
                </span>
                <span className="rounded-xl bg-sky-50 p-2 text-sky-600">
                  <FiWind size={20} />
                </span>
              </div>

              <p className="mt-5 text-3xl font-bold">N/A</p>

              <p className="mt-2 text-sm text-slate-500">
                An emissions calculation has not been configured.
              </p>

              <p className="mt-3 text-xs text-slate-400">
                Requires an emissions factor and a defined reporting period.
              </p>
            </div>
          </section>

          {/* Monthly usage chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  Monthly electricity usage
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Recorded consumption from your Supabase database.
                </p>
              </div>

              <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                kWh
              </span>
            </div>

            {!loading && !hasUsageRecords && (
              <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No electricity records found for the last six months.
                Saved usage records will appear here.
              </p>
            )}

            <div className="mt-7 flex h-64 gap-3">
              <div className="flex flex-col justify-between pb-7 text-right text-xs text-slate-400">
                {[4, 3, 2, 1, 0].map((value) => (
                  <span key={value}>
                    {Math.round((chartMax * value) / 4).toLocaleString("en-IN")}
                  </span>
                ))}
              </div>

              <div className="relative flex flex-1 items-end justify-around gap-2 border-b border-l border-slate-200 px-2 pb-0">
                {[1, 2, 3, 4].map((value) => (
                  <div
                    key={value}
                    className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-slate-100"
                    style={{ bottom: `${(value / 4) * 100}%` }}
                  />
                ))}

                {monthlyUsage.map((item) => {
                  const barHeight =
                    item.units > 0
                      ? Math.max(2, (item.units / chartMax) * 100)
                      : 0;

                  return (
                    <div
                      key={item.key}
                      className="relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
                        {item.units > 0
                          ? item.units.toLocaleString("en-IN")
                          : "ΓÇö"}
                      </span>

                      <div
                        title={`${item.month}: ${item.units} kWh recorded`}
                        className={`w-full max-w-12 rounded-t-lg transition-all ${
                          item.units > 0
                            ? "bg-gradient-to-t from-blue-600 to-sky-400 hover:opacity-80"
                            : "bg-slate-100"
                        }`}
                        style={{
                          height: `${barHeight}%`,
                          minHeight: item.units > 0 ? "2px" : "0",
                        }}
                      />

                      <span className="absolute -bottom-6 text-xs text-slate-500">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-10 text-xs text-slate-400">
              Months without recorded usage have no bar. These values come
              from saved database records, not automatic meter readings.
            </p>
          </section>

          {/* Eco tips */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Eco tips</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mark tips as completed to save your progress.
                </p>
              </div>

              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                {completedCount} / {ecoTips.length} completed
              </span>
            </div>

            <div
              className="mb-5 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={ecoTips.length}
              aria-label="Completed eco tips"
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {ecoTips.map((tip) => {
                const Icon = tip.icon;
                const completed = completedTips.includes(tip.id);
                const saving = savingTips.includes(tip.id);

                return (
                  <article
                    key={tip.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                        <Icon size={21} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{tip.title}</h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {tip.description}
                        </p>

                        <p className="mt-3 text-sm font-medium text-emerald-700">
                          {tip.saving}
                        </p>

                        <button
                          type="button"
                          disabled={loading || saving}
                          onClick={() => toggleTip(tip.id)}
                          className={`mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            completed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                        >
                          <FiCheckCircle size={16} />
                          {saving
                            ? "Saving..."
                            : completed
                              ? "Completed"
                              : "Mark as done"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <p className="text-center text-xs text-slate-400">
            Usage comes from saved records. Carbon footprint and energy score
            remain unavailable until their calculation methods are configured.
          </p>
        </div>
      </main>
    </div>
  );
}

export default EnergyEco;