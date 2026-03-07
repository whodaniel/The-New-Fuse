#!/usr/bin/env ts-node
// @ts-check

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import chalk from 'chalk';

interface ImplementationMatch {
    file: string;
    lineNumber: number;
    type: 'class' | 'function' | 'interface' | 'constant';
    context: string;
}

interface ComponentVerification {
    category: string;
    feature: string;
    matches: ImplementationMatch[];
    status: 'found' | 'partial' | 'missing';
    confidence: number;
}

const SEARCH_PATTERNS = {
    auth: {
        serviceAuth: [
            'ServiceAuthentication',
            'AuthStrategy',
            'CrossServiceAuth',
            'validateServiceToken'
        ]
    },
    dataConsistency: {
        validation: [
            'ValidationStrategy',
            'ValidatorFactory',
            'DataValidation',
            'validate'
        ]
    }
};

const SEARCH_DIRECTORIES = [
    'packages/core/src',
    'packages/api/src',
    'apps/backend/src',
    'apps/frontend/src',
    'packages/shared/src'
];

async function findImplementations(): Promise<ComponentVerification[]> {
    const results: ComponentVerification[] = [];

    for (const [category, features] of Object.entries(SEARCH_PATTERNS)) {
        for (const [feature, patterns] of Object.entries(features)) {
            const matches: ImplementationMatch[] = [];

            for (const dir of SEARCH_DIRECTORIES) {
                const files = await glob(`${dir}/**/*.{ts,tsx,js,jsx}`);

                for (const file of files) {
                    const content = readFileSync(file, 'utf-8');
                    const lines = content.split('\n');

                    lines.forEach((line, index) => {
                        patterns.forEach(pattern => {
                            if (line.includes(pattern)) {
                                matches.push({
                                    file,
                                    lineNumber: index + 1,
                                    type: determineImplementationType(line),
                                    context: line.trim()
                                });
                            }
                        });
                    });
                }
            }

            results.push({
                category,
                feature,
                matches,
                status: determineStatus(matches),
                confidence: calculateConfidence(matches)
            });
        }
    }

    return results;
}

function determineImplementationType(line: string): 'class' | 'function' | 'interface' | 'constant' {
    line = line.trim();
    if (line.startsWith('export class')) return 'class';
    if (line.startsWith('export interface')) return 'interface';
    if (line.startsWith('export function')) return 'function';
    return 'constant';
}

function determineStatus(matches: ImplementationMatch[]): 'found' | 'partial' | 'missing' {
    if (matches.length === 0) return 'missing';
    return matches.length >= 2 ? 'found' : 'partial';
}

function calculateConfidence(matches: ImplementationMatch[]): number {
    return matches.length > 0 ? 100 : 0;
}

async function generateReport(verifications: ComponentVerification[]): Promise<void> {
    const reportPath = 'docs/audit/IMPLEMENTATION_REPORT.md';
    let report = '# Implementation Verification Report\n\n';
    report += `Generated on: ${new Date().toISOString()}\n\n`;

    for (const verification of verifications) {
        report += `## ${verification.category} - ${verification.feature}\n`;
        report += `Status: ${verification.status.toUpperCase()} (${verification.confidence}% confidence)\n\n`;

        if (verification.matches.length > 0) {
            report += '### Found Implementations:\n';
            verification.matches.forEach(match => {
                report += `- ${match.file}:${match.lineNumber} (${match.type})\n`;
                report += `  \`${match.context}\`\n`;
            });
        }

        report += '\n---\n\n';
    }

    writeFileSync(reportPath, report);
}

// Main function
const main = async () => {
    console.log(chalk.blue('🔍 Starting implementation verification...'));

    const verifications = await findImplementations();
    await generateReport(verifications);

    console.log(chalk.green('✅ Verification complete! Report generated at docs/audit/IMPLEMENTATION_REPORT.md'));

    const missing = verifications.filter(v => v.status === 'missing');
    if (missing.length > 0) {
        console.log(chalk.yellow('\nMissing implementations:'));
        missing.forEach(m => {
            console.log(chalk.yellow(`- ${m.category}/${m.feature}`));
        });
    }
};

main().catch(console.error);
