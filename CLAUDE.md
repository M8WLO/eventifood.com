# Eventifood

Multi-tenant food truck ordering platform. Sellers get their own subdomain (acme.eventifood.com) via wildcard CNAME + Next.js header routing. Single Railway deployment — no per-tenant Railway services.

## Stack
- **Frontend**: Next.js 15 App Router + TypeScript + Tailwind CSS (`/frontend`)
- **Backend**: Django 5 + DRF + JWT auth (`/backend`)
- **Database**: PostgreSQL (Railway managed)
- **Hosting**: Railway (project: `d7f20f14-393c-4f13-9d62-629552dabe04`)
- **Repo**: https://github.com/M8WLO/eventifood.com

## Railway credentials
- Project ID: `d7f20f14-393c-4f13-9d62-629552dabe04`
- Token: stored in Claude memory (`reference_railway_eventifood.md`) — do NOT commit to repo

## Local dev

```bash
docker-compose up          # starts postgres + backend (8000) + frontend (3000)
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

## Railway deploy (manual until GitHub auto-deploy connected)

```bash
$env:RAILWAY_TOKEN = "0bb74da1-ec29-42e8-a429-8c2967bfe32e"
cd backend && railway up --service backend
cd ../frontend && railway up --service frontend
```

## Architecture

- Wildcard CNAME `*.eventifood.com → Railway app` set once in 123-reg
- Next.js middleware reads `Host` header, extracts subdomain, rewrites to `/store/[slug]`
- Django `TenantMiddleware` reads `X-Tenant-Slug` header, sets `request.tenant`
- All DB queries scoped to `request.tenant`

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
| `subscriptions` | Stripe subscription (stubbed) |
| `notifications` | Email (Django email), SMS stub |

## Backlog
- Wire up Stripe when account ready
- Wire up SMS provider (Twilio preferred)
- 123-reg API for custom seller domains (future)
- Seller staff accounts (multi-user per tenant)
