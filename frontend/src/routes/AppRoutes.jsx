
import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import AddAsset from "../pages/AddAsset";
import Onboarding from "../pages/Onboarding";
import ServiceHistory from "../pages/ServiceHistory";
import BookService from "../pages/BookService";
import SmartShopping from "../pages/SmartShopping";
import EnergyEco from "../pages/EnergyEco";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/add-asset" element={<AddAsset />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Service Management */}
      <Route
        path="/service-history"
        element={<ServiceHistory />}
      />
      <Route
        path="/book-service"
        element={<BookService />}
      />

      {/* Smart Shopping */}
      <Route
        path="/shopping"
        element={<SmartShopping />}
      />

      {/* Energy & Eco */}
      <Route
        path="/energy-eco"
        element={<EnergyEco />}
      />

      {/* Other Pages */}
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
