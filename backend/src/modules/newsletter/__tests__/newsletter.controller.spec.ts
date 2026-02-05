import { Test, TestingModule } from '@nestjs/testing';
import { NewsletterController } from '../newsletter.controller';
import { NewsletterService } from '../newsletter.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { SubscriberStatus, CampaignStatus } from '../dto';

describe('NewsletterController', () => {
  let controller: NewsletterController;

  const mockNewsletterService = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    findAllSubscribers: jest.fn(),
    findSubscriberById: jest.fn(),
    updateSubscriber: jest.fn(),
    deleteSubscriber: jest.fn(),
    findAllCampaigns: jest.fn(),
    findCampaignById: jest.fn(),
    createCampaign: jest.fn(),
    updateCampaign: jest.fn(),
    deleteCampaign: jest.fn(),
    sendCampaign: jest.fn(),
    getStats: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
  const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsletterController],
      providers: [
        {
          provide: NewsletterService,
          useValue: mockNewsletterService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<NewsletterController>(NewsletterController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('subscribes a user', async () => {
    const dto = { email: 'test@example.com', name: 'Test' };
    mockNewsletterService.subscribe.mockResolvedValue({ id: 'sub-1', ...dto });

    const result = await controller.subscribe(dto as any);

    expect(result.id).toBe('sub-1');
    expect(mockNewsletterService.subscribe).toHaveBeenCalledWith(dto);
  });

  it('unsubscribes a user', async () => {
    mockNewsletterService.unsubscribe.mockResolvedValue(undefined);

    const result = await controller.unsubscribe('test@example.com');

    expect(result.message).toBe('Successfully unsubscribed');
    expect(mockNewsletterService.unsubscribe).toHaveBeenCalledWith('test@example.com');
  });

  it('returns subscribers', async () => {
    mockNewsletterService.findAllSubscribers.mockResolvedValue([{ id: 's1' }]);

    const result = await controller.findAllSubscribers(SubscriberStatus.ACTIVE);

    expect(result).toHaveLength(1);
    expect(mockNewsletterService.findAllSubscribers).toHaveBeenCalledWith(SubscriberStatus.ACTIVE);
  });

  it('creates a campaign', async () => {
    const dto = { subject: { en: 'Hi' }, content: { en: '<p>Body</p>' } };
    mockNewsletterService.createCampaign.mockResolvedValue({ id: 'c1', status: CampaignStatus.DRAFT });

    const result = await controller.createCampaign(dto as any, { user: { sub: 'admin-1' } });

    expect(result.id).toBe('c1');
    expect(mockNewsletterService.createCampaign).toHaveBeenCalledWith(dto, 'admin-1');
  });

  it('sends a campaign', async () => {
    mockNewsletterService.sendCampaign.mockResolvedValue({ id: 'c1', status: CampaignStatus.SENT });

    const result = await controller.sendCampaign('c1', { locale: 'en' } as any);

    expect(result.status).toBe(CampaignStatus.SENT);
    expect(mockNewsletterService.sendCampaign).toHaveBeenCalledWith('c1', { locale: 'en' });
  });

  it('returns stats', async () => {
    mockNewsletterService.getStats.mockResolvedValue({ totalSubscribers: 10 });

    const result = await controller.getStats();

    expect(result.totalSubscribers).toBe(10);
    expect(mockNewsletterService.getStats).toHaveBeenCalled();
  });
});
