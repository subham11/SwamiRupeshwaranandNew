'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import {
  CMSPage,
  CMSComponent,
  ComponentTemplate,
  ComponentFieldValue,
  LocalizedString,
  fetchCMSPages,
  fetchCMSPageWithComponents,
  createCMSPage,
  updateCMSPage,
  deleteCMSPage,
  createCMSComponent,
  updateCMSComponent,
  deleteCMSComponent,
  fetchComponentTemplates,
} from '@/lib/api';

type Language = 'en' | 'hi';

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
};

const COMPONENT_TYPE_ICONS: Record<string, string> = {
  announcement_bar: '📢',
  hero_section: '🏠',
  sacred_teachings: '📿',
  upcoming_events: '📅',
  words_of_wisdom: '💭',
  about_section: 'ℹ️',
  gallery: '🖼️',
  contact_form: '📧',
  text_block: '📝',
  image_banner: '🎨',
  video_section: '🎬',
  testimonials: '💬',
  faq_section: '❓',
  cta_section: '🎯',
  stats_section: '📊',
  team_section: '👥',
};

export default function CMSEditorPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  // State
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(null);
  const [components, setComponents] = useState<CMSComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<CMSComponent | null>(null);
  const [templates, setTemplates] = useState<ComponentTemplate[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<Language>('en');

  // Loading states
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for editing
  const [editedFieldValues, setEditedFieldValues] = useState<ComponentFieldValue[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Modals
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState<LocalizedString>({ en: '', hi: '' });
  const [newPageSlug, setNewPageSlug] = useState('');

  // Auth check
  const isEditor = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2026';
  const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api/v1`;

  // Fetch pages
  const loadPages = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoadingPages(true);
      const data = await fetchCMSPages(accessToken);
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setLoadingPages(false);
    }
  }, [accessToken]);

  // Fetch page components
  const loadPageComponents = useCallback(async (pageId: string) => {
    if (!accessToken) return;
    try {
      setLoadingComponents(true);
      const data = await fetchCMSPageWithComponents(pageId, accessToken);
      setComponents(data.components || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load components');
    } finally {
      setLoadingComponents(false);
    }
  }, [accessToken]);

  // Fetch templates
  const loadTemplates = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchComponentTemplates(accessToken);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }, [accessToken]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin/cms');
    } else if (!isLoading && isAuthenticated && !isEditor) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isEditor, router]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && isEditor && accessToken) {
      loadPages();
      loadTemplates();
    }
  }, [isAuthenticated, isEditor, accessToken, loadPages, loadTemplates]);

  // Load components when page selected
  useEffect(() => {
    if (selectedPage) {
      loadPageComponents(selectedPage.id);
      setSelectedComponent(null);
      setEditedFieldValues([]);
      setHasChanges(false);
    }
  }, [selectedPage, loadPageComponents]);

  // Set edited values when component selected
  useEffect(() => {
    if (selectedComponent) {
      setEditedFieldValues([...selectedComponent.fieldValues]);
      setHasChanges(false);
    }
  }, [selectedComponent]);

  // Clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handlers
  const handleSelectPage = (page: CMSPage) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    setSelectedPage(page);
  };

  const handleSelectComponent = (component: CMSComponent) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    setSelectedComponent(component);
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setEditedFieldValues((prev) => {
      const existing = prev.find((f) => f.name === fieldName);
      if (existing) {
        return prev.map((f) => (f.name === fieldName ? { ...f, value } : f));
      }
      return [...prev, { name: fieldName, value }];
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedComponent || !accessToken) return;
    try {
      setSaving(true);
      await updateCMSComponent(selectedComponent.id, { fieldValues: editedFieldValues }, accessToken);
      setSuccessMessage('Component saved successfully!');
      setHasChanges(false);
      // Refresh components
      if (selectedPage) {
        loadPageComponents(selectedPage.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (selectedComponent) {
      setEditedFieldValues([...selectedComponent.fieldValues]);
      setHasChanges(false);
    }
  };

  const handleAddPage = async () => {
    if (!accessToken || !newPageTitle.en || !newPageSlug) return;
    try {
      setSaving(true);
      await createCMSPage({ title: newPageTitle, slug: newPageSlug }, accessToken);
      setSuccessMessage('Page created successfully!');
      setShowAddPageModal(false);
      setNewPageTitle({ en: '', hi: '' });
      setNewPageSlug('');
      loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this page? This will also delete all its components.')) return;
    try {
      setSaving(true);
      await deleteCMSPage(pageId, accessToken);
      setSuccessMessage('Page deleted successfully!');
      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
        setComponents([]);
        setSelectedComponent(null);
      }
      loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete page');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComponent = async (template: ComponentTemplate) => {
    if (!accessToken || !selectedPage) return;
    try {
      setSaving(true);
      await createCMSComponent(
        {
          pageId: selectedPage.id,
          componentType: template.type,
          name: template.name,
          order: components.length,
        },
        accessToken
      );
      setSuccessMessage('Component added successfully!');
      setShowAddComponentModal(false);
      loadPageComponents(selectedPage.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add component');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this component?')) return;
    try {
      setSaving(true);
      await deleteCMSComponent(componentId, accessToken);
      setSuccessMessage('Component deleted successfully!');
      if (selectedComponent?.id === componentId) {
        setSelectedComponent(null);
        setEditedFieldValues([]);
      }
      if (selectedPage) {
        loadPageComponents(selectedPage.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete component');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComponentActive = async (component: CMSComponent) => {
    if (!accessToken) return;
    try {
      await updateCMSComponent(component.id, { isActive: !component.isActive }, accessToken);
      if (selectedPage) {
        loadPageComponents(selectedPage.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update component');
    }
  };

  // Get field value for display
  const getFieldValue = (fieldName: string): unknown => {
    const field = editedFieldValues.find((f) => f.name === fieldName);
    return field?.value;
  };

  // Render field editor based on type
  const renderFieldEditor = (field: CMSComponent['fieldDefinitions'][0]) => {
    const value = getFieldValue(field.name);
    const localizedValue = value as LocalizedString | undefined;
    const isLocalized = field.type === 'text' || field.type === 'textarea' || field.type === 'richtext';

    if (isLocalized) {
      const currentValue = localizedValue?.[activeLanguage] || '';
      
      if (field.type === 'textarea' || field.type === 'richtext') {
        return (
          <textarea
            value={currentValue}
            onChange={(e) => {
              const newLocalized = { ...localizedValue, [activeLanguage]: e.target.value };
              handleFieldChange(field.name, newLocalized);
            }}
            placeholder={field.placeholder?.[activeLanguage] || ''}
            rows={field.type === 'richtext' ? 6 : 3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        );
      }

      return (
        <input
          type="text"
          value={currentValue}
          onChange={(e) => {
            const newLocalized = { ...localizedValue, [activeLanguage]: e.target.value };
            handleFieldChange(field.name, newLocalized);
          }}
          placeholder={field.placeholder?.[activeLanguage] || ''}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      );
    }

    // Non-localized fields
    switch (field.type) {
      case 'image':
      case 'video':
      case 'url':
        return (
          <input
            type="url"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.type === 'image' ? 'Enter image URL...' : field.type === 'video' ? 'Enter video URL...' : 'Enter URL...'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={(value as number) || 0}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        );
      case 'boolean':
        return (
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">Enabled</span>
          </label>
        );
      case 'color':
        return (
          <input
            type="color"
            value={(value as string) || '#000000'}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        );
      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label[activeLanguage]}
              </option>
            ))}
          </select>
        );
      case 'json':
      case 'array':
        return (
          <textarea
            value={JSON.stringify(value || (field.type === 'array' ? [] : {}), null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange(field.name, parsed);
              } catch {
                // Invalid JSON, don't update
              }
            }}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        );
      default:
        return null;
    }
  };

  if (isLoading || loadingPages) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Content Editor</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage page content and components</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {successMessage}
        </div>
      )}

      {/* Main Layout - 3 Columns */}
      <div className="grid grid-cols-12 gap-6">
        {/* Pages List - Left Column */}
        <div className="col-span-12 md:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">Pages</h2>
              <button
                onClick={() => setShowAddPageModal(true)}
                className="p-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                title="Add Page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    selectedPage?.id === page.id ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500' : ''
                  }`}
                  onClick={() => handleSelectPage(page)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        {page.title.en}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">/{page.slug}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(page.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Delete Page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {pages.length === 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No pages yet. Create one to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Components List - Middle Column */}
        <div className="col-span-12 md:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Components {selectedPage ? `(${components.length})` : ''}
              </h2>
              {selectedPage && (
                <button
                  onClick={() => setShowAddComponentModal(true)}
                  className="p-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                  title="Add Component"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
            {loadingComponents ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
                {!selectedPage ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Select a page to view components
                  </div>
                ) : components.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No components yet. Add one to get started.
                  </div>
                ) : (
                  components.sort((a, b) => a.order - b.order).map((component) => (
                    <div
                      key={component.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedComponent?.id === component.id ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500' : ''
                      }`}
                      onClick={() => handleSelectComponent(component)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{COMPONENT_TYPE_ICONS[component.componentType] || '📦'}</span>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                              {component.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {component.componentType.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComponentActive(component);
                            }}
                            className={`p-1 rounded ${
                              component.isActive
                                ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={component.isActive ? 'Active' : 'Inactive'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="8" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteComponent(component.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                            title="Delete Component"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Component Editor - Right Column */}
        <div className="col-span-12 md:col-span-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {selectedComponent ? `Edit: ${selectedComponent.name}` : 'Component Editor'}
              </h2>
              {selectedComponent && (
                <div className="flex items-center gap-2">
                  {/* Language Toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    {(['en', 'hi'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLanguage(lang)}
                        className={`px-3 py-1 text-sm font-medium transition-colors ${
                          activeLanguage === lang
                            ? 'bg-orange-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {LANGUAGE_LABELS[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!selectedComponent ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p>Select a component to edit its content</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {selectedComponent.fieldDefinitions.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.label[activeLanguage] || field.label.en}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderFieldEditor(field)}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={!hasChanges || saving}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Page Modal */}
      {showAddPageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Page</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPageTitle.en}
                  onChange={(e) => setNewPageTitle((prev) => ({ ...prev, en: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., About Us"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title (Hindi)
                </label>
                <input
                  type="text"
                  value={newPageTitle.hi}
                  onChange={(e) => setNewPageTitle((prev) => ({ ...prev, hi: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., हमारे बारे में"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., about-us"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddPageModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddPage}
                disabled={!newPageTitle.en || !newPageSlug || saving}
              >
                {saving ? 'Creating...' : 'Create Page'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Component Modal */}
      {showAddComponentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Component</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.type}
                  onClick={() => handleAddComponent(template)}
                  disabled={saving}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">{COMPONENT_TYPE_ICONS[template.type] || '📦'}</span>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{template.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowAddComponentModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
