var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
// import { UnifiedWorkflowEngine } from '@the-new-fuse/workflow-engine'; // Removed workflow-engine dependency
let InterfaceService = class InterfaceService {
    prisma;
    // workflowEngine; // Removed workflow-engine dependency
    constructor(prisma /* workflowEngine */) { // Removed workflow-engine dependency
        this.prisma = prisma;
        // this.workflowEngine = workflowEngine; // Removed workflow-engine dependency
    }
    async create(_createInterfaceDto, _userId) {
        try {
            // TODO: Replace with actual table when interface schema is created
            // return await this.prisma.interface.create({
            //   data: {
            //     ...createInterfaceDto,
            //     fields: JSON.parse(createInterfaceDto.fields), // Store as JSON
            //     ownerId: userId,
            //   },
            // });
            throw new Error('Interface table not implemented in database schema');
        }
        catch (error) {
            throw new Error(`Failed to create interface: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async findAll(_userId) {
        try {
            // TODO: Replace with actual table when interface schema is created
            // return await this.prisma.interface.findMany({
            //   where: { ownerId: userId },
            // });
            throw new Error('Interface table not implemented in database schema');
        }
        catch (error) {
            throw new Error(`Failed to find interfaces: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async findOne(_id, _userId) {
        // const whereClause = userId ? { id, ownerId: userId } : { id };
        // TODO: Replace with actual table when interface schema is created
        // const iface = await this.prisma.interface.findFirst({
        //   where: whereClause,
        // });
        // if (!iface) {
        //   throw new NotFoundException('Interface not found');
        // }
        // return iface;
        throw new NotFoundException('Interface table not implemented in database schema');
    }
    async update(id, updateInterfaceDto, userId) {
        try {
            await this.findOne(id, userId); // Ensure the user owns the interface
            // TODO: Replace with actual table when interface schema is created
            // return this.prisma.interface.update({
            //   where: { id },
            //   data: {
            //     ...updateInterfaceDto,
            //     fields: updateInterfaceDto.fields ? JSON.parse(updateInterfaceDto.fields) : undefined,
            //   },
            // });
            throw new Error('Interface table not implemented in database schema');
        }
        catch (error) {
            throw new Error(`Failed to update interface: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async remove(id, userId) {
        try {
            await this.findOne(id, userId); // Ensure the user owns the interface
            // TODO: Replace with actual table when interface schema is created
            // return this.prisma.interface.delete({ where: { id } });
            throw new Error('Interface table not implemented in database schema');
        }
        catch (error) {
            throw new Error(`Failed to remove interface: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async execute(id, formData) {
        try {
            const iface = await this.findOne(id);
            if (!iface) {
                throw new NotFoundException('Interface not found');
            }
            // Trigger the workflow execution with the form data as input
            const result = await this.workflowEngine.execute(iface.workflowId, formData);
            return result;
        }
        catch (error) {
            throw new Error(`Failed to execute interface: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
InterfaceService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof UnifiedWorkflowEngine !== "undefined" && UnifiedWorkflowEngine) === "function" ? _b : Object])
], InterfaceService);
export { InterfaceService };
//# sourceMappingURL=interface.service.js.map