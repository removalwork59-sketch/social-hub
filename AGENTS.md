<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Signed-in pages live under `src/routes/_authenticated/`; `_app` wraps client-workspace pages in `AppShell`, while `admin.*` and `partner.*` use `PortalShell` — keeps each portal's navigation separate.
- Multi-tenancy is enforced in the database: every tenant table has `workspace_id` and RLS via `is_workspace_member` / `is_workspace_admin` — data isolation must not depend on UI filters.
- Platform roles (super_admin, partner) live in `user_roles` checked with `has_role`; workspace roles (owner/admin/member) live in `workspace_members` — never store roles on profiles.
- Plan limits (free posts/AI) are enforced server-side (DB trigger + `meter()` in `src/lib/ai.functions.ts`); UI counters are informational only.
- AI calls go through server functions in `src/lib/ai.functions.ts` using the Lovable AI Gateway Responses API — keeps the key server-side.
- Portal pages without live data use `src/lib/sample-data.ts` / `src/lib/client-sample.ts` and must show `SampleNote` so sample figures are never mistaken for real ones.
