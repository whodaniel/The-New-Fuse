var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let DependencyMapper = class DependencyMapper {
    mapToDependencyInfo(dependency) {
        return {
            name: dependency.name || 'unknown',
            version: dependency.version || '0.0.0',
            type: dependency.type || 'direct',
            description: dependency.description,
            vulnerabilities: dependency.vulnerabilities?.map((v) => this.mapToVulnerabilityInfo(v)) || []
        };
    }
    mapToVulnerabilityInfo(vulnerability) {
        return {
            id: vulnerability.id || `vuln_${Date.now()}`,
            severity: vulnerability.severity || 'medium',
            title: vulnerability.title || 'Unknown vulnerability',
            description: vulnerability.description || 'No description available',
            recommendation: vulnerability.recommendation,
        };
    }
    mapDependencyArray(dependencies) {
        return dependencies.map(dep => this.mapToDependencyInfo(dep));
    }
};
DependencyMapper = __decorate([
    Injectable()
], DependencyMapper);
export { DependencyMapper };
//# sourceMappingURL=dependency.mapper.js.map