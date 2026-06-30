# Eventifood

Multi-tenant food truck ordering platform. Sellers get their own subdomain (acme.eventifood.com) via wildcard CNAME + Next.js header routing. Single Railway deployment — no per-tenant Railway services.

## Branch structure — CRITICAL

| Branch | Purpose |
|--------|---------|
| `main` | **Production web platform** — eventifood.com (Next.js + Django). All main site features, homepage, seller dashboard, customer storefront, payments. Deploy via `railway up`. |
| `staging` | **Staging / test** — mirrors main, used to test before promoting to production. |
| `eventifood-pro-plus` | **Eventifood Pro Plus POS system** — a completely separate Electron-based offline/online POS product (`/pos` directory). NEVER commit main site changes here. POS work only. |

**Rule: never commit web platform changes to `eventifood-pro-plus`. Never commit POS changes to `main` or `staging`.**

## Claude behaviour rules

- Always check the current branch before committing — web platform changes go to `main`/`staging`, POS changes go to `eventifood-pro-plus`.
- After deploying any change to production (main), always ask: "Do you want me to sync these changes to staging as well?"
- After every `railway up`, monitor the build automatically using Railway GraphQL (`buildLogs` + polling deployment status). If the build fails, read the error, fix it, and redeploy without waiting for the user to report it.

## Stack
- **Frontend**: Next.js 15 App Router + TypeScript + Tailwind CSS (`/frontend`)
- **Backend**: Django 5 + DRF + JWT auth (`/backend`)
- **Database**: PostgreSQL (Railway managed)
- **Hosting**: Railway (project: `d7f20f14-393c-4f13-9d62-629552dabe04`)
- **Repo**: https://github.com/M8WLO/eventifood.com

## Railway credentials
- Project ID: `d7f20f14-393c-4f13-9d62-629552dabe04`
- Project token: `0bb74da1-ec29-42e8-a429-8c2967bfe32e`
- Account token: `90b10335-5fed-484a-b33f-72eb8745d95b`
- Environment ID: `5018b358-536e-4115-850d-5088708468c0`
- Backend service ID: `b64684a0-6243-4282-97e8-175658cadd18`
- Frontend service ID: `2b53c16f-c6ec-4e79-abc4-0241aa77e372`
- Postgres service ID: `3eefbab7-553d-4151-85b4-ce57e305d911`
- Backend public URL: `https://backend-production-9e5c.up.railway.app`
- Frontend public URL: `https://eventifood.com`

## Railway Volumes
| Volume | Service | Mount path | Purpose |
|--------|---------|-----------|---------|
| `backend-volume` | backend | `/app/media` | Uploaded media files (banners, logos) — persists across redeploys |
| `postgres-volume` | Postgres | `/var/lib/postgresql/data` | Database — persists across redeploys |

Django `MEDIA_ROOT = BASE_DIR / 'media'` resolves to `/app/media` in the Railway container, so uploads land on the volume automatically. No code changes needed to use it.

## Local dev

```bash
docker-compose up          # starts postgres + backend (8000) + frontend (3000)
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

## Railway deploy

```powershell
$env:RAILWAY_TOKEN = "0bb74da1-ec29-42e8-a429-8c2967bfe32e"
Set-Location "C:\Users\ahugh\EventiFood"
railway up --service backend --detach
railway up --service frontend --detach
```

## Railway — set env vars on backend

```powershell
$env:RAILWAY_TOKEN = "0bb74da1-ec29-42e8-a429-8c2967bfe32e"
Set-Location "C:\Users\ahugh\EventiFood"
railway variables set KEY=value --service backend
railway variables --service backend   # list all
```

## Railway — set env vars on frontend

```powershell
$env:RAILWAY_TOKEN = "0bb74da1-ec29-42e8-a429-8c2967bfe32e"
Set-Location "C:\Users\ahugh\EventiFood"
railway variables set KEY=value --service frontend
```

## Railway — run Django management commands

```powershell
$env:RAILWAY_TOKEN = "0bb74da1-ec29-42e8-a429-8c2967bfe32e"
Set-Location "C:\Users\ahugh\EventiFood"
railway run --service backend python manage.py migrate
railway run --service backend python manage.py createsuperuser
```

## Payment provider env vars (already set on Railway backend)
| Variable | Description |
|---|---|
| `PAYPAL_CLIENT_ID` | Live PayPal app client ID |
| `PAYPAL_CLIENT_SECRET` | Live PayPal app secret |
| `PAYPAL_ENV` | `live` |
| `GOCARDLESS_ACCESS_TOKEN` | Live GoCardless access token |
| `GOCARDLESS_ENV` | `live` |
| `FRONTEND_URL` | `https://eventifood.com` |
| `BACKEND_URL` | `https://backend-production-9e5c.up.railway.app` |

Full credential values stored in `SECRETS.md` (gitignored) and Claude memory `reference_eventifood_secrets.md`.

## Architecture

- Wildcard CNAME `*.eventifood.com → Railway app` set once in 123-reg
- Next.js middleware reads `Host` header, extracts subdomain, rewrites to `/store/[slug]`
- Django `TenantMiddleware` reads `X-Tenant-Slug` header, sets `request.tenant`
- All DB queries scoped to `request.tenant`

## Business Model — PAYG

**No monthly subscription. Sellers pay only when they trade.**

- Platform fee: **2% per transaction** (deducted automatically via Stripe Connect application fee)
- Stripe processing fee: **1.5% + 20p** per transaction (UK cards) — paid to Stripe, not us
- Seller total cost: ~3.5% + 20p per transaction for UK cards
- Zero cost when not trading — ideal for seasonal / part-year food trucks

Fee is enforced at Stripe infrastructure level — hardcoded in PaymentIntent creation,
sellers cannot bypass or opt out.

## TEST_MODE=True (Stripe disabled)

Registration auto-provisions tenant — no payment required. Flip `TEST_MODE=False` in Railway env vars to go live.

## Email MFA

Sellers always have MFA enabled. Login returns `mfa_required: true` + signed partial token. Verify at `/api/auth/verify-otp/`. OTP expires in 10 minutes.

## Super-admin

- Django Admin: `/admin/` (superadmin user)
- Next.js: `/superadmin/` (JWT claim `is_superadmin: true`)

## Apps

| App | Purpose |
|-----|---------|
| `accounts` | Custom User, TenantMembership, EmailOTP, email MFA flow |
| `tenants` | Tenant model, QR code generation, registration |
| `catalog` | Category, Product, ProductVariation |
| `orders` | Order, OrderItem, kitchen board, status updates |
| `inventory` | StockRecord, wastage tracking |
| `subscriptions` | Stripe subscription (stubbed — to be replaced with PAYG model) |
| `notifications` | Email (Django email), SMS stub |
| `payments` | (TO BUILD) Stripe Connect, PaymentIntent, webhooks |

---

## Backlog

### UI Gaps — Completed
- [x] Customer storefront: apply seller's chosen theme colour to header/buttons/basket bar
- [x] Customer storefront: display seller banner image in header
- [x] Customer storefront: render product photos as thumbnails
- [x] Customer storefront: render variation photos inline
- [x] Menu editor modal: add cost_price input for single-price products
- [x] Menu editor modal: add cost_price column to variation rows
- [x] Menu editor modal: add product photo upload
- [x] Menu editor modal: add per-variation photo upload
- [x] Backend: add has_variations + base_price to ProductSellerSerializer fields
- [x] Seller settings: add "Open full-screen QR" button (opens /seller/display in new window)
- [x] New page: /seller/display — full-screen QR code for secondary monitor display
- [x] Basket page: apply theme colour from sessionStorage — all 12 themes wired
- [x] Wire up real email backend (Resend SMTP) for order confirmations + OTP
- [x] Pricing section: plans + features loaded from DB; base features listed first in each card
- [x] Order receipt email (HTML) on order placement
- [x] "Order is hot & ready" HTML notification email
- [x] Trial expiry: trial_expires_at on Tenant, is_service_live() gate, superadmin date picker
- [x] Storefront trial-expired gate: shows "temporarily unavailable" if trial_expired=true

### PAYG / Stripe Connect (next major feature)

**Prerequisites (one-time platform owner setup):**
- [ ] Create Stripe platform account at stripe.com
- [ ] Enable Stripe Connect (Express accounts) in Stripe Dashboard → Settings → Connect
- [ ] Add env vars to Railway backend service:
      STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_CLIENT_ID
- [ ] Add `stripe` to backend/requirements.txt
- [ ] Register webhook endpoint in Stripe Dashboard pointing to /api/payments/webhook/

- [ ] `payments` Django app + TenantPaymentProvider model
      Fields: tenant (OneToOne), stripe_account_id, stripe_onboarding_complete,
              platform_fee_percent (default 2.00, not editable by seller), connected_at
- [ ] GET /api/payments/connect/ → generate Stripe Connect OAuth URL, redirect seller
- [ ] GET /api/payments/connect/callback/ → exchange code for account ID, store it, redirect to settings
- [ ] Stripe webhook: account.updated → mark stripe_onboarding_complete=True
- [ ] Stripe webhook: payment_intent.succeeded → create Order record + send confirmation email
- [ ] Stripe webhook: payment_intent.payment_failed → notify buyer, do not create order
- [ ] Basket checkout: create PaymentIntent (application_fee=2%, transfer to seller account)
      then redirect buyer to Stripe-hosted payment page (Stripe Checkout Session)
- [ ] Order placement gate: block if stripe_onboarding_complete=False, return 402 with setup link
- [ ] Seller settings: "Payment setup" card
      - Not connected: "Connect Stripe" button + explainer
      - Connected: green tick, connected account email, payout schedule, "2% platform fee" shown
      - Onboarding incomplete: yellow warning + "Complete setup" link
- [ ] Registration flow: after store creation, redirect to Stripe connect step before going live
- [ ] Remove subscription billing as hard requirement (TEST_MODE flow stays for dev)
- [ ] Marketing/pricing page at eventifood.com home (see Pricing Page section below)

### SMS — Platform Credits (sellers buy packages)
- [ ] `SmsCredit` model: tenant, credits_remaining, credits_lifetime_purchased
- [ ] `SmsPurchase` model: tenant, package_slug, credits, amount_paid_pence, purchased_at, stripe_payment_id
- [ ] SMS packages defined by superadmin (e.g. Starter 100 = £4, Standard 500 = £18, Pro 1000 = £32)
- [ ] Seller: "SMS Credits" section in settings — balance + "Buy credits" button
- [ ] Buy credits: Stripe Checkout (one-time payment, not subscription) → webhook credits account
- [ ] Send logic: before sending SMS check credits_remaining > 0, deduct 1 on success
- [ ] If credits = 0: log suppressed send, do NOT send, alert seller by email (not SMS — ironic)
- [ ] Alert seller when credits < 10
- [ ] SMS credit balance shown on seller dashboard
- [ ] Superadmin: view all tenant SMS balances, manually adjust credits

### SMS — Bring Your Own Provider (BYOP)
- [ ] `TenantSmsConfig` model: tenant, provider (twilio/messagebird/vonage/clickatell/textmagic),
      credentials_encrypted (JSON field, AES encrypted at rest), from_number, is_active
- [ ] Seller settings: "SMS Provider" section
      - Dropdown: Use platform credits / Twilio / MessageBird / Vonage / Clickatell / TextMagic
      - Per-provider credential fields shown dynamically
      - "Send test message" button to verify credentials
- [ ] notifications/services.py: BYOP takes priority over platform credits if TenantSmsConfig.is_active
- [ ] Supported providers + credentials required:
      Twilio:      account_sid, auth_token, from_number
      MessageBird: api_key, originator
      Vonage:      api_key, api_secret, from_number
      Clickatell:  api_key (simplest)
      TextMagic:   username, api_key

### Future / Lower Priority
- [ ] Wire up real SMS via platform provider (Twilio recommended for platform credits)
- [ ] 123-reg API integration for automated subdomain CNAME creation on seller registration
- [ ] PayPal Commerce Platform OAuth (alternative to Stripe for sellers who prefer PayPal)
- [ ] SumUp API key integration (very popular UK food truck card reader)
- [ ] Seller staff accounts (multi-user per tenant, role=staff)
- [ ] Minimum order value setting per tenant (recommended: £5+ to protect against Stripe fixed fee)
- [ ] Stripe Terminal card reader integration (sellers can use phone/tablet as card reader)
- [ ] Custom seller domain (e.g. orders.andysburgers.co.uk → andys-burgers.eventifood.com)
- [ ] Superadmin: platform revenue dashboard (total application fees earned by period)

---

## Pricing Page — Copy & Structure

The home page (eventifood.com) should serve as the marketing/pricing page for sellers.
Buyers land on subdomains only (andys-burgers.eventifood.com) — the main domain is seller-facing.

### Hero

**Headline:** Your food truck, online. No monthly fees.

**Subhead:** Eventifood gives your customers a way to order ahead, skip the queue, and get
notified when their food is ready — and you only pay when you trade.

**CTA:** Set up your store free →

---

### The deal (pricing section)

**Heading:** Simple, honest pricing

**One plan. No tiers. No surprises.**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   £0 / month                                        │
│   when you're not trading                           │
│                                                     │
│   2% per order                                      │
│   when you are                                      │
│                                                     │
│   + Stripe card processing (1.5% + 20p, UK cards)  │
│   the same fee you'd pay with any card machine      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Example box:**

> On a £10 order:
> Stripe processing fee: 35p (same as any card machine)
> Eventifood fee: 20p
> **You keep: £9.45**
> And your customer got to order from the queue on their phone.

---

### What you get (features list)

Everything. No feature tiers.

- ✓ Your own ordering page (yourname.eventifood.com)
- ✓ QR code to print and display at your van
- ✓ Customer orders on their phone — no app needed
- ✓ Kitchen display screen for your orders
- ✓ Customers notified by email when order is ready
- ✓ SMS notifications (credit packages available separately)
- ✓ Full sales analytics and profit & loss
- ✓ Wastage and stock tracking
- ✓ Secure login with email verification code
- ✓ Works on any phone, tablet or laptop

---

### Comparison (the upsell)

**Heading:** More than a card machine, for less than you think

| | Card machine only | Eventifood + card |
|---|---|---|
| Customers order on their phone | ✗ | ✓ |
| Kitchen display screen | ✗ | ✓ |
| Customers notified when ready | ✗ | ✓ |
| Sales analytics | ✗ | ✓ |
| Monthly fee when you're not trading | £0–£30/mo | **£0** |
| Processing fee | 1.5–1.75% | 2% + Stripe |

**Body text:**
A standard card machine charges 1.5–1.75% per transaction and you pay a monthly
terminal rental whether you're trading or not. Eventifood costs a fraction more per
transaction — but handles your queue, your kitchen, your analytics, and your customers'
experience. And when festival season ends and you park the van for winter, you pay
absolutely nothing.

---

### For seasonal traders (the key upsell for part-year businesses)

**Heading:** Closed for winter? So is your bill.

Most software charges you 12 months a year. Food trucks don't trade 12 months a year.
Eventifood only charges when orders come through. Park the van in November, come back
in April — your store, your menu, your QR codes, and your customer history are all
exactly where you left them. You paid nothing while you were away.

---

### CTA section

**Free to set up. No card required.**

Your store is live in under 10 minutes. Connect your Stripe account and your
first order can come through today.

[ Set up your free store → ]

---
