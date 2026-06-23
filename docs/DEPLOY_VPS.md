# Deploy NexusCRM to a VPS (Self-Hosted)

Full production deployment on any Linux VPS — DigitalOcean, Linode, Hetzner, AWS EC2, etc.
Auto-HTTPS via Caddy, Docker Compose orchestration, CI/CD via GitHub Actions.

## Minimum Requirements
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 1 vCPU  | 2 vCPU      |
| RAM      | 1 GB    | 2 GB        |
| Disk     | 20 GB   | 40 GB SSD   |
| OS       | Ubuntu 22.04 | Ubuntu 22.04 |

## One-Command Install

On a fresh Ubuntu 22.04 VPS:
```bash
DOMAIN=crm.yourdomain.com bash <(curl -sSL \
  https://raw.githubusercontent.com/kushdab/nexuscrm/main/deploy/setup-vps.sh)
```

That's it. The script:
1. Installs Docker + Docker Compose
2. Clones the repo to `/opt/nexuscrm`
3. Generates all secrets (no manual copy-paste)
4. Replaces your domain in all configs
5. Pulls images and starts all services
6. Runs Alembic migrations
7. Prints your URL

## DNS Setup
Point an A record to your VPS IP before running the installer:
```
A  crm.yourdomain.com  →  <your-vps-ip>
```
Caddy handles TLS automatically via Let's Encrypt.

## CI/CD Auto-Deploy (GitHub Actions)

Every push to `main` builds new Docker images and deploys to your VPS automatically.

Add these secrets to your GitHub repo (Settings → Secrets):
| Secret | Value |
|--------|-------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | SSH username (e.g. `root`) |
| `VPS_SSH_KEY` | Private SSH key |

## Useful Commands
```bash
cd /opt/nexuscrm/deploy

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart a service
docker compose -f docker-compose.prod.yml restart backend

# Run a command inside backend
docker compose -f docker-compose.prod.yml exec backend <cmd>

# Backup database
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U nexus nexuscrm > backup_$(date +%Y%m%d).sql

# Update to latest
git pull && docker compose -f docker-compose.prod.yml pull && \
  docker compose -f docker-compose.prod.yml up -d
```

## Estimated Cost
| Provider | Spec | Monthly |
|----------|------|---------|
| Hetzner CX21 | 2 vCPU, 4 GB | ~$5 |
| DigitalOcean Basic | 1 vCPU, 2 GB | ~$12 |
| Linode Nanode | 1 vCPU, 1 GB | ~$5 |
