#!/usr/bin/env node

import { FileSystemScanner } from './scanner/FileSystemScanner';
import { DatabaseModelUsageAnalyzer } from './analyzer/DatabaseModelUsageAnalyzer';

async function runDatabaseModelUsageDemo() {
  console.log('🔍 Database Model Usage Analysis Demo');
  console.log('=====================================\n');

  try {
    const rootPath = process.cwd();
    console.log(`Analyzing codebase at: ${rootPath}\n`);

    // Step 1: Scan the file system to get packages
    console.log('📁 Scanning file system...');
    const scanner = new FileSystemScanner(rootPath);
    const fileSystemMap = await scanner.scanFileSystem();
    
    const allPackages = [...fileSystemMap.packages, ...fileSystemMap.apps];
    console.log(`Found ${allPackages.length} packages/apps\n`);

    // Step 2: Analyze database model usage
    console.log('🗄️  Analyzing database model usage...');
    const analyzer = new DatabaseModelUsageAnalyzer(allPackages, rootPath);
    const report = await analyzer.analyzeDatabaseModelUsage();

    // Step 3: Display results
    console.log('\n📊 Database Model Usage Analysis Results');
    console.log('=========================================\n');

    // Summary
    console.log('📈 Summary:');
    console.log(`  Total Models: ${report.summary.totalModels}`);
    console.log(`  Used Models: ${report.summary.usedModels}`);
    console.log(`  Unused Models: ${report.summary.unusedModels}`);
    console.log(`  Total Fields: ${report.summary.totalFields}`);
    console.log(`  Used Fields: ${report.summary.usedFields}`);
    console.log(`  Unused Fields: ${report.summary.unusedFields}`);
    console.log(`  Total Relations: ${report.summary.totalRelations}`);
    console.log(`  Used Relations: ${report.summary.usedRelations}`);
    console.log(`  Unused Relations: ${report.summary.unusedRelations}`);
    console.log(`  Usage Efficiency: ${report.summary.usageEfficiency}%\n`);

    // Schemas found
    console.log('📋 Prisma Schemas Found:');
    if (report.schemas.length === 0) {
      console.log('  No Prisma schemas found in the codebase\n');
    } else {
      report.schemas.forEach(schema => {
        console.log(`  📄 ${schema.name} (${schema.location})`);
        console.log(`     Fields: ${schema.fields.length}, Relations: ${schema.relations.length}`);
      });
      console.log();
    }

    // Model usage
    console.log('🔍 Model Usage Analysis:');
    if (report.modelUsage.length === 0) {
      console.log('  No model usage found\n');
    } else {
      const sortedUsage = report.modelUsage.sort((a, b) => b.usageCount - a.usageCount);
      sortedUsage.slice(0, 10).forEach(usage => {
        console.log(`  📊 ${usage.modelName}:`);
        console.log(`     Usage Count: ${usage.usageCount}`);
        console.log(`     Fields Used: ${usage.fieldsUsed.length} (${usage.fieldsUsed.slice(0, 5).join(', ')}${usage.fieldsUsed.length > 5 ? '...' : ''})`);
        console.log(`     Relations Used: ${usage.relationsUsed.length} (${usage.relationsUsed.slice(0, 3).join(', ')}${usage.relationsUsed.length > 3 ? '...' : ''})`);
        console.log(`     Operations: ${[...new Set(usage.operationsUsed.map(op => op.type))].join(', ')}`);
        console.log();
      });
    }

    // Unused elements
    console.log('🚫 Unused Database Elements:');
    if (report.unusedElements.length === 0) {
      console.log('  All database elements are being used! 🎉\n');
    } else {
      const unusedByType = report.unusedElements.reduce((acc, element) => {
        if (!acc[element.type]) acc[element.type] = [];
        acc[element.type].push(element);
        return acc;
      }, {} as Record<string, typeof report.unusedElements>);

      Object.entries(unusedByType).forEach(([type, elements]) => {
        console.log(`  📋 Unused ${type}s (${elements.length}):`);
        elements.slice(0, 10).forEach(element => {
          const location = element.modelName ? `${element.modelName}.${element.name}` : element.name;
          console.log(`     - ${location} (${element.reason})`);
        });
        if (elements.length > 10) {
          console.log(`     ... and ${elements.length - 10} more`);
        }
        console.log();
      });
    }

    // Access patterns
    console.log('🔄 Database Access Patterns:');
    if (report.accessPatterns.length === 0) {
      console.log('  No access patterns identified\n');
    } else {
      report.accessPatterns.slice(0, 10).forEach(pattern => {
        const performanceIcon = pattern.performance === 'efficient' ? '✅' : 
                               pattern.performance === 'moderate' ? '⚠️' : '❌';
        console.log(`  ${performanceIcon} ${pattern.pattern}:`);
        console.log(`     Frequency: ${pattern.frequency}`);
        console.log(`     Performance: ${pattern.performance}`);
        console.log(`     Used in: ${pattern.locations.length} files`);
        if (pattern.recommendation) {
          console.log(`     💡 Recommendation: ${pattern.recommendation}`);
        }
        console.log();
      });
    }

    // Optimization opportunities
    console.log('🚀 Optimization Opportunities:');
    const { missingIndexes, inefficientQueries, nPlusOneQueries } = report.optimizationOpportunities;
    
    if (missingIndexes.length > 0) {
      console.log('  📈 Missing Indexes:');
      missingIndexes.slice(0, 5).forEach(index => {
        console.log(`     - ${index}`);
      });
      if (missingIndexes.length > 5) {
        console.log(`     ... and ${missingIndexes.length - 5} more`);
      }
      console.log();
    }

    if (inefficientQueries.length > 0) {
      console.log('  🐌 Inefficient Queries:');
      inefficientQueries.slice(0, 5).forEach(query => {
        console.log(`     - ${query}`);
      });
      if (inefficientQueries.length > 5) {
        console.log(`     ... and ${inefficientQueries.length - 5} more`);
      }
      console.log();
    }

    if (nPlusOneQueries.length > 0) {
      console.log('  ⚡ Potential N+1 Queries:');
      nPlusOneQueries.slice(0, 5).forEach(query => {
        console.log(`     - ${query}`);
      });
      if (nPlusOneQueries.length > 5) {
        console.log(`     ... and ${nPlusOneQueries.length - 5} more`);
      }
      console.log();
    }

    if (missingIndexes.length === 0 && inefficientQueries.length === 0 && nPlusOneQueries.length === 0) {
      console.log('  No optimization opportunities identified! 🎉\n');
    }

    // Recommendations
    console.log('💡 Key Recommendations:');
    if (report.summary.unusedModels > 0) {
      console.log(`  - Consider removing ${report.summary.unusedModels} unused models to reduce schema complexity`);
    }
    if (report.summary.unusedFields > 5) {
      console.log(`  - Review ${report.summary.unusedFields} unused fields - they may be safe to remove`);
    }
    if (report.summary.usageEfficiency < 70) {
      console.log(`  - Usage efficiency is ${report.summary.usageEfficiency}% - consider schema cleanup`);
    }
    if (report.accessPatterns.filter(p => p.performance === 'inefficient').length > 0) {
      console.log('  - Address inefficient query patterns to improve performance');
    }
    if (missingIndexes.length > 0) {
      console.log('  - Add recommended indexes to improve query performance');
    }

    console.log('\n✅ Database model usage analysis complete!');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDatabaseModelUsageDemo();
}

export { runDatabaseModelUsageDemo };