
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiUser, FiLogOut } from "react-icons/fi";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  Bell,
  CalendarDays,
  RefreshCw,
  X,
  Box,
} from "lucide-react";

export default function FamilyMode() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [householdId, setHouseholdId] = useState(null);
  const [members, setMembers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/login");
  }


  const loadFamilyData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please sign in first.");

      // Find a household where the current user is an active member.
      const { data: memberships, error: memberError } = await supabase
        .from("family_members")
        .select("household_id, role")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (memberError) throw memberError;

      let currentHouseholdId = memberships?.[0]?.household_id;

      // Create a household if this user does not have one.
      if (!currentHouseholdId) {
        const { data: newId, error: createError } = await supabase.rpc(
          "create_household",
          { p_name: "My Family" }
        );

        if (createError) throw createError;
        currentHouseholdId = newId;
      }

      setHouseholdId(currentHouseholdId);

      const [membersResult, remindersResult, assetsResult] =
        await Promise.all([
          supabase
            .from("family_members")
            .select("id, email, full_name, role, status")
            .eq("household_id", currentHouseholdId)
            .order("created_at", { ascending: true }),

          supabase
            .from("shared_reminders")
            .select("id, title, due_date, channel")
            .eq("household_id", currentHouseholdId)
            .order("due_date", { ascending: true }),

          supabase
            .from("assets")
            .select("id, user_id, product_name, category, warranty_expiry")
            .order("created_at", { ascending: false }),
        ]);

      if (membersResult.error) throw membersResult.error;
      if (remindersResult.error) throw remindersResult.error;
      if (assetsResult.error) throw assetsResult.error;

      setMembers(membersResult.data || []);
      setReminders(remindersResult.data || []);
      setAssets(assetsResult.data || []);
    } catch (err) {
      console.error("Family Mode error:", err);
      setError(err.message || "Unable to load family information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  async function inviteMember(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!householdId) {
      setError("Your household is not ready. Refresh and try again.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter an email address.");
      return;
    }

    setSaving(true);

    try {
      const { data, error: inviteError } = await supabase.rpc(
        "invite_family_member",
        {
          p_household_id: householdId,
          p_email: normalizedEmail,
          p_role: role,
        }
      );

      if (inviteError) throw inviteError;

      setMessage(
        "Invitation record created. Email delivery and acceptance still need to be configured."
      );
      setEmail("");
      setRole("viewer");
      setShowInvite(false);

      await loadFamilyData();
    } catch (err) {
      console.error("Invitation error:", err);
      setError(err.message || "Unable to create invitation.");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date) {
    if (!date) return "Date not set";

    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function initials(member) {
    const name = member.full_name || member.email || "Member";

    return name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-gray-500">
        <RefreshCw className="animate-spin" size={20} />
        Loading family information...
      </div>
    );
  }

  if (error && !householdId) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
          <button
            onClick={loadFamilyData}
            className="ml-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  
return (
  <div className="min-h-screen bg-gray-50">
    <DashboardSidebar
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
    />

    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <FiMenu size={22} />
          </button>

          <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
            AssetCare-AI
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <FiUser size={18} />
            <span className="hidden sm:inline">Profile</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <FiLogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
  </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-indigo-600">
            Workspace / Family
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Family Mode
          </h1>
          <p className="mt-2 text-gray-500">
            Manage family members, assets, and shared reminders.
          </p>
        </div>

        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
        >
          <UserPlus size={18} />
          Invite member
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={loadFamilyData} className="ml-3 underline">
            Try again
          </button>
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <Users className="mb-4 text-indigo-600" size={24} />
          <p className="text-sm text-gray-500">Family members</p>
          <p className="mt-1 text-3xl font-bold">{members.length}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <Bell className="mb-4 text-indigo-600" size={24} />
          <p className="text-sm text-gray-500">Shared reminders</p>
          <p className="mt-1 text-3xl font-bold">{reminders.length}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <ShieldCheck className="mb-4 text-indigo-600" size={24} />
          <p className="text-sm text-gray-500">Household assets</p>
          <p className="mt-1 text-3xl font-bold">{assets.length}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-lg font-semibold">Family members</h2>
            <p className="mt-1 text-sm text-gray-500">
              People registered in your household.
            </p>
          </div>
          <button onClick={loadFamilyData} aria-label="Refresh family data" className="rounded-lg border p-2">
            <RefreshCw size={18} />
          </button>
        </div>

        {members.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No family members found.</p>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-700">
                  {initials(member)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{member.full_name || member.email}</p>
                  <p className="flex items-center gap-2 break-all text-sm text-gray-500">
                    <Mail size={14} />
                    {member.email}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize">
                  {member.role}
                </span>
                <span className="text-sm text-gray-500">{member.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-semibold">Shared assets</h2>
          <p className="mt-1 text-sm text-gray-500">
            Assets visible to your household.
          </p>
        </div>

        {assets.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No shared assets found.</p>
        ) : (
          <div className="divide-y">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-3 p-5">
                <Box size={22} className="text-indigo-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{asset.product_name}</p>
                  <p className="text-sm text-gray-500">
                    {asset.category || "Uncategorized"}
                    {asset.warranty_expiry
                      ? ` · Warranty: ${formatDate(asset.warranty_expiry)}`
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-semibold">Shared reminders</h2>
        </div>

        {reminders.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No shared reminders yet.</p>
        ) : (
          <div className="divide-y">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center gap-3 p-5">
                <CalendarDays size={22} className="text-indigo-600" />
                <div className="flex-1">
                  <p className="font-medium">{reminder.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(reminder.due_date)}
                    {reminder.channel ? ` · ${reminder.channel}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Invite family member</h2>
              <button onClick={() => setShowInvite(false)} aria-label="Close invitation form">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={inviteMember} className="space-y-4">
              <div>
                <label htmlFor="family-email" className="mb-2 block text-sm font-medium">
                  Email address
                </label>
                <input
                  id="family-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="family@example.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                />
              </div>

              <div>
                <label htmlFor="family-role" className="mb-2 block text-sm font-medium">
                  Access role
                </label>
                <select
                  id="family-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <p className="text-xs leading-5 text-gray-500">
                Invitations are recorded in the database. Email delivery and acceptance must be configured separately.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowInvite(false)} className="rounded-xl border px-4 py-2.5">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-white disabled:opacity-50">
                  {saving ? "Creating..." : "Create invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      
      )}
        </main>
      </div>
    </div>
  );
}
