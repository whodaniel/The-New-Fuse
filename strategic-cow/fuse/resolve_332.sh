#!/bin/bash
# GITHUB_TOKEN should be set in environment before running this script
# export GITHUB_TOKEN=your_token_here
PR_NUMBER=332
echo "Starting resolution for PR #$PR_NUMBER" > resolve_log.txt

# Initial check
gh auth status >> resolve_log.txt 2>&1

# Checkout
gh pr checkout $PR_NUMBER >> resolve_log.txt 2>&1
BRANCH_NAME=$(git branch --show-current)
echo "Current branch: $BRANCH_NAME" >> resolve_log.txt

# Config
git config user.email "antigravity@google.com"
git config user.name "Antigravity"

# Merge main
git fetch origin main >> resolve_log.txt 2>&1
git merge origin/main --no-edit >> resolve_log.txt 2>&1

# Resolve app.module.ts
# (Using the content I verified earlier)
cat > packages/core/src/app.module.ts <<EOF
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VectorDatabaseModule } from '@the-new-fuse/core-vector-db';
import { MCPResourceAdapter } from './resource/MCPResourceAdapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    VectorDatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, MCPResourceAdapter],
})
export class AppModule {}
EOF
git add packages/core/src/app.module.ts

# Resolve pnpm-lock.yaml by taking origin/main's version
git checkout origin/main -- pnpm-lock.yaml >> resolve_log.txt 2>&1
git add pnpm-lock.yaml

# Commit and push
git commit -m "Resolve merge conflicts for PR #$PR_NUMBER" >> resolve_log.txt 2>&1
git push origin $BRANCH_NAME >> resolve_log.txt 2>&1

echo "Done" >> resolve_log.txt
