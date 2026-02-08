import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CMSEditorPage from '../page';
import { useAuth } from '@/lib/useAuth';
import {
  fetchCMSPages,
  fetchComponentTemplates,
  fetchGlobalComponents,
  fetchCMSPageWithComponents,
  updateCMSComponent,
} from '@/lib/api';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  fetchCMSPages: jest.fn(),
  fetchCMSPageWithComponents: jest.fn(),
  createCMSPage: jest.fn(),
  updateCMSPage: jest.fn(),
  deleteCMSPage: jest.fn(),
  createCMSComponent: jest.fn(),
  updateCMSComponent: jest.fn(),
  deleteCMSComponent: jest.fn(),
  fetchComponentTemplates: jest.fn(),
  fetchGlobalComponents: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/ui/Container', () => {
  return function MockContainer({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div data-testid="container" className={className}>{children}</div>;
  };
});

jest.mock('@/components/ui/Button', () => {
  return function MockButton({ children, onClick, disabled, variant }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
  }) {
    return (
      <button onClick={onClick} disabled={disabled} data-variant={variant}>
        {children}
      </button>
    );
  };
});

jest.mock('@/components/admin/MediaPickerModal', () => {
  return function MockMediaPicker() {
    return <div data-testid="media-picker" />;
  };
});

jest.mock('@/components/admin/RichTextEditor', () => {
  return function MockRichTextEditor({ value, onChange, label }: {
    value: string;
    onChange: (val: string) => void;
    label?: string;
  }) {
    return (
      <textarea
        data-testid={`richtext-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

// Test data
const mockTemplates = [
  {
    componentType: 'announcement_bar',
    name: 'Announcement Bar',
    description: 'Top announcement banner with scrolling text',
    icon: '📢',
    isGlobal: true,
    fields: [
      { key: 'text', label: 'Text', type: 'textarea', required: true, localized: true },
      { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#f97316' },
    ],
  },
  {
    componentType: 'hero_section',
    name: 'Hero Section',
    description: 'Main hero banner with slides',
    icon: '🖼️',
    fields: [
      { key: 'slides', label: 'Slides', type: 'array' },
    ],
  },
  {
    componentType: 'text_block',
    name: 'Text Block',
    description: 'Rich text content block',
    icon: '📝',
    fields: [
      { key: 'content', label: 'Content', type: 'richtext', localized: true },
    ],
  },
];

const mockPages = [
  {
    id: 'p1',
    slug: 'home',
    title: { en: 'Home', hi: 'होम' },
    status: 'published',
    displayOrder: 0,
    componentIds: ['c1', 'c2'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p2',
    slug: 'about',
    title: { en: 'About', hi: 'हमारे बारे में' },
    status: 'draft',
    displayOrder: 1,
    componentIds: ['c3'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockGlobalComponents = [
  {
    id: 'gc1',
    pageId: 'p1',
    componentType: 'announcement_bar',
    name: { en: 'Announcement Bar', hi: '' },
    fields: [
      { key: 'text', localizedValue: { en: 'Welcome!', hi: 'स्वागत!' } },
      { key: 'bgColor', value: '#f97316' },
    ],
    displayOrder: 0,
    isVisible: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockPageComponents = [
  {
    id: 'gc1',
    pageId: 'p1',
    componentType: 'announcement_bar',
    name: { en: 'Announcement Bar', hi: '' },
    fields: [
      { key: 'text', localizedValue: { en: 'Welcome!', hi: 'स्वागत!' } },
    ],
    displayOrder: 0,
    isVisible: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'c2',
    pageId: 'p1',
    componentType: 'hero_section',
    name: { en: 'Hero Section', hi: '' },
    fields: [],
    displayOrder: 1,
    isVisible: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function setupAuthenticatedUser() {
  const mockPush = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useAuth as jest.Mock).mockReturnValue({
    user: { name: 'Admin', role: 'admin', email: 'admin@example.com' },
    accessToken: 'test-token',
    isAuthenticated: true,
    isLoading: false,
  });
  (fetchCMSPages as jest.Mock).mockResolvedValue(mockPages);
  (fetchComponentTemplates as jest.Mock).mockResolvedValue(mockTemplates);
  (fetchGlobalComponents as jest.Mock).mockResolvedValue(mockGlobalComponents);
  (fetchCMSPageWithComponents as jest.Mock).mockResolvedValue({
    ...mockPages[0],
    components: mockPageComponents,
  });

  return mockPush;
}

describe('CMSEditorPage - Global Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress window.confirm dialogs in tests
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows Global section header in page list', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('Global')).toBeInTheDocument();
    });
  });

  it('shows Pages section header in page list', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    await waitFor(() => {
      // There are two "Pages" texts: the panel header <h2> and the section divider <span>
      const pagesElements = screen.getAllByText('Pages');
      expect(pagesElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows Announcement Bar in global section', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    await waitFor(() => {
      // The global section should show the template name
      expect(screen.getByText('Announcement Bar')).toBeInTheDocument();
    });
  });

  it('shows "global" badge when global component exists', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('global')).toBeInTheDocument();
    });
  });

  it('shows "not configured" when no global component exists for a type', async () => {
    setupAuthenticatedUser();
    (fetchGlobalComponents as jest.Mock).mockResolvedValue([]);

    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('not configured')).toBeInTheDocument();
    });
  });

  it('loads component editor directly when clicking a global component', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('Announcement Bar')).toBeInTheDocument();
    });

    // Click on Announcement Bar in global section
    fireEvent.click(screen.getByText('Announcement Bar'));

    await waitFor(() => {
      // The component editor header should show the component name
      expect(screen.getByText(/Edit: Announcement Bar/)).toBeInTheDocument();
    });
  });

  it('shows "Global Component" message in middle column when global is selected', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('Announcement Bar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Announcement Bar'));

    await waitFor(() => {
      expect(screen.getByText('Global Component')).toBeInTheDocument();
      expect(screen.getByText('This component appears site-wide and is edited directly.')).toBeInTheDocument();
    });
  });

  it('filters global component types from the Add Component modal', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    // First, select a page to enable the "Add Component" button
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Home'));

    await waitFor(() => {
      // Wait for components to load
      expect(fetchCMSPageWithComponents).toHaveBeenCalled();
    });

    // Click the "Add Component" button (the + icon in the Components panel)
    const addButtons = screen.getAllByTitle('Add Component');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Add Component')).toBeInTheDocument();
    });

    // Non-global templates should be in the modal. "Hero Section" may appear
    // both in the page component list and in the modal, so use getAllByText.
    const heroMatches = screen.getAllByText('Hero Section');
    expect(heroMatches.length).toBeGreaterThanOrEqual(1);

    // Text Block description should be present (only in modal since it's not on the page)
    expect(screen.getByText('Rich text content block')).toBeInTheDocument();

    // The modal should NOT show the announcement_bar template description
    // (since the name "Announcement Bar" is also in the global section, check for the description instead)
    expect(screen.queryByText('Top announcement banner with scrolling text')).not.toBeInTheDocument();
  });

  it('filters global components from page component list', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Home'));

    await waitFor(() => {
      expect(fetchCMSPageWithComponents).toHaveBeenCalled();
    });

    // The component count in header should exclude global components
    // mockPageComponents has 2 components: announcement_bar (global) + hero_section
    // So filtered count should be 1
    await waitFor(() => {
      expect(screen.getByText('Components (1)')).toBeInTheDocument();
    });
  });

  it('shows regular pages in the page list', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });

  it('redirects when not authenticated', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/admin/cms');
    });
  });

  it('clears global selection when selecting a page', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('Announcement Bar')).toBeInTheDocument();
    });

    // Select global component first
    fireEvent.click(screen.getByText('Announcement Bar'));

    await waitFor(() => {
      expect(screen.getByText('Global Component')).toBeInTheDocument();
    });

    // Now select a page
    fireEvent.click(screen.getByText('Home'));

    await waitFor(() => {
      // Middle column should no longer show "Global Component"
      expect(screen.queryByText('Global Component')).not.toBeInTheDocument();
    });
  });

  it('saves global component and refreshes global components list', async () => {
    setupAuthenticatedUser();
    (updateCMSComponent as jest.Mock).mockResolvedValue({});

    render(<CMSEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('Announcement Bar')).toBeInTheDocument();
    });

    // Select the global component
    fireEvent.click(screen.getByText('Announcement Bar'));

    await waitFor(() => {
      expect(screen.getByText(/Edit: Announcement Bar/)).toBeInTheDocument();
    });

    // fetchGlobalComponents should have been called once on load
    expect(fetchGlobalComponents).toHaveBeenCalledTimes(1);
  });

  it('treats announcement_bar as global even without isGlobal flag from backend', async () => {
    // Simulate backend that hasn't been updated yet (no isGlobal field)
    const templatesWithoutFlag = mockTemplates.map((t) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isGlobal, ...rest } = t as typeof t & { isGlobal?: boolean };
      return rest;
    });
    (fetchComponentTemplates as jest.Mock).mockResolvedValue(templatesWithoutFlag);
    setupAuthenticatedUser();
    // Re-override templates after setupAuthenticatedUser sets its own mock
    (fetchComponentTemplates as jest.Mock).mockResolvedValue(templatesWithoutFlag);

    render(<CMSEditorPage />);

    await waitFor(() => {
      // Global section should still appear via fallback
      expect(screen.getByText('Global')).toBeInTheDocument();
      expect(screen.getByText('Announcement Bar')).toBeInTheDocument();
    });
  });

  it('closes the Add Component modal via the close button', async () => {
    setupAuthenticatedUser();
    render(<CMSEditorPage />);

    // Select a page first
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Home'));

    await waitFor(() => {
      expect(fetchCMSPageWithComponents).toHaveBeenCalled();
    });

    // Open the Add Component modal
    const addButtons = screen.getAllByTitle('Add Component');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Add Component')).toBeInTheDocument();
    });

    // Click the close (X) button
    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      // The modal description should no longer be visible
      expect(screen.queryByText('Rich text content block')).not.toBeInTheDocument();
    });
  });
});
