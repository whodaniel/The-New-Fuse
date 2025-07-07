import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Agent } from '@prisma/client';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Agent[]> {
    return this.prisma.agent.findMany();
  }

  async findOne(id: string): Promise<Agent | null> {
    return this.prisma.agent.findUnique({
      where: { id }
    });
  }

  async create(data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    return this.prisma.agent.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async update(id: string, data: Partial<Agent>): Promise<Agent> {
    return this.prisma.agent.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async delete(id: string): Promise<Agent> {
    return this.prisma.agent.delete({
      where: { id }
    });
  }
}