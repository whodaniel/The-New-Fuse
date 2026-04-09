#!/bin/bash

# Wait for services to be ready
sleep 10

# Open all pages in default browser
# Using open on macOS or xdg-open on Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000  # Frontend
    open http://localhost:3001  # API
    open http://localhost:3002  # Backend
    open http://localhost:3003/health-dashboard  # Health Dashboard
else
    xdg-open http://localhost:3000
    xdg-open http://localhost:3001
    xdg-open http://localhost:3002
    xdg-open http://localhost:3003/health-dashboard
fi