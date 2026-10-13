
import { useState } from "react";

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

function ServiceHistory() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredServices = services.filter((service) => {
    const matchesStatus =
      filter === "All" || service.status === filter;

    const matchesSearch =
      service.product.toLowerCase().includes(search.toLowerCase()) ||
      service.id.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600">
              ASSETCARE / SERVICES
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Service History
            </h1>
            <p className="mt-2 text-slate-500">
              Track your repairs, maintenance and service requests.
            </p>
          </div>

          <a
            href="/book-service"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Book a Service
          </a>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total Services", services.length],
            ["Completed", services.filter(s => s.status === "Completed").length],
            ["In Progress", services.filter(s => s.status === "In Progress").length],
            ["Pending", services.filter(s => s.status === "Pending").length],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Service Timeline
          </h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or service ID..."
            className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 sm:max-w-md"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {["All", "Completed", "In Progress", "Pending", "Cancelled"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>

          <div className="mt-6 space-y-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="rounded-xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-600">
                      {service.id}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {service.product}
                    </h3>
                    <p className="text-sm text-slate-500">{service.type}</p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {service.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Service Date</p>
                    <p className="mt-1 font-medium">{service.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Technician</p>
                    <p className="mt-1 font-medium">{service.technician}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Service Cost</p>
                    <p className="mt-1 font-medium">{service.cost}</p>
                  </div>
                </div>
              </div>
            ))}

            {filteredServices.length === 0 && (
              <p className="py-8 text-center text-slate-500">
                No matching services found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceHistory;
