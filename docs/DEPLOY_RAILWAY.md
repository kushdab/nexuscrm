# Deploy NexusCRM to Railway

Railway is the fastest path to production — free tier available, scales automatically.

## One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/nexuscrm)

## Manual Deploy (5 minutes)

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 2. Create project
```bash
git clone https://github.com/kushdab/nexuscrm && cd nexuscrm
railway init
railway link
```

### 3. Add services
```bash
# Add PostgreSQL
railway add --plugin postgresql

# Add Redis
railway add --plugin redis
```

### 4. Set environment variables
```bash
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
# DATABASE_URL and REDIS_URL are auto-injected by Railway plugins
```

### 5. Deploy
```bash
railway up
```

### 6. Run migrations
```bash
railway run alembic upgrade head
```

### 7. Seed demo data (optional)
```bash
railway run python -m app.seed.seeder
```

## Estimated Cost
- Hobby plan: $5/month (includes PostgreSQL + Redis)
- Pro plan: $20/month (for production traffic)

## Custom Domain
```bash
railway domain add crm.yourdomain.com
```
