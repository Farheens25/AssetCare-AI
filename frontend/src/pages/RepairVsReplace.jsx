import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowRight,
  FiClock,
  FiDollarSign,
  FiEdit2,
  FiInfo,
  FiMenu,
  FiPackage,
  FiRefreshCw,
  FiTool,
} from "react-icons/fi";
import RepairVsReplaceDetailsForm from "../components/assets/RepairVsReplaceDetailsForm";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { supabase } from "../lib/supabase";

const metrics = [
  {
    key: "repair_cost",
    label: "Repair cost",
    icon: FiTool,
    color: "text-violet-600",
    background: "bg-violet-50",
    format: "money",
  },
  {
    key: "current_value",
    label: "Current value",
    icon: FiDollarSign,
    color: "text-blue-600",
    background: "bg-blue-50",
    format: "money",
  },
  {
    key: "replacement_cost",
    label: "Replacement cost",
    icon: FiPackage,
    color: "text-indigo-600",
    background: "bg-indigo-50",
    format: "money",
  },
  {
    key: "remaining_life_years",
    label: "Remaining life",
    icon: FiClock,
    color: "text-sky-600",
    background: "bg-sky-50",
    format: "years",
  },
];

const estimateKeys = {
  repair_cost: "repairCost",
  current_value: "currentValue",
  replacement_cost: "replacementCost",
  remaining_life_years: "remainingUsefulLifeYears",
};

function readNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRange(range, format) {
  if (!range) return "Not enough information";
  if (format === "years") {
    return `${range.min}–${range.max} years`;
  }
  return `${formatMoney(range.min)}–${formatMoney(range.max)}`;
}

function getMissingDetails(asset) {
  const missing = metrics
    .filter((metric) => readNumber(asset[metric.key]) === null)
    .map((metric) => metric.label.toLowerCase());

  if (
    readNumber(asset.replacement_cost) === 0 &&
    !missing.includes("replacement cost")
  ) {
    missing.push("replacement cost must be greater than ₹0");
  }

  return missing;
}

function getRecommendation(asset) {
  const repairCost = readNumber(asset.repair_cost);
  const currentValue = readNumber(asset.current_value);
  const replacementCost = readNumber(asset.replacement_cost);
  const remainingLife = readNumber(asset.remaining_life_years);

  if (getMissingDetails(asset).length > 0) return null;

  const replaceBecauseCost =
    repairCost >= replacementCost * 0.5 || repairCost >= currentValue;
  const replaceBecauseLife = remainingLife <= 1;

  if (replaceBecauseCost || replaceBecauseLife) {
    const reasons = [];
    if (repairCost >= replacementCost * 0.5) {
      reasons.push("the repair is at least half the replacement cost");
    }
    if (repairCost >= currentValue) {
      reasons.push("the repair cost meets or exceeds the current value");
    }
    if (replaceBecauseLife) {
      reasons.push("one year or less of useful life remains");
    }

    return {
      decision: "Replace",
      timeline:
        remainingLife === 0
          ? "Replacement planning is warranted now (saved remaining useful life: 0 years)."
          : remainingLife <= 1
            ? `Consider replacement within 1 year, based on the saved remaining useful life of ${remainingLife} ${remainingLife === 1 ? "year" : "years"}.`
            : "No specific replacement timeline is supported by the saved figures.",
      explanation: `Replacement is suggested because ${reasons.join(" and ")}.`,
    };
  }

  return {
    decision: "Repair",
    timeline: "Replacement is not suggested by these rules.",
    explanation:
      "Repair is suggested because it costs less than half of replacement, is below the current value, and more than one year of useful life remains.",
  };
}

function RepairVsReplace() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [faultDescriptions, setFaultDescriptions] = useState({});
  const [estimates, setEstimates] = useState({});
  const [estimateErrors, setEstimateErrors] = useState({});
  const [estimatingAssetId, setEstimatingAssetId] = useState(null);

  const fetchAssets = useCallback(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) return { assets: null, requiresLogin: true };

    const { data, error: queryError } = await supabase
      .from("assets")
      .select(
        "id, product_name, brand, model, category, purchase_date, purchase_price, warranty_expiry, warranty_months, notes, repair_cost, current_value, replacement_cost, remaining_life_years, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) throw queryError;
    return { assets: data || [], requiresLogin: false };
  }, []);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchAssets();
      if (result.requiresLogin) {
        navigate("/login");
        return;
      }
      setAssets(result.assets);
    } catch (loadError) {
      console.error("Repair vs Replace asset loading error:", loadError);
      setError(loadError.message || "Unable to load your assets.");
    } finally {
      setLoading(false);
    }
  }, [fetchAssets, navigate]);

  useEffect(() => {
    let cancelled = false;

    fetchAssets()
      .then((result) => {
        if (cancelled) return;
        if (result.requiresLogin) {
          navigate("/login");
          return;
        }
        setAssets(result.assets);
      })
      .catch((loadError) => {
        console.error("Repair vs Replace asset loading error:", loadError);
        if (!cancelled) {
          setError(loadError.message || "Unable to load your assets.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchAssets, navigate]);

  const generateEstimate = useCallback(
    async (asset) => {
      setEstimatingAssetId(asset.id);
      setEstimateErrors((current) => ({ ...current, [asset.id]: "" }));

      try {
        const { data, error: functionError } =
          await supabase.functions.invoke("repair-replace-estimator", {
            body: {
              assetId: asset.id,
              faultDescription: faultDescriptions[asset.id] || "",
            },
          });

        if (functionError) {
          let message = "Could not generate an estimate. Please try again.";
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

        if (
          !data?.estimates ||
          !data?.recommendation ||
          !Array.isArray(data.assumptions) ||
          !Array.isArray(data.missingInformation)
        ) {
          throw new Error(
            "The estimator returned an incomplete response. Please retry.",
          );
        }

        setEstimates((current) => ({ ...current, [asset.id]: data }));
      } catch (estimateError) {
        console.error(
          "Repair vs Replace estimate failed:",
          estimateError instanceof Error ? estimateError.name : "Unknown error",
        );
        setEstimateErrors((current) => ({
          ...current,
          [asset.id]:
            estimateError instanceof Error
              ? estimateError.message
              : "Could not generate an estimate. Please try again.",
        }));
      } finally {
        setEstimatingAssetId(null);
      }
    },
    [faultDescriptions],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <FiMenu size={21} />
          </button>

          <Link
            to="/dashboard"
            className="text-sm font-semibold text-slate-900"
          >
            AssetCare-AI
          </Link>

          <button
            type="button"
            onClick={loadAssets}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <FiTool size={21} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                    Asset decisions
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    Repair vs Replace
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Review AI-generated estimate ranges and a recommendation
                    based on your saved asset details.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                AI estimates · Not verified quotes
              </span>
            </div>
          </section>

          <section
            aria-label="How recommendations are calculated"
            className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5"
          >
            <FiInfo className="mt-0.5 shrink-0 text-blue-600" size={18} />
            <div className="text-sm leading-6 text-slate-600">
              <p className="font-semibold text-slate-800">
                AI-assisted estimates for review
              </p>
              <p className="mt-1">
                Estimates use the saved product details and any fault/condition
                description you provide. They are ranges, not verified market
                quotes; no live prices are checked. Missing or unsupported
                figures remain unavailable. Review estimates before choosing
                values to save. This is not a professional inspection or a
                guaranteed financial outcome.
              </p>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Unable to load your assets</p>
                <p className="mt-1 break-words">{error}</p>
              </div>
              <button
                type="button"
                onClick={loadAssets}
                disabled={loading}
                className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div
              role="status"
              className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm"
            >
              <FiRefreshCw className="mx-auto mb-3 animate-spin text-blue-500" size={22} />
              Loading your saved assets...
            </div>
          ) : !error && assets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <FiPackage className="mx-auto text-slate-400" size={36} />
              <h2 className="mt-4 text-lg font-semibold">
                No saved assets yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Add an asset to see its saved details here. A repair or
                replacement recommendation will remain unavailable until all
                four comparison figures are recorded.
              </p>
              <Link
                to="/add-asset"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Add an asset <FiArrowRight />
              </Link>
            </div>
          ) : !error ? (
            <section aria-label="Saved asset comparisons">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Your assets</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {assets.length} saved {assets.length === 1 ? "asset" : "assets"}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Values are shown only when saved
                </span>
              </div>

              <div className="grid items-start gap-5 md:grid-cols-2">
                {assets.map((asset) => {
                  const aiEstimate = estimates[asset.id];
                  const recommendation = aiEstimate
                    ? aiEstimate.recommendation.decision === "insufficient_information"
                      ? null
                      : {
                          decision:
                            aiEstimate.recommendation.decision === "replace"
                              ? "Replace"
                              : "Repair",
                          reasons: aiEstimate.recommendation.reasons,
                          timeline: aiEstimate.recommendation.timeline,
                          source: "AI estimate",
                        }
                    : getRecommendation(asset);
                  const missingDetails = getMissingDetails(asset);
                  const purchasePrice = readNumber(asset.purchase_price);
                  const hasComparisonData = metrics.some(
                    (metric) => readNumber(asset[metric.key]) !== null,
                  );

                  return (
                    <article
                      key={asset.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="border-b border-slate-100 bg-gradient-to-r from-white via-white to-violet-50/70 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <FiPackage size={19} />
                            </span>
                            <div className="min-w-0">
                              <h3 className="break-words text-base font-bold text-slate-900 sm:text-lg">
                                {asset.product_name || "Unnamed asset"}
                              </h3>
                              <p className="mt-1 break-words text-sm text-slate-500">
                                {[asset.brand, asset.model]
                                  .filter(Boolean)
                                  .join(" · ") || "Saved asset"}
                              </p>
                              <p className="mt-1 text-xs font-medium text-slate-500">
                                Category: {asset.category || "Not provided"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingAssetId((current) =>
                                current === asset.id ? null : asset.id,
                              )
                            }
                            aria-expanded={editingAssetId === asset.id}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 sm:text-sm"
                          >
                            <FiEdit2 size={14} />
                            {hasComparisonData ? "Edit details" : "Add details"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
                        {metrics.map((metric) => {
                          const Icon = metric.icon;
                          const value = readNumber(asset[metric.key]);
                          const displayedValue =
                            value === null
                              ? "Not available"
                              : metric.format === "money"
                                ? formatMoney(value)
                                : `${value} ${value === 1 ? "year" : "years"}`;

                          return (
                            <div
                              key={metric.key}
                              className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${metric.background} ${metric.color}`}
                                >
                                  <Icon size={15} />
                                </span>
                                <span className="text-xs font-medium leading-4 text-slate-500">
                                  {metric.label}
                                </span>
                              </div>
                              <p
                                className={`mt-3 break-words text-sm font-bold ${
                                  value === null
                                    ? "text-slate-400"
                                    : "text-slate-900"
                                }`}
                              >
                                {displayedValue}
                              </p>
                              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                {value === null
                                  ? "Missing saved detail"
                                  : "Your saved estimate"}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mx-4 mb-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4 sm:mx-5 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">
                              AI estimate ranges
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Estimates, not verified market quotes
                            </p>
                          </div>
                          {aiEstimate && (
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-violet-700">
                              Confidence: {aiEstimate.confidence}
                            </span>
                          )}
                        </div>

                        {asset.purchase_date ||
                        asset.purchase_price !== null ||
                        asset.warranty_expiry ||
                        asset.notes ? (
                          <p className="mt-3 text-xs leading-5 text-slate-500">
                            Uses saved details
                            {asset.purchase_date
                              ? ` · purchased ${asset.purchase_date}`
                              : ""}
                            {readNumber(asset.purchase_price) !== null
                              ? ` · purchase price ${formatMoney(Number(asset.purchase_price))}`
                              : ""}
                            {asset.warranty_expiry
                              ? ` · warranty expiry ${asset.warranty_expiry}`
                              : ""}
                            {asset.notes ? " · asset notes" : ""}
                          </p>
                        ) : (
                          <p className="mt-3 text-xs text-slate-500">
                            Add product details to support a more useful
                            estimate.
                          </p>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                          {metrics.map((metric) => {
                            const range =
                              aiEstimate?.estimates?.[estimateKeys[metric.key]];
                            return (
                              <div
                                key={metric.key}
                                className="rounded-lg border border-white bg-white/80 p-3"
                              >
                                <p className="text-xs text-slate-500">
                                  {metric.label}
                                </p>
                                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                                  {aiEstimate
                                    ? formatRange(range, metric.format)
                                    : "Generate an estimate"}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        <label
                          htmlFor={`fault-description-${asset.id}`}
                          className="mt-4 block text-xs font-semibold text-slate-700"
                        >
                          Fault or current condition
                          <span className="font-normal text-slate-500">
                            {" "}
                            (optional; add when the product needs repair)
                          </span>
                        </label>
                        <textarea
                          id={`fault-description-${asset.id}`}
                          rows={2}
                          maxLength={1200}
                          value={faultDescriptions[asset.id] || ""}
                          onChange={(event) =>
                            setFaultDescriptions((current) => ({
                              ...current,
                              [asset.id]: event.target.value,
                            }))
                          }
                          placeholder="For example: screen flickers intermittently; product still powers on."
                          className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />

                        {estimateErrors[asset.id] && (
                          <p
                            role="alert"
                            className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                          >
                            {estimateErrors[asset.id]}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => generateEstimate(asset)}
                          disabled={estimatingAssetId !== null}
                          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiRefreshCw
                            className={
                              estimatingAssetId === asset.id
                                ? "animate-spin"
                                : ""
                            }
                          />
                          {estimatingAssetId === asset.id
                            ? "Generating estimate..."
                            : aiEstimate
                              ? "Generate new AI estimate"
                              : "Generate AI estimate"}
                        </button>

                        {aiEstimate && (
                          <div className="mt-4 space-y-3 border-t border-violet-100 pt-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {aiEstimate.recommendation.decision ===
                                "insufficient_information"
                                  ? "Not enough information"
                                  : "AI recommendation"}
                              </p>
                              {aiEstimate.recommendation.decision !==
                                "insufficient_information" && (
                                <p className="mt-1 text-lg font-bold text-slate-900">
                                  {aiEstimate.recommendation.decision ===
                                  "replace"
                                    ? "Replace"
                                    : "Repair"}
                                </p>
                              )}
                              {aiEstimate.recommendation.timeline && (
                                <p className="mt-1 text-sm text-slate-700">
                                  Timeline:{" "}
                                  {aiEstimate.recommendation.timeline}
                                </p>
                              )}
                            </div>
                            {aiEstimate.recommendation.reasons.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-600">
                                  Reasons
                                </p>
                                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
                                  {aiEstimate.recommendation.reasons.map(
                                    (reason, index) => (
                                      <li key={`${index}-${reason}`}>
                                        {reason}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                            {aiEstimate.assumptions.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-slate-600">
                                  Assumptions
                                </p>
                                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
                                  {aiEstimate.assumptions.map(
                                    (assumption, index) => (
                                      <li key={`${index}-${assumption}`}>
                                        {assumption}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                            {aiEstimate.missingInformation.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-amber-700">
                                  Information that could improve this estimate
                                </p>
                                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
                                  {aiEstimate.missingInformation.map(
                                    (missing, index) => (
                                      <li key={`${index}-${missing}`}>
                                        {missing}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                            <p className="text-xs leading-5 text-slate-500">
                              {aiEstimate.disclaimer}
                            </p>
                          </div>
                        )}
                      </div>

                      {purchasePrice !== null && (
                        <p className="px-4 pb-4 text-xs text-slate-500 sm:px-5">
                          Saved purchase price:{" "}
                          <span className="font-semibold text-slate-700">
                            {formatMoney(purchasePrice)}
                          </span>
                          <span className="text-slate-400">
                            {" "}
                            · not used as current value
                          </span>
                        </p>
                      )}

                      <div className="mx-4 mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:mx-5 sm:mb-5 sm:p-5">
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              recommendation
                                ? "bg-violet-50 text-violet-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {recommendation ? (
                              <FiTool size={17} />
                            ) : (
                              <FiInfo size={17} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {aiEstimate &&
                              aiEstimate.recommendation.decision ===
                                "insufficient_information"
                                ? "AI: not enough information"
                                : recommendation
                                ? recommendation.source || "Saved figures · rule-based"
                                : "Not enough information"}
                            </p>
                            <p
                              className={`mt-1 text-lg font-bold ${
                                recommendation?.decision === "Replace"
                                  ? "text-violet-700"
                                  : recommendation
                                    ? "text-blue-700"
                                    : "text-slate-900"
                              }`}
                            >
                              {recommendation
                                ? recommendation.decision
                                : "No decision yet"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <p className="text-xs font-semibold text-slate-500">
                            Suggested replacement timeline
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-800">
                            {aiEstimate
                              ? aiEstimate.recommendation.timeline ||
                                "No timeline is supported by the available information."
                              : recommendation
                                ? recommendation.timeline
                              : "Not available until the required figures are saved."}
                          </p>
                          <p className="mt-3 text-xs leading-5 text-slate-500">
                            {aiEstimate
                              ? aiEstimate.recommendation.reasons.join(" ") ||
                                aiEstimate.missingInformation.join(" ")
                              : recommendation
                                ? recommendation.explanation
                                : `Enter ${missingDetails.join(", ")} to calculate a recommendation. No missing values or timelines are estimated.`}
                          </p>
                        </div>
                      </div>

                      {editingAssetId === asset.id && (
                        <div className="mx-4 mb-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:mx-5 sm:mb-5 sm:p-5">
                          <h4 className="mb-3 text-sm font-bold text-slate-800">
                            Repair vs Replace Details
                          </h4>
                          <RepairVsReplaceDetailsForm
                            asset={asset}
                            aiEstimate={aiEstimate}
                            onSaved={(updatedFields) =>
                              setAssets((currentAssets) =>
                                currentAssets.map((currentAsset) =>
                                  currentAsset.id === asset.id
                                    ? { ...currentAsset, ...updatedFields }
                                    : currentAsset,
                                ),
                              )
                            }
                            onCancel={() => setEditingAssetId(null)}
                          />
                        </div>
                      )}

                      <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
                        <Link
                          to={`/products/${asset.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View saved asset details <FiArrowRight size={15} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default RepairVsReplace;
