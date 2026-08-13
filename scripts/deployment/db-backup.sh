#!/bin/bash

###############################################################################
# The New Fuse - Database Backup Script
# Creates timestamped database backups with compression and retention
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/database}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
DEPLOYMENT_ID="${1:-backup-$(date +%Y%m%d-%H%M%S)}"
COMPRESS_BACKUP="${COMPRESS_BACKUP:-true}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
RETENTION_COUNT="${RETENTION_COUNT:-10}"

log() {
  local level=$1
  shift
  local message="$*"

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" ;;
    SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
    WARNING) echo -e "${YELLOW}[WARNING]${NC} $message" ;;
    ERROR)   echo -e "${RED}[ERROR]${NC} $message" ;;
    *)       echo "$message" ;;
  esac
}

backup_database() {
  mkdir -p "$BACKUP_DIR"

  local backup_file="$BACKUP_DIR/backup-$DEPLOYMENT_ID.sql"
  local backup_metadata="$BACKUP_DIR/backup-$DEPLOYMENT_ID.json"

  log INFO "Creating database backup..."
  log INFO "Backup ID: $DEPLOYMENT_ID"

  if [[ -z "${DATABASE_URL:-}" ]]; then
    log ERROR "DATABASE_URL not set"
    return 1
  fi

  # Extract database type
  local db_type=$(echo "$DATABASE_URL" | cut -d: -f1)

  log INFO "Database type: $db_type"

  case "$db_type" in
    postgresql|postgres)
      if command -v pg_dump &>/dev/null; then
        pg_dump "$DATABASE_URL" > "$backup_file" || {
          log ERROR "pg_dump failed"
          return 1
        }
      else
        log ERROR "pg_dump not found"
        return 1
      fi
      ;;

    mysql)
      if command -v mysqldump &>/dev/null; then
        # Extract connection details
        log WARNING "MySQL backup not fully implemented"
        return 1
      else
        log ERROR "mysqldump not found"
        return 1
      fi
      ;;

    sqlite)
      local db_file=$(echo "$DATABASE_URL" | sed 's/sqlite://' | sed 's/file://')
      if [[ -f "$db_file" ]]; then
        cp "$db_file" "$backup_file"
      else
        log ERROR "SQLite file not found: $db_file"
        return 1
      fi
      ;;

    *)
      log ERROR "Unknown database type: $db_type"
      return 1
      ;;
  esac

  # Compress if enabled
  if [[ "$COMPRESS_BACKUP" == "true" ]]; then
    log INFO "Compressing backup..."
    gzip "$backup_file"
    backup_file="${backup_file}.gz"
  fi

  # Get backup size
  local backup_size=$(du -h "$backup_file" | cut -f1)

  # Create metadata
  cat > "$backup_metadata" <<EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "timestamp": "$(date -Iseconds)",
  "database_type": "$db_type",
  "backup_file": "$backup_file",
  "backup_size": "$backup_size",
  "compressed": $COMPRESS_BACKUP
}
EOF

  log SUCCESS "Backup created: $backup_file"
  log INFO "Backup size: $backup_size"

  # Cleanup old backups
  cleanup_old_backups

  return 0
}

cleanup_old_backups() {
  log INFO "Cleaning up old backups..."

  # Remove backups older than retention days
  find "$BACKUP_DIR" -name "backup-*.sql*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
  find "$BACKUP_DIR" -name "backup-*.json" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

  # Keep only last N backups
  local backup_count=$(ls -1 "$BACKUP_DIR"/backup-*.sql* 2>/dev/null | wc -l)

  if [[ $backup_count -gt $RETENTION_COUNT ]]; then
    log INFO "Keeping last $RETENTION_COUNT backups"
    ls -t "$BACKUP_DIR"/backup-*.sql* | tail -n +$((RETENTION_COUNT + 1)) | xargs rm -f
    ls -t "$BACKUP_DIR"/backup-*.json | tail -n +$((RETENTION_COUNT + 1)) | xargs rm -f 2>/dev/null || true
  fi

  log SUCCESS "Cleanup completed"
}

main() {
  log INFO "Database Backup System"
  backup_database || exit 1
  log SUCCESS "Backup completed successfully"
}

main

exit 0
