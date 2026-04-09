#!/bin/bash

# This script fixes the React component issues in the frontend package

echo "🔧 Fixing React component issues..."

# Navigate to the frontend package
cd apps/frontend

# Fix ThemeProvider component
sed -i '' 's/export const ThemeProvider: React.FC = ({ children }) => {/export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {/g' src/contexts/ThemeContext.tsx

# Fix App component
sed -i '' 's/<ThemeProvider>/<ThemeProvider>/g' src/App.tsx

# Fix FC type issues
find src -name "*.tsx" -type f -exec sed -i '' 's/FC</React.FC</g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/: FC</: React.FC</g' {} \;

# Fix implicit any types
find src -name "*.tsx" -type f -exec sed -i '' 's/\(prev\) =>/\(prev: any\) =>/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/\(e\) =>/\(e: any\) =>/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' 's/\(color\) =>/\(color: any\) =>/g' {} \;

echo "✅ React component issues fixed"
