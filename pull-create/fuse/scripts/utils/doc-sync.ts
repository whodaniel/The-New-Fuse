import { marked } from 'marked';
import { OpenAPIGenerator } from './openapi.js';

export class EnhancedDocSyncer {
  async syncAll() {
    console.log('📚 Starting Enhanced Documentation Sync');

    // Sync API documentation
    await this.syncAPISpecs();
    
    // Sync component documentation
    await this.syncComponentDocs();
    
    // Generate integration guides
    await this.generateIntegrationGuides();
    
    // Update architecture documentation
    await this.updateArchitectureDocs();
  }

  private async syncAPISpecs() {
    const generator = new OpenAPIGenerator();
    
    // Extract current endpoints
    const endpoints = await generator.extractEndpoints();
    
    // Generate OpenAPI spec
    const spec = await generator.generateSpec(endpoints);
    
    // Generate documentation
    await generator.generateDocs(spec);
    
    // Validate examples
    await generator.validateExamples(spec);
  }

  private async syncComponentDocs() {
    // Extract component metadata
    const components = await this.extractComponents();
    
    // Generate documentation
    for (const component of components) {
      await this.generateComponentDoc(component);
      await this.validateExamples(component);
      await this.updateChangelog(component);
    }
  }
}