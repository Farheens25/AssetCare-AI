
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMenu,
  FiSearch,
  FiCalendar,
  FiTool,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiClipboard,
  FiUser,
  FiCreditCard,
  FiXCircle,
} from "react-icons/fi";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

const services = [
  {
    id: "SRV-1024",
    product: "Samsung Refrigerator",
    type: "Routine Maintenance",
    date: "08 Oct 2026",
    technician: "Rahul Sharma",
    status: "Completed",
    cost: "₹1,200",
  },
  {
    id: "SRV-1025",
    product: "LG Washing Machine",
    type: "Repair Service",
    date: "11 Oct 2026",
    technician: "Amit Patil",
    status: "In Progress",
    cost: "₹850",
  },
  {
    id: "SRV-1026",
    product: "Voltas Air Conditioner",
    type: "General Inspection",
    date: "13 Oct 2026",
    technician: "Not Assigned",
    status: "Pending",
    cost: "To be confirmed",
  },
];

const statusStyles = {
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "In Progress": "bg-blue-50 text-blue-700 ring-blue-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Cancelled: "bg-red-50 text-red-700 ring-red-200",
};

const statusIcons = {
  Completed: FiCheckCircle,
  "In Progress": FiTool,
  Pending: FiClock,
  Cancelled: FiXCircle,
};

function ServiceHistory() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredServices = services.filter((service) => {
    const matchesStatus =
      filter === "All" || service.status === filter;

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      service.product.toLowerCase().includes(searchText) ||
      service.id.toLowerCase().includes(searchText) ||
      service.type.toLowerCase().includes(searchText) ||
      service.technician.toLowerCase().includes(searchText);

    return matchesStatus && matchesSearch;
  });

  const completedCount = services.filter(
    (service) => service.status === "Completed"
  ).length;

  const progressCount = services.filter(
    (service) => service.status === "In Progress"
  ).length;

  const pendingCount = services.filter(
    (service) => service.status === "Pending"
  ).length;

  const summaryCards = [
    {
      label: "Total Services",
      value: services.length,
      description: "All service requests",
      icon: FiClipboard,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      label: "Completed",
      value: completedCount,
      description: "Successfully finished",
      icon: FiCheckCircle,
      iconStyle: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "In Progress",
      value: progressCount,
      description: "Currently being serviced",
      icon: FiTool,
      iconStyle: "bg-violet-50 text-violet-600",
    },
    {
      label: "Pending",
      value: pendingCount,
      description: "Awaiting service",
      icon: FiClock,
      iconStyle: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dashboard sidebar */}
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main page */}
      <main className="min-h-screen lg:ml-72">
        {/* Top navigation */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation menu"
            >
              <FiMenu size={20} />
            </button>

            <div>
              <p className="text-xs font-medium text-slate-500">
                ASSETCARE / SERVICES
              </p>
              <p className="text-sm font-semibold text-slate-900">
                Service Management
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Service Center
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Page heading */}
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <FiTool size={14} />
                YOUR SERVICE CENTER
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Service History
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                Track repairs, manage maintenance, and keep all your service
                requests organized in one place.
              </p>
            </div>

            <Link
              to="/book-service"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
            >
              <FiCalendar size={17} />
              Book a Service
              <FiArrowRight size={16} />
            </Link>
          </div>

          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {card.label}
                      </p>

                      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        {card.value}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl p-3 ${card.iconStyle}`}
                    >
                      <Icon size={22} />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Service list */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    Service Timeline
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    View and track the progress of your service requests.
                  </p>
                </div>

                <div className="relative w-full md:max-w-sm">
                  <FiSearch
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search product, ID, technician..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* Status filters */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "All",
                  "Completed",
                  "In Progress",
                  "Pending",
                  "Cancelled",
                ].map((status) => {
                  const active = filter === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilter(status)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {status}
                      {status === "All" && (
                        <span className="ml-2 opacity-75">
                          {services.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timeline records */}
            <div className="space-y-4 p-4 sm:p-6">
              {filteredServices.map((service) => {
                const StatusIcon =
                  statusIcons[service.status] || FiClock;

                return (
                  <article
                    key={service.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FiTool size={22} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold tracking-wide text-blue-600">
                            {service.id}
                          </p>

                          <h3 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                            {service.product}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {service.type}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                          statusStyles[service.status] ||
                          "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        <StatusIcon size={14} />
                        {service.status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                          <FiCalendar size={17} />
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Service Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {service.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                          <FiUser size={17} />
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Technician
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {service.technician}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                          <FiCreditCard size={17} />
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Service Cost
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {service.cost}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredServices.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <FiSearch size={24} />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    No services found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Try another search term or select a different status.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setFilter("All");
                    }}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <FiXCircle size={16} />
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs text-slate-500">
                Showing {filteredServices.length} of {services.length} service
                requests
              </p>
            </div>
          </section>

          {/* Help section */}
          <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h3 className="font-bold text-slate-900">
                Need help with a service?
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Submit a new service request for one of your home appliances.
              </p>
            </div>

            <Link
              to="/book-service"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Book Service
              <FiArrowRight size={16} />
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            AssetCare AI · Service Management
          </p>
        </div>
      </main>
    </div>
  );
}

export default ServiceHistory;
