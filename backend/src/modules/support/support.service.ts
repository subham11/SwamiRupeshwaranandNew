import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { EmailService } from '@/common/email/email.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  TicketResponseDto,
  CreateReplyDto,
  ReplyResponseDto,
  TicketWithRepliesResponseDto,
  TicketFilterDto,
  SupportStatsDto,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from './dto';

// ============================================
// Entity Interfaces
// ============================================

interface TicketEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK?: string;
  GSI2SK?: string;
  id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  userId?: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  attachmentUrls: string[];
  assignedTo?: string;
  assignedToName?: string;
  internalNotes?: string;
  tags: string[];
  repliesCount: number;
  lastReplyAt?: string;
  lastReplyBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReplyEntity {
  PK: string;
  SK: string;
  id: string;
  ticketId: string;
  message: string;
  isInternal: boolean;
  isAdminReply: boolean;
  repliedBy: string;
  repliedByName?: string;
  attachmentUrls: string[];
  createdAt: string;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private readonly ticketEntityType = 'SUPPORT_TICKET';
  private readonly replyEntityType = 'TICKET_REPLY';

  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  // ============================================
  // Ticket Methods
  // ============================================

  async createTicket(dto: CreateTicketDto, userId?: string, userEmail?: string): Promise<TicketResponseDto> {
    if (!userId && !dto.email) {
      throw new BadRequestException('Email is required for guest tickets');
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    const ticketNumber = await this.generateTicketNumber();

    const entity: TicketEntity = {
      PK: `${this.ticketEntityType}#${id}`,
      SK: `${this.ticketEntityType}#${id}`,
      GSI1PK: this.ticketEntityType,
      GSI1SK: `STATUS#${TicketStatus.OPEN}#${now}`,
      ...(userId && {
        GSI2PK: `USER#${userId}`,
        GSI2SK: `TICKET#${now}`,
      }),
      id,
      ticketNumber,
      subject: dto.subject,
      message: dto.message,
      category: dto.category || TicketCategory.GENERAL,
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      userId,
      userEmail: dto.email || userEmail || '',
      userName: dto.name,
      userPhone: dto.phone,
      attachmentUrls: dto.attachmentUrls || [],
      tags: [],
      repliesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.put(entity);

    // Send confirmation email
    this.sendTicketConfirmation(entity);

    return this.mapTicketToResponse(entity);
  }

  async findAllTickets(filter?: TicketFilterDto): Promise<TicketResponseDto[]> {
    const result = await this.db.query<TicketEntity>(this.ticketEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.ticketEntityType,
      },
    });

    let tickets = result.items as TicketEntity[];

    // Apply filters
    if (filter) {
      if (filter.status) {
        tickets = tickets.filter((t) => t.status === filter.status);
      }
      if (filter.category) {
        tickets = tickets.filter((t) => t.category === filter.category);
      }
      if (filter.priority) {
        tickets = tickets.filter((t) => t.priority === filter.priority);
      }
      if (filter.assignedTo) {
        tickets = tickets.filter((t) => t.assignedTo === filter.assignedTo);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        tickets = tickets.filter(
          (t) =>
            t.subject.toLowerCase().includes(searchLower) ||
            t.ticketNumber.toLowerCase().includes(searchLower) ||
            t.userEmail.toLowerCase().includes(searchLower),
        );
      }
    }

    return tickets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((t) => this.mapTicketToResponse(t));
  }

  async findTicketsByUser(userId: string): Promise<TicketResponseDto[]> {
    const result = await this.db.query<TicketEntity>(this.ticketEntityType, {
      indexName: 'GSI2',
      keyConditionExpression: 'GSI2PK = :pk',
      expressionAttributeValues: {
        ':pk': `USER#${userId}`,
      },
    });

    return (result.items as TicketEntity[])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((t) => this.mapTicketToResponse(t));
  }

  async findTicketById(id: string): Promise<TicketResponseDto | null> {
    const result = await this.db.get<TicketEntity>(
      `${this.ticketEntityType}#${id}`,
      `${this.ticketEntityType}#${id}`,
    );

    if (!result) return null;
    return this.mapTicketToResponse(result as TicketEntity);
  }

  async findTicketWithReplies(id: string): Promise<TicketWithRepliesResponseDto | null> {
    const ticket = await this.findTicketById(id);
    if (!ticket) return null;

    const replies = await this.findRepliesByTicket(id);

    return {
      ...ticket,
      replies,
    };
  }

  async updateTicket(id: string, dto: UpdateTicketDto): Promise<TicketResponseDto> {
    const existing = await this.findTicketById(id);
    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }

    const updateExpression: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues: Record<string, unknown> = { ':updatedAt': new Date().toISOString() };

    if (dto.status !== undefined) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = dto.status;

      // Update GSI1SK for status-based queries
      const now = existing.createdAt;
      updateExpression.push('GSI1SK = :gsi1sk');
      expressionAttributeValues[':gsi1sk'] = `STATUS#${dto.status}#${now}`;

      if (dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED) {
        updateExpression.push('resolvedAt = :resolvedAt');
        expressionAttributeValues[':resolvedAt'] = new Date().toISOString();
      }
    }

    if (dto.priority !== undefined) {
      updateExpression.push('priority = :priority');
      expressionAttributeValues[':priority'] = dto.priority;
    }

    if (dto.category !== undefined) {
      updateExpression.push('category = :category');
      expressionAttributeValues[':category'] = dto.category;
    }

    if (dto.assignedTo !== undefined) {
      updateExpression.push('assignedTo = :assignedTo');
      expressionAttributeValues[':assignedTo'] = dto.assignedTo;
    }

    if (dto.internalNotes !== undefined) {
      updateExpression.push('internalNotes = :internalNotes');
      expressionAttributeValues[':internalNotes'] = dto.internalNotes;
    }

    if (dto.tags !== undefined) {
      updateExpression.push('tags = :tags');
      expressionAttributeValues[':tags'] = dto.tags;
    }

    await this.db.update<TicketEntity>(this.ticketEntityType, {
      key: {
        PK: `${this.ticketEntityType}#${id}`,
        SK: `${this.ticketEntityType}#${id}`,
      },
      updateExpression: `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.findTicketById(id) as Promise<TicketResponseDto>;
  }

  async deleteTicket(id: string): Promise<void> {
    // Delete all replies first
    const replies = await this.findRepliesByTicket(id);
    for (const reply of replies) {
      await this.db.delete(
        `${this.ticketEntityType}#${id}`,
        `${this.replyEntityType}#${reply.id}`,
      );
    }

    // Delete ticket
    await this.db.delete(
      `${this.ticketEntityType}#${id}`,
      `${this.ticketEntityType}#${id}`,
    );
  }

  // ============================================
  // Reply Methods
  // ============================================

  async createReply(
    ticketId: string,
    dto: CreateReplyDto,
    repliedBy: string,
    repliedByName: string,
    isAdmin: boolean,
  ): Promise<ReplyResponseDto> {
    const ticket = await this.findTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const entity: ReplyEntity = {
      PK: `${this.ticketEntityType}#${ticketId}`,
      SK: `${this.replyEntityType}#${id}`,
      id,
      ticketId,
      message: dto.message,
      isInternal: dto.isInternal || false,
      isAdminReply: isAdmin,
      repliedBy,
      repliedByName,
      attachmentUrls: dto.attachmentUrls || [],
      createdAt: now,
    };

    await this.db.put(entity);

    // Update ticket
    const newStatus = isAdmin && ticket.status === TicketStatus.OPEN
      ? TicketStatus.IN_PROGRESS
      : !isAdmin && ticket.status === TicketStatus.WAITING_FOR_USER
        ? TicketStatus.IN_PROGRESS
        : ticket.status;

    await this.db.update<TicketEntity>(this.ticketEntityType, {
      key: {
        PK: `${this.ticketEntityType}#${ticketId}`,
        SK: `${this.ticketEntityType}#${ticketId}`,
      },
      updateExpression: 'SET repliesCount = repliesCount + :inc, lastReplyAt = :lastReplyAt, lastReplyBy = :lastReplyBy, #status = :status, #updatedAt = :updatedAt',
      expressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      expressionAttributeValues: {
        ':inc': 1,
        ':lastReplyAt': now,
        ':lastReplyBy': repliedByName,
        ':status': newStatus,
        ':updatedAt': now,
      },
    });

    // Send notification email (if not internal note)
    if (!dto.isInternal) {
      if (isAdmin) {
        this.sendReplyNotification(ticket, dto.message, repliedByName);
      } else {
        this.sendAdminNotification(ticket, dto.message);
      }
    }

    return this.mapReplyToResponse(entity);
  }

  async findRepliesByTicket(ticketId: string, includeInternal = true): Promise<ReplyResponseDto[]> {
    const result = await this.db.query<ReplyEntity>(this.ticketEntityType, {
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionAttributeValues: {
        ':pk': `${this.ticketEntityType}#${ticketId}`,
        ':sk': `${this.replyEntityType}#`,
      },
    });

    let replies = result.items as ReplyEntity[];

    if (!includeInternal) {
      replies = replies.filter((r) => !r.isInternal);
    }

    return replies
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((r) => this.mapReplyToResponse(r));
  }

  // ============================================
  // Stats
  // ============================================

  async getStats(): Promise<SupportStatsDto> {
    const tickets = await this.findAllTickets();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const ticketsThisWeek = tickets.filter((t) => new Date(t.createdAt) >= weekAgo);
    const ticketsLastWeek = tickets.filter(
      (t) => new Date(t.createdAt) >= twoWeeksAgo && new Date(t.createdAt) < weekAgo,
    );

    // Calculate average resolution time
    const resolvedTickets = tickets.filter((t) => t.resolvedAt);
    let totalResolutionTime = 0;
    for (const ticket of resolvedTickets) {
      const created = new Date(ticket.createdAt).getTime();
      const resolved = new Date(ticket.resolvedAt!).getTime();
      totalResolutionTime += resolved - created;
    }
    const averageResolutionTime = resolvedTickets.length > 0
      ? totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Count by category
    const ticketsByCategory = {} as Record<TicketCategory, number>;
    for (const category of Object.values(TicketCategory)) {
      ticketsByCategory[category] = tickets.filter((t) => t.category === category).length;
    }

    return {
      totalTickets: tickets.length,
      openTickets: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
      inProgressTickets: tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length,
      resolvedTickets: resolvedTickets.length,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
      ticketsByCategory,
      ticketsThisWeek: ticketsThisWeek.length,
      ticketsLastWeek: ticketsLastWeek.length,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const tickets = await this.findAllTickets();
    const count = tickets.filter((t) => t.ticketNumber.includes(`TKT-${year}`)).length + 1;
    return `TKT-${year}-${count.toString().padStart(4, '0')}`;
  }

  private async sendTicketConfirmation(ticket: TicketEntity): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: ticket.userEmail,
        toName: ticket.userName,
        subject: `Ticket ${ticket.ticketNumber} Created - We've received your query 🙏`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">Support Request Received</h2>
            <p>Dear ${ticket.userName || 'Devotee'},</p>
            <p>Thank you for reaching out. We have received your query and will respond as soon as possible.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
              <p><strong>Subject:</strong> ${ticket.subject}</p>
              <p><strong>Category:</strong> ${ticket.category.replace(/_/g, ' ')}</p>
            </div>
            
            <p>Please keep this ticket number for future reference.</p>
            <p style="color: #666;">॥ ॐ नमः शिवाय ॥</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send ticket confirmation:', error);
    }
  }

  private async sendReplyNotification(ticket: TicketResponseDto, message: string, repliedByName: string): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: ticket.userEmail,
        toName: ticket.userName,
        subject: `Reply to Ticket ${ticket.ticketNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">New Reply on Your Ticket</h2>
            <p>Dear ${ticket.userName || 'Devotee'},</p>
            <p>You have received a reply on your support ticket.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
              <p><strong>Subject:</strong> ${ticket.subject}</p>
              <p><strong>Reply from:</strong> ${repliedByName}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;" />
              <p>${message}</p>
            </div>
            
            <p>You can reply to this ticket by logging into your account.</p>
            <p style="color: #666;">॥ ॐ नमः शिवाय ॥</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send reply notification:', error);
    }
  }

  private async sendAdminNotification(ticket: TicketResponseDto, message: string): Promise<void> {
    // In production, send to admin email
    this.logger.log(`New reply on ticket ${ticket.ticketNumber}: ${message.substring(0, 100)}...`);
  }

  private mapTicketToResponse(entity: TicketEntity): TicketResponseDto {
    return {
      id: entity.id,
      ticketNumber: entity.ticketNumber,
      subject: entity.subject,
      message: entity.message,
      category: entity.category,
      status: entity.status,
      priority: entity.priority,
      userId: entity.userId,
      userEmail: entity.userEmail,
      userName: entity.userName,
      userPhone: entity.userPhone,
      attachmentUrls: entity.attachmentUrls,
      assignedTo: entity.assignedTo,
      assignedToName: entity.assignedToName,
      internalNotes: entity.internalNotes,
      tags: entity.tags,
      repliesCount: entity.repliesCount,
      lastReplyAt: entity.lastReplyAt,
      lastReplyBy: entity.lastReplyBy,
      resolvedAt: entity.resolvedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private mapReplyToResponse(entity: ReplyEntity): ReplyResponseDto {
    return {
      id: entity.id,
      ticketId: entity.ticketId,
      message: entity.message,
      isInternal: entity.isInternal,
      isAdminReply: entity.isAdminReply,
      repliedBy: entity.repliedBy,
      repliedByName: entity.repliedByName,
      attachmentUrls: entity.attachmentUrls,
      createdAt: entity.createdAt,
    };
  }
}
