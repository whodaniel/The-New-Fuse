import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';

@Injectable()
export class PromptTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  // Template Management
  async createTemplate(data: any) {
    return this.prisma.promptTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic || false,
        category: data.category,
        tags: data.tags || [],
        analytics: {},
        versions: {
          create: data.versions || []
        }
      },
      include: { versions: true }
    });
  }

  async findAllTemplates(filter?: any) {
    return this.prisma.promptTemplate.findMany({
      where: filter,
      include: { versions: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findTemplate(id: string) {
    const template = await this.prisma.promptTemplate.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: 'desc' } } }
    });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  async updateTemplate(id: string, data: any) {
    return this.prisma.promptTemplate.update({
      where: { id },
      data,
      include: { versions: true }
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.promptTemplate.delete({ where: { id } });
  }

  // Version Management
  async createVersion(templateId: string, data: any) {
    // Get latest version number
    const lastVersion = await this.prisma.promptVersion.findFirst({
      where: { templateId },
      orderBy: { version: 'desc' }
    });
    const nextVersion = (lastVersion?.version || 0) + 1;

    return this.prisma.promptVersion.create({
      data: {
        templateId,
        version: nextVersion,
        content: data.content,
        label: data.label,
        variables: data.variables || {},
        changelog: data.changelog,
        isActive: true
      }
    });
  }

  async getVersions(templateId: string) {
    return this.prisma.promptVersion.findMany({
      where: { templateId },
      orderBy: { version: 'desc' }
    });
  }

  // Snippet Management
  async createSnippet(data: any) {
    return this.prisma.promptSnippet.create({ data });
  }

  async findAllSnippets(filter?: any) {
    return this.prisma.promptSnippet.findMany({
      where: filter,
      orderBy: { usageCount: 'desc' }
    });
  }

  async updateSnippet(id: string, data: any) {
    return this.prisma.promptSnippet.update({
      where: { id },
      data
    });
  }

  async deleteSnippet(id: string) {
    return this.prisma.promptSnippet.delete({ where: { id } });
  }

  async incrementSnippetUsage(id: string) {
    return this.prisma.promptSnippet.update({
      where: { id },
      data: { usageCount: { increment: 1 } }
    });
  }

  async compileTemplate(templateId: string, variables: Record<string, any> = {}) {
    const template = await this.prisma.promptTemplate.findUnique({
      where: { id: templateId },
      include: { versions: { orderBy: { version: 'desc' } } }
    });

    if (!template || !template.versions || template.versions.length === 0) {
      throw new NotFoundException(`Template ${templateId} not found or has no versions`);
    }

    // Use current version or latest
    const versionId = template.currentVersionId;
    const version = versionId
      ? template.versions.find(v => v.id === versionId)
      : template.versions[0];

    if (!version) {
       throw new NotFoundException(`Active version for template ${templateId} not found`);
    }

    let compiledContent = version.content;
    const templateVariables = { ...(version.variables as Record<string, any>), ...variables };

    // Replace variables with actual values
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      compiledContent = compiledContent.replace(regex, String(value));
    });

    return { content: compiledContent };
  }
}
