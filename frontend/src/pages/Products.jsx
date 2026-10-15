
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiRefreshCw,
  FiAlertCircle,
  FiShield,
  FiX,
  FiDollarSign,
} from "react-icons/fi";
import { supabase } from "../lib/supabase";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

function Products() {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          navigate("/login");
          return;
        }

        const { data, error: assetsError } = await supabase
          .from("assets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (assetsError) throw assetsError;

        if (!cancelled) {
          setAssets(data || []);
        }
      } catch (err) {
        console.error("My Assets loading error:", err);

        if (!cancelled) {
          setError(err.message || "Unable to load your assets.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const getWarrantyStatus = (expiryDate) => {
    if (!expiryDate) return "unknown";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${expiryDate}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return "unknown";

    const daysLeft = Math.ceil(
      (expiry.getTime() - today.getTime()) / 86400000,
    );

    if (daysLeft < 0) return "expired";
    if (daysLeft <= 30) return "expiring";
    return "active";
  };

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch = [
        asset.product_name,
        asset.brand,
        asset.serial_number,
        asset.model,
        asset.category,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const status = getWarrantyStatus(asset.warranty_expiry);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && status === "active") ||
        (filter === "expiring" && status === "expiring") ||
        (filter === "expired" && status === "expired") ||
        (filter === "unknown" && status === "unknown");

      return matchesSearch && matchesFilter;
    });
  }, [assets, search, filter]);

  const formatDate = (date) => {
    if (!date) return "Not provided";

    const parsed = new Date(`${date}T00:00:00`);

    return Number.isNaN(parsed.getTime())
      ? "Not provided"
      : parsed.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "Price not provided";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price));
  };

  const statusDetails = {
    active: {
      label: "Under warranty",
      className: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },
    expiring: {
      label: "Expiring soon",
      className: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    },
    expired: {
      label: "Expired",
      className: "bg-red-50 text-red-700",
      dot: "bg-red-500",
    },
    unknown: {
      label: "No expiry date",
      className: "bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    },
  };

  const counts = {
    all: assets.length,
    active: assets.filter(
      (asset) => getWarrantyStatus(asset.warranty_expiry) === "active",
    ).length,
    expiring: assets.filter(
      (asset) => getWarrantyStatus(asset.warranty_expiry) === "expiring",
    ).length,
    expired: assets.filter(
      (asset) => getWarrantyStatus(asset.warranty_expiry) === "expired",
    ).length,
  };

  const filters = [
    { id: "all", label: "All assets", count: counts.all },
    { id: "active", label: "Under warranty", count: counts.active },
    { id: "expiring", label: "Expiring soon", count: counts.expiring },
    { id: "expired", label: "Expired", count: counts.expired },
    { id: "unknown", label: "No expiry date" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
            aria-label="Open menu"
          >
            <FiPackage size={20} />
          </button>

          <div className="relative max-w-xl flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your assets..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            title="Refresh assets"
          >
            <FiRefreshCw size={17} />
          </button>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-600">
                YOUR PERSONAL INVENTORY
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My Assets
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage your registered products and warranty details.
              </p>
            </div>

            <Link
              to="/add-asset"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <FiPlus size={18} />
              Add Asset
            </Link>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total assets",
                value: counts.all,
                icon: FiPackage,
                color: "bg-blue-50 text-blue-600",
              },
              {
                label: "Under warranty",
                value: counts.active,
                icon: FiShield,
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                label: "Expiring soon",
                value: counts.expiring,
                icon: FiCalendar,
                color: "bg-amber-50 text-amber-600",
              },
              {
                label: "Expired",
                value: counts.expired,
                icon: FiAlertCircle,
                color: "bg-red-50 text-red-600",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <span className={`rounded-xl p-2.5 ${item.color}`}>
                      <Icon size={19} />
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-bold">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Based on your saved assets
                  </p>
                </div>
              );
            })}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold">Your registered products</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Loading your assets..."
                    : `${filteredAssets.length} of ${assets.length} assets`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                      filter === item.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                    {item.count !== undefined && (
                      <span className="ml-1.5 opacity-75">
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold">Unable to load your assets</p>
                  <p className="mt-1">{error}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-2 font-semibold underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-64 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : !error && filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="rounded-2xl bg-blue-50 p-5 text-blue-600">
                  {assets.length === 0 ? (
                    <FiPackage size={32} />
                  ) : (
                    <FiSearch size={32} />
                  )}
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  {assets.length === 0
                    ? "No assets added yet"
                    : "No matching assets"}
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  {assets.length === 0
                    ? "Add your first product to start tracking its warranty and maintenance."
                    : "Try another search term or change the warranty filter."}
                </p>

                {assets.length === 0 ? (
                  <Link
                    to="/add-asset"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <FiPlus size={17} />
                    Add your first asset
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setFilter("all");
                    }}
                    className="mt-5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAssets.map((asset) => {
                  const status = getWarrantyStatus(asset.warranty_expiry);
                  const badge = statusDetails[status];

                  return (
                    <article
                      key={asset.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100">
                        <FiPackage
                          size={45}
                          className="text-blue-400 transition group-hover:scale-110"
                        />
                      </div>

                      <div className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words font-bold leading-6">
                              {asset.product_name || "Unnamed asset"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {[asset.brand, asset.category]
                                .filter(Boolean)
                                .join(" · ") || "Category not provided"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="space-y-2.5 text-sm text-slate-600">
                          {asset.model && (
                            <p>
                              <span className="text-slate-400">Model: </span>
                              {asset.model}
                            </p>
                          )}

                          {asset.serial_number && (
                            <p className="break-all">
                              <span className="text-slate-400">
                                Serial number:{" "}
                              </span>
                              {asset.serial_number}
                            </p>
                          )}

                          <p className="flex items-center gap-2">
                            <FiCalendar className="shrink-0 text-slate-400" />
                            <span>
                              Warranty expiry:{" "}
                              {formatDate(asset.warranty_expiry)}
                            </span>
                          </p>

                          {asset.location_in_home && (
                            <p className="flex items-center gap-2">
                              <FiMapPin className="shrink-0 text-slate-400" />
                              {asset.location_in_home}
                            </p>
                          )}

                          <p className="flex items-center gap-2 font-semibold text-slate-800">
                            <FiDollarSign className="shrink-0 text-slate-400" />
                            {formatPrice(asset.purchase_price)}
                          </p>
                        </div>

                        <button
  type="button"
  onClick={() => navigate(`/products/${asset.id}`)}
  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
>
  View details
</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedAsset && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="asset-details-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  ASSET DETAILS
                </p>
                <h2
                  id="asset-details-title"
                  className="mt-1 text-2xl font-bold"
                >
                  {selectedAsset.product_name || "Unnamed asset"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close details"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Brand", selectedAsset.brand],
                ["Category", selectedAsset.category],
                ["Model", selectedAsset.model],
                ["Serial number", selectedAsset.serial_number],
                ["Invoice number", selectedAsset.invoice_number],
                ["Purchase date", formatDate(selectedAsset.purchase_date)],
                [
                  "Warranty duration",
                  selectedAsset.warranty_months != null
                    ? `${selectedAsset.warranty_months} months`
                    : null,
                ],
                ["Warranty expiry", formatDate(selectedAsset.warranty_expiry)],
                ["Store", selectedAsset.store_name],
                ["Purchase price", formatPrice(selectedAsset.purchase_price)],
                ["Home location", selectedAsset.location_in_home],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl bg-slate-50 p-3"
                >
                  <p className="text-xs font-medium text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {value || "Not provided"}
                  </p>
                </div>
              ))}
            </div>

            {selectedAsset.notes && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {selectedAsset.notes}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedAsset(null)}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default Products;
