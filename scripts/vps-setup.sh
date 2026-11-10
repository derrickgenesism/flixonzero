#!/bin/bash
# ============================================================
#  FlixOn VPS Setup Script
#  Run this ONCE on a fresh VPS to initialise blue-green deploys
#  Usage: bash scripts/vps-setup.sh
# ============================================================
set -e

SITE_DIR="/var/www/flixon"
RELEASES_DIR="/var/www/flixon-releases"
REPO="https://github.com/derrickgenesism/flixonzero.git"

echo "======================================================"
echo "  FlixOn VPS Initialisation"
echo "======================================================"

# ── Node.js (via nvm) ─────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "📦 Installing Node.js 20..."
  curl -fsSL https://fnm.vercel.app/install | bash
  export PATH="$HOME/.local/share/fnm:$PATH"
  eval "$(fnm env --use-on-cd)"
  fnm install 20
  fnm use 20
  fnm default 20
else
  echo "✅ Node $(node -v) already installed"
fi

# ── PM2 ───────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "📦 Installing PM2..."
  npm install -g pm2
  pm2 startup systemd -u root --hp /root
fi

# ── FFmpeg ───────────────────────────────────────────────
if ! command -v ffmpeg &>/dev/null; then
  echo "📦 Installing FFmpeg..."
  apt-get update -qq && apt-get install -y -qq ffmpeg
else
  echo "✅ FFmpeg already installed"
fi

# ── Directories ───────────────────────────────────────────
mkdir -p "$RELEASES_DIR"
mkdir -p /var/www/flixon-releases

# ── Initial Clone ─────────────────────────────────────────
if [ ! -d "$SITE_DIR" ] || [ ! -L "$SITE_DIR" ]; then
  echo "📂 Cloning FlixOn repository..."
  INIT_RELEASE="$RELEASES_DIR/initial_$(date +%Y%m%d_%H%M%S)"
  git clone "$REPO" "$INIT_RELEASE"
  ln -sfn "$INIT_RELEASE" "$SITE_DIR"
  echo "✅ Cloned to $INIT_RELEASE, symlinked at $SITE_DIR"
else
  echo "✅ Site directory already exists at $SITE_DIR"
fi

# ── Env file ──────────────────────────────────────────────
SHARED_ENV="$RELEASES_DIR/.shared.env.local"
if [ ! -f "$SHARED_ENV" ]; then
  echo ""
  echo "⚠️  IMPORTANT: No .env.local found!"
  echo "   You must create: $SHARED_ENV"
  echo "   with your NEXT_PUBLIC_SUPABASE_URL, keys, etc."
  echo "   Then re-run the GitHub Actions deploy workflow."
fi
[ -f "$SHARED_ENV" ] && cp "$SHARED_ENV" "$SITE_DIR/.env.local"

# ── Build & Start ─────────────────────────────────────────
echo "📦 Installing dependencies..."
cd "$SITE_DIR"
npm ci --production=false 2>&1 | tail -5

echo "🔨 Building..."
npm run build

echo "🚀 Starting PM2 processes..."
pm2 describe flixon > /dev/null 2>&1 \
  && pm2 reload flixon \
  || pm2 start npm --name "flixon" -- start

pm2 describe flixon-compressor > /dev/null 2>&1 \
  && pm2 reload flixon-compressor \
  || pm2 start scripts/compressor.js --name "flixon-compressor" --time

pm2 save

echo ""
echo "======================================================"
echo "  ✅ FlixOn VPS initialisation complete!"
echo "  Active release: $(readlink -f $SITE_DIR)"
echo "  Processes:"
pm2 list
echo "======================================================"
