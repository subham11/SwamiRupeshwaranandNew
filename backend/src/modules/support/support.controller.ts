import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  // Request, // removed unused import
} from '@nestjs/common';
import { SupportService } from './support.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CreateReplyDto,
  TicketFilterDto,
  TicketStatus,
  TicketCategory,
  TicketPriority,
} from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AdminOnly, EditorOnly, Public, CurrentUser } from '@/common/decorators';

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ============================================
  // Public Endpoints (Guest Tickets)
  // ============================================

  @Public()
  @Post('tickets/guest')
  async createGuestTicket(@Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(dto);
  }

  // ============================================
  // User Ticket Endpoints
  // ============================================

  @Post('tickets')
  async createTicket(@Body() dto: CreateTicketDto, @CurrentUser() user: any) {
    return this.supportService.createTicket(dto, user.sub, user.email);
  }

  @Get('my-tickets')
  async findMyTickets(@CurrentUser() user: any) {
    return this.supportService.findTicketsByUser(user.sub);
  }

  @Get('my-tickets/:id')
  async findMyTicketById(@Param('id') id: string, @CurrentUser() user: any) {
    const ticket = await this.supportService.findTicketWithReplies(id);
    if (!ticket || ticket.userId !== user.sub) {
      return null;
    }
    // Filter out internal notes for users
    return {
      ...ticket,
      internalNotes: undefined,
      replies: ticket.replies.filter((r) => !r.isInternal),
    };
  }

  @Post('tickets/:id/reply')
  async createUserReply(
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
    @CurrentUser() user: any,
  ) {
    // Users cannot create internal notes
    dto.isInternal = false;
    return this.supportService.createReply(id, dto, user.sub, user.name || user.email, false);
  }

  // ============================================
  // Admin Ticket Endpoints
  // ============================================

  @Get('tickets')
  @EditorOnly()
  async findAllTickets(
    @Query('status') status?: TicketStatus,
    @Query('category') category?: TicketCategory,
    @Query('priority') priority?: TicketPriority,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
  ) {
    const filter: TicketFilterDto = {
      status,
      category,
      priority,
      assignedTo,
      search,
    };
    return this.supportService.findAllTickets(filter);
  }

  @Get('tickets/:id')
  @EditorOnly()
  async findTicketById(@Param('id') id: string) {
    return this.supportService.findTicketWithReplies(id);
  }

  @Put('tickets/:id')
  @AdminOnly()
  async updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.supportService.updateTicket(id, dto);
  }

  @Delete('tickets/:id')
  @AdminOnly()
  async deleteTicket(@Param('id') id: string) {
    await this.supportService.deleteTicket(id);
    return { message: 'Ticket deleted successfully' };
  }

  @Post('tickets/:id/admin-reply')
  @EditorOnly()
  async createAdminReply(
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
    @CurrentUser() user: any,
  ) {
    return this.supportService.createReply(id, dto, user.sub, user.name || user.email, true);
  }

  // ============================================
  // Stats Endpoint
  // ============================================

  @Get('stats')
  @AdminOnly()
  async getStats() {
    return this.supportService.getStats();
  }
}
