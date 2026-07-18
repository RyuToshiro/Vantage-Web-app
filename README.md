# Vantage

Turn a handful of listing photos into one cinematic 9:16 walkthrough video.
Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion, Supabase for
auth/data/storage, and Higgsfield for the actual photo → video generation.

The app runs completely standalone in **mock mode** — no Higgsfield key, no
external API calls — so you can see the whole product end to end before
wiring up real generation.

---

## 1. Quick start (mock mode)

```bash
npm install
npm run placeholders   # regenerates the bundled demo video/photo assets (optional — already committed)
cp .env.example .env.local
# fill in the three NEXT_PUBLIC_SUPABASE_* / SUPABASE_SERVICE_ROLE_KEY values (step 2 below)
npm run dev
```

Open http://localhost:3000. `GENERATION_MODE` defaults to `mock`, so signing
up, uploading photos, and "generating" a tour all work with zero external
calls beyond Supabase itself — the pipeline just walks through the same
statuses a real render would and hands back one of the bundled placeholder
clips in `/public/placeholders`.

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste the contents of
   `supabase/migrations/0001_init.sql` → Run. This creates:
   - `profiles` and `tours` tables with RLS enabled
   - a trigger that creates a `profiles` row (5 free credits) on signup
   - `increment_credits` / `decrement_credit_if_available` RPCs used by the
     generation pipeline to charge and refund credits
   - two **private** storage buckets, `photos` and `tours`, each with
     per-user folder policies (`{user_id}/...`) — nothing is public; the app
     always resolves short-lived signed URLs server-side
3. **Authentication → Providers**: email magic link is on by default. To
   enable Google, add your OAuth client ID/secret under the Google provider
   and add `https://<your-domain>/auth/callback` (and
   `http://localhost:3000/auth/callback` for local dev) as a redirect URL.
4. **Project Settings → API**: copy the Project URL, `anon` public key, and
   `service_role` secret key into `.env.local` (see table below).

**Verifying RLS actually works:** `supabase/testing/` has a self-contained
test suite that runs the real migration against a throwaway local Postgres
and exercises it as two simulated users — confirms user B genuinely can't
read/write user A's tours or storage objects (not just that the policies
exist), and that the credit-charge RPC fails closed at 0 without going
negative. Needs a local Postgres superuser:

```bash
sudo bash supabase/testing/run.sh
```

## 3. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | always | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | always | Public anon key — safe client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | always | **Server-only.** Used by the generation pipeline to update job status and write storage objects with RLS bypassed. Never expose to the client. |
| `GENERATION_MODE` | always | `mock` (default) or `live` |
| `HIGGSFIELD_API_KEY` | only in `live` mode | Format `KEY_ID:KEY_SECRET` from [cloud.higgsfield.ai](https://cloud.higgsfield.ai) |

## 4. Switching to `live` generation

Set `GENERATION_MODE=live` and `HIGGSFIELD_API_KEY=KEY_ID:KEY_SECRET`.

The whole provider integration lives in `lib/generation/` behind one
interface (`lib/generation/index.ts`), so swapping providers or models means
editing one file:

- `lib/generation/higgsfield.ts` — the Higgsfield API call for a single
  start+end-frame segment. The model is pinned to
  `kling-video/v2.1/pro/image-to-video`. **Before going live**, double check
  the end-frame input field name for that model in the
  [Models Gallery](https://docs.higgsfield.ai) — it's documented as
  `end_image_url` for Kling as of this writing, but Higgsfield hosts several
  image-to-video providers (Kling, Seedance/ByteDance, their own DoP model)
  and the field name isn't identical across all of them. There's a `TODO`
  comment at the exact line to check.
- `lib/generation/live.ts` — orchestrates the full pipeline: builds the
  N−1 segment plan from consecutive photo pairs, signs private photo URLs so
  Higgsfield can fetch them, runs segments with limited concurrency, and
  hands each result to...
- `lib/generation/ffmpeg.ts` — normalizes every segment to H.264 / yuv420p /
  faststart (providers sometimes return HEVC) and stitches them with the
  ffmpeg concat demuxer, then extracts a poster frame.

**Serverless caveat:** `/api/generate` kicks off generation without
awaiting it (`lib/generation/kickoff.ts`), using `waitUntil()` from
`@vercel/functions` so the function isn't frozen the instant the response is
sent. That's enough for `mock` mode's ~10s job. The `live` pipeline can run
for minutes, which exceeds most serverless execution limits even with
`waitUntil()`. For production `live` traffic, swap `kickoffGeneration` for a
durable queue — a Supabase Edge Function on a `pg_cron` trigger, Inngest,
trigger.dev, or a QStash webhook into a dedicated worker route all work well
here. Locally (`next dev`) and with `next start` on a normal Node server,
plain fire-and-forget works fine because the process stays alive regardless.

## 5. Swapping in your own media

Everything under `/public/placeholders` is placeholder content generated
locally by `scripts/generate-placeholders.mjs` (abstract animated gradients
— there's no stock footage or third-party media bundled). Replace these
with your own vertical clips/photos, same filenames, same aspect ratios:

- `hero-1.mp4` … `hero-6.mp4` — the two auto-scrolling video columns on the
  landing page (1080×1920, ~6s each, silent)
- `sample-tour-1.mp4` / `.jpg` … `sample-tour-3.mp4` / `.jpg` — what mock
  mode "delivers" as a finished tour, and its poster
- `thumb-1.jpg` … `thumb-8.jpg` — the horizontal thumbnail strip in the hero

Re-run `npm run placeholders` any time to regenerate the originals.

## 6. Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the environment variables from the table above in **Project Settings
   → Environment Variables**.
3. Deploy. `ffmpeg-static` and `@higgsfield/client` both work fine in
   Vercel's Node.js serverless runtime.
4. Add your production domain's `/auth/callback` URL to Supabase's redirect
   allow-list (Authentication → URL Configuration).
5. If you turn on `live` mode in production, see the serverless caveat above
   before you rely on it for real traffic.

## 7. Notable decisions / things to know

- **Storage is private, not public.** Both buckets are created with
  `public: false`; the app never serves a raw bucket URL. `/api/tours` and
  `/api/tours/[id]` resolve `result_url` / `poster_url` into signed URLs
  (7-day expiry) on every read, and the live pipeline signs photo URLs
  on-demand right before handing them to Higgsfield. This is what actually
  makes "user A can't read user B's tour" true, rather than relying on
  unguessable URLs — and it's verified by `supabase/testing/run.sh`, not
  just asserted.
- **Credits** are charged atomically via the `decrement_credit_if_available`
  RPC (fails closed at 0) and refunded via `increment_credits` if a job
  fails after the credit was charged.
- **Billing/Stripe is intentionally not wired up.** `/app/settings` has a
  billing section shaped for it (tiers, credit counts, disabled buttons) —
  see the `TODO`-free but clearly stubbed `BILLING_TIERS` in
  `app/app/settings/page.tsx`.
- **Typography** uses `@fontsource-variable/inter` (self-hosted Inter, no
  runtime dependency on Google Fonts) rather than `next/font/google`.
- Every video element respects `prefers-reduced-motion` — the landing page
  marquees and result-panel shimmer freeze via CSS media queries and
  Tailwind's `motion-safe:` variant.
