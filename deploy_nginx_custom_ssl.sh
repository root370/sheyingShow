#!/bin/bash

# Nginx Setup Script (Use Existing SSL)
# Usage: ./deploy_nginx_custom_ssl.sh <SERVER_IP> <LOCAL_CERT_PATH> <LOCAL_KEY_PATH>
# Example: ./deploy_nginx_custom_ssl.sh 1.2.3.4 ./latentspace.top.pem ./latentspace.top.key

SERVER_IP=$1
CERT_PATH=$2
KEY_PATH=$3
SERVER_USER="root"
DOMAIN="latentspace.top"
CONFIG_FILE="deploy/nginx_ssl.conf"

if [ -z "$SERVER_IP" ] || [ -z "$CERT_PATH" ] || [ -z "$KEY_PATH" ]; then
    echo "Usage: ./deploy_nginx_custom_ssl.sh <SERVER_IP> <LOCAL_CERT_PATH> <LOCAL_KEY_PATH>"
    echo "Example: ./deploy_nginx_custom_ssl.sh 1.2.3.4 ./cert.pem ./cert.key"
    exit 1
fi

echo "🚀 Starting Nginx setup with CUSTOM SSL on $SERVER_IP..."

# 1. Create cert directory on server
echo "📂 Creating certificate directory..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "mkdir -p /etc/nginx/cert"

# 2. Upload certificates
echo "📤 Uploading certificates..."
scp -o StrictHostKeyChecking=no $CERT_PATH $SERVER_USER@$SERVER_IP:/etc/nginx/cert/$DOMAIN.pem
scp -o StrictHostKeyChecking=no $KEY_PATH $SERVER_USER@$SERVER_IP:/etc/nginx/cert/$DOMAIN.key

# 3. Upload config file
echo "📤 Uploading Nginx config..."
scp -o StrictHostKeyChecking=no $CONFIG_FILE $SERVER_USER@$SERVER_IP:/tmp/$DOMAIN.conf

# 4. Configure Nginx
echo "⚙️  Configuring Nginx..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "bash -s" <<EOF
    # Install Nginx (if not installed)
    apt-get update && apt-get install -y nginx

    # Move config to Nginx directory
    mv /tmp/$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN

    # Enable site
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Test Nginx Config
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx || systemctl start nginx
    echo "✅ Nginx reloaded with SSL configuration."
EOF

echo "🎉 Nginx setup complete! Visit https://$DOMAIN"
