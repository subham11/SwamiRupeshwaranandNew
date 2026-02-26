'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import {
  fetchSubscriptionPlans,
  fetchContentByPlan,
  createContentWithFile,
  updateSubscriptionContent,
  deleteSubscriptionContent,
  getContentPresignedUploadUrl,
  ApiSubscriptionPlan,
  SubscriptionContent,
} from '@/lib/api';

type ContentType = 'stotra' | 'kavach' | 'pdf' | 'video' | 'image' | 'guidance';

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  stotra: '📿 Stotra',
  kavach: '🛡️ Kavach',
  pdf: '📄 PDF',
  video: '🎬 Video',
  image: '🖼️ Image',
  guidance: '🙏 Guidance',
};

const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  stotra: 'bg-purple-100 text-purple-800',
  kavach: 'bg-blue-100 text-blue-800',
  pdf: 'bg-gray-100 text-gray-800',
  video: 'bg-red-100 text-red-800',
  image: 'bg-green-100 text-green-800',
  guidance: 'bg-orange-100 text-orange-800',
};

interface ContentFormData {
  planId: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  contentType: ContentType;
  displayOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: ContentFormData = {
  planId: '',
  title: '',
  titleHi: '',
  description: '',
  descriptionHi: '',
  contentType: 'stotra',
  displayOrder: '0',
  isActive: true,
};

export default function AdminContentLibraryPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [plans, setPlans] = useState<ApiSubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [contentItems, setContentItems] = useState<SubscriptionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContentFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // File upload
  const [uploading, setUploading] = useState(false);
  const [uploadedFileKey, setUploadedFileKey] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';

  const loadPlans = useCallback(async () => {
    try {
      const data = await fetchSubscriptionPlans();
      setPlans(data);
      if (data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data[0].id);
      }
    } catch {
      setError('Failed to load plans');
    }
  }, [selectedPlanId]);

  const loadContent = useCallback(async (planId: string) => {
    if (!accessToken || !planId) return;
    setLoadingContent(true);
    try {
      const data = await fetchContentByPlan(planId, accessToken);
      setContentItems(data.items || []);
    } catch {
      setError('Failed to load content');
    } finally {
      setLoadingContent(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadPlans().then(() => setLoading(false));
    }
  }, [isAuthenticated, isAdmin, loadPlans]);

  useEffect(() => {
    if (selectedPlanId && accessToken) {
      loadContent(selectedPlanId);
    }
  }, [selectedPlanId, accessToken, loadContent]);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!accessToken || !e.target.files?.length) return;
    const file = e.target.files[0];

    setUploading(true);
    setError('');
    try {
      // Map content type to S3 category
      const categoryMap: Record<ContentType, string> = {
        stotra: 'stotras',
        kavach: 'kavach',
        pdf: 'pdfs',
        video: 'videos',
        image: 'images',
        guidance: 'pdfs',
      };

      const category = categoryMap[form.contentType] || 'pdfs';
      const result = await getContentPresignedUploadUrl(
        { fileName: file.name, contentType: file.type, category },
        accessToken,
      );

      // Upload file to S3 using presigned URL
      await fetch(result.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      setUploadedFileKey(result.key);
      setUploadedFileName(file.name);
      setSuccess(`File "${file.name}" uploaded successfully`);
    } catch {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    if (!form.title || !form.planId) {
      setError('Title and plan are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateSubscriptionContent(
          editingId,
          {
            title: form.title,
            titleHi: form.titleHi || undefined,
            description: form.description || undefined,
            descriptionHi: form.descriptionHi || undefined,
            contentType: form.contentType,
            displayOrder: parseInt(form.displayOrder) || 0,
            isActive: form.isActive,
            ...(uploadedFileKey ? { fileKey: uploadedFileKey } : {}),
          },
          accessToken,
        );
        setSuccess('Content updated successfully');
      } else {
        await createContentWithFile(
          {
            planId: form.planId,
            title: form.title,
            titleHi: form.titleHi || undefined,
            description: form.description || undefined,
            descriptionHi: form.descriptionHi || undefined,
            contentType: form.contentType,
            fileKey: uploadedFileKey,
            displayOrder: parseInt(form.displayOrder) || 0,
          },
          accessToken,
        );
        setSuccess('Content created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setUploadedFileKey('');
      setUploadedFileName('');
      setForm(EMPTY_FORM);
      loadContent(selectedPlanId);
    } catch {
      setError('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Delete this content item? This cannot be undone.')) return;
    try {
      await deleteSubscriptionContent(id, accessToken);
      setSuccess('Content deleted');
      loadContent(selectedPlanId);
    } catch {
      setError('Failed to delete content');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, planId: selectedPlanId });
    setUploadedFileKey('');
    setUploadedFileName('');
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (item: SubscriptionContent) => {
    setEditingId(item.id);
    setForm({
      planId: item.planId,
      title: item.title,
      titleHi: item.titleHi || '',
      description: item.description || '',
      descriptionHi: item.descriptionHi || '',
      contentType: (item.contentType as ContentType) || 'stotra',
      displayOrder: String(item.displayOrder || 0),
      isActive: item.isActive,
    });
    setUploadedFileKey(item.fileKey || '');
    setUploadedFileName(item.fileKey ? item.fileKey.split('/').pop() || '' : '');
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const filteredContent = contentItems.filter((item) => {
    if (typeFilter !== 'all' && item.contentType !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.titleHi?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (isLoading || loading) {
    return (
      <Container className="py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
        <p className="mt-4 text-gray-600">Loading content library…</p>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">Only admins can manage content.</p>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin" className="hover:text-orange-600">Admin</Link>
            <span>/</span>
            <span className="text-gray-900">Content Library</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-500 mt-1">Upload and manage stotras, kavach, and PDFs for subscription plans</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          + Add Content
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Plan Selector + Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.price}/{p.interval}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content List */}
      {loadingContent ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">No content items yet</p>
          <p className="text-gray-400 text-sm mt-1">Click &quot;Add Content&quot; to upload your first stotra or kavach</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Title</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Order</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">File</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    {item.titleHi && <div className="text-sm text-gray-500">{item.titleHi}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${CONTENT_TYPE_COLORS[item.contentType as ContentType] || 'bg-gray-100'}`}>
                      {CONTENT_TYPE_LABELS[item.contentType as ContentType] || item.contentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.displayOrder || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.fileKey ? (
                      <span className="text-xs text-green-600">✓ Uploaded</span>
                    ) : (
                      <span className="text-xs text-gray-400">No file</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-gray-50 px-4 py-3 text-sm text-gray-500 border-t">
            {filteredContent.length} content item{filteredContent.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Content' : 'Add New Content'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Plan *
                </label>
                <select
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!!editingId}
                >
                  <option value="">Select a plan…</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
                <select
                  value={form.contentType}
                  onChange={(e) => setForm({ ...form, contentType: e.target.value as ContentType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Title EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (English) *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g. Hanuman Kavach"
                />
              </div>

              {/* Title HI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Hindi)</label>
                <input
                  type="text"
                  value={form.titleHi}
                  onChange={(e) => setForm({ ...form, titleHi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g. हनुमान कवच"
                />
              </div>

              {/* Description EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Brief description of this content…"
                />
              </div>

              {/* Description HI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Hindi)</label>
                <textarea
                  value={form.descriptionHi}
                  onChange={(e) => setForm({ ...form, descriptionHi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="विवरण हिंदी में…"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingId ? 'Replace File (optional)' : 'Upload File *'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.webm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading…' : 'Choose File'}
                  </button>
                  {uploadedFileName && (
                    <span className="text-sm text-green-600">✓ {uploadedFileName}</span>
                  )}
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  id="isActive"
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (!editingId && !uploadedFileKey)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
