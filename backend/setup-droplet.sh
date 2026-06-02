#!/bin/bash
# =============================================================
# setup-droplet.sh — Run this ONCE on a fresh DigitalOcean Droplet
# Ubuntu 22.04 LTS — run as root
# Usage: bash setup-droplet.sh
# =============================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║    ChatApp — DigitalOcean Droplet Setup          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. System update ─────────────────────────────────────────
echo "▶ Updating system packages..."
apt-get update -y && apt-get upgrade -y

# ── 2. Install essentials ────────────────────────────────────
echo "▶ Installing essential tools..."
apt-get install -y curl git ufw fail2ban

# ── 3. Install Docker ────────────────────────────────────────
echo "▶ Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# ── 4. Install Docker Compose plugin ─────────────────────────
echo "▶ Installing Docker Compose..."
apt-get install -y docker-compose-plugin

# ── 5. Configure UFW Firewall ────────────────────────────────
echo "▶ Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh          # port 22
ufw allow 80/tcp       # HTTP (Nginx)
ufw allow 443/tcp      # HTTPS (Nginx + SSL)
# NOTE: Port 4000 is NOT opened — only Nginx can access it internally
echo "y" | ufw enable

# ── 6. Install Nginx ─────────────────────────────────────────
echo "▶ Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# ── 7. Install Certbot (Let's Encrypt SSL) ───────────────────
echo "▶ Installing Certbot..."
apt-get install -y snapd
snap install --classic certbot
ln -sf /usr/bin/certbot /usr/local/bin/certbot

# ── 8. Configure fail2ban ────────────────────────────────────
echo "▶ Configuring fail2ban (brute force protection)..."
systemctl enable fail2ban
systemctl start fail2ban

# ── 9. Create app directory ──────────────────────────────────
echo "▶ Creating app directory..."
mkdir -p /opt/chatapp

# ── 10. Summary ──────────────────────────────────────────────
echo ""
echo "✅ Droplet setup complete!"
echo ""
echo "Next steps:"
echo "  1. Clone your repo into /opt/chatapp/backend"
echo "  2. Create .env.production with your real values"
echo "  3. Configure Nginx (see nginx.conf in your repo)"
echo "  4. Get SSL cert: certbot --nginx -d api.yourdomain.com"
echo "  5. Run: bash deploy.sh"
echo ""
echo "Docker version: $(docker --version)"
echo "Nginx version:  $(nginx -v 2>&1)"
