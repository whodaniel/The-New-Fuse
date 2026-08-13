var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StorageModule_1;
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcsStorageService } from './GcsStorageService.js';
import { StorageService } from './StorageService.js';
let StorageModule = StorageModule_1 = class StorageModule {
    static forRoot() {
        return {
            module: StorageModule_1,
            imports: [ConfigModule],
            providers: [
                {
                    provide: StorageService,
                    useClass: GcsStorageService, // Default to GCS for now as per user request
                },
            ],
            exports: [StorageService],
        };
    }
};
StorageModule = StorageModule_1 = __decorate([
    Global(),
    Module({})
], StorageModule);
export { StorageModule };
//# sourceMappingURL=StorageModule.js.map