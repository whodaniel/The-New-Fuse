#!/bin/bash

echo "Starting to fix common TypeScript syntax errors..."

# Create logs directory
mkdir -p logs
LOG_FILE="logs/typescript-fixes-$(date +%Y%m%d%H%M%S).log"

# Fix duplicate function declarations
echo "Fixing duplicate function declarations..."
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/): Promise<void> (/): Promise<void> {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/): Promise<void> (/): Promise<void> {/g'
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/): void (/): void {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/): void (/): void {/g'
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/): string (/): string {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/): string (/): string {/g'
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/): boolean (/): boolean {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/): boolean (/): boolean {/g'
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/): number (/): number {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/): number (/): number {/g'

# Fix malformed type declarations
echo "Fixing malformed type declarations..."
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/: unknown)/)/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/: unknown)/)/g'
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/: void {/): void {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/: void {/): void {/g'

# Fix incorrect return type syntax
echo "Fixing incorrect return type syntax..."
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/): string): string {/): string {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/): string): string {/): string {/g'
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/): void): void {/): void {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/): void): void {/): void {/g'
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/): Promise<void>): Promise<void> {/): Promise<void> {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/): Promise<void>): Promise<void> {/): Promise<void> {/g'

# Fix incorrect parameter type syntax
echo "Fixing incorrect parameter type syntax..."
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/error: unknown){/error) {/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/error: unknown){/error) {/g'
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/pattern: unknown, resolver/pattern, resolver/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/pattern: unknown, resolver/pattern, resolver/g'

# Fix incorrect object property syntax
echo "Fixing incorrect object property syntax..."
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/timestamp: new Date(): /timestamp: new Date(),/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/timestamp: new Date(): /timestamp: new Date(),/g'
find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak 's/correlationId: this.getCorrelationId(): /correlationId: this.getCorrelationId(),/g' 2>/dev/null || find src packages apps -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/correlationId: this.getCorrelationId(): /correlationId: this.getCorrelationId(),/g'

# Clean up backup files
echo "Cleaning up backup files..."
find src packages apps -name "*.bak" -delete

echo "Syntax fixes applied. Check $LOG_FILE for details."
