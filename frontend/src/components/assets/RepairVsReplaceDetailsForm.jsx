import { useState } from "react";
import { FiSave } from "react-icons/fi";
import { supabase } from "../../lib/supabase";

const comparisonFields = [
  {
    key: "repair_cost",
    label: "Estimated repair cost",
    help: "Your estimate in rupees. Enter 0 only if no repair cost is expected.",
    max: "9999999999.99",
  },
  {
    key: "current_value",
    label: "Estimated current market value",
    help: "Your estimate of the asset's current market value in rupees.",
    max: "9999999999.99",
  },
  {
    key: "replacement_cost",
    label: "Replacement cost",
    help: "Your estimate in rupees for a comparable replacement.",
    max: "9999999999.99",
  },
  {
    key: "remaining_life_years",
    label: "Remaining useful life",
    help: "Your estimate in years. Decimal values such as 1.5 are allowed.",
    max: "999999.99",
  },
];

const estimateKeys = {
  repair_cost: "repairCost",
  current_value: "currentValue",
  replacement_cost: "replacementCost",
  remaining_life_years: "remainingUsefulLifeYears",
};

function formatEstimateRange(range, key) {
  if (!range) return null;
  if (key === "remaining_life_years") {
    return `${range.min}–${range.max} years`;
  }
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
  return `${formatter.format(range.min)}–${formatter.format(range.max)}`;
}

function RepairVsReplaceDetailsForm({
  asset,
  aiEstimate,
  onSaved,
  onCancel,
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      comparisonFields.map(({ key }) => [
        key,
        asset[key] === null || asset[key] === undefined
          ? ""
          : String(asset[key]),
      ]),
    ),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setError("");
    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaved(false);

    const updatedValues = {};

    for (const field of comparisonFields) {
      const rawValue = values[field.key].trim();
      if (rawValue === "") {
        updatedValues[field.key] = null;
        continue;
      }

      if (!/^\d+(?:\.\d{1,2})?$/.test(rawValue)) {
        setError(
          `${field.label} must be a non-negative number with at most 2 decimal places.`,
        );
        return;
      }

      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue) || numericValue > Number(field.max)) {
        setError(`${field.label} is outside the supported range.`);
        return;
      }

      updatedValues[field.key] = numericValue;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please sign in again to save these details.");

      const { data, error: updateError } = await supabase
        .from("assets")
        .update(updatedValues)
        .eq("id", asset.id)
        .eq("user_id", user.id)
        .select(
          "id, repair_cost, current_value, replacement_cost, remaining_life_years",
        )
        .single();

      if (updateError) throw updateError;

      onSaved(data);
      setSaved(true);
    } catch (saveError) {
      console.error("Repair vs Replace details save error:", saveError);
      setError(
        saveError.message || "Unable to save these comparison details.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="mb-4 text-sm leading-6 text-slate-600">
        Enter your own estimates. These optional figures are saved to this
        asset; purchase price and warranty details are not used to fill them.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {comparisonFields.map((field) => {
          const inputId = `comparison-${asset.id}-${field.key}`;
          const helpId = `${inputId}-help`;
          const estimateRange = formatEstimateRange(
            aiEstimate?.estimates?.[estimateKeys[field.key]],
            field.key,
          );

          return (
            <div key={field.key}>
              <label
                htmlFor={inputId}
                className="block text-sm font-semibold text-slate-700"
              >
                {field.label}
              </label>
              <div className="mt-1 flex rounded-xl border border-slate-200 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                {field.key !== "remaining_life_years" && (
                  <span
                    aria-hidden="true"
                    className="flex items-center border-r border-slate-200 px-3 text-sm text-slate-500"
                  >
                    ₹
                  </span>
                )}
                <input
                  id={inputId}
                  name={field.key}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={field.max}
                  step="0.01"
                  value={values[field.key]}
                  onChange={handleChange}
                  aria-describedby={helpId}
                  className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none"
                />
                {field.key === "remaining_life_years" && (
                  <span
                    aria-hidden="true"
                    className="flex items-center border-l border-slate-200 px-3 text-sm text-slate-500"
                  >
                    years
                  </span>
                )}
              </div>
              <p id={helpId} className="mt-1 text-xs leading-5 text-slate-500">
                {field.help} Leave blank if unknown.
              </p>
              {estimateRange && (
                <p className="mt-1 rounded-lg bg-violet-50 px-2.5 py-2 text-xs leading-5 text-violet-800">
                  AI estimate range: {estimateRange}. Choose and enter a value
                  above if you want to save your own figure.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          Your Repair vs Replace figures have been saved.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiSave />
          {saving ? "Saving..." : "Save details"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Done
          </button>
        )}
      </div>
    </form>
  );
}

export default RepairVsReplaceDetailsForm;
