#!/bin/bash

# This script performs type checking without compilation
# It's useful for CI/CD pipelines and for checking for errors before committing

# Type check the project
echo "Type checking the project..."
tsc --noEmit --skipLibCheck

# Check for errors
if [ $? -eq 0 ]; then
  echo "Type checking successful!"
else
  echo "Type checking failed with errors."
  exit 1
fi
