
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiUser, FiLogOut, FiHome } from "react-icons/fi";
import { supabase } from "../lib/supabase";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

function HomeAsset() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
   const loadAssets = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error: assetsError } = await supabase
        .from("assets")
        .select(
          "id, product_name, category, brand, purchase_price, location_in_home, purchase_date, warranty_expiry"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (assetsError) {
        throw assetsError;
      }

      setAssets(data || []);
    } catch (err) {
      console.error("Home Assets error:", err);
      setError(err.message || "Unable to load your assets.");
    } finally {
      setLoading(false);
    }
  };

  loadAssets();
}, []);



    
// Calculate total value of all assets
const totalAssetValue = assets.reduce((total, asset) => {
  return total + Number(asset.purchase_price || 0);
}, 0);

// Count assets by room/location
const roomTotals = assets.reduce((result, asset) => {
  const room = asset.location_in_home?.trim() || "Not specified";
  const price = Number(asset.purchase_price || 0);

  if (!result[room]) {
    result[room] = {
      count: 0,
      totalValue: 0,
    };
  }

  result[room].count += 1;
  result[room].totalValue += price;

  return result;
}, {});

// Format prices in Indian Rupees
const formatPrice = (amount) => {
  return `₹${Number(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <FiMenu size={22} />
            </button>

            <Link
              to="/dashboard"
              className="hidden text-lg font-bold text-slate-900 lg:block"
            >
              AssetCare-AI
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 text-sm text-slate-600"
              >
                <FiUser size={16} />
                Profile
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-slate-600 hover:text-red-600"
              >
                <FiLogOut size={16} />
                <span className="ml-1">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiHome size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Home Assets
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage and track the assets in your home.
              </p>
            </div>
          </div>

          
{loading ? (
  <div className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">
    Loading your home assets...
  </div>
) : error ? (
  <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-red-600">
    {error}
  </div>
) : (
  <>
    {/* Summary Cards */}
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Total Assets</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          {assets.length}
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Total Asset Value</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          {formatPrice(totalAssetValue)}
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Rooms / Locations</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          {Object.keys(roomTotals).length}
        </h2>
      </div>
    </section>

    {/* Room-wise Overview */}
    <section className="mt-10">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          Assets by Room
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          See how your assets and their purchase values are distributed.
        </p>
      </div>

      {Object.keys(roomTotals).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">No assets found</p>
          <p className="mt-2 text-sm text-slate-500">
            Add your first asset to see your home overview.
          </p>
          <Link
            to="/add-asset"
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Asset
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(roomTotals).map(([room, details]) => (
            <div
              key={room}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-slate-900">
                {room}
              </h3>

              <p className="mt-3 text-sm text-slate-500">
                Number of assets
              </p>
              <p className="text-2xl font-semibold text-slate-800">
                {details.count}
              </p>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">Total purchase value</p>
                <p className="mt-1 text-xl font-bold text-blue-600">
                  {formatPrice(details.totalValue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    {/* All Assets */}
    <section className="mt-10">
      <h2 className="mb-5 text-xl font-bold text-slate-900">
        All Home Assets
      </h2>

      {assets.length === 0 ? (
        <p className="text-sm text-slate-500">
          No assets have been added yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Purchase Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {asset.product_name}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {asset.category || "Not specified"}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {asset.location_in_home || "Not specified"}
                  </td>
                  <td className="px-5 py-4 text-slate-800">
                    {formatPrice(asset.purchase_price || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </>
)}

        </main>
      </div>
    </div>
  );
}

export default HomeAsset;
