'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

// ============================================
// Documentation Sections Configuration
// ============================================

interface DocSection {
  id: string;
  title: string;
  icon: string;
  subsections: { id: string; title: string }[];
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '\uD83D\uDE80',
    subsections: [
      { id: 'overview', title: 'Platform Overview' },
      { id: 'admin-roles', title: 'Admin Roles & Permissions' },
      { id: 'dashboard', title: 'Admin Dashboard' },
    ],
  },
  {
    id: 'products',
    title: 'Products Management',
    icon: '\uD83D\uDED2',
    subsections: [
      { id: 'products-overview', title: 'Overview' },
      { id: 'add-product', title: 'Adding a New Product' },
      { id: 'product-images', title: 'Product Images & Media' },
      { id: 'product-pricing', title: 'Pricing & Stock' },
      { id: 'product-categories', title: 'Categories Management' },
      { id: 'product-bilingual', title: 'Hindi & English Content' },
    ],
  },
  {
    id: 'cms',
    title: 'CMS (Content Editor)',
    icon: '\uD83D\uDCDD',
    subsections: [
      { id: 'cms-overview', title: 'How CMS Works' },
      { id: 'cms-pages', title: 'Creating & Managing Pages' },
      { id: 'cms-components', title: 'Adding Components' },
      { id: 'cms-component-types', title: 'Component Types Reference' },
      { id: 'cms-global', title: 'Global Components' },
      { id: 'cms-publishing', title: 'Publishing & Preview' },
    ],
  },
  {
    id: 'payments',
    title: 'Razorpay & Payments',
    icon: '\uD83D\uDCB3',
    subsections: [
      { id: 'razorpay-setup', title: 'Setting Up Razorpay' },
      { id: 'razorpay-test-mode', title: 'Test Mode vs Live Mode' },
      { id: 'razorpay-keys', title: 'API Keys Configuration' },
      { id: 'razorpay-webhook', title: 'Webhook Setup' },
      { id: 'payment-flow', title: 'How Payments Work' },
      { id: 'payment-troubleshoot', title: 'Troubleshooting Payments' },
    ],
  },
  {
    id: 'orders',
    title: 'Orders Management',
    icon: '\uD83D\uDCE6',
    subsections: [
      { id: 'orders-overview', title: 'Order Lifecycle' },
      { id: 'orders-status', title: 'Order Statuses' },
      { id: 'orders-tracking', title: 'Tracking & Fulfillment' },
    ],
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    icon: '\uD83D\uDCB3',
    subsections: [
      { id: 'sub-plans', title: 'Subscription Plans' },
      { id: 'sub-autopay', title: 'UPI Autopay Setup' },
      { id: 'sub-management', title: 'Managing Subscribers' },
    ],
  },
  {
    id: 'media',
    title: 'Media Library',
    icon: '\uD83D\uDDBC\uFE0F',
    subsections: [
      { id: 'media-upload', title: 'Uploading Files' },
      { id: 'media-folders', title: 'Folders & Organization' },
      { id: 'media-formats', title: 'Supported Formats' },
    ],
  },
  {
    id: 'other',
    title: 'Other Modules',
    icon: '\uD83D\uDCCB',
    subsections: [
      { id: 'newsletter', title: 'Newsletter & Campaigns' },
      { id: 'donations', title: 'Donations Configuration' },
      { id: 'events', title: 'Events Management' },
      { id: 'support', title: 'Support Tickets' },
      { id: 'users', title: 'User Management' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings & Config',
    icon: '\u2699\uFE0F',
    subsections: [
      { id: 'settings-razorpay', title: 'Razorpay Key Management' },
      { id: 'settings-deployment', title: 'Deployment & Updates' },
      { id: 'settings-env', title: 'Environment Variables' },
    ],
  },
];

// ============================================
// Reusable Doc Components
// ============================================

function InfoBox({ type = 'info', title, children }: { type?: 'info' | 'warning' | 'success' | 'danger'; title?: string; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  };
  const icons = { info: '\u2139\uFE0F', warning: '\u26A0\uFE0F', success: '\u2705', danger: '\u274C' };

  return (
    <div className={`my-4 p-4 border rounded-lg ${styles[type]}`}>
      {title && <p className="font-semibold mb-1">{icons[type]} {title}</p>}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function StepList({ steps }: { steps: { title: string; description: string; screenshot?: string }[] }) {
  return (
    <div className="my-6 space-y-4">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">
            {i + 1}
          </div>
          <div className="flex-1 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{step.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
            {step.screenshot && (
              <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{'\uD83D\uDCF7'}</span>
                  <span className="italic">{step.screenshot}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldTable({ fields }: { fields: { name: string; type: string; required: boolean; description: string }[] }) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Field</th>
            <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Type</th>
            <th className="px-4 py-2.5 text-center font-semibold text-gray-700 dark:text-gray-300">Required</th>
            <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f, i) => (
            <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
              <td className="px-4 py-2 font-mono text-xs text-orange-600 dark:text-orange-400">{f.name}</td>
              <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{f.type}</td>
              <td className="px-4 py-2 text-center">{f.required ? <span className="text-red-500">*</span> : <span className="text-gray-300">-</span>}</td>
              <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {title && (
        <div className="px-4 py-2 bg-gray-800 text-gray-400 text-xs font-mono">{title}</div>
      )}
      <pre className="p-4 bg-gray-900 text-green-400 text-xs overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 scroll-mt-20">
      {children}
    </h2>
  );
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-3 scroll-mt-20">
      {children}
    </h3>
  );
}

// ============================================
// Main Help Page Component
// ============================================

export default function AdminHelpPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/en/login?redirect=/en/admin/help');
    }
  }, [isLoading, isAuthenticated, router]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = DOC_SECTIONS.flatMap(s => [s.id, ...s.subsections.map(sub => sub.id)]);
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 100) {
          const parentSection = DOC_SECTIONS.find(s => s.id === id || s.subsections.some(sub => sub.id === id));
          if (parentSection) setActiveSection(parentSection.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false);
    }
  };

  // Search filtering
  const filteredSections = searchQuery
    ? DOC_SECTIONS.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.subsections.some((sub) => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : DOC_SECTIONS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <Link href="/en/admin" className="text-gray-500 hover:text-orange-600 text-sm">
                  {'\u2190'} Admin
                </Link>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {'\uD83D\uDCD6'} Admin Help Center
                </h1>
              </div>
            </div>
            {/* Search */}
            <div className="hidden sm:block relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="w-72 pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 z-30 w-72 h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4 space-y-1">
            {filteredSections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => {
                    setActiveSection(section.id);
                    scrollTo(section.id);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    activeSection === section.id
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </button>
                {activeSection === section.id && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {section.subsections
                      .filter(
                        (sub) =>
                          !searchQuery ||
                          sub.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => scrollTo(sub.id)}
                          className="w-full text-left px-3 py-1.5 rounded text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                          {sub.title}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main ref={contentRef} className="flex-1 min-w-0 px-6 lg:px-12 py-8 max-w-4xl">

          {/* ══════════════════════════════════════════════
              SECTION: GETTING STARTED
              ══════════════════════════════════════════════ */}
          <SectionHeading id="getting-started">{'\uD83D\uDE80'} Getting Started</SectionHeading>

          <SubHeading id="overview">Platform Overview</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            The <strong>Bhairava Path</strong> admin panel lets you manage all aspects of the Swami Rupeshwaranand Ashram website.
            This includes products & e-commerce, CMS pages, subscriptions, donations, events, newsletter campaigns,
            support tickets, and media files.
          </p>

          <InfoBox type="info" title="Architecture">
            <p><strong>Frontend:</strong> Next.js on AWS Amplify (auto-deploys from GitHub)</p>
            <p><strong>Backend:</strong> NestJS on AWS Lambda via API Gateway</p>
            <p><strong>Database:</strong> DynamoDB (single-table design)</p>
            <p><strong>Storage:</strong> AWS S3 for images, videos, PDFs</p>
            <p><strong>Payments:</strong> Razorpay (subscriptions, orders, donations)</p>
            <p><strong>Auth:</strong> AWS Cognito (email OTP + password)</p>
          </InfoBox>

          <SubHeading id="admin-roles">Admin Roles & Permissions</SubHeading>
          <FieldTable
            fields={[
              { name: 'Super Admin', type: 'Role', required: false, description: 'Full access to everything including Settings, user role management, and destructive actions.' },
              { name: 'Admin', type: 'Role', required: false, description: 'Access to all content & management features. Cannot change Settings or other admin roles.' },
              { name: 'Content Editor', type: 'Role', required: false, description: 'Can manage CMS pages, events, content library, and media. Cannot access user management or settings.' },
              { name: 'User', type: 'Role', required: false, description: 'Regular website user. Can subscribe, purchase, donate, submit tickets.' },
            ]}
          />

          <InfoBox type="warning" title="Important">
            Only <strong>Super Admin</strong> can access the Settings page to update Razorpay keys, manage admin roles,
            and perform system configuration. Keep your Super Admin credentials secure.
          </InfoBox>

          <SubHeading id="dashboard">Admin Dashboard</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            The admin dashboard at <code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin</code> shows:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
            <li>Quick action cards linking to all admin modules</li>
            <li>Newsletter subscriber count and growth stats</li>
            <li>Donation totals and recent activity</li>
            <li>Support ticket overview and open count</li>
          </ul>

          {/* ══════════════════════════════════════════════
              SECTION: PRODUCTS
              ══════════════════════════════════════════════ */}
          <SectionHeading id="products">{'\uD83D\uDED2'} Products Management</SectionHeading>

          <SubHeading id="products-overview">Overview</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            The Products module manages your e-commerce catalog. Products belong to <strong>categories</strong> and
            are displayed on the respective category pages (Courses, Retreats, Astrology, Classes, Satsang, and Books & Merchandise).
          </p>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
            Navigate to <code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin/products</code> to access the products management interface.
            It has two tabs: <strong>Products</strong> and <strong>Categories</strong>.
          </p>

          <SubHeading id="add-product">Adding a New Product</SubHeading>
          <StepList
            steps={[
              {
                title: 'Go to Admin > Products',
                description: 'Navigate to /admin/products from the admin dashboard. You\'ll see the products list with a "+ Add Product" button at the top.',
                screenshot: 'Screenshot: Admin Products page with the blue "Add Product" button in the top-right corner',
              },
              {
                title: 'Click "+ Add Product"',
                description: 'A form modal will open with all the product fields. Required fields are marked with a red asterisk (*).',
                screenshot: 'Screenshot: Add Product modal with form fields',
              },
              {
                title: 'Fill in basic information',
                description: 'Enter the product Title (English), Title (Hindi), Subtitle, and Description. The title is the main name shown on the product card. The description supports rich text.',
              },
              {
                title: 'Select a Category',
                description: 'Choose from the dropdown: Online Meditation Courses, Spiritual Retreats, Astrology Consultation, Sanskrit & Vedanta Classes, Books & Merchandise, or Satsang Events. This determines which category page the product appears on.',
              },
              {
                title: 'Set Pricing',
                description: 'Enter the Price (selling price in INR) and optionally the Original Price (displayed as strikethrough for discount effect). For free products, set price to 0.',
              },
              {
                title: 'Upload Images',
                description: 'Click "Upload Images" to add up to 5 product images. The first image becomes the main thumbnail. Supported formats: JPEG, PNG, WebP. Recommended size: 800x800px or larger.',
                screenshot: 'Screenshot: Image upload area with drag-drop and browse button',
              },
              {
                title: 'Set Stock & Display Options',
                description: 'Set stock status (In Stock, Out of Stock, Limited), toggle Featured/Active flags, and set display order for sorting.',
              },
              {
                title: 'Save the product',
                description: 'Click "Create Product" to save. The product will immediately appear on the website under its category page.',
              },
            ]}
          />

          <SubHeading id="product-images">Product Images & Media</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Each product can have <strong>up to 5 images</strong> and optionally a <strong>video</strong>.
          </p>

          <InfoBox type="info" title="Image Best Practices">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Resolution:</strong> At least 800x800 pixels. Higher resolution images are automatically optimized.</li>
              <li><strong>Format:</strong> JPEG or PNG for photos, WebP for best compression.</li>
              <li><strong>Aspect ratio:</strong> Square (1:1) works best for product cards. Landscape (16:9) for hero images.</li>
              <li><strong>File size:</strong> Under 5MB per image. Images are uploaded to AWS S3 via presigned URLs.</li>
              <li><strong>First image:</strong> This becomes the product thumbnail shown in grids and cards.</li>
            </ul>
          </InfoBox>

          <InfoBox type="warning" title="Video Upload">
            <p>Video upload supports MP4 format (max 50MB). Videos are displayed on the product detail page below the image gallery. For larger videos, consider hosting on YouTube and linking in the description.</p>
          </InfoBox>

          <SubHeading id="product-pricing">Pricing & Stock</SubHeading>
          <FieldTable
            fields={[
              { name: 'Price', type: 'Number (INR)', required: true, description: 'The selling price in Indian Rupees. Set to 0 for free items.' },
              { name: 'Original Price', type: 'Number (INR)', required: false, description: 'If set, displays as strikethrough with a discount badge. Must be higher than Price.' },
              { name: 'Stock Status', type: 'Select', required: true, description: 'in_stock (green) | out_of_stock (red) | limited (yellow). Controls the Add to Cart button visibility.' },
              { name: 'Is Featured', type: 'Boolean', required: false, description: 'Featured products appear in the Featured section on the homepage.' },
              { name: 'Is Active', type: 'Boolean', required: false, description: 'Inactive products are hidden from the website but not deleted.' },
              { name: 'Display Order', type: 'Number', required: false, description: 'Controls sorting order. Lower numbers appear first.' },
            ]}
          />

          <SubHeading id="product-categories">Categories Management</SubHeading>
          <StepList
            steps={[
              {
                title: 'Switch to the Categories tab',
                description: 'On the Products admin page, click the "Categories" tab next to "Products".',
              },
              {
                title: 'View existing categories',
                description: 'You\'ll see all 6 product categories: Online Meditation Courses, Spiritual Retreats, Astrology Consultation, Sanskrit & Vedanta Classes, Books & Merchandise, and Satsang Events.',
              },
              {
                title: 'Edit a category',
                description: 'Click the edit icon to change the category name (English/Hindi), description, slug, icon, or image. The slug determines the URL path (e.g., "courses" for /courses).',
              },
              {
                title: 'Add a new category (optional)',
                description: 'Click "+ Add Category" to create a new product category. You\'ll need to add the corresponding frontend page route for it to have a dedicated page.',
              },
            ]}
          />

          <SubHeading id="product-bilingual">Hindi & English Content</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            The platform supports <strong>bilingual content</strong> (English and Hindi). For each product, you can provide:
          </p>
          <FieldTable
            fields={[
              { name: 'Title', type: 'Text', required: true, description: 'English product name' },
              { name: 'Title (Hindi)', type: 'Text', required: false, description: 'Hindi product name - shown when user switches to Hindi locale' },
              { name: 'Subtitle', type: 'Text', required: false, description: 'English subtitle / short description' },
              { name: 'Subtitle (Hindi)', type: 'Text', required: false, description: 'Hindi subtitle' },
              { name: 'Description', type: 'Rich Text', required: false, description: 'Full product description in English' },
              { name: 'Description (Hindi)', type: 'Rich Text', required: false, description: 'Full description in Hindi' },
              { name: 'Weight', type: 'Text', required: false, description: 'Weight specification (English), e.g., "500g"' },
              { name: 'Weight (Hindi)', type: 'Text', required: false, description: 'Weight in Hindi script' },
              { name: 'Purchase Link', type: 'URL', required: false, description: 'External purchase link (English)' },
              { name: 'Purchase Link (Hindi)', type: 'URL', required: false, description: 'External purchase link (Hindi)' },
            ]}
          />

          <InfoBox type="info">
            <p>If Hindi content is not provided, the English version is used as a fallback. Users switching to Hindi will see English text rather than empty fields.</p>
          </InfoBox>

          {/* ══════════════════════════════════════════════
              SECTION: CMS
              ══════════════════════════════════════════════ */}
          <SectionHeading id="cms">{'\uD83D\uDCDD'} CMS (Content Editor)</SectionHeading>

          <SubHeading id="cms-overview">How CMS Works</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            The CMS (Content Management System) lets you create and manage <strong>dynamic pages</strong> on the website.
            Each page consists of ordered <strong>components</strong> (hero sections, text blocks, galleries, etc.)
            that you can add, edit, reorder, and remove without any code changes.
          </p>
          <div className="my-6 p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">CMS Architecture</h4>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-center">
              <div className="flex-1 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-2xl mb-1">{'\uD83D\uDCC4'}</div>
                <strong>Pages</strong>
                <p className="text-xs text-gray-500 mt-1">Container for components. Has title, slug, status.</p>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center text-gray-400">{'\u2192'}</div>
              <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl mb-1">{'\uD83E\uDDE9'}</div>
                <strong>Components</strong>
                <p className="text-xs text-gray-500 mt-1">Building blocks: hero, text, gallery, etc.</p>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center text-gray-400">{'\u2192'}</div>
              <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl mb-1">{'\uD83C\uDF10'}</div>
                <strong>Rendered Page</strong>
                <p className="text-xs text-gray-500 mt-1">Components render top-to-bottom on the URL.</p>
              </div>
            </div>
          </div>

          <SubHeading id="cms-pages">Creating & Managing Pages</SubHeading>
          <StepList
            steps={[
              {
                title: 'Go to Admin > Content Editor',
                description: 'Navigate to /admin/cms. You\'ll see a list of existing CMS pages with their status (published/draft).',
                screenshot: 'Screenshot: CMS page list showing Home, About, etc. with status badges',
              },
              {
                title: 'Click "Create New Page"',
                description: 'Enter the page Title (English & Hindi), Slug (URL path), and Status (draft or published). The slug determines the page URL, e.g., slug "about-us" becomes /en/about-us.',
              },
              {
                title: 'Save the page',
                description: 'Click Save. The empty page is created. Now you need to add components to build the page content.',
              },
              {
                title: 'Add components',
                description: 'Select the page from the list, then click "Add Component" to start building the page layout.',
                screenshot: 'Screenshot: Page selected with "Add Component" button visible',
              },
            ]}
          />

          <InfoBox type="info" title="Page Slugs">
            <p>The slug is the URL path for the page. Use lowercase letters, numbers, and hyphens only.</p>
            <p><strong>Example:</strong> Title &quot;About Our Ashram&quot; → Slug: <code className="text-orange-600">about-our-ashram</code> → URL: <code className="text-orange-600">bhairavapath.com/en/about-our-ashram</code></p>
          </InfoBox>

          <SubHeading id="cms-components">Adding Components</SubHeading>
          <StepList
            steps={[
              {
                title: 'Select a page to edit',
                description: 'Click on a page from the CMS page list. The right panel shows the page\'s existing components in order.',
              },
              {
                title: 'Click "Add Component"',
                description: 'A modal opens showing all available component templates (hero section, text block, gallery, etc.).',
                screenshot: 'Screenshot: Component template selector modal with grid of component types',
              },
              {
                title: 'Choose a template',
                description: 'Select the component type you want to add. Each type has different fields.',
              },
              {
                title: 'Fill in the component fields',
                description: 'Enter the content for the component. Most components support English and Hindi text, images, and links. Use the language toggle to switch between English and Hindi content.',
                screenshot: 'Screenshot: Component editor form with English/Hindi toggle',
              },
              {
                title: 'Save the component',
                description: 'Click Save. The component is added at the bottom of the page. You can drag to reorder components.',
              },
              {
                title: 'Reorder components',
                description: 'Drag the handle icon on each component card to reorder. The page renders components from top to bottom.',
              },
            ]}
          />

          <SubHeading id="cms-component-types">Component Types Reference</SubHeading>
          <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { type: 'hero_section', icon: '\uD83C\uDFA8', desc: 'Full-width hero with title, subtitle, background image, and CTA button' },
              { type: 'text_block', icon: '\uD83D\uDCDD', desc: 'Rich text content block with HTML formatting' },
              { type: 'image_block', icon: '\uD83D\uDDBC\uFE0F', desc: 'Single image with optional caption and link' },
              { type: 'video_block', icon: '\uD83C\uDFA5', desc: 'Embedded video (YouTube/Vimeo URL or uploaded MP4)' },
              { type: 'gallery', icon: '\uD83D\uDCF8', desc: 'Image gallery with lightbox, supports multiple images' },
              { type: 'sacred_teachings', icon: '\uD83D\uDCD6', desc: 'Teachings cards with title, content, and icon' },
              { type: 'events_section', icon: '\uD83D\uDCC5', desc: 'Upcoming events with dates, locations, and registration' },
              { type: 'wisdom_words', icon: '\u2728', desc: 'Quote/wisdom section with highlighted text' },
              { type: 'services_grid', icon: '\uD83D\uDD32', desc: 'Grid of service cards with icons and descriptions' },
              { type: 'contact_form', icon: '\uD83D\uDCE7', desc: 'Contact form with name, email, message fields' },
              { type: 'donations_section', icon: '\uD83D\uDE4F', desc: 'Donation CTA section with amounts and purpose' },
              { type: 'newsletter_section', icon: '\uD83D\uDCE8', desc: 'Newsletter signup form' },
              { type: 'faq_section', icon: '\u2753', desc: 'Frequently asked questions with accordion expand/collapse' },
              { type: 'testimonials', icon: '\uD83D\uDCAC', desc: 'Testimonial cards with name, photo, and quote' },
              { type: 'announcement_bar', icon: '\uD83D\uDCE2', desc: 'Global: top announcement bar across all pages' },
              { type: 'header', icon: '\uD83D\uDD1D', desc: 'Global: site header/navigation configuration' },
              { type: 'footer', icon: '\uD83D\uDD1A', desc: 'Global: site footer with links and info' },
            ].map((comp) => (
              <div
                key={comp.type}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{comp.icon}</span>
                  <code className="text-xs font-mono text-orange-600 dark:text-orange-400">{comp.type}</code>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{comp.desc}</p>
              </div>
            ))}
          </div>

          <SubHeading id="cms-global">Global Components</SubHeading>
          <InfoBox type="warning" title="Global Components">
            <p>Components of type <code>announcement_bar</code>, <code>header</code>, and <code>footer</code> are <strong>global</strong> — they affect all pages, not just the page they&apos;re attached to.</p>
            <p className="mt-2">Typically these are added to the <strong>Home</strong> page and rendered site-wide. Editing these will change the header/footer across the entire website.</p>
          </InfoBox>

          <SubHeading id="cms-publishing">Publishing & Preview</SubHeading>
          <FieldTable
            fields={[
              { name: 'Status: Draft', type: 'Status', required: false, description: 'Page is saved but NOT visible on the website. Use this while building content.' },
              { name: 'Status: Published', type: 'Status', required: false, description: 'Page is live and accessible at its slug URL. Changes are instant.' },
            ]}
          />
          <InfoBox type="info">
            <p><strong>Preview:</strong> To preview a page before publishing, set it to &quot;published&quot; briefly, check the URL, then switch back to &quot;draft&quot; if needed. Pages at direct URLs are accessible immediately upon publishing.</p>
          </InfoBox>

          {/* ══════════════════════════════════════════════
              SECTION: RAZORPAY & PAYMENTS
              ══════════════════════════════════════════════ */}
          <SectionHeading id="payments">{'\uD83D\uDCB3'} Razorpay & Payments</SectionHeading>

          <SubHeading id="razorpay-setup">Setting Up Razorpay</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline font-medium">Razorpay</a> is
            the payment gateway used for all transactions — subscriptions, product orders, and donations.
            You need to configure your Razorpay API keys before payments can work.
          </p>
          <StepList
            steps={[
              {
                title: 'Create a Razorpay Account',
                description: 'Go to razorpay.com and sign up for a business account. Complete the KYC verification process (PAN, bank details, business proof). This may take 1-3 business days.',
                screenshot: 'Screenshot: Razorpay signup page with business registration form',
              },
              {
                title: 'Complete KYC Verification',
                description: 'Razorpay requires business verification before you can accept live payments. You\'ll need: PAN card, bank account details, business registration document, and address proof.',
              },
              {
                title: 'Generate API Keys',
                description: 'Go to Razorpay Dashboard → Account & Settings → API Keys → Generate Key. You\'ll get a Key ID (starts with "rzp_live_" or "rzp_test_") and Key Secret (shown only once — copy it immediately!).',
                screenshot: 'Screenshot: Razorpay Dashboard → API Keys page with Generate Key button',
              },
              {
                title: 'Enter Keys in Admin Settings',
                description: 'Go to your admin panel → Settings → Razorpay tab. Paste the Key ID and Key Secret. Click "Test Connection" to verify they work.',
                screenshot: 'Screenshot: Admin Settings page with Razorpay Key ID and Key Secret fields',
              },
              {
                title: 'Save and Verify',
                description: 'Click "Save Razorpay Settings". The new keys will take effect within 5 minutes across all payment flows. No server restart needed!',
              },
            ]}
          />

          <SubHeading id="razorpay-test-mode">Test Mode vs Live Mode</SubHeading>
          <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">{'\uD83E\uDDEA'} Test Mode</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">Key starts with <code className="font-mono">rzp_test_</code></p>
              <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1 list-disc list-inside">
                <li>No real money is charged</li>
                <li>Use test UPI ID: <code>success@razorpay</code></li>
                <li>Use test card: <code>4111 1111 1111 1111</code></li>
                <li>Transactions appear in Razorpay test dashboard</li>
                <li>Perfect for development and testing</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">{'\u2705'} Live Mode</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">Key starts with <code className="font-mono">rzp_live_</code></p>
              <ul className="text-xs text-green-600 dark:text-green-400 space-y-1 list-disc list-inside">
                <li>Real money is charged to customers</li>
                <li>All payment methods available (UPI, cards, netbanking)</li>
                <li>Settlements to your bank account</li>
                <li>Full Razorpay dashboard analytics</li>
                <li>Only enable after thorough testing!</li>
              </ul>
            </div>
          </div>

          <InfoBox type="danger" title="Switching to Live Mode">
            <p><strong>Before switching from Test to Live mode:</strong></p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Complete KYC verification on Razorpay</li>
              <li>Test all payment flows in test mode first</li>
              <li>Generate new Live API keys (separate from test keys)</li>
              <li>Update both Key ID and Key Secret in Settings</li>
              <li>Update the Webhook secret too (create a new webhook for live mode)</li>
              <li>Do a small test transaction in live mode to verify</li>
            </ol>
          </InfoBox>

          <SubHeading id="razorpay-keys">API Keys Configuration</SubHeading>
          <StepList
            steps={[
              {
                title: 'Go to Admin > Settings',
                description: 'Only Super Admins can access this page. Navigate to /admin/settings.',
                screenshot: 'Screenshot: Admin dashboard with Settings card highlighted',
              },
              {
                title: 'Razorpay Key ID',
                description: 'Paste your Key ID. It looks like "rzp_test_SXBtiiF7gx5Uio" (test) or "rzp_live_ABC123xyz" (live). This key is public — it\'s sent to the frontend for Razorpay checkout.',
              },
              {
                title: 'Razorpay Key Secret',
                description: 'Paste your Key Secret. This is private and NEVER sent to the frontend. It\'s used server-side for signature verification and API calls. After saving, it will be masked in the UI.',
              },
              {
                title: 'Test Connection',
                description: 'Click "Test Connection" to validate the keys. The system makes a test API call to Razorpay. If it succeeds, you\'ll see a green checkmark. If it fails, check for typos.',
                screenshot: 'Screenshot: Test Connection button with green success message',
              },
              {
                title: 'Save Settings',
                description: 'Click "Save Razorpay Settings". The mode indicator will show "Test Mode" (amber) or "Live Mode" (green) based on your key prefix.',
              },
            ]}
          />

          <InfoBox type="info" title="How Keys Are Stored">
            <p>Keys are stored securely in DynamoDB with encryption. The Key Secret is masked in all admin UI responses (e.g., &quot;rzp_****5Uio&quot;). To change the secret, enter the full new value — you cannot view the existing one.</p>
            <p className="mt-2">Keys are also set as environment variables during deployment via AWS SSM Parameter Store. The admin-set values override the deploy-time values, allowing changes without redeployment.</p>
          </InfoBox>

          <SubHeading id="razorpay-webhook">Webhook Setup</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            Webhooks allow Razorpay to notify your backend about payment events (success, failure, etc.)
            in real-time. This is essential for confirming payments even if the user closes their browser mid-payment.
          </p>
          <StepList
            steps={[
              {
                title: 'Go to Razorpay Dashboard > Webhooks',
                description: 'Navigate to Dashboard → Account & Settings → Webhooks.',
                screenshot: 'Screenshot: Razorpay Webhooks page',
              },
              {
                title: 'Add a new webhook',
                description: 'Click "Add New Webhook". Enter your webhook URL:',
              },
              {
                title: 'Enter Webhook URL',
                description: 'Your webhook URL is: https://[your-api-domain]/api/v1/payments/webhook/razorpay  — For this project: https://n4vi400a5e.execute-api.ap-south-1.amazonaws.com/prod/api/v1/payments/webhook/razorpay',
              },
              {
                title: 'Select events',
                description: 'Enable these events: payment.captured, payment.failed, order.paid, subscription.activated, subscription.charged, subscription.halted, subscription.cancelled, subscription.pending',
              },
              {
                title: 'Set webhook secret',
                description: 'Generate a strong secret (32+ characters). Enter it in both Razorpay and your Admin Settings > Webhook Secret field. This verifies webhook authenticity.',
              },
              {
                title: 'Save and test',
                description: 'Save the webhook in Razorpay. Make a test payment to verify the webhook fires correctly.',
              },
            ]}
          />

          <CodeBlock
            title="Webhook Events Handled"
            code={`payment.captured   → Confirms order/subscription payment
payment.failed     → Marks payment as failed
order.paid         → Confirms product order (backup)
subscription.activated  → Activates user subscription
subscription.charged    → Renews subscription (autopay)
subscription.halted     → Marks failed after retries
subscription.cancelled  → Cancels subscription
subscription.pending    → Marks payment pending`}
          />

          <SubHeading id="payment-flow">How Payments Work</SubHeading>
          <div className="my-6 p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Flow Diagram</h4>
            <div className="space-y-3 text-sm">
              {[
                { step: 'User', action: 'Clicks "Buy Now" or "Subscribe"', color: 'blue' },
                { step: 'Frontend', action: 'Calls backend API to create Razorpay order', color: 'purple' },
                { step: 'Backend', action: 'Creates order in DynamoDB + Razorpay order via API', color: 'orange' },
                { step: 'Frontend', action: 'Opens Razorpay checkout modal with order details', color: 'purple' },
                { step: 'User', action: 'Completes payment (UPI/Card/Netbanking)', color: 'blue' },
                { step: 'Razorpay', action: 'Sends payment.captured webhook to backend', color: 'green' },
                { step: 'Backend', action: 'Verifies signature, marks order as PAID, sends email', color: 'orange' },
                { step: 'Frontend', action: 'Shows success message, clears cart', color: 'purple' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                    item.color === 'blue' ? 'bg-blue-500' :
                    item.color === 'purple' ? 'bg-purple-500' :
                    item.color === 'orange' ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      item.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      item.color === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                      item.color === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {item.step}
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{item.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SubHeading id="payment-troubleshoot">Troubleshooting Payments</SubHeading>
          <div className="my-4 space-y-3">
            {[
              { q: 'Payment fails with "Payment service is not configured"', a: 'Razorpay API keys are not set. Go to Admin > Settings and enter your Razorpay Key ID and Key Secret.' },
              { q: '"International cards are not supported"', a: 'Razorpay requires international payment activation separately. Contact Razorpay support or use domestic payment methods (UPI, Indian cards, netbanking).' },
              { q: 'Webhook not working / Order stays in "payment_pending"', a: 'Check: (1) Webhook URL is correct in Razorpay dashboard. (2) Webhook secret matches in both Razorpay and Admin Settings. (3) The events are enabled.' },
              { q: 'Payment succeeded but order not confirmed', a: 'The frontend verification may have failed. The webhook is a backup — if the webhook is configured correctly, it will still confirm the order server-side.' },
              { q: '"Test mode" payments work but "Live mode" doesn\'t', a: 'Ensure KYC is completed, live API keys are generated (separate from test keys), and the webhook is recreated for live mode.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition list-none flex justify-between items-center">
                  <span>{faq.q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">{'\u25BE'}</span>
                </summary>
                <div className="px-4 pb-3 text-sm text-gray-600 dark:text-gray-400">{faq.a}</div>
              </details>
            ))}
          </div>

          {/* ══════════════════════════════════════════════
              SECTION: ORDERS
              ══════════════════════════════════════════════ */}
          <SectionHeading id="orders">{'\uD83D\uDCE6'} Orders Management</SectionHeading>

          <SubHeading id="orders-overview">Order Lifecycle</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            When a user checks out their cart, an <strong>Order</strong> is created with a snapshot of cart items,
            shipping address, and total amount. The order goes through these stages:
          </p>
          <div className="my-4 flex flex-wrap gap-2 items-center">
            {[
              { label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
              { label: '\u2192', color: 'text-gray-400' },
              { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-300' },
              { label: '\u2192', color: 'text-gray-400' },
              { label: 'Processing', color: 'bg-blue-100 text-blue-800 border-blue-300' },
              { label: '\u2192', color: 'text-gray-400' },
              { label: 'Shipped', color: 'bg-purple-100 text-purple-800 border-purple-300' },
              { label: '\u2192', color: 'text-gray-400' },
              { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-300' },
            ].map((s, i) => (
              <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${s.color} ${s.color.includes('border') ? 'border' : ''}`}>{s.label}</span>
            ))}
          </div>

          <SubHeading id="orders-status">Order Statuses</SubHeading>
          <FieldTable
            fields={[
              { name: 'payment_pending', type: 'Status', required: false, description: 'Order created, waiting for Razorpay payment completion.' },
              { name: 'paid', type: 'Status', required: false, description: 'Payment confirmed via signature verification or webhook. Cart is cleared.' },
              { name: 'processing', type: 'Status', required: false, description: 'Admin has acknowledged the order and is preparing it for shipment.' },
              { name: 'shipped', type: 'Status', required: false, description: 'Order has been shipped. Tracking number may be added.' },
              { name: 'delivered', type: 'Status', required: false, description: 'Order confirmed delivered to the customer.' },
              { name: 'cancelled', type: 'Status', required: false, description: 'Order cancelled (payment failed or admin action).' },
            ]}
          />

          <SubHeading id="orders-tracking">Tracking & Fulfillment</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            To fulfill an order: update its status from &quot;paid&quot; to &quot;processing&quot; when you start preparing it,
            then to &quot;shipped&quot; with a tracking number. The user gets email notifications at each stage.
          </p>

          {/* ══════════════════════════════════════════════
              SECTION: SUBSCRIPTIONS
              ══════════════════════════════════════════════ */}
          <SectionHeading id="subscriptions">{'\uD83D\uDCB3'} Subscriptions</SectionHeading>

          <SubHeading id="sub-plans">Subscription Plans</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            The platform offers tiered subscription plans. Each plan has exclusive content (stotras, kavachs, PDFs, etc.)
            assigned through the Content Library.
          </p>
          <FieldTable
            fields={[
              { name: 'Free', type: '\u20B90/mo', required: false, description: 'Basic access. Auto-activated, no payment.' },
              { name: 'Basic', type: '\u20B9300/mo', required: false, description: 'Autopay via UPI. Monthly renewal.' },
              { name: 'Standard', type: '\u20B91,100/mo', required: false, description: 'Autopay via UPI. Monthly renewal.' },
              { name: 'Premium', type: '\u20B92,100/mo', required: false, description: 'Autopay via UPI. Monthly renewal.' },
              { name: 'Gold', type: '\u20B95,100', required: false, description: 'One-time payment. No autopay.' },
              { name: 'Diamond', type: '\u20B921,000', required: false, description: 'One-time payment. Lifetime/annual.' },
            ]}
          />

          <SubHeading id="sub-autopay">UPI Autopay Setup</SubHeading>
          <InfoBox type="info" title="How Autopay Works">
            <p>Plans at \u20B9300, \u20B91100, and \u20B92100 use Razorpay&apos;s <strong>UPI Autopay</strong> (Subscriptions API).
            The user authorizes recurring payments from their UPI app. Razorpay auto-charges on each billing cycle.</p>
            <p className="mt-2">Plans at \u20B95100 and \u20B921000 use a <strong>one-time payment</strong> (Orders API) — no recurring charge.</p>
          </InfoBox>

          <SubHeading id="sub-management">Managing Subscribers</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Go to <code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin/subscriptions</code> to view all
            subscribers. You can activate, cancel, or modify subscriptions. The Content Library
            (<code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin/content-library</code>) is where you upload
            exclusive content for each plan tier.
          </p>

          {/* ══════════════════════════════════════════════
              SECTION: MEDIA
              ══════════════════════════════════════════════ */}
          <SectionHeading id="media">{'\uD83D\uDDBC\uFE0F'} Media Library</SectionHeading>

          <SubHeading id="media-upload">Uploading Files</SubHeading>
          <StepList
            steps={[
              {
                title: 'Go to Admin > Media Library',
                description: 'Navigate to /admin/media. You\'ll see folders and files organized by type.',
              },
              {
                title: 'Click "Upload"',
                description: 'Select one or multiple files. They\'re uploaded directly to AWS S3 via secure presigned URLs.',
              },
              {
                title: 'Use in content',
                description: 'After uploading, copy the file URL and paste it into CMS components, product images, or event banners.',
              },
            ]}
          />

          <SubHeading id="media-folders">Folders & Organization</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Organize files into folders (e.g., &quot;products&quot;, &quot;events&quot;, &quot;banners&quot;).
            The media picker modal is available when editing CMS components — you can select from existing uploads
            or upload new files inline.
          </p>

          <SubHeading id="media-formats">Supported Formats</SubHeading>
          <FieldTable
            fields={[
              { name: 'Images', type: 'JPEG, PNG, WebP, SVG, GIF', required: false, description: 'Max 10MB. Auto-served via CloudFront CDN.' },
              { name: 'Documents', type: 'PDF', required: false, description: 'Max 20MB. Used in Content Library for subscriber downloads.' },
              { name: 'Video', type: 'MP4', required: false, description: 'Max 50MB. For product videos and CMS video blocks.' },
              { name: 'Audio', type: 'MP3, WAV', required: false, description: 'Max 20MB. For audio content in Content Library.' },
            ]}
          />

          {/* ══════════════════════════════════════════════
              SECTION: OTHER MODULES
              ══════════════════════════════════════════════ */}
          <SectionHeading id="other">{'\uD83D\uDCCB'} Other Modules</SectionHeading>

          <SubHeading id="newsletter">Newsletter & Campaigns</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            <code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin/newsletter</code> — Manage email subscribers and send campaigns.
            Users subscribe via the newsletter form on the website. You can:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4 mt-2">
            <li>View all subscribers with their frequency preference</li>
            <li>Create email campaigns with HTML content</li>
            <li>Send campaigns to all subscribers or specific segments</li>
            <li>Track open rates and campaign performance</li>
          </ul>

          <SubHeading id="donations">Donations Configuration</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            <code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin/donations</code> — Has two tabs:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4 mt-2">
            <li><strong>Donations tab:</strong> View all received donations, amounts, donor info, status</li>
            <li><strong>Config tab:</strong> Create donation purposes (General, Temple, Annadaan, etc.) with suggested amounts, min/max limits, and Hindi labels</li>
          </ul>

          <SubHeading id="events">Events Management</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            <code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin/events</code> — Create and manage ashram events with dates,
            locations, descriptions (English/Hindi), images, and registration links. Events appear on the Events page of the website.
          </p>

          <SubHeading id="support">Support Tickets</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            <code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin/support</code> — Handle user support tickets.
            View open/closed tickets, reply to users, change priority (low/medium/high/urgent), and update status (open/in_progress/resolved/closed).
          </p>

          <SubHeading id="users">User Management</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            <code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin/users</code> — View all registered users,
            change roles (Super Admin can promote/demote), invite new users via email, and manage accounts.
          </p>

          {/* ══════════════════════════════════════════════
              SECTION: SETTINGS & CONFIG
              ══════════════════════════════════════════════ */}
          <SectionHeading id="settings">{'\u2699\uFE0F'} Settings & Configuration</SectionHeading>

          <SubHeading id="settings-razorpay">Razorpay Key Management</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            The Admin Settings page (<code className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-sm">/admin/settings</code>) allows Super Admins
            to update Razorpay keys without developer intervention.
          </p>

          <InfoBox type="success" title="Zero-Downtime Key Rotation">
            <p>When you update Razorpay keys in Settings, the change propagates to all services within 5 minutes.
            The backend caches keys in memory and refreshes them periodically from the database.
            No server restart or redeployment is needed.</p>
          </InfoBox>

          <div className="my-4 p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Hierarchy (Priority Order)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold">1</span>
                <span className="text-gray-600 dark:text-gray-400"><strong>Admin Settings (DynamoDB)</strong> — Keys set via the admin UI. Highest priority.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">2</span>
                <span className="text-gray-600 dark:text-gray-400"><strong>Environment Variables (SSM)</strong> — Keys set during deployment via AWS SSM Parameter Store.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white text-xs font-bold">3</span>
                <span className="text-gray-600 dark:text-gray-400"><strong>Default (empty)</strong> — If no keys are set, payment features show &quot;not configured&quot; error.</span>
              </div>
            </div>
          </div>

          <SubHeading id="settings-deployment">Deployment & Updates</SubHeading>
          <InfoBox type="info" title="Deployment Pipeline">
            <p><strong>Frontend:</strong> Push code to the <code>main</code> branch on GitHub. AWS Amplify automatically builds and deploys within ~3 minutes.</p>
            <p className="mt-2"><strong>Backend:</strong> Run <code>sls deploy --stage prod --aws-profile SwamiJi</code> from the backend/ directory. Deploys to AWS Lambda in ~2 minutes.</p>
          </InfoBox>

          <SubHeading id="settings-env">Environment Variables</SubHeading>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            Backend environment variables are stored in AWS SSM Parameter Store and injected at deploy time:
          </p>
          <CodeBlock
            title="Backend Environment Variables (serverless.yml)"
            code={`RAZORPAY_KEY_ID      → SSM: /swami-rupeshwaranand/prod/razorpay-key-id
RAZORPAY_KEY_SECRET  → SSM: /swami-rupeshwaranand/prod/razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET → SSM: /swami-rupeshwaranand/prod/razorpay-webhook-secret
COGNITO_USER_POOL_ID → SSM: /swami-rupeshwaranand/prod/cognito-user-pool-id
COGNITO_CLIENT_ID    → SSM: /swami-rupeshwaranand/prod/cognito-client-id
SES_FROM_EMAIL       → SSM: /swami-rupeshwaranand/prod/ses-from-email
S3_BUCKET            → swami-rupeshwaranand-uploads-prod`}
          />

          <InfoBox type="warning">
            <p><strong>Remember:</strong> Admin Settings override environment variables. If you set Razorpay keys via the admin UI,
            those values take precedence over SSM/env vars. To revert to env var values, delete the settings from the admin UI.</p>
          </InfoBox>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {'\uD83D\uDE4F'} Bhairava Path Admin Help Center
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Swami Rupeshwaranand Ashram &middot; Built with Next.js, NestJS, AWS &middot; Powered by Razorpay
            </p>
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <Link href="/en/admin" className="text-orange-600 hover:underline">
                {'\u2190'} Back to Admin
              </Link>
              <Link href="/en/admin/settings" className="text-orange-600 hover:underline">
                Settings
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
