import { Test } from '@nestjs/testing';
import { AuditService } from '../../services/audit.service';
import { MetricsService } from '../../services/metrics.service';
import { RoleService } from '../../services/role.service';
import { AdminController } from '../admin.controller';

describe('AdminController', () => {
  let controller: AdminController;
  let roleService: RoleService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: RoleService,
          useValue: {
            getAllRoles: jest.fn(),
            updateRolePermissions: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            getLogs: jest.fn(),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            getSystemMetrics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get<AdminController>(AdminController);
    roleService = moduleRef.get<RoleService>(RoleService);
  });

  describe('getRoles', () => {
    it('should return all roles', async () => {
      const roles = [{ id: '1', name: 'admin', permissions: [] }];
      jest.spyOn(roleService, 'getAllRoles').mockResolvedValue(roles);

      expect(await controller.getRoles()).toBe(roles);
    });
  });
});
