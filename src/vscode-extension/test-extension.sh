#!/bin/bash

echo "🧪 Testing The New Fuse Extension..."

cd "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension"

echo "1️⃣ Checking dependencies..."
if npm list uuid > /dev/null 2>&1; then
    echo "✅ uuid dependency found"
else
    echo "❌ uuid dependency missing"
    exit 1
fi

echo "2️⃣ Compiling extension..."
pnpm run compile > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Extension compiles successfully"
else
    echo "❌ Compilation failed"
    exit 1
fi

echo "3️⃣ Checking compiled output..."
if [ -f "out/extension.js" ]; then
    echo "✅ Extension output exists"
else
    echo "❌ Extension output missing"
    exit 1
fi

echo "4️⃣ Running VSCode Extension Tests with @vscode/test-electron..."
npx vscode-test --extensionDevelopmentPath="$(pwd)" --extensionTestsPath="$(pwd)/out/test"

if [ $? -eq 0 ]; then
    echo "✅ VSCode extension tests passed!"
else
    echo "❌ VSCode extension tests failed!"
    exit 1
fi
