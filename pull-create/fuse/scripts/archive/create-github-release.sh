#!/bin/bash

# This script creates a new GitHub release and uploads the packaged zip files.

# Set the tag name to the current date and time
TAG_NAME="release-$(date +'%Y-%m-%d-%H-%M-%S')"

# Create a new git tag
git tag "$TAG_NAME"

# Push the tag to the remote repository
git push origin "$TAG_NAME"

# Create a new GitHub release
gh release create "$TAG_NAME" --title "$TAG_NAME" --notes "Automated release of packages."

# Upload the packaged files to the release
for file in github-packages/*.zip; do
  echo "Uploading $file..."
  gh release upload "$TAG_NAME" "$file"
done

echo "GitHub release created and all packages have been uploaded."
