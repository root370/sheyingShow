#!/bin/bash

# Nginx & SSL Setup Script
# Usage: ./deploy_nginx.sh <SERVER_IP>

SERVER_IP=$1
SERVER_USER="root"
DOMAIN="latentspace.top"
CONFIG_FILE="deploy/nginx_ssl.conf"

if [ -z "$SERVER_IP" ]; then
    echo "Usage: ./deploy_nginx.sh <SERVER_IP>"
    exit 1
fi

echo "🚀 Starting Nginx setup on $SERVER_IP..."

# 1. Upload config file
echo "📤 Uploading Nginx config..."
scp -o StrictHostKeyChecking=no $CONFIG_FILE $SERVER_USER@$SERVER_IP:/tmp/$DOMAIN.conf

# 2. Configure Nginx & Certbot on Server
echo "⚙️  Configuring Nginx and SSL..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "bash -s" <<EOF
    # Update and Install Nginx & Certbot
    apt-get update
    apt-get install -y nginx certbot python3-certbot-nginx

    # Move config to Nginx directory
    mv /tmp/$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN

    # Enable site
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Test Nginx Config
    nginx -t
    
    # Reload Nginx to apply HTTP config first
    systemctl reload nginx
    echo "✅ Nginx HTTP configured."

    # Run Certbot to get SSL and auto-configure HTTPS
    echo "🔒 Obtaining SSL Certificate..."
    certbot --nginx --non-interactive --agree-tos -m admin@$DOMAIN -d $DOMAIN -d www.$DOMAIN --redirect

    echo "✅ SSL configured successfully!"
EOF

echo "🎉 Nginx deployment complete! Visit https://$DOMAIN"
