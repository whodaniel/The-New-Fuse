#!/bin/bash
set -e

echo "Starting targeted TypeScript error fixes..."

# Phase 1: Fix Core and Base Components (highest error count first)
fix_core_components() {
    echo "Fixing core components..."
    
    # CoreModule has 522 errors
    sed -i'' -e '
        s/: any/: unknown/g;
        s/function(/function <T>()/g;
        s/React.FC/FC<CoreModuleProps>/g;
    ' src/components/core/CoreModule.tsx
    
    # ThemeModule has 463 errors
    sed -i'' -e '
        s/: any/: ThemeType/g;
        s/React.FC/FC<ThemeProps>/g;
    ' src/components/theme/ThemeModule.tsx
    
    # APIModule has 459 errors
    sed -i'' -e '
        s/: any/: APIResponse/g;
        s/React.FC/FC<APIModuleProps>/g;
    ' src/components/features/api/APIModule.tsx
}

# Phase 2: Fix Feature Modules
fix_feature_modules() {
    echo "Fixing feature modules..."
    
    local modules=(
        "src/components/features/settings/SettingsModule.tsx"
        "src/components/features/data/DataModule.tsx"
        "src/components/features/agents/AgentModule.tsx"
        "src/components/features/auth/AuthenticationModule.tsx"
        "src/components/features/communication/CommunicationModule.tsx"
        "src/components/features/marketplace/MarketplaceModule.tsx"
        "src/components/features/workflow/WorkflowModule.tsx"
    )
    
    for module in "${modules[@]}"; do
        echo "Processing $module..."
        sed -i'' -e '
            s/: any/: unknown/g;
            s/React.FC/FC<ModuleProps>/g;
            s/useState(/useState<State>(/g;
            s/useEffect(/useEffect<Props>(/g;
        ' "$module"
    done
}

# Phase 3: Fix Chat Components
fix_chat_components() {
    echo "Fixing chat components..."
    
    local components=(
        "src/components/chat/ChatModule.tsx"
        "src/components/chat/RooCoderChat.tsx"
        "src/components/chat/ChatRoom.tsx"
    )
    
    for component in "${components[@]}"; do
        echo "Processing $component..."
        sed -i'' -e '
            s/: any/: ChatProps/g;
            s/React.FC/FC<ChatComponentProps>/g;
            s/useState(/useState<ChatState>(/g;
        ' "$component"
    done
}

# Phase 4: Fix UI Components
fix_ui_components() {
    echo "Fixing UI components..."
    
    local components=(
        "src/components/ui/UIModule.tsx"
        "src/components/ui/toast.tsx"
        "src/components/Card/Card.tsx"
    )
    
    for component in "${components[@]}"; do
        echo "Processing $component..."
        sed -i'' -e '
            s/: any/: UIProps/g;
            s/React.FC/FC<ComponentProps>/g;
            s/useState(/useState<UIState>(/g;
        ' "$component"
    done
}

# Create necessary type definitions
create_type_definitions() {
    echo "Creating type definitions..."
    
    mkdir -p src/types
    
    # Create index.d.ts with common types
    cat > src/types/index.d.ts << EOL
interface CoreModuleProps {
    config?: Record<string, unknown>;
    children?: React.ReactNode;
}

interface ThemeProps {
    mode?: 'light' | 'dark';
    colors?: Record<string, string>;
}

interface APIResponse<T = unknown> {
    data?: T;
    error?: string;
    status: number;
}

interface ChatProps {
    roomId: string;
    userId: string;
    messages: Message[];
}

interface UIProps {
    className?: string;
    style?: React.CSSProperties;
}
EOL
}

# Main execution
main() {
    echo "Starting TypeScript error fixes..."
    
    # Create type definitions first
    create_type_definitions
    
    # Fix components in order of error count
    fix_core_components
    fix_feature_modules
    fix_chat_components
    fix_ui_components
    
    # Run TypeScript check to verify fixes
    echo "Running TypeScript check..."
    if ! yarn tsc --noEmit; then
        echo "Some TypeScript errors remain. Check typescript-errors.log for details."
        yarn tsc --noEmit > typescript-errors.log 2>&1
    else
        echo "All TypeScript errors have been fixed!"
    fi
}

# Run the script
main