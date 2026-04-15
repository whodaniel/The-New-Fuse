#!/bin/bash

# Create a temporary file with environment variables
cat > env.yaml << EOL
env_variables:
  NODE_ENV: "production"
  PORT: "8080"
  DATABASE_URL: "$DATABASE_URL"
  REDIS_URL: "$REDIS_URL"
  FIREBASE_PROJECT_ID: "the-new-fuse-2025"
  FIREBASE_CLIENT_EMAIL: "$FIREBASE_CLIENT_EMAIL"
  FIREBASE_PRIVATE_KEY: "$FIREBASE_PRIVATE_KEY"
  JWT_SECRET: "$JWT_SECRET"
  GOOGLE_CLOUD_PROJECT: "the-new-fuse-2025"
  GCLOUD_STORAGE_BUCKET: "the-new-fuse-2025.appspot.com"
  GOOGLE_CLOUD_STORAGE_SERVICE_ACCOUNT: "service-241337102384@gs-project-accounts.iam.gserviceaccount.com"
EOL
