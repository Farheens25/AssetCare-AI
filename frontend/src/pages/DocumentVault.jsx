import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  FiFileText,
  FiSearch,
  FiExternalLink,
  FiArrowLeft,
} from "react-icons/fi";
import { supabase } from "../lib/supabase";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

const filters = ["All", "Bills", "Warranty Cards", "Manuals", "Other"];

function DocumentVault() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
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
            "id, product_name, brand, category, model, invoice_file_path, purchase_date, warranty_expiry",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (assetsError) throw assetsError;

        if (cancelled) return;

        setAssets(data || []);


const savedDocuments = await Promise.all(
  (data || [])
    .filter((asset) => asset.invoice_file_path)
    .map(async (asset) => {
      const path = asset.invoice_file_path.trim();
      const fileName = path.split("/").pop() || "Invoice";
      const extension = fileName.split(".").pop()?.toLowerCase() || "";

      const { data: signedData, error: signedError } =
        await supabase.storage
          .from("asset-documents")
          .createSignedUrl(path, 3600);

      if (signedError) {
        console.error(
          `Signed URL failed for ${path} (${signedError.statusCode || "unknown status"}): ${signedError.message}`,
        );
      }

      return {
        id: asset.id,
        assetId: asset.id,
        assetName: asset.product_name || "Unnamed asset",
        brand: asset.brand,
        category: asset.category,
        fileName,
        extension,
        url: signedData?.signedUrl || "",
        urlError: signedError?.message || "",
        type: "Bill",
        purchaseDate: asset.purchase_date,
        warrantyExpiry: asset.warranty_expiry,
      };
    }),
);

if (!cancelled) setDocuments(savedDocuments);
} catch (err) {
        console.error("Document Vault error:", err);
        if (!cancelled) {
          setError(err.message || "Unable to load your documents.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const visibleDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        [
          document.fileName,
          document.assetName,
          document.brand,
          document.category,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Bills" && document.type === "Bill") ||
        (activeFilter === "Warranty Cards" && document.type === "Warranty") ||
        (activeFilter === "Manuals" && document.type === "Manual") ||
        (activeFilter === "Other" && document.type === "Other");

      return matchesSearch && matchesFilter;
    });
  }, [documents, search, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen space-y-6 p-4 sm:p-8 lg:ml-60">
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
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
        >
          <FiArrowLeft /> Back to Dashboard
        </Link>

        <header>
          <p className="text-sm font-semibold text-blue-600">
            Your saved files
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Document Vault
          </h1>
          <p className="mt-2 text-slate-500">
            Your uploaded invoices and warranty documents, linked to your
            assets.
          </p>
        </header>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <FiSearch className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents, products, brands..."
            className="w-full bg-transparent outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                activeFilter === filter
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-12 text-center text-slate-500">
            Loading your saved documents...
          </p>
        ) : error ? (
          <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        ) : visibleDocuments.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <FiFileText className="mx-auto text-slate-400" size={36} />
            <h2 className="mt-4 text-lg font-semibold">
              No saved documents found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Upload an invoice or warranty document while adding an asset. It
              will appear here once it has been saved successfully.
            </p>
            <Link
              to="/add-asset"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              Add an asset
            </Link>
          </section>
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleDocuments.map((document) => (
              <article
                key={document.id}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Document thumbnail */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-blue-600">
                  {document.url &&
                  ["png", "jpg", "jpeg", "webp"].includes(
                    document.extension,
                  ) ? (
                    <img
                      src={document.url}
                      alt={document.fileName}
                      className="h-12 w-12 object-cover"
                    />
                  ) : (
                    <FiFileText size={22} />
                  )}
                </div>

                {/* Document information and open button */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {document.fileName}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {document.type} · {document.assetName}
                  </p>

                  {document.url ? (
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <FiExternalLink size={16} />
                      Open Document
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-red-600">
                      {document.urlError ||
                        "Document link unavailable. Reload and try again."}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        <p className="text-sm text-slate-500">
          {assets.length} assets · {documents.length} saved document
          {documents.length === 1 ? "" : "s"}
        </p>
      </main>
    </div>
  );
}

export default DocumentVault;
