import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NewsletterService } from '../newsletter.service';
import { DATABASE_SERVICE } from '@/common/database';
import { EmailService } from '@/common/email/email.service';
import { SubscriberStatus, CampaignStatus } from '../dto';

describe('NewsletterService', () => {
  let service: NewsletterService;

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
        NewsletterService,
        {
          provide: DATABASE_SERVICE,
          useValue: mockDb,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<NewsletterService>(NewsletterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribe', () => {
    it('creates a new subscriber and sends welcome email', async () => {
      mockDb.query.mockResolvedValue({ items: [] });
      mockDb.put.mockResolvedValue(undefined);
      mockEmailService.sendEmail.mockResolvedValue(true);

      const result = await service.subscribe({
        email: 'Test@Example.com',
        name: 'Test User',
      });

      expect(result.email).toBe('test@example.com');
      expect(result.status).toBe(SubscriberStatus.ACTIVE);
      expect(mockDb.put).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('throws when email is already active', async () => {
      mockDb.query.mockResolvedValue({
        items: [
          {
            id: 'sub-1',
            email: 'test@example.com',
            status: SubscriberStatus.ACTIVE,
            tags: [],
            subscribedAt: '2026-02-01T00:00:00.000Z',
            createdAt: '2026-02-01T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z',
          },
        ],
      });

      await expect(service.subscribe({ email: 'test@example.com' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('reactivates unsubscribed email', async () => {
      mockDb.query.mockResolvedValue({
        items: [
          {
            id: 'sub-2',
            email: 'test@example.com',
            status: SubscriberStatus.UNSUBSCRIBED,
            tags: [],
            subscribedAt: '2026-01-01T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      const updateSpy = jest.spyOn(service, 'updateSubscriber').mockResolvedValue({
        id: 'sub-2',
        email: 'test@example.com',
        status: SubscriberStatus.ACTIVE,
        tags: [],
        subscribedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      } as any);

      const result = await service.subscribe({ email: 'test@example.com' });

      expect(updateSpy).toHaveBeenCalledWith('sub-2', { status: SubscriberStatus.ACTIVE });
      expect(result.status).toBe(SubscriberStatus.ACTIVE);
    });
  });

  describe('unsubscribe', () => {
    it('throws when subscriber is not found', async () => {
      mockDb.query.mockResolvedValue({ items: [] });

      await expect(service.unsubscribe('missing@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllSubscribers', () => {
    it('filters by status when provided', async () => {
      mockDb.query.mockResolvedValue({
        items: [
          {
            id: 's1',
            email: 'a@example.com',
            status: SubscriberStatus.ACTIVE,
            tags: [],
            subscribedAt: '2026-02-01T00:00:00.000Z',
            createdAt: '2026-02-01T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z',
          },
          {
            id: 's2',
            email: 'b@example.com',
            status: SubscriberStatus.UNSUBSCRIBED,
            tags: [],
            subscribedAt: '2026-01-15T00:00:00.000Z',
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: '2026-01-15T00:00:00.000Z',
          },
        ],
      });

      const result = await service.findAllSubscribers(SubscriberStatus.ACTIVE);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(SubscriberStatus.ACTIVE);
    });
  });

  describe('createCampaign', () => {
    it('creates a campaign with draft status by default', async () => {
      mockDb.put.mockResolvedValue(undefined);

      const result = await service.createCampaign(
        {
          subject: { en: 'Hello' },
          content: { en: '<p>Body</p>' },
        },
        'admin-1',
      );

      expect(result.status).toBe(CampaignStatus.DRAFT);
      expect(result.createdBy).toBe('admin-1');
      expect(mockDb.put).toHaveBeenCalled();
    });
  });

  describe('sendCampaign', () => {
    it('sends campaign to active subscribers and updates stats', async () => {
      const campaign = {
        id: 'camp-1',
        subject: { en: 'Subject' },
        content: { en: '<p>Content</p>' },
        previewText: 'Preview',
        targetTags: [],
        status: CampaignStatus.DRAFT,
        scheduledAt: undefined,
        createdBy: 'admin-1',
        stats: { totalRecipients: 0, sent: 0, failed: 0 },
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      };

      jest
        .spyOn(service, 'findCampaignById')
        .mockResolvedValueOnce(campaign as any)
        .mockResolvedValueOnce({ ...campaign, status: CampaignStatus.SENT } as any);

      jest.spyOn(service, 'findAllSubscribers').mockResolvedValue([
        {
          id: 's1',
          email: 'a@example.com',
          name: 'A',
          status: SubscriberStatus.ACTIVE,
          tags: [],
          subscribedAt: '2026-02-01T00:00:00.000Z',
          createdAt: '2026-02-01T00:00:00.000Z',
          updatedAt: '2026-02-01T00:00:00.000Z',
        },
      ] as any);

      const updateCampaignSpy = jest
        .spyOn(service, 'updateCampaign')
        .mockResolvedValue({ ...campaign, status: CampaignStatus.SENDING } as any);

      mockDb.update.mockResolvedValue(undefined);
      mockEmailService.sendEmail.mockResolvedValue(true);

      const result = await service.sendCampaign('camp-1', { locale: 'en' });

      expect(updateCampaignSpy).toHaveBeenCalledWith('camp-1', { status: CampaignStatus.SENDING });
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(CampaignStatus.SENT);
    });
  });
});
