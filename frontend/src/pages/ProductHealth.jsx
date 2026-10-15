
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { supabase } from "../lib/supabase";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiShield,
} from "react-icons/fi";

const lifespanByCategory = {
  Appliances: 10,
  "Home & household products": 8,
  "Personal electronics": 6,
  Vehicles: 12,
  "Business assets": 8,
  Other: 8,
};

function estimateHealth(asset) {
  if (!asset.purchase_date) {
    return null;
  }

  const purchaseDate = new Date(asset.purchase_date);

  if (Number.isNaN(purchaseDate.getTime())) {
    return null;
  }

  const now = new Date();

  if (purchaseDate > now) {
    return null;
  }

  const ageYears =
    (now.getTime() - purchaseDate.getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);

  const lifespan =
    lifespanByCategory[asset.category] || 8;

  // A simple illustrative estimate, not a physical diagnosis.
  let score = Math.round(
    100 - (ageYears / lifespan) * 65
  );

  // Warranty status is supporting context, not proof
  // of the product's actual physical condition.
  if (
    asset.warranty_expiry &&
    new Date(asset.warranty_expiry) >= now
  ) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    ageYears,
    lifespan,
    risk:
      score >= 85
        ? "Low"
        : score >= 70
          ? "Medium"
          : "High",
  };
}

function ProductHealth() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setProducts([]);
        setError("Please log in to view your product health.");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("assets")
        .select(
          "id, product_name, brand, category, model, purchase_date, warranty_expiry, product_photo_path"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setProducts(data || []);
    } catch (err) {
      console.error("Product health error:", err);
      setError(err.message || "Unable to load your products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    [
      product.product_name,
      product.brand,
      product.model,
      product.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const estimates = products
    .map((product) => estimateHealth(product))
    .filter(Boolean);

  const averageHealth = estimates.length
    ? Math.round(
        estimates.reduce((sum, item) => sum + item.score, 0) /
          estimates.length
      )
    : null;

  const riskStyle = (risk) => {
    if (risk === "Low") {
      return {
        text: "text-emerald-700",
        badge: "bg-emerald-50",
        ring: "#059669",
      };
    }

    if (risk === "Medium") {
      return {
        text: "text-amber-700",
        badge: "bg-amber-50",
        ring: "#D97706",
      };
    }

    return {
      text: "text-rose-700",
      badge: "bg-rose-50",
      ring: "#E11D48",
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:ml-60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            <FiArrowLeft />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 font-bold">
            <FiActivity className="text-blue-600" size={22} />
            AssetCare-AI
          </div>

          <button
            onClick={loadProducts}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:ml-60 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            INTELLIGENCE / PRODUCT HEALTH
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Product Health AI
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Monitor estimated health, product age, warranty status
            and potential maintenance needs across your assets.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Registered products
              </span>
              <FiShield className="text-blue-600" size={22} />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {products.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Your saved assets
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Average estimated health
              </span>
              <FiActivity className="text-emerald-600" size={22} />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {averageHealth === null ? "—" : `${averageHealth}/100`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Products with a valid purchase date
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                High estimated risk
              </span>
              <FiAlertCircle className="text-rose-600" size={22} />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {
                estimates.filter((item) => item.risk === "High")
                  .length
              }
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on the illustrative scoring rule
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Your products</h2>
            <p className="mt-1 text-sm text-slate-500">
              Health estimates and warranty information
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your products..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            Loading your products...
          </div>
        ) : !error && filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <FiActivity className="mx-auto text-slate-400" size={36} />
            <h3 className="mt-4 text-lg font-semibold">
              {products.length === 0
                ? "No products registered yet"
                : "No matching products"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {products.length === 0
                ? "Add a product to start viewing its health estimate."
                : "Try a different product name, brand or category."}
            </p>
            {products.length === 0 && (
              <Link
                to="/add-asset"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add a product
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const health = estimateHealth(product);
              const style = health ? riskStyle(health.risk) : null;

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold">
                          {product.product_name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {[product.brand, product.model]
                            .filter(Boolean)
                            .join(" · ") || product.category || "Product"}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {product.category || "Other"}
                      </span>
                    </div>

                    <div className="my-6 flex items-center gap-5">
                      <div
                        className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
                        style={{
                          background: health
                            ? `conic-gradient(${style.ring} ${health.score * 3.6}deg, #E2E8F0 0deg)`
                            : "#E2E8F0",
                        }}
                      >
                        <div className="grid h-20 w-20 place-content-center rounded-full bg-white text-center">
                          <span className="text-2xl font-bold">
                            {health ? health.score : "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {health ? "of 100" : "No estimate"}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-500">
                          Estimated health
                        </p>

                        {health ? (
                          <>
                            <span
                              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style.badge} ${style.text}`}
                            >
                              {health.risk} estimated risk
                            </span>

                            <p className="mt-3 text-sm text-slate-600">
                              Age: {health.ageYears.toFixed(1)} years
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Expected lifespan: {health.lifespan} years
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-amber-700">
                            Add a valid purchase date to calculate an estimate.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-3 text-sm">
                        <FiCalendar className="text-slate-400" />
                        <span className="text-slate-500">Purchased</span>
                        <span className="ml-auto text-right font-medium">
                          {product.purchase_date
                            ? new Date(
                                `${product.purchase_date}T00:00:00`
                              ).toLocaleDateString("en-IN")
                            : "Not provided"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        {product.warranty_expiry &&
                        new Date(`${product.warranty_expiry}T23:59:59`) >= new Date() ? (
                          <FiCheckCircle className="text-emerald-600" />
                        ) : (
                          <FiClock className="text-amber-600" />
                        )}
                        <span className="text-slate-500">Warranty expiry</span>
                        <span className="ml-auto text-right font-medium">
                          {product.warranty_expiry
                            ? new Date(
                                `${product.warranty_expiry}T00:00:00`
                              ).toLocaleDateString("en-IN")
                            : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                    <p className="text-xs leading-5 text-slate-500">
                      Estimate based on age and warranty data. It is not
                      a measured condition or a prediction of failure.
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProductHealth;
