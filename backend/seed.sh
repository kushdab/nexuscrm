#!/usr/bin/env bash
# Run the demo seeder inside Docker
set -e
echo "Running NexusCRM demo seeder..."
docker compose exec backend python -m app.seed.seeder
