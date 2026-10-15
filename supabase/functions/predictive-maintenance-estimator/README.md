# Predictive Maintenance estimator

This authenticated Edge Function uses the existing `GEMINI_ASSISTANT_API_KEY`
Supabase secret and the caller's Supabase JWT. It reads only the caller's saved
asset and service requests, returns validated cautious maintenance guidance, and
does not write asset data. Estimates are not verified quotes or diagnoses.

Apply the additive migration
`supabase/migrations/20261015160000_create_predictive_maintenance_tables.sql`
before using persisted checklists and reminders. It adds owner-scoped tables and
does not change existing asset data or RLS policies.

From the repository root, deploy only this function:

```sh
supabase functions deploy predictive-maintenance-estimator --project-ref assetcare-ai
```

The existing `GEMINI_ASSISTANT_API_KEY` Supabase Function secret must be
configured. Never put the key in frontend configuration or this repository.
