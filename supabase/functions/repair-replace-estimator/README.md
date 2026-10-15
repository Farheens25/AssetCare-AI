# Repair vs Replace estimator

This authenticated Edge Function uses the existing `GEMINI_ASSISTANT_API_KEY`
Supabase secret and the caller's Supabase JWT. It loads the requested asset
through the caller-scoped Supabase client, returns AI-generated estimate ranges,
and never writes asset data. The frontend lets the user choose and explicitly
save individual values.

Deploy only this function from the repository root:

```sh
supabase functions deploy repair-replace-estimator --project-ref assetcare-ai
```

Ensure `GEMINI_ASSISTANT_API_KEY` is already configured as a Supabase Function
secret before deployment. Do not put the key in frontend configuration or in
this repository.
