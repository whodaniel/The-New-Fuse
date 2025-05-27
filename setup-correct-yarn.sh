#!/bin/bash
# Setup script for The New Fuse project
# Ensures consistent Yarn usage and proper dependency installation

# Set color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================================${NC}"
echo -e "${BLUE}                The New Fuse - Project Setup                         ${NC}"
echo -e "${BLUE}=====================================================================${NC}"

# Check Node.js version
NODE_VERSION=$(node --version)
echo -e "${YELLOW}Node.js version:${NC} $NODE_VERSION"

if [[ $NODE_VERSION < "v18" ]]; then
  echo -e "${RED}❌ Node.js version 18+ required. Please upgrade Node.js.${NC}"
  exit 1
fi

# Check if Corepack is available, install if needed
if ! command -v corepack &>/dev/null; then
  echo -e "${YELLOW}Installing Corepack...${NC}"
  npm install -g corepack
fi

# Enable Corepack
echo -e "${YELLOW}Enabling Corepack...${NC}"
corepack enable

# Prepare Yarn 4.9.1
echo -e "${YELLOW}Preparing Yarn 4.9.1...${NC}"
corepack prepare yarn@4.9.1 --activate

# Check if the local Yarn binary exists
if [ ! -f ".yarn/releases/yarn-4.9.1.cjs" ]; then
  echo -e "${YELLOW}Creating .yarn directory structure...${NC}"
  mkdir -p .yarn/releases
  
  # Get the Yarn path from Corepack
  YARN_PATH=$(which yarn)
  YARN_DIR=$(dirname "$YARN_PATH")
  
  # Try to find the Yarn 4.9.1 binary from Corepack
  if [ -f "$YARN_DIR/../lib/node_modules/corepack/dist/yarn-4.9.1.cjs" ]; then
    cp "$YARN_DIR/../lib/node_modules/corepack/dist/yarn-4.9.1.cjs" .yarn/releases/
  else
    # If not found, download directly
    echo -e "${YELLOW}Downloading Yarn 4.9.1...${NC}"
    curl -o .yarn/releases/yarn-4.9.1.cjs https://repo.yarnpkg.com/4.9.1/packages/yarnpkg-cli/bin/yarn.js
  fi
fi

# Update .yarnrc.yml
echo -e "${YELLOW}Updating .yarnrc.yml...${NC}"
cat > .yarnrc.yml << EOL
compressionLevel: mixed

enableGlobalCache: true

nmMode: hardlinks-local

nodeLinker: node-modules

packageExtensions:
  "@cerebras/cerebras_cloud_sdk@*":
    dependencies:
      reflect-metadata: "*"
  "@firebase/*@*":
    dependencies:
      "@firebase/app": "*"
      "@firebase/app-types": "*"
  "@nestjs/common@*":
    dependencies:
      reflect-metadata: "*"
      rxjs: "*"
  "@nestjs/core@*":
    dependencies:
      reflect-metadata: "*"
      rxjs: "*"
  "@nestjs/testing@*":
    dependencies:
      "@nestjs/common": "*"
      "@nestjs/core": "*"
      "@nestjs/platform-express": "*"
  "@nestjs/websockets@*":
    dependencies:
      "@nestjs/common": "*"
      "@nestjs/core": "*"
  "@testing-library/react@*":
    dependencies:
      "@testing-library/dom": "*"
  "@types/react@*":
    dependencies:
      react: "*"
  "@typescript-eslint/eslint-plugin@*":
    dependencies:
      eslint: "*"
  "@typescript-eslint/parser@*":
    dependencies:
      eslint: "*"
  eslint-plugin-jest@*:
    dependencies:
      typescript: "*"
  react-dom@*:
    dependencies:
      react: "*"

yarnPath: .yarn/releases/yarn-4.9.1.cjs
EOL

# Update package.json packageManager field
echo -e "${YELLOW}Updating package.json packageManager field...${NC}"
# This is a simplistic approach - in a real scenario, use a JSON parser
sed -i '' 's/"packageManager": "[^"]*"/"packageManager": "yarn@4.9.1"/g' package.json

# Clean installation
echo -e "${YELLOW}Cleaning previous installation...${NC}"
rm -rf node_modules .yarn/cache .yarn/build-state.yml .yarn/install-state.gz

# Install dependencies using local Yarn
echo -e "${YELLOW}Installing dependencies with Yarn 4.9.1...${NC}"
./.yarn/releases/yarn-4.9.1.cjs install

# Check if installation was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Project setup completed successfully!${NC}"
  echo -e "${GREEN}✅ Using Yarn version:${NC} $(./.yarn/releases/yarn-4.9.1.cjs --version)"
  echo -e "${YELLOW}Important: Always use './use-project-yarn.sh' instead of 'yarn' directly for consistent behavior.${NC}"
else
  echo -e "${RED}❌ Project setup failed. Please check the errors above.${NC}"
  exit 1
fi
