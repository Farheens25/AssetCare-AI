import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiSave, FiPackage } from "react-icons/fi";
import { supabase } from "../lib/supabase";

function AddAsset() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    product_name: "",
    category: "",
    brand: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    purchase_price: "",
    warranty_expiry: "",
    store_name: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.product_name.trim()) {
      setError("Please enter the product name.");
      return;
    }

    setSaving(true);

    try {
      // Get currently logged-in user
      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("You must be logged in to add an asset.");
        setSaving(false);
        return;
      }

      // Save asset
      const { error: insertError } = await supabase.from("assets").insert([
        {
          user_id: user.id,
          product_name: formData.product_name.trim(),
          category: formData.category || null,
          brand: formData.brand.trim() || null,
          model: formData.model.trim() || null,
          serial_number: formData.serial_number.trim() || null,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price
            ? Number(formData.purchase_price)
            : null,
          warranty_expiry: formData.warranty_expiry || null,
          store_name: formData.store_name.trim() || null,
          notes: formData.notes.trim() || null,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      setSuccess("Asset added successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      console.error("Add asset error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            <FiArrowLeft size={17} />
            Back to Dashboard
          </Link>

          <div className="text-xl font-bold tracking-tight text-slate-900">
            AssetCare-AI
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FiPackage size={23} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Add an asset
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add your product information so AssetCare-AI can help you manage
              it.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
          >
            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product name */}
              <div>
                <label
                  htmlFor="product_name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Product name *
                </label>

                <input
                  id="product_name"
                  name="product_name"
                  type="text"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder="Example: Samsung Washing Machine"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Select category</option>
                  <option value="Home & household products">
                    Home & household products
                  </option>
                  <option value="Personal electronics">
                    Personal electronics
                  </option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Business assets">Business assets</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Brand + Model */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="brand"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Brand
                  </label>

                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Example: Samsung"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="model"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Model
                  </label>

                  <input
                    id="model"
                    name="model"
                    type="text"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Example: WW80T"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Serial number */}
              <div>
                <label
                  htmlFor="serial_number"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Serial number
                </label>

                <input
                  id="serial_number"
                  name="serial_number"
                  type="text"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="Enter serial number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Purchase date + price */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="purchase_date"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Purchase date
                  </label>

                  <input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="purchase_price"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Purchase price
                  </label>

                  <input
                    id="purchase_price"
                    name="purchase_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    placeholder="Example: 45000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Warranty + Store */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="warranty_expiry"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Warranty expiry
                  </label>

                  <input
                    id="warranty_expiry"
                    name="warranty_expiry"
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="store_name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Store / seller
                  </label>

                  <input
                    id="store_name"
                    name="store_name"
                    type="text"
                    value={formData.store_name}
                    onChange={handleChange}
                    placeholder="Example: Amazon"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows="4"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional information..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={!saving ? { y: -2 } : {}}
                  whileTap={!saving ? { scale: 0.98 } : {}}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiSave size={17} />

                  {saving ? "Saving..." : "Save asset"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default AddAsset;
