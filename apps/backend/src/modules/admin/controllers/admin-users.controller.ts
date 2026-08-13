import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { UsersService } from '../../../users/users.service';

@ApiTags('admin')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  async getUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.usersService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(@Body() data: any) {
    return this.usersService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete users' })
  async bulkDelete(@Body('ids') ids: string[]) {
    for (const id of ids) {
      await this.usersService.delete(id);
    }
    return { success: true, count: ids.length };
  }

  @Patch('bulk-status')
  @ApiOperation({ summary: 'Bulk update user status' })
  async bulkStatus(@Body() data: { ids: string[]; isActive: boolean }) {
    for (const id of data.ids) {
      await this.usersService.update(id, { isActive: data.isActive });
    }
    return { success: true, count: data.ids.length };
  }
}
