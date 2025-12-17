import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';

@Injectable()
export class WorkflowTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: string) {
    if (!userId) {
      // Public templates only if no user
      return this.prisma.workflowTemplate.findMany({
        where: { isPublic: true },
        include: { creator: { select: { name: true, username: true } } },
      });
    }

    return this.prisma.workflowTemplate.findMany({
      where: {
        OR: [
          { isPublic: true },
          { creatorId: userId },
        ],
      },
      include: { creator: { select: { name: true, username: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id },
      include: { creator: { select: { name: true, username: true } } },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(data: any, userId: string) {
    return this.prisma.workflowTemplate.create({
      data: {
        ...data,
        creatorId: userId,
      },
    });
  }

  async update(id: string, data: any, userId: string) {
    const template = await this.findOne(id);
    if (template.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own templates');
    }

    return this.prisma.workflowTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const template = await this.findOne(id);
    if (template.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    return this.prisma.workflowTemplate.delete({
      where: { id },
    });
  }
}
