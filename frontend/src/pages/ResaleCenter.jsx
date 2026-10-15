
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBox,
  FiCheckCircle,
  FiDollarSign,
  FiInfo,
  FiMenu,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTag,
  FiTrendingUp,
} from "react-icons/fi";

import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { supabase } from "../lib/supabase";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function getAssetAge(purchaseDate) {
  if (!purchaseDate) return null;

  const purchased = new Date(`${purchaseDate}T12:00:00`);

  if (Number.isNaN(purchased.getTime()) || purchased > new Date()) {
    return null;
  }

  return Math.max(
    0,
    (Date.now() - purchased.getTime()) /
      (365.2425 * 24 * 60 * 60 * 1000),
  );
}

function estimateResale(asset) {
  const price = Number(asset.purchase_price);
  const age = getAssetAge(asset.purchase_date);

  if (!Number.isFinite(price) || price <= 0 || age === null) {
    return {
      available: false,
      reason: !price
        ? "Add the original purchase price"
        : "Add a valid purchase date",
      age,
    };
  }

  let lowRetention;
  let highRetention;

  if (age < 1) {
    lowRetention = 0.65;
    highRetention = 0.85;
  } else if (age < 2) {
    lowRetention = 0.5;
    highRetention = 0.75;
  } else if (age < 4) {
    lowRetention = 0.3;
    highRetention = 0.6;
  } else {
    lowRetention = 0.15;
    highRetention = 0.45;
  }

  const condition = String(
    asset.condition ?? asset.asset_condition ?? "",
  ).toLowerCase();

  if (/excellent|like new|new/.test(condition)) {
    lowRetention += 0.05;
    highRetention += 0.05;
  } else if (/poor|damaged|broken/.test(condition)) {
    lowRetention -= 0.1;
    highRetention -= 0.1;
  } else if (/fair/.test(condition)) {
    lowRetention -= 0.05;
    highRetention -= 0.05;
  }

  lowRetention = Math.max(0.05, Math.min(0.9, lowRetention));
  highRetention = Math.max(
    lowRetention + 0.05,
    Math.min(0.95, highRetention),
  );

  const low = Math.round((price * lowRetention) / 100) * 100;
  const high = Math.max(
    low,
    Math.round((price * highRetention) / 100) * 100,
  );

  let recommendation;
  let recommendationDetail;

  if (age < 1) {
    recommendation = "Check demand before selling";
    recommendationDetail =
      "Compare offers for your exact model before deciding.";
  } else if (age < 3) {
    recommendation = "Evaluate your resale options";
    recommendationDetail =
      "Compare resale offers with the cost of keeping the product.";
  } else {
    recommendation = "Consider selling if replacing";
    recommendationDetail =
      "If you plan to upgrade, compare real offers and repair costs first.";
  }

  return {
    available: true,
    low,
    high,
    age,
    recommendation,
    recommendationDetail,
    assumptions: condition
      ? `Estimate uses purchase age and recorded condition (${condition}).`
      : "Estimate uses purchase age; product condition was not available.",
  };
}

function getCategoryIcon(category = "") {
  const value = category.toLowerCase();

  if (/phone|mobile|laptop|computer|tablet|electronic/.test(value)) {
    return "device";
  }

  if (/appliance|washing|refrigerator|microwave|air condition/.test(value)) {
    return "appliance";
  }

  if (/furniture|chair|table|sofa/.test(value)) {
    return "furniture";
  }

  return "general";
}

function ProductIcon({ category }) {
  const type = getCategoryIcon(category);

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
      {type === "device" ? (
        <FiPackage size={25} />
      ) : type === "appliance" ? (
        <FiBox size={25} />
      ) : type === "furniture" ? (
        <FiShield size={25} />
      ) : (
        <FiTag size={25} />
      )}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-7 h-3 w-1/3 rounded bg-slate-100" />
      <div className="mt-3 h-8 w-2/3 rounded bg-slate-100" />
      <div className="mt-6 h-20 rounded-2xl bg-slate-100" />
    </div>
  );
}

function AssetCard({ asset }) {
  const estimate = estimateResale(asset);
  const title = asset.product_name || "Unnamed product";
  const subtitle = [asset.brand, asset.model].filter(Boolean).join(" · ");
  const category = asset.category || "Uncategorized";
  const purchasePrice = Number(asset.purchase_price);
  const hasPurchasePrice =
    Number.isFinite(purchasePrice) && purchasePrice > 0;

  return (
    <article className="flex min-w-0 flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-6">
      <div className="flex items-start gap-3">
        <ProductIcon category={category} />

        <div className="min-w-0 flex-1">
          <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            <span className="truncate">{category}</span>
          </span>

          <h2 className="mt-2 break-words text-base font-bold leading-6 text-slate-900">
            {title}
          </h2>

          <p className="mt-1 break-words text-sm text-slate-500">
            {subtitle || "Brand and model not provided"}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FiDollarSign className="text-violet-600" />
          Estimated resale value
          <span
            className="ml-auto text-slate-400"
            title="Planning estimate, not a verified market quote"
          >
            <FiInfo />
          </span>
        </div>

        {estimate.available ? (
          <>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              {formatINR(estimate.low)}
              <span className="px-1 text-base font-medium text-slate-400">
                –
              </span>
              {formatINR(estimate.high)}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Approximate range · not a market quote
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-lg font-bold text-slate-700">
              Estimate unavailable
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {estimate.reason} to calculate a planning range.
            </p>
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Original price</p>
          <p className="mt-1 break-words text-sm font-bold text-slate-800">
            {hasPurchasePrice ? formatINR(purchasePrice) : "Not provided"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Product age</p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {estimate.age === null
              ? "Unknown"
              : estimate.age < 1
                ? "Less than 1 year"
                : `${Math.floor(estimate.age)} year${Math.floor(estimate.age) === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-violet-700">
            {estimate.available ? (
              <FiTrendingUp size={18} />
            ) : (
              <FiInfo size={18} />
            )}
          </span>

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">
              {estimate.available
                ? estimate.recommendation
                : "Complete product details"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              {estimate.available
                ? estimate.recommendationDetail
                : "Add purchase information to see an approximate resale range."}
            </p>
          </div>
        </div>
      </div>

      {estimate.available && (
        <details className="mt-4 text-xs leading-5 text-slate-500">
          <summary className="w-fit cursor-pointer font-semibold text-violet-700 hover:text-violet-900">
            How was this estimated?
          </summary>
          <p className="mt-2">
            {estimate.assumptions} A broad age-based retention range is
            applied to the original purchase price. Actual offers may be
            substantially different.
          </p>
        </details>
      )}

      <div className="mt-auto pt-5">
        <Link
          to={`/products/${asset.id}`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
        >
          View product details <FiArrowRight />
        </Link>
      </div>
    </article>
  );
}

export default function ResaleCenter() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signedOut, setSignedOut] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Resale request form state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError("");
    setSignedOut(false);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData?.user;

      if (!user) {
        setSignedOut(true);
        setAssets([]);
        return;
      }

      const { data, error: assetsError } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", user.id);

      if (assetsError) throw assetsError;

      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Resale Center loading error:", err);
      setError(err?.message || "Unable to load your products.");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");
      setSignedOut(false);

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData?.user;

        if (!user) {
          if (!cancelled) {
            setSignedOut(true);
            setAssets([]);
          }
          return;
        }

        const { data, error: assetsError } = await supabase
          .from("assets")
          .select("*")
          .eq("user_id", user.id);

        if (assetsError) throw assetsError;

        if (!cancelled) {
          setAssets(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Resale Center loading error:", err);

        if (!cancelled) {
          setError(err?.message || "Unable to load your products.");
          setAssets([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  // Submit a resale request to Supabase
  const submitResaleRequest = async (event) => {
    event.preventDefault();

    setRequestMessage("");
    setRequestError("");

    if (!selectedAsset) {
      setRequestError("Please select a product.");
      return;
    }

    const estimate = estimateResale(selectedAsset);

    if (!estimate.available) {
      setRequestError(
        "Please add a valid purchase price and purchase date before submitting.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData?.user;

      if (!user) {
        setRequestError("Please sign in before submitting a request.");
        return;
      }

      const { error: insertError } = await supabase
        .from("resale_requests")
        .insert({
          user_id: user.id,
          asset_id: String(selectedAsset.id),
          product_name: selectedAsset.product_name || "Unnamed product",
          estimated_value: Math.round(
            (estimate.low + estimate.high) / 2,
          ),
          description: description.trim() || null,
        });

      if (insertError) throw insertError;

      setRequestMessage(
        "Your resale request was submitted successfully!",
      );
      setSelectedAsset(null);
      setDescription("");
    } catch (err) {
      console.error("Resale request submission failed:", err);
      setRequestError(
        err?.message || "Could not submit your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const categories = useMemo(
    () =>
      [...new Set(assets.map((asset) => asset.category).filter(Boolean))].sort(),
    [assets],
  );

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assets
      .filter((asset) => {
        const matchesSearch = [
          asset.product_name,
          asset.brand,
          asset.model,
          asset.category,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

        const matchesCategory =
          categoryFilter === "all" || asset.category === categoryFilter;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "price-high") {
          return (
            (Number(b.purchase_price) || 0) -
            (Number(a.purchase_price) || 0)
          );
        }

        if (sortBy === "price-low") {
          return (
            (Number(a.purchase_price) || 0) -
            (Number(b.purchase_price) || 0)
          );
        }

        if (sortBy === "age") {
          return (
            (getAssetAge(b.purchase_date) ?? -1) -
            (getAssetAge(a.purchase_date) ?? -1)
          );
        }

        return String(a.product_name || "").localeCompare(
          String(b.product_name || ""),
        );
      });
  }, [assets, search, categoryFilter, sortBy]);

  const estimatedAssets = useMemo(
    () => assets.filter((asset) => estimateResale(asset).available),
    [assets],
  );

  const estimatedValue = useMemo(
    () =>
      estimatedAssets.reduce((total, asset) => {
        const estimate = estimateResale(asset);
        return total + (estimate.low + estimate.high) / 2;
      }, 0),
    [estimatedAssets],
  );

  return (
    <div className="min-h-screen bg-[#f7f7fc] text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-60">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation"
            >
              <FiMenu size={20} />
            </button>

            <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
              <span>Workspace</span>
              <FiArrowRight size={14} />
              <span className="font-semibold text-slate-700">
                Resale Center
              </span>
            </div>

            <span className="truncate text-sm font-bold sm:hidden">
              Resale Center
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <FiPackage size={17} />
              <span className="hidden sm:inline">My Products</span>
            </Link>

            <Link
              to="/profile"
              aria-label="Profile"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-violet-700 transition hover:bg-violet-100"
            >
              <FiShield size={18} />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
                <FiTrendingUp size={14} />
                Asset value insights
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Resale Center
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Explore estimated resale values and make a more informed
                decision about when to sell your assets.
              </p>
            </div>

            <Link
              to="/add-asset"
              className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-800 md:self-auto"
            >
              <FiPackage size={17} />
              Add a product
            </Link>
          </div>

          {/* Summary cards */}
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Registered products
                </p>
                <span className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
                  <FiPackage size={19} />
                </span>
              </div>

              <p className="mt-4 text-3xl font-extrabold tracking-tight">
                {loading ? "—" : assets.length}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Products linked to your account
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Products with estimates
                </p>
                <span className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                  <FiCheckCircle size={19} />
                </span>
              </div>

              <p className="mt-4 text-3xl font-extrabold tracking-tight">
                {loading ? "—" : estimatedAssets.length}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Requires purchase price and date
              </p>
            </div>

            <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm sm:col-span-2 sm:p-6 xl:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Approximate portfolio value
                </p>
                <span className="rounded-xl bg-white p-2.5 text-violet-700 shadow-sm">
                  <FiDollarSign size={19} />
                </span>
              </div>

              <p className="mt-4 break-words text-2xl font-extrabold tracking-tight sm:text-3xl">
                {loading ? "—" : formatINR(estimatedValue)}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Midpoint of estimates shown below; not a confirmed selling price.
              </p>
            </div>
          </div>

          {/* Estimate disclaimer */}
          <div className="mt-8 rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-sky-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-3 text-violet-700 shadow-sm">
                <FiInfo size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Understand your resale estimate
                </h2>

                <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
                  Values are broad planning estimates based on purchase price,
                  recorded age and available condition details. They are not
                  live marketplace prices or guaranteed offers.
                </p>
              </div>
            </div>
          </div>

          {/* Resale request form */}
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-extrabold text-slate-900">
              Submit a resale request
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Select a registered product and send your request for review.
            </p>

            {requestMessage && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              >
                {requestMessage}
              </div>
            )}

            {requestError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              >
                {requestError}
              </div>
            )}

            <form onSubmit={submitResaleRequest} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="resale-asset"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Select product
                </label>

                <select
                  id="resale-asset"
                  value={selectedAsset?.id ?? ""}
                  onChange={(event) => {
                    const asset = assets.find(
                      (item) => String(item.id) === event.target.value,
                    );

                    setSelectedAsset(asset || null);
                    setRequestError("");
                    setRequestMessage("");
                  }}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  required
                  disabled={loading || signedOut || assets.length === 0}
                >
                  <option value="">Choose a registered product</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={String(asset.id)}>
                      {asset.product_name || "Unnamed product"}
                      {asset.brand ? ` — ${asset.brand}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAsset && (
                <div className="rounded-xl bg-violet-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedAsset.product_name || "Unnamed product"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {estimateResale(selectedAsset).available
                      ? `Estimated range: ${formatINR(estimateResale(selectedAsset).low)} – ${formatINR(estimateResale(selectedAsset).high)}`
                      : "Add a valid purchase price and purchase date to submit this request."}
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="resale-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Additional details (optional)
                </label>

                <textarea
                  id="resale-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the product condition, accessories, or other details..."
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  loading ||
                  !selectedAsset ||
                  !estimateResale(selectedAsset).available
                }
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {submitting ? "Submitting..." : "Submit resale request"}
                {!submitting && <FiArrowRight />}
              </button>
            </form>
          </section>

          {/* Product search, filters and cards */}
          <section className="mt-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                  Your products
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review each asset and its estimated resale range.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center">
                <label className="relative block xl:w-72">
                  <FiSearch
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, brand or model"
                    aria-label="Search products"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                </label>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  aria-label="Filter by category"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  aria-label="Sort products"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="name">Name: A–Z</option>
                  <option value="price-high">Purchase price: high–low</option>
                  <option value="price-low">Purchase price: low–high</option>
                  <option value="age">Oldest first</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <LoadingCard key={index} />
                ))}
              </div>
            ) : error ? (
              <div
                className="mt-6 rounded-3xl border border-rose-200 bg-white p-8 text-center"
                role="alert"
              >
                <p className="font-bold text-slate-900">
                  We couldn't load your products
                </p>

                <p className="mx-auto mt-2 max-w-xl break-words text-sm text-slate-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadAssets}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
                >
                  <FiRefreshCw size={16} />
                  Try again
                </button>
              </div>
            ) : signedOut ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center">
                <FiShield className="mx-auto text-violet-600" size={32} />

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Sign in to view your assets
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Your resale estimates are available after you sign in.
                </p>

                <Link
                  to="/login"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
                >
                  Sign in <FiArrowRight />
                </Link>
              </div>
            ) : assets.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <FiPackage className="mx-auto text-violet-600" size={34} />

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  No products registered yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Add a product to see its details and an approximate resale
                  value when purchase information is available.
                </p>

                <Link
                  to="/add-asset"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
                >
                  Add your first product <FiArrowRight />
                </Link>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center">
                <FiSearch className="mx-auto text-slate-400" size={30} />

                <h3 className="mt-3 font-bold text-slate-900">
                  No matching products
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try another search term or category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                  }}
                  className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <p className="mt-5 text-xs font-medium text-slate-500">
                  Showing {filteredAssets.length} of {assets.length} products
                </p>

                <div className="mt-4 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              </>
            )}
          </section>

          <footer className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2">
              <FiInfo className="shrink-0" />
              Estimates are indicative only; actual resale offers can vary.
            </p>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 font-semibold text-violet-700 hover:text-violet-900"
            >
              Manage all products <FiArrowRight />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
