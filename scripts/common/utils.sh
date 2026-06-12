#!/bin/bash

# Utility functions

# Check if a command is installed
check_command_installed() {
  local command_name=$1
  if ! command -v "$command_name" &> /dev/null; then
    log_error "Command '$command_name' is not installed. Please install it to proceed."
    exit 1
  fi
  log_info "'$command_name' is installed."
}
