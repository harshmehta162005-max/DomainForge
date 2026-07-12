# DomainForge

AI-powered domain name generator with availability checking, trademark risk scoring, and watchlist monitoring.

## ⚠️ Security: Rotate Secrets Immediately

> **If you cloned this repo from a fork or before the secrets audit on 2026-07-12, some secrets may still exist in git history.**
>
> You **must** rotate the following credentials immediately — even if the source code no longer contains them, old commits in git history are permanent until you take action:
>
> | Secret | How to rotate |
> |---|---|
> | `GROQ_API_KEY` (`gsk_...`) | [console.groq.com](https://console.groq.com) → API Keys → Revoke + create new |
> | `RESEND_API_KEY` (`re_...`) | [resend.com](https://resend.com) → API Keys → Delete + create new |
> | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → Regenerate |
> | `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → Regenerate |
> | `SENTRY_AUTH_TOKEN` (`sntrys_...`) | [sentry.io](https://sentry.io) → Settings → Auth Tokens → Revoke |
> | `MARKERAPI_PASSWORD` | [markerapi.com](https://markerapi.com) → Account → Change password |
> | `CRON_SECRET` | Replace with a strong random value (`openssl rand -hex 32`) |
>
> To fully purge secrets from git history, use [git-filter-repo](https://github.com/newren/git-filter-repo) or GitHub's "Remove sensitive data" guidance.

## Getting Started

### 1. Clone and install

```bash
git clone <repo>
cd Domain_names
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in your real values in .env.local
```

See [`.env.example`](./.env.example) for all required variables with descriptions.

### 3. Run locally

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Where it's used | Client-visible? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | ✅ Yes (safe — RLS enforced) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase browser client | ✅ Yes (safe — RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin operations | ❌ Server only |
| `GROQ_API_KEY` | LLM name generation | ❌ Server only |
| `RESEND_API_KEY` | Email alerts | ❌ Server only |
| `CRON_SECRET` | Cron job auth header | ❌ Server only |
| `MARKERAPI_USERNAME` | USPTO trademark search | ❌ Server only |
| `MARKERAPI_PASSWORD` | USPTO trademark search | ❌ Server only |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error reporting | ✅ Yes (safe — ingest URL) |
| `SENTRY_AUTH_TOKEN` | Source map upload (build only) | ❌ Build only (`.env.sentry-build-plugin`) |
| `NEXT_PUBLIC_APP_URL` | Email links | ✅ Yes (safe) |

## Security Notes

- **Supabase Anon Key**: Exposed to browser intentionally. It is safe **only** because Row Level Security (RLS) is enabled on every table. If you add new tables, always enable RLS immediately.
- **Service Role Key**: Server-side only. It bypasses all RLS. Never use it in client components or prefix it with `NEXT_PUBLIC_`.
- **Sentry DSN**: The DSN is a public ingest endpoint — it is safe to expose. The `SENTRY_AUTH_TOKEN` (for source map uploads) is sensitive and must never be committed.
- **Cron routes**: Protected by `Bearer $CRON_SECRET` header check. Use Vercel cron jobs or configure your scheduler to send this header.

## Deployment (Vercel)

Add all environment variables from `.env.example` in Vercel → Project Settings → Environment Variables.

For `SENTRY_AUTH_TOKEN`, add it as a Vercel environment variable (build-time only) instead of committing `.env.sentry-build-plugin`.
