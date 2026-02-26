'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import {
  fetchSubscriptionPlans,
  fetchMonthlySchedules,
  fetchContentByPlan,
  createMonthlySchedule,
  updateMonthlySchedule,
  deleteMonthlySchedule,
  ApiSubscriptionPlan,
  MonthlySchedule,
  SubscriptionContent,
  ScheduleContentItem,
} from '@/lib/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];

const CONTENT_TYPE_ICONS: Record<string, string> = {
  stotra: '📿',
  kavach: '🛡️',
  pdf: '📄',
  video: '🎬',
  image: '🖼️',
  guidance: '🙏',
};

export default function AdminMonthlySchedulePage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [plans, setPlans] = useState<ApiSubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [schedules, setSchedules] = useState<MonthlySchedule[]>([]);
  const [availableContent, setAvailableContent] = useState<SubscriptionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit modal
  const [showEditor, setShowEditor] = useState(false);
  const [editingMonth, setEditingMonth] = useState<number>(0);
  const [editingSchedule, setEditingSchedule] = useState<MonthlySchedule | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorDescription, setEditorDescription] = useState('');
  const [editorItems, setEditorItems] = useState<ScheduleContentItem[]>([]);
  const [editorPublished, setEditorPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 1);

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

  const loadSchedules = useCallback(async (planId: string) => {
    if (!accessToken || !planId) return;
    setLoadingSchedules(true);
    try {
      const data = await fetchMonthlySchedules(accessToken, planId);
      // Filter by selected year
      const filtered = (data.items || []).filter((s) => s.year === selectedYear);
      setSchedules(filtered);
    } catch {
      setError('Failed to load schedules');
    } finally {
      setLoadingSchedules(false);
    }
  }, [accessToken, selectedYear]);

  const loadContent = useCallback(async (planId: string) => {
    if (!accessToken || !planId) return;
    try {
      const data = await fetchContentByPlan(planId, accessToken);
      setAvailableContent(data.items || []);
    } catch {
      // Content might not exist yet
      setAvailableContent([]);
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
      loadSchedules(selectedPlanId);
      loadContent(selectedPlanId);
    }
  }, [selectedPlanId, selectedYear, accessToken, loadSchedules, loadContent]);

  const getScheduleForMonth = (month: number): MonthlySchedule | undefined => {
    return schedules.find((s) => s.month === month);
  };

  const openMonthEditor = (month: number) => {
    const existing = getScheduleForMonth(month);
    setEditingMonth(month);
    setEditingSchedule(existing || null);
    setEditorTitle(existing?.title || `${MONTHS[month - 1]} ${selectedYear} Content`);
    setEditorDescription(existing?.description || '');
    setEditorItems(existing?.contentItems || []);
    setEditorPublished(existing?.isPublished || false);
    setShowEditor(true);
    setError('');
    setSuccess('');
  };

  const handleAddContentItem = (contentId: string) => {
    if (editorItems.some((i) => i.contentId === contentId)) return;
    setEditorItems([
      ...editorItems,
      { contentId, displayOrder: editorItems.length + 1 },
    ]);
  };

  const handleRemoveContentItem = (contentId: string) => {
    setEditorItems(
      editorItems
        .filter((i) => i.contentId !== contentId)
        .map((i, idx) => ({ ...i, displayOrder: idx + 1 })),
    );
  };

  const handleMoveContentItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...editorItems];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newItems.length) return;
    [newItems[index], newItems[swapIdx]] = [newItems[swapIdx], newItems[index]];
    setEditorItems(newItems.map((i, idx) => ({ ...i, displayOrder: idx + 1 })));
  };

  const handleSaveSchedule = async () => {
    if (!accessToken || !selectedPlanId) return;
    setSaving(true);
    setError('');
    try {
      if (editingSchedule) {
        await updateMonthlySchedule(
          editingSchedule.id,
          {
            title: editorTitle || undefined,
            description: editorDescription || undefined,
            contentItems: editorItems,
            isPublished: editorPublished,
          },
          accessToken,
        );
        setSuccess(`Schedule for ${MONTHS[editingMonth - 1]} updated`);
      } else {
        await createMonthlySchedule(
          {
            planId: selectedPlanId,
            year: selectedYear,
            month: editingMonth,
            title: editorTitle || undefined,
            description: editorDescription || undefined,
            contentItems: editorItems,
            isPublished: editorPublished,
          },
          accessToken,
        );
        setSuccess(`Schedule for ${MONTHS[editingMonth - 1]} created`);
      }
      setShowEditor(false);
      loadSchedules(selectedPlanId);
    } catch {
      setError('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (schedule: MonthlySchedule) => {
    if (!accessToken) return;
    if (!confirm(`Delete schedule for ${MONTHS[schedule.month - 1]} ${schedule.year}?`)) return;
    try {
      await deleteMonthlySchedule(schedule.id, accessToken);
      setSuccess('Schedule deleted');
      loadSchedules(selectedPlanId);
    } catch {
      setError('Failed to delete schedule');
    }
  };

  const getContentById = (contentId: string): SubscriptionContent | undefined => {
    return availableContent.find((c) => c.id === contentId);
  };

  if (isLoading || loading) {
    return (
      <Container className="py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
        <p className="mt-4 text-gray-600">Loading schedule manager…</p>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">Only admins can manage content schedules.</p>
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
            <span className="text-gray-900">Monthly Schedule</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Monthly Content Schedule</h1>
          <p className="text-gray-500 mt-1">
            Assign stotras and kavach to specific months for each subscription plan
          </p>
        </div>
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

      {/* Plan & Year Selectors */}
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
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 pt-5">
            {availableContent.length} content items available in this plan
          </div>
        </div>
      </div>

      {/* Month Grid */}
      {loadingSchedules ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MONTHS.map((monthName, idx) => {
            const monthNum = idx + 1;
            const schedule = getScheduleForMonth(monthNum);
            const contentCount = schedule?.contentItems?.length || 0;

            return (
              <div
                key={monthNum}
                className={`bg-white rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${
                  schedule?.isPublished
                    ? 'border-green-300'
                    : schedule
                    ? 'border-orange-300'
                    : 'border-gray-200'
                }`}
              >
                {/* Month Header */}
                <div
                  className={`px-4 py-3 ${
                    schedule?.isPublished
                      ? 'bg-green-50'
                      : schedule
                      ? 'bg-orange-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{monthName}</h3>
                      <p className="text-xs text-gray-500">{MONTHS_HI[idx]}</p>
                    </div>
                    {schedule?.isPublished && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Published
                      </span>
                    )}
                    {schedule && !schedule.isPublished && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Month Content */}
                <div className="p-4">
                  {schedule ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        {contentCount} content item{contentCount !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-1 mb-3">
                        {schedule.contentItems?.slice(0, 3).map((ci) => {
                          const content = getContentById(ci.contentId);
                          return (
                            <div key={ci.contentId} className="text-xs text-gray-500 flex items-center gap-1 truncate">
                              <span>{CONTENT_TYPE_ICONS[content?.contentType || 'pdf'] || '📄'}</span>
                              <span className="truncate">{content?.title || ci.contentId}</span>
                            </div>
                          );
                        })}
                        {contentCount > 3 && (
                          <p className="text-xs text-gray-400">+{contentCount - 3} more…</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 mb-3">No content scheduled</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openMonthEditor(monthNum)}
                      className="flex-1 text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                    >
                      {schedule ? 'Edit' : '+ Schedule'}
                    </button>
                    {schedule && (
                      <button
                        onClick={() => handleDeleteSchedule(schedule)}
                        className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {MONTHS[editingMonth - 1]} {selectedYear} — Content Schedule
                </h2>
                <p className="text-sm text-gray-500">
                  Plan: {plans.find((p) => p.id === selectedPlanId)?.name || selectedPlanId}
                </p>
              </div>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Schedule Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. January 2026 – Protection Mantras"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editorDescription}
                    onChange={(e) => setEditorDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Brief description for subscribers…"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editorPublished}
                    onChange={(e) => setEditorPublished(e.target.checked)}
                    id="isPublished"
                    className="rounded"
                  />
                  <label htmlFor="isPublished" className="text-sm text-gray-700">
                    Published (visible to subscribers)
                  </label>
                </div>

                {/* Selected Content */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Scheduled Content ({editorItems.length})
                  </h3>
                  {editorItems.length === 0 ? (
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3">
                      No content added yet. Select from the library on the right →
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {editorItems.map((item, idx) => {
                        const content = getContentById(item.contentId);
                        return (
                          <div
                            key={item.contentId}
                            className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg"
                          >
                            <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                            <span>{CONTENT_TYPE_ICONS[content?.contentType || 'pdf'] || '📄'}</span>
                            <span className="flex-1 text-sm text-gray-900 truncate">
                              {content?.title || item.contentId}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleMoveContentItem(idx, 'up')}
                                disabled={idx === 0}
                                className="text-xs px-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => handleMoveContentItem(idx, 'down')}
                                disabled={idx === editorItems.length - 1}
                                className="text-xs px-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => handleRemoveContentItem(item.contentId)}
                                className="text-xs px-1 text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Content Library */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Available Content Library ({availableContent.length})
                </h3>
                {availableContent.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">No content uploaded for this plan yet.</p>
                    <Link
                      href="/admin/content-library"
                      className="text-sm text-orange-600 hover:text-orange-700 mt-2 inline-block"
                    >
                      Go to Content Library →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {availableContent.map((content) => {
                      const isSelected = editorItems.some((i) => i.contentId === content.id);
                      return (
                        <div
                          key={content.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                            isSelected
                              ? 'bg-green-50 border-green-300 opacity-60'
                              : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                          onClick={() => !isSelected && handleAddContentItem(content.id)}
                        >
                          <span>{CONTENT_TYPE_ICONS[content.contentType] || '📄'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{content.title}</p>
                            {content.titleHi && (
                              <p className="text-xs text-gray-500 truncate">{content.titleHi}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 capitalize">{content.contentType}</span>
                          {isSelected ? (
                            <span className="text-xs text-green-600">✓ Added</span>
                          ) : (
                            <span className="text-xs text-orange-600">+ Add</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={saving}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
