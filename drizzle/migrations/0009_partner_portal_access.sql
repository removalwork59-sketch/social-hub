ALTER TABLE public.partners ADD COLUMN user_id uuid;
CREATE UNIQUE INDEX partners_user_id_key ON public.partners(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.my_partner_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.partners WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "partner reads own row" ON public.partners FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "partner reads own payouts" ON public.partner_payouts FOR SELECT TO authenticated USING (partner_id = public.my_partner_id());

CREATE OR REPLACE FUNCTION public.partner_my_clients()
RETURNS TABLE(id uuid, name text, plan text, created_at timestamptz, posts bigint, accounts bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT w.id, w.name, w.plan, w.created_at,
    (SELECT count(*) FROM public.posts p WHERE p.workspace_id = w.id),
    (SELECT count(*) FROM public.social_accounts s WHERE s.workspace_id = w.id)
  FROM public.workspaces w
  WHERE w.partner_id IS NOT NULL AND w.partner_id = public.my_partner_id()
  ORDER BY w.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.admin_link_partner_user(_partner uuid, _user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Super Admin access required'; END IF;
  UPDATE public.partners SET user_id = _user WHERE id = _partner;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user, 'partner') ON CONFLICT DO NOTHING;
END $$;