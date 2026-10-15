# SocialOS

Multi-tenant AI social media management SaaS (white-label): workspaces, AI post generator, unified inbox, brand monitoring, moderation, analytics, partner portals, and Free/Pro/Business plans.

Built with [Lovable](https://lovable.dev) on TanStack Start (React 19 + Vite), Tailwind CSS v4, and Lovable Cloud (managed Supabase: Postgres, auth, storage).

## Run locally

```sh
npm i
npm run dev
```

The app expects these environment variables (see `.env`, which contains publishable/non-secret keys only):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Backend

The database, auth, and row-level security live in Lovable Cloud. Schema lives in `supabase/migrations`; `src/integrations/supabase/*` is generated client code.

## AI features

AI generation (posts, replies, sentiment, moderation) runs through server functions in `src/lib/ai.functions.ts` via the Lovable AI Gateway. Running outside Lovable requires providing an equivalent gateway key.

## Development with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9752b43a-9f3f-420a-a7a8-d5d5f2cdfd8a).

- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable.
