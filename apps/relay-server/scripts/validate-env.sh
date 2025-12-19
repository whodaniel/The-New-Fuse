#!/bin/bash

# Color codes for output
GREEN='[0;32m'
RED='[0;31m'
YELLOW='[1;33m'
NC='[0m' # No Color

echo "Starting environment variable validation..."

# --- Configuration ---
# Add paths to your .env files or .env.example files here
# We check for .env.example to avoid issues with gitignored .env files in CI/CD
REQUIRED_ENV_FILES=(
  ".env.example"
  ".env.development.example"
  ".env.production.example"
  "apps/api/.env.example"
  "apps/backend/.env.example"
  "apps/frontend/.env.example"
)

# Define critical variables for each file.
# Format: "FILE_PATH:VAR1,VAR2,VAR3"
# Example: ".env.example:DATABASE_URL,API_KEY"
CRITICAL_VARS_CONFIG=(
  ".env.example:APP_ENV,PORT"
  ".env.development.example:DATABASE_URL,JWT_SECRET,SENTRY_DSN"
  ".env.production.example:DATABASE_URL,JWT_SECRET,SENTRY_DSN"
  "apps/api/.env.example:API_PORT,DATABASE_URL,JWT_SECRET,REDIS_URL"
  "apps/backend/.env.example:DATABASE_URL,JWT_SECRET,REDIS_HOST,REDIS_PORT"
  "apps/frontend/.env.example:VITE_API_URL,VITE_APP_TITLE"
)

# --- Script Logic ---
all_checks_passed=true

echo -e "
${YELLOW}Checking for required .env files...${NC}"
for file_path in "${REQUIRED_ENV_FILES[@]}"; do
  if [ -f "$file_path" ]; then
    echo -e "${GREEN}Found: $file_path${NC}"
  else
    echo -e "${RED}Missing: $file_path${NC}"
    all_checks_passed=false
  fi
done

echo -e "
${YELLOW}Checking for critical variables in existing .env.example files...${NC}"
for config_item in "${CRITICAL_VARS_CONFIG[@]}"; do
  IFS=':' read -r file_path vars_string <<< "$config_item"
  IFS=',' read -r -a vars_array <<< "$vars_string"

  if [ -f "$file_path" ]; then
    echo "Checking variables in: $file_path"
    for var_name in "${vars_array[@]}"; do
      # Strip potential leading/trailing whitespace from var_name
      clean_var_name=$(echo "$var_name" | xargs)
      if grep -q "^\s*${clean_var_name}\s*=" "$file_path"; then
        echo -e "  ${GREEN}Found variable: $clean_var_name${NC}"
      else
        echo -e "  ${RED}Missing variable: $clean_var_name${NC}"
        all_checks_passed=false
      fi
    done
  else
    # This case should ideally be caught by the previous check, but good for robustness
    echo -e "${YELLOW}Skipping variable check for missing file: $file_path${NC}"
  fi
done

echo ""
if [ "$all_checks_passed" = true ]; then
  echo -e "${GREEN}All environment checks passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}Some environment checks failed. Please review the messages above.${NC}"
  exit 1
fi
