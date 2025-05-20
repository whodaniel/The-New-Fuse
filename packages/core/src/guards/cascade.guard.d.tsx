import { CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CascadeService } from '../services/CascadeService.js';
export declare class CascadeGuard implements CanActivate {
    private readonly reflector;
    private readonly cascadeService;
    constructor(reflector: Reflector, cascadeService: CascadeService);
    canActivate(): Promise<void>;
}
