import { render, screen, waitFor } from '@testing-library/react';
import SubscriptionDashboardPage from '../page';
import { useAuth } from '@/lib/useAuth';
import { fetchMySubscription, fetchSubscriptionPlans } from '@/lib/api';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  fetchMySubscription: jest.fn(),
  fetchSubscriptionPlans: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SubscriptionDashboardPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders current subscription details', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { name: 'User', role: 'user' },
      accessToken: 'token-1',
      isAuthenticated: true,
      isLoading: false,
    });

    (fetchMySubscription as jest.Mock).mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
      planName: 'Monthly Plan',
      status: 'active',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-03-01T00:00:00.000Z',
      autoRenew: true,
      amount: 199,
      currency: 'INR',
      features: ['Feature 1'],
    });

    (fetchSubscriptionPlans as jest.Mock).mockResolvedValue([]);

    render(<SubscriptionDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/My Subscription/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Monthly Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Benefits/i)).toBeInTheDocument();
  });

  it('shows plans when no active subscription', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { name: 'User', role: 'user' },
      accessToken: 'token-1',
      isAuthenticated: true,
      isLoading: false,
    });

    (fetchMySubscription as jest.Mock).mockResolvedValue(null);
    (fetchSubscriptionPlans as jest.Mock).mockResolvedValue([
      { id: 'plan-1', name: 'Basic', price: 99, interval: 'month', isActive: true },
    ]);

    render(<SubscriptionDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/No Active Subscription/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Basic/i)).toBeInTheDocument();
  });

  it('redirects when not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(<SubscriptionDashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/dashboard/subscription');
    });
  });
});
