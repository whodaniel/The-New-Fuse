#!/bin/bash

# Start the development server if not already running
yarn dev &

# Wait for server to be ready
sleep 10

# Launch all pages in Chrome
open -a "Google Chrome" http://localhost:3000 # Main frontend
open -a "Google Chrome" http://localhost:3001 # API
open -a "Google Chrome" http://localhost:3002 # Backend
open -a "Google Chrome" http://localhost:3000/admin # Admin panel
open -a "Google Chrome" http://localhost:3000/docs # Documentation
