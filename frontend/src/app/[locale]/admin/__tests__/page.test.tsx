import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboardPage from '../page';
import { useAuth } from '@/lib/useAuth';
import { fetchNewsletterStats, fetchDonationStats, fetchSupportStats } from '@/lib/api';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  fetchNewsletterStats: jest.fn(),
  fetchDonationStats: jest.fn(),
  fetchSupportStats: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('AdminDashboardPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders stats for admin user', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { name: 'Admin', role: 'admin', email: 'admin@example.com' },
      accessToken: 'token-1',
      isAuthenticated: true,
      isLoading: false,
    });

    (fetchNewsletterStats as jest.Mock).mockResolvedValue({
      activeSubscribers: 10,
      thirtyDayGrowth: 3,
      totalCampaignsSent: 2,
    });
    (fetchDonationStats as jest.Mock).mockResolvedValue({
      thisMonthAmount: 5000,
      totalDonations: 8,
      lastMonthAmount: 2000,
      donorCount: 4,
      recurringDonors: 1,
      averageDonation: 600,
    });
    (fetchSupportStats as jest.Mock).mockResolvedValue({
      openTickets: 2,
      inProgressTickets: 1,
      totalTickets: 5,
      resolvedTickets: 2,
      ticketsThisWeek: 3,
      ticketsLastWeek: 2,
      averageResolutionTime: 4,
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Active Subscribers/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Tickets/i)).toBeInTheDocument();
    expect(screen.getAllByText(/This Month/i).length).toBeGreaterThan(0);
  });

  it('redirects when not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/admin');
    });
  });
});
