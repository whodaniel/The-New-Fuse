#!/bin/bash
# Quick TNF Package Creator and Installer

echo "🚀 Creating complete TNF Relay package..."

# Run the package creator
node create-complete-tnf-package.js

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ Package created successfully!"
    echo ""
    echo "🔧 Would you like to install it now? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "📦 Installing TNF Relay package..."
        cd tnf-relay-package
        ./install.sh
        
        echo ""
        echo "🎉 Installation complete!"
        echo "🚀 You can now start the system with: npm start"
        echo "🌐 Dashboard will be available at: http://localhost:3002"
    else
        echo ""
        echo "📁 Package created at: $(pwd)/tnf-relay-package"
        echo "🔧 To install later: cd tnf-relay-package && ./install.sh"
    fi
else
    echo "❌ Package creation failed"
    exit 1
fi