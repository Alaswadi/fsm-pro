#!/bin/bash

# Create Default Users via API
# This script creates the default admin and technician users using the API's register endpoint

echo "=========================================="
echo "Creating Default Users for FSM Pro"
echo "=========================================="
echo ""

API_URL="https://fsmpro.phishsimulator.com/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create Admin User
echo -e "${YELLOW}Step 1: Creating Admin User...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fsm.com",
    "password": "admin123",
    "full_name": "Admin User",
    "role": "admin"
  }')

if echo "$ADMIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Admin user created successfully${NC}"
    echo "   Email: admin@fsm.com"
    echo "   Password: admin123"
else
    if echo "$ADMIN_RESPONSE" | grep -q "already exists"; then
        echo -e "${YELLOW}⚠️  Admin user already exists${NC}"
    else
        echo -e "${RED}❌ Failed to create admin user${NC}"
        echo "Response: $ADMIN_RESPONSE"
    fi
fi
echo ""

# Step 2: Create Mobile Technician User
echo -e "${YELLOW}Step 2: Creating Mobile Technician User...${NC}"
TECH_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mobile.tech@fsm.com",
    "password": "mobile123",
    "full_name": "Mobile Technician",
    "phone": "+1-555-0101",
    "role": "technician"
  }')

if echo "$TECH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Mobile technician user created successfully${NC}"
    echo "   Email: mobile.tech@fsm.com"
    echo "   Password: mobile123"
else
    if echo "$TECH_RESPONSE" | grep -q "already exists"; then
        echo -e "${YELLOW}⚠️  Mobile technician user already exists${NC}"
    else
        echo -e "${RED}❌ Failed to create mobile technician user${NC}"
        echo "Response: $TECH_RESPONSE"
    fi
fi
echo ""

# Step 3: Test Login
echo -e "${YELLOW}Step 3: Testing Admin Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fsm.com",
    "password": "admin123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Admin login successful!${NC}"
else
    echo -e "${RED}❌ Admin login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi
echo ""

# Step 4: Test Mobile Tech Login
echo -e "${YELLOW}Step 4: Testing Mobile Tech Login...${NC}"
MOBILE_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mobile.tech@fsm.com",
    "password": "mobile123"
  }')

if echo "$MOBILE_LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Mobile tech login successful!${NC}"
else
    echo -e "${RED}❌ Mobile tech login failed${NC}"
    echo "Response: $MOBILE_LOGIN_RESPONSE"
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Default Login Credentials:"
echo ""
echo "Admin Account:"
echo "  URL: https://fsmpro.phishsimulator.com/"
echo "  Email: admin@fsm.com"
echo "  Password: admin123"
echo ""
echo "Mobile Technician Account:"
echo "  Email: mobile.tech@fsm.com"
echo "  Password: mobile123"
echo ""
echo "⚠️  IMPORTANT: Change these passwords after first login!"
echo ""
echo "Next Steps:"
echo "1. Login to admin app: https://fsmpro.phishsimulator.com/"
echo "2. Test mobile app with Expo Go"
echo "3. Change default passwords in Settings"
echo ""
echo "=========================================="

