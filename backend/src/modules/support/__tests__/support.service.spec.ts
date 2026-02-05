import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupportService } from '../support.service';
import { DATABASE_SERVICE } from '@/common/database';
import { EmailService } from '@/common/email/email.service';
import { TicketStatus, TicketPriority, TicketCategory } from '../dto';

describe('SupportService', () => {
  let service: SupportService;

  const mockDb = {
    get: jest.fn(),
    put: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: DATABASE_SERVICE, useValue: mockDb },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('throws when guest ticket has no email', async () => {
      await expect(
        service.createTicket({ subject: 'Help', message: 'Need help' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates ticket and sends confirmation', async () => {
      mockDb.put.mockResolvedValue(undefined);
      mockEmailService.sendEmail.mockResolvedValue(true);
      jest.spyOn(service as any, 'generateTicketNumber').mockResolvedValue('TKT-2026-0001');

      const result = await service.createTicket({
        subject: 'Help',
        message: 'Need help',
        email: 'user@example.com',
        name: 'User',
      } as any);

      expect(result.ticketNumber).toBe('TKT-2026-0001');
      expect(result.status).toBe(TicketStatus.OPEN);
      expect(mockDb.put).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('findAllTickets', () => {
    it('filters by status', async () => {
      mockDb.query.mockResolvedValue({
        items: [
          {
            id: 't1',
            ticketNumber: 'TKT-2026-0001',
            subject: 'A',
            message: 'M',
            category: TicketCategory.GENERAL,
            status: TicketStatus.OPEN,
            priority: TicketPriority.MEDIUM,
            userEmail: 'a@example.com',
            tags: [],
            attachmentUrls: [],
            repliesCount: 0,
            createdAt: '2026-02-01T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z',
          },
          {
            id: 't2',
            ticketNumber: 'TKT-2026-0002',
            subject: 'B',
            message: 'M',
            category: TicketCategory.GENERAL,
            status: TicketStatus.RESOLVED,
            priority: TicketPriority.MEDIUM,
            userEmail: 'b@example.com',
            tags: [],
            attachmentUrls: [],
            repliesCount: 0,
            createdAt: '2026-02-01T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z',
          },
        ],
      });

      const result = await service.findAllTickets({ status: TicketStatus.OPEN } as any);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(TicketStatus.OPEN);
    });
  });

  describe('createReply', () => {
    it('throws when ticket not found', async () => {
      jest.spyOn(service, 'findTicketById').mockResolvedValue(null);

      await expect(
        service.createReply('missing', { message: 'Reply' } as any, 'admin-1', 'Admin', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates reply and updates ticket status', async () => {
      jest.spyOn(service, 'findTicketById').mockResolvedValue({
        id: 't1',
        ticketNumber: 'TKT-2026-0001',
        subject: 'A',
        message: 'M',
        category: TicketCategory.GENERAL,
        status: TicketStatus.OPEN,
        priority: TicketPriority.MEDIUM,
        userEmail: 'a@example.com',
        userName: 'User',
        tags: [],
        attachmentUrls: [],
        repliesCount: 0,
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      } as any);

      mockDb.put.mockResolvedValue(undefined);
      mockDb.update.mockResolvedValue(undefined);
      mockEmailService.sendEmail.mockResolvedValue(true);

      const result = await service.createReply(
        't1',
        { message: 'Reply from admin', isInternal: false } as any,
        'admin-1',
        'Admin',
        true,
      );

      expect(result.ticketId).toBe('t1');
      expect(mockDb.put).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });
  });
});
