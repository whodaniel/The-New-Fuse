#!/bin/bash

# This script starts the WebSocket server for The New Fuse Chrome extension

echo "Starting WebSocket server for The New Fuse Chrome extension..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js first."
  exit 1
fi

# Check if the WebSocket server file exists
if [ ! -f "test-websocket-server-3710.cjs" ]; then
  echo "Error: WebSocket server file not found. Please make sure you're in the correct directory."
  exit 1
fi

# Check if port 3710 is already in use
if lsof -i :3710 &> /dev/null; then
  echo "Warning: Port 3710 is already in use."
  echo "This could be the VSCode extension's WebSocket server or another process."
  echo "Do you want to:"
  echo "1. Continue anyway (might fail if the port is in use)"
  echo "2. Kill the process using port 3710 and continue"
  echo "3. Exit"
  read -p "Enter your choice (1-3): " choice
  
  case $choice in
    1)
      echo "Continuing anyway..."
      ;;
    2)
      echo "Killing process using port 3710..."
      pid=$(lsof -t -i :3710)
      if [ -n "$pid" ]; then
        kill -9 $pid
        echo "Process killed."
      else
        echo "No process found using port 3710."
      fi
      ;;
    3)
      echo "Exiting."
      exit 0
      ;;
    *)
      echo "Invalid choice. Exiting."
      exit 1
      ;;
  esac
fi

# Start the WebSocket server
echo "Starting WebSocket server on port 3710..."
node test-websocket-server-3710.cjs
