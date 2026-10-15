import { NavLink, Link, useLocation } from "react-router-dom";
import {
  Archive,
  Bell,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  ChartNoAxesColumn,
  CircleHelp,
  CirclePlus,
  FileText,
  Heart,
  House,
  Leaf,
  LayoutDashboard,
  MessageCircle,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Users,
  Wrench,
  X,
} from "lucide-react";

const sections = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "My Assets", path: "/products", icon: Package },
      { label: "Add Asset", path: "/add-asset", icon: CirclePlus },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "AI Assistant", path: "/ai-assistant", icon: MessageCircle },
      { label: "Product Health", path: "/health", icon: Heart },
      { label: "Predictive Care", path: "/predictive-care", icon: Wrench },
      {
        label: "Repair vs Replace",
        path: "/repair-vs-replace",
        icon: ChartNoAxesColumn,
      },
    ],
  },
  {
    title: "Care",
    items: [
      { label: "Service History", path: "/service-history", icon: Wrench },
      { label: "Book Service", path: "/book-service", icon: CalendarDays },
      {
        label: "Smart Reminders",
        path: "/reminders",
        activePaths: ["/smart-reminders"],
        icon: Bell,
      },
      { label: "Calendar", path: "/calendar", icon: Calendar },
    ],
  },
  {
    title: "Assets",
    items: [
      { label: "Home Assets", path: "/home-assets", icon: House },
      { label: "Document Vault", path: "/document-vault", icon: FileText },
      { label: "Insurance", path: "/insurance", icon: Shield },
      { label: "Recalls", path: "/recalls", icon: Search },
    ],
  },
  {
    title: "Value",
    items: [
      { label: "Analytics", path: "/analytics", icon: ChartNoAxesColumn },
      { label: "Resale Center", path: "/resale", icon: Archive },
      { label: "Smart Shopping", path: "/shopping", icon: ShoppingBag },
      { label: "Energy & Eco", path: "/energy-eco", icon: Leaf },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Family Mode", path: "/family", icon: Users },
      { label: "Business", path: "/business", icon: BriefcaseBusiness },
      { label: "Support", path: "/support", icon: CircleHelp },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

export default function DashboardSidebar({ open = false, onClose = () => {} }) {
  const location = useLocation();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        aria-label="Primary navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="shrink-0 border-b border-slate-100 px-5 py-5">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/dashboard"
              onClick={onClose}
              className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              <span className="text-lg font-bold tracking-tight text-slate-900">
                AssetCare<span className="text-blue-600">-AI</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-5"
        >
          {sections.map((section) => (
            <section key={section.title} aria-labelledby={`sidebar-${section.title}`}>
              <h2
                id={`sidebar-${section.title}`}
                className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
              >
                {section.title}
              </h2>

              <div className="space-y-0.5">
                {section.items.map(
                  ({ label, path, activePaths = [], icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                          isActive || activePaths.includes(location.pathname)
                            ? "bg-blue-50 font-semibold text-blue-700"
                            : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`
                      }
                    >
                      {({ isActive }) => {
                        const active =
                          isActive || activePaths.includes(location.pathname);

                        return (
                          <>
                            <Icon
                              size={17}
                              strokeWidth={1.8}
                              aria-hidden="true"
                              className={`shrink-0 ${
                                active ? "text-blue-600" : "text-slate-400"
                              }`}
                            />
                            <span>{label}</span>
                          </>
                        );
                      }}
                    </NavLink>
                  ),
                )}
              </div>
            </section>
          ))}
        </nav>
      </aside>
    </>
  );
}
