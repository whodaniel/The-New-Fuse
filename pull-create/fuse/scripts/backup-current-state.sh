#!/bin/bash
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="../the-new-fuse-backup-$timestamp"

mkdir -p "$backup_dir"
cp -r ../* "$backup_dir"
echo "Backup created at $backup_dir"