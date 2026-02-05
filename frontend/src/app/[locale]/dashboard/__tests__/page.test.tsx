import { render, screen, fireEvent } from '@testing-library/react';
import DashboardPage from '../page';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('DashboardPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('navigates to subscription dashboard when tab is clicked', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { name: 'User', email: 'user@example.com', hasPassword: true, isVerified: true },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      logout: jest.fn(),
      setPassword: jest.fn(),
      clearError: jest.fn(),
    });

    render(<DashboardPage />);

    const tabButton = screen.getByRole('button', { name: /subscription/i });
    fireEvent.click(tabButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/subscription');
  });
});
