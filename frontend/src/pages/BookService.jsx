import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiUser,
  FiLogOut,
  FiMapPin,
  FiStar,
  FiClock,
  FiCheckCircle,
  FiCalendar,
  FiArrowRight,
  FiTool,
  FiX,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

function calculateDistanceKm(from, to) {
  if (!from || !to) return null;

  const radians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const latitudeDifference = radians(to[0] - from[0]);
  const longitudeDifference = radians(to[1] - from[1]);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(from[0])) *
      Math.cos(radians(to[0])) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

function SelectedCenterMapView({ center, userPosition }) {
  const map = useMap();

  useEffect(() => {
    if (center?.position) {
      map.flyTo(center.position, Math.max(map.getZoom(), 12), {
        duration: 0.6,
      });
    } else if (userPosition) {
      map.flyTo(userPosition, 12, { duration: 0.6 });
    }
  }, [center, userPosition, map]);

  return null;
}

export default function BookService() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastBooking, setLastBooking] = useState(null);

  const [userPosition, setUserPosition] = useState(null);
  const [locationText, setLocationText] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [booking, setBooking] = useState({
    asset_id: "",
    service_type: "Repair",
    preferred_date: "",
    time_slot: "10:00-12:00",
    description: "",
    address: "",
    phone: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      const { data: assetRows, error: assetError } = await supabase
        .from("assets")
        .select("id, product_name, brand, category, model, serial_number")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (assetError) throw assetError;

      setAssets(assetRows || []);

      if (assetRows?.length) {
        setBooking((old) => ({
          ...old,
          asset_id:
            old.asset_id ||
            String(assetRows[0].id),
        }));
      }

      const { data: centerRows, error: centerError } = await supabase
        .from("service_centers")
        .select(
          "id, name, area, distance_km, rating, visit_fee, next_slot, supported_brands, latitude, longitude, is_active"
        )
        .eq("is_active", true);

      if (centerError) throw centerError;

      const mappedCenters = (centerRows || []).map((center) => {
        const latitude = Number(center.latitude);
        const longitude = Number(center.longitude);

        const hasCoordinates =
          center.latitude != null &&
          center.longitude != null &&
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180;

        return {
          ...center,
          position: hasCoordinates ? [latitude, longitude] : null,
          fee: center.visit_fee,
          brand: Array.isArray(center.supported_brands)
            ? center.supported_brands.join(", ")
            : "Multiple brands",
        };
      });

      setCenters(mappedCenters);

      setSelectedCenter((current) =>
        current
          ? mappedCenters.find((center) => center.id === current.id) || null
          : null
      );
    } catch (e) {
      setError(e.message || "Unable to load booking information.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage(
        "Your browser does not support location. Search for a center by name or area."
      );
      return;
    }

    setLocationLoading(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserPosition(coordinates);
        setLocationText("Current device location");
        setLocationMessage(
          "Location detected. Centers with coordinates are sorted by straight-line distance."
        );
        setLocationLoading(false);
      },
      (geoError) => {
        let message =
          "Location could not be accessed. You can still search by center name or area.";

        if (geoError.code === 1) {
          message =
            "Location permission was denied. Allow it in browser settings or search by center name or area.";
        } else if (geoError.code === 3) {
          message =
            "Location request timed out. Please try again or search by area.";
        }

        setLocationMessage(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  };

  const filteredCenters = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return centers
      .map((center) => {
        const distanceKm = userPosition
          ? calculateDistanceKm(userPosition, center.position)
          : null;

        return {
          ...center,
          calculatedDistanceKm: distanceKm,
        };
      })
      .filter((center) => {
        const searchableText = [
          center.name,
          center.area,
          center.brand,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return !query || searchableText.includes(query);
      })
      .sort((a, b) => {
        if (userPosition) {
          if (a.calculatedDistanceKm == null) return 1;
          if (b.calculatedDistanceKm == null) return -1;

          return a.calculatedDistanceKm - b.calculatedDistanceKm;
        }

        return (
          (a.distance_km ?? Infinity) -
          (b.distance_km ?? Infinity)
        );
      });
  }, [centers, searchTerm, userPosition]);

  const setField = (key, value) => {
    setBooking((old) => ({
      ...old,
      [key]: value,
    }));
  };

  const handleLogout = async () => {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      toast.error(logoutError.message);
      return;
    }

    navigate("/login");
  };

  const submitBooking = async (event) => {
    event.preventDefault();

    if (!user) {
      toast.error("Please sign in before booking.");
      navigate("/login");
      return;
    }

    if (!selectedCenter) {
      toast.error("Choose a service center first.");
      return;
    }

    if (!assets.some((asset) => String(asset.id) === String(booking.asset_id))) {
      toast.error("Please select one of your registered products.");
      return;
    }

    if (
      !booking.preferred_date ||
      !booking.address.trim() ||
      !booking.phone.trim()
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    const today = new Date();
    const localToday = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    if (booking.preferred_date < localToday) {
      toast.error("Choose today or a future date.");
      return;
    }

    if (!/^\+?[0-9\s()-]{8,18}$/.test(booking.phone.trim())) {
      toast.error("Enter a valid contact number.");
      return;
    }

    setSubmitting(true);

    try {
      const asset = assets.find(
        (item) => String(item.id) === String(booking.asset_id)
      );

      const { data, error: insertError } = await supabase
        .from("service_requests")
        .insert({
          user_id: user.id,
          asset_id: booking.asset_id,
          asset_name: asset?.product_name || "Product",
          service_center_id: selectedCenter.id,
          service_type: booking.service_type,
          description: booking.description.trim() || null,
          preferred_date: booking.preferred_date,
          time_slot: booking.time_slot,
          address: booking.address.trim(),
          phone: booking.phone.trim(),
          estimated_cost: selectedCenter.fee ?? null,
          status: "requested",
        })
        .select("id, status, preferred_date, service_type")
        .single();

      if (insertError) throw insertError;

      setLastBooking(data);
      setSelectedCenter(null);
      setBooking((old) => ({
        ...old,
        description: "",
      }));

      toast.success("Service request submitted!");
    } catch (e) {
      toast.error(
        e.message ||
          "Booking failed. Please check your database permissions and required columns."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getDistanceLabel = (center) => {
    if (center.calculatedDistanceKm != null) {
      return `${center.calculatedDistanceKm.toFixed(1)} km away`;
    }

    if (center.distance_km != null) {
      return `${center.distance_km} km listed`;
    }

    return "Distance unavailable";
  };

  const getFeeLabel = (center) => {
    if (center.fee == null) return "Fee on request";
    if (Number(center.fee) === 0) return "Free diagnosis";

    return `₹${center.fee} visit`;
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <FiMenu size={21} />
            </button>

            <div className="hidden min-w-0 flex-1 sm:block">
              <div className="flex max-w-2xl items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <FiMapPin className="shrink-0 text-slate-400" />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setSearchTerm("");
                  }}
                  placeholder="Search centers, areas, brands..."
                  aria-label="Search service centers"
                  className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="text-lg text-slate-400 hover:text-slate-700"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-500 text-xs font-bold text-white">
                  {(
                    user?.user_metadata?.full_name ||
                    user?.email ||
                    "U"
                  )
                    .slice(0, 1)
                    .toUpperCase()}
                </span>

                <span className="hidden sm:inline">
                  {user?.user_metadata?.full_name ||
                    user?.email?.split("@")[0] ||
                    "Account"}
                </span>

                <FiUser className="sm:hidden" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="rounded-full border border-slate-200 bg-white p-3 text-slate-500 hover:text-rose-600"
              >
                <FiLogOut />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-blue-600">
              Care center
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Book a Service
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Find a service partner and request a convenient appointment.
            </p>
          </div>

          {lastBooking && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <FiCheckCircle
                  className="mt-1 shrink-0 text-emerald-600"
                  size={22}
                />

                <div>
                  <h3 className="font-bold text-emerald-900">
                    Service request submitted
                  </h3>

                  <p className="mt-1 text-sm text-emerald-800">
                    Request #
                    {String(lastBooking.id).slice(0, 8).toUpperCase()}
                    {" · "}
                    {lastBooking.service_type}
                    {" · "}
                    {lastBooking.preferred_date}
                    {" · Status: "}
                    {lastBooking.status || "Requested"}
                  </p>

                  <p className="mt-1 text-xs text-emerald-800">
                    Your appointment is not confirmed until the service center confirms it.
                  </p>
                </div>
              </div>

              <Link
                to="/service-history"
                className="inline-flex items-center gap-2 self-start rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                View history <FiArrowRight />
              </Link>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}

              <button
                type="button"
                onClick={load}
                className="ml-3 font-bold underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,.85fr)]">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_45px_-32px_rgba(15,23,42,.35)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">
                    Nearby service centers
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a partner to request a visit.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {filteredCenters.length} partners
                </span>
              </div>

              <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      Find centers near you
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Detect your location to calculate distances and sort nearby centers.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locationLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {locationLoading ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      <FiMapPin />
                    )}

                    {locationLoading ? "Detecting..." : "Use my location"}
                  </button>
                </div>

                {locationText && (
                  <p className="mt-2 text-xs font-medium text-blue-800">
                    Selected: {locationText}
                  </p>
                )}

                {locationMessage && (
                  <p className="mt-2 text-xs text-slate-600">
                    {locationMessage}
                  </p>
                )}

                {userPosition && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserPosition(null);
                      setLocationText("");
                      setLocationMessage(
                        "Showing the saved distance order again."
                      );
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 underline"
                  >
                    <FiRefreshCw /> Reset location
                  </button>
                )}
              </div>

              <div className="relative z-0 mb-4 overflow-hidden rounded-2xl border border-blue-100">
                <MapContainer
                  center={
                    userPosition ||
                    centers.find((center) => center.position)?.position ||
                    [20.5937, 78.9629]
                  }
                  zoom={userPosition ? 12 : centers.some((center) => center.position) ? 11 : 5}
                  scrollWheelZoom
                  className="h-72 w-full sm:h-80"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <SelectedCenterMapView
                    center={selectedCenter}
                    userPosition={userPosition}
                  />

                  {userPosition && (
                    <CircleMarker
                      center={userPosition}
                      radius={10}
                      pathOptions={{
                        color: "#ffffff",
                        weight: 3,
                        fillColor: "#16a34a",
                        fillOpacity: 1,
                      }}
                    >
                      <Popup>Your current location</Popup>
                    </CircleMarker>
                  )}

                  {filteredCenters
                    .filter((center) => center.position)
                    .map((center) => (
                      <CircleMarker
                        key={center.id}
                        center={center.position}
                        radius={selectedCenter?.id === center.id ? 11 : 8}
                        pathOptions={{
                          color: "#ffffff",
                          weight: 3,
                          fillColor:
                            selectedCenter?.id === center.id
                              ? "#1d4ed8"
                              : "#0ea5e9",
                          fillOpacity: 1,
                        }}
                        eventHandlers={{
                          click: () => {
                            setSelectedCenter(center);
                            setLastBooking(null);
                          },
                        }}
                      >
                        <Popup>
                          <div className="min-w-40">
                            <strong>{center.name}</strong>
                            <p>{center.area || "Area not listed"}</p>
                            <p>{getDistanceLabel(center)}</p>
                            <p>{getFeeLabel(center)}</p>

                            <button
                              type="button"
                              className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-white"
                              onClick={() => {
                                setSelectedCenter(center);
                                setLastBooking(null);
                              }}
                            >
                              Select center
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                </MapContainer>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((number) => (
                    <div
                      key={number}
                      className="h-20 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : centers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-9 text-center">
                  <FiMapPin className="mx-auto text-2xl text-slate-400" />
                  <h3 className="mt-3 font-bold text-slate-700">
                    No active service centers
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    No active center records were returned by Supabase.
                  </p>

                  <button
                    type="button"
                    onClick={load}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Reload centers
                  </button>
                </div>
              ) : filteredCenters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-9 text-center">
                  <FiMapPin className="mx-auto text-2xl text-slate-400" />
                  <h3 className="mt-3 font-bold text-slate-700">
                    No service centers found
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try another center name, area, or brand.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCenters.map((center) => (
                    <article
                      key={center.id}
                      className={`rounded-2xl border p-4 transition ${
                        selectedCenter?.id === center.id
                          ? "border-blue-400 bg-blue-50/50 ring-4 ring-blue-50"
                          : "border-slate-200 hover:border-blue-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                          <FiTool size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">{center.name}</h3>

                            {selectedCenter?.id === center.id && (
                              <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700">
                                SELECTED
                              </span>
                            )}
                          </div>

                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                            <FiMapPin />
                            {center.area || "Area not listed"}
                            <span>·</span>
                            {getDistanceLabel(center)}
                            <span>·</span>
                            <FiStar className="fill-amber-400 text-amber-400" />
                            {center.rating ?? "Rating unavailable"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {center.brand || "Brands not listed"}
                            {" · "}
                            {getFeeLabel(center)}
                          </p>

                          {!center.position && (
                            <p className="mt-1 text-xs text-amber-700">
                              Coordinates unavailable; distance cannot be calculated.
                            </p>
                          )}

                          {center.next_slot && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                              <FiClock />
                              Listed slot: {center.next_slot}
                              <span className="text-amber-700">
                                (not live-verified)
                              </span>
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCenter(center);
                            setLastBooking(null);
                          }}
                          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition ${
                            selectedCenter?.id === center.id
                              ? "bg-slate-700"
                              : "bg-gradient-to-r from-blue-600 to-sky-500 hover:shadow-lg"
                          }`}
                        >
                          {selectedCenter?.id === center.id ? "Selected" : "Book"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_-32px_rgba(15,23,42,.35)] sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold">Booking details</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select your product and preferred visit time.
                </p>
              </div>

              {!selectedCenter ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <FiCalendar size={22} />
                  </span>
                  <h3 className="mt-3 font-bold">Choose a service center</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Select Book on a center card to start your request.
                  </p>
                </div>
              ) : (
                <form onSubmit={submitBooking} className="space-y-4">
                  <div className="flex items-start justify-between rounded-xl bg-blue-50 p-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Selected partner
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {selectedCenter.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedCenter.area || "Area not listed"}
                        {" · "}
                        {getFeeLabel(selectedCenter)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCenter(null)}
                      aria-label="Change service center"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-white"
                    >
                      <FiX />
                    </button>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Your product <span className="text-rose-500">*</span>
                    </span>

                    <select
                      required
                      value={booking.asset_id}
                      onChange={(event) => setField("asset_id", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="">Select your product</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.product_name}
                          {asset.brand ? ` · ${asset.brand}` : ""}
                          {asset.model ? ` (${asset.model})` : ""}
                        </option>
                      ))}
                    </select>

                    {assets.length === 0 && (
                      <span className="mt-1 block text-xs text-amber-700">
                        Add a product first to book a service.{" "}
                        <Link className="underline" to="/add-asset">
                          Add product
                        </Link>
                      </span>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Service type *
                    </span>

                    <select
                      required
                      value={booking.service_type}
                      onChange={(event) => setField("service_type", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
                    >
                      <option>Repair</option>
                      <option>Maintenance</option>
                      <option>Installation</option>
                      <option>Inspection</option>
                      <option>Warranty claim</option>
                    </select>
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Preferred date *
                      </span>

                      <input
                        required
                        type="date"
                        min={[
                          new Date().getFullYear(),
                          String(new Date().getMonth() + 1).padStart(2, "0"),
                          String(new Date().getDate()).padStart(2, "0"),
                        ].join("-")}
                        value={booking.preferred_date}
                        onChange={(event) => setField("preferred_date", event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Preferred time *
                      </span>

                      <select
                        required
                        value={booking.time_slot}
                        onChange={(event) => setField("time_slot", event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
                      >
                        <option value="10:00-12:00">10 AM – 12 PM</option>
                        <option value="12:00-14:00">12 PM – 2 PM</option>
                        <option value="14:00-16:00">2 PM – 4 PM</option>
                        <option value="16:00-18:00">4 PM – 6 PM</option>
                      </select>
                      <span className="mt-1 block text-xs text-amber-700">
                        Requested time only; availability is not live-verified.
                      </span>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Service address *
                    </span>

                    <textarea
                      required
                      rows={2}
                      value={booking.address}
                      onChange={(event) => setField("address", event.target.value)}
                      placeholder="House / street / area / city / PIN code"
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Contact number *
                    </span>

                    <input
                      required
                      type="tel"
                      value={booking.phone}
                      onChange={(event) => setField("phone", event.target.value)}
                      placeholder="Your phone number"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Describe the issue
                    </span>

                    <textarea
                      rows={3}
                      value={booking.description}
                      onChange={(event) => setField("description", event.target.value)}
                      placeholder="Tell the technician what needs attention..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
                    />
                  </label>

                  <button
                    disabled={submitting || loading || !assets.length}
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Sending request...
                      </>
                    ) : (
                      <>
                        Request booking <FiArrowRight />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-slate-400">
                    This submits a service request. The center must confirm the appointment.
                  </p>
                </form>
              )}

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="font-bold">Booking status</h3>

                <div className="mt-4 space-y-3">
                  {[
                    {
                      name: "Requested",
                      desc: "Your request is submitted",
                      active: true,
                    },
                    {
                      name: "Confirmed",
                      desc: "Center confirms date and slot",
                      active: false,
                    },
                    {
                      name: "Technician assigned",
                      desc: "Visit details are shared",
                      active: false,
                    },
                    {
                      name: "In progress",
                      desc: "Service work starts",
                      active: false,
                    },
                    {
                      name: "Completed",
                      desc: "Service is finished",
                      active: false,
                    },
                  ].map((status, index) => (
                    <div key={status.name} className="flex gap-3">
                      <span
                        className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                          status.active
                            ? "bg-sky-500 ring-4 ring-sky-50"
                            : "bg-slate-200"
                        }`}
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm font-semibold ${
                              status.active ? "text-slate-800" : "text-slate-400"
                            }`}
                          >
                            {status.name}
                          </p>

                          {index === 0 && (
                            <span className="text-[11px] text-slate-400">
                              After submit
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {status.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}