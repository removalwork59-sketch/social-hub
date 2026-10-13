CREATE OR REPLACE FUNCTION public.log_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j jsonb; o jsonb; ws uuid; d jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN j := to_jsonb(OLD); ELSE j := to_jsonb(NEW); END IF;
  IF TG_OP = 'UPDATE' THEN o := to_jsonb(OLD); END IF;
  IF TG_TABLE_NAME = 'workspaces' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    ws := (j->>'id')::uuid;
    d := jsonb_build_object('name', j->>'name', 'plan', j->>'plan', 'custom_domain', j->>'custom_domain');
    IF TG_OP = 'UPDATE' THEN
      IF o->>'plan' IS DISTINCT FROM j->>'plan' THEN d := d || jsonb_build_object('previous_plan', o->>'plan'); END IF;
      IF o->>'name' IS DISTINCT FROM j->>'name' THEN d := d || jsonb_build_object('previous_name', o->>'name'); END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'social_accounts' THEN
    ws := (j->>'workspace_id')::uuid;
    d := jsonb_build_object('platform', j->>'platform', 'handle', j->>'handle', 'status', j->>'status');
  ELSE
    ws := (j->>'workspace_id')::uuid;
    d := jsonb_build_object('user_id', j->>'user_id', 'role', j->>'role');
    IF TG_OP = 'UPDATE' AND o->>'role' IS DISTINCT FROM j->>'role' THEN d := d || jsonb_build_object('previous_role', o->>'role'); END IF;
  END IF;
  INSERT INTO public.activity_logs(workspace_id, actor_id, action, entity, details)
  VALUES (ws, auth.uid(), lower(TG_OP), TG_TABLE_NAME, d);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'log_activity failed: %', SQLERRM;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;