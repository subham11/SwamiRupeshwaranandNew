import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
// import { Type } from 'class-transformer'; // removed unused import

// ============================================
// Enums
// ============================================

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  GENERAL = 'general',
  SUBSCRIPTION = 'subscription',
  DONATION = 'donation',
  EVENT = 'event',
  TECHNICAL = 'technical',
  SPIRITUAL_GUIDANCE = 'spiritual_guidance',
  FEEDBACK = 'feedback',
  OTHER = 'other',
}

// ============================================
// Ticket DTOs
// ============================================

export class CreateTicketDto {
  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsEnum(TicketCategory)
  @IsOptional()
  category?: TicketCategory;

  @IsString()
  @IsOptional()
  name?: string; // For non-logged-in users

  @IsEmail()
  @IsOptional()
  email?: string; // For non-logged-in users

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachmentUrls?: string[];
}

export class UpdateTicketDto {
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsEnum(TicketCategory)
  @IsOptional()
  category?: TicketCategory;

  @IsString()
  @IsOptional()
  assignedTo?: string; // Admin user ID

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class TicketResponseDto {
  id: string;
  ticketNumber: string; // e.g., "TKT-2026-0001"
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

// ============================================
// Reply DTOs
// ============================================

export class CreateReplyDto {
  @IsString()
  message: string;

  @IsBoolean()
  @IsOptional()
  isInternal?: boolean; // Internal notes not visible to user

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachmentUrls?: string[];
}

export class ReplyResponseDto {
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

export class TicketWithRepliesResponseDto extends TicketResponseDto {
  replies: ReplyResponseDto[];
}

// ============================================
// Filter DTOs
// ============================================

export class TicketFilterDto {
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketCategory)
  @IsOptional()
  category?: TicketCategory;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  search?: string;
}

// ============================================
// Analytics DTOs
// ============================================

export class SupportStatsDto {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number; // in hours
  ticketsByCategory: Record<TicketCategory, number>;
  ticketsThisWeek: number;
  ticketsLastWeek: number;
}
