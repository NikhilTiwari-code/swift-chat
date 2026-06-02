#!/bin/bash
# =============================================================
# deploy.sh — One-command deploy script for DigitalOcean Droplet
# Usage: bash deploy.sh
# =============================================================
set -e

APP_DIR="/opt/chatapp/backend"
REPO_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"   # <-- CHANGE THIS
BRANCH="main"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      ChatApp — Production Deploy          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Pull latest code ──────────────────────────────────────
echo "▶ Pulling latest code from $BRANCH..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git reset --hard "origin/$BRANCH"
else
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 2. Verify .env.production exists ────────────────────────
if [ ! -f "$APP_DIR/.env.production" ]; then
  echo ""
  echo "❌ ERROR: .env.production not found!"
  echo "   Copy .env.production to $APP_DIR/.env.production and fill in all values."
  exit 1
fi

# ── 3. Build and start containers ────────────────────────────
echo ""
echo "▶ Building Docker images..."
docker compose -f docker-compose.prod.yaml build --no-cache

echo ""
echo "▶ Starting services..."
docker compose -f docker-compose.prod.yaml up -d

# ── 4. Wait for backend to be healthy ────────────────────────
echo ""
echo "▶ Waiting for backend to be ready..."
MAX_RETRIES=30
COUNT=0
until curl -sf http://localhost:4000/health > /dev/null; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Backend health check failed after $MAX_RETRIES attempts"
    docker compose -f docker-compose.prod.yaml logs backend --tail=50
    exit 1
  fi
  echo "   Still waiting... ($COUNT/$MAX_RETRIES)"
  sleep 3
done

echo ""
echo "✅ Deployment successful!"
echo "   Backend is running at http://localhost:4000"
echo ""
echo "   Useful commands:"
echo "   • View logs:    docker compose -f docker-compose.prod.yaml logs -f backend"
echo "   • Stop all:     docker compose -f docker-compose.prod.yaml down"
echo "   • Restart:      docker compose -f docker-compose.prod.yaml restart backend"
echo ""
