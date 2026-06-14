var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MetadataVersioning_1;
import { Injectable, Logger } from '@nestjs/common';
let MetadataVersioning = MetadataVersioning_1 = class MetadataVersioning {
    constructor() {
        this.logger = new Logger(MetadataVersioning_1.name);
        this.versions = [];
    }
    createVersion(metadata, changes) {
        const version = {
            version: `v${this.versions.length + 1}.0.0`,
            timestamp: new Date(),
            metadata: { ...metadata },
            changes
        };
        this.versions.push(version);
        this.logger.log(`Created metadata version: ${version.version}`);
        return version;
    }
    getVersion(version) {
        return this.versions.find(v => v.version === version);
    }
    getLatestVersion() {
        return this.versions[this.versions.length - 1];
    }
    getAllVersions() {
        return [...this.versions];
    }
    compareVersions(version1, version2) {
        const v1 = this.versions.findIndex(v => v.version === version1);
        const v2 = this.versions.findIndex(v => v.version === version2);
        if (v1 === -1 || v2 === -1) {
            throw new Error('Version not found');
        }
        return v1 - v2;
    }
};
MetadataVersioning = MetadataVersioning_1 = __decorate([
    Injectable()
], MetadataVersioning);
export { MetadataVersioning };
//# sourceMappingURL=metadataVersioning_clean.js.map