#!/bin/bash

# Check if port 3711 is already in use
if lsof -i :3711 &> /dev/null; then
  echo "Warning: Port 3711 is already in use."
  echo "This could be another process using this port."
  echo "Do you want to:"
  echo "1. Continue anyway (might fail if the port is in use)"
  echo "2. Kill the process using port 3711 and continue"
  echo "3. Exit"
  read -p "Enter your choice (1-3): " choice
  
  case $choice in
    1)
      echo "Continuing anyway..."
      ;;
    2)
      echo "Killing process using port 3711..."
      pid=$(lsof -t -i :3711)
      if [ -n "$pid" ]; then
        kill -9 $pid
        echo "Process killed."
      else
        echo "No process found using port 3711."
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
echo "Starting WebSocket server on port 3711..."
node test-websocket-server-3711.cjs
