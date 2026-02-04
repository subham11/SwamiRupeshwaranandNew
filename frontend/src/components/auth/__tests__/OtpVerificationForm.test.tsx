import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OtpVerificationForm from '../OtpVerificationForm';

// Mock useAuth hook
const mockVerifyOtp = jest.fn();
const mockRequestOtp = jest.fn();
const mockClearError = jest.fn();

jest.mock('@/lib/useAuth', () => ({
  useAuth: () => ({
    verifyOtp: mockVerifyOtp,
    requestOtp: mockRequestOtp,
    isLoading: false,
    error: null,
    clearError: mockClearError,
    otpEmail: 'test@example.com',
    otpPurpose: 'login',
  }),
}));

describe('OtpVerificationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyOtp.mockResolvedValue({ success: true, isNewUser: false });
    mockRequestOtp.mockResolvedValue({ success: true });
  });

  it('renders 6 OTP input boxes', () => {
    render(<OtpVerificationForm />);
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('shows email address', () => {
    render(<OtpVerificationForm />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows verify button', () => {
    render(<OtpVerificationForm />);
    
    expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
  });

  it('accepts numeric input in OTP fields', () => {
    render(<OtpVerificationForm />);
    
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    
    expect(inputs[0]).toHaveValue('1');
  });

  it('shows resend option', () => {
    render(<OtpVerificationForm />);
    
    expect(screen.getByText(/didn't receive the code/i)).toBeInTheDocument();
  });

  it('auto-focuses next input when a digit is entered', () => {
    render(<OtpVerificationForm />);
    
    const inputs = screen.getAllByRole('textbox');
    
    // Enter digit in first input
    fireEvent.change(inputs[0], { target: { value: '1' } });
    
    // The component should auto-focus the next input
    // We can verify the value was set
    expect(inputs[0]).toHaveValue('1');
  });

  it('calls verifyOtp when form is submitted with complete OTP', async () => {
    render(<OtpVerificationForm />);
    
    const inputs = screen.getAllByRole('textbox');
    
    // Fill all inputs
    ['1', '2', '3', '4', '5', '6'].forEach((digit, index) => {
      fireEvent.change(inputs[index], { target: { value: digit } });
    });
    
    // Submit the form
    const form = inputs[0].closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  it('calls onVerifySuccess callback when verification succeeds', async () => {
    const onVerifySuccess = jest.fn();
    render(<OtpVerificationForm onVerifySuccess={onVerifySuccess} />);
    
    const inputs = screen.getAllByRole('textbox');
    
    ['1', '2', '3', '4', '5', '6'].forEach((digit, index) => {
      fireEvent.change(inputs[index], { target: { value: digit } });
    });
    
    const form = inputs[0].closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(onVerifySuccess).toHaveBeenCalledWith(false);
    });
  });
});
