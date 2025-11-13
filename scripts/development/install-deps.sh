#!/bin/bash

# Install required dev dependencies for testing and type definitions
yarn add --dev @types/jest @types/mocha @types/uuid @types/d3 @testing-library/jest-dom ts-jest

# Install runtime dependencies that are missing
yarn add d3 reactflow @prisma/extension-accelerate

echo "Dependencies installed successfully"
