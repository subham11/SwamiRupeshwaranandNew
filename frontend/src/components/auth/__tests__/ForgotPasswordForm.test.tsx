import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordForm from '../ForgotPasswordForm';

// Mock useAuth hook
const mockForgotPassword = jest.fn();
const mockResetPassword = jest.fn();
const mockClearError = jest.fn();
const mockClearOtpState = jest.fn();

jest.mock('@/lib/useAuth', () => ({
  useAuth: () => ({
    forgotPassword: mockForgotPassword,
    resetPassword: mockResetPassword,
    isLoading: false,
    error: null,
    clearError: mockClearError,
    clearOtpState: mockClearOtpState,
    otpSent: false,
    otpEmail: null,
  }),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForgotPassword.mockResolvedValue({ success: true });
    mockResetPassword.mockResolvedValue({ success: true });
  });

  it('renders email input initially', () => {
    render(<ForgotPasswordForm />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset otp/i })).toBeInTheDocument();
  });

  it('calls forgotPassword when email form is submitted', async () => {
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the form directly
    const form = emailInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('clears error on form submit', async () => {
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const form = emailInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  it('shows forgot password heading', () => {
    render(<ForgotPasswordForm />);
    
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('shows email placeholder', () => {
    render(<ForgotPasswordForm />);
    
    expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
  });
});
