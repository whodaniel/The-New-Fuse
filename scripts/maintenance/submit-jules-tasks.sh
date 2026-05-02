#!/bin/bash

# Script to submit all Jules tasks from .jules/tasks/ directory
# This will create parallel Jules sessions for each task

TASKS_DIR=".jules/tasks"
REPO="whodaniel/fuse"

echo "🚀 Submitting Jules tasks from ${TASKS_DIR}..."
echo ""

# Counter for tracking submissions
count=0

# Loop through all task files (excluding README.md)
for task_file in "${TASKS_DIR}"/JULES_TASK_*.md; do
  if [ -f "$task_file" ]; then
    task_name=$(basename "$task_file" .md)
    echo "📝 Submitting: $task_name"

    # Read the entire task file content
    task_content=$(cat "$task_file")

    # Submit to Jules using the new command
    jules new --repo "$REPO" "$task_content"

    # Check if submission was successful
    if [ $? -eq 0 ]; then
      echo "✅ Successfully submitted: $task_name"
      ((count++))
    else
      echo "❌ Failed to submit: $task_name"
    fi

    echo ""

    # Small delay to avoid overwhelming the API
    sleep 1
  fi
done

echo ""
echo "🎉 Completed! Submitted $count tasks to Jules."
echo ""
echo "To check status, run: jules remote list --session"
