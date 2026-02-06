'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import {
  fetchAllTickets,
  fetchSupportStats,
  fetchTicketWithReplies,
  createTicketReply,
  updateTicketStatus,
  deleteSupportTicket,
  SupportTicket,
  SupportStats,
  TicketReply,
} from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  waiting_for_user: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  subscription: 'Subscription',
  donation: 'Donation',
  event: 'Event',
  technical: 'Technical',
  spiritual_guidance: 'Spiritual Guidance',
  feedback: 'Feedback',
  other: 'Other',
};

export default function AdminSupportPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Ticket detail
  const [selectedTicket, setSelectedTicket] = useState<(SupportTicket & { replies: TicketReply[] }) | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Reply form
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';
  const canDelete = user?.role === 'super_admin' || user?.role === 'admin';

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [ticketList, supportStats] = await Promise.all([
        fetchAllTickets(accessToken).catch(() => []),
        fetchSupportStats(accessToken).catch(() => null),
      ]);
      setTickets(Array.isArray(ticketList) ? ticketList : []);
      setStats(supportStats);
    } catch {
      setError('Failed to load support data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin/support');
    } else if (!isLoading && isAuthenticated && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) {
      loadData();
    }
  }, [isAuthenticated, isAdmin, accessToken, loadData]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 5000); return () => clearTimeout(t); }
  }, [success]);

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  const openTicketDetail = async (ticketId: string) => {
    if (!accessToken) return;
    setLoadingTicket(true);
    try {
      const detail = await fetchTicketWithReplies(ticketId, accessToken);
      setSelectedTicket(detail);
      setReplyMessage('');
      setIsInternalNote(false);
    } catch {
      setError('Failed to load ticket details');
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedTicket || !replyMessage.trim()) return;
    setSending(true);
    try {
      await createTicketReply(selectedTicket.id, replyMessage, isInternalNote, accessToken);
      setSuccess('Reply sent successfully');
      setReplyMessage('');
      // Refresh ticket detail
      const updated = await fetchTicketWithReplies(selectedTicket.id, accessToken);
      setSelectedTicket(updated);
      loadData();
    } catch {
      setError('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    if (!accessToken) return;
    try {
      await updateTicketStatus(ticketId, newStatus, accessToken);
      setSuccess('Status updated');
      loadData();
      if (selectedTicket?.id === ticketId) {
        const updated = await fetchTicketWithReplies(ticketId, accessToken);
        setSelectedTicket(updated);
      }
    } catch {
      setError('Failed to update status');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!accessToken || !confirm('Delete this ticket permanently?')) return;
    try {
      await deleteSupportTicket(ticketId, accessToken);
      setSuccess('Ticket deleted');
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
      loadData();
    } catch {
      setError('Failed to delete ticket');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  if (isLoading || loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-[70vh] py-8 bg-gradient-to-b from-amber-50/30 to-white dark:from-gray-900 dark:to-gray-800">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-sm text-orange-600 hover:text-orange-700">← Admin</Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage user queries, issues, and support requests</p>
        </div>

        {/* Messages */}
        {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">{error}</div>}
        {success && <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">{success}</div>}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Tickets', value: stats.totalTickets, color: '' },
              { label: 'Open', value: stats.openTickets, color: 'text-blue-600' },
              { label: 'In Progress', value: stats.inProgressTickets, color: 'text-yellow-600' },
              { label: 'Resolved', value: stats.resolvedTickets, color: 'text-green-600' },
              { label: 'This Week', value: stats.ticketsThisWeek, color: '' },
              { label: 'Last Week', value: stats.ticketsLastWeek, color: '' },
              { label: 'Avg Resolution', value: `${stats.averageResolutionTime}h`, color: '' },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className={`text-2xl font-bold ${s.color || 'text-gray-900 dark:text-white'}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket List */}
          <div className="lg:col-span-1">
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                title="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_for_user">Waiting</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                title="Filter by category"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
                  No tickets found
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => openTicketDetail(ticket.id)}
                    className={`w-full text-left p-4 rounded-xl shadow-sm border transition-all ${
                      selectedTicket?.id === ticket.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{ticket.ticketNumber}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">
                      {ticket.subject}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] || ''}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
                      <span>{ticket.userName || ticket.userEmail}</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ticket Detail */}
          <div className="lg:col-span-2">
            {loadingTicket ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : selectedTicket ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Ticket Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{selectedTicket.ticketNumber}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[selectedTicket.priority] || ''}`}>
                          {selectedTicket.priority}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        By {selectedTicket.userName || selectedTicket.userEmail} • {new Date(selectedTicket.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer ${STATUS_COLORS[selectedTicket.status] || ''}`}
                        title="Change ticket status"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_for_user">Waiting for User</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteTicket(selectedTicket.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Original Message */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {/* Replies */}
                <div className="max-h-[40vh] overflow-y-auto">
                  {selectedTicket.replies?.length > 0 ? (
                    selectedTicket.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 ${
                          reply.isInternal
                            ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-400'
                            : reply.isAdminReply
                            ? 'bg-blue-50 dark:bg-blue-900/10'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {reply.repliedByName || (reply.isAdminReply ? 'Admin' : 'User')}
                          </span>
                          {reply.isInternal && (
                            <span className="text-[10px] px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full">Internal Note</span>
                          )}
                          {reply.isAdminReply && !reply.isInternal && (
                            <span className="text-[10px] px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">Admin Reply</span>
                          )}
                          <span className="text-[10px] text-gray-400 ml-auto">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-400">No replies yet</div>
                  )}
                </div>

                {/* Reply Form */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <form onSubmit={handleReply}>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={3}
                      required
                      placeholder="Type your reply..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 mb-3"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Internal note (not visible to user)</span>
                      </label>
                      <Button type="submit" disabled={sending || !replyMessage.trim()}>
                        {sending ? 'Sending...' : 'Send Reply'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-700">
                <span className="text-4xl mb-4 block">🎫</span>
                <p className="text-gray-500 dark:text-gray-400">Select a ticket to view details and reply</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
