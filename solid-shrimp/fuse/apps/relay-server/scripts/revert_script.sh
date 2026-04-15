#!/bin/bash

# Change to the project directory
cd .

# Revert specific files to their last committed state
git checkout HEAD -- .env
git checkout HEAD -- .env.example
git checkout HEAD -- src/index.js
git checkout HEAD -- src/routes/auth.js
git checkout HEAD -- src/routes/ai.js
git checkout HEAD -- src/middleware/auth.js
git checkout HEAD -- package.json
git checkout HEAD -- frontend/package.json
git checkout HEAD -- Dockerfile
git checkout HEAD -- docker-compose.yml
git checkout HEAD -- drizzle/schema.drizzle

echo "Files have been reverted to their last committed versions."
