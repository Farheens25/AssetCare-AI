import Products from "../pages/Products";
import EnergyEco from "../pages/EnergyEco";
import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import HomeAsset from "../pages/HomeAsset";
import AddAsset from "../pages/AddAsset";
import Onboarding from "../pages/Onboarding";
import ServiceHistory from "../pages/ServiceHistory";
import BookService from "../pages/BookService";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import ProductHealth from "../pages/ProductHealth";
import MaintenanceCalendar from "../pages/MaintenanceCalendar";
import NotFound from "../pages/NotFound";
import FamilyMode from "../pages/FamilyMode";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/home-assets" element={<HomeAsset />} />
      <Route path="/products" element={<Products />} />
    <Route path="/add-asset" element={<AddAsset />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Product Health */}
      <Route path="/health" element={<ProductHealth />} />

      {/* Service Management */}
      <Route
        path="/service-history"
        element={<ServiceHistory />}
      />
      <Route
        path="/book-service"
        element={<BookService />}
      />

      {/* Other Pages */}
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
<Route path="/energy-eco" element={<EnergyEco />} />
      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
      <Route path="/calendar" element={<MaintenanceCalendar />}/>
      <Route path="/family" element={<FamilyMode />}/>
    </Routes>
  );
}

export default AppRoutes;
