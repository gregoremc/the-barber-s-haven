
-- Plans table
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly',
  price numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  service_ids uuid[] DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plans" ON public.plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Client Plans table (assignment of plan to client)
CREATE TABLE public.client_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  barber_id uuid REFERENCES public.barbers(id) ON DELETE SET NULL,
  day_of_week integer NOT NULL DEFAULT 1,
  time text NOT NULL DEFAULT '09:00',
  duration_type text NOT NULL DEFAULT 'perpetual',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own client plans" ON public.client_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_client_plans_updated_at BEFORE UPDATE ON public.client_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
