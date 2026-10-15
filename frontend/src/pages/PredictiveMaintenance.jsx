import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiBell,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiMenu,
  FiMoon,
  FiRefreshCw,
  FiSearch,
  FiSun,
  FiTool,
  FiUser,
} from "react-icons/fi";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

function localDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function validEstimate(result) {
  const isRange = (range) =>
    range === null ||
    (range &&
      Number.isFinite(range.min) &&
      Number.isFinite(range.max) &&
      range.min >= 0 &&
      range.max >= range.min);

  return (
    result &&
    ["estimate", "needs_information"].includes(result.status) &&
    (result.status !== "estimate" ||
      ["low", "medium", "high"].includes(result.riskLevel)) &&
    ["low", "medium", "high"].includes(result.confidence) &&
    Array.isArray(result.checklist) &&
    result.checklist.every((task) => typeof task.title === "string") &&
    isRange(result.estimatedRepairCost) &&
    Array.isArray(result.partsToInspect) &&
    Array.isArray(result.assumptions) &&
    Array.isArray(result.missingInformation) &&
    typeof result.explanation === "string"
  );
}

function taskKey(title, index) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug || `maintenance-check-${index + 1}`;
}

function readableError(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function PredictiveMaintenance() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [assets, setAssets] = useState([]);
  const [user, setUser] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [reminders, setReminders] = useState([]);
  const [conditions, setConditions] = useState({});
  const [estimates, setEstimates] = useState({});
  const [dates, setDates] = useState({});
  const [tasks, setTasks] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estimateError, setEstimateError] = useState({});
  const [estimating, setEstimating] = useState(null);
  const [savingTask, setSavingTask] = useState({});
  const [scheduling, setScheduling] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { user: signedInUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!signedInUser) {
        navigate("/login");
        return;
      }
      setUser(signedInUser);

      const { data: assetRows, error: assetsError } = await supabase
        .from("assets")
        .select(
          "id, product_name, brand, model, category, purchase_date, purchase_price, warranty_expiry, warranty_months, notes, created_at",
        )
        .eq("user_id", signedInUser.id)
        .order("created_at", { ascending: false });
      if (assetsError) throw assetsError;

      const ownedAssets = assetRows || [];
      setAssets(ownedAssets);
      if (ownedAssets.length === 0) {
        setChecklist({});
        setReminders([]);
        return;
      }

      const assetIds = ownedAssets.map((asset) => asset.id);
      const [checklistResult, reminderResult] = await Promise.all([
        supabase
          .from("maintenance_checklist_items")
          .select("asset_id, task_key, task_title, completed")
          .eq("user_id", signedInUser.id)
          .in("asset_id", assetIds),
        supabase
          .from("maintenance_reminders")
          .select("id, asset_id, scheduled_date, task_description")
          .eq("user_id", signedInUser.id)
          .in("asset_id", assetIds)
          .order("scheduled_date", { ascending: true }),
      ]);
      if (checklistResult.error) throw checklistResult.error;
      if (reminderResult.error) throw reminderResult.error;

      const completedItems = {};
      const savedTasks = {};
      (checklistResult.data || []).forEach((item) => {
        completedItems[`${item.asset_id}:${item.task_key}`] = item.completed;
        savedTasks[item.asset_id] = [
          ...(savedTasks[item.asset_id] || []),
          { key: item.task_key, title: item.task_title },
        ];
      });
      setChecklist(completedItems);
      setTasks((current) => ({ ...current, ...savedTasks }));
      setReminders(reminderResult.data || []);
    } catch (loadError) {
      console.error("Predictive Maintenance loading error:", loadError);
      setError(
        readableError(
          loadError,
          "Could not load assets and maintenance data. Retry the request.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assets;
    return assets.filter((asset) =>
      [
        asset.product_name,
        asset.brand,
        asset.model,
        asset.category,
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [assets, search]);

  const showFeedback = (assetId, message, type = "error") =>
    setFeedback((current) => ({
      ...current,
      [assetId]: message ? { message, type } : null,
    }));

  const generateEstimate = async (asset) => {
    setEstimating(asset.id);
    setEstimateError((current) => ({ ...current, [asset.id]: "" }));
    showFeedback(asset.id, "");
    try {
      const { data, error: functionError } =
        await supabase.functions.invoke("predictive-maintenance-estimator", {
          body: {
            assetId: asset.id,
            condition: conditions[asset.id] || "",
          },
        });
      if (functionError) {
        let message = "Could not generate maintenance guidance. Please retry.";
        if (functionError.context) {
          try {
            const response = await functionError.context.clone().json();
            if (typeof response.error === "string") message = response.error;
          } catch {
            if (functionError.context.status === 401) {
              message = "Your session has expired. Sign in again.";
            } else if (functionError.context.status === 429) {
              message = "The estimator is busy. Please try again shortly.";
            }
          }
        }
        throw new Error(message);
      }
      if (!validEstimate(data)) {
        throw new Error(
          "The estimator returned incomplete guidance. Please try again.",
        );
      }
      const nextTasks = data.checklist
        .map((item, index) => ({
          ...item,
          key: taskKey(item.title, index),
        }))
        .filter(
          (item, index, allTasks) =>
            allTasks.findIndex((candidate) => candidate.key === item.key) ===
            index,
        );
      if (nextTasks.length < 2) {
        throw new Error(
          "The estimator returned too few distinct checklist items. Please retry.",
        );
      }
      const { error: checklistError } = await supabase
        .from("maintenance_checklist_items")
        .upsert(
          nextTasks.map((task) => ({
            user_id: user.id,
            asset_id: asset.id,
            task_key: task.key,
            task_title: task.title,
            completed: Boolean(checklist[`${asset.id}:${task.key}`]),
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "user_id,asset_id,task_key" },
        );
      setEstimates((current) => ({ ...current, [asset.id]: data }));
      setDates((current) => ({
        ...current,
        [asset.id]: data.recommendedServiceDate || "",
      }));
      setTasks((current) => ({
        ...current,
        [asset.id]: [
          ...new Map(
            [...(current[asset.id] || []), ...nextTasks].map((task) => [
              task.key,
              task,
            ]),
          ).values(),
        ],
      }));
      if (checklistError) {
        console.error("Generated checklist could not be saved:", checklistError);
        showFeedback(
          asset.id,
          "Guidance generated, but the checklist could not be saved. Apply the maintenance migration or retry.",
          "error",
        );
      }
    } catch (estimateFailure) {
      console.error(
        "Predictive maintenance estimate failed:",
        estimateFailure instanceof Error ? estimateFailure.name : "Unknown error",
      );
      setEstimateError((current) => ({
        ...current,
        [asset.id]: readableError(
          estimateFailure,
          "Could not generate maintenance guidance. Please retry.",
        ),
      }));
    } finally {
      setEstimating(null);
    }
  };

  const toggleChecklistItem = async (asset, task) => {
    if (!user || savingTask[`${asset.id}:${task.key}`]) return;
    const itemId = `${asset.id}:${task.key}`;
    const wasComplete = Boolean(checklist[itemId]);
    setChecklist((current) => ({ ...current, [itemId]: !wasComplete }));
    setSavingTask((current) => ({ ...current, [itemId]: true }));
    showFeedback(asset.id, "");
    try {
      const { error: saveError } = await supabase
        .from("maintenance_checklist_items")
        .upsert(
          {
            user_id: user.id,
            asset_id: asset.id,
            task_key: task.key,
            task_title: task.title,
            completed: !wasComplete,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,asset_id,task_key" },
        );
      if (saveError) throw saveError;
    } catch (saveError) {
      console.error("Maintenance checklist save failed:", saveError);
      setChecklist((current) => ({ ...current, [itemId]: wasComplete }));
      showFeedback(
        asset.id,
        readableError(saveError, "Could not save this checklist update."),
      );
    } finally {
      setSavingTask((current) => ({ ...current, [itemId]: false }));
    }
  };

  const scheduleReminder = async (event, asset) => {
    event.preventDefault();
    if (!user || scheduling === asset.id) return;
    const scheduledDate = dates[asset.id] || "";
    const description = (
      tasks[`${asset.id}:description`] ?? "Maintenance inspection"
    ).trim();
    if (!scheduledDate || scheduledDate < localDateString() || !description) {
      showFeedback(
        asset.id,
        "Choose today or a future date and enter a reminder task.",
      );
      return;
    }
    setScheduling(asset.id);
    showFeedback(asset.id, "");
    try {
      const { data, error: saveError } = await supabase
        .from("maintenance_reminders")
        .upsert(
          {
            user_id: user.id,
            asset_id: asset.id,
            scheduled_date: scheduledDate,
            task_description: description,
          },
          {
            onConflict: "user_id,asset_id,scheduled_date,task_description",
            ignoreDuplicates: true,
          },
        )
        .select("id, asset_id, scheduled_date, task_description")
        .maybeSingle();
      if (saveError) throw saveError;

      if (data) {
        setReminders((current) =>
          [...current, data].sort((a, b) =>
            a.scheduled_date.localeCompare(b.scheduled_date),
          ),
        );
        showFeedback(
          asset.id,
          "Reminder saved. It will appear in your Maintenance Calendar.",
          "success",
        );
      } else {
        showFeedback(
          asset.id,
          "This reminder is already saved for that date.",
          "success",
        );
      }
    } catch (saveError) {
      console.error("Maintenance reminder save failed:", saveError);
      showFeedback(
        asset.id,
        readableError(saveError, "Could not save this reminder."),
      );
    } finally {
      setScheduling(null);
    }
  };

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <div className="min-h-screen bg-[#f7f7fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-7">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <FiMenu size={21} />
          </button>
          <Link
            to="/dashboard"
            className="hidden text-sm font-bold text-slate-800 dark:text-slate-100 sm:block"
          >
            AssetCare-AI
          </Link>
          <label className="relative ml-auto hidden w-full max-w-sm sm:block">
            <FiSearch
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your assets"
              aria-label="Search assets"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {theme === "dark" ? <FiSun /> : <FiMoon />}
            </button>
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <FiBell />
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {userName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-28 truncate md:block">{userName}</span>
              <FiUser className="md:hidden" />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-violet-100 bg-gradient-to-r from-white via-white to-violet-50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-violet-600 dark:text-violet-300">
                Care intelligence
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Predictive Maintenance
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                AI forecasts failures before they happen and schedules the fix.
              </p>
            </div>
            <Link
              to="/calendar"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800 dark:text-violet-200"
            >
              <FiCalendar /> Maintenance calendar
            </Link>
          </section>

          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm leading-6 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-100">
            <FiInfo className="mt-1 shrink-0" />
            <p>
              Guidance is AI-generated from saved product details, service
              requests, and any condition you describe. It is not a diagnosis,
              verified quote, or guaranteed prediction; no live prices or
              failure probabilities are provided. Saved reminders appear in
              your calendar, but this does not send a notification or book a
              technician.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
            >
              <span className="flex items-start gap-2">
                <FiAlertCircle className="mt-0.5 shrink-0" />
                <span>
                  {error}
                  {error.includes("maintenance_checklist_items") ||
                  error.includes("maintenance_reminders")
                    ? " Apply the new predictive-maintenance SQL migration in Supabase, then reload."
                    : ""}
                </span>
              </span>
              <button
                type="button"
                onClick={loadData}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-white px-3 py-2 font-semibold text-rose-700 shadow-sm hover:bg-rose-100 dark:bg-slate-900 dark:text-rose-200"
              >
                <FiRefreshCw /> Retry
              </button>
            </div>
          )}

          {loading ? (
            <div
              role="status"
              aria-label="Loading maintenance information"
              className="grid gap-5 md:grid-cols-2"
            >
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[430px] animate-pulse rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-6 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="mt-6 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  <div className="mt-5 h-36 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : !error && assets.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <FiTool className="mx-auto text-3xl text-violet-500" />
              <h2 className="mt-4 text-lg font-bold">No saved assets yet</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Add an asset to request maintenance guidance for it.
              </p>
              <Link
                to="/add-asset"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add an asset
              </Link>
            </section>
          ) : !error && visibleAssets.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              No assets match “{search}”.
            </p>
          ) : !error ? (
            <section
              aria-label="Predictive maintenance for your assets"
              className="grid gap-5 lg:grid-cols-2"
            >
              {visibleAssets.map((asset) => {
                const result = estimates[asset.id];
                const assetTasks = tasks[asset.id] || [];
                const assetReminders = reminders.filter(
                  (reminder) => reminder.asset_id === asset.id,
                );
                const isEstimate = result?.status === "estimate";
                const riskStyle = {
                  low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
                  medium:
                    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
                  high: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
                };
                const productTitle =
                  asset.product_name || asset.brand || "Unnamed asset";

                return (
                  <article
                    key={asset.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">
                          <FiTool size={20} />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                            {productTitle}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {[asset.brand, asset.model, asset.category]
                              .filter(Boolean)
                              .join(" · ") || "Category not provided"}
                          </p>
                        </div>
                      </div>
                      {isEstimate ? (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                            riskStyle[result.riskLevel]
                          }`}
                        >
                          {result.riskLevel} risk · estimate
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {result?.status === "needs_information"
                            ? "More information needed"
                            : "Not assessed"}
                        </span>
                      )}
                    </div>

                    <div className="space-y-5 p-5 sm:p-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-900/50 dark:bg-violet-950/30">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Recommended service
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                            {isEstimate
                              ? result.serviceWindow || "No date supported"
                              : "Not available"}
                          </p>
                          {isEstimate && result.recommendedServiceDate && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Suggested date:{" "}
                              {new Date(
                                `${result.recommendedServiceDate}T00:00:00`,
                              ).toLocaleDateString("en-IN")}
                            </p>
                          )}
                        </div>
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Estimated repair cost
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                            {result?.estimatedRepairCost
                              ? `${formatMoney(result.estimatedRepairCost.min)} – ${formatMoney(result.estimatedRepairCost.max)}`
                              : "Not available"}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            {result?.estimatedRepairCost
                              ? "Estimate · not a verified quote"
                              : "No supported cost estimate"}
                          </p>
                        </div>
                      </div>

                      {result ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold">
                              {isEstimate
                                ? "Maintenance guidance"
                                : "More information needed"}
                            </h3>
                            <span className="text-xs capitalize text-slate-500 dark:text-slate-400">
                              {result.confidence} confidence
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {result.explanation}
                          </p>
                          {result.partsToInspect.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                Components to inspect
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {result.partsToInspect.join(" · ")}
                              </p>
                            </div>
                          )}
                          {result.missingInformation.length > 0 && (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                              Please provide: {result.missingInformation.join("; ")}.
                            </div>
                          )}
                          {result.assumptions.length > 0 && (
                            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              Assumptions: {result.assumptions.join("; ")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          Product details alone may not be enough to make a
                          supported prediction. Add symptoms or known
                          condition details if applicable.
                        </div>
                      )}

                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Fault or current condition (optional)
                        </span>
                        <textarea
                          rows={2}
                          maxLength={1200}
                          value={conditions[asset.id] || ""}
                          onChange={(event) =>
                            setConditions((current) => ({
                              ...current,
                              [asset.id]: event.target.value,
                            }))
                          }
                          placeholder="Describe symptoms, recent issues, or known condition..."
                          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={estimating === asset.id}
                        onClick={() => generateEstimate(asset)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                      >
                        {estimating === asset.id ? (
                          <FiRefreshCw className="animate-spin" />
                        ) : (
                          <FiTool />
                        )}
                        {estimating === asset.id
                          ? "Preparing guidance..."
                          : result
                            ? "Retry estimate"
                            : "Generate maintenance estimate"}
                      </button>
                      {estimateError[asset.id] && (
                        <p
                          role="alert"
                          className="mt-2 text-sm text-rose-700 dark:text-rose-300"
                        >
                          {estimateError[asset.id]}
                        </p>
                      )}

                      {assetTasks.length > 0 && (
                          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-bold">
                                  Maintenance checklist
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  Safe checks; follow the manufacturer's manual.
                                </p>
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {assetTasks.filter(
                                  (task) =>
                                    checklist[`${asset.id}:${task.key}`],
                                ).length}
                                /{assetTasks.length} done
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {assetTasks.map((task) => {
                                const itemId = `${asset.id}:${task.key}`;
                                const checked = Boolean(checklist[itemId]);
                                return (
                                  <li key={task.key}>
                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-sm transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={Boolean(savingTask[itemId])}
                                        onChange={() =>
                                          toggleChecklistItem(asset, task)
                                        }
                                        className="mt-0.5 h-4 w-4 accent-blue-600"
                                      />
                                      <span
                                        className={
                                          checked
                                            ? "text-slate-400 line-through"
                                            : "text-slate-700 dark:text-slate-200"
                                        }
                                      >
                                        {task.title}
                                      </span>
                                      {checked && (
                                        <FiCheckCircle
                                          aria-label="Completed"
                                          className="ml-auto mt-0.5 shrink-0 text-emerald-600"
                                        />
                                      )}
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                      )}

                          <form
                            onSubmit={(event) => scheduleReminder(event, asset)}
                            className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-900/50 dark:bg-violet-950/20"
                          >
                            <h3 className="flex items-center gap-2 text-sm font-bold">
                              <FiCalendar className="text-violet-600 dark:text-violet-300" />
                              Schedule a reminder
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              Choose a date for your own calendar. No booking or
                              notification will be sent.
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
                              <label>
                                <span className="sr-only">Reminder date</span>
                                <input
                                  type="date"
                                  min={localDateString()}
                                  value={dates[asset.id] || ""}
                                  onChange={(event) =>
                                    setDates((current) => ({
                                      ...current,
                                      [asset.id]: event.target.value,
                                    }))
                                  }
                                  required
                                  aria-label={`Reminder date for ${productTitle}`}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900"
                                />
                              </label>
                              <label>
                                <span className="sr-only">Reminder task</span>
                                <input
                                  type="text"
                                  maxLength={500}
                                  required
                                  value={
                                    tasks[`${asset.id}:description`] ||
                                    "Maintenance inspection"
                                  }
                                  onChange={(event) =>
                                    setTasks((current) => ({
                                      ...current,
                                      [`${asset.id}:description`]:
                                        event.target.value,
                                    }))
                                  }
                                  aria-label={`Reminder task for ${productTitle}`}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900"
                                />
                              </label>
                              <button
                                type="submit"
                                disabled={scheduling === asset.id}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                              >
                                {scheduling === asset.id ? (
                                  <FiRefreshCw className="animate-spin" />
                                ) : (
                                  <FiCheck />
                                )}
                                Save
                              </button>
                            </div>
                            {feedback[asset.id]?.message && (
                              <p
                                role="status"
                                className={`mt-2 text-xs ${
                                  feedback[asset.id].type === "success"
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : "text-rose-700 dark:text-rose-300"
                                }`}
                              >
                                {feedback[asset.id].message}
                              </p>
                            )}
                            {assetReminders.length > 0 && (
                              <div className="mt-3 space-y-1 border-t border-violet-100 pt-3 text-xs text-slate-600 dark:border-violet-900/50 dark:text-slate-300">
                                {assetReminders.map((reminder) => (
                                  <p
                                    key={reminder.id}
                                    className="flex items-center gap-2"
                                  >
                                    <FiClock className="shrink-0 text-violet-600" />
                                    {new Date(
                                      `${reminder.scheduled_date}T00:00:00`,
                                    ).toLocaleDateString("en-IN")}
                                    {" · "}
                                    {reminder.task_description}
                                  </p>
                                ))}
                              </div>
                            )}
                          </form>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default PredictiveMaintenance;
