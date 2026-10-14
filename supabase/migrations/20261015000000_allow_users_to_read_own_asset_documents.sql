create policy "Users can read their own asset documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'asset-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
