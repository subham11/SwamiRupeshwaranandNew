import { Test, TestingModule } from '@nestjs/testing';
import { DonationController } from '../donation.controller';
import { DonationService } from '../donation.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { DonationStatus, DonationPurpose } from '../dto';

describe('DonationController', () => {
  let controller: DonationController;

  const mockDonationService = {
    findAllConfigs: jest.fn(),
    findConfigById: jest.fn(),
    createConfig: jest.fn(),
    updateConfig: jest.fn(),
    deleteConfig: jest.fn(),
    createRazorpayOrder: jest.fn(),
    verifyPayment: jest.fn(),
    createDonation: jest.fn(),
    findMyDonations: jest.fn(),
    findAllDonations: jest.fn(),
    getStats: jest.fn(),
    findDonationById: jest.fn(),
    updateDonation: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
  const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationController],
      providers: [
        {
          provide: DonationService,
          useValue: mockDonationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<DonationController>(DonationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns active configs when activeOnly=true', async () => {
    mockDonationService.findAllConfigs.mockResolvedValue([{ id: 'cfg-1' }]);

    const result = await controller.findAllConfigs('true');

    expect(result).toHaveLength(1);
    expect(mockDonationService.findAllConfigs).toHaveBeenCalledWith(true);
  });

  it('creates a donation', async () => {
    const dto = { amount: 500, purpose: DonationPurpose.GENERAL };
    mockDonationService.createDonation.mockResolvedValue({ id: 'don-1' });

    const result = await controller.createDonation(dto as any, { user: { sub: 'user-1' } });

    expect(result.id).toBe('don-1');
    expect(mockDonationService.createDonation).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('creates a Razorpay order', async () => {
    mockDonationService.createRazorpayOrder.mockResolvedValue({ orderId: 'order-1' });

    const result = await controller.createRazorpayOrder({ amount: 100 } as any, { user: { sub: 'user-1' } });

    expect(result.orderId).toBe('order-1');
    expect(mockDonationService.createRazorpayOrder).toHaveBeenCalledWith({ amount: 100 }, 'user-1');
  });

  it('verifies payment', async () => {
    mockDonationService.verifyPayment.mockResolvedValue({ id: 'don-1', status: DonationStatus.COMPLETED });

    const result = await controller.verifyPayment({ donationId: 'don-1' } as any);

    expect(result.status).toBe(DonationStatus.COMPLETED);
    expect(mockDonationService.verifyPayment).toHaveBeenCalledWith({ donationId: 'don-1' });
  });

  it('returns admin stats', async () => {
    mockDonationService.getStats.mockResolvedValue({ totalDonations: 5 });

    const result = await controller.getStats();

    expect(result.totalDonations).toBe(5);
    expect(mockDonationService.getStats).toHaveBeenCalled();
  });
});
