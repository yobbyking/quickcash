# QuickCash — Earn Real KES Completing Tasks & Surveys

> A premium paid-to-earn survey platform with **Firebase auth** (Google + email/password), **tiered activation** (Silver/Gold/VIP), 50+ Kenyan-focused tasks/surveys, multi-question-type quizzes (DROPDOWN, MULTIPLE_CHOICE, RATING, YES_NO, TEXT), instant M-Pesa STK push activation + B2C withdrawals via SwiftWallet v3.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyobbyking%2Fquickcash&env=DATABASE_URL,NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_APP_ID,FIREBASE_PROJECT_ID,FIREBASE_CLIENT_EMAIL,FIREBASE_PRIVATE_KEY,SWIFTWALLET_API_KEY,SWIFTWALLET_API_URL&project-name=quickcash&repo-name=quickcash)

## ✨ Features

### Authentication
- 🌐 **Continue with Google** — one-click sign in/up via Firebase
- 📧 **Email + password** — Firebase-managed (secure, no plaintext passwords)
- 🔒 **Server-side token verification** — Firebase Admin SDK validates every request

### Three earning tiers
| Tier | Activation Fee | Per-task reward |
|------|---------------|----------------|
| 🥈 Silver | KES 199 | KES 30 – 80 |
| 🥇 Gold | KES 299 | KES 100 – 250 |
| 💎 VIP | KES 399 | KES 300 – 800 |

### Tasks & surveys
- 50+ seeded Kenyan-focused opportunities (Finance, Education, Technology, Entertainment, Environment, etc.)
- **5 question types**: DROPDOWN, MULTIPLE_CHOICE, RATING (1-5), YES_NO, TEXT
- Tier-based filtering (silver users see only silver-tier opportunities)
- One completion per user per opportunity (anti-abuse)
- Instant reward credit + transaction record

### Payments
- **M-Pesa STK push activation** — pay your tier fee directly from your phone
- **M-Pesa B2C withdrawals** — instant payouts to your phone
- **SwiftWallet v3 webhook** — auto-confirms payments via webhook callback
- **Live payment status** — countdown ring UI while waiting for M-Pesa confirmation

### Premium UI
- Animated aurora gradient background (amber/orange theme)
- Glassmorphism cards with gradient borders
- Premium logo with rotating ring
- Step-by-step activation flow with countdown
- Tier-colored badges (silver/gold/violet)
- Mobile-responsive

## 🚀 Deploy to Vercel (5 minutes)

### Step 1 — Get a free PostgreSQL database

Pick one (all have free tiers):
- **Neon** (recommended): https://neon.tech → New Project → copy **connection string**
- **Supabase**: https://supabase.com → New Project → Settings → Database → URI
- **Vercel Postgres**: https://vercel.com/dashboard → Storage → Create Database

### Step 2 — Set up Firebase

1. Go to https://console.firebase.google.com → **Add Project**
2. Name it (e.g. `quickcash-prod`)
3. **Authentication** → **Sign-in method** → enable **Google** and **Email/Password**
4. **Project Settings** (gear icon) → **Your apps** → **Web app** (`</>`)
   - Copy the firebaseConfig values (apiKey, authDomain, projectId, etc.)
5. **Project Settings** → **Service Accounts** → **Generate new private key**
   - This downloads a JSON file with `project_id`, `client_email`, `private_key`

### Step 3 — Deploy on Vercel

1. Fork https://github.com/yobbyking/quickcash to your GitHub
2. Go to https://vercel.com/new → import the repo
3. Add all these env vars (Vercel → Project → Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Postgres connection string from Step 1 |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | from Firebase Config (Step 2.4) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | from Firebase Config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | from Firebase Config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | from Firebase Config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | from Firebase Config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | from Firebase Config |
| `FIREBASE_PROJECT_ID` | from Service Account (Step 2.5) |
| `FIREBASE_CLIENT_EMAIL` | from Service Account |
| `FIREBASE_PRIVATE_KEY` | from Service Account (with `\n` newlines preserved) |
| `SWIFTWALLET_API_KEY` | `sw_588b7ac498489355a76104fd73b8f51cb9fa597916597c12dca88be2` |
| `SWIFTWALLET_API_URL` | `https://api.swiftwallet.co.ke/v3` |

4. Click **Deploy**
5. Once deployed, hit the **seed** endpoint to populate tasks:
   ```
   curl -X POST https://your-app.vercel.app/api/seed
   ```
   You should see: `{"message":"Seeded 50 opportunities", ...}`

### Step 4 — Set the SwiftWallet webhook

1. Log into https://swiftwallet.co.ke dashboard
2. Find webhook settings → set URL to: `https://your-app.vercel.app/api/payments/webhook`

## 🛠 Local Development

```bash
# Install deps
bun install

# Set up env
cp .env.example .env
# Edit .env with your Firebase + DATABASE_URL + SWIFTWALLET_API_KEY

# Push DB schema
bun run db:push

# Seed tasks
curl -X POST http://localhost:3000/api/seed

# Start dev
bun run dev
```

## 📁 Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/                # register, login, me, activate
│   │   ├── opportunities/        # list, detail, start, submit
│   │   ├── payments/            # deposit, withdraw, status, transactions, webhook
│   │   └── seed/                # seeds 50+ opportunities
│   ├── auth/                    # register, login, activate pages
│   └── dashboard/               # overview, deposit, withdraw, transactions, profile
├── components/
│   ├── ui/                      # shadcn/ui
│   ├── animated-background.tsx
│   └── dashboard-shell.tsx
└── lib/
    ├── auth-context.tsx         # Firebase client-side auth provider
    ├── auth.ts                 # server-side token verification
    ├── firebase.ts             # Firebase client SDK
    ├── firebase-admin.ts       # Firebase Admin SDK
    ├── api-fetch.ts            # auto-attaches Bearer token
    ├── db.ts                   # Prisma client
    └── swiftwallet.ts          # SwiftWallet v3 API client
prisma/
└── schema.prisma               # User, Opportunity, Question, Completion, Answer, Payment, Transaction
```

## 🔒 Security

- **Firebase Auth** — Google + email/password (no plaintext passwords on our side)
- **Server-side token verification** on every API request via Firebase Admin SDK
- **Tier-based access control** — silver users can't access gold/vip tasks
- **One attempt per opportunity** — users can't complete the same task twice
- **Required question validation** — submit fails if any required question is empty
- **Anti-fraud** — payment throttling, balance held during withdrawals (refunded on fail)

## 🎮 Question types

| Type | UI | Example |
|------|-----|---------|
| DROPDOWN | Single-select list | "How many M-Pesa transactions per day?" → 0/1/2/3/4/5/6-10/More than 10 |
| MULTIPLE_CHOICE | Multi-select checkboxes | "Which M-Pesa features? Send money / Buy airtime / Pay bill / Lipa na M-Pesa / Fuliza / M-Shwari |
| RATING | 5 large number buttons | "Rate your satisfaction" → 1/2/3/4/5 |
| YES_NO | Two large buttons | "Have you experienced M-Pesa downtime?" → Yes / No |
| TEXT | Textarea | "What improvement would you suggest?" |

## 📝 License

MIT © 2026 QuickCash
