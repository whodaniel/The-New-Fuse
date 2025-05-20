#!/bin/bash

# Get the Cloud Run service URL
BACKEND_URL=$(gcloud run services describe api --platform managed --region us-central1 --format 'value(status.url)')

# Create the environment file
cat > .env.production << EOL
VITE_API_URL=$BACKEND_URL
VITE_FIREBASE_API_KEY=REDACTED-FIREBASE-KEY-1
VITE_FIREBASE_AUTH_DOMAIN=the-new-fuse-2025.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=the-new-fuse-2025
VITE_FIREBASE_STORAGE_BUCKET=the-new-fuse-2025.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1003514421915
VITE_FIREBASE_APP_ID=1:1003514421915:web:9f5b9f9f9f9f9f9f9f9f9f
EOL
