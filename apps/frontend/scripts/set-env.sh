#!/bin/bash

# Get the Cloud Run service URL
BACKEND_URL=$(gcloud run services describe api --platform managed --region us-central1 --format 'value(status.url)')

# Create the environment file
# IMPORTANT: Set these values from your secure environment variables or secrets manager
cat > .env.production << EOL
VITE_API_URL=$BACKEND_URL
VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
EOL

echo "✅ Environment file created at .env.production"
echo "⚠️  Make sure Firebase environment variables are set before running this script"
