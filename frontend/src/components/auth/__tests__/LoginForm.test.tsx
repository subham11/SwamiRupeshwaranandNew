import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.welcomeBack': 'Welcome Back',
        'auth.login': 'Login',
        'auth.loginWithOtp': 'Login with OTP',
        'auth.loginWithPassword': 'Login with Password',
        'auth.enterEmailOtp': 'Enter your email to receive a one-time password',
        'auth.enterEmailPassword': 'Enter your email and password to login',
        'auth.emailAddress': 'Email Address',
        'auth.emailPlaceholder': 'Enter your email',
        'auth.password': 'Password',
        'auth.passwordPlaceholder': 'Enter your password',
        'auth.sendOtp': 'Send OTP',
        'auth.sendingOtp': 'Sending OTP...',
        'auth.loggingIn': 'Logging in...',
        'auth.loginWithOtpInstead': 'Login with OTP instead',
        'auth.loginWithPasswordInstead': 'Login with password instead',
        'auth.forgotPassword': 'Forgot your password?',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/i18n/i18n.client', () => ({
  initI18nClient: jest.fn(),
}));

// Mock useAuth hook
const mockRequestOtp = jest.fn();
const mockLoginWithPassword = jest.fn();
const mockClearError = jest.fn();

let mockError: string | null = null;
let mockIsLoading = false;

jest.mock('@/lib/useAuth', () => ({
  useAuth: () => ({
    requestOtp: mockRequestOtp,
    loginWithPassword: mockLoginWithPassword,
    isLoading: mockIsLoading,
    error: mockError,
    clearError: mockClearError,
    otpSent: false,
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestOtp.mockResolvedValue({ success: true });
    mockLoginWithPassword.mockResolvedValue({ success: true });
    mockError = null;
    mockIsLoading = false;
  });

  describe('Rendering', () => {
    it('renders email input and OTP button by default', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login with password instead/i })).toBeInTheDocument();
    });

    it('shows welcome message', () => {
      render(<LoginForm />);
      
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('shows password mode description when toggled', () => {
      render(<LoginForm />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      expect(screen.getByText(/enter your email and password to login/i)).toBeInTheDocument();
    });
  });

  describe('OTP Login Mode', () => {
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

    it('calls onOtpSent callback when OTP is sent successfully', async () => {
      const onOtpSent = jest.fn();
      render(<LoginForm onOtpSent={onOtpSent} />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const form = emailInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(onOtpSent).toHaveBeenCalled();
      });
    });
  });

  describe('Password Login Mode', () => {
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
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const form = emailInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(mockLoginWithPassword).toHaveBeenCalledWith('test@example.com', 'TestPassword123!');
      });
    });

    it('calls onLoginSuccess callback when login is successful', async () => {
      const onLoginSuccess = jest.fn();
      render(<LoginForm onLoginSuccess={onLoginSuccess} />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const form = emailInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(onLoginSuccess).toHaveBeenCalled();
      });
    });

    it('does not call onLoginSuccess when login fails', async () => {
      mockLoginWithPassword.mockResolvedValue({ success: false, error: 'Invalid credentials' });
      const onLoginSuccess = jest.fn();
      render(<LoginForm onLoginSuccess={onLoginSuccess} />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'WrongPassword123!' } });
      
      const form = emailInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(mockLoginWithPassword).toHaveBeenCalled();
      });
      
      expect(onLoginSuccess).not.toHaveBeenCalled();
    });

    it('handles password with special characters', async () => {
      render(<LoginForm />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const specialPassword = 'P@$$w0rd!#$%^&*()';
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: specialPassword } });
      
      const form = emailInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(mockLoginWithPassword).toHaveBeenCalledWith('test@example.com', specialPassword);
      });
    });

    it('handles email with uppercase characters', async () => {
      render(<LoginForm />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'TEST@EXAMPLE.COM' } });
      
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const form = emailInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(mockLoginWithPassword).toHaveBeenCalledWith('TEST@EXAMPLE.COM', 'TestPassword123!');
      });
    });

    it('clears password field when switching back to OTP mode', () => {
      render(<LoginForm />);
      
      // Switch to password mode
      const toggleToPassword = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleToPassword);
      
      // Enter password
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      expect(passwordInput).toHaveValue('TestPassword123!');
      
      // Switch back to OTP mode
      const toggleToOtp = screen.getByRole('button', { name: /login with otp instead/i });
      fireEvent.click(toggleToOtp);
      
      // Switch back to password mode - password should be cleared
      fireEvent.click(screen.getByRole('button', { name: /login with password instead/i }));
      const newPasswordInput = screen.getByLabelText(/password/i);
      expect(newPasswordInput).toHaveValue('');
    });
  });

  describe('Forgot Password', () => {
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

    it('does not show forgot password link in OTP mode', () => {
      const onForgotPassword = jest.fn();
      render(<LoginForm onForgotPassword={onForgotPassword} />);
      
      expect(screen.queryByText(/forgot your password/i)).not.toBeInTheDocument();
    });

    it('does not show forgot password link if callback not provided', () => {
      render(<LoginForm />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      expect(screen.queryByText(/forgot your password/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('clears error when mode is toggled', () => {
      render(<LoginForm />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      expect(mockClearError).toHaveBeenCalled();
    });

    it('clears error before submitting in password mode', async () => {
      render(<LoginForm />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      // Clear the mock calls from toggle
      mockClearError.mockClear();
      
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
      
      const form = emailInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    it('requires email field', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeRequired();
    });

    it('requires password field in password mode', () => {
      render(<LoginForm />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeRequired();
    });

    it('validates email format', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('has minimum password length requirement', () => {
      render(<LoginForm />);
      
      const toggleButton = screen.getByRole('button', { name: /login with password instead/i });
      fireEvent.click(toggleButton);
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('minLength', '8');
    });
  });

  describe('Button State', () => {
    it('disables submit button when email is empty', () => {
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /send otp/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when email is provided', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send otp/i });
      expect(submitButton).not.toBeDisabled();
    });
  });
});
