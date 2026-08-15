-- Create the site_visits table to track analytics
CREATE TABLE IF NOT EXISTS public.site_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visitor_id UUID NOT NULL, -- Cookie based unique visitor ID
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable if guest
    session_id UUID NOT NULL, -- Cookie based session ID (expires on browser close)
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (so public API route can track visits)
DROP POLICY IF EXISTS "Allow anon insert to site_visits" ON public.site_visits;
CREATE POLICY "Allow anon insert to site_visits" ON public.site_visits
    FOR INSERT WITH CHECK (true);

-- Only admins can read
DROP POLICY IF EXISTS "Allow admin read site_visits" ON public.site_visits;
CREATE POLICY "Allow admin read site_visits" ON public.site_visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE email = (auth.jwt() ->> 'email') AND (role = 'administrator' OR role = 'editor')
        )
    );

-- Create basic indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_id ON public.site_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON public.site_visits(path);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
