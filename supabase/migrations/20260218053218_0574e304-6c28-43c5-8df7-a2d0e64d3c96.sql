
-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance-docs', 'compliance-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Childminders can upload their own docs
CREATE POLICY "Users upload own docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'compliance-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Childminders can view their own docs
CREATE POLICY "Users view own docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'compliance-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all docs
CREATE POLICY "Admins view all compliance docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'compliance-docs' AND (SELECT public.is_admin()));

-- Childminders can delete their own docs
CREATE POLICY "Users delete own docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'compliance-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow admins to insert notifications for document reviews (service role does this already, but let's allow edge function)
CREATE POLICY "Service role insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Drop the old restrictive admin-only insert policy on notifications
DROP POLICY IF EXISTS "Admins create notifications" ON public.notifications;
