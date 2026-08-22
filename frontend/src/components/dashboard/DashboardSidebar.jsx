import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiPackage,
  FiPlusCircle,
  FiSearch,
  FiMessageCircle,
  FiHeart,
  FiTool,
  FiCalendar,
  FiHome,
  FiFileText,
  FiShield,
  FiBarChart2,
  FiShoppingBag,
   FiSun,
  FiUsers,
  FiBriefcase,
  FiHelpCircle,
  FiSettings,
  FiX,
} from "react-icons/fi";

function DashboardSidebar({ open, onClose }) {
  const location = useLocation();

  const sections = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          icon: FiGrid,
          path: "/dashboard",
        },
        {
          label: "My Assets",
          icon: FiPackage,
          path: "/products",
        },
        {
          label: "Add Asset",
          icon: FiPlusCircle,
          path: "/add-asset",
        },
      ],
    },

    {
      title: "Intelligence",
      items: [
        {
          label: "AI Assistant",
          icon: FiMessageCircle,
          path: "#",
        },
        {
          label: "Product Health",
          icon: FiHeart,
          path: "#",
        },
        {
          label: "Predictive Care",
          icon: FiTool,
          path: "#",
        },
        {
          label: "Repair vs Replace",
          icon: FiBarChart2,
          path: "#",
        },
      ],
    },

    {
      title: "Care",
      items: [
        {
          label: "Service History",
          icon: FiTool,
          path: "#",
        },
        {
          label: "Book Service",
          icon: FiCalendar,
          path: "#",
        },
        {
          label: "Smart Reminders",
          icon: FiCalendar,
          path: "#",
        },
        {
          label: "Calendar",
          icon: FiCalendar,
          path: "/calendar",
        },
      ],
    },

    {
      title: "Assets",
      items: [
        {
          label: "Home Assets",
          icon: FiHome,
          path: "#",
        },
        {
          label: "Document Vault",
          icon: FiFileText,
          path: "#",
        },
        {
          label: "Insurance",
          icon: FiShield,
          path: "#",
        },
        {
          label: "Recalls",
          icon: FiSearch,
          path: "#",
        },
      ],
    },

    {
      title: "Value",
      items: [
        {
          label: "Analytics",
          icon: FiBarChart2,
          path: "#",
        },
        {
          label: "Resale Center",
          icon: FiShoppingBag,
          path: "#",
        },
        {
          label: "Smart Shopping",
          icon: FiShoppingBag,
          path: "#",
        },
        {
          label: "Energy & Eco",
          icon:  FiSun,
          path: "#",
        },
      ],
    },

    {
      title: "Workspace",
      items: [
        {
          label: "Family Mode",
          icon: FiUsers,
          path: "#",
        },
        {
          label: "Business",
          icon: FiBriefcase,
          path: "#",
        },
        {
          label: "Support",
          icon: FiHelpCircle,
          path: "#",
        },
        {
          label: "Settings",
          icon: FiSettings,
          path: "/settings",
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72
          flex-col border-r border-slate-200 bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            AssetCare-AI
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {sections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    item.path !== "#" &&
                    location.pathname === item.path;

                  if (item.path === "#") {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        disabled
                        className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
                      >
                        <Icon size={17} />
                        {item.label}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon size={17} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default DashboardSidebar;