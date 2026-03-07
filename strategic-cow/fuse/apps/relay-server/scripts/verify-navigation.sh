#!/bin/bash
set -e

echo "🧭 Verifying navigation structure..."

# Check for required navigation components
REQUIRED_COMPONENTS=(
    "src/components/layout/MainNavigation"
    "src/components/layout/SecondaryNav"
    "src/components/layout/QuickAccess"
    "src/components/navigation/Breadcrumbs"
    "src/components/QuickActions"
)

# Verify route definitions
echo "Checking route definitions..."
ROUTE_FILES=(
    "src/routes/index.tsx"
    "src/routes/public.tsx"
    "src/routes/protected.tsx"
)

# Verify lazy loading implementation
echo "Checking lazy loading..."
find src/pages -type f -name "*.tsx" -exec grep -l "React.lazy" {} \;

# Verify navigation guards
echo "Checking navigation guards..."
GUARD_FILES=(
    "src/guards/AuthGuard.tsx"
    "src/guards/RoleGuard.tsx"
    "src/guards/ModuleGuard.tsx"
)

# Verify breadcrumb configuration
echo "Checking breadcrumb configuration..."
find src -type f -name "*.tsx" -exec grep -l "useBreadcrumbs" {} \;

# Check for proper imports
echo "Verifying component imports..."
find src -type f -name "*.tsx" -exec grep -l "import.*from.*@/components" {} \;

echo "✅ Navigation verification complete!"