import { Request, Response } from 'express';
// Correct the import path for AgentService and PrismaService
import { AgentService } from '../modules/services/agent.service.js';
import { PrismaService } from '../services/prisma.service.js'; // Assuming PrismaService is here
import { toError } from '../utils/error.js'; // Import the helper
import { CurrentUser } from '../modules/decorators/current-user.decorator.js'; // Import CurrentUser decorator
import { UseGuards, Get, Post, Put, Delete, Param, Body } from '@nestjs/common'; // Import UseGuards and other decorators
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard.js'; // Import JwtAuthGuard

// Define User interface if not globally available
interface User {
  id: string;
  [key: string]: any;
}

@UseGuards(JwtAuthGuard) // Apply auth guard to the controller
export class AgentController {
  // Remove private agentService declaration

  // Inject services via constructor
  constructor(
    private readonly agentService: AgentService,
    // PrismaService might not be directly needed if AgentService handles it
    // private readonly prisma: PrismaService
  ) {}

  @Get() // Assuming GET '/' maps here
  async getAllAgents(@CurrentUser() user: User, res: Response) { // Add CurrentUser decorator
    try {
      // Pass userId to the service method
      const agents = await this.agentService.getAgents(user.id);
      return res.status(200).json(agents);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      return res.status(500).json({ error: err.message });
    }
  }

  @Get('/:id') // Assuming GET '/:id' maps here
  async getAgentById(@Param('id') id: string, @CurrentUser() user: User, res: Response) { // Add CurrentUser decorator and Param
    try {
      // Pass userId to the service method
      const agent = await this.agentService.getAgentById(id, user.id);

      // Service now throws error if not found, so no need to check here
      // if (!agent) {
      //   return res.status(404).json({ error: 'Agent not found' });
      // }

      return res.status(200).json(agent);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      // Handle specific "not found" errors potentially thrown by the service
      if (err.message?.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  @Post() // Assuming POST '/' maps here
  async createAgent(@Body() createAgentDto: any, @CurrentUser() user: User, res: Response) { // Add CurrentUser decorator and Body
    try {
      // Pass userId to the service method
      const agent = await this.agentService.createAgent(createAgentDto, user.id);
      return res.status(201).json(agent);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      // Handle potential duplicate name errors from the service
      if (err.message?.includes('already exists')) {
         return res.status(409).json({ error: err.message }); // 409 Conflict
      }
      return res.status(400).json({ error: err.message });
    }
  }

  @Put('/:id') // Assuming PUT '/:id' maps here
  async updateAgent(@Param('id') id: string, @Body() updateAgentDto: any, @CurrentUser() user: User, res: Response) { // Add CurrentUser decorator, Param, Body
    try {
      // Pass userId to the service method
      const updatedAgent = await this.agentService.updateAgent(id, updateAgentDto, user.id);

      // Service throws if not found
      // if (!updatedAgent) {
      //   return res.status(404).json({ error: 'Agent not found' });
      // }

      return res.status(200).json(updatedAgent);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
       if (err.message?.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  @Delete('/:id') // Assuming DELETE '/:id' maps here
  async deleteAgent(@Param('id') id: string, @CurrentUser() user: User, res: Response) { // Add CurrentUser decorator and Param
    try {
      // Pass userId to the service method
      const deleted = await this.agentService.deleteAgent(id, user.id);

      // Check the boolean result from the service
      if (!deleted) {
         // This case might not happen if service throws on not found
         return res.status(404).json({ error: 'Agent not found or could not be deleted' });
      }

      return res.status(204).send(); // No Content
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
       if (err.message?.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  }
}
// Make sure necessary imports like Get, Post, Put, Delete, Param, Body are added from @nestjs/common
// If this controller is used with Express directly (not NestJS), decorators like @UseGuards, @CurrentUser, @Param, @Body won't work.
// The routing logic in `routes/agents.ts` would need to be updated instead to extract user from req and pass it.
// Based on the presence of NestJS decorators and modules, assuming this is a NestJS controller.