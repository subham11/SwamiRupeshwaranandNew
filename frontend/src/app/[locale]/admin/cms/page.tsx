'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import RichTextEditor from '@/components/admin/RichTextEditor';
import {
  type CMSPage,
  type CMSComponent,
  type ComponentTemplate,
  type ComponentFieldValue,
  type ComponentFieldDefinition,
  type LocalizedString,
  fetchCMSPages,
  fetchCMSPageWithComponents,
  createCMSPage,
  updateCMSPage,
  deleteCMSPage,
  createCMSComponent,
  updateCMSComponent,
  deleteCMSComponent,
  fetchComponentTemplates,
  fetchGlobalComponents,
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
  services_grid: '🙏',
  gallery: '🖼️',
  contact_form: '📧',
  text_block: '📝',
  image_block: '📷',
  video_block: '🎬',
  donation_section: '💰',
  newsletter_signup: '✉️',
  faq_section: '❓',
  testimonials: '⭐',
  custom: '⚙️',
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

  // Global components (site-wide, shown directly in page list)
  const [globalComponents, setGlobalComponents] = useState<CMSComponent[]>([]);
  const [selectedGlobalType, setSelectedGlobalType] = useState<string | null>(null);

  // Loading states
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edited field values (working copy)
  const [editedFields, setEditedFields] = useState<ComponentFieldValue[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  // Guard: suppress change tracking during component initialization
  // (Quill fires onChange on mount even for source='api' in some edge cases)
  const isInitializingRef = useRef(false);

  // Modals
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerFieldKey, setMediaPickerFieldKey] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState<LocalizedString>({ en: '', hi: '' });
  const [newPageSlug, setNewPageSlug] = useState('');

  const isEditor = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';

  // ============================================
  // Data Loading
  // ============================================

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

  const loadTemplates = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchComponentTemplates(accessToken);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }, [accessToken]);

  const loadGlobalComponents = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchGlobalComponents(accessToken);
      setGlobalComponents(data);
    } catch (err) {
      console.error('Failed to load global components:', err);
    }
  }, [accessToken]);

  // ============================================
  // Auth guard
  // ============================================

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin/cms');
    } else if (!isLoading && isAuthenticated && !isEditor) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isEditor, router]);

  useEffect(() => {
    if (isAuthenticated && isEditor && accessToken) {
      loadPages();
      loadTemplates();
      loadGlobalComponents();
    }
  }, [isAuthenticated, isEditor, accessToken, loadPages, loadTemplates, loadGlobalComponents]);

  useEffect(() => {
    if (selectedPage) {
      loadPageComponents(selectedPage.id);
      setSelectedComponent(null);
      setEditedFields([]);
      setHasChanges(false);
    }
  }, [selectedPage, loadPageComponents]);

  useEffect(() => {
    if (selectedComponent) {
      isInitializingRef.current = true;
      setEditedFields(JSON.parse(JSON.stringify(selectedComponent.fields || [])));
      setHasChanges(false);
      // Allow Quill and other components to mount and settle before
      // enabling change tracking. requestAnimationFrame waits for the
      // browser to paint, then the setTimeout fires after React's
      // commit phase so all mount-triggered onChange calls are done.
      requestAnimationFrame(() => {
        setTimeout(() => { isInitializingRef.current = false; }, 50);
      });
    }
    return () => { isInitializingRef.current = false; };
  }, [selectedComponent]);

  // Auto-clear messages
  useEffect(() => {
    if (successMessage) { const t = setTimeout(() => setSuccessMessage(null), 3000); return () => clearTimeout(t); }
  }, [successMessage]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  // ============================================
  // Get the template schema for the selected component
  // ============================================

  const getTemplateForComponent = (comp: CMSComponent): ComponentTemplate | undefined => {
    return templates.find((t) => t.componentType === comp.componentType);
  };

  // ============================================
  // Field value helpers
  // ============================================

  const getFieldValue = (key: string): ComponentFieldValue | undefined => {
    return editedFields.find((f) => f.key === key);
  };

  const updateFieldValue = (key: string, update: Partial<ComponentFieldValue>) => {
    setEditedFields((prev) => {
      const idx = prev.findIndex((f) => f.key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...update };
        return copy;
      }
      return [...prev, { key, ...update }];
    });
    // Only mark dirty for real user edits, not mount-triggered callbacks
    if (!isInitializingRef.current) {
      setHasChanges(true);
    }
  };

  // ============================================
  // Handlers
  // ============================================

  const handleSelectPage = (page: CMSPage) => {
    if (hasChanges && !confirm('You have unsaved changes. Discard them?')) return;
    setSelectedGlobalType(null);
    setSelectedPage(page);
  };

  const handleSelectGlobalComponent = (componentType: string) => {
    if (hasChanges && !confirm('You have unsaved changes. Discard them?')) return;
    setSelectedPage(null);
    setComponents([]);
    setSelectedGlobalType(componentType);
    // Find the first global component of this type
    const comp = globalComponents.find((c) => c.componentType === componentType);
    if (comp) {
      setSelectedComponent(comp);
    } else {
      setSelectedComponent(null);
      setEditedFields([]);
    }
  };

  const handleSelectComponent = (component: CMSComponent) => {
    if (hasChanges && !confirm('You have unsaved changes. Discard them?')) return;
    setSelectedComponent(component);
  };

  const handleSave = async () => {
    if (!selectedComponent || !accessToken) return;
    try {
      setSaving(true);
      await updateCMSComponent(selectedComponent.id, { fields: editedFields }, accessToken);
      setSuccessMessage('Component saved successfully!');
      setHasChanges(false);
      if (selectedPage) loadPageComponents(selectedPage.id);
      if (selectedGlobalType) loadGlobalComponents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (selectedComponent) {
      setEditedFields(JSON.parse(JSON.stringify(selectedComponent.fields || [])));
      setHasChanges(false);
    }
  };

  const handleAddPage = async () => {
    if (!accessToken || !newPageTitle.en || !newPageSlug) return;
    try {
      setSaving(true);
      await createCMSPage({ title: newPageTitle, slug: newPageSlug, path: `/${newPageSlug}` }, accessToken);
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
    if (!accessToken || !confirm('Delete this page and all its components?')) return;
    try {
      setSaving(true);
      await deleteCMSPage(pageId, accessToken);
      setSuccessMessage('Page deleted!');
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
      // Build default fields from template schema
      const defaultFields: ComponentFieldValue[] = template.fields.map((fd) => {
        if (fd.localized) {
          return { key: fd.key, localizedValue: { en: (fd.defaultValue as string) || '', hi: '' } };
        }
        return { key: fd.key, value: fd.defaultValue ?? '' };
      });

      await createCMSComponent(
        {
          pageId: selectedPage.id,
          componentType: template.componentType,
          name: { en: template.name, hi: template.name },
          displayOrder: components.length,
          isVisible: true,
          fields: defaultFields,
        },
        accessToken
      );
      setSuccessMessage('Component added!');
      setShowAddComponentModal(false);
      loadPageComponents(selectedPage.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add component');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    if (!accessToken || !confirm('Delete this component?')) return;
    try {
      setSaving(true);
      await deleteCMSComponent(componentId, accessToken);
      setSuccessMessage('Component deleted!');
      if (selectedComponent?.id === componentId) {
        setSelectedComponent(null);
        setEditedFields([]);
      }
      if (selectedPage) loadPageComponents(selectedPage.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete component');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (component: CMSComponent) => {
    if (!accessToken) return;
    try {
      await updateCMSComponent(component.id, { isVisible: !component.isVisible }, accessToken);
      if (selectedPage) loadPageComponents(selectedPage.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle visibility');
    }
  };

  // ============================================
  // Dynamic form renderer
  // ============================================

  const renderField = (fieldDef: ComponentFieldDefinition) => {
    const fieldVal = getFieldValue(fieldDef.key);

    // Localized field: edit per-language via the toggle
    if (fieldDef.localized) {
      const locVal = fieldVal?.localizedValue || { en: '', hi: '' };
      const currentText = locVal[activeLanguage] || '';

      const handleLocChange = (text: string) => {
        updateFieldValue(fieldDef.key, {
          localizedValue: { ...locVal, [activeLanguage]: text },
        });
      };

      if (fieldDef.type === 'richtext') {
        return (
          <RichTextEditor
            value={currentText}
            onChange={handleLocChange}
            placeholder={fieldDef.placeholder || fieldDef.label}
            label={`${fieldDef.label} (${activeLanguage.toUpperCase()})`}
          />
        );
      }

      if (fieldDef.type === 'textarea') {
        return (
          <textarea
            value={currentText}
            onChange={(e) => handleLocChange(e.target.value)}
            placeholder={fieldDef.placeholder || fieldDef.label}
            aria-label={`${fieldDef.label} (${activeLanguage.toUpperCase()})`}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        );
      }

      return (
        <input
          type="text"
          value={currentText}
          onChange={(e) => handleLocChange(e.target.value)}
          placeholder={fieldDef.placeholder || fieldDef.label}
          aria-label={`${fieldDef.label} (${activeLanguage.toUpperCase()})`}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
        />
      );
    }

    // Non-localized fields
    const simpleVal = fieldVal?.value;

    switch (fieldDef.type) {
      case 'text':
      case 'url':
        return (
          <input
            type={fieldDef.type === 'url' ? 'url' : 'text'}
            value={(simpleVal as string) || ''}
            onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value })}
            placeholder={fieldDef.placeholder || (fieldDef.type === 'url' ? 'https://...' : '')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        );

      case 'richtext':
        return (
          <RichTextEditor
            value={(simpleVal as string) || ''}
            onChange={(val) => updateFieldValue(fieldDef.key, { value: val })}
            placeholder={fieldDef.label}
            label={fieldDef.label}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={(simpleVal as string) || ''}
            onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value })}
            aria-label={fieldDef.label}
            placeholder={fieldDef.label}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        );

      case 'image':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={(simpleVal as string) || ''}
                onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value })}
                placeholder="Image URL or path..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setMediaPickerFieldKey(fieldDef.key);
                  setShowMediaPicker(true);
                }}
                className="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 text-sm font-medium whitespace-nowrap"
              >
                📁 Browse
              </button>
            </div>
            {typeof simpleVal === 'string' && simpleVal && (
              <div className="relative w-24 h-24 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <img src={simpleVal} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <input
            type="url"
            value={(simpleVal as string) || ''}
            onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value })}
            placeholder="Video URL (YouTube/Vimeo)..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(simpleVal as number) ?? ''}
            onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value === '' ? '' : parseFloat(e.target.value) })}
            aria-label={fieldDef.label}
            placeholder={fieldDef.label}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        );

      case 'boolean':
        return (
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!!simpleVal}
              onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.checked })}
              className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300 text-sm">
              {simpleVal ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(simpleVal as string) || '#000000'}
              onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value })}
              aria-label={`${fieldDef.label} color picker`}
              title={`${fieldDef.label} color picker`}
              className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={(simpleVal as string) || ''}
              onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value })}
              placeholder="#000000"
              aria-label={`${fieldDef.label} hex value`}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
        );

      case 'select':
        return (
          <select
            value={(simpleVal as string) || ''}
            onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value })}
            aria-label={fieldDef.label}
            title={fieldDef.label}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          >
            <option value="">Select...</option>
            {fieldDef.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={(simpleVal as string) || ''}
            onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value })}
            aria-label={fieldDef.label}
            title={fieldDef.label}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        );

      case 'json':
      case 'array': {
        // Parse the current value into an array
        let items: Record<string, unknown>[] = [];
        try {
          if (Array.isArray(simpleVal)) items = simpleVal as Record<string, unknown>[];
          else if (typeof simpleVal === 'string') items = JSON.parse(simpleVal);
        } catch { /* keep empty */ }

        // Determine the item schema based on the field key
        const ARRAY_SCHEMAS: Record<string, { label: string; fields: { key: string; label: string; type: 'text' | 'textarea' | 'image' | 'url' | 'date' | 'localized' | 'localized-textarea' }[] }> = {
          slides: {
            label: 'Slide',
            fields: [
              { key: 'imageUrl', label: 'Image URL', type: 'image' },
              { key: 'heading', label: 'Heading', type: 'localized' },
              { key: 'subheading', label: 'Subheading', type: 'localized-textarea' },
              { key: 'ctaText', label: 'Button Text', type: 'localized' },
              { key: 'ctaLink', label: 'Button Link', type: 'url' },
            ],
          },
          quotes: {
            label: 'Quote',
            fields: [
              { key: 'text', label: 'Quote Text', type: 'localized-textarea' },
              { key: 'author', label: 'Author', type: 'localized' },
            ],
          },
          events: {
            label: 'Event',
            fields: [
              { key: 'title', label: 'Title', type: 'localized' },
              { key: 'description', label: 'Description', type: 'localized-textarea' },
              { key: 'date', label: 'Date & Time', type: 'date' },
              { key: 'location', label: 'Location', type: 'localized' },
              { key: 'imageUrl', label: 'Image URL', type: 'image' },
              { key: 'link', label: 'Link', type: 'url' },
            ],
          },
          teachings: {
            label: 'Teaching',
            fields: [
              { key: 'title', label: 'Title', type: 'localized' },
              { key: 'description', label: 'Description', type: 'localized-textarea' },
              { key: 'icon', label: 'Icon Emoji', type: 'text' },
              { key: 'imageUrl', label: 'Image URL', type: 'image' },
              { key: 'link', label: 'Link', type: 'url' },
            ],
          },
          testimonials: {
            label: 'Testimonial',
            fields: [
              { key: 'name', label: 'Name', type: 'localized' },
              { key: 'text', label: 'Text', type: 'localized-textarea' },
              { key: 'imageUrl', label: 'Photo', type: 'image' },
            ],
          },
          faqs: {
            label: 'FAQ',
            fields: [
              { key: 'question', label: 'Question', type: 'localized' },
              { key: 'answer', label: 'Answer', type: 'localized-textarea' },
            ],
          },
        };

        const schema = ARRAY_SCHEMAS[fieldDef.key];

        // Fallback: raw JSON textarea for unknown schemas
        if (!schema) {
          return (
            <textarea
              value={typeof simpleVal === 'string' ? simpleVal : JSON.stringify(simpleVal || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateFieldValue(fieldDef.key, { value: parsed });
                } catch {
                  updateFieldValue(fieldDef.key, { value: e.target.value });
                }
              }}
              aria-label={fieldDef.label}
              placeholder={`${fieldDef.label} (JSON)`}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          );
        }

        // Helper to update items array
        const updateItems = (newItems: Record<string, unknown>[]) => {
          updateFieldValue(fieldDef.key, { value: newItems });
        };

        const addItem = () => {
          const newItem: Record<string, unknown> = {};
          schema.fields.forEach((sf) => {
            if (sf.type === 'localized' || sf.type === 'localized-textarea') {
              newItem[sf.key] = { en: '', hi: '' };
            } else {
              newItem[sf.key] = '';
            }
          });
          updateItems([...items, newItem]);
        };

        const removeItem = (idx: number) => {
          updateItems(items.filter((_, i) => i !== idx));
        };

        const moveItem = (idx: number, dir: -1 | 1) => {
          const newIdx = idx + dir;
          if (newIdx < 0 || newIdx >= items.length) return;
          const copy = [...items];
          [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
          updateItems(copy);
        };

        const updateItemField = (itemIdx: number, fieldKey: string, value: unknown) => {
          const copy = items.map((item, i) => (i === itemIdx ? { ...item, [fieldKey]: value } : item));
          updateItems(copy);
        };

        return (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50"
              >
                {/* Item header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {schema.label} {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Item fields */}
                <div className="space-y-2">
                  {schema.fields.map((sf) => {
                    const itemVal = item[sf.key];

                    if (sf.type === 'localized' || sf.type === 'localized-textarea') {
                      const locObj = (itemVal && typeof itemVal === 'object' && !Array.isArray(itemVal))
                        ? (itemVal as Record<string, string>)
                        : { en: '', hi: '' };
                      const currentLangVal = locObj[activeLanguage] || '';

                      return (
                        <div key={sf.key}>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                            {sf.label} <span className="text-orange-500">{activeLanguage.toUpperCase()}</span>
                          </label>
                          {sf.type === 'localized-textarea' ? (
                            <textarea
                              value={currentLangVal}
                              onChange={(e) =>
                                updateItemField(idx, sf.key, { ...locObj, [activeLanguage]: e.target.value })
                              }
                              rows={2}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentLangVal}
                              onChange={(e) =>
                                updateItemField(idx, sf.key, { ...locObj, [activeLanguage]: e.target.value })
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                            />
                          )}
                        </div>
                      );
                    }

                    if (sf.type === 'image') {
                      return (
                        <div key={sf.key}>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                            {sf.label}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={(itemVal as string) || ''}
                              onChange={(e) => updateItemField(idx, sf.key, e.target.value)}
                              placeholder="Image URL..."
                              className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setMediaPickerFieldKey(`__array__${fieldDef.key}__${idx}__${sf.key}`);
                                setShowMediaPicker(true);
                              }}
                              className="px-2 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium whitespace-nowrap"
                            >
                              📁
                            </button>
                          </div>
                          {typeof itemVal === 'string' && itemVal && (
                            <div className="mt-1 relative w-16 h-16 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                              <img src={itemVal} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (sf.type === 'date') {
                      return (
                        <div key={sf.key}>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                            {sf.label}
                          </label>
                          <input
                            type="datetime-local"
                            value={(itemVal as string) || ''}
                            onChange={(e) => updateItemField(idx, sf.key, e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        </div>
                      );
                    }

                    // text / url
                    return (
                      <div key={sf.key}>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                          {sf.label}
                        </label>
                        <input
                          type={sf.type === 'url' ? 'url' : 'text'}
                          value={(itemVal as string) || ''}
                          onChange={(e) => updateItemField(idx, sf.key, e.target.value)}
                          placeholder={sf.type === 'url' ? 'https://...' : ''}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors text-sm font-medium"
            >
              + Add {schema.label}
            </button>
          </div>
        );
      }

      default:
        return (
          <input
            type="text"
            value={String(simpleVal || '')}
            onChange={(e) => updateFieldValue(fieldDef.key, { value: e.target.value })}
            aria-label={fieldDef.label}
            placeholder={fieldDef.label}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          />
        );
    }
  };

  // ============================================
  // Render
  // ============================================

  if (isLoading || loadingPages) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  const selectedTemplate = selectedComponent ? getTemplateForComponent(selectedComponent) : null;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Content Editor</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage page content and components in English &amp; Hindi</p>
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
        {/* ====== Pages List (Left) ====== */}
        <div className="col-span-12 md:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">Pages</h2>
              {(user?.role === 'super_admin' || user?.role === 'admin') && (
                <button
                  onClick={() => setShowAddPageModal(true)}
                  className="p-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                  title="Add Page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[65vh] overflow-y-auto">
              {/* Global Components Section */}
              {templates.filter((t) => t.isGlobal).length > 0 && (
                <>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Global</span>
                  </div>
                  {templates
                    .filter((t) => t.isGlobal)
                    .map((template) => {
                      const globalComp = globalComponents.find((c) => c.componentType === template.componentType);
                      return (
                        <div
                          key={`global-${template.componentType}`}
                          className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                            selectedGlobalType === template.componentType ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500' : ''
                          }`}
                          onClick={() => handleSelectGlobalComponent(template.componentType)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg flex-shrink-0">{template.icon || COMPONENT_TYPE_ICONS[template.componentType] || '📦'}</span>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {template.name}
                              </h3>
                              {globalComp ? (
                                <span className="inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  global
                                </span>
                              ) : (
                                <span className="inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                  not configured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pages</span>
                  </div>
                </>
              )}
              {pages.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No pages yet. Create one to get started.
                </div>
              ) : (
                pages
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((page) => (
                    <div
                      key={page.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedPage?.id === page.id ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500' : ''
                      }`}
                      onClick={() => handleSelectPage(page)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {page.title.en}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">/{page.slug}</p>
                          <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${
                            page.status === 'published'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {page.status}
                          </span>
                        </div>
                        {(user?.role === 'super_admin' || user?.role === 'admin') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded flex-shrink-0"
                            title="Delete Page"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* ====== Components List (Middle) ====== */}
        <div className="col-span-12 md:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Components {selectedPage ? `(${components.filter((c) => !templates.find((t) => t.componentType === c.componentType && t.isGlobal)).length})` : ''}
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
            ) : selectedGlobalType ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                <p className="font-medium text-gray-700 dark:text-gray-300">Global Component</p>
                <p className="mt-1 text-xs">This component appears site-wide and is edited directly.</p>
              </div>
            ) : !selectedPage ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                Select a page to view its components
              </div>
            ) : components.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No components yet. Add one to get started.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[65vh] overflow-y-auto">
                {components
                  .filter((c) => !templates.find((t) => t.componentType === c.componentType && t.isGlobal))
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((comp) => (
                    <div
                      key={comp.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedComponent?.id === comp.id ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500' : ''
                      }`}
                      onClick={() => handleSelectComponent(comp)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-lg flex-shrink-0">
                            {COMPONENT_TYPE_ICONS[comp.componentType] || '📦'}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {comp.name?.en || comp.name?.hi || comp.componentType}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {comp.componentType.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleVisibility(comp); }}
                            className={`p-1 rounded ${
                              comp.isVisible
                                ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={comp.isVisible ? 'Visible' : 'Hidden'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              {comp.isVisible ? (
                                <>
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10z" clipRule="evenodd" />
                                </>
                              ) : (
                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14z" clipRule="evenodd" />
                              )}
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteComponent(comp.id); }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* ====== Component Editor (Right) ====== */}
        <div className="col-span-12 md:col-span-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {selectedComponent
                  ? `Edit: ${selectedComponent.name?.en || selectedComponent.componentType}`
                  : 'Component Editor'}
              </h2>
              {selectedComponent && (
                <div className="flex items-center gap-2">
                  {/* Language Toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    {(['en', 'hi'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLanguage(lang)}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
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
                {/* Active language indicator */}
                <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Editing:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {activeLanguage === 'en' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Localized fields update for the selected language only
                  </span>
                </div>

                {/* Schema-driven fields */}
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {selectedTemplate ? (
                    selectedTemplate.fields.map((fieldDef) => (
                      <div key={fieldDef.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {fieldDef.label}
                          {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
                          {fieldDef.localized && (
                            <span className="ml-2 text-xs text-orange-500 font-normal">
                              🌐 {activeLanguage.toUpperCase()}
                            </span>
                          )}
                        </label>
                        {fieldDef.helpText && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{fieldDef.helpText}</p>
                        )}
                        {renderField(fieldDef)}
                      </div>
                    ))
                  ) : (
                    /* Fallback: render raw fields if no template found */
                    editedFields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {field.key}
                        </label>
                        {field.localizedValue ? (
                          <input
                            type="text"
                            value={field.localizedValue[activeLanguage] || ''}
                            onChange={(e) =>
                              updateFieldValue(field.key, {
                                localizedValue: { ...field.localizedValue!, [activeLanguage]: e.target.value },
                              })
                            }
                            aria-label={`${field.key} (${activeLanguage.toUpperCase()})`}
                            placeholder={field.key}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(field.value ?? '')}
                            onChange={(e) => updateFieldValue(field.key, { value: e.target.value })}
                            aria-label={field.key}
                            placeholder={field.key}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <Button variant="outline" onClick={handleReset} disabled={!hasChanges || saving}>
                    Reset
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={!hasChanges || saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== Add Page Modal ====== */}
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
                  onChange={(e) => {
                    setNewPageTitle((prev) => ({ ...prev, en: e.target.value }));
                    if (!newPageSlug) {
                      setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
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
                  value={newPageTitle.hi || ''}
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
              <Button variant="outline" onClick={() => setShowAddPageModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddPage} disabled={!newPageTitle.en || !newPageSlug || saving}>
                {saving ? 'Creating...' : 'Create Page'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Add Component Modal ====== */}
      {showAddComponentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Component</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Choose a component type to add to &ldquo;{selectedPage?.title.en}&rdquo;
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {templates.filter((t) => !t.isGlobal).map((template) => (
                <button
                  key={template.componentType}
                  onClick={() => handleAddComponent(template)}
                  disabled={saving}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">
                    {template.icon || COMPONENT_TYPE_ICONS[template.componentType] || '📦'}
                  </span>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{template.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowAddComponentModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Media Picker Modal ====== */}
      {showMediaPicker && accessToken && (
        <MediaPickerModal
          accessToken={accessToken}
          onSelect={(url) => {
            if (mediaPickerFieldKey) {
              // Handle array item image fields: __array__<fieldKey>__<idx>__<subKey>
              const arrayMatch = mediaPickerFieldKey.match(/^__array__(.+?)__(\d+)__(.+)$/);
              if (arrayMatch) {
                const [, parentKey, idxStr, subKey] = arrayMatch;
                const idx = parseInt(idxStr, 10);
                // Get current array value for the parent field from editedFields
                const parentField = editedFields.find((f) => f.key === parentKey);
                let items: Record<string, unknown>[] = [];
                try {
                  const raw = parentField?.value;
                  if (Array.isArray(raw)) items = [...raw] as Record<string, unknown>[];
                  else if (typeof raw === 'string') items = JSON.parse(raw);
                } catch { /* keep empty */ }
                if (items[idx]) {
                  items[idx] = { ...items[idx], [subKey]: url };
                  updateFieldValue(parentKey, { value: items });
                }
              } else {
                updateFieldValue(mediaPickerFieldKey, { value: url });
              }
            }
            setShowMediaPicker(false);
            setMediaPickerFieldKey(null);
          }}
          onClose={() => {
            setShowMediaPicker(false);
            setMediaPickerFieldKey(null);
          }}
        />
      )}
    </Container>
  );
}
