
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  FiArrowLeft,
  FiCalendar,
  FiShield,
  FiPackage,
  FiFileText,
} from "react-icons/fi";
import { supabase } from "../lib/supabase";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAsset() {
      setLoading(true);
      setError("");
      setDocumentUrl("");
      setDocumentError("");

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

        const { data, error: assetError } = await supabase
          .from("assets")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (assetError) throw assetError;

        if (cancelled) return;

        setAsset(data);

        if (data.product_photo_path) {
          const { data: photo } = await supabase.storage
            .from("asset-photos")
            .createSignedUrl(data.product_photo_path, 3600);

          if (!cancelled) setPhotoUrl(photo?.signedUrl || "");
        }

        const path = data.invoice_file_path?.trim();
        if (path) {
          try {
            const { data: document, error: signingError } =
              await supabase.storage
                .from("asset-documents")
                .createSignedUrl(path, 3600);

            if (signingError) throw signingError;
            if (!document?.signedUrl) {
              throw new Error("Supabase did not return a signed URL.");
            }

            if (!cancelled) setDocumentUrl(document.signedUrl);
          } catch (signingError) {
            console.error(
              "Invoice document signing failed:",
              signingError.message || signingError,
            );
            if (!cancelled) {
              setDocumentError(
                "The uploaded document is currently unavailable. Please try again later.",
              );
            }
          }
        }
      } catch (err) {
        console.error("Asset details error:", err);
        if (!cancelled) {
          setError(err.message || "Unable to load this asset.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAsset();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const formatDate = (value) => {
    if (!value) return "Not provided";

    const date = new Date(`${value}T00:00:00`);

    return Number.isNaN(date.getTime())
      ? "Not provided"
      : date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const sidebar = (
    <DashboardSidebar
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
    />
  );
  const mobileMenuButton = (
    <button
      type="button"
      onClick={() => setSidebarOpen(true)}
      aria-label="Open navigation menu"
      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
    >
      <Menu size={21} aria-hidden="true" />
    </button>
  );

  if (loading) {
    return (
      <>
        {sidebar}
        <main className="min-h-screen bg-slate-50 p-8 lg:pl-60">
          {mobileMenuButton}
          <p>Loading your asset details...</p>
        </main>
      </>
    );
  }

  if (error || !asset) {
    return (
      <>
        {sidebar}
        <main className="min-h-screen bg-slate-50 p-8 lg:pl-60">
          {mobileMenuButton}
          <p className="text-red-600">
            {error || "Asset not found or you do not have access to it."}
          </p>
          <Link to="/products" className="mt-4 inline-block text-blue-600">
            Back to My Assets
          </Link>
        </main>
      </>
    );
  }

  const fields = [
    ["Brand", asset.brand],
    ["Category", asset.category],
    ["Model", asset.model],
    ["Serial number", asset.serial_number],
    ["Invoice number", asset.invoice_number],
    ["Purchase date", formatDate(asset.purchase_date)],
    [
      "Warranty duration",
      asset.warranty_months != null
        ? `${asset.warranty_months} months`
        : null,
    ],
    ["Warranty expiry", formatDate(asset.warranty_expiry)],
    ["Store", asset.store_name],
    [
      "Purchase price",
      asset.purchase_price != null
        ? `₹${Number(asset.purchase_price).toLocaleString("en-IN")}`
        : null,
    ],
    ["Home location", asset.location_in_home],
  ];
  const hasDocumentPath = Boolean(asset.invoice_file_path?.trim());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {sidebar}

      <main className="space-y-6 p-4 sm:p-8 lg:ml-60">
        <div className="flex items-center gap-3">
          {mobileMenuButton}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
          >
            <FiArrowLeft /> Back to My Assets
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr] md:p-8">
            <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={asset.product_name}
                  className="h-full max-h-64 w-full object-contain"
                />
              ) : (
                <FiPackage size={64} className="text-slate-400" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Your registered asset
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                {asset.product_name || "Unnamed asset"}
              </h1>
              <p className="mt-2 text-slate-500">
                {[asset.brand, asset.model, asset.category]
                  .filter(Boolean)
                  .join(" · ") || "Product details"}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <FiShield className="mb-2 text-blue-600" size={20} />
                  <p className="text-xs text-slate-500">Warranty expiry</p>
                  <p className="mt-1 font-semibold">
                    {formatDate(asset.warranty_expiry)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <FiCalendar className="mb-2 text-blue-600" size={20} />
                  <p className="text-xs text-slate-500">Purchase date</p>
                  <p className="mt-1 font-semibold">
                    {formatDate(asset.purchase_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Product information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 break-words font-semibold">
                  {value || "Not provided"}
                </p>
              </div>
            ))}
          </div>

          {asset.notes && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{asset.notes}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Documents</h2>

          {documentUrl ? (
            <a
              href={documentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-medium text-blue-600 hover:bg-blue-50"
            >
              <FiFileText /> Open invoice or warranty document
            </a>
          ) : hasDocumentPath ? (
            <p className="mt-3 text-sm text-red-600">
              {documentError ||
                "The uploaded document is currently unavailable. Please try again later."}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No uploaded invoice or warranty document is available for this asset.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Health and service</h2>
          <p className="mt-2 text-sm text-slate-500">
            View the existing health assessment and service features for your products.
            Historical trends will appear here when real historical records are available.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/health"
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Product Health
            </Link>
            <Link
              to="/book-service"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            >
              Book Service
            </Link>
            <Link
              to="/service-history"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            >
              Service History
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AssetDetails;
