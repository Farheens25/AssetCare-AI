
import { useEffect, useState } from "react";
import {
  FiShoppingBag,
  FiTrendingDown,
  FiRefreshCw,
  FiShield,
  FiPackage,
  FiArrowRight,
  FiBell,
  FiCheck,
  FiMenu,
} from "react-icons/fi";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { supabase } from "../lib/supabase";

const priceDrops = [
  {
    name: "OnePlus 100W SuperVOOC Charger",
    oldPrice: 2999,
    price: 2199,
    category: "Mobile Accessories",
  },
  {
    name: "Samsung AC Annual AMC",
    oldPrice: 3499,
    price: 2499,
    category: "Air Conditioner",
  },
  {
    name: "Dell XPS 130W Adapter",
    oldPrice: 6200,
    price: 4850,
    category: "Laptop Accessories",
  },
];

const replacements = [
  {
    oldProduct: "LG 8kg Washer",
    name: "Bosch Series 6",
    price: 41500,
    detail: "Reliability score: 9.1/10",
  },
  {
    oldProduct: "Kent RO",
    name: "Aquaguard Marvel NXT",
    price: 16900,
    detail: "Lower filter replacement cost",
  },
];

const warranties = [
  { name: "Samsung AC", duration: "+2 years", price: 2499 },
  { name: "Whirlpool Fridge", duration: "+1 year", price: 1299 },
  { name: "Sony Bravia", duration: "+2 years", price: 3199 },
];

const accessories = [
  {
    name: "AC Stabiliser",
    category: "Air Conditioner",
    price: 2499,
    icon: "⚡",
  },
  {
    name: "Washer Trolley",
    category: "Washing Machine",
    price: 1299,
    icon: "🧺",
  },
  {
    name: "Laptop Cooling Pad",
    category: "Laptop",
    price: 899,
    icon: "💻",
  },
  {
    name: "RO Filter Pack",
    category: "Water Purifier",
    price: 1499,
    icon: "💧",
  },
];

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
        <Icon size={21} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function SmartShopping() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadShoppingData() {
      setLoading(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          setNotice("Please sign in to use saved products and price alerts.");
          setLoading(false);
          return;
        }

        const [
          { data: productRows, error: productError },
          { data: savedRows, error: savedError },
          { data: alertRows, error: alertError },
        ] = await Promise.all([
          supabase
            .from("shopping_products")
            .select("id, product_name, current_price, category"),

          supabase
            .from("saved_products")
            .select("product_id, shopping_products(product_name)")
            .eq("user_id", user.id),

          supabase
            .from("price_alerts")
            .select(
              "id, product_id, target_price, is_active, shopping_products(product_name)"
            )
            .eq("user_id", user.id)
            .eq("is_active", true),
        ]);

        if (productError) throw productError;
        if (savedError) throw savedError;
        if (alertError) throw alertError;

        setProducts(productRows || []);

        setSaved(
          (savedRows || [])
            .map((row) => row.shopping_products?.product_name)
            .filter(Boolean)
        );

        setAlerts(
          (alertRows || []).map((row) => ({
            id: row.id,
            productId: row.product_id,
            productName: row.shopping_products?.product_name,
            targetPrice: Number(row.target_price),
            isActive: row.is_active,
          }))
        );

        setNotice("");
      } catch (error) {
        console.error("Smart Shopping load error:", error);
        setNotice(error.message || "Unable to load shopping data.");
      } finally {
        setLoading(false);
      }
    }

    loadShoppingData();
  }, []);

  const money = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

  const getSignedInUser = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    if (!data.user) {
      setNotice("Please sign in first, then try again.");
      return null;
    }

    return data.user;
  };

  const getProductByName = (name) =>
    products.find((product) => product.product_name === name);

  const toggleSaved = async (name) => {
    if (busyItem) return;

    setBusyItem(name);
    setNotice("");

    try {
      const user = await getSignedInUser();
      if (!user) return;

      const product = getProductByName(name);

      if (!product) {
        setNotice(
          `"${name}" was not found in shopping_products. Please verify that the demo products were inserted.`
        );
        return;
      }

      const isSaved = saved.includes(name);

      if (isSaved) {
        const { error } = await supabase
          .from("saved_products")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        if (error) throw error;

        setSaved((current) => current.filter((item) => item !== name));
        setNotice("Product removed from your saved list.");
      } else {
        const { error } = await supabase.from("saved_products").insert({
          user_id: user.id,
          product_id: product.id,
        });

        if (error) throw error;

        setSaved((current) => [...current, name]);
        setNotice("Product saved for comparison.");
      }
    } catch (error) {
      console.error("Save product error:", error);
      setNotice(error.message || "Could not update the saved product.");
    } finally {
      setBusyItem("");
    }
  };

  const toggleAlert = async (item) => {
    if (busyItem) return;

    setBusyItem(item.name);
    setNotice("");

    try {
      const user = await getSignedInUser();
      if (!user) return;

      const product = getProductByName(item.name);

      if (!product) {
        setNotice(
          `"${item.name}" was not found in shopping_products. Please verify that the demo products were inserted.`
        );
        return;
      }

      const existingAlert = alerts.find(
        (alert) => alert.productName === item.name
      );

      if (existingAlert) {
        const { error } = await supabase
          .from("price_alerts")
          .delete()
          .eq("id", existingAlert.id)
          .eq("user_id", user.id);

        if (error) throw error;

        setAlerts((current) =>
          current.filter((alert) => alert.id !== existingAlert.id)
        );
        setNotice("Price alert removed.");
        return;
      }

      const suggestedTarget = Math.floor(item.price * 0.9);
      const enteredPrice = window.prompt(
        `Enter your target price for ${item.name}.\nCurrent listed price: ${money(item.price)}`,
        String(suggestedTarget)
      );

      if (enteredPrice === null) return;

      const targetPrice = Number(enteredPrice.trim());

      if (
        enteredPrice.trim() === "" ||
        !Number.isFinite(targetPrice) ||
        targetPrice <= 0
      ) {
        setNotice("Please enter a valid target price greater than ₹0.");
        return;
      }

      const { data, error } = await supabase
        .from("price_alerts")
        .insert({
          user_id: user.id,
          product_id: product.id,
          target_price: targetPrice,
          is_active: true,
        })
        .select(
          "id, product_id, target_price, is_active, shopping_products(product_name)"
        )
        .single();

      if (error) throw error;

      setAlerts((current) => [
        ...current,
        {
          id: data.id,
          productId: data.product_id,
          productName: data.shopping_products?.product_name || item.name,
          targetPrice: Number(data.target_price),
          isActive: data.is_active,
        },
      ]);

      setNotice(
        `Price target saved for ${item.name} at ${money(targetPrice)}.`
      );
    } catch (error) {
      console.error("Price alert error:", error);
      setNotice(error.message || "Could not update the price alert.");
    } finally {
      setBusyItem("");
    }
  };

  const filteredDrops = priceDrops.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReplacements = replacements.filter((item) =>
    `${item.oldProduct} ${item.name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredWarranties = warranties.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAccessories = accessories.filter((item) => {
    const matchesSearch = `${item.name} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <FiMenu size={20} />
          </button>

          <span className="font-semibold text-slate-800">
            AssetCare-AI
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-sm text-slate-600">Smart Shopping</span>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="mb-2 text-sm font-medium text-blue-600">
                  Value / Smart Shopping
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Smart Shopping
                </h1>
                <p className="mt-2 text-slate-500">
                  Price drops, replacements, extended warranties and accessories.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <FiBell size={18} />
                <span>{alerts.length} alerts enabled</span>
              </div>
            </header>

            {notice && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800"
              >
                {notice}
              </div>
            )}

            {loading && (
              <p className="mb-5 text-sm text-slate-500">
                Loading your shopping data...
              </p>
            )}

            <div className="mb-8">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, warranties, accessories..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <section className="mb-10">
              <SectionTitle
                icon={FiTrendingDown}
                title="Price Drop Alerts"
                subtitle="Discover products and services at reduced prices."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredDrops.map((item) => {
                  const discount = Math.round(
                    ((item.oldPrice - item.price) / item.oldPrice) * 100
                  );

                  const currentAlert = alerts.find(
                    (alert) => alert.productName === item.name
                  );

                  return (
                    <article
                      key={item.name}
                      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                          <FiTrendingDown size={22} />
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          {discount}% OFF
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">{item.category}</p>
                      <h3 className="mt-1 min-h-12 font-semibold text-slate-900">
                        {item.name}
                      </h3>

                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xl font-bold text-slate-900">
                          {money(item.price)}
                        </span>
                        <span className="text-sm text-slate-400 line-through">
                          {money(item.oldPrice)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-emerald-700">
                        Save {money(item.oldPrice - item.price)}
                      </p>

                      {currentAlert && (
                        <p className="mt-2 text-xs text-slate-500">
                          Target: {money(currentAlert.targetPrice)}
                        </p>
                      )}

                      <button
                        type="button"
                        disabled={busyItem === item.name}
                        onClick={() => toggleAlert(item)}
                        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          currentAlert
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {currentAlert ? <FiCheck /> : <FiBell />}
                        {busyItem === item.name
                          ? "Please wait..."
                          : currentAlert
                            ? "Alert Enabled"
                            : "Track Price"}
                      </button>
                    </article>
                  );
                })}
              </div>

              {filteredDrops.length === 0 && (
                <p className="rounded-xl bg-white p-5 text-sm text-slate-500">
                  No matching price drop products found.
                </p>
              )}
            </section>

            <section className="mb-10">
              <SectionTitle
                icon={FiRefreshCw}
                title="Replacement Suggestions"
                subtitle="Explore alternatives for your existing home assets."
              />

              <div className="grid gap-4 lg:grid-cols-2">
                {filteredReplacements.map((item) => (
                  <article
                    key={item.oldProduct}
                    className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
                        {item.oldProduct}
                      </span>
                      <FiArrowRight className="text-blue-600" />
                      <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                        {item.name}
                      </span>
                    </div>

                    <p className="mt-5 text-2xl font-bold text-slate-900">
                      {money(item.price)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {item.detail}
                    </p>

                    <button
                      type="button"
                      disabled={busyItem === item.name}
                      onClick={() => toggleSaved(item.name)}
                      className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {busyItem === item.name
                        ? "Please wait..."
                        : saved.includes(item.name)
                          ? "Saved for comparison ✓"
                          : "Save for comparison"}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="mb-10">
              <SectionTitle
                icon={FiShield}
                title="Extended Warranty Offers"
                subtitle="Explore additional coverage for your appliances."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredWarranties.map((item) => (
                  <article
                    key={item.name}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <FiShield size={24} className="text-blue-600" />
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {item.duration}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {money(item.price)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Illustrative offer price
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mb-10">
              <SectionTitle
                icon={FiPackage}
                title="Recommended Accessories"
                subtitle="Useful accessories for your household products."
              />

              <div className="mb-5 flex flex-wrap gap-2">
                {[
                  "All",
                  ...new Set(accessories.map((item) => item.category)),
                ].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {filteredAccessories.map((item) => (
                  <article
                    key={item.name}
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                      {item.icon}
                    </div>

                    <p className="text-xs text-slate-500">{item.category}</p>
                    <h3 className="mt-1 font-semibold text-slate-900">
                      {item.name}
                    </h3>
                    <p className="mt-3 text-lg font-bold text-slate-900">
                      {money(item.price)}
                    </p>

                    <button
                      type="button"
                      disabled={busyItem === item.name}
                      onClick={() => toggleSaved(item.name)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <FiShoppingBag size={16} />
                      {busyItem === item.name
                        ? "Please wait..."
                        : saved.includes(item.name)
                          ? "Saved ✓"
                          : "Save accessory"}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <p className="border-t border-slate-200 py-5 text-xs text-slate-500">
              Demo catalogue: prices, discounts, reliability scores and warranty
              offers are sample data. Price targets are stored in Supabase, but
              automatic live price monitoring and notifications require a live
              pricing source and a scheduled backend service.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SmartShopping;
