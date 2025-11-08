#!/bin/bash

echo "============================================================================"
echo "Verifying Database is Empty (No Default Users/Companies)"
echo "============================================================================"
echo ""

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

echo "Checking users table..."
USER_COUNT=$(docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d '[:space:]')

echo "Checking companies table..."
COMPANY_COUNT=$(docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null | tr -d '[:space:]')

echo ""
echo "============================================================================"
echo "Results:"
echo "============================================================================"
echo "Users in database: $USER_COUNT"
echo "Companies in database: $COMPANY_COUNT"
echo ""

if [ "$USER_COUNT" = "0" ] && [ "$COMPANY_COUNT" = "0" ]; then
    echo "✅ SUCCESS: Database is empty! Setup wizard is required."
    echo ""
    echo "Next steps:"
    echo "1. Visit https://fsmpro.phishsimulator.com"
    echo "2. You should be redirected to /setup"
    echo "3. Complete the setup wizard to create your first admin user and company"
    exit 0
else
    echo "❌ WARNING: Database contains data!"
    echo ""
    echo "This means:"
    echo "- Default users/companies were inserted (should not happen)"
    echo "- OR setup wizard was already completed"
    echo ""
    echo "To reset and test fresh installation:"
    echo "docker-compose -f docker-compose.coolify.yml down"
    echo "docker volume rm fsm-pro-copy_postgres_data"
    echo "docker-compose -f docker-compose.coolify.yml up -d"
    exit 1
fi

