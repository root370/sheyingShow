#!/bin/bash

# Deployment Script for Tencent Cloud
# Usage: ./deploy_to_server.sh <SERVER_IP>

SERVER_IP=$1
SERVER_USER="root"
REMOTE_DIR="/var/www/sheyingShow"

if [ -z "$SERVER_IP" ]; then
    echo "Usage: ./deploy_to_server.sh <SERVER_IP>"
    echo "Example: ./deploy_to_server.sh 1.2.3.4"
    exit 1
fi

echo "🚀 Starting deployment to $SERVER_IP (Remote Build Mode)..."

# 1. Prepare for upload (Source only)
echo "📦 Packing source code..."
rm -f release.tar.gz
# Exclude .next, node_modules, .git to save bandwidth
# COPYFILE_DISABLE=1 prevents macOS from including ._ files
COPYFILE_DISABLE=1 tar --exclude='.next' --exclude='node_modules' --exclude='.git' -czf release.tar.gz .

# 2. Upload to server
echo "aaS  Uploading source to server..."
# Try to create directory with sudo if needed
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "sudo mkdir -p $REMOTE_DIR && sudo chown -R $SERVER_USER:$SERVER_USER $REMOTE_DIR"
scp -o StrictHostKeyChecking=no release.tar.gz $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# 3. Extract, Build and Start on server
echo "⚙️  Building and Starting on server..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && \
    echo '🗑️  Cleaning old files...' && \
    ls -la release.tar.gz && \
    # Backup .env if it exists, or ensure we don't delete it if it's not in the tar
    # (Assuming .env is in the tar for now based on previous scripts, but good to be careful. 
    #  Actually, previous script included .env in tar, so we are good overwriting.)
    rm -rf .next node_modules && \
    tar -xzf release.tar.gz && \
    echo '📦 Installing dependencies...' && \
    npm install && \
    echo '🏗️  Building project on server (this may take a while)...' && \
    npm run build && \
    npx prisma generate && \
    echo '🔄 Restarting PM2...' && \
    pm2 delete sheyingShow 2>/dev/null || true && \
    pm2 start npm --name 'sheyingShow' -- start && \
    pm2 save && \
    echo '⏳ Waiting for service to start...' && \
    sleep 5 && \
    pm2 list && \
    echo '🔍 Checking local connectivity...' && \
    curl -I http://localhost:3000 || echo 'Warning: Could not connect to localhost:3000'"

# 5. Cleanup
rm release.tar.gz

echo "✅ Deployment complete!"
