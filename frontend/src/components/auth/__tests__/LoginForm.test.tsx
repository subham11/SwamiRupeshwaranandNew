import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../LoginForm';

// Mock useAuth hook
const mockRequestOtp = jest.fn();
const mockLoginWithPassword = jest.fn();
const mockClearError = jest.fn();

jest.mock('@/lib/useAuth', () => ({
  useAuth: () => ({
    requestOtp: mockRequestOtp,
    loginWithPassword: mockLoginWithPassword,
    isLoading: false,
    error: null,
    clearError: mockClearError,
    otpSent: false,
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestOtp.mockResolvedValue({ success: true });
    mockLoginWithPassword.mockResolvedValue({ success: true });
  });

  it('renders email input and OTP button by default', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login with password instead/i })).toBeInTheDocument();
  });

  it('calls requestOtp when form is submitted in OTP mode', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const form = emailInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('toggles to password mode when toggle button is clicked', () => {
    render(<LoginForm />);
    
    const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
    fireEvent.click(toggleButton);
    
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login with otp instead/i })).toBeInTheDocument();
  });

  it('calls loginWithPassword when form is submitted in password mode', async () => {
    render(<LoginForm />);
    
    const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
    fireEvent.click(toggleButton);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'Test123!' } });
    
    const form = emailInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mockLoginWithPassword).toHaveBeenCalledWith('test@example.com', 'Test123!');
    });
  });

  it('shows forgot password link when in password mode', () => {
    const onForgotPassword = jest.fn();
    render(<LoginForm onForgotPassword={onForgotPassword} />);
    
    const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
    fireEvent.click(toggleButton);
    
    const forgotLink = screen.getByText(/forgot your password/i);
    expect(forgotLink).toBeInTheDocument();
    
    fireEvent.click(forgotLink);
    expect(onForgotPassword).toHaveBeenCalled();
  });

  it('clears error when mode is toggled', () => {
    render(<LoginForm />);
    
    const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
    fireEvent.click(toggleButton);
    
    expect(mockClearError).toHaveBeenCalled();
  });

  it('shows welcome message', () => {
    render(<LoginForm />);
    
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });
});
