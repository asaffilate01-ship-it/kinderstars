DROP POLICY IF EXISTS "Users manage own compliance docs" ON public.compliance_documents;
DROP POLICY IF EXISTS "Users view own compliance docs" ON public.compliance_documents;
DROP POLICY IF EXISTS "Users create pending compliance docs" ON public.compliance_documents;
DROP POLICY IF EXISTS "Users delete own unapproved compliance docs" ON public.compliance_documents;

CREATE POLICY "Users view own compliance docs"
ON public.compliance_documents FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create pending compliance docs"
ON public.compliance_documents FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND reviewed_by IS NULL
  AND review_notes IS NULL
  AND document_url LIKE auth.uid()::text || '/%'
  AND document_url ~* '\.(pdf|jpe?g|png)$'
);

CREATE POLICY "Users delete own unapproved compliance docs"
ON public.compliance_documents FOR DELETE TO authenticated
USING (auth.uid() = user_id AND status IN ('pending', 'rejected', 'expired'));

DROP POLICY IF EXISTS "Users delete own docs" ON storage.objects;
CREATE POLICY "Users delete own unapproved docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'compliance-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND NOT EXISTS (
    SELECT 1
    FROM public.compliance_documents AS document
    WHERE document.document_url = name
      AND document.status = 'approved'
  )
);