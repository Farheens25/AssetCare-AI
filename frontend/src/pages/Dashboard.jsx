import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiLogOut,
  FiPlus,
  FiPackage,
  FiShield,
  FiCalendar,
  FiArrowRight,
  FiMenu,
} from "react-icons/fi";
import { supabase } from "../lib/supabase";

function Dashboard() {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Mobile menu state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
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

        // Get user's assets
        const { data, error: assetsError } = await supabase
          .from("assets")
          .select("*")
          .eq("user_id", user.id);

        if (assetsError) {
          throw assetsError;
        }

        if (!cancelled) {
          setUser(user);
          setAssets(data || []);
        }
      } catch (err) {
        console.error("Dashboard error:", err);

        if (!cancelled) {
          setError(err.message || "Unable to load dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshKey]);

  // -----------------------------
  // LOGOUT
  // -----------------------------

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // -----------------------------
  // WARRANTY DATA
  // -----------------------------

  const assetsWithWarranty = assets.filter(
    (asset) => asset.warranty_expiry
  );

  const expiringSoonAssets = assets.filter((asset) => {
    if (!asset.warranty_expiry) {
      return false;
    }

    const today = new Date();
    const expiry = new Date(asset.warranty_expiry);

    const difference =
      (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);

    return difference >= 0 && difference <= 30;
  });

  // -----------------------------
  // WARRANTY STATUS
  // -----------------------------

  const getWarrantyStatus = (expiryDate) => {
    if (!expiryDate) {
      return {
        label: "No warranty",
        className: "bg-slate-100 text-slate-600",
      };
    }

    const today = new Date();
    const expiry = new Date(expiryDate);

    const difference =
      (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24);

    if (difference < 0) {
      return {
        label: "Expired",
        className: "bg-red-50 text-red-600",
      };
    }

    if (difference <= 30) {
      return {
        label: "Expiring soon",
        className: "bg-orange-50 text-orange-600",
      };
    }

    return {
      label: "Active",
      className: "bg-green-50 text-green-600",
    };
  };

  // -----------------------------
  // FORMAT DATE
  // -----------------------------

  const formatDate = (date) => {
    if (!date) {
      return "Not added";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // -----------------------------
  // LOADING
  // -----------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // ERROR
  // -----------------------------

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">

          <h1 className="text-lg font-bold text-slate-900">
            Unable to load dashboard
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              setRefreshKey((previous) => previous + 1);
            }}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>

        </div>
      </div>
    );
  }

  // -----------------------------
  // DASHBOARD
  // -----------------------------

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =========================================
          MOBILE SIDEBAR OVERLAY
      ========================================= */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-72 flex-col
          border-r border-slate-200
          bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">

          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            AssetCare-AI
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            ✕
          </button>

        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">

          {/* Overview */}
          <div className="mb-6">

            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Overview
            </p>

            <div className="space-y-1">

              <Link
                to="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-600"
              >
                <FiPackage size={17} />
                Dashboard
              </Link>

              <Link
                to="/products"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <FiPackage size={17} />
                My Assets
              </Link>

              <Link
                to="/add-asset"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <FiPlus size={17} />
                Add Asset
              </Link>

            </div>
          </div>

          {/* Intelligence */}
          <div className="mb-6">

            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Intelligence
            </p>

            <div className="space-y-1">

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                💬
                AI Assistant
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                ❤️
                Product Health
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                🛠️
                Predictive Care
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                📊
                Repair vs Replace
              </button>

            </div>
          </div>

          {/* Care */}
          <div className="mb-6">

            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Care
            </p>

            <div className="space-y-1">

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                🔧
                Service History
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                📅
                Book Service
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                🔔
                Smart Reminders
              </button>

   <Link
  to="/calendar"
  onClick={() => setSidebarOpen(false)}
  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
>
  <FiCalendar size={17} />
  Calendar
</Link>

            </div>
          </div>

          {/* Assets */}
          <div className="mb-6">

            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Assets
            </p>

            <div className="space-y-1">

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                🏠
                Home Assets
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                📄
                Document Vault
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                🛡️
                Insurance
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                🔍
                Recalls
              </button>

            </div>
          </div>

          {/* Workspace */}
          <div className="mb-6">

            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </p>

            <div className="space-y-1">

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                👥
                Family Mode
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                💼
                Business
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                ❓
                Support
              </button>

              <Link
                to="/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                ⚙️
                Settings
              </Link>

            </div>
          </div>

        </nav>
      </aside>

      {/* =========================================
          MAIN AREA
      ========================================= */}

      <div className="lg:pl-72">

        {/* =========================================
            HEADER
        ========================================= */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">

          <div className="flex h-16 items-center justify-between px-4 sm:px-6">

            {/* Mobile Menu */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <FiMenu size={22} />
            </button>

            {/* Desktop Logo */}
            <Link
              to="/dashboard"
              className="hidden text-lg font-bold tracking-tight text-slate-900 lg:block"
            >
              AssetCare-AI
            </Link>

            {/* Right Side */}
            <div className="ml-auto flex items-center gap-2 sm:gap-4">

              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600"
              >
                <FiUser size={16} />

                <span className="hidden sm:inline">
                  Profile
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600"
              >
                <FiLogOut size={16} />

                <span className="hidden sm:inline">
                  Logout
                </span>
              </button>

            </div>
          </div>
        </header>

        {/* =========================================
            DASHBOARD CONTENT
        ========================================= */}

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

          {/* Welcome */}
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-sm font-medium text-blue-600">
                  Your asset overview
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Welcome back,{" "}
                  {user?.user_metadata?.full_name ||
                    user?.email?.split("@")[0] ||
                    "there"}{" "}
                  👋
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Keep track of your products, warranties and
                  important information in one place.
                </p>

              </div>

              <Link
                to="/add-asset"
                className="flex w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                <FiPlus size={17} />
                Add Asset
              </Link>

            </div>
          </motion.section>

          {/* =========================================
              STATISTICS
          ========================================= */}

          <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Total Assets */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Total Assets
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {assets.length}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FiPackage size={20} />
                </div>

              </div>
            </div>

            {/* Warranty */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    With Warranty
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {assetsWithWarranty.length}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <FiShield size={20} />
                </div>

              </div>
            </div>

            {/* Expiring Soon */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Expiring Soon
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {expiringSoonAssets.length}
                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <FiCalendar size={20} />
                </div>

              </div>
            </div>

          </section>

          {/* =========================================
              ASSETS
          ========================================= */}

          <section>

            <div className="mb-5">

              <h2 className="text-xl font-bold text-slate-900">
                Your Assets
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Products currently being managed by AssetCare-AI.
              </p>

            </div>

            {/* No Assets */}
            {assets.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FiPackage size={25} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No assets yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Add your first product to start tracking
                  warranties and important details.
                </p>

                <Link
                  to="/add-asset"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <FiPlus size={17} />
                  Add your first asset
                </Link>

              </div>

            ) : (

              /* Asset Cards */
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                {assets.map((asset) => {

                  const warrantyStatus =
                    getWarrantyStatus(
                      asset.warranty_expiry
                    );

                  return (
                    <motion.div
                      key={asset.id}
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg"
                    >

                      {/* Asset Header */}
                      <div className="flex items-start gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FiPackage size={20} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <h3 className="truncate text-base font-bold text-slate-900">
                            {asset.product_name ||
                              "Unnamed Asset"}
                          </h3>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {asset.category ||
                              "Category not added"}
                          </p>

                        </div>

                      </div>

                      {/* Warranty Status */}
                      <div className="mt-4">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${warrantyStatus.className}`}
                        >
                          {warrantyStatus.label}
                        </span>

                      </div>

                      {/* Asset Information */}
                      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">

                        {asset.brand && (
                          <div className="flex justify-between gap-4">

                            <span className="text-sm text-slate-500">
                              Brand
                            </span>

                            <span className="truncate text-sm font-medium text-slate-800">
                              {asset.brand}
                            </span>

                          </div>
                        )}

                        {asset.model && (
                          <div className="flex justify-between gap-4">

                            <span className="text-sm text-slate-500">
                              Model
                            </span>

                            <span className="truncate text-sm font-medium text-slate-800">
                              {asset.model}
                            </span>

                          </div>
                        )}

                        {asset.purchase_date && (
                          <div className="flex justify-between gap-4">

                            <span className="text-sm text-slate-500">
                              Purchased
                            </span>

                            <span className="text-sm font-medium text-slate-800">
                              {formatDate(
                                asset.purchase_date
                              )}
                            </span>

                          </div>
                        )}

                        {asset.warranty_expiry && (
                          <div className="flex justify-between gap-4">

                            <span className="text-sm text-slate-500">
                              Warranty
                            </span>

                            <span className="text-sm font-medium text-slate-800">
                              {formatDate(
                                asset.warranty_expiry
                              )}
                            </span>

                          </div>
                        )}

                      </div>

                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() =>
                          alert(
                            "Asset Details page will be created next."
                          )
                        }
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        View Details
                        <FiArrowRight size={16} />
                      </button>

                    </motion.div>
                  );
                })}

              </div>
            )}

          </section>

        </main>
      </div>
    </div>
  );
}

export default Dashboard;