#!/bin/bash

# Fix double .js.js extensions
find . -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | grep -v "dist" | xargs sed -i '' 's/\.js\.js/\.js/g'

# Fix missing .js extensions in import statements
find . -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | grep -v "dist" | while read -r file; do
  # This regex looks for import statements with relative paths that don't have a file extension
  sed -i '' -E "s/from ['\"](\.\.[^'\"]*|\.\/[^'\"]*)['\"]/from '\1.js'/g" "$file"
done

# Add explicit types to function parameters in workflow components
find ./packages/ui-components/src/features/workflow -type f -name "*.tsx" | grep -v "node_modules" | grep -v "dist" | while read -r file; do
  # Replace (step => with (step: WorkflowStep =>
  sed -i '' 's/(step =/(step: WorkflowStep =/g' "$file"
  # Replace (step, index) => with (step: WorkflowStep, index: number) =>
  sed -i '' 's/(step, index) =/(step: WorkflowStep, index: number) =/g' "$file"
  # Replace (e) => with (e: React.ChangeEvent<HTMLInputElement>) =>
  sed -i '' 's/(e) => handleStepChange/(e: React.ChangeEvent<HTMLInputElement>) => handleStepChange/g' "$file"
  # Replace (prev => with (prev: any) =>
  sed -i '' 's/(prev =/(prev: any) =/g' "$file"
  # Replace (current => with (current: any) =>
  sed -i '' 's/(current =/(current: any) =/g' "$file"
  # Replace (s => with (s: WorkflowStep) =>
  sed -i '' 's/(s =/(s: WorkflowStep) =/g' "$file"
  # Replace (parentId => with (parentId: string) =>
  sed -i '' 's/(parentId =/(parentId: string) =/g' "$file"
  # Replace (id => with (id: string) =>
  sed -i '' 's/(id =/(id: string) =/g' "$file"
  # Replace (cond => with (cond: WorkflowCondition) =>
  sed -i '' 's/(cond =/(cond: WorkflowCondition) =/g' "$file"
  # Replace (depId => with (depId: string) =>
  sed -i '' 's/(depId =/(depId: string) =/g' "$file"
  # Replace (open) => with (open: boolean) =>
  sed -i '' 's/(open) =/(open: boolean) =/g' "$file"
done

echo "Completed fixing import issues and adding type annotations"
