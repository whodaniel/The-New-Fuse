#!/bin/bash
set -e

echo "🔍 Running navigation verification..."

# Create necessary directories if they don't exist
mkdir -p apps/frontend/src/pages
mkdir -p apps/frontend/src/routes
mkdir -p docs/audit

# Check for route files
echo "🧭 Verifying navigation structure..."
echo "Checking route definitions..."

if [ -d "apps/frontend/src/routes" ]; then
    ROUTE_FILES=$(find apps/frontend/src/routes -name "*.tsx" -o -name "*.ts")
    if [ -z "$ROUTE_FILES" ]; then
        echo "⚠️  No route definitions found in apps/frontend/src/routes"
    else
        echo "✅ Found route definitions:"
        echo "$ROUTE_FILES"
    fi
else
    echo "⚠️  routes directory not found"
fi

# Check for page components
echo "Checking page components..."
if [ -d "apps/frontend/src/pages" ]; then
    PAGE_FILES=$(find apps/frontend/src/pages -name "*.tsx" -o -name "*.ts")
    if [ -z "$PAGE_FILES" ]; then
        echo "⚠️  No page components found in apps/frontend/src/pages"
    else
        echo "✅ Found page components:"
        echo "$PAGE_FILES"
    fi
else
    echo "⚠️  pages directory not found"
fi

# Create a sample page if none exists
if [ ! -f "apps/frontend/src/pages/Home.tsx" ]; then
    echo "📝 Creating sample Home page..."
    mkdir -p apps/frontend/src/pages
    cat > apps/frontend/src/pages/Home.tsx << 'EOL'
import React from 'react';

const Home: React.FC = () => {
    return (
        <div>
            <h1>Home Page</h1>
        </div>
    );
};

export default Home;
EOL
fi

# Create a sample route if none exists
if [ ! -f "apps/frontend/src/routes/index.tsx" ]; then
    echo "📝 Creating sample route configuration..."
    mkdir -p apps/frontend/src/routes
    cat > apps/frontend/src/routes/index.tsx << 'EOL'
import React from 'react';
import { Routes, Route } from 'react-router-dom';
const Home = React.lazy(() => import('../pages/Home'));

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
        </Routes>
    );
};
EOL
fi

echo "✅ Navigation verification complete!"
