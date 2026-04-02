'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import {
  fetchAllReviewsAdmin,
  approveProductReview,
  deleteProductReview,
  ProductReview,
} from '@/lib/api';

// ============================================
// Types & Constants
// ============================================

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// ============================================
// Helpers
// ============================================

function getReviewStatus(review: ProductReview): 'pending' | 'approved' | 'rejected' {
  if (review.isApproved === true) return 'approved';
  if (review.isApproved === false && review.updatedAt !== review.createdAt) return 'rejected';
  return 'pending';
}

function renderStars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

// ============================================
// Main Component
// ============================================

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  // Data state
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Expanded review
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Detail modal
  const [modalReview, setModalReview] = useState<ProductReview | null>(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editReviewTextHi, setEditReviewTextHi] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  // ============================================
  // Load Data
  // ============================================

  const loadReviews = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await fetchAllReviewsAdmin(accessToken, 200);
      setReviews(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) {
      loadReviews();
    }
  }, [isAuthenticated, isAdmin, accessToken, loadReviews]);

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Auto-dismiss error
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ============================================
  // Filtered reviews
  // ============================================

  const filteredReviews = filterStatus === 'all'
    ? reviews
    : reviews.filter((r) => getReviewStatus(r) === filterStatus);

  // ============================================
  // Stats
  // ============================================

  const pendingCount = reviews.filter((r) => getReviewStatus(r) === 'pending').length;
  const approvedCount = reviews.filter((r) => getReviewStatus(r) === 'approved').length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // ============================================
  // Actions
  // ============================================

  const handleApprove = async (reviewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!accessToken) return;
    try {
      setSaving(true);
      await approveProductReview(reviewId, { isApproved: true }, accessToken);
      setSuccess('Review approved successfully');
      loadReviews();
    } catch {
      setError('Failed to approve review');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (reviewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!accessToken) return;
    try {
      setSaving(true);
      await approveProductReview(reviewId, { isApproved: false }, accessToken);
      setSuccess('Review rejected');
      loadReviews();
    } catch {
      setError('Failed to reject review');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!accessToken) return;
    try {
      setDeleting(true);
      await deleteProductReview(reviewId, accessToken);
      setSuccess('Review deleted successfully');
      setDeleteConfirmId(null);
      if (modalReview?.id === reviewId) setModalReview(null);
      loadReviews();
    } catch {
      setError('Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  const openModal = (review: ProductReview) => {
    setModalReview(review);
    setEditReviewText(review.reviewText || '');
    setEditReviewTextHi(review.reviewTextHi || '');
  };

  const handleModalSave = async (isApproved: boolean) => {
    if (!modalReview || !accessToken) return;
    try {
      setSaving(true);
      await approveProductReview(
        modalReview.id,
        {
          isApproved,
          reviewText: editReviewText || undefined,
          reviewTextHi: editReviewTextHi || undefined,
        },
        accessToken,
      );
      setSuccess(`Review ${isApproved ? 'approved' : 'rejected'} successfully`);
      setModalReview(null);
      loadReviews();
    } catch {
      setError('Failed to update review');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Auth guard
  // ============================================

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Container className="py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You do not have permission to view this page.</p>
        </div>
      </Container>
    );
  }

  // ============================================
  // Main Render
  // ============================================

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reviews Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Review and moderate customer product reviews</p>
        </div>
        <button
          onClick={loadReviews}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{reviews.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {avgRating} <span className="text-lg text-orange-400">★</span>
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === tab.value
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({reviews.filter((r) => getReviewStatus(r) === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No reviews found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Reviewer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Rating</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Review</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => {
                  const status = getReviewStatus(review);
                  const isExpanded = expandedReviewId === review.id;
                  return (
                    <ReviewRow
                      key={review.id}
                      review={review}
                      status={status}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedReviewId(isExpanded ? null : review.id)}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onOpenModal={openModal}
                      onDelete={(id, e) => { e.stopPropagation(); setDeleteConfirmId(id); }}
                      saving={saving}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {filteredReviews.map((review) => {
              const status = getReviewStatus(review);
              return (
                <div key={review.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {review.productTitle || review.productId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{review.userEmail}</p>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status]}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500 text-sm tracking-wide">{renderStars(review.rating)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.reviewText && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {truncateText(review.reviewText, 120)}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    {status !== 'approved' && (
                      <button
                        onClick={(e) => handleApprove(review.id, e)}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button
                        onClick={(e) => handleReject(review.id, e)}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => openModal(review)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/40 transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(review.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail / Edit Modal */}
      {modalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Details</h3>
              <button
                onClick={() => setModalReview(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Review Meta */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Product</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {modalReview.productTitle || modalReview.productId.slice(0, 12)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Reviewer</span>
                <span className="text-gray-900 dark:text-white">{modalReview.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Rating</span>
                <span className="text-orange-500">{renderStars(modalReview.rating)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[getReviewStatus(modalReview)]}`}>
                  {getReviewStatus(modalReview)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Date</span>
                <span className="text-gray-900 dark:text-white">{formatDate(modalReview.createdAt)}</span>
              </div>
            </div>

            {/* Editable Review Text (English) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Review Text (English)
              </label>
              <textarea
                value={editReviewText}
                onChange={(e) => setEditReviewText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="No review text"
              />
            </div>

            {/* Editable Review Text (Hindi) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Review Text (Hindi)
              </label>
              <textarea
                value={editReviewTextHi}
                onChange={(e) => setEditReviewTextHi(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="No Hindi review text"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-between">
              <button
                onClick={() => { setDeleteConfirmId(modalReview.id); }}
                className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
              >
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => handleModalSave(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleModalSave(true)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Review</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to permanently delete this review? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

// ============================================
// Review Row Component (Desktop Table)
// ============================================

function ReviewRow({
  review,
  status,
  isExpanded,
  onToggle,
  onApprove,
  onReject,
  onOpenModal,
  onDelete,
  saving,
}: {
  review: ProductReview;
  status: string;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: (id: string, e: React.MouseEvent) => void;
  onReject: (id: string, e: React.MouseEvent) => void;
  onOpenModal: (review: ProductReview) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  saving: boolean;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3">
          <div className="text-gray-900 dark:text-white text-sm font-medium max-w-[180px] truncate">
            {review.productTitle || review.productId.slice(0, 12)}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-gray-700 dark:text-gray-300 text-sm max-w-[180px] truncate">{review.userEmail}</div>
        </td>
        <td className="px-4 py-3">
          <span className="text-orange-500 text-sm tracking-wide whitespace-nowrap">{renderStars(review.rating)}</span>
        </td>
        <td className="px-4 py-3">
          <p className="text-gray-700 dark:text-gray-300 text-sm max-w-[250px] truncate">
            {review.reviewText ? truncateText(review.reviewText, 80) : <span className="italic text-gray-400">No text</span>}
          </p>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status]}`}>
            {status}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">
          {formatDate(review.createdAt)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {status !== 'approved' && (
              <button
                onClick={(e) => onApprove(review.id, e)}
                disabled={saving}
                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium disabled:opacity-50 transition-colors"
                title="Approve"
              >
                Approve
              </button>
            )}
            {status !== 'rejected' && (
              <button
                onClick={(e) => onReject(review.id, e)}
                disabled={saving}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50 transition-colors"
                title="Reject"
              >
                Reject
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onOpenModal(review); }}
              className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium transition-colors"
              title="View Details"
            >
              Edit
            </button>
            <button
              onClick={(e) => onDelete(review.id, e)}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Row */}
      {isExpanded && (
        <tr className="bg-gray-50 dark:bg-gray-700/20">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Review Text (English)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {review.reviewText || <span className="italic text-gray-400">No English review text</span>}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Review Text (Hindi)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {review.reviewTextHi || <span className="italic text-gray-400">No Hindi review text</span>}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
