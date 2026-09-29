# SwiftPay — Premium M-Pesa Wallet (Paid-to-Earn)

> Get paid to **answer surveys, watch ads, and refer friends**. Earn real KES, instantly withdrawable to your M-Pesa via SwiftWallet v3 STK push + B2C.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyobbyking%2Fswiftpay&env=DATABASE_URL,JWT_SECRET,SWIFTWALLET_API_KEY,SWIFTWALLET_API_URL,NEXT_PUBLIC_BCLB_NUMBER,NEXT_PUBLIC_ACTIVATION_FEE&envDescription=Database%2C%20auth%20secret%2C%20and%20SwiftWallet%20API%20credentials&project-name=swiftpay&repo-name=swiftpay)

![SwiftPay](public/logo.svg)

## ✨ Features

### Three ways to earn
- **Tasks & Surveys** — 8+ seeded tasks, payouts 8–35 KES each, instant credit
- **Watch Ads** — 2 KES per ad, up to 15/day = 30 KES daily (auto-resets at midnight)
- **Referral Program** — 10 KES bonus for every friend who activates

### Premium auth flow
- Split-screen register/login with live password strength meter
- Cinematic M-Pesa activation flow (150 KES one-time STK push)
- 3-step progress indicator with animated countdown ring
- Live payment confirmation via webhook + polling fallback

### Wallet
- Deposit via M-Pesa STK push (1–70,000 KES)
- Withdraw via B2C payout (instant to M-Pesa)
- Full transaction history with categorized icons

### Tech
- Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- Prisma ORM + PostgreSQL (Neon / Supabase / Vercel Postgres)
- bcryptjs + JWT (httpOnly cookies, 7-day sessions)
- SwiftWallet v3 API (STK push + B2C + webhook)
- Animated aurora background + glassmorphism UI

## 🚀 Deploy to Vercel (5 minutes)

### Step 1 — Get a PostgreSQL database (free)

Pick one:

**Option A — Neon (recommended)**
1. Go to https://neon.tech → Sign up
2. New Project → copy the **Connection string** (looks like `postgresql://user:pass@host/db?sslmode=require`)

**Option B — Supabase**
1. Go to https://supabase.com → Sign up
2. New Project → Settings → Database → Connection string → **URI**

**Option C — Vercel Postgres**
1. Go to https://vercel.com/dashboard → Storage → Create Database → Postgres
2. Copy the **Prisma** connection string

### Step 2 — Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyobbyking%2Fswiftpay)

Or manually:
1. Fork this repo to your GitHub
2. Go to https://vercel.com/new → Import the repo
3. Add these env vars (Project → Settings → Environment Variables):

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Postgres connection string (from Step 1) |
| `JWT_SECRET` | A long random string — `openssl rand -hex 32` |
| `SWIFTWALLET_API_KEY` | `sw_588b7ac498489355a76104fd73b8f51cb9fa597916597c12dca88be2` (demo) or your own from swiftwallet.co.ke |
| `SWIFTWALLET_API_URL` | `https://api.swiftwallet.co.ke/v3` |
| `NEXT_PUBLIC_BCLB_NUMBER` | `7YGEB3OD` (or your license number) |
| `NEXT_PUBLIC_ACTIVATION_FEE` | `150` |

4. Click **Deploy** — Vercel will:
   - Run `bun install`
   - Run `prisma generate` (auto via postinstall)
   - Run `prisma db push --accept-data-loss` (creates tables)
   - Run `next build`
5. Your app is live at `https://your-project.vercel.app` 🎉

### Step 3 — Configure SwiftWallet webhook

1. Log into https://swiftwallet.co.ke dashboard
2. Find your app's webhook settings
3. Set the callback URL to: `https://your-project.vercel.app/api/payments/webhook`

This is how SwiftWallet notifies your app when an M-Pesa payment is confirmed.

## 🛠 Local Development

```bash
# 1. Install deps
bun install

# 2. Copy env file and fill in
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, SWIFTWALLET_API_KEY

# 3. Push schema to DB + generate Prisma client
bun run db:push

# 4. Start dev server
bun run dev
```

Open http://localhost:3000

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/        # register, login, me, verify (STK push)
│   │   ├── payments/   # deposit, withdraw, status, webhook, transactions
│   │   ├── tasks/      # list, submit
│   │   └── ads/        # serve, reward
│   ├── auth/           # register, login, verify pages
│   └── dashboard/      # overview, tasks, ads, deposit, withdrawal, transactions, profile
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── animated-background.tsx
│   ├── auth-shell.tsx
│   ├── dashboard-shell.tsx
│   └── logo.tsx
└── lib/
    ├── auth.ts         # bcrypt + JWT helpers
    ├── db.ts           # Prisma client
    ├── swiftwallet.ts  # SwiftWallet v3 API client
    └── payment-socket.ts # Polling helper (was Socket.IO, now Vercel-friendly)
prisma/
└── schema.prisma       # User, Session, Payment, Transaction, Task, TaskAttempt, AdWatch
public/
└── logo.svg            # Premium SwiftPay logo
```

## 🔒 Security

- Passwords hashed with bcryptjs (12 rounds)
- JWT sessions in httpOnly cookies (7-day expiry)
- Server-side session validation on every API request
- SwiftWallet webhook validates Authorization header when present
- Anti-fraud: max 1 ad reward per 10 seconds, 15 ad cap per day per user
- Task attempts: max 1 per user per task, all-question validation

## 🎨 UI

- Dark theme with emerald + cyan + amber/gold accents
- Glassmorphism (backdrop-blur) on all cards
- Animated aurora background (3 drifting radial gradients + canvas particles)
- Custom premium SVG logo with lightning bolt + "K" coin
- Fully responsive (mobile-first)

## 📋 BCLB Compliance

BCLB No. **7YGEB3OD** displayed on:
- Landing page footer
- Auth pages footer
- Dashboard sidebar + footer
- Profile page

## 🚦 API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login (email or username)
- `GET /api/auth/me` — Get current user
- `DELETE /api/auth/me` — Logout
- `POST /api/auth/verify` — Initiate 150 KES activation STK push

### Payments
- `POST /api/payments/deposit` — Initiate deposit STK push
- `POST /api/payments/withdraw` — Initiate B2C payout
- `GET /api/payments/status?paymentId=X` — Poll payment status
- `POST /api/payments/webhook` — SwiftWallet webhook receiver
- `GET /api/payments/transactions` — User transaction history

### Tasks & Ads
- `GET /api/tasks/list` — Available tasks
- `GET /api/tasks/list?taskId=X` — Single task details
- `POST /api/tasks/list` — Seed sample tasks (admin)
- `POST /api/tasks/submit` — Submit answers, credit reward
- `GET /api/ads/serve` — Get random ad
- `POST /api/ads/reward` — Claim ad reward

## 📝 License

MIT © 2026 SwiftPay
