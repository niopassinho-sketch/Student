-- Create studies table
CREATE TABLE public.studies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT,
    url TEXT,
    study_date DATE NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    review_number INTEGER NOT NULL,
    review_type TEXT,
    scheduled_date DATE NOT NULL,
    original_date DATE NOT NULL,
    rescheduled_from DATE,
    completed BOOLEAN DEFAULT false NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for studies table
CREATE POLICY "Users can view their own studies"
    ON public.studies FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own studies"
    ON public.studies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own studies"
    ON public.studies FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own studies"
    ON public.studies FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for reviews table
CREATE POLICY "Users can view their own reviews"
    ON public.reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER handle_studies_updated_at
    BEFORE UPDATE ON public.studies
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
