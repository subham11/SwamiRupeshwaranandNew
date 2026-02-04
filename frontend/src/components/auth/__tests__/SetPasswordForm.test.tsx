import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SetPasswordForm from '../SetPasswordForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.setPassword': 'Set Password',
        'auth.setPasswordDesc': 'Create a password for faster login next time',
        'auth.newPassword': 'Password',
        'auth.confirmPassword': 'Confirm Password',
        'auth.settingPassword': 'Setting password...',
        'auth.skipForNow': 'Skip for now',
        'auth.passwordsMatch': 'Passwords match',
        'auth.passwordsDoNotMatch': 'Passwords do not match',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/i18n/i18n.client', () => ({
  initI18nClient: jest.fn(),
}));

// Mock useAuth hook
const mockSetPassword = jest.fn();
const mockClearError = jest.fn();

jest.mock('@/lib/useAuth', () => ({
  useAuth: () => ({
    setPassword: mockSetPassword,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  }),
}));

describe('SetPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetPassword.mockResolvedValue({ success: true });
  });

  it('renders password and confirm password inputs', () => {
    render(<SetPasswordForm />);
    
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows set password button', () => {
    render(<SetPasswordForm />);
    
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
  });

  it('shows password requirements', () => {
    render(<SetPasswordForm />);
    
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/contains uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/contains lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/contains a number/i)).toBeInTheDocument();
    expect(screen.getByText(/contains special character/i)).toBeInTheDocument();
  });

  it('shows passwords match message when passwords match', () => {
    render(<SetPasswordForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'SecurePassword123!' } });
    
    expect(screen.getByText(/passwords match/i)).toBeInTheDocument();
  });

  it('shows passwords do not match message when different', () => {
    render(<SetPasswordForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword123!' } });
    
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('calls setPassword when form is submitted with valid data', async () => {
    render(<SetPasswordForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'SecurePassword123!' } });
    
    const form = passwordInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mockSetPassword).toHaveBeenCalledWith('SecurePassword123!', 'SecurePassword123!');
    });
  });

  it('calls onSuccess callback when password is set successfully', async () => {
    const onSuccess = jest.fn();
    render(<SetPasswordForm onSuccess={onSuccess} />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'SecurePassword123!' } });
    
    const form = passwordInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows heading', () => {
    render(<SetPasswordForm />);
    
    // Heading uses 'Set Password' text (same as button), check for h2
    expect(screen.getByRole('heading', { name: /set password/i })).toBeInTheDocument();
  });

  it('has toggle password visibility button', () => {
    render(<SetPasswordForm />);
    
    // The toggle button is inside password field - there should be a button element
    const buttons = screen.getAllByRole('button');
    // One for toggle, one for submit
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
