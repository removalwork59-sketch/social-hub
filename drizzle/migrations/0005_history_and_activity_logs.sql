CREATE TABLE public.mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source text NOT NULL,
  content text NOT NULL,
  sentiment text NOT NULL DEFAULT 'neutral',
  reach integer NOT NULL DEFAULT 0,
  is_sample boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mentions_ws_time ON public.mentions(workspace_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentions TO authenticated;
GRANT ALL ON public.mentions TO service_role;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read mentions" ON public.mentions FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "admins add mentions" ON public.mentions FOR INSERT TO authenticated WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));

CREATE TABLE public.analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform public.social_platform NOT NULL,
  day date NOT NULL,
  followers integer NOT NULL DEFAULT 0,
  engagement integer NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  is_sample boolean NOT NULL DEFAULT false,
  UNIQUE (workspace_id, platform, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_daily TO authenticated;
GRANT ALL ON public.analytics_daily TO service_role;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read analytics" ON public.analytics_daily FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_ws_time ON public.activity_logs(workspace_id, created_at DESC);
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read activity" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.log_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; ws uuid; d jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  IF TG_TABLE_NAME = 'workspaces' THEN ws := r.id; ELSE ws := r.workspace_id; END IF;
  IF TG_TABLE_NAME = 'workspaces' AND TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  d := CASE TG_TABLE_NAME
    WHEN 'workspaces' THEN jsonb_build_object('name', r.name, 'plan', r.plan, 'custom_domain', r.custom_domain)
    WHEN 'social_accounts' THEN jsonb_build_object('platform', r.platform, 'handle', r.handle, 'status', r.status)
    WHEN 'workspace_members' THEN jsonb_build_object('user_id', r.user_id, 'role', r.role)
    ELSE '{}'::jsonb END;
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'workspaces' THEN
    IF OLD.plan IS DISTINCT FROM NEW.plan THEN d := d || jsonb_build_object('previous_plan', OLD.plan); END IF;
    IF OLD.name IS DISTINCT FROM NEW.name THEN d := d || jsonb_build_object('previous_name', OLD.name); END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'workspace_members' AND OLD.role IS DISTINCT FROM NEW.role THEN
    d := d || jsonb_build_object('previous_role', OLD.role);
  END IF;
  INSERT INTO public.activity_logs(workspace_id, actor_id, action, entity, details)
  VALUES (ws, auth.uid(), lower(TG_OP), TG_TABLE_NAME, d);
  RETURN r;
END $$;

CREATE TRIGGER log_workspaces AFTER INSERT OR UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_social_accounts AFTER INSERT OR UPDATE OR DELETE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_workspace_members AFTER INSERT OR UPDATE OR DELETE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE OR REPLACE FUNCTION public.seed_sample_history(_ws uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.social_platform; i int; base int;
BEGIN
  FOREACH p IN ARRAY ARRAY['instagram','facebook','linkedin','twitter']::public.social_platform[] LOOP
    base := CASE p WHEN 'instagram' THEN 18000 WHEN 'facebook' THEN 12000 WHEN 'linkedin' THEN 4000 ELSE 6000 END;
    FOR i IN 0..89 LOOP
      INSERT INTO public.analytics_daily(workspace_id, platform, day, followers, engagement, reach, is_sample)
      VALUES (_ws, p, current_date - i, base + (89 - i) * (base / 900) + (random()*40)::int,
              (base / 40) + (random() * base / 30)::int + CASE WHEN extract(dow FROM current_date - i) IN (5,6) THEN base/60 ELSE 0 END,
              base / 3 + (random() * base / 4)::int, true)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
  FOR i IN 1..180 LOOP
    INSERT INTO public.mentions(workspace_id, source, content, sentiment, reach, is_sample, created_at)
    VALUES (_ws, (ARRAY['Instagram','X','Google Reviews','News','Blog','Facebook'])[1 + (random()*5)::int],
      (ARRAY['Loved the new cold brew!','Service was slow today','Great spot to work from','Prices went up again?','Best coffee in town','Mentioned in a weekend guide'])[1 + (random()*5)::int],
      (ARRAY['positive','positive','neutral','negative','positive','neutral'])[1 + (random()*5)::int],
      (random()*5000)::int, true, now() - (random() * interval '90 days'));
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.seed_sample_history(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_workspace() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
begin
  insert into public.workspace_members(workspace_id, user_id, role) values (new.id, new.owner_id, 'owner');
  perform public.seed_sample_inbox(new.id);
  perform public.seed_sample_history(new.id);
  return new;
end $function$;

DO $$ DECLARE w record; BEGIN FOR w IN SELECT id FROM public.workspaces LOOP PERFORM public.seed_sample_history(w.id); END LOOP; END $$;