#!/bin/bash

# Get the Cloud Run service URL
BACKEND_URL=$(gcloud run services describe api --platform managed --region us-central1 --format 'value(status.url)')

# Create the environment file
# IMPORTANT: Set these values from your secure environment variables or secrets manager
cat > .env.production << EOL
VITE_API_URL=$BACKEND_URL
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
EOL

echo "✅ Environment file created at .env.production"
echo "⚠️  Make sure Supabase environment variables are set before running this script"
