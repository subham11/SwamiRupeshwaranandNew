import { Test, TestingModule } from '@nestjs/testing';
import { SupportController } from '../support.controller';
import { SupportService } from '../support.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TicketStatus } from '../dto';

describe('SupportController', () => {
  let controller: SupportController;

  const mockSupportService = {
    createTicket: jest.fn(),
    findTicketsByUser: jest.fn(),
    findTicketWithReplies: jest.fn(),
    createReply: jest.fn(),
    findAllTickets: jest.fn(),
    updateTicket: jest.fn(),
    deleteTicket: jest.fn(),
    getStats: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
  const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        {
          provide: SupportService,
          useValue: mockSupportService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<SupportController>(SupportController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates guest ticket', async () => {
    const dto = { subject: 'Help', message: 'Need help' };
    mockSupportService.createTicket.mockResolvedValue({ id: 't1' });

    const result = await controller.createGuestTicket(dto as any);

    expect(result.id).toBe('t1');
    expect(mockSupportService.createTicket).toHaveBeenCalledWith(dto);
  });

  it('returns current user tickets', async () => {
    mockSupportService.findTicketsByUser.mockResolvedValue([{ id: 't1' }]);

    const result = await controller.findMyTickets({ sub: 'user-1' } as any);

    expect(result).toHaveLength(1);
    expect(mockSupportService.findTicketsByUser).toHaveBeenCalledWith('user-1');
  });

  it('filters internal replies for user ticket', async () => {
    mockSupportService.findTicketWithReplies.mockResolvedValue({
      id: 't1',
      userId: 'user-1',
      internalNotes: 'internal',
      replies: [
        { id: 'r1', isInternal: true },
        { id: 'r2', isInternal: false },
      ],
    });

    const result = await controller.findMyTicketById('t1', { sub: 'user-1' } as any);

    expect(result?.internalNotes).toBeUndefined();
    expect(result?.replies).toHaveLength(1);
  });

  it('updates ticket status', async () => {
    mockSupportService.updateTicket.mockResolvedValue({ id: 't1', status: TicketStatus.RESOLVED });

    const result = await controller.updateTicket('t1', { status: TicketStatus.RESOLVED } as any);

    expect(result.status).toBe(TicketStatus.RESOLVED);
    expect(mockSupportService.updateTicket).toHaveBeenCalledWith('t1', {
      status: TicketStatus.RESOLVED,
    });
  });

  it('returns stats', async () => {
    mockSupportService.getStats.mockResolvedValue({ totalTickets: 5 });

    const result = await controller.getStats();

    expect(result.totalTickets).toBe(5);
    expect(mockSupportService.getStats).toHaveBeenCalled();
  });
});
