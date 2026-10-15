
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Menu } from "lucide-react";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import HomeAsset from "../pages/HomeAsset";
import Products from "../pages/Products";
import AddAsset from "../pages/AddAsset";
import Onboarding from "../pages/Onboarding";
import ServiceHistory from "../pages/ServiceHistory";
import BookService from "../pages/BookService";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import ProductHealth from "../pages/ProductHealth";
import MaintenanceCalendar from "../pages/MaintenanceCalendar";
import DocumentVault from "../pages/DocumentVault";
import FamilyMode from "../pages/FamilyMode";
import AssetDetails from "../pages/AssetDetails";
import AIAssistant from "../pages/AIAssistant";
import RepairVsReplace from "../pages/RepairVsReplace";
import PredictiveMaintenance from "../pages/PredictiveMaintenance";
import SmartReminders from "../pages/SmartReminders";
import SmartShopping from "../pages/SmartShopping";
import EnergyEco from "../pages/EnergyEco";
import ResaleCenter from "../pages/ResaleCenter";
import NotFound from "../pages/NotFound";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

// Temporary pages for features that do not have page files yet.
function FeaturePlaceholder({ title, description }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="min-h-screen bg-slate-50 px-6 py-10 lg:ml-60">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          className="mb-6 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
        >
          <Menu size={21} aria-hidden="true" />
        </button>

        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold text-sky-600">
            AssetCare AI / Workspace
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">{title}</h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            {description}
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Coming soon
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This page is connected to navigation. Its complete functionality
              can be implemented next.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

function SidebarPage({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="min-h-screen bg-slate-50 p-6 lg:ml-60">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          className="mb-6 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
        >
          <Menu size={21} aria-hidden="true" />
        </button>
        {children}
      </main>
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Dashboard and products */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/home-assets" element={<HomeAsset />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<AssetDetails />} />
      <Route path="/add-asset" element={<AddAsset />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* AI and asset health */}
      <Route path="/ai-assistant" element={<AIAssistant />} />
      <Route path="/health" element={<ProductHealth />} />
      <Route path="/predictive-care" element={<PredictiveMaintenance />} />
      <Route
        path="/predictive-maintenance"
        element={<PredictiveMaintenance />}
      />
      <Route path="/repair-vs-replace" element={<RepairVsReplace />} />

      {/* Service management */}
      <Route path="/service-history" element={<ServiceHistory />} />
      <Route path="/book-service" element={<BookService />} />
      <Route path="/reminders" element={<SmartReminders />} />
      <Route path="/smart-reminders" element={<SmartReminders />} />
      <Route path="/calendar" element={<MaintenanceCalendar />} />

      {/* Documents and protection */}
      <Route path="/document-vault" element={<DocumentVault />} />

      <Route
        path="/insurance"
        element={
          <FeaturePlaceholder
            title="Insurance"
            description="Organize insurance information for your registered assets."
          />
        }
      />

      <Route
        path="/recalls"
        element={
          <FeaturePlaceholder
            title="Product Recalls"
            description="Keep track of product recall information and safety notices."
          />
        }
      />

      {/* Value and shopping */}
      <Route path="/shopping" element={<SmartShopping />} />
      <Route path="/energy-eco" element={<EnergyEco />} />

      <Route
        path="/analytics"
        element={
          <FeaturePlaceholder
            title="Analytics"
            description="Review asset summaries and maintenance trends."
          />
        }
      />

      {/* Resale Center */}
      <Route path="/resale" element={<ResaleCenter />} />

      {/* Workspace */}
      <Route path="/family" element={<FamilyMode />} />

      <Route
        path="/business"
        element={
          <FeaturePlaceholder
            title="Business"
            description="Manage business assets and related maintenance information."
          />
        }
      />

      <Route
        path="/support"
        element={
          <FeaturePlaceholder
            title="Support"
            description="Find help with your AssetCare AI account and features."
          />
        }
      />

      <Route
        path="/admin"
        element={
          <FeaturePlaceholder
            title="Admin Panel"
            description="Administrative tools can be implemented here."
          />
        }
      />

      <Route
        path="/notifications"
        element={
          <SidebarPage>
            <Notifications />
          </SidebarPage>
        }
      />
      <Route
        path="/profile"
        element={
          <SidebarPage>
            <Profile />
          </SidebarPage>
        }
      />
      <Route
        path="/settings"
        element={
          <SidebarPage>
            <Settings />
          </SidebarPage>
        }
      />

      {/* Keep the 404 route last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
