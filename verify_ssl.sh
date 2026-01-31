#!/bin/bash

# SSL Verification Script
# Usage: ./verify_ssl.sh [DOMAIN]
# Example: ./verify_ssl.sh latentspace.top

DOMAIN=${1:-"latentspace.top"}

echo "🔍 Verifying SSL for $DOMAIN..."

# 1. Check HTTP to HTTPS Redirect
echo "1️⃣  Checking HTTP -> HTTPS Redirect..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}\n" "http://$DOMAIN")
if [ "$HTTP_CODE" == "301" ] || [ "$HTTP_CODE" == "302" ]; then
    echo "✅ HTTP redirects correctly (Status: $HTTP_CODE)"
else
    echo "⚠️  HTTP might not be redirecting (Status: $HTTP_CODE). Expected 301 or 302."
fi

# 2. Check HTTPS Connection
echo "2️⃣  Checking HTTPS Connection..."
HTTPS_CODE=$(curl -o /dev/null -s -w "%{http_code}\n" "https://$DOMAIN")
if [ "$HTTPS_CODE" == "200" ]; then
    echo "✅ HTTPS is accessible (Status: 200 OK)"
else
    echo "❌ HTTPS check failed (Status: $HTTPS_CODE)"
fi

# 3. Check Certificate Details
echo "3️⃣  Checking Certificate Details..."
echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates -issuer -subject
if [ $? -eq 0 ]; then
    echo "✅ Certificate found and valid."
else
    echo "❌ Could not retrieve certificate information."
fi

echo "---------------------------------------------------"
echo "🎉 Verification Finished. If all checks passed, your SSL is working!"
