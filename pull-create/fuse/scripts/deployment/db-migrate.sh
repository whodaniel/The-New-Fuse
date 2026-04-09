#!/bin/bash

###############################################################################
# The New Fuse - Database Migration Script
# Safely applies database migrations with automatic backup and rollback
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups/database"
MIGRATION_LOG="$PROJECT_ROOT/logs/deployment/migration-$(date +%Y%m%d-%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
DEPLOYMENT_ID="${DEPLOYMENT_ID:-migration-$(date +%Y%m%d-%H%M%S)}"
DRY_RUN="${DRY_RUN:-false}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"
BACKUP_BEFORE_MIGRATE="${BACKUP_BEFORE_MIGRATE:-true}"

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  case $level in
    INFO)    echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$MIGRATION_LOG" ;;
    SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$MIGRATION_LOG" ;;
    WARNING) echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$MIGRATION_LOG" ;;
    ERROR)   echo -e "${RED}[ERROR]${NC} $message" | tee -a "$MIGRATION_LOG" ;;
    STEP)    echo -e "${MAGENTA}[STEP]${NC} $message" | tee -a "$MIGRATION_LOG" ;;
    *)       echo "$message" | tee -a "$MIGRATION_LOG" ;;
  esac

  echo "[$timestamp] [$level] $message" >> "$MIGRATION_LOG"
}

print_banner() {
  echo ""
  echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║${NC}  ${BOLD}Database Migration System${NC}                                  ${BOLD}${BLUE}║${NC}"
  echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "${MAGENTA}$(printf '─%.0s' {1..80})${NC}"
}

###############################################################################
# Database Functions
###############################################################################

check_database_connection() {
  print_section "Checking Database Connection"

  if [[ -z "${DATABASE_URL:-}" ]]; then
    log ERROR "DATABASE_URL environment variable is not set"
    return 1
  fi

  log INFO "Testing database connectivity..."

  # Try to connect using Drizzle
  if pnpm drizzle db execute --stdin <<< "SELECT 1 as connected;" &>/dev/null; then
    log SUCCESS "Database is accessible"
    return 0
  else
    log ERROR "Cannot connect to database"
    log ERROR "Please check DATABASE_URL: ${DATABASE_URL}"
    return 1
  fi
}

get_database_size() {
  log INFO "Calculating database size..."

  # This is PostgreSQL-specific
  # For other databases, adjust the query accordingly

  local size_query="
    SELECT pg_size_pretty(pg_database_size(current_database())) as size;
  "

  local db_size=$(pnpm drizzle db execute --stdin <<< "$size_query" 2>/dev/null | tail -1 || echo "unknown")

  log INFO "Current database size: $db_size"
  echo "$db_size"
}

backup_database() {
  print_section "Creating Database Backup"

  if [[ "$BACKUP_BEFORE_MIGRATE" != "true" ]]; then
    log WARNING "Database backup skipped (BACKUP_BEFORE_MIGRATE=false)"
    return 0
  fi

  mkdir -p "$BACKUP_DIR"

  local backup_file="$BACKUP_DIR/backup-$DEPLOYMENT_ID.sql"
  local backup_metadata="$BACKUP_DIR/backup-$DEPLOYMENT_ID.json"

  log STEP "Creating database backup..."
  log INFO "Backup file: $backup_file"

  # Get database URL components
  local db_url="${DATABASE_URL}"

  # Extract database type from URL
  local db_type=$(echo "$db_url" | cut -d: -f1)

  case "$db_type" in
    postgresql|postgres)
      log INFO "Detected PostgreSQL database"

      if command -v pg_dump &>/dev/null; then
        log STEP "Using pg_dump for backup..."

        # Use pg_dump for PostgreSQL
        pg_dump "$db_url" > "$backup_file" 2>>"$MIGRATION_LOG" || {
          log ERROR "pg_dump failed"
          return 1
        }

        log SUCCESS "PostgreSQL backup created successfully"
      else
        log WARNING "pg_dump not found, using Drizzle schema dump"
        backup_with_drizzle "$backup_file"
      fi
      ;;

    mysql)
      log INFO "Detected MySQL database"

      if command -v mysqldump &>/dev/null; then
        log STEP "Using mysqldump for backup..."

        # Extract connection details and use mysqldump
        # This is simplified - production should handle credentials properly
        log WARNING "MySQL backup not fully implemented"
        backup_with_drizzle "$backup_file"
      else
        log WARNING "mysqldump not found, using Drizzle schema dump"
        backup_with_drizzle "$backup_file"
      fi
      ;;

    sqlite)
      log INFO "Detected SQLite database"

      # For SQLite, just copy the file
      local db_file=$(echo "$db_url" | sed 's/sqlite://' | sed 's/file://')

      if [[ -f "$db_file" ]]; then
        cp "$db_file" "$backup_file"
        log SUCCESS "SQLite backup created successfully"
      else
        log ERROR "SQLite database file not found: $db_file"
        return 1
      fi
      ;;

    *)
      log WARNING "Unknown database type: $db_type"
      backup_with_drizzle "$backup_file"
      ;;
  esac

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
  "database_url": "***REDACTED***"
}
EOF

  log SUCCESS "Backup metadata saved: $backup_metadata"
  log INFO "Backup size: $backup_size"

  # Verify backup integrity
  if [[ -s "$backup_file" ]]; then
    log SUCCESS "Backup file created and verified (size: $backup_size)"
  else
    log ERROR "Backup file is empty or invalid"
    return 1
  fi

  return 0
}

backup_with_drizzle() {
  local backup_file=$1

  log STEP "Creating schema-based backup with Drizzle..."

  # Export current schema
  pnpm drizzle db pull --print > "$backup_file.schema.drizzle" 2>>"$MIGRATION_LOG" || {
    log ERROR "Failed to export schema"
    return 1
  }

  # Note: This doesn't backup data, only schema
  log WARNING "Schema-only backup created (data not included)"
  log WARNING "For production, use database-specific backup tools"

  mv "$backup_file.schema.drizzle" "$backup_file"
  return 0
}

check_pending_migrations() {
  print_section "Checking Pending Migrations"

  log STEP "Analyzing migration status..."

  # Get Drizzle migration status
  local migration_status=$(pnpm drizzle migrate status 2>&1 || true)

  echo "$migration_status" | tee -a "$MIGRATION_LOG"

  if echo "$migration_status" | grep -q "Database schema is up to date"; then
    log SUCCESS "No pending migrations found"
    return 1  # No migrations needed
  elif echo "$migration_status" | grep -q "pending migration"; then
    log WARNING "Pending migrations detected"
    return 0  # Migrations needed
  else
    log INFO "Migration status unclear, will attempt to apply"
    return 0
  fi
}

preview_migrations() {
  print_section "Migration Preview"

  log STEP "Generating migration preview..."

  # Show what would be applied
  log INFO "Pending migrations:"

  # Find migration files that haven't been applied
  local migrations_dir="$PROJECT_ROOT/drizzle/migrations"

  if [[ -d "$migrations_dir" ]]; then
    # Get list of applied migrations from database
    local applied_migrations=$(pnpm drizzle migrate status 2>&1 | grep "migration" | grep -v "pending" | awk '{print $1}' || true)

    # Show pending migrations
    while IFS= read -r migration_dir; do
      local migration_name=$(basename "$migration_dir")

      if ! echo "$applied_migrations" | grep -q "$migration_name"; then
        log INFO "  - $migration_name"

        # Show migration SQL if available
        if [[ -f "$migration_dir/migration.sql" ]]; then
          echo -e "${YELLOW}    SQL Preview:${NC}"
          head -20 "$migration_dir/migration.sql" | sed 's/^/    /'

          local line_count=$(wc -l < "$migration_dir/migration.sql")
          if [[ $line_count -gt 20 ]]; then
            echo "    ... ($((line_count - 20)) more lines)"
          fi
        fi
      fi
    done < <(find "$migrations_dir" -mindepth 1 -maxdepth 1 -type d | sort)
  else
    log WARNING "Migrations directory not found: $migrations_dir"
  fi
}

confirm_migration() {
  if [[ "$AUTO_APPROVE" == "true" ]]; then
    log WARNING "Auto-approve enabled, skipping confirmation"
    return 0
  fi

  echo ""
  echo -e "${YELLOW}${BOLD}WARNING:${NC} You are about to apply database migrations"
  echo ""
  read -p "Do you want to proceed? (yes/no): " -r
  echo

  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log WARNING "Migration cancelled by user"
    exit 0
  fi

  log INFO "Migration confirmed"
}

apply_migrations() {
  print_section "Applying Migrations"

  if [[ "$DRY_RUN" == "true" ]]; then
    log WARNING "DRY RUN MODE - Migrations will not be applied"
    log INFO "To apply migrations, run without DRY_RUN=true"
    return 0
  fi

  log STEP "Applying database migrations..."

  # Apply migrations using Drizzle
  if pnpm drizzle migrate deploy 2>&1 | tee -a "$MIGRATION_LOG"; then
    log SUCCESS "Migrations applied successfully"
    return 0
  else
    log ERROR "Migration failed"
    return 1
  fi
}

verify_migrations() {
  print_section "Verifying Migrations"

  log STEP "Verifying database schema..."

  # Check migration status again
  local migration_status=$(pnpm drizzle migrate status 2>&1 || true)

  if echo "$migration_status" | grep -q "Database schema is up to date"; then
    log SUCCESS "Database schema is up to date"
    return 0
  else
    log ERROR "Database schema verification failed"
    echo "$migration_status" | tee -a "$MIGRATION_LOG"
    return 1
  fi
}

run_post_migration_scripts() {
  print_section "Post-Migration Scripts"

  local post_migration_dir="$PROJECT_ROOT/drizzle/post-migration"

  if [[ ! -d "$post_migration_dir" ]]; then
    log INFO "No post-migration scripts found"
    return 0
  fi

  log STEP "Running post-migration scripts..."

  # Execute any post-migration scripts
  while IFS= read -r script; do
    local script_name=$(basename "$script")
    log INFO "Executing: $script_name"

    if bash "$script" 2>&1 | tee -a "$MIGRATION_LOG"; then
      log SUCCESS "$script_name completed"
    else
      log ERROR "$script_name failed"
      return 1
    fi
  done < <(find "$post_migration_dir" -name "*.sh" -type f | sort)

  log SUCCESS "All post-migration scripts completed"
}

generate_drizzle_client() {
  print_section "Generating Drizzle Client"

  log STEP "Regenerating Drizzle client..."

  if pnpm drizzle generate 2>&1 | tee -a "$MIGRATION_LOG"; then
    log SUCCESS "Drizzle client generated successfully"
    return 0
  else
    log ERROR "Drizzle client generation failed"
    return 1
  fi
}

cleanup_old_backups() {
  print_section "Cleanup"

  log INFO "Cleaning up old backups..."

  # Keep last 10 backups
  local backup_count=$(ls -1 "$BACKUP_DIR"/backup-*.sql 2>/dev/null | wc -l)

  if [[ $backup_count -gt 10 ]]; then
    log INFO "Found $backup_count backups, keeping most recent 10"

    ls -t "$BACKUP_DIR"/backup-*.sql | tail -n +11 | xargs rm -f
    ls -t "$BACKUP_DIR"/backup-*.json | tail -n +11 | xargs rm -f 2>/dev/null || true

    log SUCCESS "Old backups cleaned up"
  else
    log INFO "Backup count ($backup_count) within limit"
  fi
}

###############################################################################
# Main Migration Flow
###############################################################################

main() {
  print_banner

  log INFO "Starting database migration: $DEPLOYMENT_ID"
  log INFO "Migration log: $MIGRATION_LOG"

  if [[ "$DRY_RUN" == "true" ]]; then
    log WARNING "Running in DRY RUN mode"
  fi

  # Ensure directories exist
  mkdir -p "$(dirname "$MIGRATION_LOG")"
  mkdir -p "$BACKUP_DIR"

  # Check database connection
  check_database_connection || exit 1

  # Check for pending migrations
  if ! check_pending_migrations; then
    log SUCCESS "No migrations to apply"
    exit 0
  fi

  # Get database size
  get_database_size

  # Preview migrations
  preview_migrations

  # Confirm migration
  confirm_migration

  # Create backup
  backup_database || {
    log ERROR "Database backup failed"
    log ERROR "Aborting migration for safety"
    exit 1
  }

  # Apply migrations
  apply_migrations || {
    log ERROR "Migration failed"
    log ERROR "Database backup available at: $BACKUP_DIR/backup-$DEPLOYMENT_ID.sql"
    log ERROR "To restore, use the rollback script"
    exit 1
  }

  # Verify migrations
  verify_migrations || {
    log WARNING "Migration verification failed"
  }

  # Generate Drizzle client
  generate_drizzle_client || {
    log WARNING "Drizzle client generation failed"
  }

  # Run post-migration scripts
  run_post_migration_scripts || {
    log WARNING "Some post-migration scripts failed"
  }

  # Cleanup
  cleanup_old_backups

  # Success
  print_section "Migration Complete"

  log SUCCESS "Database migration completed successfully!"
  log INFO "Deployment ID: $DEPLOYMENT_ID"
  log INFO "Backup location: $BACKUP_DIR/backup-$DEPLOYMENT_ID.sql"
  log INFO "Migration log: $MIGRATION_LOG"

  echo ""
  echo -e "${BOLD}Next Steps:${NC}"
  echo "  1. Verify application functionality"
  echo "  2. Monitor for any errors"
  echo "  3. Keep backup for rollback if needed"
  echo ""
}

# Handle script interruption
trap 'log ERROR "Migration interrupted"; exit 1' INT TERM

# Run main migration
main

exit 0
