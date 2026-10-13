CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  commission_pct numeric NOT NULL DEFAULT 20,
  status text NOT NULL DEFAULT 'pending',
  color text NOT NULL DEFAULT 'var(--chart-1)',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage partners" ON public.partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

ALTER TABLE public.workspaces ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE TABLE public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  period date NOT NULL,
  revenue integer NOT NULL DEFAULT 0,
  commission_pct numeric NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_payouts TO authenticated;
GRANT ALL ON public.partner_payouts TO service_role;
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage payouts" ON public.partner_payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.admin_partner_clients()
RETURNS TABLE(partner_id uuid, id uuid, name text, plan text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT w.partner_id, w.id, w.name, w.plan FROM public.workspaces w
  WHERE w.partner_id IS NOT NULL AND public.has_role(auth.uid(), 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.admin_set_workspace_partner(_ws uuid, _partner uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Super Admin access required'; END IF;
  UPDATE public.workspaces SET partner_id = _partner WHERE id = _ws;
END $$;