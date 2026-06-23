# Deploy NexusCRM to Render

Render gives you managed PostgreSQL, Redis, and auto-deploys from GitHub — free tier available.

## One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kushdab/nexuscrm)

## Manual Deploy

### 1. Fork the repo
Fork `kushdab/nexuscrm` to your GitHub account.

### 2. Connect to Render
1. Go to https://render.com → New → Blueprint
2. Connect your forked repo
3. Render reads `render.yaml` and creates all services automatically

### 3. Set secret variables
After deploy, set these in the Render dashboard under each service:
- `STRIPE_SECRET_KEY` — from your Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` — from Stripe webhook settings

### 4. Run migrations (first deploy only)
Render runs `alembic upgrade head` automatically on start.

### 5. Seed demo data
Use the Render Shell tab on the `nexuscrm-api` service:
```bash
python -m app.seed.seeder
```

## Services Created
| Service | Type | Plan |
|---------|------|------|
| nexuscrm-api | Web | Starter |
| nexuscrm-web | Web | Starter |
| nexuscrm-worker | Background Worker | Starter |
| nexuscrm-db | PostgreSQL | Starter |
| nexuscrm-redis | Redis | Starter |

## Estimated Cost
- Free tier: limited hours/month (dev/demo)
- Paid: ~$21/month for all services on Starter plan
