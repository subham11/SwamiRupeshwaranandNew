import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DonationService } from '../donation.service';
import { DATABASE_SERVICE } from '@/common/database';
import { EmailService } from '@/common/email/email.service';
import { DonationPurpose, DonationStatus, DonationType } from '../dto';
import * as crypto from 'crypto';

describe('DonationService', () => {
  let service: DonationService;

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

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => {
      if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_key';
      if (key === 'RAZORPAY_KEY_SECRET') return 'secret';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationService,
        { provide: DATABASE_SERVICE, useValue: mockDb },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DonationService>(DonationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConfig', () => {
    it('throws when config already exists for purpose', async () => {
      mockDb.query.mockResolvedValue({
        items: [{ id: 'cfg-1', purpose: DonationPurpose.GENERAL }],
      });

      await expect(
        service.createConfig({
          purpose: DonationPurpose.GENERAL,
          title: { en: 'General' },
          suggestedAmounts: [],
          minimumAmount: 100,
          allowCustomAmount: true,
          isActive: true,
          displayOrder: 0,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates config successfully', async () => {
      mockDb.query.mockResolvedValue({ items: [] });
      mockDb.put.mockResolvedValue(undefined);

      const result = await service.createConfig({
        purpose: DonationPurpose.GENERAL,
        title: { en: 'General' },
        suggestedAmounts: [],
        minimumAmount: 100,
        allowCustomAmount: true,
        isActive: true,
        displayOrder: 1,
      } as any);

      expect(result.purpose).toBe(DonationPurpose.GENERAL);
      expect(mockDb.put).toHaveBeenCalled();
    });
  });

  describe('findAllConfigs', () => {
    it('returns only active configs when activeOnly is true', async () => {
      mockDb.query.mockResolvedValue({
        items: [
          { id: 'c1', isActive: true, displayOrder: 2 },
          { id: 'c2', isActive: false, displayOrder: 1 },
        ],
      });

      const result = await service.findAllConfigs(true);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c1');
    });
  });

  describe('createDonation', () => {
    it('creates donation and stores in db', async () => {
      mockDb.put.mockResolvedValue(undefined);
      jest.spyOn(service as any, 'generateDonationNumber').mockResolvedValue('DON-2026-0001');

      const result = await service.createDonation({
        amount: 500,
        purpose: DonationPurpose.GENERAL,
        donationType: DonationType.ONE_TIME,
        donorName: 'Donor',
        donorEmail: 'donor@example.com',
      } as any);

      expect(result.amount).toBe(500);
      expect(result.status).toBe(DonationStatus.PENDING);
      expect(mockDb.put).toHaveBeenCalled();
    });
  });

  describe('createRazorpayOrder', () => {
    it('creates donation and returns order data', async () => {
      jest.spyOn(service, 'createDonation').mockResolvedValue({
        id: 'don-1',
        amount: 100,
      } as any);
      jest.spyOn(service, 'updateDonation').mockResolvedValue({
        id: 'don-1',
        amount: 100,
      } as any);

      const result = await service.createRazorpayOrder({
        amount: 100,
        purpose: DonationPurpose.GENERAL,
        donorName: 'Donor',
        donorEmail: 'donor@example.com',
      } as any);

      expect(result.orderId).toMatch(/^order_/);
      expect(result.donationId).toBe('don-1');
      expect(result.amount).toBe(10000);
    });
  });

  describe('verifyPayment', () => {
    it('throws when signature is invalid', async () => {
      await expect(
        service.verifyPayment({
          donationId: 'don-1',
          razorpayOrderId: 'order-1',
          razorpayPaymentId: 'pay-1',
          razorpaySignature: 'invalid',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates donation and sends receipt when signature is valid', async () => {
      const orderId = 'order-1';
      const paymentId = 'pay-1';
      const signature = crypto
        .createHmac('sha256', 'secret')
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const updateSpy = jest.spyOn(service, 'updateDonation').mockResolvedValue({
        id: 'don-1',
        amount: 500,
        status: DonationStatus.COMPLETED,
      } as any);

      const receiptSpy = jest
        .spyOn(service as any, 'sendDonationReceipt')
        .mockResolvedValue(undefined);

      const result = await service.verifyPayment({
        donationId: 'don-1',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      } as any);

      expect(updateSpy).toHaveBeenCalled();
      expect(receiptSpy).toHaveBeenCalled();
      expect(result.status).toBe(DonationStatus.COMPLETED);
    });
  });
});
