#!/usr/bin/env bash
# NexusCRM — VPS Setup Script
# Tested on: Ubuntu 22.04 LTS, Debian 12
# Run as root on a fresh server: bash <(curl -sSL https://raw.githubusercontent.com/kushdab/nexuscrm/main/deploy/setup-vps.sh)
set -euo pipefail

REPO="https://github.com/kushdab/nexuscrm.git"
INSTALL_DIR="/opt/nexuscrm"
DOMAIN="${DOMAIN:-crm.yourdomain.com}"

echo "======================================"
echo "  NexusCRM VPS Installer"
echo "  Domain: $DOMAIN"
echo "======================================"

# 1. System update
apt-get update -q && apt-get upgrade -y -q

# 2. Install Docker
if ! command -v docker &>/dev/null; then
  echo "[1/6] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# 3. Install Docker Compose
if ! docker compose version &>/dev/null; then
  echo "[2/6] Installing Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
fi

# 4. Clone repo
echo "[3/6] Cloning NexusCRM..."
git clone "$REPO" "$INSTALL_DIR" 2>/dev/null || (cd "$INSTALL_DIR" && git pull)
cd "$INSTALL_DIR"

# 5. Create production env
echo "[4/6] Generating secrets..."
POSTGRES_PASS=$(openssl rand -hex 20)
REDIS_PASS=$(openssl rand -hex 20)
SECRET=$(openssl rand -hex 32)

cp deploy/.env.prod.example deploy/.env.prod
sed -i "s/STRONG_PASSWORD/$POSTGRES_PASS/g" deploy/.env.prod
sed -i "s/REDIS_PASSWORD/$REDIS_PASS/g"     deploy/.env.prod
sed -i "s/generate-with-openssl-rand-hex-32/$SECRET/g" deploy/.env.prod
sed -i "s/crm.yourdomain.com/$DOMAIN/g"    deploy/.env.prod deploy/Caddyfile

# 6. Replace domain in Caddyfile
sed -i "s/crm.yourdomain.com/$DOMAIN/g" deploy/Caddyfile

# 7. Launch
echo "[5/6] Starting services..."
cd deploy
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo "[6/6] Waiting for services to be healthy..."
sleep 15

# 8. Run migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

echo ""
echo "======================================"
echo "  ✅  NexusCRM is running!"
echo "  URL: https://$DOMAIN"
echo "  Logs: docker compose -f deploy/docker-compose.prod.yml logs -f"
echo ""
echo "  Next steps:"
echo "  1. Point your DNS: $DOMAIN → $(curl -s ifconfig.me)"
echo "  2. Add Stripe keys to deploy/.env.prod"
echo "  3. Seed demo data: docker compose exec backend python -m app.seed.seeder"
echo "======================================"
