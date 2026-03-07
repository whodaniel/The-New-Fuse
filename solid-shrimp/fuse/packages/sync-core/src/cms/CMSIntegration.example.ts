/**
 * CMS Integration Example
 * 
 * Demonstrates how to use the CMS integration system with existing
 * user and tenant systems for personal content management, project
 * configuration sync, collaborative content sharing, and private data isolation.
 */

import { DrizzleClient, UserRole } from '@the-new-fuse/database/generated/drizzle';
import { RedisService } from '../config/SyncRedisConfig';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';
import { CMSIntegrationService } from './CMSIntegrationService';
import { 
  ContentType, 
  PrivacyLevel, 
  Permission,
  SyncFrequency,
  ConflictResolutionStrategy
} from './types';

async function demonstrateCMSIntegration() {
  // Initialize dependencies (these would be injected in real application)
  const drizzle = new DrizzleClient();
  const redis = new RedisService({
    host: 'localhost',
    port: 6379,
    keyPrefix: 'cms:'
  });
  const syncOrchestrator = new SyncOrchestrator(drizzle, redis, {} as any);
  const fileWatcher = new EnhancedFileSystemWatcher({
    watchPaths: ['./config', './content'],
    ignorePatterns: ['node_modules', '.git']
  });

  // Initialize CMS Integration Service
  const cmsService = new CMSIntegrationService(
    drizzle,
    redis,
    syncOrchestrator,
    fileWatcher,
    {
      enablePersonalContent: true,
      enableProjectSync: true,
      enableCollaboration: true,
      defaultPrivacy: PrivacyLevel.PRIVATE,
      maxContentSize: 10 * 1024 * 1024, // 10MB
      allowedContentTypes: [
        ContentType.DOCUMENT,
        ContentType.TEMPLATE,
        ContentType.CONFIGURATION,
        ContentType.SCRIPT
      ],
      syncInterval: 30000 // 30 seconds
    }
  );

  await cmsService.initialize();

  console.log('🚀 CMS Integration Service initialized successfully');

  // Example 1: Personal Content Management
  console.log('\n📝 Example 1: Personal Content Management');
  
  const userId = 'user-123';
  
  // Create personal content
  const personalContent = await cmsService.createPersonalContent(userId, {
    type: ContentType.DOCUMENT,
    title: 'My Personal Notes',
    content: 'These are my private notes about the project...',
    metadata: {
      tags: ['personal', 'notes', 'project'],
      category: 'documentation',
      language: 'en',
      format: 'markdown',
      size: 0,
      accessCount: 0
    },
    privacy: PrivacyLevel.PRIVATE,
    sharingSettings: {
      isPublic: false,
      allowedUsers: [],
      allowedRoles: [],
      permissions: []
    }
  });

  console.log(`✅ Created personal content: ${personalContent.id}`);
  console.log(`   Title: ${personalContent.title}`);
  console.log(`   Privacy: ${personalContent.privacy}`);
  console.log(`   Tenant ID: ${personalContent.tenantId}`);

  // Example 2: Project Configuration Sync
  console.log('\n⚙️ Example 2: Project Configuration Sync');

  const projectConfig = await cmsService.createProjectConfiguration(userId, {
    name: 'My Development Project',
    description: 'Configuration for my development environment',
    config: {
      database: {
        host: 'localhost',
        port: 5432,
        name: 'myproject_dev'
      },
      api: {
        baseUrl: 'http://localhost:3000',
        timeout: 5000
      },
      features: {
        enableLogging: true,
        enableMetrics: true,
        debugMode: true
      }
    },
    privacy: PrivacyLevel.PRIVATE,
    collaborators: [],
    syncSettings: {
      enabled: true,
      frequency: SyncFrequency.REAL_TIME,
      conflictResolution: ConflictResolutionStrategy.LAST_WRITE_WINS,
      backupEnabled: true,
      versionHistory: true
    }
  });

  console.log(`✅ Created project configuration: ${projectConfig.id}`);
  console.log(`   Name: ${projectConfig.name}`);
  console.log(`   Privacy: ${projectConfig.privacy}`);
  console.log(`   Sync enabled: ${projectConfig.syncSettings.enabled}`);

  // Example 3: Collaborative Content Sharing
  console.log('\n🤝 Example 3: Collaborative Content Sharing');

  const collaboratorUserId = 'collaborator-456';

  // Share personal content with read permissions
  await cmsService.shareContent(
    userId,
    personalContent.id,
    collaboratorUserId,
    [Permission.READ],
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
  );

  console.log(`✅ Shared content ${personalContent.id} with user ${collaboratorUserId}`);
  console.log(`   Permissions: READ`);
  console.log(`   Expires: 7 days from now`);

  // Add collaborator to project with manager role
  await cmsService.addProjectCollaborator(
    userId,
    projectConfig.id,
    collaboratorUserId,
    UserRole.AGENCY_MANAGER,
    [Permission.READ, Permission.WRITE, Permission.SHARE]
  );

  console.log(`✅ Added collaborator ${collaboratorUserId} to project ${projectConfig.id}`);
  console.log(`   Role: AGENCY_MANAGER`);
  console.log(`   Permissions: READ, WRITE, SHARE`);

  // Example 4: Retrieve User Content
  console.log('\n📋 Example 4: Retrieve User Content');

  const userContent = await cmsService.getUserContent(userId, {
    includePersonal: true,
    includeShared: true,
    includeCollaborative: true,
    limit: 10
  });

  console.log(`✅ Retrieved user content for ${userId}:`);
  console.log(`   Personal content items: ${userContent.personalContent.length}`);
  console.log(`   Shared content items: ${userContent.sharedContent.length}`);
  console.log(`   Collaborative projects: ${userContent.collaborativeProjects.length}`);

  // Display personal content
  userContent.personalContent.forEach((content, index) => {
    console.log(`   Personal ${index + 1}: ${content.title} (${content.privacy})`);
  });

  // Display collaborative projects
  userContent.collaborativeProjects.forEach((project, index) => {
    console.log(`   Project ${index + 1}: ${project.name} (${project.collaborators.length} collaborators)`);
  });

  // Example 5: Privacy Compliance Audit
  console.log('\n🔒 Example 5: Privacy Compliance Audit');

  const auditResult = await cmsService.auditPrivacyCompliance(userId);

  console.log(`✅ Privacy compliance audit for tenant ${userId}:`);
  console.log(`   Compliant: ${auditResult.compliant}`);
  console.log(`   Violations: ${auditResult.violations.length}`);
  console.log(`   Recommendations: ${auditResult.recommendations.length}`);

  if (auditResult.violations.length > 0) {
    console.log('   Violations found:');
    auditResult.violations.forEach((violation, index) => {
      console.log(`     ${index + 1}. ${violation}`);
    });
  }

  if (auditResult.recommendations.length > 0) {
    console.log('   Recommendations:');
    auditResult.recommendations.forEach((recommendation, index) => {
      console.log(`     ${index + 1}. ${recommendation}`);
    });
  }

  // Display audit details
  console.log('   Audit Details:');
  console.log(`     Personal Content: ${JSON.stringify(auditResult.details.personalContent, null, 2)}`);
  console.log(`     Project Configurations: ${JSON.stringify(auditResult.details.projectConfigurations, null, 2)}`);
  console.log(`     Collaborative Content: ${JSON.stringify(auditResult.details.collaborativeContent, null, 2)}`);

  // Example 6: Sync User CMS Data
  console.log('\n🔄 Example 6: Sync User CMS Data');

  await cmsService.syncUserCMSData(userId);

  console.log(`✅ Synchronized all CMS data for user ${userId}`);
  console.log('   - Personal content synced across active sessions');
  console.log('   - Project configurations synced with file watchers');
  console.log('   - Collaborative content permissions updated');

  // Example 7: Advanced Collaboration Workflow
  console.log('\n🚀 Example 7: Advanced Collaboration Workflow');

  // Create a shared project configuration
  const sharedProject = await cmsService.createProjectConfiguration(userId, {
    name: 'Team Collaboration Project',
    description: 'A project for team collaboration',
    config: {
      team: {
        name: 'Development Team',
        members: [userId, collaboratorUserId],
        roles: {
          [userId]: 'owner',
          [collaboratorUserId]: 'manager'
        }
      },
      workflow: {
        stages: ['development', 'testing', 'production'],
        approvals: {
          testing: [userId],
          production: [userId, collaboratorUserId]
        }
      }
    },
    privacy: PrivacyLevel.SHARED,
    collaborators: [],
    syncSettings: {
      enabled: true,
      frequency: SyncFrequency.REAL_TIME,
      conflictResolution: ConflictResolutionStrategy.MERGE,
      backupEnabled: true,
      versionHistory: true
    }
  });

  // Add multiple collaborators with different roles
  const teamMembers = [
    { userId: 'developer-1', role: UserRole.AGENT_OPERATOR, permissions: [Permission.READ, Permission.WRITE] },
    { userId: 'developer-2', role: UserRole.AGENT_OPERATOR, permissions: [Permission.READ, Permission.WRITE] },
    { userId: 'manager-1', role: UserRole.AGENCY_MANAGER, permissions: [Permission.READ, Permission.WRITE, Permission.SHARE] }
  ];

  for (const member of teamMembers) {
    await cmsService.addProjectCollaborator(
      userId,
      sharedProject.id,
      member.userId,
      member.role,
      member.permissions
    );
    console.log(`   Added ${member.userId} as ${member.role}`);
  }

  console.log(`✅ Created collaborative project: ${sharedProject.name}`);
  console.log(`   Collaborators: ${teamMembers.length + 1} (including owner)`);
  console.log(`   Privacy: ${sharedProject.privacy}`);
  console.log(`   Real-time sync: ${sharedProject.syncSettings.enabled}`);

  // Example 8: Content Templates and Reuse
  console.log('\n📋 Example 8: Content Templates and Reuse');

  // Create a template for project documentation
  const documentTemplate = await cmsService.createPersonalContent(userId, {
    type: ContentType.TEMPLATE,
    title: 'Project Documentation Template',
    content: `# {{PROJECT_NAME}}

## Overview
{{PROJECT_DESCRIPTION}}

## Team Members
{{TEAM_MEMBERS}}

## Configuration
\`\`\`json
{{PROJECT_CONFIG}}
\`\`\`

## Getting Started
1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Run the application

## Contributing
Please follow our contribution guidelines...
`,
    metadata: {
      tags: ['template', 'documentation', 'project'],
      category: 'templates',
      language: 'markdown',
      format: 'template',
      size: 0,
      accessCount: 0,
      customFields: {
        templateVariables: ['PROJECT_NAME', 'PROJECT_DESCRIPTION', 'TEAM_MEMBERS', 'PROJECT_CONFIG'],
        templateType: 'documentation',
        version: '1.0'
      }
    },
    privacy: PrivacyLevel.SHARED,
    sharingSettings: {
      isPublic: false,
      allowedUsers: [collaboratorUserId],
      allowedRoles: [UserRole.AGENCY_MANAGER, UserRole.AGENCY_ADMIN],
      permissions: []
    }
  });

  console.log(`✅ Created documentation template: ${documentTemplate.id}`);
  console.log(`   Template variables: ${documentTemplate.metadata.customFields?.templateVariables?.join(', ')}`);
  console.log(`   Shared with: ${documentTemplate.sharingSettings.allowedRoles.join(', ')}`);

  console.log('\n🎉 CMS Integration demonstration completed successfully!');
  console.log('\nKey Features Demonstrated:');
  console.log('✅ Personal content management with tenant isolation');
  console.log('✅ Project configuration sync with file watching');
  console.log('✅ Collaborative content sharing with role-based access');
  console.log('✅ Private data isolation and privacy boundaries');
  console.log('✅ Real-time synchronization across user sessions');
  console.log('✅ Privacy compliance auditing');
  console.log('✅ Template-based content creation');
  console.log('✅ Multi-user collaboration workflows');

  // Cleanup
  await drizzle.$disconnect();
}

// Error handling wrapper
async function runExample() {
  try {
    await demonstrateCMSIntegration();
  } catch (error) {
    console.error('❌ CMS Integration example failed:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample();
}

export { demonstrateCMSIntegration };