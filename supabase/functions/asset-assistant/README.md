# Asset Assistant Edge Function

This function is separate from `rapid-processor` and does not modify or redeploy
it. It calls Gemini using the `GEMINI_ASSISTANT_API_KEY` Supabase Function
secret, and reads assets using the caller's authenticated Supabase client and
Row Level Security. The selected asset fields, including saved notes, are sent
to the Google Gemini API to generate each reply.

## Model and free-tier assumption

The function currently selects `gemini-2.5-flash-lite`, listed in Google's
[Gemini model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite)
as a cost-efficient model. Google's
[Gemini API pricing page](https://ai.google.dev/gemini-api/docs/pricing) lists
free-tier access for selected models. This repository cannot verify the
eligibility, remaining quota, or billing state of the Google AI Studio project
associated with the configured key. Confirm that this model is available on
that project's free tier before use. This implementation does not enable
billing or configure a paid fallback.

## Deployment

The `GEMINI_ASSISTANT_API_KEY` secret is expected to already exist in the
Supabase project. Do not put it in frontend variables, source files, or
committed environment files. The function also uses Supabase's injected
`SUPABASE_URL` and public/anon key.

From the repository root, authenticate and link the Supabase CLI if needed,
then deploy only this function:

```powershell
supabase login
supabase link --project-ref <SUPABASE_PROJECT_REF>
supabase functions deploy asset-assistant --project-ref <SUPABASE_PROJECT_REF>
```

Do not run `supabase functions deploy` without a function name if you intend to
deploy only this feature. The function is configured to require JWT
verification. `rapid-processor` is not included in the deploy command.

## Local development

The function can be served with `supabase functions serve asset-assistant`.
For local calls, provide the Gemini secret through a protected local
`supabase/functions/.env` file or a protected env file passed to the CLI. Keep
that file untracked; the root `.gitignore` ignores dotenv files. Never copy the
secret into `frontend/.env` or any `VITE_*` variable.

The included in-memory throttle allows up to eight requests per user per
minute per function runtime instance. Supabase may run multiple instances, so
this is best-effort throttling, not a durable or globally enforced quota. It
does not control or reserve quota used by `rapid-processor`, even if that
function happens to use the same provider project.
