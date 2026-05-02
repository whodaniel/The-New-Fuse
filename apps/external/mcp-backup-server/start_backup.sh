#!/bin/bash
echo "Starting systematic progressive backup system $(date)"
echo "========================================================"

cd "$(dirname "$0")"

echo "1. Running DRY RUN validation first..."
python server.py --dry-run
echo ""

echo "2. Starting real incremental backup:"
python server.py

echo ""
echo "Backup finished at $(date)"
echo "Check backup_history.log for full details"
tail -20 backup_history.log
