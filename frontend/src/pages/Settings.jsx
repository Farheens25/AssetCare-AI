import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiInfo,
  FiLock,
  FiLogOut,
  FiMail,
  FiMenu,
  FiMonitor,
  FiMoon,
  FiSave,
  FiShield,
  FiSun,
  FiUser,
} from "react-icons/fi";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

const defaultNotificationPreferences = {
  warranty_expiry_reminders: true,
  maintenance_reminders: true,
  product_updates: true,
};

const notificationOptions = [
  {
    key: "warranty_expiry_reminders",
    label: "Warranty expiry reminders",
    description: "Keep this preference enabled for warranty date reminders.",
  },
  {
    key: "maintenance_reminders",
    label: "Maintenance reminders",
    description: "Keep this preference enabled for asset maintenance reminders.",
  },
  {
    key: "product_updates",
    label: "Relevant product notifications",
    description: "Preferences for relevant product and asset updates.",
  },
];

const themeOptions = [
  { value: "light", label: "Light", icon: FiSun },
  { value: "dark", label: "Dark", icon: FiMoon },
  { value: "system", label: "System", icon: FiMonitor },
];

function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [signOutError, setSignOutError] = useState("");

  const [notificationPreferences, setNotificationPreferences] = useState(
    defaultNotificationPreferences,
  );
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [hasSavedNotificationPreferences, setHasSavedNotificationPreferences] =
    useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationError, setNotificationError] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [exportError, setExportError] = useState("");

  const fetchSettings = useCallback(async () => {
    const {
      data: { user: signedInUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!signedInUser) {
      return { user: null, preferences: null, preferencesError: null };
    }

    const { data, error: preferencesError } = await supabase
      .from("user_settings")
      .select(
        "warranty_expiry_reminders, maintenance_reminders, product_updates",
      )
      .eq("user_id", signedInUser.id)
      .maybeSingle();

    return {
      user: signedInUser,
      preferences: data,
      preferencesError,
    };
  }, []);

  const applySettings = useCallback(
    ({ user: signedInUser, preferences, preferencesError }) => {
      if (!signedInUser) {
        navigate("/login");
        return;
      }

      setUser(signedInUser);
      setProfileName(signedInUser.user_metadata?.full_name || "");
      setProfilePhone(signedInUser.user_metadata?.phone_number || "");

      if (preferencesError) {
        setNotificationsLoaded(false);
        setHasSavedNotificationPreferences(false);
        setNotificationError(
          "Notification preferences could not be loaded. Apply the user settings migration, then try again.",
        );
      } else {
        setHasSavedNotificationPreferences(Boolean(preferences));
        setNotificationPreferences(
          preferences
            ? {
                warranty_expiry_reminders:
                  preferences.warranty_expiry_reminders,
                maintenance_reminders: preferences.maintenance_reminders,
                product_updates: preferences.product_updates,
              }
            : defaultNotificationPreferences,
        );
        setNotificationsLoaded(true);
        setNotificationError("");
      }
    },
    [navigate],
  );

  const loadSettings = useCallback(() => {
    setPageLoading(true);
    setPageError("");

    fetchSettings()
      .then(applySettings)
      .catch((error) => {
        console.error("Settings loading error:", error);
        setPageError(error.message || "Unable to load your settings.");
      })
      .finally(() => setPageLoading(false));
  }, [applySettings, fetchSettings]);

  useEffect(() => {
    let cancelled = false;

    fetchSettings()
      .then((result) => {
        if (!cancelled) applySettings(result);
      })
      .catch((error) => {
        console.error("Settings loading error:", error);
        if (!cancelled) {
          setPageError(error.message || "Unable to load your settings.");
        }
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applySettings, fetchSettings]);

  function validateProfile() {
    const trimmedName = profileName.trim();
    const trimmedPhone = profilePhone.trim();
    if (!trimmedName) {
      return "Enter a display name.";
    }
    if (trimmedName.length > 80) {
      return "Name must be 80 characters or fewer.";
    }
    if (
      trimmedPhone &&
      !/^\+?[0-9\s().-]{7,20}$/.test(trimmedPhone)
    ) {
      return "Enter a valid phone number, or leave it blank.";
    }
    return "";
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");

    const validationError = validateProfile();
    if (validationError) {
      setProfileError(validationError);
      return;
    }

    setProfileSaving(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: profileName.trim(),
          phone_number: profilePhone.trim() || null,
        },
      });
      if (error) throw error;
      setUser(data.user);
      setProfileName(data.user.user_metadata?.full_name || "");
      setProfilePhone(data.user.user_metadata?.phone_number || "");
      setProfileMessage("Your profile details have been saved.");
    } catch (error) {
      console.error("Settings profile update error:", error);
      setProfileError(error.message || "Unable to save your profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (password.length < 8) {
      setPasswordError("Use a password with at least 8 characters.");
      return;
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setPasswordError(
        "Use at least one lowercase letter, one uppercase letter, and one number.",
      );
      return;
    }
    if (password !== passwordConfirmation) {
      setPasswordError("The passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setPasswordConfirmation("");
      setPasswordMessage("Your password has been changed.");
    } catch (error) {
      console.error("Settings password update error:", error);
      setPasswordError(error.message || "Unable to change your password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSignOut() {
    setSignOutError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Settings sign-out error:", error);
      setSignOutError(error.message || "Unable to sign out.");
    }
  }

  function updateNotificationPreference(key, value) {
    setNotificationPreferences((current) => ({ ...current, [key]: value }));
    setNotificationMessage("");
  }

  async function saveNotificationPreferences(event) {
    event.preventDefault();
    setNotificationError("");
    setNotificationMessage("");
    if (!user || !notificationsLoaded) return;

    setNotificationsSaving(true);
    try {
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          ...notificationPreferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      setHasSavedNotificationPreferences(true);
      setNotificationMessage("Your notification preferences have been saved.");
    } catch (error) {
      console.error("Notification preferences save error:", error);
      setNotificationError(
        error.message || "Unable to save notification preferences.",
      );
    } finally {
      setNotificationsSaving(false);
    }
  }

  async function exportUserData() {
    setExportError("");
    setExportMessage("");
    setExporting(true);

    try {
      const {
        data: { user: signedInUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!signedInUser) throw new Error("Sign in to export your data.");

      const pageSize = 500;
      let start = 0;
      let assets = [];
      while (true) {
        const { data, error } = await supabase
          .from("assets")
          .select(
            "id, product_name, brand, category, model, serial_number, invoice_number, purchase_date, warranty_months, warranty_expiry, store_name, purchase_price, location_in_home, notes, repair_cost, current_value, replacement_cost, remaining_life_years, created_at",
          )
          .eq("user_id", signedInUser.id)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(start, start + pageSize - 1);
        if (error) throw error;
        assets = assets.concat(data || []);
        if (!data || data.length < pageSize) break;
        start += pageSize;
      }

      const payload = {
        exported_at: new Date().toISOString(),
        account: {
          email: signedInUser.email,
          display_name: signedInUser.user_metadata?.full_name || null,
        },
        assets,
        notice:
          "Uploaded document and image contents are not included in this export.",
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `assetcare-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setExportMessage(
        `Your export is ready with ${assets.length} saved ${assets.length === 1 ? "asset" : "assets"}.`,
      );
    } catch (error) {
      console.error("User data export error:", error);
      setExportError(error.message || "Unable to export your data.");
    } finally {
      setExporting(false);
    }
  }

  if (pageLoading) {
    return (
      <main
        role="status"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-8 text-sm text-slate-500"
      >
        Loading your settings...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <FiMenu size={21} />
          </button>
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-slate-900"
          >
            AssetCare-AI
          </Link>
          <button
            type="button"
            onClick={loadSettings}
            className="ml-auto rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </header>

        <div className="mx-auto max-w-5xl space-y-6 px-4 py-7 sm:px-6 sm:py-9">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Account
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Settings
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage your account, preferences, privacy, and notifications.
            </p>
          </section>

          {pageError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              <FiAlertCircle className="mt-0.5 shrink-0" />
              <p>{pageError}</p>
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiUser size={19} />
              </span>
              <div>
                <h2 className="text-lg font-bold">Account and profile</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage the profile details on your signed-in account.
                </p>
              </div>
            </div>

            {user && (
              <form onSubmit={handleProfileSave} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="settings-display-name"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Display name
                    </label>
                    <input
                      id="settings-display-name"
                      type="text"
                      maxLength={80}
                      value={profileName}
                      onChange={(event) => {
                        setProfileName(event.target.value);
                        setProfileMessage("");
                        setProfileError("");
                      }}
                      autoComplete="name"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="settings-phone"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Phone number <span className="font-normal">(optional)</span>
                    </label>
                    <input
                      id="settings-phone"
                      type="tel"
                      maxLength={20}
                      value={profilePhone}
                      onChange={(event) => {
                        setProfilePhone(event.target.value);
                        setProfileMessage("");
                        setProfileError("");
                      }}
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <FiMail className="text-slate-400" />
                  <span className="text-sm text-slate-600">Email</span>
                  <span className="ml-auto break-all text-right text-sm font-medium text-slate-800">
                    {user.email}
                  </span>
                  <span
                    className={`w-full text-right text-xs ${
                      user.email_confirmed_at || user.confirmed_at
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {user.email_confirmed_at
                      ? "Email verified"
                      : "Email not verified"}
                  </span>
                </div>

                {profileError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                  >
                    {profileError}
                  </p>
                )}
                {profileMessage && (
                  <p
                    role="status"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                  >
                    {profileMessage}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <FiSave />
                  {profileSaving ? "Saving..." : "Save profile"}
                </button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FiLock size={19} />
              </span>
              <div>
                <h2 className="text-lg font-bold">Security</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Change your password or end this session.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="settings-password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    New password
                  </label>
                  <input
                    id="settings-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordMessage("");
                      setPasswordError("");
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="settings-password-confirmation"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="settings-password-confirmation"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(event) => {
                      setPasswordConfirmation(event.target.value);
                      setPasswordMessage("");
                      setPasswordError("");
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Use at least 8 characters, including uppercase, lowercase, and a
                number. Your password is sent directly to Supabase Auth and is
                never stored or displayed here.
              </p>
              {passwordError && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {passwordError}
                </p>
              )}
              {passwordMessage && (
                <p
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                  {passwordMessage}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={passwordSaving || !password || !passwordConfirmation}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <FiShield />
                  {passwordSaving ? "Updating..." : "Change password"}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <FiLogOut />
                  Sign out
                </button>
              </div>
              {signOutError && (
                <p role="alert" className="text-sm text-rose-700">
                  {signOutError}
                </p>
              )}
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FiBell size={19} />
              </span>
              <div>
                <h2 className="text-lg font-bold">Notification preferences</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Save the reminders and updates you prefer to see.
                </p>
              </div>
            </div>

            <form onSubmit={saveNotificationPreferences} className="mt-5">
              <div className="divide-y divide-slate-100">
                {notificationOptions.map((option) => (
                  <label
                    key={option.key}
                    className="flex cursor-pointer items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {option.description}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationPreferences[option.key]}
                      onChange={(event) =>
                        updateNotificationPreference(
                          option.key,
                          event.target.checked,
                        )
                      }
                      disabled={!notificationsLoaded}
                      className="h-5 w-5 shrink-0 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                    />
                  </label>
                ))}
              </div>

              <p className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs leading-5 text-slate-600">
                <FiInfo className="mt-0.5 shrink-0 text-blue-600" />
                These are saved preferences only. Email, push, and browser
                notification delivery are not configured by these controls.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {hasSavedNotificationPreferences
                  ? "These preferences are saved to your account."
                  : "Default preferences are shown; save them to persist your choices."}
              </p>
              {notificationError && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {notificationError}
                </p>
              )}
              {notificationMessage && (
                <p
                  role="status"
                  className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                  {notificationMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={!notificationsLoaded || notificationsSaving}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiSave />
                {notificationsSaving ? "Saving..." : "Save preferences"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {theme === "dark" ? <FiMoon size={19} /> : <FiSun size={19} />}
              </span>
              <div>
                <h2 className="text-lg font-bold">Appearance</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the theme used throughout AssetCare-AI.
                </p>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="sr-only">Color theme</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = theme === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                        selected
                          ? "border-blue-300 bg-blue-50 text-blue-800 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={selected}
                        onChange={() => setTheme(option.value)}
                        className="sr-only"
                      />
                      <Icon size={18} aria-hidden="true" />
                      <span className="text-sm font-semibold">
                        {option.label}
                      </span>
                      {selected && (
                        <FiCheckCircle
                          className="ml-auto text-blue-600"
                          aria-label="Selected"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <p className="mt-3 text-xs text-slate-500">
              Theme preference is saved on this device. System mode follows
              your operating-system appearance setting.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiShield size={19} />
              </span>
              <div>
                <h2 className="text-lg font-bold">Privacy and your data</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your account accesses its saved assets through authenticated
                  Supabase requests and the project’s row-level security.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <p>
                Saved asset details help organize products and track warranty
                dates. Maintenance and warranty reminders can be displayed by
                the app where those features are available. Saved asset details
                may also be used to answer your requests in the AI Assistant.
                They are not used here to send email, push, or browser
                notifications.
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <FiCalendar aria-hidden="true" />
                Current display conventions: INR (₹) and en-IN dates.
              </p>
              <p className="text-xs text-slate-500">
                This export includes your account email and saved asset fields.
                Uploaded documents and images are not included.
              </p>
            </div>

            {exportError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              >
                {exportError}
              </p>
            )}
            {exportMessage && (
              <p
                role="status"
                className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
              >
                {exportMessage}
              </p>
            )}
            <button
              type="button"
              onClick={exportUserData}
              disabled={exporting || !user}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiDownload />
              {exporting ? "Preparing export..." : "Download my data"}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Settings;
