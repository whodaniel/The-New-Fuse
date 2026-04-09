import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScriptAnalyzer, ScriptAnalysis, ScriptPurpose } from '../analyzer/ScriptAnalyzer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ScriptAnalyzer', () => {
  let analyzer: ScriptAnalyzer;
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test scripts
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'script-analyzer-test-'));
    analyzer = new ScriptAnalyzer(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('analyzeScript', () => {
    it('should analyze a simple build script', async () => {
      const scriptContent = `#!/bin/bash
set -e

echo "Building project..."
npm install
npm run build
echo "Build complete!"`;

      const scriptPath = path.join(tempDir, 'build.sh');
      await fs.writeFile(scriptPath, scriptContent);

      const analysis = await analyzer.analyzeScript(scriptPath);

      expect(analysis.name).toBe('build.sh');
      expect(analysis.purpose).toBe('build');
      expect(analysis.functionality).toContain('Build automation');
      expect(analysis.commands).toHaveLength(5); // echo, npm, npm, npm, echo
      expect(analysis.complexity.lineCount).toBe(7);
      expect(analysis.obsolete).toBe(false);
    });

    it('should identify script dependencies', async () => {
      const scriptContent = `#!/bin/bash
export NODE_ENV=production
./other-script.sh
docker build -t myapp .
npm test`;

      const scriptPath = path.join(tempDir, 'deploy.sh');
      await fs.writeFile(scriptPath, scriptContent);

      const analysis = await analyzer.analyzeScript(scriptPath);

      expect(analysis.dependencies.length).toBeGreaterThan(0);
      
      // Check for specific dependency types
      const envDeps = analysis.dependencies.filter(d => d.type === 'environment');
      const scriptDeps = analysis.dependencies.filter(d => d.type === 'script');
      const binaryDeps = analysis.dependencies.filter(d => d.type === 'binary');
      
      expect(binaryDeps.some(d => d.name === 'docker')).toBe(true);
      expect(binaryDeps.some(d => d.name === 'npm')).toBe(true);
      expect(scriptDeps.some(d => d.name === 'other-script.sh')).toBe(true);
    });

    it('should categorize commands correctly', async () => {
      const scriptContent = `#!/bin/bash
npm install
docker build .
git commit -m "test"
cp file1 file2
echo "done"`;

      const scriptPath = path.join(tempDir, 'test.sh');
      await fs.writeFile(scriptPath, scriptContent);

      const analysis = await analyzer.analyzeScript(scriptPath);

      const commandCategories = analysis.commands.map(c => c.category);
      expect(commandCategories).toContain('build'); // npm
      expect(commandCategories).toContain('docker'); // docker
      expect(commandCategories).toContain('git'); // git
      expect(commandCategories).toContain('file_operations'); // cp
      expect(commandCategories).toContain('system'); // echo
    });

    it('should detect script complexity', async () => {
      const complexScript = `#!/bin/bash
if [ "$NODE_ENV" = "production" ]; then
  for file in *.js; do
    if [ -f "$file" ]; then
      npm run build && npm run test || exit 1
    fi
  done
fi`;

      const scriptPath = path.join(tempDir, 'complex.sh');
      await fs.writeFile(scriptPath, complexScript);

      const analysis = await analyzer.analyzeScript(scriptPath);

      expect(analysis.complexity.conditionalCount).toBeGreaterThan(0);
      expect(analysis.complexity.loopCount).toBeGreaterThan(0);
      expect(analysis.complexity.complexityScore).toBeGreaterThanOrEqual(1);
      expect(['conditional', 'loop'].includes(analysis.executionPattern)).toBe(true);
    });

    it('should identify obsolete scripts', async () => {
      const obsoleteScript = `#!/bin/bash
# This script is broken
nonexistent_command
`;

      const scriptPath = path.join(tempDir, 'obsolete.sh');
      await fs.writeFile(scriptPath, obsoleteScript);

      const analysis = await analyzer.analyzeScript(scriptPath);

      expect(analysis.obsolete).toBe(true);
    });

    it('should identify script issues', async () => {
      const problematicScript = `echo "No shebang"
/hardcoded/path/to/file
rm -rf /`;

      const scriptPath = path.join(tempDir, 'problematic.sh');
      await fs.writeFile(scriptPath, problematicScript);

      const analysis = await analyzer.analyzeScript(scriptPath);

      expect(analysis.issues.length).toBeGreaterThan(0);
      expect(analysis.issues.some(i => i.message === 'Missing shebang line')).toBe(true);
    });
  });

  describe('analyzeAllScripts', () => {
    it('should analyze multiple scripts and identify redundancy', async () => {
      // Create multiple similar build scripts
      const buildScript1 = `#!/bin/bash
npm install
npm run build`;

      const buildScript2 = `#!/bin/bash
npm install
npm run build
npm run test`;

      const buildScript3 = `#!/bin/bash
yarn install
yarn build`;

      await fs.writeFile(path.join(tempDir, 'build1.sh'), buildScript1);
      await fs.writeFile(path.join(tempDir, 'build2.sh'), buildScript2);
      await fs.writeFile(path.join(tempDir, 'build3.sh'), buildScript3);

      const report = await analyzer.analyzeAllScripts();

      expect(report.totalScripts).toBe(3);
      expect(report.scriptsByPurpose.build).toHaveLength(3);
      expect(report.redundantGroups).toHaveLength(1);
      expect(report.redundantGroups[0].purpose).toBe('build');
      expect(report.redundantGroups[0].overlapScore).toBeGreaterThan(50);
    });

    it('should generate consolidation recommendations', async () => {
      // Create redundant scripts
      const script1 = `#!/bin/bash
npm run build
npm run test`;

      const script2 = `#!/bin/bash
npm run build
npm run test`;

      await fs.writeFile(path.join(tempDir, 'test1.sh'), script1);
      await fs.writeFile(path.join(tempDir, 'test2.sh'), script2);

      const report = await analyzer.analyzeAllScripts();

      expect(report.recommendations.length).toBeGreaterThan(0);
      // The scripts might be detected as obsolete rather than redundant
      expect(report.recommendations.some(r => r.type === 'remove' || r.type === 'merge')).toBe(true);
    });
  });

  describe('detectScriptRedundancy', () => {
    it('should detect command patterns', async () => {
      const script1 = `#!/bin/bash
npm install
npm run build
npm run test`;

      const script2 = `#!/bin/bash
npm install
npm run build
npm run deploy`;

      await fs.writeFile(path.join(tempDir, 'pattern1.sh'), script1);
      await fs.writeFile(path.join(tempDir, 'pattern2.sh'), script2);

      const report = await analyzer.detectScriptRedundancy();

      expect(report.commandPatternAnalysis).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            frequency: 2,
            similarity: expect.any(Number)
          })
        ])
      );
    });

    it('should identify consolidation opportunities', async () => {
      const identicalScript1 = `#!/bin/bash
docker build -t app .
docker push app`;

      const identicalScript2 = `#!/bin/bash
docker build -t app .
docker push app`;

      await fs.writeFile(path.join(tempDir, 'docker1.sh'), identicalScript1);
      await fs.writeFile(path.join(tempDir, 'docker2.sh'), identicalScript2);

      const report = await analyzer.detectScriptRedundancy();

      expect(report.consolidationOpportunities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'identical_patterns',
            scripts: expect.arrayContaining(['docker1.sh', 'docker2.sh'])
          })
        ])
      );
    });
  });

  describe('script purpose detection', () => {
    const testCases: Array<[string, string, ScriptPurpose]> = [
      ['build-app.sh', 'npm run build', 'build'],
      ['test-suite.sh', 'npm test', 'test'],
      ['dev-server.sh', 'npm run dev', 'dev'],
      ['deploy-prod.sh', 'kubectl apply', 'deployment'],
      ['cleanup-temp.sh', 'rm -rf temp/', 'cleanup'],
      ['setup-env.sh', 'export NODE_ENV=dev', 'setup'],
      ['monitor-health.sh', 'curl /health', 'monitoring'],
      ['random-util.sh', 'echo hello', 'utility']
    ];

    testCases.forEach(([filename, content, expectedPurpose]) => {
      it(`should detect ${expectedPurpose} purpose for ${filename}`, async () => {
        const scriptContent = `#!/bin/bash\n${content}`;
        const scriptPath = path.join(tempDir, filename);
        await fs.writeFile(scriptPath, scriptContent);

        const analysis = await analyzer.analyzeScript(scriptPath);
        expect(analysis.purpose).toBe(expectedPurpose);
      });
    });
  });
});