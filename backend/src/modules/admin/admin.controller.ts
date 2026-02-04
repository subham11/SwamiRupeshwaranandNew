import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { InviteUserDto, UpdateUserRoleDto, AdminUserResponseDto, InviteResponseDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { CurrentUser, CurrentUserData, AdminOnly, SuperAdminOnly } from '@/common/decorators';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('invite')
  @AdminOnly()
  @ApiOperation({ summary: 'Invite a new admin or content editor' })
  @ApiResponse({
    status: 201,
    description: 'Invitation sent successfully',
    type: InviteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'User already exists' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async inviteUser(
    @Body() dto: InviteUserDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<InviteResponseDto> {
    return this.adminService.inviteUser(dto, user.email, user.role);
  }

  @Get('users')
  @AdminOnly()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [AdminUserResponseDto],
  })
  async getAllUsers(): Promise<AdminUserResponseDto[]> {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: AdminUserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<AdminUserResponseDto> {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @SuperAdminOnly()
  @ApiOperation({ summary: 'Update user role (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: AdminUserResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Only Super Admins can change roles' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<AdminUserResponseDto> {
    return this.adminService.updateUserRole(id, dto, user.role);
  }

  @Delete('users/:id')
  @SuperAdminOnly()
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only Super Admins can delete users' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean; message: string }> {
    await this.adminService.deleteUser(id, user.role);
    return { success: true, message: 'User deleted successfully' };
  }
}
