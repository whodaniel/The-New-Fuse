"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const admin_controller_1 = require("../admin.controller");
const role_service_1 = require("../../services/role.service");
const audit_service_1 = require("../../services/audit.service");
const metrics_service_1 = require("../../services/metrics.service");
describe('AdminController', () => {
    let controller;
    let roleService;
    beforeEach(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            controllers: [admin_controller_1.AdminController],
            providers: [
                {
                    provide: role_service_1.RoleService,
                    useValue: {
                        getAllRoles: jest.fn(),
                        updateRolePermissions: jest.fn(),
                    },
                },
                {
                    provide: audit_service_1.AuditService,
                    useValue: {
                        getLogs: jest.fn(),
                    },
                },
                {
                    provide: metrics_service_1.MetricsService,
                    useValue: {
                        getSystemMetrics: jest.fn(),
                    },
                },
            ],
        }).compile();
        controller = moduleRef.get(admin_controller_1.AdminController);
        roleService = moduleRef.get(role_service_1.RoleService);
    });
    describe('getRoles', () => {
        it('should return all roles', async () => {
            const roles = [{ id: '1', name: 'admin', permissions: [] }];
            jest.spyOn(roleService, 'getAllRoles').mockResolvedValue(roles);
            expect(await controller.getRoles()).toBe(roles);
        });
    });
});
